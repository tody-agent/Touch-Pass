# Build Touch Pass

This guide takes you from loose parts to the local Touch Pass portal on a Mac.
Work through it from the root of this repository (the folder that contains
`README.md`). Touch Pass is a convenient HID keyboard interface, not a
security boundary: it types into whichever Mac field is focused, and the
sensor connection is an unauthenticated UART link.

## What you are building

You will connect a ZW101 fingerprint sensor to an ESP32-S3 Super Mini, flash
the [Touch Pass firmware](../firmware/tiny_touch_keyboard/tiny_touch_keyboard.ino),
then run a local macOS helper and portal. The portal manages fingerprint slots
1 through 10 and assigns actions to enrolled fingers. Password actions are
stored by the helper in macOS Keychain; the firmware and helper share a pairing
key to authenticate and encrypt action messages.

![Exploded view of the Touch Pass parts](../assets/demo/05-exploded-view-v3.png)

## Parts and tools

- ESP32-S3 Super Mini (the firmware also describes the Waveshare ESP32-S3-Zero
  as a compatible target).
- ZW101 fingerprint sensor with its six-pin lead.
- Six female-to-female Dupont wires, or equivalent 3.3 V-safe wiring.
- A USB **data** cable for the ESP32-S3; many charging-only cables cannot
  upload firmware or expose the serial port.
- A Mac with Arduino IDE, Terminal, `python3`, and an internet connection for
  the helper's Python dependency.
- The `esp32 by Espressif Systems` board package, version 3.x, installed in
  Arduino IDE.

Keep the sensor and board unpowered while you make or change connections.

## Wiring

Both ZW101 supply pins use 3.3 V logic and power. **Never connect ZW101 VCC or
either UART signal to 5 V.** TX and RX cross over: the sensor sends on TX to
the ESP32 receive pin, and the sensor receives on RX from the ESP32 transmit
pin.

| ZW101 | ESP32-S3 Super Mini |
| --- | --- |
| V_TOUCH (pin 1) | 3V3 |
| TouchOut (pin 2) | GPIO1 |
| VCC (pin 3) | 3V3 |
| TX (pin 4) | GPIO6 / ESP RX |
| RX (pin 5) | GPIO7 / ESP TX |
| GND (pin 6) | GND |

Do not substitute ESP32-S3 strapping pins GPIO0, GPIO3, GPIO45, or GPIO46 for
these connections. The firmware uses the mapping above and talks to the sensor
at 57,600 baud.

## Assemble

1. With USB disconnected, connect the six wires exactly as shown in the table.
2. Check that both `V_TOUCH` and `VCC` go to `3V3`, not `5V`, and that TX/RX
   are crossed.
3. Put the sensor somewhere stable and reachable, but leave the board exposed
   until the first physical check is complete.
4. Connect the ESP32-S3 to the Mac using the data cable. The Mac powers the
   board through USB; do not add a separate 5 V connection to the ZW101.

## Prepare your Mac

In Terminal, change to the repository root, then create a project-local Python
environment and install the helper requirements:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r software/macos-helper/requirements.txt
```

Before configuring anything, run these automated file checks. They verify that
you are in the expected checkout and that the commands in this guide point at
real project files. Each command should exit with status `0` and print nothing.

```bash
test -f firmware/tiny_touch_keyboard/tiny_touch_keyboard.ino
test -f firmware/tiny_touch_keyboard/secrets.example.h
test -f software/macos-helper/requirements.txt
test -f software/macos-helper/tinytouch_helper.py
```

These are file checks only; they do not verify your wires, board, USB cable, or
fingerprint sensor.

## Create pairing key

The board and Mac must use the same randomly generated 32-byte key. The
following commands create a 64-character hexadecimal key, print it once for
you to copy, print a C++ `0xNN` list for the firmware, and store the same key
in your macOS Keychain:

```bash
PAIRING_KEY="$(openssl rand -hex 32)"
printf '%s\n' "$PAIRING_KEY"
printf '%s' "$PAIRING_KEY" | sed 's/../0x&, /g'
.venv/bin/python software/macos-helper/tinytouch_helper.py \
  --set-pairing-key "$PAIRING_KEY"
```

Keep this Terminal window open until you finish configuring the firmware: the
`PAIRING_KEY` variable exists only in this shell. Do not paste the key into a
chat, issue, or commit.

Copy the firmware template to the ignored local secret file:

```bash
cp firmware/tiny_touch_keyboard/secrets.example.h \
  firmware/tiny_touch_keyboard/secrets.h
