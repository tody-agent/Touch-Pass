#include "fingerprint_protocol.h"

uint16_t fp_protocol_checksum(uint8_t packet_id, uint8_t length_high,
                              uint8_t length_low, const uint8_t *body,
                              size_t body_length) {
  uint32_t total = packet_id + length_high + length_low;
  for (size_t i = 0; i < body_length; i++) total += body[i];
  return (uint16_t)total;
}

bool fp_protocol_parse_ack(const uint8_t *packet, size_t packet_length,
                           fp_ack_t *ack) {
  if (!packet || !ack || packet_length < 12 || packet[0] != 0xef ||
      packet[1] != 0x01 || packet[6] != 0x07) {
    return false;
  }

  uint16_t length = ((uint16_t)packet[7] << 8) | packet[8];
  if (length < 3 || packet_length != (size_t)9 + length) return false;

  size_t body_length = length - 2;
  uint16_t received = ((uint16_t)packet[9 + body_length] << 8) |
                      packet[9 + body_length + 1];
  uint16_t calculated = fp_protocol_checksum(packet[6], packet[7], packet[8],
                                             packet + 9, body_length);
  if (received != calculated) return false;

  ack->confirm = packet[9];
  ack->data = packet + 10;
  ack->data_length = body_length - 1;
  return true;
}

fp_image_state_t fp_protocol_image_state(bool command_ok, uint8_t confirm) {
  if (!command_ok) return FP_IMAGE_TRANSPORT_ERROR;
  if (confirm == 0x00) return FP_IMAGE_PRESENT;
  if (confirm == 0x02) return FP_IMAGE_ABSENT;
  return FP_IMAGE_ERROR;
}
