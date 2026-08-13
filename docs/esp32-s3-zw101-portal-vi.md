# ESP32-S3 Super Mini + ZW101 + tinyTouch Portal

Hướng dẫn này dành cho firmware HID trong `firmware/tiny_touch_keyboard` và portal
cục bộ chạy trên macOS. Portal quản lý tối đa 10 vân tay, từ slot 1 đến slot 10.

## 1. Đấu dây

ZW101 sử dụng nguồn và UART mức 3,3 V. Không nối VCC hoặc UART của module với 5 V.

| Chân ZW101 | Chức năng | ESP32-S3 Super Mini |
| --- | --- | --- |
| 1 | `V_TOUCH` | `3V3` |
| 2 | `TouchOut` | `GPIO1` |
| 3 | `VCC` | `3V3` |
| 4 | `TX` của ZW101 | `GPIO6` — RX của ESP32 |
| 5 | `RX` của ZW101 | `GPIO7` — TX của ESP32 |
| 6 | `GND` | `GND` |

Không dùng GPIO0, GPIO3, GPIO45 hoặc GPIO46 cho ZW101 vì đây là các chân
strapping của ESP32-S3.

## 2. Chuẩn bị Arduino IDE

Cài package `esp32 by Espressif Systems` phiên bản 3.x và chọn:

| Tùy chọn | Giá trị |
| --- | --- |
| Board | `ESP32S3 Dev Module` |
| USB Mode | `USB-OTG (TinyUSB)` |
| USB CDC On Boot | `Enabled` |
| Flash Size | `4MB` |
| PSRAM | `Disabled` |

Board Waveshare ESP32-S3-Zero không có chip USB-to-UART. Nếu upload không bắt
đầu, giữ nút **BOOT**, nhấn **RESET**, thả **RESET**, rồi thả **BOOT** và upload
lại.

## 3. Tạo khóa ghép đôi

Trong Terminal, tại thư mục repository:

```sh
python3 -m venv .venv
. .venv/bin/activate
pip install -r software/macos-helper/requirements.txt

pairing_key="$(openssl rand -hex 32)"
python software/macos-helper/tinytouch_helper.py \
  --set-pairing-key "$pairing_key"
```

Sao chép file mẫu:

```sh
cp firmware/tiny_touch_keyboard/secrets.example.h \
   firmware/tiny_touch_keyboard/secrets.h
```

Chuyển 64 ký tự hex trong `$pairing_key` thành 32 giá trị `0xNN` và thay mảng
`PAIRING_KEY` trong `secrets.h`. Hai phía bắt buộc phải dùng cùng khóa.
`secrets.h` đã nằm trong `.gitignore`; không commit hoặc chia sẻ file này.

Sau đó mở `tiny_touch_keyboard.ino` và upload với các tùy chọn ở phần 2.

## 4. Chạy portal

Kết nối board bằng cáp USB data rồi chạy:

```sh
.venv/bin/python software/macos-helper/tinytouch_helper.py
```

Mặc định helper đồng thời chạy portal tại:

```text
http://127.0.0.1:8787
```

Nếu Mac có nhiều thiết bị `/dev/cu.usbmodem*`, chỉ định rõ cổng:

```sh
.venv/bin/python software/macos-helper/tinytouch_helper.py \
  --port /dev/cu.usbmodem101
```

Portal chỉ bind loopback, không mở qua Wi‑Fi hoặc LAN. Không mở Serial Monitor
trong khi helper đang chạy vì mỗi lần chỉ một chương trình được sở hữu cổng CDC.

## 5. Đăng ký và cấu hình ngón tay

Portal luôn hiển thị đúng 10 slot.

1. Bấm **Cấu hình**, đặt tên như `Mac Login`, `Codex Accept` hoặc
   `Claude Code Accept`.
2. Chọn hành động và lưu cấu hình.
3. Bấm **Đăng ký**.
4. Đặt ngón tay lần thứ nhất, nhấc ra khi portal yêu cầu, rồi đặt lại cùng ngón
   lần thứ hai.
5. Khi trạng thái chuyển thành `Đăng ký hoàn tất`, slot đã sẵn sàng.

Các hành động phiên bản đầu:

| Preset | Hành vi |
| --- | --- |
| Mật khẩu + Enter | Gõ mật khẩu ASCII lưu trong Keychain rồi Enter; chạm một lần |
| Accept | Gõ `y` rồi Enter; phải chạm lại cùng ngón trong 3 giây |
| Enter | Nhấn Enter; phải chạm kép |
| Escape | Nhấn Escape; phải chạm kép |
| Chuỗi tùy chỉnh | Tối đa 16 bước Text, Key hoặc Delay; phải chạm kép |

