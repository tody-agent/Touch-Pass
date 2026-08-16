#include "fingerprint.h"
#include "fingerprint_protocol.h"

#include <string.h>

#include "driver/gpio.h"
#include "driver/uart.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/semphr.h"
#include "freertos/task.h"

static const char *TAG = "fingerprint";

static const uart_port_t FP_UART = UART_NUM_1;
static const int FP_TX_PIN = 43;
static const int FP_RX_PIN = 44;
static const int FP_INT_PIN = 2;
static const int INT_ACTIVE_VALUE = 1;
static const uint16_t START_SLOT = 1;
static const uint16_t END_SLOT = 10;
static const uint32_t FINGER_WAIT_MS = 7000;
static const uint8_t FP_LED_BLUE = 0x01;
static const uint8_t FP_LED_GREEN = 0x02;
static const uint8_t FP_LED_RED = 0x04;
static const uint8_t FP_LED_FUNC_FLASH = 2;
static const uint8_t FP_LED_FUNC_STEADY = 3;

static uint8_t current_led = 0xff;
static SemaphoreHandle_t fp_mutex;

static bool fp_command(uint8_t instruction, const uint8_t *params, size_t param_len,
                       uint8_t *confirm, uint8_t *data, size_t *data_len,
                       uint32_t timeout_ms) {
  uint8_t drain[64];
  while (uart_read_bytes(FP_UART, drain, sizeof(drain), 0) > 0) {}

  uint8_t payload[32];
  if (param_len + 1 > sizeof(payload)) return false;
  payload[0] = instruction;
  if (param_len) memcpy(payload + 1, params, param_len);

  const size_t payload_len = param_len + 1;
  const uint16_t length = payload_len + 2;
  const uint16_t sum = fp_protocol_checksum(0x01, (uint8_t)(length >> 8),
                                             (uint8_t)length, payload, payload_len);
  const uint8_t header[] = {
    0xef, 0x01, 0xff, 0xff, 0xff, 0xff, 0x01,
    (uint8_t)(length >> 8), (uint8_t)(length & 0xff)
  };

  uart_write_bytes(FP_UART, header, sizeof(header));
  uart_write_bytes(FP_UART, payload, payload_len);
  uint8_t sum_bytes[] = {(uint8_t)(sum >> 8), (uint8_t)(sum & 0xff)};
  uart_write_bytes(FP_UART, sum_bytes, sizeof(sum_bytes));

  uint8_t response[96];
  size_t pos = 0;
  const size_t data_cap = (data && data_len) ? *data_len : 0;
  TickType_t start = xTaskGetTickCount();
  TickType_t deadline = pdMS_TO_TICKS(timeout_ms);
  if (data && data_len) *data_len = 0;

  while ((xTaskGetTickCount() - start) < deadline) {
    int n = uart_read_bytes(FP_UART, response + pos, sizeof(response) - pos, pdMS_TO_TICKS(10));
    if (n <= 0) continue;
    pos += (size_t)n;

    while (pos >= 2 && !(response[0] == 0xef && response[1] == 0x01)) {
      memmove(response, response + 1, --pos);
    }
    if (pos < 9) continue;

    uint16_t resp_len = ((uint16_t)response[7] << 8) | response[8];
    size_t expected = 9 + resp_len;
    if (resp_len < 3 || expected > sizeof(response)) return false;
    if (pos < expected) continue;

    fp_ack_t ack;
    if (!fp_protocol_parse_ack(response, expected, &ack)) return false;
    *confirm = ack.confirm;
    if (data && data_len) {
      size_t copy_len = ack.data_length < data_cap ? ack.data_length : data_cap;
      if (copy_len) memcpy(data, ack.data, copy_len);
      *data_len = copy_len;
    }
    return true;
  }

  return false;
}

static bool fp_take(uint32_t timeout_ms) {
  return fp_mutex && xSemaphoreTake(fp_mutex, pdMS_TO_TICKS(timeout_ms)) == pdTRUE;
}

static void fp_give(void) {
  if (fp_mutex) xSemaphoreGive(fp_mutex);
}

static void set_aura(uint8_t color) {
  if (color == current_led) return;
  uint8_t params[] = {FP_LED_FUNC_STEADY, color, color, 0};
  uint8_t confirm = 0xff;
  fp_command(0x3c, params, sizeof(params), &confirm, NULL, NULL, 1000);
  current_led = color;
}

