# Changelog

All notable TouchPass Desktop releases are documented here. Version numbers follow semantic versioning while the desktop app is pre-1.0.

## [0.2.0] - 2026-08-16

### Added

- Secure first-use configuration for unified firmware: authenticated `CONFIG_UNLOCK`, `HID_KEY`, then `MODE hid`.
- Automatic HID setup before first fingerprint enrollment, plus Configure, Repair, and Recovery controls in Settings.
- Durable pairing-key staging and recovery after an interrupted setup; the prior live key is retained until the device acknowledges the replacement.
- Windows NSIS installer, macOS Apple Silicon and Intel builds, and Linux deb/AppImage release artifacts with SHA-256 checksums.
- English and Vietnamese desktop installation and first-use guides.

### Changed

- Redesigned the desktop workspace for finger selection, action editing, and device inspection in one window.
- Added Vietnamese, English, and Simplified Chinese interface support with native tray localization.
- Treat unified `keys=unconfigured` and `keys=nvs` as configurable; legacy `keys=compiled` firmware stays firmware-managed.

### Fixed

- Prevented a failed HID repair from overwriting the desktop pairing key before fingerprint authorization.
- Prevented stale `MODE` responses from falsely reporting a ready device.
- Improved HID configuration errors for authorization, timeout, serial disconnect, and persistence failures.

## [0.1.0] - 2026-08-15

- First public TouchPass Desktop release for Windows, macOS, and Linux.
