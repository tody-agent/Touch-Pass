# Implementation Checklist

- [x] 1. Add failing protocol/admin-flow tests for HID_KEY, MODE hid, configure-only, configure-then-enroll, rejection, and timeout cleanup.
- [x] 2. Add secure staged pairing-key tests and implementation without exposing key material in logs or IPC.
- [x] 3. Implement typed firmware lines and the HID bootstrap admin state machine.
- [x] 4. Add `configure_hid_mode` Tauri command and automatic enrollment preflight.
- [x] 5. Add failing frontend tests for Settings HID readiness, configure/repair confirmation, loading, and three-locale key parity.
- [x] 6. Implement the Settings Device controls, bridge API, status refresh, and localized feedback.
- [x] 7. Run focused tests, full frontend/Rust gates, and independent review.
- [x] 8. Build NSIS and smoke-test the native executable.
- [ ] 9. Reconnect the device, configure live COM9 with a physical fingerprint touch, and verify STATUS reports `mode=hid hid_key=configured`.
