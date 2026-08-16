# Implementation Checklist

- [x] 1.1 Reproduce the app/firmware enrollment contract failure.
- [x] 1.2 Confirm the ZW101 hardware responds over UART.
- [x] 2.1 Verify the desktop admin-flow tests cover unlock before enroll/delete.
- [x] 2.2 Verify firmware contract tests cover ten slots and UART image-state enrollment.
- [x] 2.3 Complete only the minimal missing implementation while preserving existing edits.
- [x] 3.1 Run focused Rust, Python, and frontend tests.
- [x] 3.2 Run the full project quality gate.
- [ ] 4.1 Build the ESP-IDF unified firmware.
- [ ] 4.2 Detect and verify the ESP32-S3 bootloader port.
- [ ] 4.3 Flash firmware and verify runtime status.
- [ ] 4.4 Enroll and match a test fingerprint with user interaction.
- [x] 5.1 Build the updated desktop application artifact.
