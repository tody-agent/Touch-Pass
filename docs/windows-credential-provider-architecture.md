# TouchPass Windows Custom Credential Provider Architecture (Phase 7 Optional)

## 1. Overview and Motivation

While native PIV/CCID smart cards function seamlessly on macOS and Windows Active Directory / Entra ID CBA environments, **Windows Standalone / Local User Accounts (SAM)** do not support smart card logon out of the box.

Phase 7 introduces an **optional Custom Credential Provider DLL** (`TouchPassCredentialProvider.dll`) implementing Microsoft's `ICredentialProvider` and `ICredentialProviderCredential2` interfaces to allow biometric local account login without altering the core PIV firmware architecture.

---

## 2. Component Architecture

```
+----------------------------------------------------------------+
|                     Windows Logon UI (LogonUI.exe)             |
|                                                                |
|  +----------------------------------------------------------+  |
|  |           TouchPassCredentialProvider.dll                |  |
|  |     - ICredentialProvider                                |  |
|  |     - ICredentialProviderCredential2                     |  |
|  |     - Secure Desktop UI Tile & Fingerprint Prompt        |  |
|  +-----------------------------+----------------------------+  |
+--------------------------------|-------------------------------+
                                 | Local RPC / Named Pipe
+--------------------------------v-------------------------------+
|             TouchPass Windows Background Service               |
|     - USB CCID / CDC Listener                                  |
|     - Local Encrypted SAM Credential Vault                     |
|     - Cryptographic Challenge-Response with ESP32-S3           |
+--------------------------------+-------------------------------+
                                 | USB Physical Layer
+--------------------------------v-------------------------------+
|                   ESP32-S3 TouchPass Device                    |
|     - ZW101 Fingerprint Match-on-Device                        |
|     - Hardware Bound Private Key Signing                       |
+----------------------------------------------------------------+
```

---

## 3. Security & Anti-Lockout Safeguards

1. **Dual Logon Tile Display**:
   The custom provider always renders alongside the standard Windows Password / PIN tile. If TouchPass is unplugged or malfunctions, the user can click their standard password tile.
2. **Safe Mode Bypassing**:
   Windows Safe Mode automatically disables third-party Credential Providers, guaranteeing a rescue channel.
3. **Protected Process Light (PPL) & Code Signing**:
   The native DLL must be signed with a trusted Authenticode code signing certificate.
