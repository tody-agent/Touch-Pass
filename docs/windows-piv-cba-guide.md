# TouchPass Windows Smart Card & Entra ID CBA Guide

## 1. Overview

Windows 10/11 natively supports PIV/CCID smart cards through the Microsoft Generic Smart Card Minidriver / UsbCcid Class Driver (`WUDFUsbccidDriver`).

When used in enterprise environments:
- **Active Directory Domain**: Logon via Kerberos PKINIT.
- **Microsoft Entra ID (Azure AD)**: Cloud-native Certificate-Based Authentication (CBA).

---

## 2. Certificate Requirements for Windows Smart Card Logon

To allow Windows logon, the X.509 certificate loaded into TouchPass Slot `9A` must satisfy:

1. **Enhanced Key Usage (EKU)**:
   - `Smart Card Logon` (`1.3.6.1.4.1.311.20.2.2`)
   - `Client Authentication` (`1.3.6.1.5.5.7.3.2`)
2. **Subject Alternative Name (SAN)**:
   - Must contain the user's **User Principal Name (UPN)**, e.g. `user@domain.com` or `user@tenant.onmicrosoft.com`.
3. **Key Usage**:
   - `Digital Signature`
4. **Key Algorithm**:
   - RSA 2048-bit with SHA-256 or ECC NIST P-256 / P-384.

---

## 3. Windows PowerShell Enrollment Script

A helper script `software/scripts/windows_cert_enroll.ps1` automates:
1. Detecting connected PIV smart cards via `certutil -scinfo`.
2. Requesting a Smart Card Logon certificate from Active Directory Certificate Services (AD CS) or local CA.
3. Writing the resulting certificate to TouchPass container `9A`.

---

## 4. Local Account Limitation

Windows standalone/workgroup local accounts (SAM database) do not validate smart card PKI tokens natively. For local accounts, see **Phase 7: Custom Windows Credential Provider**.
