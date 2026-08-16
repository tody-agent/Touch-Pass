#pragma once

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

typedef struct {
  uint16_t slot;
  uint16_t score;
} fingerprint_match_t;

typedef enum {
  FP_ENROLL_STAGE_NONE,
  FP_ENROLL_STAGE_INVALID_SLOT,
  FP_ENROLL_STAGE_BUSY,
  FP_ENROLL_STAGE_GET_IMAGE_FIRST,
  FP_ENROLL_STAGE_IMAGE2TZ_FIRST,
  FP_ENROLL_STAGE_WAIT_LIFT,
  FP_ENROLL_STAGE_GET_IMAGE_SECOND,
  FP_ENROLL_STAGE_IMAGE2TZ_SECOND,
  FP_ENROLL_STAGE_REG_MODEL,
  FP_ENROLL_STAGE_STORE,
} fingerprint_enroll_stage_t;

typedef struct {
  fingerprint_enroll_stage_t stage;
  uint8_t confirm;
} fingerprint_enroll_error_t;

void fingerprint_init(void);
bool fingerprint_present_hint(void);
void fingerprint_led_idle(void);
void fingerprint_led_action_result(bool ok);
void fingerprint_led_unconfigured(void);
bool fingerprint_authorize_poll_once(fingerprint_match_t *match);
bool fingerprint_authorize_once(void);
int fingerprint_count(void);
int fingerprint_uart_tx_pin(void);
int fingerprint_uart_rx_pin(void);
int fingerprint_uart_baud(void);
int fingerprint_last_verify_confirm(void);
bool fingerprint_last_count_transport_ok(void);
int fingerprint_last_count_confirm(void);
int fingerprint_last_count_data_length(void);
bool fingerprint_enroll(uint16_t slot, void (*prompt)(const char *message),
                        fingerprint_enroll_error_t *error);
const char *fingerprint_enroll_stage_name(fingerprint_enroll_stage_t stage);
bool fingerprint_delete(uint16_t slot);
bool fingerprint_delete_all(void);