static void flash_aura(uint8_t color) {
  uint8_t params[] = {FP_LED_FUNC_FLASH, 40, color, 2};
  uint8_t confirm = 0xff;
  fp_command(0x3c, params, sizeof(params), &confirm, NULL, NULL, 1000);
  current_led = 0xff;
}

static void show_result(bool ok) {
  flash_aura(ok ? FP_LED_GREEN : FP_LED_RED);
  vTaskDelay(pdMS_TO_TICKS(350));
  set_aura(FP_LED_BLUE);
}

void fingerprint_led_idle(void) {
  if (!fp_take(1000)) return;
  set_aura(FP_LED_BLUE);
  fp_give();
}

static bool finger_present(void) {
  return gpio_get_level(FP_INT_PIN) == INT_ACTIVE_VALUE;
}

bool fingerprint_present_hint(void) {
  return finger_present();
}

static bool fingerprint_match_captured(fingerprint_match_t *match, bool quiet) {
  if (match) memset(match, 0, sizeof(*match));
  uint8_t confirm = 0xff;
  uint8_t img2tz[] = {0x01};
  if (!fp_command(0x02, img2tz, sizeof(img2tz), &confirm, NULL, NULL, 2000) || confirm != 0x00) {
    if (!quiet) {
      ESP_LOGW(TAG, "img2tz failed confirm=0x%02x", confirm);
      show_result(false);
    }
    return false;
  }

  uint16_t count = END_SLOT - START_SLOT + 1;
  uint8_t search_params[] = {
    0x01,
    (uint8_t)(START_SLOT >> 8), (uint8_t)(START_SLOT & 0xff),
    (uint8_t)(count >> 8), (uint8_t)(count & 0xff)
  };
  uint8_t search_data[4];
  size_t search_len = sizeof(search_data);
  if (!fp_command(0x04, search_params, sizeof(search_params), &confirm, search_data, &search_len, 2000)) {
    if (!quiet) ESP_LOGW(TAG, "search command failed");
  } else if (confirm == 0x00 && search_len == sizeof(search_data)) {
    uint16_t score = ((uint16_t)search_data[2] << 8) | search_data[3];
    uint16_t slot = ((uint16_t)search_data[0] << 8) | search_data[1];
    bool ok = score > 0 && slot >= START_SLOT && slot <= END_SLOT;
    ESP_LOGI(TAG, "fingerprint search: %s slot=%u score=%u",
             ok ? "ok" : "failed", slot, score);
    if (ok && match) {
      match->slot = slot;
      match->score = score;
    }
    if (!quiet || ok) show_result(ok);
    return ok;
  } else if (!quiet) {
    ESP_LOGW(TAG, "search failed confirm=0x%02x len=%u", confirm, (unsigned)search_len);
  }

  for (uint16_t slot = START_SLOT; slot <= END_SLOT; slot++) {
    uint8_t load_params[] = {0x02, (uint8_t)(slot >> 8), (uint8_t)(slot & 0xff)};
    confirm = 0xff;
    if (!fp_command(0x07, load_params, sizeof(load_params), &confirm, NULL, NULL, 1000) ||
        confirm != 0x00) {
      if (!quiet) ESP_LOGW(TAG, "load slot %u failed confirm=0x%02x", slot, confirm);
      continue;
    }

    uint8_t match_data[2];
    size_t match_len = sizeof(match_data);
    confirm = 0xff;
    if (!fp_command(0x03, NULL, 0, &confirm, match_data, &match_len, 1000)) {
      if (!quiet) ESP_LOGW(TAG, "match slot %u command failed", slot);
      continue;
    }
    if (confirm == 0x00 && match_len == sizeof(match_data)) {
      uint16_t score = ((uint16_t)match_data[0] << 8) | match_data[1];
      if (score > 0) {
        ESP_LOGI(TAG, "fingerprint match: ok slot=%u score=%u", slot, score);
        if (match) {
          match->slot = slot;
          match->score = score;
        }
        show_result(true);
        return true;
      }
    }
    if (!quiet) {
      ESP_LOGW(TAG, "match slot %u failed confirm=0x%02x len=%u", slot, confirm, (unsigned)match_len);
    }
  }

  if (!quiet) show_result(false);
  return false;
}

bool fingerprint_authorize_poll_once(fingerprint_match_t *match) {
  if (!fp_take(0)) return false;
  uint8_t confirm = 0xff;
  if (!fp_command(0x01, NULL, 0, &confirm, NULL, NULL, 350) || confirm != 0x00) {
    fp_give();
    return false;
  }
  bool ok = fingerprint_match_captured(match, true);
  fp_give();
  return ok;
}

