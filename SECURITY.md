# 🛡️ TouchPass Security Policy & Legal Disclaimer

🌐 **English** | [🇻🇳 **Tiếng Việt**](SECURITY.vi.md)

---

This document outlines the security architecture, threat model, supported versions, vulnerability reporting procedures, operational best practices, and legal disclaimers for **TouchPass**.

---

## 1. 🏗️ Security Architecture Overview

TouchPass is built on a multi-layered defense-in-depth security model that bridges physical hardware biometrics, cryptographic serial communications, native host credential stores, and browser sandbox APIs:

1. **Hardware Biometrics (On-Chip Matching)**: Fingerprint enrollment, feature extraction, template storage, and 1:N biometric matching are performed entirely on-chip within the ZW101 optical fingerprint sensor connected to the ESP32-S3 microcontroller. No raw fingerprint images, minutiae data, or biometric templates are ever transmitted over USB, written to host disk files, or synced to cloud services.
2. **HMAC-SHA256 Challenge Protocol & Encrypted Serial Communication**: Communication between the host computer daemon and the ESP32-S3 firmware over Serial UART / USB physical channels uses a cryptographic challenge-response protocol. Requests are signed using HMAC-SHA256 combined with single-use rolling nonces to prevent replay attacks, unauthorized serial message injection, and channel tampering. Payload communications can optionally enable AES-CTR encryption.
3. **Native OS Credential Store Integration**: Sensitive passwords, sudo credentials, and API secrets are never saved in plain text within code repositories, configuration files, or microchip flash memory. TouchPass retrieves credentials on demand via `keyring` directly from native OS secure vaults:
   - **Windows**: Windows Credential Manager (via `win32crypt` / `keyring`)
   - **macOS**: macOS Keychain Services (via `keyring`)
   - **Linux**: Secret Service API / Freedesktop SecretService (via `keyring`)
   Credentials reside in host RAM only for the duration required to execute the requested action and are immediately purged.
4. **WebUSB / WebSerial & Web Portal Sandbox**: The browser-based Web Flasher operates strictly within modern browser WebUSB/WebSerial security sandboxes. The local TouchPass Web Portal daemon binds exclusively to local loopback (`127.0.0.1:8000`) and enforces strict Cross-Origin Resource Sharing (CORS) headers and origin validation to block unauthorized remote websites from triggering local actions.
5. **USB HID Keystroke Execution**: Verified biometric triggers send native USB HID keyboard keystrokes directly to the currently active focused application window. TouchPass cannot click GUI buttons, interact with non-focused background applications, or bypass OS application isolation boundaries.

---

## 2. 🛡️ Threat Model & Mitigation Matrix

The table below details TouchPass's threat model, identified risk vectors, and implemented security countermeasures:

| Threat Vector | Risk Level | Mitigation Mechanism |
| :--- | :--- | :--- |
| **Physical Dongle Theft** | Medium | The dongle stores only a paired HMAC key. Keystroke release requires a physical biometric match on the ZW101 sensor; stealing the hardware alone does not unlock credentials. |
| **USB / Serial Eavesdropping** | Medium | Serial communication uses HMAC-SHA256 message signatures with rolling nonces; optional AES-CTR payload encryption prevents passive channel eavesdropping. |
| **Replay Attacks** | Medium | Ephemeral single-use challenge nonces and timestamps ensure captured USB serial frames cannot be re-transmitted by unauthorized software. |
| **Host Malware / Memory Scraping** | High | Credentials are stored in native OS secure vaults (Keychain / Credential Manager), retrieved into memory only upon hardware approval, and wiped immediately post-execution. |
| **Web Portal Remote Exploitation** | High | Local server binds strictly to `127.0.0.1` loopback; API requests require strict CORS origin verification and local session checks. |
| **Biometric Sensor Spoofing** | Low-Medium | ZW101 optical biometric sensor feature matching with False Acceptance Rate (FAR) < 0.001% and local hardware verification. |

---

## 3. 📋 Supported Versions

Security patches and vulnerability updates are actively maintained for the following software and firmware releases:

| Version | Supported | Status & Maintenance Notes |
| :--- | :--- | :--- |
| `2.0.x` | ✅ Yes | Current active production release (Bilingual Web Portal, Web Flasher & USB HID). |
| `< 2.0.0` | ❌ No | Legacy preview releases; security fixes are not backported to obsolete versions. |

---

## 4. 🚨 Reporting a Vulnerability

We take the security of TouchPass seriously. If you discover or suspect a security vulnerability in TouchPass hardware, firmware, or software components, please report it responsibly:

1. **Do NOT create a public GitHub issue** or post details on public forums for undisclosed vulnerabilities.
2. Submit a detailed report to the project maintainers via email at `security@touchpass.dev` or through **GitHub Private Vulnerability Reporting**.
3. Please include the following details in your report:
   - Clear description of the vulnerability and its potential security impact.
   - Step-by-step reproduction instructions or Proof of Concept (PoC) code.
   - Software version, operating system environment, and hardware revision (ESP32-S3 / ZW101).

### Vulnerability Response SLA Timeline
- **Acknowledgement**: Within **48 hours** of report receipt.
- **Assessment & Fix Plan**: Within **7 business days**.
- **Coordinated Public Disclosure**: Released simultaneously with or following the publication of an official security patch.

---

## 5. 🔒 Security Best Practices for Operators

To ensure maximum security when deploying and using TouchPass:

- **Official Firmware Sources**: Only flash firmware compiled from official repository releases or using the verified [TouchPass Web Flasher](https://tody-agent.github.io/Touch-Pass/web/flasher/).
- **Physical Hardware Safety**: Treat your TouchPass hardware dongle as a physical key. Do not leave the dongle connected unattended in untrusted environments.
- **Pairing Key Security**: Keep your host-to-hardware HMAC pairing secret safe. If a host system or dongle is compromised, rotate your pairing key and re-register credentials in OS Credential Manager.
- **OS Account Protection**: Maintain full-disk encryption (FileBitLocker / FileVault) and short screen-lock timeouts on host workstations.

---

## 6. ⚖️ Legal Disclaimer & Limitation of Liability

### Disclaimer of Warranty

> **TOUCHPASS IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS, MAINTAINERS, OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE, FIRMWARE, HARDWARE WIRING, OPTICAL BIOMETRIC SENSORS, OR THE USE OR OTHER DEALINGS IN TOUCHPASS.**

### User Responsibility & Hardware Safety

- **Physical Wiring & Power Safety**: Users assume full responsibility for physical hardware assembly, wiring diagram verification, voltage level safety (ensuring 3.3V power rails are separated from 5V power rails), and optical sensor calibration.
- **Credential & Keystroke Safety**: TouchPass automates local keyboard keystrokes and retrieves credentials from native OS secure vaults upon successful biometric verification. Users are solely responsible for securing physical access to their hardware dongle, verifying focused terminal windows, and maintaining operating system account security.
