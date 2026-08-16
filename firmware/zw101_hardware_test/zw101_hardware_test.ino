#include <Arduino.h>

// ZW101 read-only hardware diagnostic for ESP32-S3 Super Mini.
// No third-party Arduino library is required.

static const uint32_t SERIAL_BAUD = 115200;
static const uint32_t UART_BAUD = 57600;
static const int TOUCH_PIN = 2;

static const uint8_t VERIFY_PASSWORD = 0x13;
static const uint8_t READ_SYSTEM_PARAMETERS = 0x0F;
static const uint8_t TEMPLATE_COUNT = 0x1D;
static const uint8_t GET_IMAGE = 0x01;
static const uint8_t GET_ENROLL_IMAGE = 0x29;

struct UartPins {
  int tx;
  int rx;
};

// TX is the ESP32 transmit pin; RX is the ESP32 receive pin.
static const UartPins UART_CANDIDATES[] = {
  {43, 44},
  {42, 41},
  {1, 3},
};

static HardwareSerial FingerSerial(1);
static int activeTxPin = -1;
static int activeRxPin = -1;
static uint8_t activeImageCommand = GET_IMAGE;
static int lastTouchLevel = -1;
static uint32_t lastImagePollMs = 0;
static bool lastImagePresent = false;

static uint16_t packetChecksum(uint8_t packetId, const uint8_t *payload,
                               size_t payloadLength) {
  const uint16_t packetLength = payloadLength + 2;
  uint32_t total = packetId + (packetLength >> 8) + (packetLength & 0xFF);
  for (size_t i = 0; i < payloadLength; ++i) total += payload[i];
  return static_cast<uint16_t>(total);
}

static void printHex(const uint8_t *bytes, size_t length) {
  for (size_t i = 0; i < length; ++i) {
    if (bytes[i] < 0x10) Serial.print('0');
    Serial.print(bytes[i], HEX);
    if (i + 1 < length) Serial.print(' ');
  }
}

static bool sensorCommand(uint8_t instruction, const uint8_t *parameters,
                          size_t parameterLength, uint8_t *confirmation,
                          uint8_t *data, size_t *dataLength,
                          uint32_t timeoutMs) {
  while (FingerSerial.available()) FingerSerial.read();

  uint8_t payload[32];
  if (parameterLength + 1 > sizeof(payload)) return false;
  payload[0] = instruction;
  if (parameterLength > 0) {
    memcpy(payload + 1, parameters, parameterLength);
  }

  const size_t payloadLength = parameterLength + 1;
  const uint16_t packetLength = payloadLength + 2;
  const uint16_t checksum = packetChecksum(0x01, payload, payloadLength);
  const uint8_t header[] = {
      0xEF, 0x01, 0xFF, 0xFF, 0xFF, 0xFF, 0x01,
      static_cast<uint8_t>(packetLength >> 8),
      static_cast<uint8_t>(packetLength & 0xFF),
  };

  FingerSerial.write(header, sizeof(header));
  FingerSerial.write(payload, payloadLength);
  FingerSerial.write(static_cast<uint8_t>(checksum >> 8));
  FingerSerial.write(static_cast<uint8_t>(checksum & 0xFF));
  FingerSerial.flush();

  uint8_t response[128];
  size_t receivedLength = 0;
  const size_t outputCapacity = (data != nullptr && dataLength != nullptr)
                                    ? *dataLength
                                    : 0;
  if (dataLength != nullptr) *dataLength = 0;
  const uint32_t startedAt = millis();

  while (millis() - startedAt < timeoutMs) {
    while (FingerSerial.available() && receivedLength < sizeof(response)) {
      response[receivedLength++] = static_cast<uint8_t>(FingerSerial.read());

      while (receivedLength >= 2 &&
             !(response[0] == 0xEF && response[1] == 0x01)) {
        memmove(response, response + 1, --receivedLength);
      }

      if (receivedLength < 9) continue;
      const uint16_t responseBodyLength =
          (static_cast<uint16_t>(response[7]) << 8) | response[8];
      const size_t expectedLength = 9 + responseBodyLength;
      if (responseBodyLength < 3 || expectedLength > sizeof(response)) {
        return false;
      }
      if (receivedLength < expectedLength) continue;

      if (response[6] != 0x07) return false;
      const size_t payloadResponseLength = responseBodyLength - 2;
      const uint16_t receivedChecksum =
          (static_cast<uint16_t>(response[expectedLength - 2]) << 8) |
          response[expectedLength - 1];
      const uint16_t calculatedChecksum = packetChecksum(
          response[6], response + 9, payloadResponseLength);
      if (receivedChecksum != calculatedChecksum) return false;

      if (confirmation != nullptr) *confirmation = response[9];
      const size_t availableDataLength = payloadResponseLength - 1;
      if (data != nullptr && dataLength != nullptr) {
        const size_t copyLength =
            min(availableDataLength, outputCapacity);
        if (copyLength > 0) memcpy(data, response + 10, copyLength);
        *dataLength = copyLength;
      }
      return true;
    }
    delay(2);
  }

  if (receivedLength > 0) {
    Serial.print("  Du lieu UART chua hop le: ");
    printHex(response, receivedLength);
    Serial.println();
  }
  return false;
}

