# TouchPass Desktop: Cài đặt và sử dụng lần đầu

Hướng dẫn này dành cho ứng dụng desktop Tauri và firmware unified TouchPass được khuyến nghị. Tải đúng gói theo hệ điều hành tại [GitHub Releases](https://github.com/tody-agent/Touch-Pass/releases/latest), sau đó đối chiếu mã băm trong `checksums.txt` trước khi cài.

## Chọn gói cài đặt

| Hệ điều hành | File tải về | Cách cài |
| --- | --- | --- |
| Windows x64 | `TouchPass_*_x64-setup.exe` | Chạy bộ cài NSIS; có thêm ZIP portable. |
| macOS Apple Silicon | `TouchPass_*_aarch64.dmg` | Mở DMG, kéo TouchPass vào Applications. |
| macOS Intel | `TouchPass_*_x64.dmg` | Mở DMG, kéo TouchPass vào Applications. |
| Debian/Ubuntu x64 | `touchpass_*_amd64.deb` | Chạy `sudo apt install ./touchpass_*_amd64.deb`. |
| Linux x64 khác | `touchpass_*_amd64.AppImage` | Chạy `chmod +x touchpass_*.AppImage && ./touchpass_*.AppImage`. |

Bản macOS hiện chưa notarize. Nếu macOS chặn lần mở đầu, giữ Control, bấm TouchPass, chọn **Open** rồi xác nhận. Trên Linux, cần Secret Service như GNOME Keyring hoặc KWallet để lưu tác vụ mật khẩu cục bộ.

## Kết nối và cấu hình lần đầu

1. Nạp firmware unified, sau đó cắm TouchPass bằng cáp USB có truyền dữ liệu.
2. Mở TouchPass. Thanh trên cùng sẽ hiện trạng thái thiết bị và cảm biến. Nếu hiện bootloader, nhả BOOT/IO0 rồi reset hoặc rút/cắm lại board.
3. Mở **Cài đặt → Thiết bị**. Firmware mới sẽ báo cần cấu hình HID.
4. Chọn **Cấu hình chế độ HID**. Nếu đã có vân tay, chạm đúng ngón đã đăng ký khi app yêu cầu xác thực. Thiết bị chưa có vân tay sẽ theo luồng thiết lập lần đầu của firmware.
5. Đợi trạng thái **Sẵn sàng sử dụng**. App chỉ lưu khóa ghép nối sau khi thiết bị xác nhận cả khóa và chế độ HID.
6. Quay lại màn hình chính, chọn ngón, chọn tác vụ, rồi bấm **Lưu và quét vân tay**. Với ngón đã cài, bấm **Lưu thay đổi**.

## Sử dụng hằng ngày

- Đóng cửa sổ chỉ ẩn app xuống system tray; automation vẫn tiếp tục. Chọn Thoát từ tray để kết thúc hẳn.
- Dùng **Thêm** cạnh ngón đã cài để quét lại, thử bằng cách chạm cảm biến, tắt tác vụ hoặc xóa vân tay sau xác nhận.
- Mật khẩu ở Windows Credential Manager, macOS Keychain hoặc Linux Secret Service; TouchPass không đồng bộ vân tay/mật khẩu/profile lên cloud.
- Đổi Việt/Anh/Trung giản thể ở **Cài đặt → Chung**. Giao diện và tray cập nhật ngay.

## Đăng nhập Hệ điều hành qua Thẻ thông minh PIV

Để mở khóa khởi động lạnh và đăng nhập hệ điều hành (FileVault trên macOS Apple Silicon, Login Window / Sudo trên macOS Apple T2/Intel, hoặc Active Directory / Microsoft Entra CBA trên Windows):
- **Ghép nối macOS**: Chạy `bash software/scripts/macos_pair_smartcard.sh` (hoặc `tinytouch pair`).
- **Ghép nối Windows**: Chạy `powershell -ExecutionPolicy Bypass -File software/scripts/windows_cert_enroll.ps1`.
- Xem hướng dẫn chi tiết tại **[Hướng dẫn macOS PIV & FileVault](macos-piv-filevault-guide.md)** và **[Hướng dẫn Windows Smart Card](windows-piv-cba-guide.md)**.

## Khắc phục sự cố

| Hiện tượng | Cách xử lý |
| --- | --- |
| Không tìm thấy thiết bị | Kiểm tra cáp data, rút/cắm lại board và làm mới trong Cài đặt. |
| Thiết bị ở bootloader | Nhả BOOT/IO0, bấm RESET một lần rồi cắm lại. |
| HID yêu cầu chạm | Chạm ngón đã đăng ký; đây là lớp bảo vệ không cho máy khác thay khóa ghép nối. |
| Cấu hình bị gián đoạn | Vào **Cài đặt → Thiết bị**, chọn **Sửa ghép nối HID** rồi xác nhận. |
| Firmware Arduino legacy | Firmware báo `keys=compiled`; app giữ khóa do firmware quản lý và không hiện Sửa. Dùng firmware unified nếu cần app quản lý provisioning. |

Xem [Build Guide](BUILD_GUIDE.vi.md) để đấu nối/nạp firmware và [Changelog](../CHANGELOG.md) để xem lịch sử bản phát hành.