void fingerprint_init(void) {
  gpio_config_t io = {
    .pin_bit_mask = 1ULL << FP_INT_PIN,
    .mode = GPIO_MODE_INPUT,
    .pull_up_en = GPIO_PULLUP_DISABLE,
    .pull_down_en = GPIO_PULLDOWN_ENABLE,
    .intr_type = GPIO_INTR_DISABLE,
  };
  gpio_config(&io);

  uart_config_t cfg = {
    .baud_rate = 57600,
    .data_bits = UART_DATA_8_BITS,
    .parity = UART_PARITY_DISABLE,
    .stop_bits = UART_STOP_BITS_1,
    .flow_ctrl = UART_HW_FLOWCTRL_DISABLE,
    .source_clk = UART_SCLK_DEFAULT,
  };
  uart_driver_install(FP_UART, 1024, 0, 0, NULL, 0);
  uart_param_config(FP_UART, &cfg);
  uart_set_pin(FP_UART, FP_TX_PIN, FP_RX_PIN, UART_PIN_NO_CHANGE, UART_PIN_NO_CHANGE);
  fp_mutex = xSemaphoreCreateMutex();

  uint8_t params[] = {0x00, 0x00, 0x00, 0x00};
  uint8_t confirm = 0xff;
  fp_take(2000);
  bool ok = fp_command(0x13, params, sizeof(params), &confirm, NULL, NULL, 2000) && confirm == 0x00;
  fp_give();
  ESP_LOGI(TAG, "sensor verify: %s", ok ? "ok" : "failed");
  fingerprint_led_idle();
}

bool fingerprint_authorize_once(void) {
  if (!fp_take(FINGER_WAIT_MS + 1000)) return false;
  uint8_t confirm = 0xff;
  ESP_LOGI(TAG, "finger present hint=%d", finger_present());
  set_aura(FP_LED_BLUE);

  TickType_t start = xTaskGetTickCount();
  TickType_t deadline = pdMS_TO_TICKS(FINGER_WAIT_MS);
  bool got_image = false;
  while ((xTaskGetTickCount() - start) < deadline) {
    if (fp_command(0x01, NULL, 0, &confirm, NULL, NULL, 1000) && confirm == 0x00) {
      got_image = true;
      break;
    }
    vTaskDelay(pdMS_TO_TICKS(150));
  }
  if (!got_image) {
    ESP_LOGW(TAG, "gen image failed confirm=0x%02x", confirm);
    show_result(false);
    fp_give();
    return false;
  }

  bool ok = fingerprint_match_captured(NULL, false);
  fp_give();
  return ok;
}

int fingerprint_count(void) {
  if (!fp_take(2000)) return -1;
  uint8_t confirm = 0xff;
  uint8_t data[2];
  size_t data_len = sizeof(data);
  bool ok = fp_command(0x1d, NULL, 0, &confirm, data, &data_len, 2000) &&
            confirm == 0x00 && data_len == sizeof(data);
  fp_give();
  return ok ? ((int)data[0] << 8) | data[1] : -1;
}

static bool wait_for_image_state(bool present, uint32_t timeout_ms,
                                 uint8_t *last_confirm) {
  TickType_t start = xTaskGetTickCount();
  TickType_t deadline = pdMS_TO_TICKS(timeout_ms);
  while ((xTaskGetTickCount() - start) < deadline) {
    uint8_t confirm = 0xff;
    bool command_ok = fp_command(0x01, NULL, 0, &confirm, NULL, NULL, 1000);
    if (last_confirm) *last_confirm = confirm;
    fp_image_state_t state = fp_protocol_image_state(command_ok, confirm);
    if ((present && state == FP_IMAGE_PRESENT) ||
        (!present && state == FP_IMAGE_ABSENT)) {
      return true;
    }
    if (state == FP_IMAGE_ERROR || state == FP_IMAGE_TRANSPORT_ERROR) return false;
    vTaskDelay(pdMS_TO_TICKS(50));
  }
  return false;
}

static bool capture_template(uint8_t buffer_id, uint8_t *last_confirm) {
  uint8_t confirm = 0xff;
  uint8_t params[] = {buffer_id};
  bool ok = fp_command(0x02, params, sizeof(params), &confirm, NULL, NULL, 2000);
  if (last_confirm) *last_confirm = confirm;
  return ok && confirm == 0x00;
}

