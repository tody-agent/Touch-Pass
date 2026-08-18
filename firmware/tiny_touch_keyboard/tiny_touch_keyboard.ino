#include <Arduino.h>
#include "USB.h"
#include "USBHIDKeyboard.h"
#include "mbedtls/aes.h"
#include "mbedtls/md.h"
#include "esp_system.h"
#include "action_protocol.h"
#include "secrets.h"

#if !ARDUINO_USB_MODE && !ARDUINO_USB_CDC_ON_BOOT
USBCDC USBSerial;
#define Serial USBSerial
#endif

static const uint32_t UART_BAUD = 57600;
static const int FP_TX_PIN = 43;
static const int FP_RX_PIN = 44;
static const int FP_INT_PIN = 2;
static const int INT_ACTIVE_VALUE = 1;
static const bool USE_INT_PIN = true;
static const uint16_t START_SLOT = 1;
static const uint16_t END_SLOT = 10;
static const uint32_t RESULT_HOLD_MS = 500;
static const uint32_t HELPER_TIMEOUT_MS = 6000;
static const bool ENABLE_TEST_COMMANDS = true;
static const bool DEBUG_FP_PACKETS = true;

static const uint8_t FP_LED_GREEN = 0x02;
static const uint8_t FP_LED_WHITE = 0x07;
static const uint8_t FP_LED_RED = 0x04;
static const uint8_t FP_LED_PURPLE = 0x03;
static const uint8_t FP_LED_FUNC_STEADY = 3;

USBHIDKeyboard Keyboard;
HardwareSerial Finger(1);
uint8_t currentLed = 0xff;
uint32_t eventCounter = 0;
uint8_t lastScanStatus = 0;
String serialCommand;
String adminCancelInput;
bool adminWasCancelled = false;
uint32_t configAuthorizedUntil = 0;

static int hexVal(char c) {
  if (c >= '0' && c <= '9') return c - '0';
  if (c >= 'a' && c <= 'f') return c - 'a' + 10;
  if (c >= 'A' && c <= 'F') return c - 'A' + 10;
  return -1;
}

static bool fromHex(const String &hex, uint8_t *out, size_t outLen) {
  if (hex.length() != outLen * 2) return false;
  for (size_t i = 0; i < outLen; i++) {
    int hi = hexVal(hex[i * 2]);
    int lo = hexVal(hex[i * 2 + 1]);
    if (hi < 0 || lo < 0) return false;
    out[i] = (uint8_t)((hi << 4) | lo);
  }
  return true;
}

static String toHex(const uint8_t *data, size_t len) {
  static const char *digits = "0123456789abcdef";
  String s;
  s.reserve(len * 2);
  for (size_t i = 0; i < len; i++) {
    s += digits[data[i] >> 4];
    s += digits[data[i] & 0x0f];
  }
  return s;
}

static void secureWipe(uint8_t *data, size_t len) {
  volatile uint8_t *p = data;
  while (len--) *p++ = 0;
}

static void hmacSha256(const uint8_t *key, size_t keyLen, const uint8_t *data, size_t dataLen, uint8_t out[32]) {
  const mbedtls_md_info_t *info = mbedtls_md_info_from_type(MBEDTLS_MD_SHA256);
  mbedtls_md_hmac(info, key, keyLen, data, dataLen, out);
}

static String hmacHex(const String &message) {
  uint8_t mac[32];
  hmacSha256(PAIRING_KEY, sizeof(PAIRING_KEY), (const uint8_t *)message.c_str(), message.length(), mac);
  String out = toHex(mac, sizeof(mac));
  secureWipe(mac, sizeof(mac));
  return out;
}

static void deriveSessionKey(const String &nonceHex, uint8_t key[32]) {
  String material = "SESSION|" + nonceHex;
  hmacSha256(PAIRING_KEY, sizeof(PAIRING_KEY), (const uint8_t *)material.c_str(), material.length(), key);
}

static bool randomBytes(uint8_t *out, size_t len) {
  esp_fill_random(out, len);
  return true;
}

static uint16_t fpChecksum(uint8_t packetId, const uint8_t *payload, size_t payloadLen) {
  uint16_t length = payloadLen + 2;
  uint32_t total = packetId + (length >> 8) + (length & 0xff);
  for (size_t i = 0; i < payloadLen; i++) total += payload[i];
  return (uint16_t)total;
}

