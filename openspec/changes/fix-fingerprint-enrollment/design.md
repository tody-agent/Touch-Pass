# Design: Restore TouchPass fingerprint enrollment

## Context & Technical Approach

The ZW101 now answers UART status and captures a finger, but the desktop app and unified firmware are out of contract. The firmware requires `CONFIG_UNLOCK` before `ENROLL`, while the app must sequence those commands and surface failures. The unified firmware must support all ten product slots and use UART image state for enrollment so `TOUCH_OUT` remains an optimization rather than a hard enrollment gate.

Assumptions:

- Verified: ESP32-S3 bootloader is present on COM3.
- Verified: ZW101 answers `STATUS` with `sensor=ok` and captures a finger.
- Verified: existing uncommitted app and firmware edits belong to the user and must be preserved.
- Needs runtime verification: enrollment and matching after flashing.

## Proposed Changes

### Desktop admin flow

- Start enroll/delete operations with `CONFIG_UNLOCK`.
- Send the requested operation only after unlock succeeds.
- Parse locked, unlock, prompt, and detailed enrollment-error responses.
- Surface enrollment failure reasons to the UI.

### Unified firmware

- Support fingerprint slots 1 through 10.
- Determine finger present/lift state through UART image responses during enrollment.
- Preserve GPIO2 `TOUCH_OUT` as a runtime hint.
- Return detailed enrollment stage and confirmation codes.
- Expose matched slot and score to the HID event path.

### Deployment

- Build the ESP-IDF unified firmware.
- Flash bootloader, partition table, and application to the detected ESP32-S3 bootloader port.
- Build the desktop application artifact without overwriting unrelated user changes.

## Verification

- Observe the existing enrollment contract fail before implementation and pass afterward.
- Run Rust desktop tests, frontend tests/checks, and the project test gate.
- Build firmware successfully.
- Flash successfully and confirm runtime `STATUS` returns `sensor=ok`.
- Enroll one fingerprint through the corrected command flow and confirm the count increments.
