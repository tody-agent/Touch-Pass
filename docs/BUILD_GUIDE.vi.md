# Hướng Dẫn Lắp Ráp & Đấu Nối TouchPass

[🌐 **English**](BUILD_GUIDE.md) | 🇻🇳 **Tiếng Việt** | [🇨🇳 **简体中文**](BUILD_GUIDE.zh.md) | [🇷🇺 **Русский**](BUILD_GUIDE.ru.md)

Hướng dẫn này từng bước đưa bạn từ các linh kiện rời đến việc khởi chạy thành công hệ thống TouchPass trên Windows hoặc macOS. 

TouchPass là giao diện bàn phím HID tiện lợi, tự động gõ ký tự vào bất kỳ ứng dụng nào đang có con trỏ focus trên máy tính.

---

## Linh kiện & Phần cứng cần thiết

1. **Vi điều khiển ESP32-S3 Super Mini** (hoặc board Waveshare ESP32-S3-Zero).
2. **Cảm biến vân tay Optical ZW101** kèm giắc cắm 6 dây.
3. **Cáp dữ liệu USB Data** (Cần dây có khả năng truyền dữ liệu, dây chỉ sạc sẽ không nhận cổng COM/CDC).
4. **Dây cắm cắm nốt (Jumper wires)** 3.3V safe hoặc dây hàn điện tử.
5. Máy tính chạy Windows (10/11) hoặc macOS / Linux có cài đặt Python 3.9+ và Arduino IDE / `arduino-cli`.

---

## 1. Sơ đồ đấu nối dây (Hardware Wiring)

Cảm biến ZW101 và ESP32-S3 Super Mini đều hoạt động ở **mức điện áp 3.3V**. 

⚠️ **TUYỆT ĐỐI KHÔNG NỐI VCC HOẶC CÁC CHÂN UART CỦA ZW101 VỚI NGUỒN 5V.**

### Firmware unified ESP-IDF (khuyến nghị)

Đây là mapping dùng cho ứng dụng TouchPass desktop và firmware của Web Flasher.

| Chân ZW101 (6 chân) | Tên chức năng | Chân nối trên ESP32-S3 Super Mini | Hướng dẫn đấu nối |
| :---: | :--- | :--- | :--- |
| **1** | `V_TOUCH` | **`3V3`** | Nguồn cảm ứng vòng phát hiện ngón tay (3.3V) |
| **2** | `TouchOut` | **`GPIO2`** | Tín hiệu gợi ý có ngón tay; firmware vẫn kiểm tra ảnh qua UART |
| **3** | `VCC` | **`3V3`** | Nguồn chính cho cảm biến optical ZW101 (3.3V) |
| **4** | `TX` (ZW101) | **chân in `RX` trên board** | **Đấu chéo**: TX cảm biến ➔ RX của ESP32 |
| **5** | `RX` (ZW101) | **chân in `TX` trên board** | **Đấu chéo**: RX cảm biến ➔ TX của ESP32 |
| **6** | `GND` | **`GND`** | Chân nối đất chung (Ground) |

Hãy đấu theo chữ `TX` và `RX` in trực tiếp trên board. Một số biến thể
ESP32-S3 Mini 18 chân dùng chung hình dáng nhưng ánh xạ các nhãn này thành
GPIO43/44, GPIO42/41 hoặc GPIO1/3. Unified firmware tự dò mapping bằng phản hồi
EF-01 có checksum hợp lệ; không cần chuyển dây sang các chân đánh số để chọn mapping.

### Sketch Arduino legacy

Chỉ dùng mapping legacy này khi chủ động nạp `firmware/tiny_touch_keyboard`: `TouchOut→GPIO1`, `TX→GPIO6`, `RX→GPIO7`; các chân nguồn và GND giữ nguyên.

> 💡 **Lưu ý nối nguồn 3V3:** Cả 2 chân `V_TOUCH` (pin 1) và `VCC` (pin 3) đều cần cấp 3.3V. Bạn hãy chập chung 2 dây này lại và cắm vào duy nhất chân `3V3` trên ESP32-S3.

---

