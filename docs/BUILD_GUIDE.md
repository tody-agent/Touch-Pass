# Build Touch Pass

🌐 **English** | [🇻🇳 **Tiếng Việt**](BUILD_GUIDE.vi.md)

This guide takes you from loose parts to the local Touch Pass portal on Windows or macOS.
Work through it from the root of this repository (the folder that contains
`README.md`). Touch Pass is a convenient HID keyboard interface, not a
security boundary: it types into whichever active window/field is focused on your computer, and the
sensor connection is an unauthenticated UART link.

## What you are building

You will connect a ZW101 fingerprint sensor to an ESP32-S3 Super Mini, flash
the [Touch Pass firmware](../firmware/tiny_touch_keyboard/tiny_touch_keyboard.ino),
then run a local helper service and Web Portal (`http://127.0.0.1:8787/`). The portal manages fingerprint slots
1 through 10 and assigns actions to enrolled fingers. Password actions are
stored cross-platform by the helper in the native OS Credential Store (Windows Credential Manager / macOS Keychain); the firmware and helper share a pairing
key to authenticate and encrypt action messages over USB CDC.

![Exploded view of the Touch Pass parts](../assets/demo/05-exploded-view-v3.png)

The approved image above is a **conceptual render**, not an assembly drawing or
cutting template. This repository does not include CAD that matches the
pictured enclosure. Measure your actual board, sensor, cable, and enclosure;
small modules sold under the same name can have different dimensions.

## Parts and tools

- ESP32-S3 Super Mini (the firmware also describes the Waveshare ESP32-S3-Zero
  as a compatible target).
- ZW101 fingerprint sensor with its six-pin lead.
- A generic project enclosure around **80 × 50 × 32 mm**. Check its *internal*
  space against your actual parts before buying or cutting it.
- At least seven 3.3 V-safe jumper leads and a small solderless breadboard for
  the first bare-board test: six leads serve the sensor pins and one feeds the
  shared 3V3 rail. For a permanent harness, use short lengths of stranded
  hookup wire instead.
- Heat-shrink tubing for every soldered splice and a small grommet, cable clamp,
  or adhesive cable-tie mount for strain relief.
- A small low-voltage terminal block or perfboard for the 3V3 fan-out. A
  soldered three-way splice is also suitable when fully insulated.
- A USB **data** cable for the ESP32-S3; many charging-only cables cannot
  upload firmware or expose the serial port.
- A computer (Windows 10/11, macOS, or Linux) with Arduino IDE or `arduino-cli`, Python 3.9+, and an internet connection for
  the helper's Python dependencies.
- Ruler or calipers, masking tape, a pencil or fine marker, a small drill with
  pilot bits (and a step bit if available), a craft saw or rotary tool for
  rectangular openings, a small file, and eye protection.
- For a soldered harness: a temperature-controlled soldering iron, electronics
  solder, wire strippers, side cutters, and a multimeter with continuity mode.

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

`V_TOUCH` and `VCC` are separate sensor pins, and **both need 3V3**. If your
board has one convenient `3V3` pin, make one insulated three-way junction: one
wire from the board's `3V3` pin fans out to two separate wires, one to
`V_TOUCH` and one to `VCC`. Use a soldered splice covered completely with
heat-shrink, a small terminal block, or perfboard. For the bare-board test, a
solderless breadboard power rail can be the temporary junction; do not put that
loose breadboard inside the finished enclosure. Do not twist and tape bare
wires or force two loose conductors into one Dupont socket. With USB still
disconnected, use continuity mode to confirm both sensor supply leads reach
`3V3` and that `3V3` is not shorted to `GND`.

Do not substitute ESP32-S3 strapping pins GPIO0, GPIO3, GPIO45, or GPIO46 for
these connections. The firmware uses the mapping above and talks to the sensor
at 57,600 baud.

## Assemble

### Bare-board test first

You can complete the first flash and portal test without an enclosure. This is
the simplest way to catch a crossed wire before cutting anything.

1. With USB disconnected, build the insulated 3V3 junction and connect all six
   sensor pins exactly as shown in the table.
2. Check again that `V_TOUCH` and `VCC` go to `3V3`, not `5V`, TX/RX are
   crossed, and no bare conductor can touch another pin.
3. Place the loose board and sensor on a clean, non-conductive surface where
   they cannot move or contact metal.
