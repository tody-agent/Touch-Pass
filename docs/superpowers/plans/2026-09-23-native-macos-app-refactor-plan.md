# TouchPass Native macOS Application Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the TouchPass host system on macOS from legacy Python scripts and heavy Tauri WebKit wrappers into a lightning-fast, pure native macOS application (`software/macos-native/`) built with Swift 6, SwiftUI, and AppKit.

**Architecture:** A modular native macOS application consisting of:
1. `TouchPassCore`: Dependency-free Swift library for firmware line protocol parsing, AES-128-CTR encryption, HMAC-SHA256 signing, and double-touch safety gating.
2. `TouchPassSerial`: Kernel-level `IOKit` event notification engine (`IOServiceAddMatchingNotification`) paired with an async serial stream (`AsyncStream<FirmwareLine>`), achieving zero-CPU idle device monitoring.
3. `TouchPassStorage`: Native Apple Keychain integration (`Security.framework`) with optional Touch ID biometrics gate, paired with atomic JSON profile persistence and migration from legacy `tinyTouch` configurations.
4. `TouchPassSmartCard`: `CryptoTokenKit` integration for inspecting PIV token slots and managing `sc_auth` pairing for FileVault pre-boot login.
5. `TouchPassUI` & `TouchPassApp`: Native SwiftUI application with an interactive 10-finger vector HandMap, categorized preset library (AI approvals, window management, developer macros), step-by-step biometric enrollment wizard, and lightweight `MenuBarExtra` running at < 15MB RAM.

**Tech Stack:** Swift 6.0, SwiftUI, AppKit, CryptoKit, CommonCrypto, Security, CryptoTokenKit, IOKit, ServiceManagement, Swift Testing / XCTest.

---

## Global Constraints

- Target directory for native macOS app: `software/macos-native/`
- Zero modification to existing Windows/Linux Tauri desktop app (`software/desktop-app/`) during initial implementation.
- Wire protocol compatibility: Must strictly adhere to the ESP32-S3 firmware protocol specification:
  - Baud rate: `115,200`
  - Sensor event: `EV <nonce> <counter> <slot> <score> <mac>`
  - Action responses: `ARM <nonce> <slot> <expires_ms> <mac>` and `ACT <nonce> <iv_hex> <ciphertext_hex> <mac>`
  - Action bytecode format: `[0x01, step_count, op_bytes...]`
- Memory & Performance Target: Idle RAM < 20MB, idle CPU < 0.1%, device hotplug latency < 150ms.

---

### Task 1: Swift Package & Project Scaffolding

**Files:**
- Create: `software/macos-native/Package.swift`
- Create: `software/macos-native/Sources/TouchPassCore/TouchPassCore.swift`
- Create: `software/macos-native/Sources/TouchPassSerial/TouchPassSerial.swift`
- Create: `software/macos-native/Sources/TouchPassStorage/TouchPassStorage.swift`
- Create: `software/macos-native/Sources/TouchPassSmartCard/TouchPassSmartCard.swift`
- Create: `software/macos-native/Sources/TouchPassApp/TouchPassApp.swift`
- Create: `software/macos-native/Tests/TouchPassCoreTests/TouchPassCoreTests.swift`

**Interfaces:**
- Consumes: Standard Apple SDKs (macOS 14.0+)
- Produces: Build-ready multi-target Swift Package with modular separation of concerns.

- [ ] **Step 1: Create `software/macos-native/Package.swift`**

```swift
// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "TouchPassNative",
    platforms: [
        .macOS(.v14)
    ],
    products: [
        .executable(name: "TouchPassApp", targets: ["TouchPassApp"]),
        .library(name: "TouchPassCore", targets: ["TouchPassCore"]),
        .library(name: "TouchPassSerial", targets: ["TouchPassSerial"]),
        .library(name: "TouchPassStorage", targets: ["TouchPassStorage"]),
        .library(name: "TouchPassSmartCard", targets: ["TouchPassSmartCard"])
    ],
    dependencies: [],
    targets: [
        .target(
            name: "TouchPassCore",
            dependencies: []
        ),
        .target(
            name: "TouchPassSerial",
            dependencies: ["TouchPassCore"]
        ),
        .target(
            name: "TouchPassStorage",
            dependencies: ["TouchPassCore"]
        ),
        .target(
            name: "TouchPassSmartCard",
            dependencies: ["TouchPassCore"]
        ),
        .executableTarget(
            name: "TouchPassApp",
            dependencies: [
                "TouchPassCore",
                "TouchPassSerial",
                "TouchPassStorage",
                "TouchPassSmartCard"
            ]
        ),
        .testTarget(
            name: "TouchPassCoreTests",
            dependencies: ["TouchPassCore"]
        )
    ]
)
```

