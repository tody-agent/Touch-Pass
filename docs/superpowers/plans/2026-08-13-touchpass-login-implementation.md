# TouchPass TinyTouch-Compatible Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Triển khai cơ chế đăng nhập tự động và mã hóa mật khẩu tương thích TinyTouch trên Windows & macOS cho TouchPass, đảm bảo vân tay hoạt động trực tiếp qua USB CDC Serial và gửi mật khẩu giải mã/phím tắt qua USB HID Native.

**Tech Stack:** Python 3, keyring / Windows Credential Manager / macOS Keychain, pySerial, AES-CTR (CommonCrypto/cryptography), HMAC-SHA256.

## Global Constraints
- Bảo toàn giao thức HMAC-SHA256 và AES-CTR giữa ESP32-S3 firmware và Python helper backend (`EV`, `ARM`, `ACT`, `PW`).
- Hỗ trợ cả Windows (`COM*` port, Windows Credential Manager) và macOS (`/dev/cu.usbmodem*`, Keychain).
- Không làm gián đoạn Web Portal (`http://127.0.0.1:8787/`).

---

### Task 1: Cross-Platform Credential Store & Platform Compatibility

**Files:**
- Modify: `tinytouch`
- Modify: `software/macos-helper/tinytouch_portal.py`
- Modify: `software/macos-helper/tinytouch_helper.py`

- [ ] **Step 1: Guard `import termios` in `tinytouch`**
  Guarded import for `termios` to support Windows execution.

- [ ] **Step 2: Upgrade `KeychainSecretStore` to use `keyring` with fallback**
  In `tinytouch_portal.py`, implement `KeyringSecretStore` class that uses `keyring` (Windows Credential Manager / macOS Keychain) with fallback to `security` on macOS.

- [ ] **Step 3: Upgrade `keychain_get` / `keychain_set` / `pairing_keychain_get` / `pairing_keychain_set`**
  In `tinytouch_helper.py`, support cross-platform secret storage so device pairing keys and account passwords can be saved and retrieved on Windows without invoking macOS `security` binary.

- [ ] **Step 4: Commit changes**

```bash
git add tinytouch software/macos-helper/tinytouch_portal.py software/macos-helper/tinytouch_helper.py
git commit -m "feat(auth): add cross-platform keyring secret store for Windows and macOS"
```

---

### Task 2: Real Hardware Serial Device Auto-Detection on Windows & macOS

**Files:**
- Modify: `software/macos-helper/tinytouch_helper.py`

- [ ] **Step 1: Expand `device_ports()` for Windows COM ports**
  In `tinytouch_helper.py`, detect Windows COM ports (`COM*`) in addition to macOS (`/dev/cu.usbmodem*`) by checking `serial.tools.list_ports.comports()`.

- [ ] **Step 2: Update `select_device_port()` for multi-platform support**
  Allow automatic selection of COM ports on Windows when ESP32-S3 device is connected.

- [ ] **Step 3: Commit changes**

```bash
git add software/macos-helper/tinytouch_helper.py
git commit -m "feat(serial): add Windows COM port auto-detection for ESP32-S3 USB CDC"
```

---

### Task 3: Upgrade Windows Portal Runner (`run_portal_win.py`) for Real Hardware & Live Login

**Files:**
- Modify: `run_portal_win.py`

- [ ] **Step 1: Replace dummy backend with real `run_portal` service**
  In `run_portal_win.py`, initialize real `KeyringSecretStore`, `ProfileStore`, `AdminJobDevice`, and `portal_serial_worker` so physical fingerprint matches trigger live password decryption and native USB HID typing on Windows.

- [ ] **Step 2: Add non-blocking auto-reconnect fallback**
  Ensure portal loads immediately even if hardware device is not yet plugged in, and connects automatically when plugged in.

- [ ] **Step 3: Commit changes**

```bash
git add run_portal_win.py
git commit -m "feat(win): upgrade run_portal_win.py to use real hardware CDC worker and keyring store"
```

---

### Task 4: Automated Testing & End-to-End Verification

**Files:**
- Modify: `tests/test_tinytouch_cli.py`
- Modify: `tests/test_helper_protocol.py`
- Modify: `tests/test_portal_api.py`

- [ ] **Step 1: Run complete pytest suite**

```bash
C:\Users\block\AppData\Local\Programs\Python\Python311\Scripts\pytest.exe tests/
```

- [ ] **Step 2: Verify live portal server startup**

Run `python run_portal_win.py` and test `/api/status` & `/api/logs` using `verify_apis.py`.

- [ ] **Step 3: Commit final verification**

```bash
git add .
git commit -m "docs: complete verification for TouchPass login upgrade plan"
```
