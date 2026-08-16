# TouchPass unified ESP-IDF firmware

This firmware exposes USB CDC, HID, and CCID/PIV while keeping fingerprint templates on the ZW101 sensor.

## ZW101 wiring

- Sensor RX → ESP32-S3 GPIO43 (UART TX)
- Sensor TX → ESP32-S3 GPIO44 (UART RX)
- Sensor TouchOut → GPIO2 (optional hint; enrollment polls `GetImage` over UART)
- Sensor V_TOUCH and VCC → 3.3V
- Sensor GND → GND

UART runs at 57,600 baud. Slots 1 through 10 are available.

## Build

Use ESP-IDF 5.3.3:

```sh
idf.py -C firmware/tiny_touch_smartcard build
```

The application types the non-sensitive smart-card dummy PIN (`000000`) over HID; actual authorization remains gated by PIV and the sensor.