static bool sendSimpleCommand(uint8_t instruction, uint8_t *confirmation,
                              uint32_t timeoutMs = 700) {
  return sensorCommand(instruction, nullptr, 0, confirmation, nullptr, nullptr,
                       timeoutMs);
}

static bool detectSensor() {
  const uint8_t defaultPassword[] = {0x00, 0x00, 0x00, 0x00};

  Serial.println("[1/4] Dang tu dong do UART cua ZW101...");
  for (const UartPins &pins : UART_CANDIDATES) {
    Serial.printf("  Thu ESP32 TX=GPIO%d, RX=GPIO%d ... ", pins.tx, pins.rx);
    FingerSerial.end();
    FingerSerial.begin(UART_BAUD, SERIAL_8N1, pins.rx, pins.tx);
    delay(100);

    uint8_t confirmation = 0xFF;
    if (!sensorCommand(VERIFY_PASSWORD, defaultPassword,
                       sizeof(defaultPassword), &confirmation, nullptr,
                       nullptr, 700)) {
      Serial.println("khong co phan hoi");
      continue;
    }

    Serial.printf("co phan hoi (ACK=0x%02X)\n", confirmation);
    if (confirmation != 0x00) {
      Serial.println("  ZW101 da tra loi nhung mat khau khong phai 00000000.");
      return false;
    }
    activeTxPin = pins.tx;
    activeRxPin = pins.rx;
    return true;
  }

  return false;
}

static void printSystemParameters() {
  Serial.println("[2/4] Doc thong so he thong...");
  uint8_t confirmation = 0xFF;
  uint8_t data[32] = {};
  size_t dataLength = sizeof(data);
  if (!sensorCommand(READ_SYSTEM_PARAMETERS, nullptr, 0, &confirmation, data,
                     &dataLength, 1000)) {
    Serial.println("  LOI: ZW101 khong phan hoi lenh doc thong so.");
    return;
  }
  if (confirmation != 0x00 || dataLength < 16) {
    Serial.printf("  LOI: ACK=0x%02X, do dai=%u byte.\n", confirmation,
                  static_cast<unsigned>(dataLength));
    return;
  }

  const uint16_t status = (static_cast<uint16_t>(data[0]) << 8) | data[1];
  const uint16_t systemId = (static_cast<uint16_t>(data[2]) << 8) | data[3];
  const uint16_t capacity = (static_cast<uint16_t>(data[4]) << 8) | data[5];
  const uint16_t security = (static_cast<uint16_t>(data[6]) << 8) | data[7];
  const uint16_t packetCode = (static_cast<uint16_t>(data[12]) << 8) | data[13];
  const uint16_t baudMultiplier =
      (static_cast<uint16_t>(data[14]) << 8) | data[15];

  Serial.printf("  Status register : 0x%04X\n", status);
  Serial.printf("  System ID       : 0x%04X\n", systemId);
  Serial.printf("  Suc chua        : %u mau\n", capacity);
  Serial.printf("  Muc bao mat     : %u\n", security);
  Serial.printf("  Ma packet size  : %u\n", packetCode);
  Serial.printf("  Baud bao cao    : %lu\n",
                static_cast<unsigned long>(baudMultiplier) * 9600UL);
}

