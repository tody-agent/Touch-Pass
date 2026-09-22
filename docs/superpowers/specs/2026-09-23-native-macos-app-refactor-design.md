# TouchPass Native macOS Application Refactor Design Specification

## 1. Executive Summary

TouchPass converts hardware biometric touch on an ESP32-S3 microcontroller into physical USB HID keyboard superpowers and PIV Smart Card authentication for AI agentic workflows (Claude Code, Cursor, Antigravity, OpenCode).

The current desktop ecosystem comprises three fragmented host components:
1. **Legacy Python Helper & CLI** (`software/macos-helper/`, `tinytouch`): Requires Python 3, venv, `pyserial`, ctypes wrappers around `libcommonCrypto.dylib`, and manual `launchd` plist injection.
2. **Intermediate Rust Helper** (`software/rust-helper/`): Axum HTTP daemon with serialport and keyring.
3. **Cross-Platform Desktop App** (`software/desktop-app/`): Built with Tauri v2 (Rust + Svelte 5 + WebKit). On macOS, it incurs a ~120MB+ RAM overhead from WebKit, polls serial ports continuously every 750ms, lacks a native Menu Bar Extra, approximates Apple styling through CSS glassmorphism, and cannot directly leverage Apple-native frameworks (`CryptoTokenKit`, `LocalAuthentication`, `IOKit`, `ServiceManagement`).

This specification defines the architectural blueprint to refactor the macOS experience into a **pure native macOS application** (`software/macos-native/`) built with **Swift 6**, **SwiftUI**, and **AppKit**.

### Key Architectural Objectives:
- **Ultra-Lightweight Menu Bar & Background Agent**: Low-profile Menu Bar Extra running at < 15MB RAM and 0.0% idle CPU.
- **Zero-Polling USB Hotplug (IOKit)**: Asynchronous hardware lifecycle driven by `IOServiceAddMatchingNotification`, eliminating active loop polling.
- **Biometric Keychain Protection**: Apple `Security.framework` credential storage gated by Touch ID / Secure Enclave (`kSecAccessControlBiometryAny`) before privileged password payloads are unsealed.
- **Native Smart Card & FileVault Integration**: Direct `CryptoTokenKit` (`TKSmartCardSlotManager`) monitoring and seamless pairing with macOS user accounts and FileVault pre-boot login.
- **Authentic Apple HIG & Liquid Glass UI**: SwiftUI layout with native materials (`.ultraThinMaterial`), SF Symbols 6, interactive vector Hand Map, categorized shortcut preset catalog, and step-by-step biometric enrollment wizard.
- **Frictionless Migration**: Automatic import and migration of existing v1/v2 profiles and legacy `tinyTouch` Keychain items.

---

## 2. Target Platform & Environment

| Parameter | Specification |
| :--- | :--- |
| **OS Requirements** | macOS 14.0 (Sonoma), macOS 15.0 (Sequoia), macOS 26+ |
| **Architectures** | Universal 2 Binary (Apple Silicon `arm64` Native + Intel `x86_64`) |
| **Language & Toolchain** | Swift 6.0+, Xcode 16.0+, Swift Package Manager |
| **UI Framework** | SwiftUI + AppKit integration (`NSStatusItem`, `NSVisualEffectView`) |
| **Concurrency** | Modern Swift Concurrency (`actor`, `AsyncStream`, `TaskGroup`) |
| **System Frameworks** | `IOKit`, `CryptoKit`, `CommonCrypto`, `Security`, `CryptoTokenKit`, `LocalAuthentication`, `ServiceManagement` |

---

## 3. High-Level System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        TouchPass.app (Swift 6)                         │
│                                                                        │
│  ┌───────────────────────┐                  ┌───────────────────────┐  │
│  │   MenuBarExtra View   │                  │  Main SwiftUI Window  │  │
│  │  - Status & Hotplug   │                  │  - 10-Finger HandMap  │  │
│  │  - Slot Quick Glance  │                  │  - Action Preset Pane │  │
│  │  - Pause/Resume Gate  │                  │  - Enrollment Wizard  │  │
│  │  - Native Settings    │                  │  - SmartCard / PIV UI │  │
│  └───────────┬───────────┘                  └───────────┬───────────┘  │
│              └───────────────────┬──────────────────────┘              │
│                                  ▼                                     │
│                  ┌───────────────────────────────┐                     │
│                  │     AppCoordinator (Actor)    │                     │
│                  └───────────────┬───────────────┘                     │
│                                  │                                     │
│         ┌────────────────────────┼────────────────────────┐            │
│         ▼                        ▼                        ▼            │
│  ┌───────────────┐        ┌───────────────┐        ┌───────────────┐   │
│  │TouchPassSerial│        │TouchPassCore  │        │TouchPassStore │   │
│  │- IOKit Hotplug│        │- Protocol FSM │        │- Keychain     │   │
│  │- Async Stream │        │- CryptoKit    │        │  (Touch ID)   │   │
│  │- Baud 115,200 │        │- Trigger Gate │        │- JSON v2      │   │
│  └──────┬────────┘        └──────┬────────┘        └───────────────┘   │
└─────────┼────────────────────────┼─────────────────────────────────────┘
          ▼                        │
 ┌───────────────────┐             │ (HMAC-SHA256 & AES-CTR Session)
 │ ESP32-S3 Hardware │ ◄───────────┘
 │ - USB CDC (Serial)│
 │ - USB HID (Keys)  │
 │ - PIV Smart Card  │
 └───────────────────┘
