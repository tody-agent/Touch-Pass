# PIV Native Cold Boot Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement NIST SP 800-73-4 PIV native smart card cold boot authentication for TouchPass on ESP32-S3 without storing OS passwords in firmware, providing biometric hardware authorization on macOS (Apple Silicon FileVault & Login, Apple T2 Login) and Windows (Active Directory & Entra ID CBA), with an optional Phase 7 Windows Credential Provider for local accounts.

**Architecture:** ESP32-S3 exposes USB CCID interface alongside CDC and HID. Private cryptographic keys reside on-chip in protected NVS; APDU challenge signing is gated by Match-on-Device ZW101 fingerprint verification. Host OS native smart card frameworks authenticate users using X.509 PKI certificates without intermediary daemons at cold boot.

**Tech Stack:** C (ESP-IDF / tinyusb CCID stack / mbedtls), Rust / Tauri (Desktop helper & PKI provisioning), X.509 PKI (NIST SP 800-73-4 PIV standards).

## Global Constraints
- Zero OS login passwords stored in firmware flash or NVS.
- Standard NIST SP 800-73-4 APDU implementation for slots `9A` (PIV Authentication) and `9E` (Card Authentication).
- Physical biometric match required before authorizing private key signing operations.
- Superpowers TDD cycle: failing Red test before Green implementation code.
- Mandatory approval gates before flashing target boards, applying FileVault changes, or enforcing smart-card policies.
- No platform support claims without physical hardware test verification.
- Phase 7 (Windows Credential Provider for Local Accounts) remains strictly optional and isolated.

---

### Phase 0: Threat Model, Capability Matrix & Recovery Strategy

**Files:**
- Create: `docs/threat-model-piv.md`
- Create: `docs/platform-capability-matrix.md`
- Create: `docs/recovery-and-anti-lockout.md`

**Interfaces:**
- Consumes: Architectural security guidelines
- Produces: System threat model, hardware matrix, and recovery standard operating procedures

- [ ] **Step 1: Write Threat Model document**
  Document threat vectors: physical device theft, key extraction, APDU replay, fingerprint bypass, and cold boot attacks.

- [ ] **Step 2: Write Platform Capability Matrix**
  Document macOS Apple Silicon FileVault pre-boot support, Apple T2 limitations, Windows Active Directory / Entra CBA smart card support, and Windows local account constraints.

- [ ] **Step 3: Document Recovery and Anti-Lockout Procedures**
  Define admin PUK fallback, OS recovery keys, certificate revocation, and sensor failure procedures.

- [ ] **Step 4: Commit Phase 0 documentation**
  ```bash
  git add docs/threat-model-piv.md docs/platform-capability-matrix.md docs/recovery-and-anti-lockout.md
  git commit -m "docs: establish PIV threat model and platform capability matrix"
  ```

---

### Phase 1: HID ARM/ACT Protocol Stabilization & Health Gates

**Files:**
- Modify: `firmware/tiny_touch_smartcard/main/hid_actions.c`
- Modify: `firmware/tiny_touch_smartcard/main/config_console.c`
- Test: `tests/test_hid_protocol.py`

**Interfaces:**
- Consumes: USB CDC console protocol
- Produces: Reliable `ARM` and `ACT` handshake with HMAC-SHA256 session integrity

- [ ] **Step 1: Write failing test for ARM/ACT session derivation**
  Implement test in `tests/test_hid_protocol.py` validating `"SESSION|<nonce_hex>"` HMAC key verification.

- [ ] **Step 2: Run test to verify it fails**
  Run pytest to observe test failure on missing edge-case handling.

- [ ] **Step 3: Implement fix in firmware hid_actions.c and config_console.c**
  Ensure consistent session token handling and AES-256-CTR decrypt buffer bounds.

- [ ] **Step 4: Run test to verify it passes**
  Run: `pytest tests/test_hid_protocol.py -v`

