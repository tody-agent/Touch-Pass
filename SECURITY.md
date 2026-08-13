# 🛡️ TouchPass Security Policy & Disclaimer

This document outlines the security architecture, supported versions, vulnerability reporting procedures, and legal disclaimers for **TouchPass**.

---

## 1. 🏗️ Security Architecture Overview

TouchPass is designed with a defense-in-depth security model combining physical hardware biometrics, encrypted communication, and operating system credential management:

- **Hardware Biometrics (On-Chip Matching)**: Fingerprint enrollment, template storage, and biometric verification are executed locally on the ZW101 optical fingerprint sensor connected to the ESP32-S3 microcontroller. No biometric fingerprint images or minutiae templates are ever transmitted to or stored on the host computer, local storage files, or cloud services.
- **HMAC-SHA256 Challenge Protocol & Encrypted Serial Communication**: Communication between the host daemon and the ESP32-S3 firmware over Serial UART / USB uses a cryptographic challenge-response protocol. Requests are signed using HMAC-SHA256 (with optional AES-CTR payload encryption) to prevent replay attacks, unauthorized serial message injection, and tampering over the USB physical channel.
- **OS Credential Store Integration**: Sensitive credentials (such as system passwords or SSH/sudo secrets) are never saved in plain text within code repositories, configuration files, or firmware flash memory. TouchPass integrates directly with native operating system secure credential vaults:
  - **Windows**: Windows Credential Manager (via `win32crypt` / `keyring`)
  - **macOS**: macOS Keychain Services (via `keyring`)
  - **Linux**: Secret Service API / Freedesktop SecretService (via `keyring`)

---

## 2. 📋 Supported Versions

Security updates and patches are actively maintained for the following versions:

| Version | Supported | Status & Notes |
| :--- | :--- | :--- |
| `2.0.x` | ✅ Yes | Current active production release (bilingual, Web Flasher & USB HID). |
| `< 2.0.0` | ❌ No | Legacy preview releases; security fixes are not backported. |

---

## 3. 🚨 Reporting a Vulnerability

We take the security of TouchPass seriously. If you discover or suspect a security vulnerability in TouchPass, please report it responsibly:

1. **Do NOT create a public GitHub issue** for security vulnerabilities.
2. Send a detailed vulnerability report to the project maintainers via email at `security@touchpass.dev` or through GitHub Private Vulnerability Reporting.
3. Please include:
   - Description of the vulnerability and its potential impact.
   - Step-by-step instructions or Proof of Concept (PoC) to reproduce the issue.
   - Software version, OS environment, and hardware model (ESP32-S3 / ZW101).
4. **Response Timeline**:
   - **Acknowledgement**: Within 48 hours.
   - **Assessment & Fix Plan**: Within 7 business days.
   - **Public Disclosure**: Coordinated disclosure after a fix is available.

---

## 4. ⚖️ Legal Disclaimer & Limitation of Liability / Tuyên Bố Miễn Trừ Trách Nhiệm

### 🇺🇸 English: Disclaimer of Warranty & Limitation of Liability

> **TOUCHPASS IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS, MAINTAINERS, OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE, FIRMWARE, HARDWARE WIRING, OPTICAL BIOMETRIC SENSORS, OR THE USE OR OTHER DEALINGS IN TOUCHPASS.**
>
> **User Responsibility:**
> - Users assume full responsibility for physical hardware assembly, wiring diagram verification, voltage levels (3.3V vs 5V power safety), and fingerprint sensor calibration.
> - TouchPass automates local keyboard keystrokes and retrieves credentials from the OS secure store upon successful biometric verification. Users are solely responsible for securing physical access to their hardware and maintaining OS credential safety.

<br />

### 🇻🇳 Tiếng Việt: Tuyên Bố Miễn Trừ Trách Nhiệm & Giới Hạn Nghĩa Vụ Pháp Lý

> **TOUCHPASS ĐƯỢC CẤP PHÉP VÀ CUNG CẤP "NGUYÊN TRẠNG" (AS IS), KHÔNG CÓ BẤT KỲ BẢO HÀNH NÀO DƯỚI BẤT KỲ HÌNH THỨC NÀO, DÙ LÀ RÕ RÀNG HAY NGỤ Ý, BAO GỒM NHƯNG KHÔNG GIỚI HẠN Ở CÁC BẢO HÀNH VỀ KHẢ NĂNG THƯƠNG MẠI, SỰ PHÙ HỢP CHO MỘT MỤC ĐÍCH CỤ THỂ VÀ SỰ KHÔNG VI PHẠM. TRONG MỌI TRƯỜNG HỢP, CÁC TÁC GIẢ, NGƯỜI DUY TRÌ DỰ ÁN HOẶC NGƯỜI GIỮ BẢN QUYỀN SẼ KHÔNG CHỊU TRÁCH NHIỆM PHÁP LÝ ĐỐI VỚI BẤT KỲ KHIẾU NẠI, THIỆT HẠI HOẶC NGHĨA VỤ NÀO KHÁC—DÙ LÀ THEO HỢP ĐỒNG, BỒI THƯỜNG NGOÀI HỢP ĐỒNG HAY CÁCH KHÁC—PHÁT SINH TỪ, NGOÀI HOẶC LIÊN QUAN ĐẾN PHẦN MỀM, FIRMWARE, ĐẤU NỐI PHẦN CỨNG, CẢM BIẾN VÂN TAY QUANG HỌC, HOẶC VIỆC SỬ DỤNG HAY CÁC THAO TÁC KHÁC VỚI TOUCHPASS.**
>
> **Trách Nhiệm Của Người Dùng:**
> - Người dùng tự chịu toàn bộ trách nhiệm đối với việc lắp ráp phần cứng vật lý, kiểm tra sơ đồ đấu nối dây, điện áp hoạt động (an toàn nguồn 3.3V so với 5V) và hiệu chuẩn cảm biến vân tay.
> - TouchPass tự động hóa các thao tác bàn phím cục bộ và truy xuất mật khẩu từ kho lưu trữ chứng thư bảo mật OS sau khi xác thực vân tay thành công. Người dùng chịu trách nhiệm duy nhất trong việc bảo vệ thiết bị phần cứng vật lý khỏi việc truy cập trái phép và đảm bảo an toàn cho các chứng thư bảo mật.