- [ ] **Step 2: Initialize module stubs and verify compilation**

Create directory structure:
```bash
mkdir -p software/macos-native/Sources/TouchPassCore
mkdir -p software/macos-native/Sources/TouchPassSerial
mkdir -p software/macos-native/Sources/TouchPassStorage
mkdir -p software/macos-native/Sources/TouchPassSmartCard
mkdir -p software/macos-native/Sources/TouchPassApp
mkdir -p software/macos-native/Tests/TouchPassCoreTests
```

Verify Swift build:
Run: `swift build --package-path software/macos-native`
Expected: `Build complete!` with zero warnings.

- [ ] **Step 3: Commit scaffolding**

```bash
git add software/macos-native/
git commit -m "feat(macos): scaffold native Swift package structure for TouchPass"
```

---

### Task 2: Core Cryptography Engine (`TouchPassCore/Crypto.swift`)

**Files:**
- Create: `software/macos-native/Sources/TouchPassCore/Crypto.swift`
- Create: `software/macos-native/Tests/TouchPassCoreTests/CryptoTests.swift`

**Interfaces:**
- Consumes: Apple `CryptoKit` and `CommonCrypto`
- Produces: `HMAC-SHA256` signer, `AES-128-CTR` stream cipher, session key derivation, and nonce replay filter.

- [ ] **Step 1: Write unit tests for crypto operations matching firmware vectors**

Test cases in `CryptoTests.swift`:
1. Known test vector for HMAC-SHA256: key `"41555448454e5449434154494f4e5f4b45595f54494e59544f5543485f323032"`, message `"SESSION|NONCE123"`.
2. AES-128-CTR round-trip encryption & decryption for arbitrary action payload.
3. Nonce replay filter: verifying that an incoming nonce within a 64-item sliding window is detected and rejected.

- [ ] **Step 2: Implement `Crypto.swift`**

```swift
import Foundation
import CryptoKit
import CommonCrypto

public enum TouchPassCryptoError: Error, Equatable {
    case encryptionFailed(Int32)
    case decryptionFailed(Int32)
    case invalidKeyLength
    case replayDetected
}

public struct TouchPassCrypto {
    public static func hmacSHA256Hex(key: Data, message: String) -> String {
        let symmetricKey = SymmetricKey(data: key)
        let mac = HMAC<SHA256>.authenticationCode(for: Data(message.utf8), using: symmetricKey)
        return mac.map { String(format: "%02x", $0) }.joined()
    }

    public static func deriveSessionKey(pairingKey: Data, nonce: String) -> Data {
        let message = "SESSION|\(nonce)"
        let symmetricKey = SymmetricKey(data: pairingKey)
        let mac = HMAC<SHA256>.authenticationCode(for: Data(message.utf8), using: symmetricKey)
        return Data(mac.prefix(16)) // 128-bit AES key
    }

    public static func encryptAESCTR(key: Data, nonce: String, plaintext: Data) throws -> (ivHex: String, ciphertextHex: String) {
        var ivBytes = [UInt8](repeating: 0, count: 16)
        _ = SecRandomCopyBytes(kSecRandomDefault, 16, &ivBytes)
        let ivData = Data(ivBytes)

        var ciphertext = Data(count: plaintext.count)
        var bytesMoved = 0

        let status = key.withUnsafeBytes { keyBuffer in
            ivData.withUnsafeBytes { ivBuffer in
                plaintext.withUnsafeBytes { plainBuffer in
                    ciphertext.withUnsafeMutableBytes { cipherBuffer in
                        CCCrypt(
                            CCOperation(kCCEncrypt),
                            CCAlgorithm(kCCAlgorithmAES),
                            CCOptions(kCCModeCTR),
                            keyBuffer.baseAddress, key.count,
                            ivBuffer.baseAddress,
                            plainBuffer.baseAddress, plaintext.count,
                            cipherBuffer.baseAddress, cipherBuffer.count,
                            &bytesMoved
                        )
                    }
                }
            }
        }

        guard status == kCCSuccess else {
            throw TouchPassCryptoError.encryptionFailed(status)
        }

        let ivHex = ivData.map { String(format: "%02x", $0) }.joined()
        let cipherHex = ciphertext.map { String(format: "%02x", $0) }.joined()
        return (ivHex, cipherHex)
    }
}

public actor NonceReplayFilter {
    private var seenNonces: [String] = []
    private let capacity: Int

    public init(capacity: Int = 64) {
        self.capacity = capacity
    }

    public func validateAndRecord(nonce: String) -> Bool {
        if seenNonces.contains(nonce) {
            return false
        }
        seenNonces.append(nonce)
        if seenNonces.count > capacity {
            seenNonces.removeFirst()
        }
        return true
    }
}
```

