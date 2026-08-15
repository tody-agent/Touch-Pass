# Design: Cài đặt ESP32 Master

## Context & Technical Approach

ESP32 Master đã tồn tại tại `C:\Adruino\Esp32-Master` và đang ở đúng commit `origin/main`. Repo là MCP server Python không phụ thuộc package ngoài, dùng `arduino-cli` cho compile/upload và có các skill đi kèm.

Phạm vi cài đặt là đăng ký MCP server vào cấu hình Codex bằng đường dẫn tuyệt đối, giữ nguyên thay đổi local của cả hai repository. Không cài lại Python hoặc Arduino CLI vì các công cụ này đã có sẵn; lệnh `py` launcher hỏng được ghi nhận nhưng không ảnh hưởng vì dùng `python`.

## Proposed Changes

### Codex MCP configuration

- Thêm server `arduino-esp32-mcp` vào `C:\Users\block\.codex\config.toml`.
- Dùng `python -u C:\Adruino\Esp32-Master\mcp\mcp_server.py` để chạy stdio MCP.
- Đặt `LOCALAPPDATA` theo user hiện tại để các script Windows hoạt động đúng.

### Verification

- Xác nhận commit và trạng thái repo ESP32 Master.
- Kiểm tra `python`, `arduino-cli`.
- Khởi động MCP server với input JSON-RPC initialize và xác nhận phản hồi.
- Kiểm tra cấu hình TOML sau khi chỉnh sửa.

## Assumptions

- Người dùng muốn cài công cụ ESP32 Master để Codex sử dụng, không phải nạp firmware ngay.
- `C:\Adruino\Esp32-Master` là thư mục cài đặt mong muốn vì đã tồn tại và khớp đường dẫn trong tài liệu repo.