static bool fpCommand(uint8_t instruction, const uint8_t *params, size_t paramLen,
                      uint8_t *confirm, uint8_t *data, size_t *dataLen, uint32_t timeoutMs) {
  while (Finger.available()) Finger.read();
  size_t dataCapacity = (data && dataLen) ? *dataLen : 0;
  if (data && dataLen) *dataLen = 0;

  uint8_t payload[32];
  if (paramLen + 1 > sizeof(payload)) return false;
  payload[0] = instruction;
  if (paramLen) memcpy(payload + 1, params, paramLen);
  size_t payloadLen = paramLen + 1;
  uint16_t length = payloadLen + 2;
  uint16_t sum = fpChecksum(0x01, payload, payloadLen);

  uint8_t header[] = {0xef, 0x01, 0xff, 0xff, 0xff, 0xff, 0x01,
                      (uint8_t)(length >> 8), (uint8_t)(length & 0xff)};
  Finger.write(header, sizeof(header));
  Finger.write(payload, payloadLen);
  Finger.write((uint8_t)(sum >> 8));
  Finger.write((uint8_t)(sum & 0xff));

  uint8_t response[96];
  size_t pos = 0;
  uint32_t start = millis();
  while (millis() - start < timeoutMs) {
    while (Finger.available() && pos < sizeof(response)) {
      response[pos++] = (uint8_t)Finger.read();
      while (pos >= 2 && !(response[0] == 0xef && response[1] == 0x01)) {
        memmove(response, response + 1, --pos);
      }
      if (pos >= 9 && response[0] == 0xef && response[1] == 0x01) {
        uint8_t packetId = response[6];
        uint16_t respLen = ((uint16_t)response[7] << 8) | response[8];
        size_t expected = 9 + respLen;
        if (respLen < 3 || expected > sizeof(response)) {
          if (DEBUG_FP_PACKETS) {
            Serial.printf("FP_BAD_LENGTH ins=%02x pos=%u len=%u raw=%s\n",
                          instruction, (unsigned)pos, respLen,
                          toHex(response, pos).c_str());
            Serial.flush();
          }
          return false;
        }
        if (pos < expected) continue;
        if (packetId != 0x07) {
          if (DEBUG_FP_PACKETS) {
            Serial.printf("FP_BAD_PACKET ins=%02x packet=%02x raw=%s\n",
                          instruction, packetId,
                          toHex(response, expected).c_str());
            Serial.flush();
          }
          return false;
        }

        size_t payloadLen = respLen - 2;
        uint16_t receivedChecksum = ((uint16_t)response[expected - 2] << 8) |
                                    response[expected - 1];
        uint16_t calculatedChecksum = fpChecksum(packetId, response + 9, payloadLen);
        if (calculatedChecksum != receivedChecksum) {
          if (DEBUG_FP_PACKETS) {
            Serial.printf("FP_BAD_CHECKSUM ins=%02x calc=%04x got=%04x raw=%s\n",
                          instruction, calculatedChecksum, receivedChecksum,
                          toHex(response, expected).c_str());
            Serial.flush();
          }
          return false;
        }

        *confirm = response[9];
        size_t actualDataLen = respLen - 3;
        if (DEBUG_FP_PACKETS) {
          Serial.printf("FP_ACK %02x len=%u confirm=%u data=%s\n",
                        instruction, actualDataLen, *confirm,
                        actualDataLen ? toHex(response + 10, actualDataLen).c_str() : "-");
          Serial.flush();
        }
        if (data && dataLen) {
          size_t copyLen = actualDataLen < dataCapacity ? actualDataLen : dataCapacity;
          if (copyLen) memcpy(data, response + 10, copyLen);
          *dataLen = copyLen;
        }
        return true;
      }
    }
    delay(5);
  }
  if (DEBUG_FP_PACKETS) {
    Serial.printf("FP_TIMEOUT ins=%02x pos=%u raw=%s\n", instruction,
                  (unsigned)pos, pos ? toHex(response, pos).c_str() : "-");
    Serial.flush();
  }
  return false;
}

static void setAura(uint8_t color) {
  if (color == currentLed) return;
  uint8_t params[] = {FP_LED_FUNC_STEADY, color, color, 0};
  uint8_t confirm = 0xff;
  fpCommand(0x3c, params, sizeof(params), &confirm, nullptr, nullptr, 1000);
  currentLed = color;
}

