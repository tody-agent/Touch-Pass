# TouchPass macOS PIV Smart Card & FileVault Integration Guide

## 1. Architecture on macOS

macOS includes native smart card support via `SmartCardServices` (`CryptoTokenKit` and `tokend` architecture). When an ESP32-S3 TouchPass device running CCID/PIV firmware is connected, macOS enumerates the card and reads container `0x5FC105` (slot `9A`).

---

## 2. Pairing with User Account

To pair a TouchPass smart card token with a local or directory user on macOS:

```bash
# 1. Discover smart card identity hash
sc_auth identities

# 2. Pair smart card with the target user account
sudo sc_auth pair -u <username> -h <40_char_identity_hash>

# 3. Verify pairing status
sc_auth list <username>
```

When prompted during pairing:
- **Terminal Password**: Current macOS user password.
- **Smart Card PIN**: Default device PIN (`000000`).
- **Physical Fingerprint**: Touch your enrolled finger on the TouchPass sensor to release the cryptographic signature.

---

## 3. FileVault Pre-Boot Integration

### Apple Silicon (M1 / M2 / M3 / M4)
- Apple Silicon Macs bind smart-card tokens directly to the FileVault APFS Pre-Boot volume policy.
- At power-on or cold boot, the FileVault login window renders the user tile with a smart-card icon.
- Inserting TouchPass and touching the fingerprint sensor decrypts the volume key and completes cold boot logon.

### Apple T2 Security Chip (Intel)
- T2 chip bridgeOS handles initial FileVault disk decryption via local secure enclave / user password.
- Once FileVault decrypts and boots into the macOS Login Window, TouchPass authenticates subsequent session logins and `sudo` privilege escalation.

---

## 4. Troubleshooting & Recovery

- **Unpairing lost device**:
  ```bash
  sudo sc_auth unpair -u <username>
  ```
- **Resetting smart-card caching**:
  ```bash
  sudo killall -9 SecurityAgent
  ```
