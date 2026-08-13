# TouchPass Expanded & Bilingual Security Policy Specification

**Date:** 2026-08-13  
**Status:** Proposed / Under Review  
**Target Files:**
- `SECURITY.md` (Expanded English version)
- `SECURITY.vi.md` (Expanded Vietnamese version)
- `README.md` (Link update)
- `README.vi.md` (Link update)
- `docs/USER_GUIDE.md` (Link update)
- `tests/test_documentation.py` (Test coverage update)

---

## 1. Executive Summary

TouchPass requires a more comprehensive, detailed, and professional Security Policy & Legal Disclaimer. Currently, `SECURITY.md` is a single combined English/Vietnamese document containing basic architecture notes and legal disclaimers. 

This specification defines the separation of security documentation into two standalone, exhaustive language files (`SECURITY.md` for English and `SECURITY.vi.md` for Vietnamese), expanding each with a full threat model, detailed security architecture, operational hardening guidance, vulnerability response SLA, and open-source legal disclaimers.

---

## 2. Document Structure & Content Breakdown

Both `SECURITY.md` and `SECURITY.vi.md` will follow a structured, multi-section layout:

### Header & Language Toggle
- **`SECURITY.md`**: `🌐 **English** | [🇻🇳 **Tiếng Việt**](SECURITY.vi.md)`
- **`SECURITY.vi.md`**: `[🌐 **English**](SECURITY.md) | 🇻🇳 **Tiếng Việt**`

### Section 1: 🏗️ Security Architecture Overview
Detailed breakdown of TouchPass's 5 core security defense layers:
1. **Hardware Biometrics & On-Chip Matching**: ZW101 optical sensor connected via UART to ESP32-S3. Biometric templates stored in sensor RAM/flash; zero raw fingerprint image transmission over USB or cloud.
2. **HMAC-SHA256 Challenge-Response & Serial Encryption**: Host-to-device communication using cryptographic nonce signatures (HMAC-SHA256) and optional AES-CTR payload encryption to protect USB serial communications against eavesdropping and replay attacks.
3. **Native OS Credential Store Integration**: Integration with native credential vaults (`win32crypt` on Windows Credential Manager, macOS Keychain Services, Linux Secret Service API) via `keyring`. Direct password retrieval into memory with quick wiping after USB HID output.
4. **WebUSB / WebSerial & Web Portal Sandbox**: Web Flasher sandbox isolation; local loopback binding (`127.0.0.1:8000`) for the TouchPass Portal with strict CORS headers and origin restriction to prevent web-based remote exploitation.
5. **USB HID Keystroke Safety**: Keystrokes are injected to the currently active focused application window. TouchPass cannot interact directly with non-focused GUI buttons or cross security boundaries beyond keyboard input.

### Section 2: 🛡️ Threat Model & Mitigation Matrix
Structured matrix mapping potential threats to mitigation mechanisms:
- **Physical Dongle Theft**: Dongle contains paired HMAC secret, requiring matching enrolled finger.
- **Serial Eavesdropping**: HMAC signatures and AES encryption options prevent payload tampering.
- **Replay Attacks**: Ephemeral nonces and timestamps invalidate reused serial messages.
- **Host Malware Injection**: Operating system keyrings enforce app isolation; TouchPass does not store plain-text secrets on disk.
- **Web Portal Exploitation**: Binding to `127.0.0.1`, strict origin check, and CSRF token validation.
- **Biometric Sensor Spoofing**: ZW101 optical sensor feature extraction and false acceptance rate (FAR < 0.001%).

### Section 3: 📋 Supported Versions & Maintenance Policy
- Active release support table (`2.0.x` supported, `< 2.0.0` EOL).
- Patch policy and security backport commitments.

### Section 4: 🚨 Responsible Vulnerability Disclosure Protocol
- Guidelines for reporting security issues privately (no public issues).
- Contact email (`security@touchpass.dev`) and GitHub Private Vulnerability Reporting.
- SLA Response Timeline:
  - **Acknowledgement**: Within 48 hours.
  - **Assessment & Patch Plan**: Within 7 business days.
  - **Public Disclosure**: Coordinated disclosure after fix release.

### Section 5: 🔒 Security Best Practices & Deployment Guidance
Operational hardening guidelines for users:
- Verifying firmware binary signatures & Web Flasher origins.
- Physical security of ESP32-S3 hardware.
- Pairing key generation, storage, and rotation procedures.
- Operating system account hardening and lock-screen settings.

### Section 6: ⚖️ Legal Disclaimer & Limitation of Liability
- Standard Open Source Warranty Disclaimer ("AS IS", NO WARRANTY).
- Authors & Maintainers Limitation of Liability clause.
- User Responsibility notice (Hardware assembly, wiring diagram verification, 3.3V vs 5V power safety, credential protection).

---

## 3. Repository Cross-References & Tests

1. **`README.md`**: Update security policy link to `SECURITY.md`.
2. **`README.vi.md`**: Update security policy link to `SECURITY.vi.md`.
3. **`docs/USER_GUIDE.md`**: Update English link to `SECURITY.md` and Vietnamese link to `SECURITY.vi.md`.
4. **`tests/test_documentation.py`**:
   - Add `SECURITY_VI` constant for `SECURITY.vi.md`.
   - Update `test_local_markdown_links_resolve` to verify links in both `SECURITY.md` and `SECURITY.vi.md`.
   - Update `test_security_md_contents` to verify English content in `SECURITY.md` and Vietnamese content in `SECURITY.vi.md`.
   - Update `test_disclaimer_embedded_in_docs` to verify correct target links for English vs Vietnamese docs.

---

## 4. Verification Plan

- Run `python run_test_gate.py` to ensure all markdown link checks and documentation test assertions pass.
- Verify file existence and readability of both `SECURITY.md` and `SECURITY.vi.md`.