static bool fingerPresent() {
  if (!USE_INT_PIN) return true;
  return digitalRead(FP_INT_PIN) == INT_ACTIVE_VALUE;
}

static bool verifySensor() {
  uint8_t params[] = {0x00, 0x00, 0x00, 0x00};
  uint8_t confirm = 0xff;
  return fpCommand(0x13, params, sizeof(params), &confirm, nullptr, nullptr, 2000) && confirm == 0x00;
}

static bool pollAdminCancel(const String &jobId) {
  if (!jobId.length()) return false;
  while (Serial.available()) {
    char c = (char)Serial.read();
    if (c == '\r') continue;
    if (c == '\n') {
      adminCancelInput.trim();
      bool cancelled = adminCancelInput == "ADMIN CANCEL " + jobId;
      adminCancelInput = "";
      if (cancelled) {
        adminWasCancelled = true;
        return true;
      }
    } else if (adminCancelInput.length() < 96) {
      adminCancelInput += c;
    }
  }
  return false;
}

static bool waitForImageState(bool present, uint32_t timeoutMs, const String &jobId = "") {
  uint32_t start = millis();
  while (millis() - start < timeoutMs) {
    if (pollAdminCancel(jobId)) return false;
    uint8_t confirm = 0xff;
    if (!fpCommand(0x01, nullptr, 0, &confirm, nullptr, nullptr, 750)) return false;
    if ((present && confirm == 0x00) || (!present && confirm == 0x02)) return true;
    if (confirm != 0x00 && confirm != 0x02) return false;
    delay(100);
  }
  return false;
}

static bool convertImage(uint8_t bufferId) {
  uint8_t confirm = 0xff;
  uint8_t params[] = {bufferId};
  return fpCommand(0x02, params, sizeof(params), &confirm, nullptr, nullptr, 2000) && confirm == 0x00;
}

static bool enrollFingerprint(uint16_t slot, const String &jobId = "") {
  if (slot < START_SLOT || slot > END_SLOT) return false;
  if (jobId.length()) adminWasCancelled = false;
  setAura(FP_LED_WHITE);
  if (jobId.length()) Serial.printf("ADMIN %s PLACE_FIRST\n", jobId.c_str());
  else Serial.println("PROMPT TOUCH");
  Serial.flush();
  if (!waitForImageState(true, 15000, jobId) || !convertImage(1)) return false;

  if (jobId.length()) Serial.printf("ADMIN %s REMOVE\n", jobId.c_str());
  else Serial.println("PROMPT LIFT");
  Serial.flush();
  if (!waitForImageState(false, 10000, jobId)) return false;
  delay(250);

  if (jobId.length()) Serial.printf("ADMIN %s PLACE_SECOND\n", jobId.c_str());
  else Serial.println("PROMPT TOUCH_AGAIN");
  Serial.flush();
  if (!waitForImageState(true, 15000, jobId) || !convertImage(2)) return false;

  uint8_t confirm = 0xff;
  if (!fpCommand(0x05, nullptr, 0, &confirm, nullptr, nullptr, 2000) || confirm != 0x00) return false;
  uint8_t store[] = {0x01, (uint8_t)(slot >> 8), (uint8_t)(slot & 0xff)};
  return fpCommand(0x06, store, sizeof(store), &confirm, nullptr, nullptr, 2000) && confirm == 0x00;
}

static bool deleteFingerprint(uint16_t slot) {
  if (slot < START_SLOT || slot > END_SLOT) return false;
  uint8_t params[] = {(uint8_t)(slot >> 8), (uint8_t)slot, 0x00, 0x01};
  uint8_t confirm = 0xff;
  if (!fpCommand(0x0c, params, sizeof(params), &confirm, nullptr, nullptr, 2000)) return false;
  return confirm == 0x00 || confirm == 0x07;
}

static bool deleteAllFingerprints() {
  uint8_t confirm = 0xff;
  return fpCommand(0x0d, nullptr, 0, &confirm, nullptr, nullptr, 2000) && confirm == 0x00;
}

static int fingerprintCountFromStorageMap() {
  uint8_t confirm = 0xff;
  uint8_t page[] = {0x00};
  uint8_t storageMap[32] = {0};
  size_t dataLen = sizeof(storageMap);
  if (!fpCommand(0x1f, page, sizeof(page), &confirm, storageMap, &dataLen, 2000) ||
      confirm != 0x00) return -1;

  size_t bytesNeeded = (END_SLOT / 8) + 1;
  if (dataLen < bytesNeeded) return -1;

  int count = 0;
  for (uint16_t slot = START_SLOT; slot <= END_SLOT; slot++) {
    if (storageMap[slot / 8] & (1U << (slot % 8))) count++;
  }
  return count;
}

