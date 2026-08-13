This Arduino firmware targets an ESP32-S3 Super Mini / Waveshare ESP32-S3-Zero
connected to a ZW101 fingerprint module. It exposes USB CDC plus HID and works
with the local macOS portal in `software/macos-helper`.

Pin mapping:

- ZW101 TouchOut -> GPIO1
- ZW101 TX -> GPIO6 (ESP RX)
- ZW101 RX -> GPIO7 (ESP TX)
- ZW101 V_TOUCH and VCC -> 3.3V
- ZW101 GND -> GND

The portal supports fingerprint slots 1 through 10 and encrypted action
payloads. See `docs/BUILD_GUIDE.vi.md` for the complete Vietnamese
build and setup guide.

This remains a HID authentication device: keystrokes go to the focused window,
and the UART connection to the fingerprint sensor is unauthenticated. Read the
security notes before using it.
