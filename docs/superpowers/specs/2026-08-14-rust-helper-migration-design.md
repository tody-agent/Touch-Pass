# OpenSpec: TouchPass Rust Helper Migration (software/rust-helper)

- **Date:** 2026-08-14
- **Status:** Approved / Proposed Design
- **Scope:** Complete migration of Python Helper (`software/macos-helper`) to native Rust (`software/rust-helper`) with zero breaking changes to hardware firmware or Web Portal frontend.

---

## 1. Executive Summary & Goals

### 1.1 Objective
Replace the Python Desktop Helper daemon (`tinytouch_helper.py` + `tinytouch_portal.py`) with a high-performance, memory-safe, ultra-lean **Rust daemon** (`software/rust-helper`).

### 1.2 Key Metrics & Success Criteria
| Metric | Python Helper (Current) | Rust Helper (Target) | Optimization Goal |
| :--- | :--- | :--- | :--- |
| **RAM Footprint** | ~80 MB – 120 MB | **~8 MB – 15 MB** | ~85% Reduction 📉 |
| **Binary Size** | ~40 MB (PyInstaller) | **~5 MB – 8 MB** | ~85% Reduction 📉 |
| **Startup Time** | ~2.5 seconds | **< 0.05 seconds** | Instant Start 🚀 |
| **CPU Usage (Idle)**| 0.5% – 1.2% | **< 0.01%** | Near Zero ⚡ |

### 1.3 Co-existence & Migration Strategy
- **Isolation:** All Rust source code and build configs will reside exclusively in `software/rust-helper/`.
- **Zero Impact on Python Code:** `software/macos-helper/` will remain 100% untouched and functional.
- **Switch-over Criteria:** The Python helper will only be decommissioned after the Rust helper passes 100% of protocol, crypto, keyring, and REST API unit/integration tests.

---

## 2. System Architecture & Module Structure

```text
software/rust-helper/
├── Cargo.toml
├── src/
│   ├── main.rs            # CLI args, Logger initialization, Async runtime startup
│   ├── config.rs          # Portal & Helper configuration (Port 8080, Serial Baudrate)
│   ├── serial.rs          # Cross-platform serial port auto-detection & CDC communication
│   ├── crypto.rs          # HMAC-SHA256 challenge-response, AES-256-CTR session key derivation
│   ├── secret_store.rs    # OS Keyring/Keychain wrapper (via `keyring` crate)
│   ├── profile_store.rs   # JSON Profile store & slot management (slots 1..10)
│   ├── protocol.rs        # Action bytecode encoder (OP_TEXT, OP_KEY, OP_DELAY) & EV message parser
│   ├── gate.rs            # TriggerGate double-touch confirmation window logic
│   ├── api.rs             # Axum REST API handlers (/api/status, /api/profiles, /api/admin)
│   ├── static_assets.rs   # Embedded static Web Portal files (serving portal/ index.html, styles.css, app.js)
│   └── tray.rs            # Cross-platform System Tray icon (via `tray-icon` crate)
└── tests/
    ├── test_crypto.rs     # HMAC-SHA256 & AES-CTR test suite
    ├── test_protocol.rs   # EV parsing and bytecode encoding test suite
    ├── test_gate.rs       # TriggerGate double-touch test suite
    └── test_api.rs        # REST API endpoint integration tests
```

---

## 3. Protocol & Cryptography Specifications

### 3.1 Serial Event Message Handling (`EV`)
- **Incoming Format:** `EV <nonce_hex_16> <counter> <slot> <score> <got_mac_hex>`
- **MAC Verification:** `HMAC-SHA256(pairing_key, "EV|<nonce>|<counter>|<slot>|<score>")`
- **Replay Protection:** Replay buffer storing the last 256 nonces.

### 3.2 Response Message Types
1. **`ARM` (Confirmation Window Active):**
   - Format: `ARM <nonce_hex> <slot> <expires_ms> <mac_hex>`
   - MAC: `HMAC-SHA256(pairing_key, "ARM|<nonce>|<slot>|<expires_ms>")`
2. **`ACT` (Action Bytecode Execution):**
   - Format: `ACT <nonce_hex> <iv_hex> <ciphertext_hex> <mac_hex>`
   - Session Key: `HMAC-SHA256(pairing_key, "SESSION|<nonce_hex>")`
   - Encryption: AES-256-CTR (`iv` = 16 random bytes).
   - MAC: `HMAC-SHA256(pairing_key, "ACT|<nonce>|<iv_hex>|<ciphertext_hex>")`

---

## 4. Dependencies & Cargo Specification (`Cargo.toml`)

```toml
[package]
name = "touchpass-helper"
version = "0.1.0"
edition = "2021"

[dependencies]
tokio = { version = "1.38", features = ["full"] }
axum = "0.7"
tower-http = { version = "0.5", features = ["fs", "cors"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
serialport = "4.3"
hmac = "0.12"
sha2 = "0.10"
aes = "0.8"
cipher = { version = "0.4", features = ["block-padding"] }
keyring = "2.1"
rand = "0.8"
tracing = "0.1"
tracing-subscriber = "0.3"
tray-icon = "0.14"
rust-embed = "8.4"
```

---

## 5. REST API & Web Portal Specification

The Rust helper embedded HTTP server runs on `http://127.0.0.1:8080/` and provides:

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/` | `GET` | Serves `portal/index.html` (Apple HIG UI) |
| `/app.js`, `/styles.css` | `GET` | Serves static assets |
| `/api/status` | `GET` | Returns helper status, connected USB CDC device, hardware status |
| `/api/profiles` | `GET` | List all 10 fingerprint profiles |
| `/api/profiles/:slot` | `GET` | Get details for specific slot (1..10) |
| `/api/profiles/:slot` | `POST` | Update label, action, and password secret for slot |
| `/api/profiles/:slot` | `DELETE` | Reset slot profile to default |
| `/api/admin/enroll/:slot` | `POST` | Trigger enrollment flow on hardware via serial |
| `/api/admin/delete/:slot` | `POST` | Delete fingerprint template on hardware |

---

## 6. Implementation Roadmap & Verification Milestones

1. **Milestone 1: Project Setup & Core Modules (`crypto`, `protocol`, `gate`)**
   - Scaffold `software/rust-helper`.
   - Implement `crypto.rs` (HMAC-SHA256, AES-256-CTR, Session key derivation).
   - Implement `protocol.rs` (Action bytecode serialization) and `gate.rs`.
   - Write cargo tests matching existing `test_hmac_aes_crypto_gate.py` behavior.

2. **Milestone 2: Keyring & Profile Store**
   - Implement `secret_store.rs` using `keyring` crate with fallback.
   - Implement `profile_store.rs` with `profiles.json` persistence.

3. **Milestone 3: Serial Communication & Device Auto-Detection**
   - Implement `serial.rs` with CDC port scanning (`VID:PID 303A` ESP32-S3).

4. **Milestone 4: Axum Web Server & Web Portal Embedding**
   - Implement `api.rs` and `static_assets.rs`.
   - Serve existing `software/macos-helper/portal` frontend assets.

5. **Milestone 5: End-to-End Verification & Cleanup**
   - Verify parity with Python test suite.
   - User approval & safe deprecation of `software/macos-helper`.