- [ ] **Step 3: Run crypto tests**

Run: `swift test --package-path software/macos-native --filter CryptoTests`
Expected: PASS (all cryptographic assertions match firmware test vectors).

- [ ] **Step 4: Commit crypto module**

```bash
git add software/macos-native/Sources/TouchPassCore/Crypto.swift software/macos-native/Tests/TouchPassCoreTests/CryptoTests.swift
git commit -m "feat(macos): implement hardware-compatible HMAC-SHA256 and AES-CTR crypto engine"
```

---

### Task 3: Firmware Protocol State Machine & Action Encoding

**Files:**
- Create: `software/macos-native/Sources/TouchPassCore/Protocol.swift`
- Create: `software/macos-native/Sources/TouchPassCore/ActionEncoder.swift`
- Create: `software/macos-native/Sources/TouchPassCore/TriggerGate.swift`
- Create: `software/macos-native/Tests/TouchPassCoreTests/ProtocolTests.swift`

**Interfaces:**
- Consumes: Firmware ASCII line streams
- Produces: Typed `FirmwareLine` enums, action bytecode generation, and double-touch confirmation evaluation.

- [ ] **Step 1: Write unit tests for protocol parsing and action serialization**

Test cases in `ProtocolTests.swift`:
1. `OK STATUS mode=hid sensor=ok fingerprints=3 hid_key=configured keys=nvs` parses to `FirmwareLine.status(...)`.
2. `EV <nonce> <counter> <slot> <score> <mac>` parses to `FirmwareLine.event(...)`.
3. `encodeAction` produces correct bytecode for `aiAccept` (`[0x01, 2, 0x01, 1, 0x79, 0x02, 0, 0x28]`).
4. `TriggerGate` returns `.armed` on first touch and `.execute` on second touch within 3.0s window.

- [ ] **Step 2: Implement `Protocol.swift`, `ActionEncoder.swift`, and `TriggerGate.swift`**

Implement:
- `FirmwareLine`: Enum supporting `.status`, `.prompt`, `.configUnlockOk`, `.hidKeyOk`, `.modeOk`, `.enrollOk`, `.enrollErr`, `.deleteOk`, `.event(SensorEvent)`, `.unknown`.
- `ActionEncoder`: Supports `aiAccept`, `password`, `enter`, `escape`, `custom(payload)`.
- `TriggerGate`: Thread-safe gate with configurable expiration window (default: 3.0s).

- [ ] **Step 3: Run protocol test suite**

Run: `swift test --package-path software/macos-native --filter ProtocolTests`
Expected: PASS.

- [ ] **Step 4: Commit protocol module**

```bash
git add software/macos-native/Sources/TouchPassCore/
git commit -m "feat(macos): implement firmware protocol line parser and action bytecode encoder"
```

---

### Task 4: Native IOKit Hotplug Monitor & Async Serial Engine

**Files:**
- Create: `software/macos-native/Sources/TouchPassSerial/IOKitHotplugMonitor.swift`
- Create: `software/macos-native/Sources/TouchPassSerial/AsyncSerialPort.swift`
- Create: `software/macos-native/Sources/TouchPassSerial/SerialManager.swift`
- Create: `software/macos-native/Tests/TouchPassCoreTests/SerialMockTests.swift`

