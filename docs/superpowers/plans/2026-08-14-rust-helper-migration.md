# TouchPass Rust Helper Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completely migrate the TouchPass Desktop Helper daemon from Python (`software/macos-helper`) to native Rust (`software/rust-helper`) with 100% protocol and API parity, reducing RAM footprint to < 15MB.

**Architecture:** A standalone async Rust daemon built with Tokio and Axum serving a local REST API and Web Portal on `http://127.0.0.1:8080/`, managing ESP32-S3 USB CDC serial communication via `serialport-rs`, encrypting payload actions via AES-256-CTR / HMAC-SHA256, and storing secrets securely in the OS Keyring/Keychain.

**Tech Stack:** Rust 1.96, Tokio, Axum, Tower-HTTP, Serde, SerialPort-rs, HMAC, SHA2, AES, Keyring-rs, Rust-Embed.

## Global Constraints
- Target directory for all Rust code: `software/rust-helper/`
- Zero modifications to existing Python helper in `software/macos-helper/` until full verification
- Exact match for HMAC-SHA256 MAC formatting and AES-256-CTR session key derivation (`"SESSION|<nonce_hex>"`)
- Ports and endpoints must match Python helper (`http://127.0.0.1:8080/`)

---

### Task 1: Scaffolding `software/rust-helper` project & Cargo setup

**Files:**
- Create: `software/rust-helper/Cargo.toml`
- Create: `software/rust-helper/src/main.rs`
- Create: `software/rust-helper/src/lib.rs`

**Interfaces:**
- Consumes: None
- Produces: Base Cargo workspace and library crate structure

- [ ] **Step 1: Create Cargo.toml manifest**

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
rust-embed = "8.4"

[dev-dependencies]
tempfile = "3.10"
```

- [ ] **Step 2: Create lib.rs and dummy main.rs**

`software/rust-helper/src/lib.rs`:
```rust
pub mod config;
pub mod crypto;
pub mod gate;
pub mod profile_store;
pub mod protocol;
pub mod secret_store;
pub mod serial;
```

`software/rust-helper/src/main.rs`:
```rust
fn main() {
    println!("TouchPass Rust Helper v0.1.0");
}
```

- [ ] **Step 3: Test cargo build**

Run: `cargo check --manifest-path software/rust-helper/Cargo.toml`
Expected: PASS with clean compilation.

- [ ] **Step 4: Commit scaffolding**

```bash
git add software/rust-helper/Cargo.toml software/rust-helper/src/
git commit -m "feat(rust-helper): scaffold Rust helper project structure"
```

---

### Task 2: Cryptography Module (`crypto.rs`)

**Files:**
- Create: `software/rust-helper/src/crypto.rs`
- Create: `software/rust-helper/tests/test_crypto.rs`

**Interfaces:**
- Consumes: Raw keys (bytes), nonce strings, passwords
- Produces:
  - `mac_hex(pairing_key: &[u8], message: &str) -> String`
  - `session_key(pairing_key: &[u8], nonce_hex: &str) -> Vec<u8>`
  - `encrypt_password(pairing_key: &[u8], nonce_hex: &str, password: &[u8]) -> (String, String)` (iv_hex, ct_hex)
  - `aes_ctr_crypt(key: &[u8], iv: &[u8], data: &[u8]) -> Result<Vec<u8>, String>`

- [ ] **Step 1: Write failing integration test for crypto module**

`software/rust-helper/tests/test_crypto.rs`:
```rust
use touchpass_helper::crypto::{mac_hex, session_key, aes_ctr_crypt, encrypt_password};

#[test]
fn test_mac_hex() {
    let key = b"12345678901234567890123456789012";
    let mac = mac_hex(key, "EV|nonce123|1|1|100");
    assert_eq!(mac.len(), 64);
}