static int fingerprintCount() {
  uint8_t confirm = 0xff;
  uint8_t data[2];
  size_t dataLen = sizeof(data);
  if (!fpCommand(0x1d, nullptr, 0, &confirm, data, &dataLen, 2000) ||
      confirm != 0x00) return -1;
  if (dataLen == sizeof(data)) return ((int)data[0] << 8) | data[1];
  return fingerprintCountFromStorageMap();
}

static bool scanMatch(uint16_t *matchId, uint16_t *score) {
  lastScanStatus = 0;
  setAura(FP_LED_WHITE);
  uint8_t confirm = 0xff;
  if (!fpCommand(0x01, nullptr, 0, &confirm, nullptr, nullptr, 1000) || confirm != 0x00) {
    if (USE_INT_PIN) {
      Serial.printf("GENIMG_FAIL %u\n", confirm);
      Serial.flush();
    }
    return false;
  }
  lastScanStatus = 2;

  setAura(FP_LED_WHITE);
  uint8_t img2tz[] = {0x01};
  if (!fpCommand(0x02, img2tz, sizeof(img2tz), &confirm, nullptr, nullptr, 2000) || confirm != 0x00) {
    Serial.printf("IMG2TZ_FAIL %u\n", confirm);
    Serial.flush();
    return false;
  }

  uint16_t count = END_SLOT - START_SLOT + 1;
  uint8_t searchParams[] = {
    0x01,
    (uint8_t)(START_SLOT >> 8), (uint8_t)(START_SLOT & 0xff),
    (uint8_t)(count >> 8), (uint8_t)(count & 0xff)
  };
  uint8_t searchData[4];
  size_t searchLen = sizeof(searchData);
  confirm = 0xff;
  if (fpCommand(0x04, searchParams, sizeof(searchParams), &confirm, searchData, &searchLen, 2000)) {
    if (confirm == 0x00 && searchLen == sizeof(searchData)) {
      uint16_t searchScore = ((uint16_t)searchData[2] << 8) | searchData[3];
      if (searchScore > 0) {
        *matchId = ((uint16_t)searchData[0] << 8) | searchData[1];
        *score = searchScore;
        lastScanStatus = 1;
        return true;
      }
    }
    Serial.printf("SEARCH_FAIL %u %u\n", confirm, searchLen);
    Serial.flush();
  } else {
    Serial.println("SEARCH_CMD_FAIL");
    Serial.flush();
  }

  for (uint16_t slot = START_SLOT; slot <= END_SLOT; slot++) {
    uint8_t loadParams[] = {0x02, (uint8_t)(slot >> 8), (uint8_t)(slot & 0xff)};
    confirm = 0xff;
    if (!fpCommand(0x07, loadParams, sizeof(loadParams), &confirm, nullptr, nullptr, 1000) ||
        confirm != 0x00) {
      Serial.printf("LOAD_FAIL %u %u\n", slot, confirm);
      Serial.flush();
      continue;
    }

    uint8_t data[2];
    size_t dataLen = sizeof(data);
    confirm = 0xff;
    if (!fpCommand(0x03, nullptr, 0, &confirm, data, &dataLen, 1000)) {
      Serial.printf("MATCH_CMD_FAIL %u\n", slot);
      Serial.flush();
      continue;
    }
    if (confirm == 0x00 && dataLen == sizeof(data)) {
      uint16_t matchScore = ((uint16_t)data[0] << 8) | data[1];
      if (matchScore > 0) {
        *matchId = slot;
        *score = matchScore;
        lastScanStatus = 1;
        return true;
      }
    }
    Serial.printf("MATCH_FAIL %u %u %u\n", slot, confirm, dataLen);
    Serial.flush();
  }
  Serial.println("MATCH_LOOP_NO_HIT");
  Serial.flush();
  return false;
}

static bool configAuthorized() {
  return configAuthorizedUntil != 0 &&
         (int32_t)(configAuthorizedUntil - millis()) > 0;
}

static void authorizeConfig() {
  configAuthorizedUntil = millis() + 120000UL;
}

static bool requireConfigAuthorization() {
  if (configAuthorized()) return true;
  Serial.println("ERR CONFIG_LOCKED run=CONFIG_UNLOCK");
  return false;
}