4. Connect only the ESP32-S3 USB data cable. The Mac powers the board through
   USB; do not add a separate 5 V connection to the ZW101.
5. Continue through **Flash**, **Start helper and portal**, and the physical
   checks below. Disconnect USB again before moving the circuit.

### Fit a generic enclosure

Only start enclosure work after the bare-board test passes.

1. Measure the actual board, sensor body, sensor lip, USB plug, and wire bend
   radius. Dry-fit them inside the roughly 80 × 50 × 32 mm enclosure.
2. Orient the sensor pad outward through the lid or front wall where a finger
   can land flat. Orient the ESP32-S3 so its USB socket faces an enclosure edge
   and remains reachable without pulling on the board.
3. Cover the outside cutting areas with masking tape. Transfer measurements
   from the real parts, mark centerlines and opening outlines, then check the
   orientation from both inside and outside. Do not scale dimensions from the
   conceptual render.
4. Remove every electronic part before drilling or cutting. Drill a small pilot
   hole from the marked outside face, enlarge it gradually, and use drilled
   corner holes plus a saw or file for rectangular openings. Wear eye
   protection and keep hands clear of the tool.
5. Deburr and remove all chips. Dry-fit again; no sharp edge should touch a
   wire, and the enclosure must not press the fingerprint pad or USB plug.
6. Mount the parts with non-conductive standoffs or secure electronics-safe
   adhesive. Add strain relief to the sensor lead and any cable passing through
   a wall, leaving a little slack before each connector.
7. Cover every soldered joint with heat-shrink, repeat the continuity and short
   checks, close the enclosure, and only then reconnect USB.

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

This is a **first-time only** procedure. Do not rerun it as a repair step. The
helper's default Keychain identity is account `B8F862FB478C` under service
`tinyTouch-pairing`; the commands below use that default explicitly.

Run the complete block from the repository root. Before it creates anything,
it checks for both an existing `secrets.h` and an existing pairing item in
Keychain. If either exists, it prints `STOP` and makes no replacement. The
`cp -n` command is a second no-clobber safeguard. A stop can mean setup was
completed earlier or that an earlier attempt stopped halfway; if you do not
know which, leave both copies alone and use the intentional rotation procedure
below to synchronize them.

```bash
(
  pairing_device_id="B8F862FB478C"
  pairing_service="tinyTouch-pairing"
  secrets_file="firmware/tiny_touch_keyboard/secrets.h"
  pairing_conflict=0

  if [ -e "$secrets_file" ]; then
    printf 'STOP: %s already exists; it was not overwritten.\n' \
      "$secrets_file" >&2
    pairing_conflict=1
  fi

  if security find-generic-password -a "$pairing_device_id" \
    -s "$pairing_service" >/dev/null 2>&1; then
    printf 'STOP: Keychain pairing item %s/%s already exists.\n' \
      "$pairing_service" "$pairing_device_id" >&2
    pairing_conflict=1
  fi

  if [ "$pairing_conflict" -ne 0 ]; then
    printf 'Use the intentional rotation instructions below only when needed.\n' >&2
    exit 1
  fi

  cp -n firmware/tiny_touch_keyboard/secrets.example.h "$secrets_file" || exit 1
  pairing_key="$(openssl rand -hex 32)" || exit 1
  printf 'Copy this C++ byte list into secrets.h:\n'
  printf '%s' "$pairing_key" | sed 's/../0x&, /g'
  printf '\n'

  if ! .venv/bin/python software/macos-helper/tinytouch_helper.py \
    --device-id "$pairing_device_id" --set-pairing-key "$pairing_key"; then
    unset pairing_key
    exit 1
  fi
  unset pairing_key
)
```

The block prints the C++ byte list once, stores the same key in Keychain, and
then clears it with `unset pairing_key`. Copy the displayed list from this
Terminal output. Do not paste it into a chat, issue, or commit. The helper
confirms the Keychain step by printing:

```text
pairing key stored in Keychain
```

Open `firmware/tiny_touch_keyboard/secrets.h`. Replace the 32 `0x00` values
inside `PAIRING_KEY` with the displayed comma-separated `0xNN` values. Keep the
surrounding braces and semicolon. The local `secrets.h` file is ignored by Git;
never commit or share it.

### Intentional pairing-key rotation

