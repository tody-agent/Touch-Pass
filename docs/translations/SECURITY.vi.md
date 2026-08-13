# 🛡️ Chính Sách Bảo Mật & Tuyên Bố Miễn Trừ Trách Nhiệm TouchPass

[🌐 **English**](../../SECURITY.md) | 🇻🇳 **Tiếng Việt** | [🇨🇳 **简体中文**](SECURITY.zh.md) | [🇷🇺 **Русский**](SECURITY.ru.md)

---

Tài liệu này trình bày chi tiết về kiến trúc bảo mật, mô hình đe dọa, các phiên bản được hỗ trợ, quy trình báo cáo lỗ hổng bảo mật, khuyến nghị vận hành an toàn và tuyên bố miễn trừ trách nhiệm pháp lý cho **TouchPass**.

---

## 1. 🏗️ Tổng Quan Kiến Trúc Bảo Mật

TouchPass được thiết kế dựa trên mô hình bảo mật chuyên sâu nhiều lớp (Defense-in-Depth), kết hợp giữa sinh trắc học phần cứng vật lý, giao thức truyền thông chuỗi mã hóa, kho lưu trữ chứng thư bảo mật của hệ điều hành và cơ chế sandbox trình duyệt:

1. **Bảo Mật Sinh Trắc Học Phần Cứng (On-Chip Matching)**: Việc đăng ký vân tay, trích xuất đặc trưng, lưu trữ bản mẫu và xác thực vân tay 1:N được xử lý hoàn toàn nội bộ trên chip cảm biến quang học ZW101 kết nối với vi điều khiển ESP32-S3. Không có bất kỳ hình ảnh vân tay thô, dữ liệu minutiae hay bản mẫu sinh trắc học nào được truyền qua cổng USB, ghi vào tệp đĩa máy tính hoặc đồng bộ lên dịch vụ đám mây.
2. **Giao Thức Thách Thức HMAC-SHA256 & Mã Hóa Serial**: Giao tiếp giữa ứng dụng daemon trên máy chủ và firmware ESP32-S3 qua cổng Serial UART / USB sử dụng giao thức xác thực thách thức - phản hồi (challenge-response). Các yêu cầu được ký bằng thuật toán HMAC-SHA256 kết hợp với chuỗi nonce ngẫu nhiên dùng một lần nhằm chống lại các cuộc tấn công phát lại (replay attack), chèn lệnh serial trái phép và can thiệp đường truyền. Dữ liệu gói tin có thể kích hoạt mã hóa AES-CTR tùy chọn.
3. **Tích Hợp Kho Lưu Trữ Chứng Thư Hệ Điều Hành**: Mật khẩu hệ thống, quyền sudo và API key không bao giờ được lưu trữ dưới dạng văn bản thuần (plain-text) trong mã nguồn, tệp cấu hình hay bộ nhớ flash của vi điều khiển. TouchPass truy xuất mật khẩu theo yêu cầu thông qua `keyring` trực tiếp từ các kho bảo mật native của hệ điều hành:
   - **Windows**: Windows Credential Manager (qua `win32crypt` / `keyring`)
   - **macOS**: macOS Keychain Services (qua `keyring`)
   - **Linux**: Secret Service API / Freedesktop SecretService (qua `keyring`)
   Mật khẩu chỉ tồn tại trong bộ nhớ RAM của máy chủ trong thời gian ngắn đủ để thực thi thao tác và lập tức được xóa sạch khỏi bộ nhớ.
4. **Trình Duyệt Sandbox & Web Portal**: Công cụ nạp firmware Web Flasher hoạt động hoàn toàn trong cơ chế sandbox WebUSB/WebSerial của các trình duyệt hiện đại. Ứng dụng daemon Web Portal cục bộ chỉ lắng nghe trên giao diện loopback nội bộ (`127.0.0.1:8000`) và áp dụng nghiêm ngặt các tiêu đề Cross-Origin Resource Sharing (CORS) cũng như xác thực nguồn gốc (Origin validation) để ngăn chặn các trang web từ xa kích hoạt thao tác trái phép.
5. **An Toàn Phát Gõ Phím USB HID**: Các lệnh kích hoạt sau khi xác thực sinh trắc học thành công sẽ gửi các phím bấm bàn phím USB HID native trực tiếp tới cửa sổ ứng dụng đang được focus. TouchPass không thể nhấp vào các nút giao diện đồ họa (GUI), không tương tác với các ứng dụng chạy ẩn không được focus và không thể vượt qua ranh giới cô lập ứng dụng của hệ điều hành.

---

## 2. 🛡️ Mô Hình Đe Dọa & Ma Trận Giảm Thiểu (Threat Model)

