# Implementation Checklist

- [x] 1. Add failing firmware contract tests for unconfigured action gating and LED feedback.
- [x] 2. Add action-result and unconfigured LED helpers to the fingerprint driver.
- [x] 3. Gate HID/PIV dispatch and emit the unconfigured event without keyboard output.
- [x] 4. Run focused tests, full repository tests, diff checks, and ESP-IDF 5.3.3 build.
- [ ] 5. Flash and verify no `000000` plus yellow LED feedback on the physical device.