**Interfaces:**
- Consumes: `IOKit`, POSIX serial APIs (`termios`, `open`, `read`, `write`, `tcsetattr`)
- Produces: Asynchronous stream of connected TouchPass devices and parsed protocol lines with zero idle polling.

- [ ] **Step 1: Implement `IOKitHotplugMonitor.swift`**

```swift
import Foundation
import IOKit
import IOKit.usb
import IOKit.serial

public enum DeviceState: Sendable {
    case runtime(path: String, serialNumber: String?)
    case bootloader(path: String)
    case disconnected
}

public final class IOKitHotplugMonitor: @unchecked Sendable {
    private var notifyPort: IONotificationPortRef?
    private var addedIterator: io_iterator_t = 0
    private var removedIterator: io_iterator_t = 0
    private let queue = DispatchQueue(label: "com.touchpass.hotplug", qos: .utility)
    public var onDeviceChange: (@Sendable (DeviceState) -> Void)?

    public init() {}

    public func startMonitoring() {
        queue.async { [weak self] in
            guard let self else { return }
            self.notifyPort = IONotificationPortCreate(kIOMainPortDefault)
            let runLoopSource = IONotificationPortGetRunLoopSource(self.notifyPort).takeUnretainedValue()
            CFRunLoopAddSource(CFRunLoopGetCurrent(), runLoopSource, .defaultMode)

            let matchingDict = IOServiceMatching(kIOSerialBSDServiceValue) as NSMutableDictionary
            matchingDict[kIOSerialBSDTypeKey] = kIOSerialBSDAllTypes

            // Register matching notifications for USB Serial devices
            IOServiceAddMatchingNotification(
                self.notifyPort,
                kIOMatchedNotification,
                matchingDict,
                { refcon, iterator in
                    let monitor = Unmanaged<IOKitHotplugMonitor>.fromOpaque(refcon!).takeUnretainedValue()
                    monitor.handleDevicesChanged(iterator: iterator, isArrival: true)
                },
                Unmanaged.passUnretained(self).toOpaque(),
                &self.addedIterator
            )

            self.handleDevicesChanged(iterator: self.addedIterator, isArrival: true)
            CFRunLoopRun()
        }
    }

    private func handleDevicesChanged(iterator: io_iterator_t, isArrival: Bool) {
        var service = IOIteratorNext(iterator)
        while service != 0 {
            if let bsdPath = getBSDPath(service: service) {
                let isBootloader = checkIfBootloader(service: service)
                let state: DeviceState = isBootloader ? .bootloader(path: bsdPath) : .runtime(path: bsdPath, serialNumber: nil)
                onDeviceChange?(state)
            }
            IOObjectRelease(service)
            service = IOIteratorNext(iterator)
        }
    }

    private func getBSDPath(service: io_object_t) -> String? {
        guard let pathCF = IORegistryEntryCreateCFProperty(service, kIOCalloutDeviceKey as CFString, kCFAllocatorDefault, 0) else {
            return nil
        }
        return pathCF.takeRetainedValue() as? String
    }

    private func checkIfBootloader(service: io_object_t) -> Bool {
        // Inspect VID 0x303A & PID 0x1001 vs 0x4001
        return false
    }
}
```

- [ ] **Step 2: Implement non-blocking `AsyncSerialPort.swift`**

Implement POSIX termios configuration at 115,200 baud, 8N1 with an `AsyncStream<String>` yielding newline-terminated firmware strings.

- [ ] **Step 3: Verify serial mock tests**

Run: `swift test --package-path software/macos-native --filter SerialMockTests`
Expected: PASS.

- [ ] **Step 4: Commit serial engine**

```bash
git add software/macos-native/Sources/TouchPassSerial/
git commit -m "feat(macos): implement zero-polling IOKit device hotplug and async serial stream"
```

---

### Task 5: Native Apple Keychain & Profile Store

**Files:**
- Create: `software/macos-native/Sources/TouchPassStorage/KeychainManager.swift`
- Create: `software/macos-native/Sources/TouchPassStorage/ProfileStore.swift`
- Create: `software/macos-native/Sources/TouchPassStorage/MigrationAdapter.swift`
- Create: `software/macos-native/Tests/TouchPassCoreTests/StorageTests.swift`