Do not delete one copy and rerun the first-time block. An intentional rotation
must update **both macOS Keychain and the existing `secrets.h` from the same new
key, then reflash the firmware**. If only one copy changes, Touch Pass actions
stop authenticating.

Stop the helper. Generate one replacement key and print its firmware bytes:

```bash
pairing_key="$(openssl rand -hex 32)"
printf '%s' "$pairing_key" | sed 's/../0x&, /g'
printf '\n'
```

While that variable remains in this Terminal, replace all 32 bytes in the
existing `secrets.h` with the displayed list. Then intentionally update the
matching Keychain item and clear the shell variable:

```bash
.venv/bin/python software/macos-helper/tinytouch_helper.py \
  --device-id B8F862FB478C --set-pairing-key "$pairing_key"
pairing_result=$?
unset pairing_key
[ "$pairing_result" -eq 0 ]
```

Immediately **Verify** and **Upload** the sketch again so the board is reflashed
with that same key. Restart the helper only after the upload finishes.

## Configure Arduino

1. Install Arduino IDE 2 from the
   [official Arduino download page](https://www.arduino.cc/en/software).
2. Open **Tools → Board → Boards Manager**, search for `esp32`, choose
   **esp32 by Espressif Systems**, select version **3.3.11**, and click
   **Install**. This guide's firmware and settings were tested with ESP32
   Arduino core 3.3.11.

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

### Option A: Using `arduino-cli` (Command Line)

You can compile and flash the firmware directly using `arduino-cli`:

```bash
# Compile firmware
arduino-cli compile --fqbn esp32:esp32:esp32s3:CDCOnBoot=cdc,UploadMode=cdc firmware/tiny_touch_keyboard

# Flash firmware (Windows COM port example)
arduino-cli upload -p COM3 --fqbn esp32:esp32:esp32s3:CDCOnBoot=cdc,UploadMode=cdc firmware/tiny_touch_keyboard

# Flash firmware (macOS device example)
arduino-cli upload -p /dev/cu.usbmodem101 --fqbn esp32:esp32:esp32s3:CDCOnBoot=cdc,UploadMode=cdc firmware/tiny_touch_keyboard
```

### Option B: Using Arduino IDE GUI

1. In Arduino IDE, click **Verify**. Fix any reported error before continuing.
2. Click **Upload** and wait for Arduino IDE to report that the upload
   completed.
3. Close Arduino IDE's Serial Monitor if it opened. The helper needs exclusive
   access to the USB CDC serial port.

This is the point where a physical check begins: a successful compile or upload
does not prove that the sensor is wired correctly.

## Start helper and portal

### Windows (1-Click Launcher - Recommended)

Simply double-click **`start_touchpass.bat`** in the project root directory. It automatically launches the helper service and opens `http://127.0.0.1:8787/` in your default browser!

Or run manually via Command Prompt / PowerShell:
```powershell
python run_portal_win.py
```

### macOS / Linux

From the repository root, start the helper. It starts the portal automatically
and listens on your computer's loopback address:

```bash
.venv/bin/python software/macos-helper/tinytouch_helper.py
```

Open [http://127.0.0.1:8787](http://127.0.0.1:8787) in a browser. If more than
one USB CDC device is attached, specify your device port:

```bash
.venv/bin/python software/macos-helper/tinytouch_helper.py --port COM3
```

The helper normally discovers a single USB CDC device itself. Do not run
Arduino Serial Monitor while this command is running, because only one program
can own the serial port at a time.

## First-build checklist

### Automated file checks

- The four `test -f` commands in **Prepare your Mac** each exited with `0`.

### Build checkpoint

- Arduino IDE completed **Verify** and **Upload** without an error.

### Software checkpoint

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

Run the automated quality test gate from the repository root:

```bash
python run_test_gate.py
```

This runs a 4-stage automated gate: syntax compilation check across Python files, complete pytest unit test suite (70 test cases), live Web Portal HTTP & CSRF API verification, and CLI sanity check.

To run individual documentation or protocol tests:

```bash
python -m unittest tests/test_documentation.py
```

It checks that the project guides and approved image assets exist, that local
Markdown links resolve, and that the visible documentation includes the focused
HID and unauthenticated UART safety limits. It does **not** compile firmware,
upload a board, detect a USB device, verify 3.3 V wiring, enroll a finger, or
prove that a real HID action reaches the intended field. Those are the physical
checks in the checklist above.
