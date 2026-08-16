#pragma once

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

typedef struct {
  uint8_t confirm;
  const uint8_t *data;
  size_t data_length;
} fp_ack_t;

typedef enum {
  FP_IMAGE_PRESENT,
  FP_IMAGE_ABSENT,
  FP_IMAGE_ERROR,
  FP_IMAGE_TRANSPORT_ERROR,
} fp_image_state_t;

uint16_t fp_protocol_checksum(uint8_t packet_id, uint8_t length_high,
                              uint8_t length_low, const uint8_t *body,
                              size_t body_length);
bool fp_protocol_parse_ack(const uint8_t *packet, size_t packet_length,
                           fp_ack_t *ack);
fp_image_state_t fp_protocol_image_state(bool command_ok, uint8_t confirm);