**Interfaces:**
- Consumes: macOS `Security.framework`, `LocalAuthentication.framework`
- Produces: Secure credential access with optional Touch ID gating, atomic JSON profile store, and automatic migration from legacy `tinyTouch` directory.

- [ ] **Step 1: Write unit tests for Keychain operations and profile migration**

Test cases in `StorageTests.swift`:
1. Save and retrieve credentials for service `com.touchpass.desktop`.
2. Fallback read from legacy `tinyTouch` Keychain service.
3. Migrate `~/Library/Application Support/tinyTouch/profiles.json` into schema v2 format in `~/Library/Application Support/TouchPass/profiles.json`.

- [ ] **Step 2: Implement `KeychainManager.swift` with Touch ID gating**

```swift
import Foundation
import Security
import LocalAuthentication

public struct KeychainManager {
    public static let serviceName = "com.touchpass.desktop"
    public static let legacyServiceName = "tinyTouch"

    public static func savePassword(account: String, secret: String, requireTouchID: Bool = false) throws {
        var accessControl: SecAccessControl?
        if requireTouchID {
            var error: Unmanaged<CFError>?
            accessControl = SecAccessControlCreateWithFlags(
                kCFAllocatorDefault,
                kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
                [.biometryAny, .or, .userPresence],
                &error
            )
        }

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: account,
            kSecValueData as String: Data(secret.utf8),
            kSecAttrAccessControl as String: accessControl as Any
        ]

        SecItemDelete(query as CFDictionary)
        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw NSError(domain: NSOSStatusErrorDomain, code: Int(status))
        }
    }

    public static func getPassword(account: String) throws -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var result: AnyObject?
        var status = SecItemCopyMatching(query as CFDictionary, &result)

        // Try legacy service if not found
        if status == errSecItemNotFound {
            var legacyQuery = query
            legacyQuery[kSecAttrService as String] = legacyServiceName
            status = SecItemCopyMatching(legacyQuery as CFDictionary, &result)
        }

        guard status == errSecSuccess, let data = result as? Data else {
            return nil
        }
        return String(data: data, encoding: .utf8)
    }
}
```

- [ ] **Step 3: Implement `ProfileStore.swift` and migration adapter**

Ensure full compatibility with the 10 fingerprint slots, double-touch confirmation flags, and categorized presets.

- [ ] **Step 4: Run storage tests**

Run: `swift test --package-path software/macos-native --filter StorageTests`
Expected: PASS.

- [ ] **Step 5: Commit storage module**

```bash
git add software/macos-native/Sources/TouchPassStorage/
git commit -m "feat(macos): implement Apple Keychain manager with Touch ID biometrics gate and profile store"
```

---

### Task 6: CryptoTokenKit & PIV Smart Card Bridge

**Files:**
- Create: `software/macos-native/Sources/TouchPassSmartCard/SmartCardManager.swift`
- Create: `software/macos-native/Sources/TouchPassSmartCard/SmartCardPairingWizard.swift`

**Interfaces:**
- Consumes: `CryptoTokenKit.framework`
- Produces: Real-time PIV card status, slot 9A identity extraction, and automated `sc_auth` pairing for FileVault pre-boot login.

- [ ] **Step 1: Implement `SmartCardManager.swift` using `TKSmartCardSlotManager`**

Observe insertion of TouchPass smart card, read certificate from container `0x5FC105` (slot `9A`), and extract SHA-1/SHA-256 certificate hash.

- [ ] **Step 2: Implement pairing helper**

Provide Swift bridge to verify pairing with current local macOS user account (`sc_auth list <user>`) and automate pairing invocation (`sc_auth pair -u <user> -h <hash>`).

- [ ] **Step 3: Commit smart card module**

```bash
git add software/macos-native/Sources/TouchPassSmartCard/
git commit -m "feat(macos): implement CryptoTokenKit manager for PIV smart card and FileVault pairing"
```

---

### Task 7: SwiftUI Design System & Native HandMap Canvas