Bảng dưới đây mô tả chi tiết mô hình đe dọa, các nguy cơ rủi ro được nhận diện và các cơ chế phòng vệ tương ứng trong TouchPass:

| Nguy Cơ Đe Dọa | Mức Độ Rủi Ro | Cơ Chế Giảm Thiểu & Phòng Vệ |
| :--- | :--- | :--- |
| **Mất Cắp Thiết Bị Phần Cứng (Dongle)** | Trung bình | Thiết bị phần cứng chỉ lưu trữ khóa bắt cặp HMAC. Việc giải phóng phím bấm đòi hỏi phải có vân tay vật lý trùng khớp trên cảm biến ZW101; việc kẻ gian lấy trộm phần cứng không giúp truy cập được mật khẩu. |
| **Nghe Lén Tín Hiệu USB / Serial** | Trung bình | Giao tiếp serial sử dụng chữ ký thông điệp HMAC-SHA256 kết hợp nonce biến đổi; tùy chọn mã hóa AES-CTR ngăn chặn việc nghe lén dữ liệu trên đường truyền USB. |
| **Tấn Công Phát Lại (Replay Attacks)** | Trung bình | Chuỗi nonce ngẫu nhiên dùng một lần và dấu thời gian (timestamp) đảm bảo các gói tin serial bị bắt lại không thể sử dụng lại bởi phần mềm trái phép. |
| **Mã Độc Máy Chủ / Trích Xuất Bộ Nhớ** | Cao | Mật khẩu được lưu trữ an toàn trong kho chứng thư hệ điều hành (Keychain / Credential Manager), chỉ lấy vào bộ nhớ RAM khi được phần cứng phê duyệt và xóa ngay sau khi phát phím. |
| **Khai Thác Từ Xa Qua Web Portal** | Cao | Server daemon cục bộ chỉ lắng nghe duy nhất trên IP loopback `127.0.0.1`; các yêu cầu API bắt buộc phải qua kiểm tra nguồn gốc CORS và phiên làm việc cục bộ. |
| **Giả Mạo Cảm Biến Vân Tay** | Thấp - Trung bình | Cảm biến quang học ZW101 trích xuất và so khớp đặc trưng vân tay trên chip với Tỷ lệ Chấp nhận Giả (FAR) < 0.001%. |

---

## 3. 📋 Phiên Bản Được Hỗ Trợ

Các bản vá bảo mật và cập nhật lỗ hổng được duy trì chủ động cho các phiên bản phần mềm và firmware sau:

| Phiên Bản | Được Hỗ Trợ | Trạng Thái & Ghi Chú Bảo Trì |
| :--- | :--- | :--- |
| `2.0.x` | ✅ Có | Phiên bản phát hành chính thức hiện tại (Đa ngôn ngữ Web Portal, Web Flasher & USB HID). |
| `< 2.0.0` | ❌ Không | Các phiên bản thử nghiệm cũ; các bản vá bảo mật không được port ngược về các bản cũ. |

---

## 4. 🚨 Báo Cáo Lỗ Hổng Bảo Mật & SLA

Chúng tôi coi trọng bảo mật của TouchPass. Nếu bạn phát hiện hoặc nghi ngờ có lỗ hổng bảo mật trong các thành phần phần cứng, firmware hoặc phần mềm của TouchPass, vui lòng báo cáo theo quy trình tiết lộ có trách nhiệm:

1. **KHÔNG tạo GitHub Issue công khai** hoặc đăng chi tiết lên các diễn đàn công cộng đối với các lỗ hổng chưa được vá.
2. Gửi báo cáo chi tiết cho đội ngũ duy trì dự án qua email `security@touchpass.dev` hoặc thông qua tính năng **GitHub Private Vulnerability Reporting**.
3. Vui lòng đính kèm các thông tin sau trong báo cáo của bạn:
   - Mô tả rõ ràng về lỗ hổng và tác động bảo mật tiềm ẩn.
   - Hướng dẫn các bước tái hiện sự cố hoặc mã kiểm chứng (Proof of Concept - PoC).
   - Phiên bản phần mềm, môi trường hệ điều hành và phiên bản phần cứng (ESP32-S3 / ZW101).

### Cam Kết Thời Gian Phản Hồi (SLA)
- **Xác nhận tiếp nhận**: Trong vòng **48 giờ** kể từ khi nhận báo cáo.
- **Đánh giá & Kế hoạch vá lỗi**: Trong vòng **7 ngày làm việc**.
- **Công bố công khai**: Được phối hợp công bố đồng thời hoặc sau khi bản vá bảo mật chính thức được phát hành.

---

## 5. 🔒 Khuyến Nghị Bảo Mật Cho Người Vận Hành

Để đảm bảo an toàn tối đa khi triển khai và sử dụng TouchPass:

