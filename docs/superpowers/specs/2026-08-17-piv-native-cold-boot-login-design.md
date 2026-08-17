# Design Spec: PIV Native Cold Boot Login Architecture

## 1. Goal and Core Principles

TouchPass transitions its cold boot authentication architecture to **native PIV (NIST SP 800-73-4 / CCID smart card)** standards. 

### Key Principles:
1. **Zero OS Passwords in Firmware**: No OS login credentials, passwords, or plaintext keys are stored in firmware flash or NVS.
2. **Match-on-Device Cryptographic Authorization**: The hardware ZW101 fingerprint sensor acts as a biometric gate for on-chip private key operations (`GENERAL AUTHENTICATE`).
3. **Standards-Compliant Identity**: Operating systems verify the device identity using standard X.509 PKI certificates through built-in CCID smart card subsystems.

---

## 2. Analysis of Feasibility Options

### Option 1: PIV Native (Recommended Standard)
- **Mechanism**: ESP32-S3 functions as a USB CCID / PIV smart card device.
- **Key Storage**: Asymmetric private keys (`9A` Authentication, `9E` Card Authentication) generated and stored securely on-chip.
- **Authorization**: Fingerprint touch authorizes signing challenges; Host OS validates the signature against enrolled X.509 certificates.
- **Platform Behaviors**:
  - **macOS Apple Silicon**: Native support for PIV at FileVault pre-boot screen and Login Window.
  - **macOS Apple T2**: FileVault requires initial password unlock; PIV authenticates at Login Window.
  - **Windows Domain / Entra CBA**: Native smart card logon supported out of the box via Active Directory / Entra ID Certificate-Based Authentication.
  - **Windows Local Accounts**: Not natively supported by Windows PIV stack without custom credential providers.

### Option 2: PIV Native + Windows Custom Credential Provider (Optional Phase 7)
- Retains PIV native for macOS, AD, and Entra ID.
- Introduces a native C++ Windows Credential Provider DLL to unlock Windows Local Accounts.
- Scope: High complexity (native DLL, driver signing, Secure Desktop isolation, anti-lockout fail-safes).

### Option 3: HID Password Storage in Firmware (Rejected)
- Insecure approach: storing plaintext/reversible OS passwords inside firmware flash and replaying keystrokes over USB HID.
- High risk of secret extraction upon physical theft. Explicitly rejected from standard architecture.

---

## 3. Phased Implementation Roadmap

- **Phase 0: Threat Model, Capability Matrix & Recovery Strategy**
- **Phase 1: HID ARM/ACT Protocol Stabilization**
- **Phase 2: PIV / CCID / APDU Core Engine & Biometric Key Gating**
- **Phase 3: Key Provisioning, CSR Generation & Desktop Management UX**
- **Phase 4: macOS PIV Login & FileVault Pre-Boot Integration**
- **Phase 5: Windows Active Directory & Microsoft Entra CBA Integration**
- **Phase 6: Hardware Testing, Recovery Gates & Changelog Finalization**
- **Phase 7 (Optional Extension): Windows Local Account Custom Credential Provider**

---

## 4. Quality Governance & Superpowers Workflow

- Planning → Red-Green TDD → Implementation → Code Review → Quality Gate.
- Failing automated tests written before implementation code.
- Mandatory approval gates before firmware flashing, FileVault modification, or release deployment.
- Real hardware verification required before claiming platform support.
