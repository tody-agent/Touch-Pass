# TouchPass Desktop App

Native cross-platform TouchPass desktop application built with Tauri v2, Svelte 5, Tailwind CSS v4, and a Rust IPC backend.

## Current Surface

- Focus-first, resizable native window with a full-width 10-finger map and action editor.
- Settings and help are accessible modal sheets; settings includes live locale switching, device diagnostics, and Tauri autostart.
- Vietnamese, English, and Simplified Chinese UI with operating-system locale detection and Vietnamese fallback.
- Closing the main window hides TouchPass to the system tray; only the localized tray Quit action ends the process.
- Profile persistence uses semantic schema v2 and migrates/backups legacy v1 profiles without persisting translated labels.
- Rust backend commands:
  - `get_app_status`
  - `list_finger_profiles`
  - `save_finger_profile`
  - `reset_finger_profile`
  - `start_enrollment`
  - `get_app_preferences`
  - `set_app_locale`
- Rust events:
  - `device_status_change`
  - `enroll_step_progress`
  - `finger_touch_event`

## Local Verification

```powershell
cd software/desktop-app/src-tauri
cargo test --offline
```

Expected result: all Rust unit, integration, and doc tests pass.

Frontend verification requires npm registry access or a warmed npm cache containing Svelte, `@sveltejs/vite-plugin-svelte`, Tailwind v4, Vite, Vitest, and Tauri API packages:

```powershell
cd software/desktop-app
npm install
npm run check
npm test
npm run build
npm run tauri:build
```

Release bundles use platform-specific Tauri configuration: NSIS on Windows,
app/DMG on macOS, and deb/AppImage on Linux. MSI is intentionally not part of the
local Windows target because it requires the optional Windows VBScript/Installer
validation components; CI can add MSI explicitly on a prepared runner if needed.

Run the complete frontend gate with:

```powershell
npm run test:gate
```

## Firmware Smoke Test

The ESP32-S3 firmware image used for the current smoke pass is:

```text
web/flasher/firmware/bootloader.bin
web/flasher/firmware/partition-table.bin
web/flasher/firmware/tiny_touch_smartcard.bin
```

Verified flash command:

```powershell
& "$env:LOCALAPPDATA\Arduino15\packages\esp32\tools\esptool_py\5.3.1\esptool.exe" --chip esp32s3 -p COM3 -b 460800 write-flash --flash-mode dio --flash-freq 80m --flash-size 4MB 0x0 web\flasher\firmware\bootloader.bin 0x8000 web\flasher\firmware\partition-table.bin 0x10000 web\flasher\firmware\tiny_touch_smartcard.bin
```

The flash pass wrote and verified all three images on ESP32-S3 COM3. If `PING` or `STATUS` does not answer after flashing, check whether Windows still shows the ROM bootloader device:

```powershell
pnputil /enum-devices /connected /class Ports
```

`USB\VID_303A&PID_1001... USB Serial Device (COM3)` means the board is still in ESP32-S3 USB-Serial/JTAG bootloader mode. Release BOOT/IO0, press RESET, or replug the board so it re-enumerates as the app's TinyUSB composite device (`VID_303A&PID_4001`), then retry:

```powershell
$port = [System.IO.Ports.SerialPort]::new("COM3",115200)
$port.Open()
$port.Write("STATUS`r`n")
$port.ReadLine()
$port.Close()
```

Or run the included smoke script:

```powershell
powershell -ExecutionPolicy Bypass -File software\desktop-app\scripts\check-device-status.ps1 -Port COM3
```

If the script prints `BOOTLOADER_MODE COM3 VID_303A PID_1001`, flashing has access to
the ROM loader but the board has not booted the application. Release BOOT/IO0, press
RESET once, or replug the board without holding BOOT, then run the script again. A
runtime firmware port should enumerate as `VID_303A&PID_4001` and answer `OK STATUS`.

For a lower-level boot strap diagnosis:

```powershell
powershell -ExecutionPolicy Bypass -File software\desktop-app\scripts\diagnose-esp32-boot-mode.ps1 -Port COM3
```

`BOOT_MODE_DOWNLOAD strap=0x00000023 low_nibble=0x3` means the ESP32-S3 is
sampling its strap pins as download mode after reset, so the next action is physical:
release BOOT/IO0 and reset/replug until the low nibble is `0x4` or `0x8..0xf`.