Mật khẩu không nằm trong JSON cấu hình và portal không đọc ngược giá trị để
hiển thị. Khi đổi slot từ Password sang hành động khác hoặc xóa slot, Keychain
item tương ứng cũng bị xóa.

## 6. Giải thích kiến trúc & Cơ chế an toàn (FAQ)

### 6.1 Helper là gì và hoạt động ở đâu?
- **Helper** (`tinytouch_helper.py`) là một ứng dụng/dịch vụ chạy **trên máy tính** (macOS/Windows), không phải trên chip ESP32.
- **Nhiệm vụ của Helper:**
  1. Chạy Web Portal cục bộ (`http://127.0.0.1:8787`) để người dùng cấu hình ngón tay và đăng ký vân tay qua trình duyệt.
  2. Lắng nghe tín hiệu quét vân tay từ ESP32 gửi qua cổng USB.
  3. Tra cứu hành động tương ứng với ngón tay đó, giải mã mật khẩu từ kho lưu trữ an toàn của máy tính và gửi trả lại cho ESP32 thực hiện gõ phím.

### 6.2 Dữ liệu và mật khẩu được lưu trữ ở đâu?

| Loại dữ liệu | Vị trí lưu trữ | Chi tiết bảo mật |
| --- | --- | --- |
| **Bản mẫu vân tay (Fingerprint)** | Cảm biến ZW101 / ESP32 | Lưu trong bộ nhớ flash của cảm biến ZW101 dưới dạng dữ liệu sinh trắc mã hóa theo ID slot (1 - 10). |
| **Cấu hình ngón tay (Profile/Settings)** | Máy tính (`profiles.json`) | Lưu tên ngón tay, loại hành động (Password, Macro, Key) trên máy tính. |
| **Mật khẩu (Passwords)** | Máy tính (macOS Keychain) | Mật khẩu được lưu trực tiếp trong **macOS Keychain** hệ thống. **ESP32 không lưu mật khẩu thô trong chip**. |

### 6.3 Mật khẩu có an toàn không?
- **Điểm an toàn:** Mật khẩu nằm trong macOS Keychain mã hóa phần cứng. ESP32 chỉ nhận mật khẩu tạm thời qua kết nối USB mã hóa (Pairing Key) ngay tại thời điểm bạn chạm đúng vân tay. Dù ai đó lấy trộm phần cứng ESP32 cũng không thể lấy được mật khẩu.
- **Rủi ro lưu ý:** 
  - Đóng vai trò như Bàn phím USB HID tự động gõ ký tự vào ô đang focus, nên nếu bạn bấm nhầm khi con trỏ ở sai vị trí (ví dụ ô chat), mật khẩu sẽ bị gõ ra ngoài.
  - Tín hiệu UART giữa cảm biến ZW101 và ESP32 chưa mã hóa phần cứng, cần lưu ý rủi ro can thiệp vật lý trực tiếp.

### 6.4 Hệ thống dùng được cho Windows chưa hay chỉ macOS?
- **macOS:** Hỗ trợ chính thức và hoàn chỉnh nhất (tích hợp bảo mật macOS Keychain).
- **Windows:** Đã hỗ trợ khởi chạy Web Portal cài đặt và các tính năng USB HID cơ bản (gõ văn bản, phím tắt, macro, Enter/Escape). Tuy nhiên, tính năng lưu trữ mật khẩu bảo mật qua hệ thống Credential Manager của Windows hiện đang được hoàn thiện thêm.

## 7. Chẩn đoán nhanh

- Portal báo **Chưa tìm thấy ESP32-S3**: kiểm tra cáp data, USB CDC On Boot và
  tùy chọn `--port`.
- ESP32 kết nối nhưng ZW101 lỗi: kiểm tra TX/RX có đấu chéo, cả hai chân nguồn
  đều là 3V3, và baud mặc định của ZW101 là 57.600.
- Nhận đúng vân tay nhưng không có phím: kiểm tra pairing key ở Mac và
  `secrets.h` có giống nhau hay không.
- Mật khẩu bị sai ký tự: chuyển input source của macOS sang `ABC` hoặc `US`.
- Accept chưa chạy sau lần chạm đầu: đây là hành vi an toàn; nhấc tay rồi chạm
  lại đúng ngón trong vòng 3 giây.

## Giới hạn an toàn

HID gửi phím tới cửa sổ đang được focus và không thể xác minh ứng dụng đích.
Đường UART giữa ZW101 và ESP32 cũng không được xác thực. Không dùng thiết bị này
để bảo vệ dữ liệu có yêu cầu an ninh cao hoặc trong môi trường có nguy cơ truy
cập vật lý trái phép.