- [ ] **Step 5: Commit Phase 1 fixes**
  ```bash
  git add firmware/tiny_touch_smartcard/main/ tests/test_hid_protocol.py
  git commit -m "fix(firmware): stabilize HID ARM/ACT session derivation and execution"
  ```

---

### Phase 2: PIV / CCID / APDU Core Engine & Biometric Key Gating

**Files:**
- Modify: `firmware/tiny_touch_smartcard/main/piv.c`
- Modify: `firmware/tiny_touch_smartcard/main/piv.h`
- Modify: `firmware/tiny_touch_smartcard/main/usb_descriptors.c`
- Test: `tests/test_piv_apdu.py`

**Interfaces:**
- Consumes: Raw CCID APDU buffers from TinyUSB
- Produces: Compliant NIST SP 800-73-4 responses gated by fingerprint sensor

- [ ] **Step 1: Write failing APDU unit tests**
  Implement tests in `tests/test_piv_apdu.py` for `SELECT PIV AID`, `GET DATA` (CHUID, CCC, Cert `9A`/`9E`), `VERIFY`, and `GENERAL AUTHENTICATE`.

- [ ] **Step 2: Run APDU tests to verify failures**
  Run: `pytest tests/test_piv_apdu.py -v`

- [ ] **Step 3: Implement NIST APDU dispatch & Biometric Authorization Gate in piv.c**
  - Implement standard BER-TLV parsing for APDU commands.
  - Require active biometric presence verification from ZW101 sensor before executing private key operations on slot `9A`.
  - Enforce one-time authorization window per fingerprint touch.

- [ ] **Step 4: Run APDU tests to verify they pass**
  Run: `pytest tests/test_piv_apdu.py -v`

- [ ] **Step 5: Commit Phase 2 PIV engine**
  ```bash
  git add firmware/tiny_touch_smartcard/main/piv.c firmware/tiny_touch_smartcard/main/piv.h tests/test_piv_apdu.py
  git commit -m "feat(piv): implement NIST SP 800-73-4 APDU engine with fingerprint gating"
  ```

---

### Phase 3: Certificate Provisioning, CSR Generation & Desktop Management UX

**Files:**
- Create/Modify: `software/rust-helper/src/piv_provision.rs`
- Modify: `software/desktop/src/components/` (Settings / PIV enrollment wizard)
- Test: `software/rust-helper/tests/test_piv_provision.rs`

**Interfaces:**
- Consumes: TouchPass Rust helper daemon & serial CDC
- Produces: Automated CSR generation, self-signed/CA certificate injection, and CHUID setup

- [ ] **Step 1: Write failing test for PIV provisioning logic**
  Implement test for RSA-2048 / ECC P-256 key generation, CSR formatting, and certificate injection.

- [ ] **Step 2: Implement Rust PIV provisioning module**
  Generate keys on-chip or import securely, generate standard CSR with User Principal Name / SAN, and write certificate to slot `9A`.

- [ ] **Step 3: Implement Desktop Enrollment Wizard UI**
  Add intuitive biometric step-by-step smart card provisioning flow in Tauri desktop app.

- [ ] **Step 4: Run test gate and frontend verification**
  Run cargo tests and frontend build tests.

- [ ] **Step 5: Commit Phase 3 provisioning**
  ```bash
  git add software/rust-helper/ software/desktop/
  git commit -m "feat(desktop): add PIV certificate provisioning and biometric pairing wizard"
  ```

---

### Phase 4: macOS PIV Login & FileVault Pre-Boot Integration

**Files:**
- Create: `docs/macos-piv-filevault-guide.md`
- Create: `software/scripts/macos_pair_smartcard.sh`
- Test: `tests/test_macos_pairing_scripts.py`

**Interfaces:**
- Consumes: macOS `sc_auth`, `security`, and SmartCardServices
- Produces: Paired smart card token for macOS FileVault & Login Window

- [ ] **Step 1: Write automated pairing script for macOS**
  Implement `sc_auth pair -u <user> -h <hash>` wrapper and configuration profile generation.

- [ ] **Step 2: Test script logic with mock SmartCardServices**
  Verify token identity extraction and key mapping.