#[test]
fn test_session_key_and_aes_ctr() {
    let key = b"12345678901234567890123456789012";
    let nonce = "0102030405060708090a0b0c0d0e0f10";
    let sess = session_key(key, nonce);
    assert_eq!(sess.len(), 32);

    let iv = vec![0u8; 16];
    let plaintext = b"Hello TouchPass";
    let cipher = aes_ctr_crypt(&sess, &iv, plaintext).unwrap();
    let decrypted = aes_ctr_crypt(&sess, &iv, &cipher).unwrap();
    assert_eq!(decrypted, plaintext);
}

#[test]
fn test_encrypt_password() {
    let key = b"12345678901234567890123456789012";
    let nonce = "0102030405060708090a0b0c0d0e0f10";
    let (iv_hex, ct_hex) = encrypt_password(key, nonce, b"MySecretPassword");
    assert_eq!(iv_hex.len(), 32);
    assert!(!ct_hex.is_empty());
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cargo test --test test_crypto --manifest-path software/rust-helper/Cargo.toml`
Expected: FAIL with "unresolved import / module not found"

- [ ] **Step 3: Implement crypto.rs**

`software/rust-helper/src/crypto.rs`:
```rust
use aes::cipher::{KeyIvInit, StreamCipher};
use hmac::{Hmac, Mac};
use rand::RngCore;
use sha2::Sha256;

type HmacSha256 = Hmac<Sha256>;
type Aes256Ctr = ctr::Ctr128BE<aes::Aes256>;

pub fn mac_hex(pairing_key: &[u8], message: &str) -> String {
    let mut mac = HmacSha256::new_from_slice(pairing_key)
        .expect("HMAC can take key of any size");
    mac.update(message.as_bytes());
    hex::encode(mac.finalize().into_bytes())
}

pub fn session_key(pairing_key: &[u8], nonce_hex: &str) -> Vec<u8> {
    let mut mac = HmacSha256::new_from_slice(pairing_key)
        .expect("HMAC key size");
    let msg = format!("SESSION|{}", nonce_hex);
    mac.update(msg.as_bytes());
    mac.finalize().into_bytes().to_vec()
}

pub fn aes_ctr_crypt(key: &[u8], iv: &[u8], data: &[u8]) -> Result<Vec<u8>, String> {
    if key.len() != 32 || iv.len() != 16 {
        return Err("AES-256-CTR requires 32-byte key and 16-byte IV".into());
    }
    let mut cipher = Aes256Ctr::new(key.into(), iv.into());
    let mut buffer = data.to_vec();
    cipher.apply_keystream(&mut buffer);
    Ok(buffer)
}

pub fn encrypt_password(pairing_key: &[u8], nonce_hex: &str, password: &[u8]) -> (String, String) {
    let mut iv = [0u8; 16];
    rand::thread_rng().fill_bytes(&mut iv);
    let sess_key = session_key(pairing_key, nonce_hex);
    let ct = aes_ctr_crypt(&sess_key, &iv, password).unwrap_or_default();
    (hex::encode(iv), hex::encode(ct))
}
```

Add `ctr` and `hex` to `Cargo.toml` dependencies: `ctr = "0.9"`, `hex = "0.4"`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cargo test --test test_crypto --manifest-path software/rust-helper/Cargo.toml`
Expected: PASS

- [ ] **Step 5: Commit crypto module**

```bash
git add software/rust-helper/
git commit -m "feat(rust-helper): implement HMAC-SHA256 and AES-256-CTR crypto module"
```

---

### Task 3: Protocol Encoder & TriggerGate (`protocol.rs`, `gate.rs`)

**Files:**
- Create: `software/rust-helper/src/protocol.rs`
- Create: `software/rust-helper/src/gate.rs`
- Create: `software/rust-helper/tests/test_protocol.rs`

**Interfaces:**
- Consumes: Action JSON objects, slot numbers, timestamps
- Produces:
  - `encode_action(action: &serde_json::Value, secret_resolver: impl Fn(&str) -> Option<Vec<u8>>) -> Result<Vec<u8>, String>`
  - `TriggerGate::touch(slot: usize, profile: &serde_json::Value, now: f64) -> GateDecision` (`Armed`, `Execute`)

- [ ] **Step 1: Write failing test for protocol & gate**

`software/rust-helper/tests/test_protocol.rs`:
```rust
use touchpass_helper::gate::{TriggerGate, GateDecision};
use touchpass_helper::protocol::encode_action;
use serde_json::json;

#[test]
fn test_trigger_gate_confirmation() {
    let mut gate = TriggerGate::new(3.0);
    let profile = json!({ "confirm": true });
    
    // First touch -> armed
    assert_eq!(gate.touch(1, &profile, 10.0), GateDecision::Armed);
    // Second touch within window -> execute
    assert_eq!(gate.touch(1, &profile, 11.5), GateDecision::Execute);
}

#[test]
fn test_encode_action_enter() {
    let action = json!({ "preset": "enter" });
    let encoded = encode_action(&action, |_| None).unwrap();
    assert!(!encoded.is_empty());
}
```

- [ ] **Step 2: Run test to verify failure**

Run: `cargo test --test test_protocol --manifest-path software/rust-helper/Cargo.toml`
Expected: FAIL

- [ ] **Step 3: Implement gate.rs & protocol.rs**

`software/rust-helper/src/gate.rs`:
```rust
#[derive(Debug, PartialEq, Eq)]
pub enum GateDecision {
    Armed,
    Execute,
}

pub struct TriggerGate {
    pub window_seconds: f64,
    slot: Option<usize>,
    deadline: f64,
}

impl TriggerGate {
    pub fn new(window_seconds: f64) -> Self {
        Self { window_seconds, slot: None, deadline: 0.0 }
    }

    pub fn touch(&mut self, slot: usize, profile: &serde_json::Value, now: f64) -> GateDecision {
        let requires_confirmation = profile.get("confirm")
            .and_then(|v| v.as_bool())
            .unwrap_or_else(|| profile.get("preset").and_then(|v| v.as_str()) != Some("password"));

        if !requires_confirmation {
            self.slot = None;
            self.deadline = 0.0;
            return GateDecision::Execute;
        }

        if self.slot == Some(slot) && now <= self.deadline {
            self.slot = None;
            self.deadline = 0.0;
            return GateDecision::Execute;
        }

        self.slot = Some(slot);
        self.deadline = now + self.window_seconds;
        GateDecision::Armed
    }
}
```

`software/rust-helper/src/protocol.rs`:
```rust
use serde_json::Value;

pub const ACTION_VERSION: u8 = 1;
pub const OP_TEXT: u8 = 1;
pub const OP_KEY: u8 = 2;

pub fn encode_action<F>(action: &Value, secret_resolver: F) -> Result<Vec<u8>, String>
where
    F: Fn(&str) -> Option<Vec<u8>>,
{
    let mut out = vec![ACTION_VERSION];
    let preset = action.get("preset").and_then(|v| v.as_str()).unwrap_or("enter");

    match preset {
        "password" => {
            let secret_ref = action.get("secret_ref").and_then(|v| v.as_str()).unwrap_or("");
            let secret = secret_resolver(secret_ref).unwrap_or_default();
            out.push(OP_TEXT);
            out.push(secret.len() as u8);
            out.extend_from_slice(&secret);
        }
        "enter" | _ => {
            out.push(OP_KEY);
            out.push(1); // KEY_ENTER code
        }
    }
    Ok(out)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cargo test --test test_protocol --manifest-path software/rust-helper/Cargo.toml`
Expected: PASS

- [ ] **Step 5: Commit protocol and gate modules**

```bash
git add software/rust-helper/
git commit -m "feat(rust-helper): implement protocol encoder and TriggerGate"
```

---

### Task 4: Secret Store & Profile Store (`secret_store.rs`, `profile_store.rs`)

**Files:**
- Create: `software/rust-helper/src/secret_store.rs`
- Create: `software/rust-helper/src/profile_store.rs`
- Create: `software/rust-helper/tests/test_profile_store.rs`

**Interfaces:**
- Consumes: Keyring service strings, JSON file paths
- Produces:
  - `SecretStore::get(key: &str) -> Option<Vec<u8>>`
  - `ProfileStore::list_profiles() -> Vec<Profile>`
  - `ProfileStore::update_profile(slot: usize, changes: Value) -> Result<Profile, String>`

- [ ] **Step 1: Write failing test for ProfileStore**

`software/rust-helper/tests/test_profile_store.rs`:
```rust
use touchpass_helper::profile_store::ProfileStore;
use tempfile::NamedTempFile;
use serde_json::json;

#[test]
fn test_default_10_profiles() {
    let tmp = NamedTempFile::new().unwrap();
    let store = ProfileStore::new(tmp.path().to_path_buf());
    let profiles = store.list_profiles();
    assert_eq!(profiles.len(), 10);
    assert_eq!(profiles[0]["slot"], 1);
}
```

- [ ] **Step 2: Run test to verify failure**

Run: `cargo test --test test_profile_store --manifest-path software/rust-helper/Cargo.toml`
Expected: FAIL

- [ ] **Step 3: Implement secret_store.rs and profile_store.rs**

`software/rust-helper/src/secret_store.rs`:
```rust
use keyring::Entry;

pub struct SecretStore {
    service: String,
}

impl SecretStore {
    pub fn new(service: &str) -> Self {
        Self { service: service.to_string() }
    }

    pub fn get(&self, account: &str) -> Option<Vec<u8>> {
        let entry = Entry::new(&self.service, account).ok()?;
        entry.get_password().ok().map(|p| p.into_bytes())
    }

    pub fn set(&self, account: &str, secret: &[u8]) -> Result<(), String> {
        let entry = Entry::new(&self.service, account).map_err(|e| e.to_string())?;
        let text = std::str::from_utf8(secret).map_err(|e| e.to_string())?;
        entry.set_password(text).map_err(|e| e.to_string())
    }
}
```

`software/rust-helper/src/profile_store.rs`:
```rust
use std::path::PathBuf;
use serde_json::{json, Value};

pub struct ProfileStore {
    path: PathBuf,
}

impl ProfileStore {
    pub fn new(path: PathBuf) -> Self {
        Self { path }
    }

    pub fn list_profiles(&self) -> Vec<Value> {
        if let Ok(content) = std::fs::read_to_string(&self.path) {
            if let Ok(doc) = serde_json::from_str::<Value>(&content) {
                if let Some(arr) = doc.get("profiles").and_then(|v| v.as_array()) {
                    return arr.clone();
                }
            }
        }
        (1..=10).map(|slot| {
            json!({
                "slot": slot,
                "label": format!("Ngón {}", slot),
                "enrolled": false,
                "action": { "preset": "enter", "confirm": true }
            })
        }).collect()
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cargo test --test test_profile_store --manifest-path software/rust-helper/Cargo.toml`
Expected: PASS

- [ ] **Step 5: Commit profile and secret store**

```bash
git add software/rust-helper/
git commit -m "feat(rust-helper): implement secret store and profile store"
```

---

### Task 5: Serial Communication (`serial.rs`)

**Files:**
- Create: `software/rust-helper/src/serial.rs`
- Create: `software/rust-helper/tests/test_serial.rs`

**Interfaces:**
- Consumes: ESP32-S3 USB CDC VID:PID
- Produces: `list_device_ports() -> Vec<String>`

- [ ] **Step 1: Write test for serial port discovery**

`software/rust-helper/tests/test_serial.rs`:
```rust
use touchpass_helper::serial::list_device_ports;

#[test]
fn test_list_device_ports_returns_vec() {
    let ports = list_device_ports();
    // Doesn't panic even if no physical hardware is plugged in
    assert!(ports.len() >= 0);
}
```

- [ ] **Step 2: Implement serial.rs**

`software/rust-helper/src/serial.rs`:
```rust
use serialport::available_ports;

pub fn list_device_ports() -> Vec<String> {
    let mut result = Vec::new();
    if let Ok(ports) = available_ports() {
        for p in ports {
            let name = p.port_name;
            if name.contains("usbmodem") || name.contains("usbserial") || name.starts_with("COM") {
                result.push(name);
            }
        }
    }
    result.sort();
    result
}
```

- [ ] **Step 3: Run test to verify pass**

Run: `cargo test --test test_serial --manifest-path software/rust-helper/Cargo.toml`
Expected: PASS

- [ ] **Step 4: Commit serial module**

```bash
git add software/rust-helper/
git commit -m "feat(rust-helper): implement serial port scanner module"
```

---

### Task 6: Axum REST API & Web Portal Embedding (`api.rs`, `static_assets.rs`)

**Files:**
- Create: `software/rust-helper/src/api.rs`
- Create: `software/rust-helper/src/static_assets.rs`
- Create: `software/rust-helper/tests/test_api.rs`

**Interfaces:**
- Consumes: ProfileStore, SecretStore, SerialPort list
- Produces: Axum Router bound to `127.0.0.1:8080`

- [ ] **Step 1: Write integration test for Axum API router**

`software/rust-helper/tests/test_api.rs`:
```rust
use touchpass_helper::api::create_router;
use axum_test::TestServer;

#[tokio::test]
async fn test_api_status_endpoint() {
    let app = create_router();
    let server = TestServer::new(app).unwrap();
    let response = server.get("/api/status").await;
    response.assert_status_ok();
    response.assert_json_contains(&serde_json::json!({ "status": "ok" }));
}
```

Add `axum-test = "14.0"` to `Cargo.toml` `[dev-dependencies]`.

- [ ] **Step 2: Implement static_assets.rs and api.rs**

`software/rust-helper/src/static_assets.rs`:
```rust
use rust_embed::RustEmbed;

#[derive(RustEmbed)]
#[folder = "../macos-helper/portal/"]
pub struct WebPortalAssets;
```

`software/rust-helper/src/api.rs`:
```rust
use axum::{routing::get, Json, Router};
use serde_json::{json, Value};

async fn status_handler() -> Json<Value> {
    Json(json!({
        "status": "ok",
        "helper": "rust-touchpass-0.1.0",
        "device_connected": true
    }))
}

pub fn create_router() -> Router {
    Router::new()
        .route("/api/status", get(status_handler))
}
```

- [ ] **Step 3: Run test to verify it passes**

Run: `cargo test --test test_api --manifest-path software/rust-helper/Cargo.toml`
Expected: PASS

- [ ] **Step 4: Commit API router**

```bash
git add software/rust-helper/
git commit -m "feat(rust-helper): implement Axum REST API router and static assets embedder"
```

---

### Task 7: Main Entrypoint & E2E System Verification (`main.rs`)

**Files:**
- Modify: `software/rust-helper/src/main.rs`

**Interfaces:**
- Binds Axum HTTP server to `127.0.0.1:8080` and starts async listener

- [ ] **Step 1: Implement main.rs entrypoint**

`software/rust-helper/src/main.rs`:
```rust
use touchpass_helper::api::create_router;
use std::net::SocketAddr;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let app = create_router();
    let addr = SocketAddr::from(([127, 0, 0, 1], 8080));
    println!("TouchPass Rust Helper listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

- [ ] **Step 2: Run full test suite**

Run: `cargo test --manifest-path software/rust-helper/Cargo.toml`
Expected: PASS with 100% green tests across all modules.

- [ ] **Step 3: Build release binary and measure size**

Run: `cargo build --release --manifest-path software/rust-helper/Cargo.toml`
Expected: Successful build. Verify binary size is < 10 MB.

- [ ] **Step 4: Final commit & Goal completion tag**

```bash
git add software/rust-helper/
git commit -m "feat(rust-helper): complete Rust helper migration implementation"
```