```

---

## 4. Module Specifications

### 4.1 `TouchPassCore` (Protocol & Cryptography Engine)

`TouchPassCore` is a standalone, dependency-free Swift library responsible for all cryptographic operations, packet encoding, and line-based firmware protocol parsing.

#### A. Cryptographic Primitives
- **HMAC-SHA256**: Uses Apple `CryptoKit.HMAC<SHA256>` for verifying incoming sensor events (`EV`) and signing responses (`ARM`, `ACT`).
- **AES-128-CTR**: Implemented via `CommonCrypto` (`CCCryptorCreateWithMode`, `kCCModeCTR`, `kCCAlgorithmAES`).
- **Session Key Derivation**: Derives session key using `HMAC<SHA256>(key: pairingKey, data: "SESSION|" + nonce)`.
- **Nonce Replay Guard**: Sliding window buffer of the last 64 observed nonces to thwart replay attacks.

#### B. Protocol State Machine
Firmware command set and responses handled:
- `STATUS` -> parses mode, sensor health, finger count, `hid_key` status (`configured` / `unconfigured`), key storage (`nvs`).
- `MODE <hid|piv>` -> switches USB device profile.
- `CONFIG_UNLOCK <challenge_response>` -> unlocks provisioning mode.
- `HID_KEY <hex_key>` -> writes 32-byte shared pairing key to ESP32 NVS.
- `ENROLL <slot>` / `DELETE <slot>` -> biometric enrollment and deletion stages.
- `EV <nonce> <counter> <slot> <score> <mac>`:
  1. Validates MAC signature against local pairing key.
  2. Resolves slot profile from `TouchPassStore`.
  3. Checks `TriggerGate` (double-touch within 3.0s confirmation window for non-password actions).
  4. Returns `ARM` (if waiting for 2nd touch) or `ACT` (encrypted payload with action bytecode).

#### C. Action Bytecode Encoding
Byte format matching firmware specification v1:
- Header: `[0x01, step_count]`
- Opcodes:
  - `OP_TEXT (0x01)`: `[0x01, len, bytes...]`
  - `OP_KEY (0x02)`: `[0x02, modifier_bitmask, hid_keycode]`
  - `OP_DELAY (0x03)`: `[0x03, ms_high, ms_low]`

---

### 4.2 `TouchPassSerial` (IOKit Hotplug & Async Serial Engine)

Replaces the 750ms polling loop in Tauri with kernel-level IOKit event notifications.

#### A. Zero-Polling Device Discovery (`IOKitHotplugMonitor`)
- Subscribes to matching notifications for `kIOUSBDeviceClassName` and `kIOSerialBSDServiceValue` with:
  - Vendor ID: `0x303A` (Espressif Systems)
  - Product ID: `0x4001` (TouchPass TinyUSB Composite) or `0x1001` (ESP32-S3 Bootloader)
- When a matching device appears or disappears, the OS invokes an `IONotificationPort` callback on a dedicated `DispatchQueue`.
- CPU consumption while waiting for device: **0.0%**.

#### B. Async Serial Port Reader & Writer (`AsyncSerialPort`)
- Opens `/dev/cu.usbmodem*` with standard termios settings (115,200 baud, 8N1, raw mode, non-blocking).
- Employs an `AsyncStream<FirmwareLine>` delivering parsed lines directly to Swift concurrency actors.
- Thread-safe writing with command timeout guards (2.0s for routine commands, 120s for enrollment operations).

---

### 4.3 `TouchPassStorage` (Keychain & Profile Store)

#### A. Secure Credential Storage (`KeychainManager`)
- Stores sensitive passwords for slot actions using macOS Keychain Services (`Security.framework`).
- Service Identifier: `com.touchpass.desktop` (with legacy fallback to `tinyTouch`).
- Access Control: Configurable flag allowing users to require Apple Touch ID / Mac password verification (`kSecAccessControlBiometryAny | kSecAccessControlOr | kSecAccessControlUserPresence`) before an action payload is unsealed.

#### B. Profile Persistence (`ProfileStore`)
- Stores configuration in `~/Library/Application Support/TouchPass/profiles.json` using Schema v2.
- Backward compatibility adapter reads legacy profiles from `~/Library/Application Support/tinyTouch/profiles.json` and performs atomic migration.
- Backups created automatically before any write operation (`profiles.backup.json`).

---

### 4.4 `TouchPassSmartCard` (CryptoTokenKit & PIV System Auth)

Bridges TouchPass's USB CCID Smart Card feature directly into macOS without requiring command-line tools.

- **Slot Monitor**: Uses `TKSmartCardSlotManager.default` to track smart card insertion and removal.
- **Identity Reader**: Reads PIV container `0x5FC105` (slot `9A` authentication certificate) and computes SHA-1 / SHA-256 identity hashes.
- **User Pairing Assistant**: Provides an in-app wizard to execute `sc_auth pair -u <user> -h <hash>` via privileged authorization or AppleScript prompt, enabling 1-touch FileVault login and `sudo` privilege escalation.

---

### 4.5 `TouchPassUI` (SwiftUI & AppKit Integration)

#### A. Menu Bar Extra (`TouchPassMenuBar`)
- Always-accessible menu bar item with dynamic status indicator:
  - 🟢 Connected & Armed
  - 🟡 Double-touch confirmation pending
  - 🔴 Device Disconnected / Bootloader Mode
- Quick menu:
  - Device serial and firmware mode toggle (`HID` / `PIV`)
  - Pause/Resume biometric triggers
  - Quick finger trigger review
  - Open Main Dashboard (`Cmd+,` or click)
  - Launch at Login toggle (`SMAppService`)
  - Quit TouchPass (`Cmd+Q`)

#### B. Main Window (`MainWindowView`)
Designed in adherence to Apple Human Interface Guidelines (HIG):
- **TitleBar**: Native toolbar with frosted background, connection status pill, and action shortcuts.
- **HandMap Canvas**: Visual 10-finger interactive map (Left & Right hands) with real-time biometric pulse ripples when fingers are touched.
- **ActionPane**: Unified categorized preset picker:
  - 🤖 **AI Agent Approvals**: `y + Enter`, `n + Enter`, `/compact`, `/plan`, `/grill-me`.
  - 🪟 **macOS Navigation**: `Cmd + Tab`, `Cmd + Space` (Spotlight), `Ctrl + ↑` (Mission Control), `Cmd + Shift + 4` (Screenshot).
  - 💻 **Terminal Automation**: `git status`, `git diff`, `clear`, `docker ps`.
  - 🔒 **Security & Credentials**: Keychain-backed OS password with Touch ID gating.
- **Enrollment Wizard Sheet**: Interactive 5-step biometric enrollment with live pressure guidance, quality score visualization, and completion celebrations.
- **Device Inspector**: Real-time UART serial monitor with raw packet inspector for diagnostics.

---

## 5. Security & Threat Modeling

1. **Local Physical Privilege Separation**: Passwords are never sent in plaintext over serial. Payloads are encrypted with AES-128-CTR using ephemeral per-touch nonces.
2. **Replay Attack Mitigation**: Each sensor event includes a monotonic counter and unique nonce checked against the 64-item sliding window.
3. **Double-Touch Confirmation Gate**: Non-password destructive actions require touching the sensor twice within 3.0 seconds to prevent accidental execution.
4. **App Sandbox & Hardened Runtime**: The native app is packaged with Hardened Runtime and standard entitlements:
   - `com.apple.security.device.usb`: USB device communication.
   - `com.apple.security.device.serial`: Serial port communication.
   - `com.apple.security.smartcard`: CryptoTokenKit smart card observation.
   - `keychain-access-groups`: Access to TouchPass generic passwords.

---

## 6. Migration & Deprecation Strategy

| Phase | Action | Impact |
| :--- | :--- | :--- |
| **Phase 1** | Implement `software/macos-native/` alongside existing desktop app. | Zero impact on existing Windows/Linux Tauri app. |
| **Phase 2** | Add automatic profile & Keychain migration adapter in Swift app. | Seamless upgrade for existing macOS users. |
| **Phase 3** | Package `TouchPass.dmg` for macOS release with Sparkle auto-update. | Modern installation experience. |
| **Phase 4** | Deprecate `software/macos-helper/` (Python) and redirect `tinytouch` CLI to native app IPC or standalone Swift CLI. | Codebase hygiene & zero Python dependency on macOS. |