static bool authorizeWithFingerprint() {
  if (!waitForImageState(true, 15000)) return false;
  uint16_t matchId = 0;
  uint16_t score = 0;
  if (!scanMatch(&matchId, &score)) return false;
  Serial.println("PROMPT LIFT");
  return waitForImageState(false, 10000);
}

static bool parseToken(const String &line, int index, String *token) {
  int start = 0;
  int current = 0;
  while (start < (int)line.length()) {
    int end = line.indexOf(' ', start);
    if (end < 0) end = line.length();
    if (current == index) {
      *token = line.substring(start, end);
      return true;
    }
    current++;
    start = end + 1;
  }
  return false;
}

static bool readHelperLine(String *line, uint32_t timeoutMs) {
  line->remove(0);
  uint32_t start = millis();
  while (millis() - start < timeoutMs) {
    while (Serial.available()) {
      char c = (char)Serial.read();
      if (c == '\n') {
        line->trim();
        return line->length() > 0;
      }
      if (c != '\r' && line->length() < 800) *line += c;
    }
    delay(5);
  }
  return false;
}

static bool decryptAction(const String &nonceHex, const String &line, uint8_t *action, size_t *actionLen) {
  String kind, nonce, ivHex, ctHex, macHex;
  if (!parseToken(line, 0, &kind) || !parseToken(line, 1, &nonce) ||
      !parseToken(line, 2, &ivHex) || !parseToken(line, 3, &ctHex) ||
      !parseToken(line, 4, &macHex)) return false;
  if (kind != "ACT" || nonce != nonceHex) return false;
  String expected = hmacHex("ACT|" + nonce + "|" + ivHex + "|" + ctHex);
  if (!expected.equalsIgnoreCase(macHex)) return false;
  if ((ctHex.length() % 2) != 0 || ctHex.length() / 2 > *actionLen) return false;

  uint8_t iv[16];
  if (!fromHex(ivHex, iv, sizeof(iv))) return false;
  size_t ctLen = ctHex.length() / 2;
  uint8_t ciphertext[256];
  if (ctLen > sizeof(ciphertext) || !fromHex(ctHex, ciphertext, ctLen)) return false;

  uint8_t key[32];
  deriveSessionKey(nonce, key);
  mbedtls_aes_context aes;
  mbedtls_aes_init(&aes);
  mbedtls_aes_setkey_enc(&aes, key, 256);
  size_t ncOff = 0;
  uint8_t streamBlock[16] = {0};
  int rc = mbedtls_aes_crypt_ctr(&aes, ctLen, &ncOff, iv, streamBlock, ciphertext, action);
  mbedtls_aes_free(&aes);
  secureWipe(key, sizeof(key));
  secureWipe(ciphertext, sizeof(ciphertext));
  secureWipe(streamBlock, sizeof(streamBlock));
  if (rc != 0) return false;
  *actionLen = ctLen;
  return true;
}

static bool actionText(void *, const uint8_t *data, size_t len) {
  for (size_t i = 0; i < len; i++) Keyboard.write(data[i]);
  return true;
}

static uint8_t actionKeyCode(uint8_t keyCode) {
  switch (keyCode) {
    case 1: return KEY_RETURN;
    case 2: return KEY_ESC;
    case 3: return KEY_TAB;
    case 4: return ' ';
    case 5: return KEY_UP_ARROW;
    case 6: return KEY_DOWN_ARROW;
    case 7: return KEY_LEFT_ARROW;
    case 8: return KEY_RIGHT_ARROW;
    default: return 0;
  }
}

static bool actionKey(void *, uint8_t modifiers, uint8_t keyCode) {
  uint8_t key = actionKeyCode(keyCode);
  if (!key) return false;
  if (modifiers & 0x01) Keyboard.press(KEY_LEFT_CTRL);
  if (modifiers & 0x02) Keyboard.press(KEY_LEFT_SHIFT);
  if (modifiers & 0x04) Keyboard.press(KEY_LEFT_ALT);
  if (modifiers & 0x08) Keyboard.press(KEY_LEFT_GUI);
  Keyboard.press(key);
  delay(20);
  Keyboard.releaseAll();
  return true;
}

static bool actionWait(void *, uint16_t milliseconds) {
  delay(milliseconds);
  return true;
}

