# TouchPass Platform Capability Matrix: PIV Native & Pre-Boot Logon

## 1. Operating System & Hardware Compatibility

| Platform / Architecture | Cold Boot / Pre-Boot Unlock | Login Window Authentication | Sudo / Privilege Elevation | Required Software / Drivers |
| :--- | :--- | :--- | :--- | :--- |
| **macOS Apple Silicon (M1 / M2 / M3 / M4)** | **Full FileVault Pre-Boot** (CCID smart card native) | **Supported** (Native SmartCardServices) | **Supported** (`pam_smartcard.so`) | Built-in CCID driver (`sc_auth` pairing) |
| **macOS Apple T2 Security Chip (Intel)** | Not supported at FileVault pre-boot (requires OS password/Secure Enclave) | **Supported** (at macOS Login Window after FileVault unlock) | **Supported** (`pam_smartcard.so`) | Built-in CCID driver (`sc_auth` pairing) |
| **macOS Non-T2 Intel (Legacy)** | Not supported natively at FileVault EFI screen | **Supported** (at macOS Login Window) | **Supported** (`pam_smartcard.so`) | Built-in CCID driver |
| **Windows 10 / 11 Enterprise (Active Directory Domain)** | **Supported** (Domain Kerberos PKINIT Smart Card Logon) | **Supported** | **Supported** (UAC Smart Card elevation) | Native Windows `WUDFUsbccidDriver` + Enterprise CA Cert |
| **Windows 10 / 11 Cloud (Microsoft Entra ID CBA)** | **Supported** (Entra Certificate-Based Authentication at Login Screen) | **Supported** | **Supported** (UAC Smart Card elevation) | Native Windows Smart Card Class Driver + Entra CBA tenant |
| **Windows 10 / 11 Local Account (Standalone / Workgroup)** | Not supported by native PIV | Not supported by native PIV | Not supported by native PIV | Requires **Phase 7: Custom Windows Credential Provider DLL** |
| **Linux (Ubuntu / Debian / Fedora / Arch)** | Supported via GRUB / cryptsetup `fido2`/`pkcs11` hooks | **Supported** (via `pam_pkcs11` / `pcscd`) | **Supported** (`sudo` via `pam_pkcs11`) | `pcscd`, `opensc` |

---

## 2. Platform Nuances & Documentation References

### Apple Silicon vs Apple T2
- On **Apple Silicon**, FileVault pre-boot uses APFS encryption volume keys bound to the Local Policy and CCID token container. TouchPass presents its X.509 certificate and answers the pre-boot challenge directly. Ref: [Apple Platform Deployment: Smart Card Authentication](https://support.apple.com/en-gb/guide/deployment/dep806850525/web).
- On **Apple T2**, pre-boot FileVault is handled in bridgeOS and does not enumerate third-party USB CCID devices. Once unlocked into macOS Login Window, SmartCardServices takes over.

### Windows Authentication Scenarios
- Native Windows Logon UI queries the Smart Card Subsystem (`scardsvr`) and attempts Kerberos PKINIT (`ksetup` / AD KDC) or cloud CBA authentication.
- Standalone/Local Windows accounts reject smart card credentials because local SAM does not perform X.509 path validation without a domain controller or custom Credential Provider. Ref: [Microsoft Smart Card Certificate Requirements](https://learn.microsoft.com/en-us/windows/security/identity-protection/smart-cards/smart-card-certificate-requirements-and-enumeration) and [Windows Logon Scenarios](https://learn.microsoft.com/en-us/windows-server/security/windows-authentication/windows-logon-scenarios).