- [ ] **Step 3: Hardware Verification on Apple Silicon & T2**
  Execute physical hardware tests:
  - Apple Silicon: FileVault pre-boot unlock via TouchPass PIV.
  - Apple T2: Login Window authentication via TouchPass PIV.

- [ ] **Step 4: Commit Phase 4 macOS integration**
  ```bash
  git add docs/macos-piv-filevault-guide.md software/scripts/
  git commit -m "feat(macos): provide smart card pairing and FileVault integration"
  ```

---

### Phase 5: Windows Active Directory & Microsoft Entra CBA Integration

**Files:**
- Create: `docs/windows-piv-cba-guide.md`
- Create: `software/scripts/windows_cert_enroll.ps1`
- Test: `tests/test_windows_piv_config.py`

**Interfaces:**
- Consumes: Windows Base Smart Card CSP / Minidriver, Microsoft Entra CBA
- Produces: Smart card pre-login credentials on Windows logon screen

- [ ] **Step 1: Validate CCID driver binding on Windows 10/11**
  Ensure device enumerates under Windows Smart Card subsystem without custom drivers.

- [ ] **Step 2: Certificate formatting for AD PKINIT and Entra ID**
  Include Smart Card Logon EKU (`1.3.6.1.4.1.311.20.2.2`) and Subject Alternative Name UPN.

- [ ] **Step 3: Hardware Verification on Windows Login Screen**
  Verify biometric challenge-response at Windows Logon screen for domain / Entra users.

- [ ] **Step 4: Commit Phase 5 Windows integration**
  ```bash
  git add docs/windows-piv-cba-guide.md software/scripts/windows_cert_enroll.ps1
  git commit -m "feat(windows): configure Active Directory and Entra CBA smart card logon"
  ```

---

### Phase 6: Hardware Test Matrix, Recovery Drills & Release Quality Gate

**Files:**
- Create: `tests/hardware_matrix_verification.py`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes: All Phase 0-5 artifacts on physical hardware
- Produces: Validated release package, updated documentation, and sign-off report

- [ ] **Step 1: Execute Full Physical Hardware Matrix Test**
  Verify on ESP32-S3 + ZW101 across macOS and Windows.

- [ ] **Step 2: Execute Failure Recovery Drills**
  Verify behavior on un-enrolled finger, emergency PIN/PUK unlock, and lost device scenarios.

- [ ] **Step 3: Run Full Repository Test Gate**
  Run `python run_test_gate.py` to confirm all unit, contract, and integration tests pass.

- [ ] **Step 4: Update CHANGELOG.md and create release candidate**
  ```bash
  git add CHANGELOG.md tests/hardware_matrix_verification.py
  git commit -m "chore(release): record PIV native cold boot login release milestone"
  ```

---

### Phase 7 (Optional Extension): Windows Custom Credential Provider for Local Accounts

**Files:**
- Create: `software/windows-credential-provider/` (C++ Win32 DLL)
- Create: `software/windows-credential-provider/TouchPassCredentialProvider.cpp`
- Create: `docs/windows-credential-provider-architecture.md`

**Interfaces:**
- Consumes: Windows Logon UI (`ICredentialProviderCredential2`)
- Produces: Local Windows user account login via TouchPass biometric CCID/HID

- [ ] **Step 1: Design Credential Provider DLL Architecture**
  Document Secure Desktop isolation, IPC channel to TouchPass hardware, and fallback mechanisms.

- [ ] **Step 2: Implement C++ ICredentialProviderCredential2 Interface**
  Build credential provider DLL with anti-lockout safeguards.

- [ ] **Step 3: Code Signing and Windows Secure Desktop Verification**
  Test credential serialization and local logon flow.

- [ ] **Step 4: Commit Phase 7 extension**
  ```bash
  git add software/windows-credential-provider/ docs/windows-credential-provider-architecture.md
  git commit -m "feat(windows): implement optional custom credential provider for local accounts"
  ```
