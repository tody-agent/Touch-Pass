# TouchPass

[🌐 **English**](README.md) | 🇻🇳 **Tiếng Việt**

> Cho mỗi ngón tay một siêu năng lực.

![TouchPass Web Portal Hero Showcase](assets/demo/06-touchpass-portal-hero.jpg)

## TouchPass là gì?

**TouchPass** là nền tảng **Mã hóa Sinh trắc học & Giả lập Bàn phím USB HID Native** mã nguồn mở được vận hành bởi vi điều khiển **ESP32-S3 Super Mini** và cảm biến vân tay optical **ZW101**.

TouchPass biến từng cú chạm vân tay vật lý thành phím tắt lập trình viên instant, xác nhận lệnh terminal, tự động điền mật khẩu an toàn và chạy macro bàn phím đa bước trên máy tính (Windows, macOS, Linux). Giả lập bàn phím USB HID phần cứng trực tiếp giúp TouchPass hoạt động native như một bàn phím USB tiêu chuẩn mà không cần cài đặt driver thiết bị HID tùy chỉnh.

Dự án kết hợp giữa phần cứng USB HID, dịch vụ helper chạy ngầm cục bộ và Web Portal quản lý trên trình duyệt dựa trên nền tảng open-source [ZimengXiong/TinyTouch](https://github.com/ZimengXiong/TinyTouch).

---

## Tính năng nổi bật

- 🚀 **Quy trình Onboarding tương tác**: Hướng dẫn 4 bước trực quan kiểm tra ngay phím gõ HID, sơ đồ đấu nối dây phần cứng và đăng ký ngón tay ban đầu.
- 🖐️ **10 Slot Vân tay Sinh trắc**: Ánh xạ tối đa 10 ngón tay (Slot 01–10) với các phím tắt, mật khẩu hoặc macro đa bước riêng biệt.
- ⚡ **Nhật ký live Debug Log Monitor**: Giám sát real-time với các huy hiệu sự kiện phân màu (`TOUCH`, `MATCH`, `PW`, `ERR`, `SYS`) để chẩn đoán phần cứng tức thì.
- ⌨️ **Bộ ghi phím tắt Shortcut Recorder**: Bắt trực tiếp các phím gõ vật lý và phím modifier (`Ctrl`, `Shift`, `Alt/Option`, `Cmd/Meta`) ngay trên giao diện Web Portal.
- 🤖 **Thư viện AI Tools Preset 1-Click**: Tích hợp sẵn mẫu phím tắt cho các công cụ lập trình AI hàng đầu bao gồm Claude Code CLI, Cursor IDE, Claude Desktop và Antigravity IDE.
- 🛡️ **Cơ chế an toàn Chạm kép (Double-Touch Confirmation)**: Mật khẩu kích hoạt ngay sau 1 lần chạm; các hành động điều khiển (Accept, Enter, Escape, Custom Macro) bắt buộc chạm lại ngón tay đó **lần 2 trong 3 giây** để tránh bấm nhầm lệnh.

---

## Trải nghiệm thực tế

![TouchPass xác nhận prompt trên Mac mini](assets/demo/02-mac-mini-claude-accept-v2.png)

Lệnh **Accept** tự động gõ `y` + Enter. Chỉ sử dụng trong cửa sổ terminal đang focus kỳ vọng câu trả lời này; Touch Pass là bàn phím HID nên không thể nhấp vào nút giao diện đồ họa GUI tùy ý. Accept và các phím điều khiển cần xác nhận an toàn: chạm cùng ngón tay 2 lần trong 3 giây.

![TouchPass Tổng quan tính năng](assets/demo/04-features.png)

---

## Hướng dẫn khởi chạy nhanh

TouchPass yêu cầu môi trường Python 3.9+ để chạy dịch vụ helper cục bộ và Web Portal (`http://127.0.0.1:8787/`).

### 1. Khởi chạy Web Portal trên Windows (Khuyên dùng)

> 💡 **Khởi chạy 1-Click**: Trên Windows, chỉ cần nhấp đúp vào **`start_touchpass.bat`** tại thư mục gốc của dự án. File batch sẽ tự động khởi chạy dịch vụ và mở `http://127.0.0.1:8787/` trên trình duyệt mặc định!

Hoặc chạy thủ công qua PowerShell:
```powershell
python run_portal_win.py
```

### 2. Khởi chạy trên macOS / Linux
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r software/macos-helper/requirements.txt
python software/macos-helper/tinytouch_helper.py
```

Truy cập **`http://127.0.0.1:8787/`** trên trình duyệt để mở Web Portal TouchPass.

---

## Biên dịch & Nạp Firmware

Firmware TouchPass chạy trên mạch ESP32-S3 với chế độ USB OTG Native (`firmware/tiny_touch_keyboard`).

### Nạp code qua `arduino-cli` (Dòng lệnh):

```bash
# Biên dịch firmware
arduino-cli compile --fqbn esp32:esp32:esp32s3:CDCOnBoot=cdc,UploadMode=cdc firmware/tiny_touch_keyboard

# Nạp xuống ESP32 (Ví dụ cổng COM3 trên Windows)
arduino-cli upload -p COM3 --fqbn esp32:esp32:esp32s3:CDCOnBoot=cdc,UploadMode=cdc firmware/tiny_touch_keyboard
```

### Nạp code qua Arduino IDE GUI:
1. Mở `firmware/tiny_touch_keyboard/tiny_touch_keyboard.ino` trong Arduino IDE 2.x.
2. Chọn Board: **ESP32S3 Dev Module**.
3. Cấu hình tùy chọn:
   - **USB Mode**: `USB-OTG (TinyUSB)`
   - **USB CDC On Boot**: `Enabled`
   - **Flash Size**: `4MB`
   - **PSRAM**: `Disabled`
4. Bấm **Verify** rồi bấm **Upload**.

---

## Cấu trúc thư mục dự án

```text
TouchPass/
├── assets/                  # Hình ảnh tài liệu, hero showcase và sơ đồ
├── docs/                    # Tài liệu hướng dẫn chi tiết
│   ├── BUILD_GUIDE.md       # Hướng dẫn đấu nối phần cứng & biên dịch (Tiếng Anh)
│   ├── BUILD_GUIDE.vi.md    # Hướng dẫn đấu nối phần cứng & biên dịch (Tiếng Việt)
│   ├── USER_GUIDE.md        # Cẩm nang sử dụng & AI presets (Tiếng Anh)
│   └── USER_GUIDE.vi.md     # Cẩm nang sử dụng & AI presets (Tiếng Việt)
├── firmware/                # Mã nguồn firmware cho vi điều khiển
│   ├── tiny_touch_keyboard/ # Firmware Arduino chính cho ESP32-S3 + ZW101 HID
│   └── tiny_touch_smartcard/# Firmware ESP-IDF nhà máy
├── software/                # Dịch vụ Helper & Web Portal backend
│   └── macos-helper/        # Dịch vụ Python, Keychain/Credential Manager & API
├── tests/                   # Bộ kiểm thử tự động (Unit Test & Test Gate)
├── run_portal_win.py        # Runner chính trên Windows
├── run_test_gate.py         # Bộ kiểm thử chất lượng tự động 4 giai đoạn
├── start_touchpass.bat      # Script 1-Click Launcher cho Windows
└── README.md                # Tài liệu tổng quan dự án
```

---

## Các loại hành động được hỗ trợ

| Loại hành động | Mô tả & Ví dụ |
| :--- | :--- |
| **Văn bản (Text)** | Gõ chuỗi ký tự ASCII vào cửa sổ đang focus. |
| **Phím bấm (Key)** | Gửi phím bấm đơn hoặc tổ hợp phím (ví dụ Enter, Escape, `Ctrl+C`). |
| **Trễ (Delay)** | Tạm dừng vài millisecond trong chuỗi macro tùy chỉnh. |
| **Mật khẩu (Password)** | Lấy mật khẩu từ OS Credential Manager (Windows Credential Manager / macOS Keychain) mã hóa và gõ tự động. |

---

## Bảo mật & An toàn

- **Safety con trỏ focus**: TouchPass hoạt động như bàn phím USB HID tiêu chuẩn. Ký tự sẽ được gõ vào cửa sổ ứng dụng đang có con trỏ focus. Luôn kiểm tra vị trí con trỏ trước khi đặt vân tay.
- **Lưu trữ mật khẩu**: Mật khẩu được lưu trữ an toàn trong kho Credential hệ thống (Windows Credential Manager / macOS Keychain) và truyền qua USB mã hóa AES-CTR.

---

## Tài liệu chi tiết

- 🛠️ [Hướng dẫn lắp ráp & Đấu nối (EN)](docs/BUILD_GUIDE.md) | [🇻🇳 Bản Tiếng Việt](docs/BUILD_GUIDE.vi.md)
- 📖 [Cẩm nang sử dụng (EN)](docs/USER_GUIDE.md) | [🇻🇳 Bản Tiếng Việt](docs/USER_GUIDE.vi.md)

---

## Phát triển trên nền TinyTouch

TouchPass được xây dựng dựa trên [ZimengXiong/TinyTouch](https://github.com/ZimengXiong/TinyTouch), nền tảng mở cho xử lý sinh trắc học vân tay và giả lập USB HID.