static void printTemplateCount() {
  Serial.println("[3/4] Doc so mau van tay da luu...");
  uint8_t confirmation = 0xFF;
  uint8_t data[4] = {};
  size_t dataLength = sizeof(data);
  if (!sensorCommand(TEMPLATE_COUNT, nullptr, 0, &confirmation, data,
                     &dataLength, 1000)) {
    Serial.println("  LOI: ZW101 khong phan hoi lenh dem mau.");
    return;
  }
  if (confirmation != 0x00 || dataLength < 2) {
    Serial.printf("  LOI: ACK=0x%02X, do dai=%u byte.\n", confirmation,
                  static_cast<unsigned>(dataLength));
    return;
  }

  const uint16_t count = (static_cast<uint16_t>(data[0]) << 8) | data[1];
  Serial.printf("  So mau dang co: %u\n", count);
}

static bool isImageState(uint8_t confirmation) {
  return confirmation == 0x00 || confirmation == 0x02;
}

static bool selectImageCommand() {
  uint8_t confirmation = 0xFF;
  if (sendSimpleCommand(GET_IMAGE, &confirmation) && isImageState(confirmation)) {
    activeImageCommand = GET_IMAGE;
    return true;
  }

  confirmation = 0xFF;
  if (sendSimpleCommand(GET_ENROLL_IMAGE, &confirmation) &&
      isImageState(confirmation)) {
    activeImageCommand = GET_ENROLL_IMAGE;
    return true;
  }
  return false;
}

static void printReadyMessage() {
  Serial.println("[4/4] Test chup anh van tay...");
  if (selectImageCommand()) {
    Serial.printf("  Opcode hoat dong: 0x%02X\n", activeImageCommand);
    Serial.println("  Hay cham/nghi ngón tay. Sketch se KHONG ghi hoac xoa mau.");
  } else {
    Serial.println("  CANH BAO: module co ket noi nhung khong chap nhan lenh chup anh.");
  }
  Serial.println("------------------------------------------------------------");
}

void setup() {
  pinMode(TOUCH_PIN, INPUT);
  Serial.begin(SERIAL_BAUD);
  const uint32_t serialWaitStarted = millis();
  while (!Serial && millis() - serialWaitStarted < 3000) delay(10);
  delay(500);

  Serial.println();
  Serial.println("=== ZW101 HARDWARE TEST (READ-ONLY) ===");
  Serial.println("ESP32 Serial Monitor: 115200 baud");

  if (!detectSensor()) {
    Serial.println();
    Serial.println("KHONG TIM THAY ZW101.");
    Serial.println("Kiem tra 3.3V, GND chung va dau cheo TX/RX.");
    Serial.println("Thu nhan EN/Reset neu day dung nhung van khong co phan hoi.");
    return;
  }

  Serial.printf("OK: ZW101 tai ESP32 TX=GPIO%d, RX=GPIO%d, baud=%lu\n",
                activeTxPin, activeRxPin,
                static_cast<unsigned long>(UART_BAUD));
  printSystemParameters();
  printTemplateCount();
  printReadyMessage();
}

void loop() {
  if (activeTxPin < 0) {
    delay(1000);
    return;
  }

  const int touchLevel = digitalRead(TOUCH_PIN);
  if (touchLevel != lastTouchLevel) {
    Serial.printf("TouchOut GPIO%d = %d\n", TOUCH_PIN, touchLevel);
    lastTouchLevel = touchLevel;
  }

  if (millis() - lastImagePollMs < 250) return;
  lastImagePollMs = millis();

  uint8_t confirmation = 0xFF;
  if (!sendSimpleCommand(activeImageCommand, &confirmation)) {
    Serial.println("LOI UART: mat phan hoi khi test chup anh.");
    delay(1000);
    return;
  }

  const bool imagePresent = confirmation == 0x00;
  if (imagePresent != lastImagePresent) {
    if (imagePresent) {
      Serial.println("OK: ZW101 da chup duoc anh ngón tay (ACK=0x00).");
    } else if (confirmation == 0x02) {
      Serial.println("INFO: khong co ngón tay tren cam bien (ACK=0x02).");
    } else {
      Serial.printf("CANH BAO: lenh chup anh tra ACK=0x%02X.\n", confirmation);
    }
    lastImagePresent = imagePresent;
  } else if (!isImageState(confirmation)) {
    Serial.printf("CANH BAO: lenh chup anh tra ACK=0x%02X.\n", confirmation);
  }
}