static void set_enroll_error(fingerprint_enroll_error_t *error,
                             fingerprint_enroll_stage_t stage, uint8_t confirm) {
  if (!error) return;
  error->stage = stage;
  error->confirm = confirm;
}

const char *fingerprint_enroll_stage_name(fingerprint_enroll_stage_t stage) {
  switch (stage) {
    case FP_ENROLL_STAGE_INVALID_SLOT: return "invalid_slot";
    case FP_ENROLL_STAGE_BUSY: return "busy";
    case FP_ENROLL_STAGE_GET_IMAGE_FIRST: return "get_image_first";
    case FP_ENROLL_STAGE_IMAGE2TZ_FIRST: return "image2tz_first";
    case FP_ENROLL_STAGE_WAIT_LIFT: return "wait_lift";
    case FP_ENROLL_STAGE_GET_IMAGE_SECOND: return "get_image_second";
    case FP_ENROLL_STAGE_IMAGE2TZ_SECOND: return "image2tz_second";
    case FP_ENROLL_STAGE_REG_MODEL: return "reg_model";
    case FP_ENROLL_STAGE_STORE: return "store";
    case FP_ENROLL_STAGE_NONE:
    default: return "none";
  }
}

bool fingerprint_enroll(uint16_t slot, void (*prompt)(const char *message),
                        fingerprint_enroll_error_t *error) {
  set_enroll_error(error, FP_ENROLL_STAGE_NONE, 0x00);
  if (slot < START_SLOT || slot > END_SLOT) {
    set_enroll_error(error, FP_ENROLL_STAGE_INVALID_SLOT, 0xff);
    return false;
  }
  if (!fp_take(1000)) {
    set_enroll_error(error, FP_ENROLL_STAGE_BUSY, 0xff);
    return false;
  }
  bool ok = false;
  uint8_t confirm = 0xff;
  set_aura(FP_LED_BLUE);
  if (prompt) prompt("TOUCH");
  if (!wait_for_image_state(true, 15000, &confirm)) {
    set_enroll_error(error, FP_ENROLL_STAGE_GET_IMAGE_FIRST, confirm);
    goto done;
  }
  if (!capture_template(1, &confirm)) {
    set_enroll_error(error, FP_ENROLL_STAGE_IMAGE2TZ_FIRST, confirm);
    goto done;
  }
  if (prompt) prompt("LIFT");
  if (!wait_for_image_state(false, 10000, &confirm)) {
    set_enroll_error(error, FP_ENROLL_STAGE_WAIT_LIFT, confirm);
    goto done;
  }
  vTaskDelay(pdMS_TO_TICKS(250));
  if (prompt) prompt("TOUCH_AGAIN");
  if (!wait_for_image_state(true, 15000, &confirm)) {
    set_enroll_error(error, FP_ENROLL_STAGE_GET_IMAGE_SECOND, confirm);
    goto done;
  }
  if (!capture_template(2, &confirm)) {
    set_enroll_error(error, FP_ENROLL_STAGE_IMAGE2TZ_SECOND, confirm);
    goto done;
  }

  if (!fp_command(0x05, NULL, 0, &confirm, NULL, NULL, 2000) || confirm != 0x00) {
    set_enroll_error(error, FP_ENROLL_STAGE_REG_MODEL, confirm);
    goto done;
  }
  uint8_t store[] = {0x01, (uint8_t)(slot >> 8), (uint8_t)slot};
  ok = fp_command(0x06, store, sizeof(store), &confirm, NULL, NULL, 2000) && confirm == 0x00;
  if (!ok) set_enroll_error(error, FP_ENROLL_STAGE_STORE, confirm);

done:
  show_result(ok);
  fp_give();
  return ok;
}

bool fingerprint_delete(uint16_t slot) {
  if (slot < START_SLOT || slot > END_SLOT || !fp_take(1000)) return false;
  uint8_t params[] = {(uint8_t)(slot >> 8), (uint8_t)slot, 0x00, 0x01};
  uint8_t confirm = 0xff;
  bool ok = fp_command(0x0c, params, sizeof(params), &confirm, NULL, NULL, 2000) && confirm == 0x00;
  fp_give();
  return ok;
}

bool fingerprint_delete_all(void) {
  if (!fp_take(1000)) return false;
  uint8_t confirm = 0xff;
  bool ok = fp_command(0x0d, NULL, 0, &confirm, NULL, NULL, 2000) && confirm == 0x00;
  fp_give();
  return ok;
}
