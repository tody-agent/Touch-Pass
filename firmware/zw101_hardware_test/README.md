# Test phần cứng ZW101 bằng Arduino IDE

Sketch này là một dự án Arduino độc lập, chỉ dùng để kiểm tra giao tiếp giữa
ESP32-S3 Super Mini và cảm biến vân tay ZW101. Sketch không cần thư viện ngoài
và không đăng ký, ghi đè hay xóa mẫu vân tay trong cảm biến.

## Đấu dây

ZW101 dùng nguồn và mức logic **3.3V**. Tuyệt đối không nối VCC, V_TOUCH, TX hoặc
RX của ZW101 vào 5V.

| ZW101 | ESP32-S3 Super Mini |
| --- | --- |
| V_TOUCH | 3V3 |
| TouchOut | GPIO2 |
| VCC | 3V3 |
| TX | chân RX in trên board |
| RX | chân TX in trên board |
| GND | GND |

TX/RX phải đấu chéo: TX của ZW101 đi vào RX của ESP32; RX của ZW101 đi vào TX
của ESP32. Sketch sẽ tự thử ba ánh xạ thường gặp của nhãn TX/RX trên các lô
ESP32-S3 Super Mini: GPIO43/44, GPIO42/41 và GPIO1/3.

## Nạp bằng Arduino IDE 2.x

1. Cài board package **esp32 by Espressif Systems** trong Boards Manager.
2. Mở trực tiếp file `zw101_hardware_test.ino` trong thư mục này.
3. Chọn board **ESP32S3 Dev Module**.
4. Trong menu **Tools**, chọn:
   - **USB CDC On Boot**: `Enabled`
   - **Flash Size**: đúng với board, thường là `4MB`
   - **PSRAM**: `Disabled` nếu board không có PSRAM
5. Chọn đúng cổng COM của ESP32-S3.
6. Bấm **Verify**, sau đó bấm **Upload**.
7. Mở **Serial Monitor**, chọn tốc độ **115200** baud và nhấn RESET nếu chưa có
   log.

Nếu Arduino IDE dừng ở `Connecting...`, giữ nút BOOT, nhấn rồi thả RESET, sau
đó thả BOOT khi quá trình ghi bắt đầu.

## Kết quả mong đợi

Khi kết nối đúng, Serial Monitor sẽ có các dòng tương tự:

```text
=== ZW101 HARDWARE TEST (READ-ONLY) ===
OK: ZW101 tai ESP32 TX=GPIO43, RX=GPIO44, baud=57600
So mau dang co: 0
Opcode hoat dong: 0x29
OK: ZW101 da chup duoc anh ngon tay (ACK=0x00).
```

- `ACK=0x00`: lệnh thành công; với lệnh chụp ảnh nghĩa là đã thấy ngón tay.
- `ACK=0x02`: chưa có ngón tay trên mặt cảm biến, đây không phải lỗi.
- `KHONG TIM THAY ZW101`: kiểm tra lại cả V_TOUCH và VCC đều có 3.3V, GND
  chung, sau đó kiểm tra TX/RX đã đấu chéo.
- Có phản hồi nhưng báo mật khẩu không phải `00000000`: module đã giao tiếp
  được nhưng đã bị đổi mật khẩu UART; sketch test không tự thay đổi mật khẩu.
