# TouchPass Threat Model: PIV Native Smart Card Authentication

## 1. System Scope and Assumptions

TouchPass operates as a dual-role hardware authenticator on an ESP32-S3 microcontroller:
1. **USB CCID / PIV Smart Card (NIST SP 800-73-4)** for operating system cold boot and pre-login authentication.
2. **USB CDC / Encrypted HID** for in-session macro automation and desktop helper pairing.

### Assumptions:
- Zero OS user account passwords, plaintext credentials, or master unlocking passwords are stored in ESP32-S3 Flash or NVS.
- The host OS (macOS / Windows) enforces standard PKI certificate validation over CCID.
- The physical ZW101 fingerprint sensor performs Match-on-Device (MoD), keeping raw biometric minutiae inside the sensor module and only signaling cryptographic authorization over secure UART.

---

## 2. Threat Vector Analysis & Mitigations

### 2.1 Physical Device Theft & Cold Extraction
- **Threat**: An attacker steals the TouchPass hardware device and attempts to extract cryptographic keys from Flash/NVS using physical dumping or SWD/JTAG debugging.
- **Impact**: If keys were plaintext or stored reversible OS passwords, the attacker could compromise the user account.
- **Mitigation**:
  - Zero OS passwords in firmware.
  - Flash encryption and Secure Boot on ESP32-S3.
  - Asymmetric private keys (`9A` / `9E`) are non-exportable and protected in dedicated encrypted NVS namespaces.
  - Even with raw private key extraction, possession of the key alone without the enrolled host certificate pairing cannot log into third-party accounts.

### 2.2 Biometric Bypass & Spoofing
- **Threat**: Attacker uses lifted latent fingerprints or artificial silicone molds on the ZW101 optical sensor.
- **Mitigation**:
  - ZW101 capacitive sensing layer and live skin detection heuristics.
  - Configurable consecutive failure lockout (e.g. 5 failed attempts locks PIV operations until physical reconnect / PIN authorization).

### 2.3 Malicious Host & Rogue APDU Replay
- **Threat**: Malware running on the host OS attempts to send forged APDU commands (`GENERAL AUTHENTICATE`) over CCID to silently sign challenges without the user's knowledge.
- **Mitigation**:
  - **Match-on-Device Hardware Gating**: The ESP32-S3 firmware enforces that `GENERAL AUTHENTICATE` for slot `9A` returns `SW_SECURITY_STATUS_NOT_SATISFIED (0x6982)` unless a live fingerprint match occurred within the preceding physical authorization window (e.g., 5 seconds, single-use token).
  - Silent signing without tactile user interaction is physically impossible.

### 2.4 Replay & Man-in-the-Middle on USB CDC / HID
- **Threat**: Malicious software snoops or replays USB CDC/HID packets.
- **Mitigation**:
  - All sensitive session commands use ephemeral nonces, HMAC-SHA256 authenticated framing, and AES-256-CTR encryption derived with `"SESSION|<nonce_hex>"`.

---

## 3. Threat Matrix Summary

| Threat ID | Threat Description | Severity | Mitigation Technique | Verification Method |
| :--- | :--- | :--- | :--- | :--- |
| **TH-01** | Firmware secret extraction | High | Zero OS passwords; encrypted NVS & flash encryption | Static audit & NVS dump verification |
| **TH-02** | Rogue APDU background signing | Critical | Physical fingerprint gate per cryptographic signature | Unit test & APDU gate contract |
| **TH-03** | Replay of auth challenges | High | Nonce freshness & TLS/Kerberos PKINIT challenge-response | Host OS smart-card PKI stack |
| **TH-04** | Brute force PIN attacks | Medium | PIV retry counter (default 3 tries, PUK unlock required) | APDU `VERIFY` retry tests |
