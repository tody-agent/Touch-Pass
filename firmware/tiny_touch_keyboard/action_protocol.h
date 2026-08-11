#pragma once

#include <cstddef>
#include <cstdint>

namespace TinyTouchAction {

static constexpr uint8_t VERSION = 1;
static constexpr uint8_t OP_TEXT = 1;
static constexpr uint8_t OP_KEY = 2;
static constexpr uint8_t OP_DELAY = 3;
static constexpr uint8_t MAX_STEPS = 16;
static constexpr uint16_t MAX_DELAY_MS = 5000;

struct Executor {
  void *context;
  bool (*text)(void *context, const uint8_t *data, size_t length);
  bool (*key)(void *context, uint8_t modifiers, uint8_t keyCode);
  bool (*wait)(void *context, uint16_t milliseconds);
};

inline bool execute(const uint8_t *payload, size_t length, const Executor &executor) {
  if (!payload || length < 2 || payload[0] != VERSION || payload[1] > MAX_STEPS ||
      !executor.text || !executor.key || !executor.wait) {
    return false;
  }
  const uint8_t stepCount = payload[1];
  size_t offset = 2;
  for (uint8_t step = 0; step < stepCount; ++step) {
    if (offset >= length) return false;
    const uint8_t opcode = payload[offset++];
    if (opcode == OP_TEXT) {
      if (offset + 2 > length) return false;
      const size_t textLength = (static_cast<size_t>(payload[offset]) << 8) | payload[offset + 1];
      offset += 2;
      if (offset + textLength > length) return false;
      for (size_t index = 0; index < textLength; ++index) {
        if (payload[offset + index] > 0x7f) return false;
      }
      if (!executor.text(executor.context, payload + offset, textLength)) return false;
      offset += textLength;
    } else if (opcode == OP_KEY) {
      if (offset + 2 > length) return false;
      const uint8_t modifiers = payload[offset++];
      const uint8_t keyCode = payload[offset++];
      if (modifiers > 0x0f || keyCode < 1 || keyCode > 8 ||
          !executor.key(executor.context, modifiers, keyCode)) {
        return false;
      }
    } else if (opcode == OP_DELAY) {
      if (offset + 2 > length) return false;
      const uint16_t milliseconds = (static_cast<uint16_t>(payload[offset]) << 8) | payload[offset + 1];
      offset += 2;
      if (milliseconds > MAX_DELAY_MS || !executor.wait(executor.context, milliseconds)) return false;
    } else {
      return false;
    }
  }
  return offset == length;
}

}  // namespace TinyTouchAction