static bool executeAction(const uint8_t *data, size_t len) {
  TinyTouchAction::Executor executor = {nullptr, actionText, actionKey, actionWait};
  return TinyTouchAction::execute(data, len, executor);
}

static void handleSerialCommands() {
  while (Serial.available()) {
    char c = (char)Serial.read();
    if (c == '\r') continue;
    if (c == '\n') {
      serialCommand.trim();
      String command = serialCommand;
      serialCommand = "";
      if (command == "PING") {
        Serial.println("PONG");
      } else if (command == "STATUS") {
        int count = fingerprintCount();
        if (count >= 0) {
          Serial.printf("OK STATUS firmware=unified mode=hid sensor=ok fingerprints=%d "
                        "keys=compiled hid_key=configured\n", count);
        }
        else Serial.println("ERR STATUS sensor");
      } else if (command == "CONFIG_UNLOCK") {
        int count = fingerprintCount();
        if (count < 0) {
          Serial.println("ERR CONFIG_UNLOCK sensor");
        } else if (count == 0) {
          authorizeConfig();
          Serial.println("OK CONFIG_UNLOCK first_setup seconds=120");
        } else {
          Serial.println("PROMPT TOUCH");
          if (authorizeWithFingerprint()) {
            authorizeConfig();
            Serial.println("OK CONFIG_UNLOCK fingerprint seconds=120");
          } else {
            Serial.println("ERR CONFIG_UNLOCK fingerprint");
          }
        }
      } else if (command.startsWith("ADMIN ENROLL ")) {
        String jobId, slotText;
        if (!parseToken(command, 2, &jobId) || !parseToken(command, 3, &slotText)) {
          Serial.println("ADMIN unknown ERROR bad_request");
        } else {
          uint16_t slot = (uint16_t)slotText.toInt();
          bool ok = enrollFingerprint(slot, jobId);
          if (adminWasCancelled) Serial.printf("ADMIN %s CANCELLED\n", jobId.c_str());
          else Serial.printf(ok ? "ADMIN %s STORED\n" : "ADMIN %s ERROR enroll_failed\n", jobId.c_str());
          setAura(ok ? FP_LED_GREEN : FP_LED_RED);
        }
      } else if (command.startsWith("ADMIN DELETE ")) {
        String jobId, slotText;
        if (!parseToken(command, 2, &jobId) || !parseToken(command, 3, &slotText)) {
          Serial.println("ADMIN unknown ERROR bad_request");
        } else {
          uint16_t slot = (uint16_t)slotText.toInt();
          bool ok = deleteFingerprint(slot);
          Serial.printf(ok ? "ADMIN %s DELETED\n" : "ADMIN %s ERROR delete_failed\n", jobId.c_str());
        }
      } else if (command.startsWith("ADMIN CANCEL ")) {
        String jobId;
        parseToken(command, 2, &jobId);
        Serial.printf("ADMIN %s CANCELLED\n", jobId.c_str());
      } else if (command.startsWith("ENROLL ")) {
        uint16_t slot = (uint16_t)command.substring(7).toInt();
        if (requireConfigAuthorization()) {
          bool ok = enrollFingerprint(slot);
          Serial.printf(ok ? "OK ENROLL slot=%u\n" : "ERR ENROLL slot=%u\n", slot);
          setAura(ok ? FP_LED_GREEN : FP_LED_RED);
        }
      } else if (command.startsWith("DELETE ")) {
        uint16_t slot = (uint16_t)command.substring(7).toInt();
        if (requireConfigAuthorization()) {
          bool ok = deleteFingerprint(slot);
          Serial.printf(ok ? "OK DELETE slot=%u\n" : "ERR DELETE slot=%u\n", slot);
        }
      } else if (command == "DELETE_ALL") {
        if (requireConfigAuthorization()) {
          bool ok = deleteAllFingerprints();
          Serial.println(ok ? "OK DELETE_ALL" : "ERR DELETE_ALL");
        }
      } else if (ENABLE_TEST_COMMANDS && command == "TYPE_TEST") {
        const uint8_t test[] = "HID_TEST_OK";
        actionText(nullptr, test, sizeof(test) - 1);
        Serial.println("TYPE_TEST_DONE");
      } else if (command.length()) {
        Serial.print("UNKNOWN_CMD ");
        Serial.println(command);
      }
      Serial.flush();
    } else if (serialCommand.length() < 96) {
      serialCommand += c;
    }
  }
}