- **Nguồn Firmware Chính Thức**: Chỉ nạp firmware được biên dịch từ các bản release chính thức hoặc sử dụng công cụ [TouchPass Web Flasher](https://tody-agent.github.io/Touch-Pass/web/flasher/) đã được xác thực.
- **Bảo Vệ Phần Cứng Vật Lý**: Hãy coi thiết bị TouchPass như một chìa khóa vật lý. Không để thiết bị cắm vào máy tính mà không có người giám sát trong môi trường không tin cậy.
- **An Toàn Khóa Bắt Cặp (Pairing Key)**: Giữ an toàn cho khóa HMAC bắt cặp giữa máy chủ và phần cứng. Nếu máy chủ hoặc thiết bị bị nghi ngờ lộ thông tin, hãy xoay vòng khóa (rotate key) và đăng ký lại chứng thư trong OS Credential Manager.
- **Bảo Vệ Tài Khoản Hệ Điều Hành**: Duy trì mã hóa toàn bộ ổ đĩa (BitLocker / FileVault) và đặt thời gian tự động khóa màn hình ngắn trên máy trạm.

---

## 6. ⚖️ Tuyên Bố Miễn Trừ Trách Nhiệm & Giới Hạn Nghĩa Vụ Pháp Lý

### Tuyên Bố Miễn Trừ Bảo Hành

> **TOUCHPASS ĐƯỢC CẤP PHÉP VÀ CUNG CẤP "NGUYÊN TRẠNG" (AS IS), KHÔNG CÓ BẤT KỲ BẢO HÀNH NÀO DƯỚI BẤT KỲ HÌNH THỨC NÀO, DÙ LÀ RÕ RÀNG HAY NGỤ Ý, BAO GỒM NHƯNG KHÔNG GIỚI HẠN Ở CÁC BẢO HÀNH VỀ KHẢ NĂNG THƯƠNG MẠI, SỰ PHÙ HỢP CHO MỘT MỤC ĐÍCH CỤ THỂ VÀ SỰ KHÔNG VI PHẠM. TRONG MỌI TRƯỜNG HỢP, CÁC TÁC GIẢ, NGƯỜI DUY TRÌ DỰ ÁN HOẶC NGƯỜI GIỮ BẢN QUYỀN SẼ KHÔNG CHỊU TRÁCH NHIỆM PHÁP LÝ ĐỐI VỚI BẤT KỲ KHIẾU NẠI, THIỆT HẠI HOẶC NGHĨA VỤ NÀO KHÁC—DÙ LÀ THEO HỢP ĐỒNG, BỒI THƯỜNG NGOÀI HỢP ĐỒNG HAY CÁCH KHÁC—PHÁT SINH TỪ, NGOÀI HOẶC LIÊN QUAN ĐẾN PHẦN MỀM, FIRMWARE, ĐẤU NỐI PHẦN CỨNG, CẢM BIẾN VÂN TAY QUANG HỌC, HOẶC VIỆC SỬ DỤNG HAY CÁC THAO TÁC KHÁC VỚI TOUCHPASS.**

### Trách Nhiệm Của Người Dùng & An Toàn Phần Cứng

- **Đấu Nối Phần Cứng & An Toàn Nguồn Điện**: Người dùng tự chịu toàn bộ trách nhiệm đối với việc lắp ráp phần cứng vật lý, kiểm tra sơ đồ đấu nối dây, an toàn mức điện áp (đảm bảo tách biệt đường nguồn 3.3V và 5V) và hiệu chuẩn cảm biến quang học.
- **An Toàn Mật Khẩu & Phát Phím**: TouchPass tự động hóa các thao tác bàn phím cục bộ và truy xuất mật khẩu từ kho lưu trữ chứng thư bảo mật OS sau khi xác thực vân tay thành công. Người dùng chịu trách nhiệm duy nhất trong việc bảo vệ thiết bị phần cứng vật lý khỏi việc truy cập trái phép, kiểm tra cửa sổ terminal đang focus và đảm bảo an toàn cho tài khoản hệ điều hành.

---

## 7. 🙏 Lời Cảm Ơn & Ghi Nhận Tác Giả Gốc

TouchPass được phát triển dựa trên kiến trúc nền tảng, giải pháp sinh trắc học phần cứng và mã nguồn mở của dự án **[TinyTouch](https://github.com/ZimengXiong/TinyTouch)** sáng tạo bởi tác giả **[Zimeng Xiong](https://github.com/ZimengXiong)**. Chúng tôi xin gửi lời cảm ơn chân thành nhất tới Zimeng Xiong cùng tất cả các nhà đóng góp mã nguồn mở ban đầu đã tạo ra nền tảng thiết bị bảo mật vân tay USB độc đáo này.
