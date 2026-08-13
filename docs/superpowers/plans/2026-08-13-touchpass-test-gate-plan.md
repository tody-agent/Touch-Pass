# TouchPass Test Gate & Expanded Unit Test Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng Test Gate tự động (`run_test_gate.py`) và mở rộng bộ unit test kiểm thử toàn diện cho hệ thống TouchPass (mã hóa HMAC/AES, lưu trữ mật khẩu Credential Manager, phát hiện cổng COM Windows, kiểm tra cú pháp và API live).

**Tech Stack:** Python 3 (unittest, pytest), pySerial mocking, keyring / Credential Manager mocking, urllib / HTTP integration.

## Global Constraints
- Không phá vỡ 55 test cases hiện tại trong `tests/`.
- Test Gate phải chạy mượt mà trên cả Windows và macOS với mã thoát (exit code) 0 khi thành công.

---

### Task 1: Write `tests/test_keyring_secret_store.py` (Secret Store & Keychain Unit Tests)

**Files:**
- Create: `tests/test_keyring_secret_store.py`

- [ ] **Step 1: Write test cases for `KeyringSecretStore` & `keychain_*` functions**
  - Test set/get/delete secrets.
  - Test ASCII validation and error raising.
  - Test fallback memory store when keyring is mocked as unavailable.
  - Test `credentials_exist()` check.

- [ ] **Step 2: Run test file and verify pass**

```bash
C:\Users\block\AppData\Local\Programs\Python\Python311\Scripts\pytest.exe tests/test_keyring_secret_store.py
```

- [ ] **Step 3: Commit changes**

```bash
git add tests/test_keyring_secret_store.py
git commit -m "test(auth): add unit tests for KeyringSecretStore and credential functions"
```

---

### Task 2: Write `tests/test_windows_serial_detection.py` (Serial Port & COM Detection Unit Tests)

**Files:**
- Create: `tests/test_windows_serial_detection.py`

- [ ] **Step 1: Write test cases for `device_ports()` and `select_device_port()`**
  - Test detecting ESP32-S3 by VID `0x303A`.
  - Test detecting COM ports by description ("ESP32", "USB Serial Device").
  - Test fallback COM port ordering (excluding COM1).
  - Test `select_device_port()` handling explicit port, empty ports error, and multiple ports error.

- [ ] **Step 2: Run test file and verify pass**

```bash
C:\Users\block\AppData\Local\Programs\Python\Python311\Scripts\pytest.exe tests/test_windows_serial_detection.py
```

- [ ] **Step 3: Commit changes**

```bash
git add tests/test_windows_serial_detection.py
git commit -m "test(serial): add unit tests for Windows COM port discovery and selection"
```

---

### Task 3: Write `tests/test_hmac_aes_crypto_gate.py` (HMAC & AES-CTR Protocol Security Unit Tests)

**Files:**
- Create: `tests/test_hmac_aes_crypto_gate.py`

- [ ] **Step 1: Write test cases for HMAC authentication and AES-CTR payload encryption**
  - Test `handle_event()` with valid HMAC producing `PW` response.
  - Test `handle_event()` rejecting invalid HMAC signature (`bad event mac`).
  - Test `handle_event()` rejecting replayed nonces.
  - Test `handle_action_event()` double-touch confirmation flow (`ARM` then `ACT`).

- [ ] **Step 2: Run test file and verify pass**

```bash
C:\Users\block\AppData\Local\Programs\Python\Python311\Scripts\pytest.exe tests/test_hmac_aes_crypto_gate.py
```

- [ ] **Step 3: Commit changes**

```bash
git add tests/test_hmac_aes_crypto_gate.py
git commit -m "test(crypto): add unit tests for HMAC-SHA256 verification and AES-CTR action protocol"
```

---

### Task 4: Build Automated Test Gate Runner (`run_test_gate.py`)

**Files:**
- Create: `run_test_gate.py`

- [ ] **Step 1: Implement `run_test_gate.py`**
  - Stage 1: Python source code syntax compilation check (`py_compile`).
  - Stage 2: Pytest unit test suite execution (`tests/*.py`).
  - Stage 3: Live Portal HTTP server & API CSRF verification (`/api/status`, `/api/logs`, `/api/profiles`, `/api/test`).
  - Stage 4: CLI sanity check (`tinytouch --help`).

- [ ] **Step 2: Run `python run_test_gate.py` and verify pristine report output**

- [ ] **Step 3: Commit changes**

```bash
git add run_test_gate.py
git commit -m "feat(ci): add automated test gate script run_test_gate.py"
```

---

### Task 5: Final Verification & Integration

- [ ] **Step 1: Run complete Test Gate suite**

```bash
python run_test_gate.py
```

- [ ] **Step 2: Commit final test gate documentation and verification**

```bash
git add .
git commit -m "docs: complete verification for TouchPass test gate plan"
```
