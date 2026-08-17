# TouchPass PIV Key & Certificate Provisioning Guide

## 1. Overview

TouchPass acts as a NIST SP 800-73-4 compliant cryptographic token. To perform pre-boot and login authentication on macOS and Windows, the device must contain:
1. **Asymmetric Private Key**: Generated or loaded into Slot `9A` (PIV Authentication) or Slot `9E` (Card Authentication).
2. **X.509 Certificate**: DER-encoded public key certificate written to Container `0x5FC105` (Slot `9A`).
3. **Cardholder Unique Identifier (CHUID)**: Container `0x5FC102`.
4. **Card Capability Container (CCC)**: Container `0x5FC107`.

---

## 2. On-Device vs. External Key Generation

### Method A: On-Chip Hardware Key Generation (Recommended)
1. TouchPass ESP32-S3 generates an RSA-2048 or NIST P-256 ECC private key inside hardware-protected NVS.
2. The public key is exported via APDU or CDC serial.
3. A Certificate Signing Request (CSR) is signed by the device.
4. The Enterprise CA or macOS local self-signed certificate issuer signs the public key.
5. The resulting X.509 certificate is written to slot `9A`.

### Method B: Secure Host Import
1. A 2048-bit RSA keypair is generated on an air-gapped or secure admin workstation.
2. The keypair and certificate are pushed into TouchPass NVS via authenticated CDC session (`CONFIG_UNLOCK` gated by fingerprint).

---

## 3. APDU Provisioning Commands

| Command | APDU Format | Description |
| :--- | :--- | :--- |
| **SELECT PIV** | `00 A4 04 00 09 A0 00 00 03 08 00 00 10 00` | Select PIV Application AID |
| **VERIFY PIN** | `00 20 00 80 08 30 30 30 30 30 30 FF FF` | Verify default/configured PIN |
| **PUT DATA (Cert 9A)** | `00 DB 3F FF <Len> 5C 03 5F C1 05 53 <CertData>` | Store X.509 certificate in slot 9A |
| **PUT DATA (CHUID)** | `00 DB 3F FF <Len> 5C 03 5F C1 02 53 <ChuidData>` | Write Cardholder Unique Identifier |