**Files:**
- Create: `software/macos-native/Sources/TouchPassApp/UI/DesignSystem/Theme.swift`
- Create: `software/macos-native/Sources/TouchPassApp/UI/HandMap/HandMapView.swift`
- Create: `software/macos-native/Sources/TouchPassApp/UI/HandMap/FingerSlotNode.swift`

**Interfaces:**
- Consumes: SwiftUI, Apple HIG materials (`.ultraThinMaterial`, `VisualEffectView`)
- Produces: 10-finger interactive vector map with live biometric touch ripple animations.

- [ ] **Step 1: Define macOS theme tokens in `Theme.swift`**

Configure authentic dark surfaces (`#0e131f`), subtle borders, SF Symbols 6 icons, and spring animation curves.

- [ ] **Step 2: Build `HandMapView.swift`**

Render left and right hands with 10 interactive biometric finger nodes (Slots 01 to 10). Support selection, status badge indicators (configured / empty), and animated glow pulse when a hardware touch event (`EV`) is received.

- [ ] **Step 3: Commit HandMap UI**

```bash
git add software/macos-native/Sources/TouchPassApp/UI/
git commit -m "feat(macos): implement authentic SwiftUI 10-finger vector HandMap canvas"
```

---

### Task 8: Categorized Presets Library & Action Editor

**Files:**
- Create: `software/macos-native/Sources/TouchPassApp/UI/Actions/PresetCatalog.swift`
- Create: `software/macos-native/Sources/TouchPassApp/UI/Actions/ActionPaneView.swift`
- Create: `software/macos-native/Sources/TouchPassApp/UI/Actions/ShortcutRecorderView.swift`

**Interfaces:**
- Consumes: `TouchPassStorage.ProfileStore`
- Produces: 1-click preset library organized across 4 categories (AI Agent, macOS Navigation, Developer Automation, Security/Credentials).

- [ ] **Step 1: Define presets catalog matching TouchPass desktop spec**

Include:
- 🤖 **AI Agent**: `ai_accept` (`y + Enter`), `ai_reject` (`n + Enter`), `/compact`, `/plan`, `/grill-me`.
- 🪟 **macOS Navigation**: `Cmd + Tab`, `Cmd + Space` (Spotlight), `Ctrl + ↑` (Mission Control), `Cmd + Shift + 4`.
- 💻 **Terminal Automation**: `git status`, `git diff`, `clear`, `docker ps`.
- 🔒 **Credentials**: Keychain OS password with Touch ID requirement toggle.

- [ ] **Step 2: Implement `ActionPaneView.swift` and `ShortcutRecorderView.swift`**

Create clean macOS inspector panel with toggle switch for double-touch confirmation, secret picker, and live keystroke capture.

- [ ] **Step 3: Commit action editor**

```bash
git add software/macos-native/Sources/TouchPassApp/UI/Actions/
git commit -m "feat(macos): implement categorized preset library and native macOS shortcut recorder"
```

---

### Task 9: Biometric Enrollment Wizard & Diagnostics Sheet

**Files:**
- Create: `software/macos-native/Sources/TouchPassApp/UI/Enrollment/EnrollmentWizardView.swift`
- Create: `software/macos-native/Sources/TouchPassApp/UI/Diagnostics/ConsoleView.swift`

**Interfaces:**
- Consumes: `TouchPassSerial.SerialManager` enrollment state machine
- Produces: Step-by-step interactive enrollment modal with live finger placement instructions and raw UART console.

- [ ] **Step 1: Implement `EnrollmentWizardView.swift`**

Handle 5-stage fingerprint sampling with animated sensor graphics, stage progress bar, and error recovery prompts (e.g. lift and touch again).

- [ ] **Step 2: Implement `ConsoleView.swift`**

Add collapsible raw serial diagnostic monitor displaying bidirectional serial traffic (`STATUS`, `EV`, `ACT`, `ARM`).

- [ ] **Step 3: Commit enrollment wizard**

```bash
git add software/macos-native/Sources/TouchPassApp/UI/Enrollment/ software/macos-native/Sources/TouchPassApp/UI/Diagnostics/
git commit -m "feat(macos): implement 5-stage interactive biometric enrollment wizard and serial monitor"
```

---

### Task 10: Menu Bar Extra, App Lifecycle & Launch-at-Login

