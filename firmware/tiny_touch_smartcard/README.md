# TouchPass unified ESP-IDF firmware

This firmware exposes USB CDC, HID, and CCID/PIV while keeping fingerprint templates on the ZW101 sensor.

## ZW101 wiring

- Sensor RX → ESP32-S3 Super Mini board pin `TX`
- Sensor TX → ESP32-S3 Super Mini board pin `RX`
- Sensor TouchOut → GPIO2 (optional hint; enrollment polls `GetImage` over UART)
- Sensor V_TOUCH and VCC → 3.3V
- Sensor GND → GND

UART runs at 57,600 baud. Because 18-pin ESP32-S3 Mini boards reuse the same
silkscreen with different internal pin mappings, firmware validates EF-01 ACK
packets and auto-detects the known GPIO43/44, GPIO42/41, and GPIO1/3 layouts.
Slots 1 through 10 are available.

## Build

Use ESP-IDF 5.3.3:

```sh
idf.py -C firmware/tiny_touch_smartcard build
```

The application types the non-sensitive smart-card dummy PIN (`000000`) over HID; actual authorization remains gated by PIV and the sensor.