## 2. Biên dịch & Nạp Firmware

### Phương pháp 1: Dùng `arduino-cli` (Dòng lệnh - Khuyên dùng)

```bash
# 1. Biên dịch Firmware
arduino-cli compile --fqbn esp32:esp32:esp32s3:CDCOnBoot=cdc,UploadMode=cdc firmware/tiny_touch_keyboard

# 2. Nạp code xuống ESP32 (Ví dụ cổng COM3 trên Windows)
arduino-cli upload -p COM3 --fqbn esp32:esp32:esp32s3:CDCOnBoot=cdc,UploadMode=cdc firmware/tiny_touch_keyboard

# 2b. Nạp code trên macOS (Ví dụ cổng /dev/cu.usbmodem101)
arduino-cli upload -p /dev/cu.usbmodem101 --fqbn esp32:esp32:esp32s3:CDCOnBoot=cdc,UploadMode=cdc firmware/tiny_touch_keyboard
```

### Phương pháp 2: Dùng Arduino IDE GUI

1. Mở [`firmware/tiny_touch_keyboard/tiny_touch_keyboard.ino`](../firmware/tiny_touch_keyboard/tiny_touch_keyboard.ino) trong Arduino IDE 2.x.
2. Chọn Board: **ESP32S3 Dev Module**.
3. Chọn cấu hình trong menu **Tools**:
   - **USB Mode**: `USB-OTG (TinyUSB)`
   - **USB CDC On Boot**: `Enabled`
   - **Flash Size**: `4MB`
   - **PSRAM**: `Disabled`
4. Chọn đúng cổng COM / Serial port của ESP32-S3.
5. Bấm **Verify** rồi bấm **Upload**.

---

## 3. Khởi chạy Dịch vụ Helper & Web Portal

### Trên Windows (1-Click Launcher)

Nhấp đúp vào file **`start_touchpass.bat`** tại thư mục gốc của dự án. File batch sẽ tự động chạy dịch vụ helper và mở Web Portal tại `http://127.0.0.1:8787/`.

Hoặc chạy lệnh PowerShell:
```powershell
python run_portal_win.py
```

### Trên macOS / Linux

Chạy lệnh trong Terminal tại thư mục dự án:
```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r software/macos-helper/requirements.txt
.venv/bin/python software/macos-helper/tinytouch_helper.py
```

Mở trình duyệt tại địa chỉ: **`http://127.0.0.1:8787`**

---

## 4. Kiểm thử Chất lượng Tự động (Quality Test Gate)

Bạn có thể kiểm tra toàn bộ mã nguồn, cú pháp Python, unit tests và API live bất kỳ lúc nào bằng lệnh:

```bash
python run_test_gate.py
```

Script sẽ tự động kiểm tra 4 giai đoạn và trả về thông báo chiến thắng khi tất cả test pass 100%.

---

## Xử lý sự cố thường gặp (Troubleshooting)

| Sự cố | Cách khắc phục |
| --- | --- |
| Helper báo không tìm thấy thiết bị ESP32-S3 | Kiểm tra dây cáp USB (phải là cáp dữ liệu Data), bật tùy chọn `USB CDC On Boot` trong Arduino IDE, hoặc dùng tham số `--port COM3`. |
| Arduino IDE báo lỗi upload | Giữ nút **BOOT** trên board ESP32-S3, bấm thả nút **RESET**, thả nút **BOOT** rồi bấm Upload lại. |
| ESP32 nhận diện nhưng ZW101 báo lỗi sensor | Với board ESP32-S3 Super Mini 18 chân, kiểm tra TX cảm biến→chân in `RX` và RX cảm biến→chân in `TX` đã đấu chéo. Unified firmware tự dò GPIO43/44, GPIO42/41 và GPIO1/3; GPIO6/7 chỉ dành cho sketch Arduino legacy. Kiểm tra cả hai chân nguồn ZW101 đã nối 3V3 và GND chung. |
| Mật khẩu bị gõ sai ký tự | Chuyển bộ gõ bàn phím hệ thống sang chuẩn `ENG` / `US` / `ABC`. |