**Files:**
- Create: `software/macos-native/Sources/TouchPassApp/TouchPassApp.swift`
- Create: `software/macos-native/Sources/TouchPassApp/UI/MenuBar/MenuBarView.swift`
- Create: `software/macos-native/Sources/TouchPassApp/Lifecycle/LaunchAtLoginManager.swift`

**Interfaces:**
- Consumes: SwiftUI `MenuBarExtra`, `ServiceManagement.SMAppService`
- Produces: Always-resident Menu Bar utility with dynamic status glyph, quick controls, and zero-overhead background operation.

- [ ] **Step 1: Implement `TouchPassApp.swift`**

```swift
import SwiftUI

@main
struct TouchPassApp: App {
    @StateObject private var coordinator = AppCoordinator()

    var body: some Scene {
        MenuBarExtra("TouchPass", systemImage: coordinator.menuBarIcon) {
            MenuBarView(coordinator: coordinator)
        }
        .menuBarExtraStyle(.window)

        Window("TouchPass Dashboard", id: "main-window") {
            MainWindowView(coordinator: coordinator)
                .frame(minWidth: 900, minHeight: 580)
        }
        .windowStyle(.hiddenTitleBar)
        .windowResizability(.contentMinSize)

        Settings {
            SettingsView(coordinator: coordinator)
        }
    }
}
```

- [ ] **Step 2: Implement `LaunchAtLoginManager.swift` using `SMAppService.mainApp`**

Provide one-click toggle in Settings to register TouchPass in macOS Login Items via official Apple API without legacy plist scripting.

- [ ] **Step 3: Commit app lifecycle**

```bash
git add software/macos-native/Sources/TouchPassApp/
git commit -m "feat(macos): implement MenuBarExtra scene and modern SMAppService launch-at-login"
```

---

### Task 11: End-to-End Build Pipeline, Test Gates & DMG Packaging

**Files:**
- Create: `software/macos-native/scripts/build-app.sh`
- Create: `software/macos-native/scripts/package-dmg.sh`
- Modify: `run_test_gate.py`

**Interfaces:**
- Consumes: Xcode command-line tools, `codesign`, `create-dmg` / `hdiutil`
- Produces: Universal 2 signed `TouchPass.app` and distribution `.dmg`.

- [ ] **Step 1: Create `build-app.sh`**

Script to compile Universal 2 binary (`x86_64` + `arm64`) using `xcodebuild` or `swift build -c release --arch arm64 --arch x86_64`, assemble the `.app` bundle, inject `Info.plist`, entitlements, and AppIcon assets.

- [ ] **Step 2: Create `package-dmg.sh`**

Script generating a polished drag-and-drop macOS disk image with custom background and symlink to `/Applications`.

- [ ] **Step 3: Integrate into `run_test_gate.py`**

Add macOS native build verification gate when executed on Darwin platform.

- [ ] **Step 4: Commit build and packaging scripts**

```bash
git add software/macos-native/scripts/ run_test_gate.py
git commit -m "chore(macos): add universal binary build, test gate, and DMG packaging scripts"
```

---

## Acceptance Criteria & Verification Evidence

1. **Memory & CPU Verification**:
   - `ps aux | grep TouchPassApp` reports `< 20MB RSS` during active background monitoring.
   - `sample TouchPassApp 2` shows `0.0% CPU` when no serial events are occurring (verifying IOKit zero-polling).
2. **Protocol Compliance**:
   - `swift test --package-path software/macos-native` passes all test suites: `CryptoTests`, `ProtocolTests`, `StorageTests`, `SerialMockTests`.
3. **Hardware End-to-End Verification**:
   - Tapping enrolled Index Finger sends `y + Enter` into active focused terminal.
   - Touching Middle Finger unlocks Keychain-stored password payload.
   - Tapping an action requiring confirmation twice within 3.0s executes action; single touch expires safely.
4. **Smart Card & PIV Pairing**:
   - `sc_auth list <user>` shows paired TouchPass identity.
   - FileVault pre-boot login tile responds to biometric touch.
5. **Universal Binary Verification**:
   - `lipo -info TouchPass.app/Contents/MacOS/TouchPassApp` outputs: `Architectures in the fat file: x86_64 arm64`.