```

Open `firmware/tiny_touch_keyboard/secrets.h`. Replace the 32 `0x00` values
inside `PAIRING_KEY` with the comma-separated `0xNN` values printed by the
second command above. Keep the surrounding braces and semicolon. The local
`secrets.h` file is ignored by Git; never commit or share it.

## Configure Arduino

Open the [firmware sketch](../firmware/tiny_touch_keyboard/tiny_touch_keyboard.ino)
in Arduino IDE. In the board and Tools menus, choose these exact settings:

| Arduino setting | Value |
| --- | --- |
| Board | `ESP32S3 Dev Module` |
| USB Mode | `USB-OTG (TinyUSB)` |
| USB CDC On Boot | `Enabled` |
| Flash Size | `4MB` |
| PSRAM | `Disabled` |

Also select the serial port that belongs to your ESP32-S3. On a Waveshare
ESP32-S3-Zero, if uploading does not begin, hold **BOOT**, press and release
**RESET**, release **BOOT**, then start the upload again.

## Flash

1. In Arduino IDE, click **Verify**. Fix any reported error before continuing.
2. Click **Upload** and wait for Arduino IDE to report that the upload
   completed.
3. Close Arduino IDE's Serial Monitor if it opened. The helper needs exclusive
   access to the USB CDC serial port.

This is the point where a physical check begins: a successful compile or upload
does not prove that the sensor is wired correctly.

## Start helper and portal

From the repository root, start the helper. It starts the portal automatically
and listens only on your Mac's loopback address:

```bash
.venv/bin/python software/macos-helper/tinytouch_helper.py
```

Open [http://127.0.0.1:8787](http://127.0.0.1:8787) in a browser. If more than
one `/dev/cu.usbmodem*` device is attached, or if the helper asks you to choose
a port, stop it with `Control-C` and run it with the board's actual port:

```bash
.venv/bin/python software/macos-helper/tinytouch_helper.py \
  --port /dev/cu.usbmodemYOUR_DEVICE
```

The helper normally discovers a single USB CDC device itself. Do not run
Arduino Serial Monitor while this command is running, because only one program
can own the serial port at a time.

## First-build checklist

### Automated checks

- The four `test -f` commands in **Prepare your Mac** each exited with `0`.
- Arduino IDE completed **Verify** and **Upload** without an error.
- The helper printed a portal address and the browser opened
  `http://127.0.0.1:8787`.

### Physical checks

- The portal shows that the ESP32-S3 is connected; if not, check the USB data
  cable, selected port, and **USB CDC On Boot** setting.
- In the portal, configure an unused slot, choose an action, and save it.
- Enroll a finger when prompted: touch once, lift when asked, then touch the
  same finger again.
- Put the cursor in a harmless text editor and trigger an action. Confirm that
  it goes to the focused field. For non-password actions, lift and touch the
  same finger again within three seconds to confirm.

Do not begin by putting a password into a sensitive login field. First prove
the focused-window behavior with a harmless action in a text editor.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Helper says no ESP32-S3 USB CDC device was found | Use a USB data cable, reconnect the board, confirm `USB CDC On Boot` is enabled, then retry with `--port` if needed. |
| Arduino cannot upload | Confirm the selected port and board settings. For the Waveshare ESP32-S3-Zero, use the BOOT/RESET sequence in **Configure Arduino**. |
| ESP32-S3 connects but the sensor is unavailable | Recheck that sensor TX goes to GPIO6, RX goes to GPIO7, both supply pins are 3V3, GND is common, and no ZW101 UART pin sees 5 V. |
| A recognized finger does not perform the configured action | Confirm that `secrets.h` and the macOS Keychain use the exact same pairing key, then reflash after changing `secrets.h`. |
| Text appears in the wrong place | This is expected HID behavior when the wrong app or field is focused. Focus a harmless target before touching the sensor. |
| Password characters are incorrect | Switch the macOS input source to `ABC` or `US`; password actions type ASCII keyboard input. |
| An Accept, Enter, Escape, or custom action does nothing after one touch | These actions deliberately require the same finger to touch again within three seconds. |

For the existing Vietnamese hardware and portal guide, see
[`esp32-s3-zw101-portal-vi.md`](esp32-s3-zw101-portal-vi.md).

## What automated tests prove

Run the documentation test suite from the repository root:

```bash
.venv/bin/python -m unittest tests/test_documentation.py
```

It checks that the project guides and approved image assets exist, that local
Markdown links resolve, and that the visible documentation includes the focused
HID and unauthenticated UART safety limits. It does **not** compile firmware,
upload a board, detect a USB device, verify 3.3 V wiring, enroll a finger, or
prove that a real HID action reaches the intended field. Those are the physical
checks in the checklist above.