static const uint8_t ACTION_FAILED = 0;
static const uint8_t ACTION_ARMED = 1;
static const uint8_t ACTION_EXECUTED = 2;

static bool verifyArmResponse(const String &nonceHex, uint16_t matchId, const String &line) {
  String kind, nonce, slot, expires, mac;
  if (!parseToken(line, 0, &kind) || !parseToken(line, 1, &nonce) ||
      !parseToken(line, 2, &slot) || !parseToken(line, 3, &expires) ||
      !parseToken(line, 4, &mac)) return false;
  if (kind != "ARM" || nonce != nonceHex || slot.toInt() != matchId) return false;
  String expected = hmacHex("ARM|" + nonce + "|" + slot + "|" + expires);
  return expected.equalsIgnoreCase(mac);
}

static uint8_t requestAndExecuteAction(uint16_t matchId, uint16_t score) {
  uint8_t nonceBytes[16];
  if (!randomBytes(nonceBytes, sizeof(nonceBytes))) {
    Serial.println("ERR rng");
    return ACTION_FAILED;
  }
  String nonce = toHex(nonceBytes, sizeof(nonceBytes));
  secureWipe(nonceBytes, sizeof(nonceBytes));

  eventCounter++;
  String counter = String(eventCounter);
  String slot = String(matchId);
  String scoreStr = String(score);
  String mac = hmacHex("EV|" + nonce + "|" + counter + "|" + slot + "|" + scoreStr);
  Serial.print("EV ");
  Serial.print(nonce);
  Serial.print(" ");
  Serial.print(counter);
  Serial.print(" ");
  Serial.print(slot);
  Serial.print(" ");
  Serial.print(scoreStr);
  Serial.print(" ");
  Serial.println(mac);
  Serial.println("EV_SENT");
  Serial.flush();

  String line;
  if (!readHelperLine(&line, HELPER_TIMEOUT_MS)) return ACTION_FAILED;
  if (verifyArmResponse(nonce, matchId, line)) return ACTION_ARMED;

  uint8_t action[256];
  size_t actionLen = sizeof(action);
  bool ok = decryptAction(nonce, line, action, &actionLen) && executeAction(action, actionLen);
  secureWipe(action, sizeof(action));
  return ok ? ACTION_EXECUTED : ACTION_FAILED;
}

void setup() {
  pinMode(FP_INT_PIN, INPUT);
  USB.VID(0x303A);
  USB.PID(0x4001);
  USB.manufacturerName("TouchPass");
  USB.productName("TouchPass Fingerprint HID");
  Serial.begin(115200);
  Keyboard.begin();
  USB.begin();
  Finger.begin(UART_BAUD, SERIAL_8N1, FP_RX_PIN, FP_TX_PIN);
  delay(1500);

  Serial.println("BOOT tinyTouch HID");
  if (!verifySensor()) {
    Serial.println("ERR fingerprint_verify");
    setAura(FP_LED_RED);
  } else {
    Serial.println("READY");
    setAura(FP_LED_PURPLE);
  }
}

void loop() {
  handleSerialCommands();

  if (!fingerPresent()) {
    setAura(FP_LED_PURPLE);
    delay(25);
    return;
  }

  setAura(FP_LED_WHITE);
  uint16_t matchId = 0;
  uint16_t score = 0;
  if (scanMatch(&matchId, &score)) {
    Serial.println("TOUCH");
    Serial.flush();
    Serial.printf("MATCH %u %u\n", matchId, score);
    uint8_t result = requestAndExecuteAction(matchId, score);
    if (result == ACTION_EXECUTED) {
      setAura(FP_LED_GREEN);
      Serial.println("ACTION_EXECUTED");
    } else if (result == ACTION_ARMED) {
      setAura(FP_LED_WHITE);
      Serial.println("ACTION_ARMED touch_same_finger_again");
    } else {
      setAura(FP_LED_RED);
      Serial.println("ERR helper_or_crypto");
    }
  } else {
    if (USE_INT_PIN || lastScanStatus == 2) {
      setAura(FP_LED_RED);
      Serial.println("NO_MATCH");
    } else {
      setAura(FP_LED_PURPLE);
    }
  }

  if (USE_INT_PIN || lastScanStatus != 0) delay(RESULT_HOLD_MS);
  setAura(FP_LED_PURPLE);
  if (USE_INT_PIN) {
    while (fingerPresent()) delay(25);
  }
  if (!USE_INT_PIN) delay(200);
}
