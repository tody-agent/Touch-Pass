# Tasks: PIV Native Cold Boot Login Architecture

## Phase 0: Threat Model, Capability Matrix & Disaster Recovery

- [ ] **Task 0.1: Formal Threat Model Specification**
  - Analyze physical device extraction, rogue APDU replay, fingerprint spoofing, and side-channel timing attacks.
  - Document attack trees and mitigation strategies in `docs/threat-model-piv.md`.
- [ ] **Task 0.2: OS & Hardware Capability Matrix**
  - Map Apple Silicon (FileVault + Login Window) vs Apple T2 (Password FileVault + Smart Card Login).
  - Map Windows Active Directory / Entra ID CBA vs Local Accounts.
- [ ] **Task 0.3: Disaster Recovery & Anti-Lockout Specification**
  - Document emergency recovery keys, admin PUK fallback, and sensor degradation workarounds.

---

## Phase 1: HID ARM/ACT Protocol Stabilization & Health Gates

- [ ] **Task 1.1: Automated Red Test for HID ARM/ACT Session Key Derivation**
  - Write failing test in `tests/test_hid_protocol.py` validating `SESSION|<nonce>` HMAC handshake.
- [ ] **Task 1.2: Firmware ARM/ACT Fixes**
  - Update `firmware/tiny_touch_smartcard/main/hid_actions.c` and `config_console.c`.
- [ ] **Task 1.3: Desktop Helper & Tauri Integration Test Gate**
  - Verify end-to-end `ARM` and `ACT` execution across helper and desktop UI.

---

## Phase 2: PIV / CCID / APDU Engine & Fingerprint Match-on-Device Authorization

- [ ] **Task 2.1: Red Unit Tests for PIV APDU Parser**
  - Implement APDU test fixtures for `SELECT`, `GET DATA` (CHUID, CCC, Cert 9A/9E), `VERIFY PIN`, and `GENERAL AUTHENTICATE`.
- [ ] **Task 2.2: Implement NIST SP 800-73-4 Core APDU Dispatcher**
  - Refactor `firmware/tiny_touch_smartcard/main/piv.c` and `piv.h`.
- [ ] **Task 2.3: Biometric Cryptographic Gating Mechanism**
  - Bind `GENERAL AUTHENTICATE` challenge signing to successful ZW101 fingerprint verification.
  - Enforce timeout window (single-shot signature authorization per biometric touch).
- [ ] **Task 2.4: Hardware Cryptographic Acceleration & Key Storage in NVS**
  - Store encrypted RSA-2048 / ECC P-256 private keys in protected NVS partition.

---

## Phase 3: Key Provisioning, CSR Generation & Desktop Management UX

- [ ] **Task 3.1: Desktop Key Generation & CSR Engine**
  - Implement CSR generation commands in Tauri / Rust backend (`software/rust-helper` / `src-tauri`).
- [ ] **Task 3.2: Certificate Import & CHUID Writing APDU Handlers**
  - Implement `PUT DATA` and admin key provisioning flow.
- [ ] **Task 3.3: Frontend Provisioning UI & Biometric Pairing Wizard**
  - Interactive smart card setup flow with live visual feedback in `software/desktop`.

---

## Phase 4: macOS PIV Login & FileVault Pre-Boot Integration

- [ ] **Task 4.1: macOS `sc_auth` Integration & Pairing Scripts**
  - Implement automated helper pairing for macOS user keychain and smart card profile.
- [ ] **Task 4.2: Apple Silicon FileVault Pre-Boot Validation**
  - Test smart card enumeration at pre-boot screen on Apple Silicon hardware.
- [ ] **Task 4.3: Apple T2 Intel Fallback Documentation & Verification**
  - Provide guidance and automated detection for T2 architectures.

---

## Phase 5: Windows Active Directory & Microsoft Entra CBA Integration

- [ ] **Task 5.1: Windows Smart Card Minidriver / Class Driver Compatibility**
  - Ensure ESP32-S3 CCID descriptors are recognized by Windows `WUDFUsbccidDriver`.
- [ ] **Task 5.2: UPN & SAN Mapping for Entra ID CBA / AD Kerberos PKINIT**
  - Format X.509 v3 certificates with required Microsoft Smart Card Logon EKU (`1.3.6.1.4.1.311.20.2.2`).
- [ ] **Task 5.3: Windows Logon Screen Verification**
  - Test insertion/removal detection and smart-card PIN / biometric login prompt.

---

## Phase 6: Hardware Testing, Recovery Gates & Changelog Finalization

- [ ] **Task 6.1: Physical Device Hardware Test Matrix**
  - Complete matrix testing across live ESP32-S3 boards, macOS, and Windows.
- [ ] **Task 6.2: Failure Injection & Recovery Drill**
  - Test bad fingerprint attempts, card pull during auth, and corrupted NVS recovery.
- [ ] **Task 6.3: Release Quality Gate & Changelog Sign-Off**
  - Update `CHANGELOG.md` only after all gates pass on real hardware.

---

## Phase 7 (Optional Extension): Windows Local Account Custom Credential Provider

- [ ] **Task 7.1: C++ ICredentialProviderCredential2 Architecture Design**
  - Draft native DLL architecture, Secure Desktop IPC, and credential packing.
- [ ] **Task 7.2: Code Signing & Safe Installation Wrapper**
  - Build installer with fail-safe recovery to prevent Windows lockout.
- [ ] **Task 7.3: Local Account Biometric Login Smoke Tests**
  - Validate seamless local user authentication on Windows 10/11.
