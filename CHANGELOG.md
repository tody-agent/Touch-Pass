# Changelog

All notable TouchPass Desktop releases are documented here. Version numbers follow semantic versioning while the desktop app is pre-1.0.

## [0.2.1] - 2026-08-21

### Added

- **Unified Categorized Shortcut Presets Library (Option A)**: Integrated structured, categorized preset selector in `ActionPane` spanning AI Agent Approvals (`y/n + Enter`, Antigravity Command Palette), OS & Window Management (Lock Screen, Task View, Show Desktop), Developer Workflows (Git Commit/Push, Dev Server, Terminal Clearing), and Security credentials.
- **Real-Time Preset Search & Filtering**: Instant filter chips and keyword search across action presets with 1-click preview and insertion.
- **Luminous Titan Key Visual Identity**: Master 1024x1024 high-resolution icon, scalable vector SVG, tray icons, and native application bundles (`.ico`, `.icns`, `.png`).
- **Apple macOS / iOS Design Tokens**: Frosted glass `TitleBar` with live connection status pill badge, 1Password-style list items in `HandMap`, Apple-style toggle switch (`AppleSwitch.svelte`), and fluid micro-interactions.
- **Scroll Containment & UI Layout Refinement**: Isolated scroll zones (`overscroll-behavior: contain`) for `HandMap` and `ActionPane` with customized slim scrollbars.
- **Windows Developer & Workspace Optimizations**: Automated workspace cleanup script (`scripts/clean-workspace.ps1`) and Windows Defender exclusion helper (`scripts/add-defender-exclusion.ps1`) for optimized build speeds.
- **Full Tri-Lingual Internationalization**: Complete Vietnamese, English, and Simplified Chinese localization for all shortcut categories, preset descriptions, and action types.

### Changed

- Replaced legacy flat radio action selector with interactive card-based categorized catalog.
- Enhanced `ActionPane` responsive container behavior with smooth transitions and active action highlighting.

## [0.2.0] - 2026-08-17

### Added

- PIV native smart-card architecture (NIST SP 800-73-4 / USB CCID) for operating system pre-boot and login authentication.
- Zero OS password storage in firmware: asymmetric on-chip key generation (`9A`/`9E` slots) gated by physical Match-on-Device ZW101 fingerprint verification.
- macOS Apple Silicon FileVault pre-boot unlock and Apple T2 / Intel login window authentication support via `sc_auth` pairing scripts (`software/scripts/macos_pair_smartcard.sh`).
- Windows Active Directory Kerberos PKINIT and Microsoft Entra Certificate-Based Authentication (CBA) smart-card support with PowerShell enrollment tooling (`software/scripts/windows_cert_enroll.ps1`).
- Secure first-use configuration for unified firmware: authenticated `CONFIG_UNLOCK`, `HID_KEY`, then `MODE hid`.
- Automatic HID setup before first fingerprint enrollment, plus Configure, Repair, and Recovery controls in Settings.
- Durable pairing-key staging and recovery after an interrupted setup; the prior live key is retained until the device acknowledges the replacement.
- Windows NSIS installer, macOS Apple Silicon and Intel builds, and Linux deb/AppImage release artifacts with SHA-256 checksums.
- English and Vietnamese desktop installation, PIV provisioning, FileVault, and first-use guides.

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
