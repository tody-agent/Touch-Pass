# TouchPass Disaster Recovery & Anti-Lockout Strategy

## 1. Overview and Anti-Lockout Tenets

A hardware authenticator must never become a single point of failure that locks users out of their operating system or workstation. TouchPass enforces strict anti-lockout architecture and disaster recovery workflows.

---

## 2. Operating System Recovery Channels

### 2.1 macOS FileVault Recovery
- **Standard Recovery Key (PRK)**: When FileVault is enabled, macOS generates a 24-character Institutional or Personal Recovery Key.
- **Password Fallback**: macOS maintains standard password authentication alongside smart card pairing unless `SmartCardEnforcement` is explicitly forced by MDM payload.
- **Unpairing Smart Card**: In case of lost hardware or sensor failure, booting into macOS Recovery (`Command+R` or long-press Power button on Apple Silicon) or using `sudo sc_auth unpair -u <username>` removes the hardware token requirement.

### 2.2 Windows Domain / Entra ID Recovery
- **LAPS / Local Administrator**: Enterprise endpoints maintain Local Administrator Password Solution (LAPS) or Break-Glass cloud admin accounts.
- **TAP (Temporary Access Pass)**: Entra ID users can authenticate using a time-limited Temporary Access Pass if their physical TouchPass smart card is unavailable.
- **BitLocker Recovery Key**: Standard BitLocker 48-digit numerical password stored in Microsoft Entra ID or Active Directory backup.

---

## 3. On-Device Recovery & Administration

### 3.1 PIV PIN & PUK Retries
- **PIN Verification**: Default 3 retry attempts before slot lock.
- **PUK (PIN Unblocking Key)**: Allows unlocking a blocked PIN without wiping provisioned private keys or certificates.
- **Management Key (3DES / AES-128 / AES-256)**: Required for writing certificates (`PUT DATA`) or generating new keypairs on-chip.

### 3.2 Sensor Degradation & Physical Recovery
- In case of physical damage to the ZW101 sensor:
  - If PIN fallback is enabled on device, user can enter standard smart card PIN via CCID `VERIFY` APDU.
  - Device can be factory-reset or reprogrammed via USB CDC console (`CONFIG_UNLOCK` followed by admin command).
