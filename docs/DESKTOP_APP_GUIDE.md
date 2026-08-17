# TouchPass Desktop: Install and First Use

This guide covers the Tauri desktop app for the recommended unified TouchPass firmware. Download the release for your operating system from [GitHub Releases](https://github.com/tody-agent/Touch-Pass/releases/latest) and verify the published `checksums.txt` before installing.

## Choose a package

| Platform | Download | Install |
| --- | --- | --- |
| Windows x64 | `TouchPass_*_x64-setup.exe` | Run the NSIS installer. The portable ZIP is also available. |
| macOS Apple Silicon | `TouchPass_*_aarch64.dmg` | Open the DMG and drag TouchPass to Applications. |
| macOS Intel | `TouchPass_*_x64.dmg` | Open the DMG and drag TouchPass to Applications. |
| Debian/Ubuntu x64 | `touchpass_*_amd64.deb` | Run `sudo apt install ./touchpass_*_amd64.deb`. |
| Other Linux x64 | `touchpass_*_amd64.AppImage` | Run `chmod +x touchpass_*.AppImage && ./touchpass_*.AppImage`. |

The macOS builds are not notarized. If macOS blocks the first launch, Control-click **TouchPass**, choose **Open**, then confirm **Open** in the dialog. On Linux, use a desktop session with a Secret Service provider (for example GNOME Keyring or KWallet) to store password actions locally.

## First connection

1. Flash the recommended unified firmware and connect TouchPass with a USB data cable.
2. Start TouchPass. The toolbar should report the device and sensor state; bootloader mode means release BOOT/IO0 and reset or reconnect the board.
3. Open **Settings → Device**. A fresh unified device reports that HID setup is required.
4. Select **Configure HID mode**. If a fingerprint is already enrolled, touch that same finger when TouchPass asks for authorization. A device with no enrolled fingerprints follows its firmware first-setup flow.
5. Wait for **Ready to use**. The desktop stores the pairing key only after the device confirms both the key and HID mode.
6. Return to the workspace, select a finger, choose an action, then select **Save and enroll fingerprint**. Existing fingers use **Save changes**.

## Daily use

- Leave TouchPass running: closing its window sends it to the system tray so automation can continue.
- Use **More** beside an enrolled finger to rescan, test by touching the sensor, disable an action, or remove the fingerprint after confirmation.
- Password actions remain in the operating system credential store. TouchPass does not synchronize fingerprints, passwords, or profiles to a cloud service.
- Change Vietnamese, English, or Simplified Chinese in **Settings → General**. The menu bar and system tray update immediately.

## PIV Smart Card OS Login

For operating system cold boot and pre-login authentication (FileVault on macOS Apple Silicon, Login Window / Sudo on macOS Apple T2/Intel, or Active Directory / Microsoft Entra CBA on Windows):
- **macOS Pairing**: Run `bash software/scripts/macos_pair_smartcard.sh` (or `tinytouch pair`).
- **Windows Pairing**: Run `powershell -ExecutionPolicy Bypass -File software/scripts/windows_cert_enroll.ps1`.
- For full details, see the **[macOS PIV & FileVault Guide](macos-piv-filevault-guide.md)** and **[Windows Smart Card Guide](windows-piv-cba-guide.md)**.

## Troubleshooting

| Symptom | What to do |
| --- | --- |
| Device is not found | Try a USB data cable, reconnect the board, and refresh Device settings. |
| Device shows bootloader | Release BOOT/IO0, press RESET once, then reconnect. |
| Configure HID asks for a touch | Touch an already enrolled finger; this prevents another computer from replacing the pairing key. |
| Setup was interrupted | In **Settings → Device**, choose **Repair HID pairing** and approve the confirmation. |
| Legacy Arduino firmware | It reports `keys=compiled`; TouchPass keeps it firmware-managed and does not offer key repair. Use unified firmware for desktop-managed provisioning. |

For hardware wiring and firmware flashing, see the [Build Guide](BUILD_GUIDE.md). For release history, see the [Changelog](../CHANGELOG.md).
