# 🤖 Hướng Dẫn Cài Đặt TouchPass 1-Prompt Dành Cho AI Agent

[🌐 **English**](AI_AGENT_PROMPT.md) | 🇻🇳 **Tiếng Việt** | [🇨🇳 **简体中文**](AI_AGENT_PROMPT.zh.md) | [🇷🇺 **Русский**](AI_AGENT_PROMPT.ru.md)

Tài liệu này cung cấp hướng dẫn **cài đặt 1-prompt tự động** chuẩn hóa dành cho người dùng không chuyên về kỹ thuật khi làm việc với các trợ lý lập trình AI và công cụ CLI agent (**Claude Code**, **Cursor**, **Antigravity**, **OpenCode**, và **ChatGPT CLI**).

Chỉ với một câu prompt duy nhất, trợ lý AI của bạn sẽ tự động kiểm tra môi trường hệ điều hành, khởi tạo dịch vụ helper Python cục bộ (`http://127.0.0.1:8787/`), hướng dẫn nạp firmware Web Serial và xác minh kết nối phần cứng cũng như đăng ký vân tay.

---

## 📐 Tổng Quan 1-Prompt & Quy Trình Tự Động Hóa 4 Pha

Khi AI agent nhận được Master Prompt, nó sẽ tự động thực thi quy trình 4 pha để hoàn tất cài đặt mà người dùng không cần thao tác thủ công trên dòng lệnh:

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                    QUY TRÌNH TỰ ĐỘNG HÓA 4 PHA CỦA AI AGENT                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ Pha 1: Kiểm tra tiền điều kiện Môi trường (Preflight)                        │
│   • Nhận diện hệ điều hành (Windows / macOS / Linux)                         │
│   • Kiểm tra môi trường & cài đặt Python 3.11+                               │
│   • Kiểm tra quyền truy cập cổng USB serial (nhóm dialout trên Linux, COM...) │
├──────────────────────────────────────────────────────────────────────────────┤
│ Pha 2: Thiết lập Dịch vụ Phụ trợ Cục bộ (Local Helper Setup)                 │
│   • Tạo môi trường ảo Python (`software/.venv`)                              │
│   • Cài đặt các thư viện phụ thuộc từ `software/requirements.txt`            │
│   • Khởi chạy portal daemon cục bộ lắng nghe tại http://127.0.0.1:8787/      │
├──────────────────────────────────────────────────────────────────────────────┤
│ Pha 3: Nạp Firmware Qua Web Serial                                           │
│   • Hướng dẫn truy cập https://tody-agent.github.io/Touch-Pass/web/flasher/  │
│   • Kết nối ESP32-S3 SuperMini qua Web Serial API trên Chrome/Edge           │
│   • Hướng dẫn vào chế độ bootloader (Giữ BOOT, nhấn RESET, nhả BOOT)         │
├──────────────────────────────────────────────────────────────────────────────┤
│ Pha 4: Kiểm Tra Xác Nhận & Đăng Ký Vân Tay                                   │
│   • Kiểm tra điểm endpoint health daemon tại http://127.0.0.1:8787/api/status│
│   • Xác nhận kết nối phần cứng USB serial / HID                              │
│   • Hướng dẫn đăng ký vân tay đầu tiên & thử nghiệm tự động duyệt prompt CLI  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Mẫu Prompt Tổng Thể Có Thể Copy

### 🌟 Prompt Master Toàn Năng (Khuyên Dùng)

Sao chép và dán chính xác đoạn prompt dưới đây vào **Claude Code**, **Cursor**, **Antigravity**, **OpenCode**, hoặc **ChatGPT CLI**:

```text
Cài đặt TouchPass trên máy tính này dành cho quy trình 1-prompt tự động không chuyên kỹ thuật:

Pha 1: Kiểm tra tiền điều kiện môi trường
- Nhận diện hệ điều hành (Windows, macOS, hoặc Linux).
- Kiểm tra Python 3.11+ đã được cài đặt chưa (`python --version` hoặc `python3 --version`).
- Kiểm tra quyền truy cập USB serial (đảm bảo quyền nhóm `dialout` trên Linux, các cổng COM active trên Windows, hoặc `/dev/cu.usbmodem*` trên macOS).

Pha 2: Thiết lập dịch vụ phụ trợ cục bộ
- Đảm bảo mã nguồn TouchPass có sẵn cục bộ.
- Tạo môi trường ảo Python tại `software/.venv` nếu chưa tồn tại.
- Cài đặt các thư viện phụ thuộc từ `software/requirements.txt`.
- Khởi chạy TouchPass portal daemon (`run_portal_win.py` trên Windows hoặc `python3 software/app.py` trên macOS/Linux) chạy ngầm tại cổng 8787.

Pha 3: Hướng dẫn nạp firmware
- Hướng dẫn người dùng mở trang https://tody-agent.github.io/Touch-Pass/web/flasher/ trên Chrome/Edge để nạp firmware ESP32-S3 qua Web Serial API.
- Cung cấp hướng dẫn từng bước nếu cần vào chế độ bootloader (Giữ nút BOOT, nhấn & nhả RESET, nhả nút BOOT).

Pha 4: Kiểm tra xác nhận & Đăng ký vân tay
- Truy cập http://127.0.0.1:8787/api/status để xác minh daemon cục bộ đang hoạt động bình thường.
- Kiểm tra kết nối phần cứng USB serial tới ESP32-S3.
- Hướng dẫn người dùng mở http://127.0.0.1:8787/ để đăng ký vân tay đầu tiên và thử nghiệm tính năng tự động gõ 'y' + Enter chấp nhận prompt AI CLI.
```

---

### 🟧 Prompt Cho Claude Code CLI

```text
Cài đặt TouchPass trên máy tính này bằng Claude Code CLI:
1. Thực hiện Preflight: Kiểm tra OS, xác minh Python 3.11+, và liệt kê các cổng USB serial.
2. Thiết lập Helper Cục bộ: Tạo software/.venv nếu thiếu, chạy pip install -r software/requirements.txt, và khởi chạy portal daemon chạy ngầm tại http://127.0.0.1:8787/.
3. Hướng dẫn người dùng mở https://tody-agent.github.io/Touch-Pass/web/flasher/ để nạp Web Serial 1-click trên Chrome/Edge.
4. Kiểm tra sức khỏe daemon tại http://127.0.0.1:8787/api/status và báo cáo trạng thái kết nối.
```

---

### 🟦 Prompt Cho Cursor IDE (Agent Mode)

```text
Thực hiện cài đặt TouchPass trong Cursor:
1. Kiểm tra Python 3.11+ hoạt động trong terminal.
2. Khởi tạo software/.venv, cài đặt thư viện từ software/requirements.txt, và khởi chạy server ngầm tại http://127.0.0.1:8787/.
3. Nhắc người dùng truy cập https://tody-agent.github.io/Touch-Pass/web/flasher/ để nạp firmware ESP32-S3 qua Web Serial.
4. Xác nhận http://127.0.0.1:8787/api/status trả về kết quả JSON "status": "ok".
```

---

### 🟪 Prompt Cho Antigravity AI Agent

```text
Khởi tạo helper kết nối phần cứng TouchPass:
1. Nhận diện môi trường (Windows/macOS/Linux) và đường dẫn Python 3.11+.
2. Thiết lập môi trường ảo tại software/.venv, cài đặt thư viện phụ thuộc, và khởi chạy daemon trên cổng 8787.
3. Xuất liên kết Web Flasher https://tody-agent.github.io/Touch-Pass/web/flasher/ kèm hướng dẫn bootloader.
4. Chạy kiểm tra endpoint http://127.0.0.1:8787/api/status và xác nhận kết nối serial.
```

---

### 🟩 Prompt Cho OpenCode Agent

```text
Cài đặt trợ lý TouchPass cho lập trình cặp (pair programming):
1. Thực hiện kiểm tra tiền điều kiện cho Python 3.11+ và quyền cổng USB serial.
2. Dựng môi trường software/.venv, cài đặt requirements, và khởi chạy background daemon software/app.py tại http://127.0.0.1:8787/.
3. Hướng dẫn người dùng mở https://tody-agent.github.io/Touch-Pass/web/flasher/ để cài đặt firmware qua trình duyệt.
4. Test endpoint http://127.0.0.1:8787/api/status để xác nhận daemon sẵn sàng.
```

---

### 🟨 Prompt Cho ChatGPT CLI

```text
Cấu hình TouchPass daemon và quy trình nạp firmware qua ChatGPT CLI:
1. Kiểm tra môi trường binary Python 3.11+ và quyền giao tiếp serial.
2. Tạo software/.venv, cài đặt các thư viện từ software/requirements.txt, và khởi chạy portal daemon tại http://127.0.0.1:8787/.
3. Hướng dẫn người dùng mở https://tody-agent.github.io/Touch-Pass/web/flasher/ để nạp ESP32-S3 Web Serial.
4. Thực hiện kiểm tra API health tại http://127.0.0.1:8787/api/status và nhắc người dùng đăng ký vân tay.
```

---

### 🪟 Prompt Dành Cho Windows (PowerShell / CMD)

```text
Cài đặt TouchPass trên Windows:
1. Kiểm tra Python bằng lệnh `python --version` hoặc `py -3 --version`.
2. Chạy `start_touchpass.bat` để tạo `software\.venv`, cài `software\requirements.txt`, và khởi chạy `run_portal_win.py` tại http://127.0.0.1:8787/.
3. Điều hướng người dùng tới https://tody-agent.github.io/Touch-Pass/web/flasher/ để nạp firmware Web Serial.
4. Kiểm tra sức khỏe daemon tại http://127.0.0.1:8787/api/status và test kết nối USB serial.
```

---

### 🍎 Prompt Dành Cho macOS (Terminal / zsh)

```text
Cài đặt TouchPass trên macOS:
1. Kiểm tra phiên bản Python bằng `python3 --version` (cài qua Homebrew nếu chưa có).
2. Chạy `python3 -m venv software/.venv && software/.venv/bin/pip install -r software/requirements.txt`.
3. Chạy portal ngầm: `nohup software/.venv/bin/python software/app.py > touchpass.log 2>&1 &`.
4. Điều hướng người dùng tới https://tody-agent.github.io/Touch-Pass/web/flasher/ để nạp firmware Web Serial.
5. Kiểm tra trạng thái tại http://127.0.0.1:8787/api/status và kiểm tra các cổng `/dev/cu.usbmodem*`.
```

---

### 🐧 Prompt Dành Cho Linux (Bash / systemd)

```text
Cài đặt TouchPass trên Linux:
1. Kiểm tra `python3 --version` và đảm bảo đã cài `python3-venv`.
2. Đảm bảo quyền dialout: `sudo usermod -a -G dialout $USER`.
3. Chạy `python3 -m venv software/.venv && software/.venv/bin/pip install -r software/requirements.txt`.
4. Khởi chạy daemon: `nohup software/.venv/bin/python software/app.py > touchpass.log 2>&1 &`.
5. Điều hướng người dùng tới https://tody-agent.github.io/Touch-Pass/web/flasher/ để nạp firmware Web Serial.
6. Xác minh endpoint daemon bằng lệnh `curl http://127.0.0.1:8787/api/status`.
```

---

## ⚡ Lệnh Bootstrap Shell 1 Dòng

Nếu bạn muốn khởi động TouchPass chỉ bằng một lệnh terminal duy nhất trước khi gọi AI agent:

### Windows (PowerShell)
```powershell
powershell -Command "iwr -useb https://raw.githubusercontent.com/tody-agent/Touch-Pass/main/start_touchpass.bat -OutFile start_touchpass.bat; .\start_touchpass.bat"
```

### macOS / Linux (Bash)
```bash
curl -fsSL https://raw.githubusercontent.com/tody-agent/Touch-Pass/main/packaging/install.sh | bash
```

---

## 🛠️ Chi Tiết Từng Bước: AI Agent Sẽ Làm Gì?

Dưới đây là mô tả chi tiết các hành động AI agent sẽ tự động thực thi trong từng pha:

### Pha 1: Kiểm Tra Tiền Điều Kiện Môi Trường (Preflight)
1. **Phát hiện Hệ Điều Hành & Kiểm tra Binary**:
   - Chạy lệnh `uname -s` hoặc kiểm tra biến môi trường `%OS%`.
   - Kiểm tra phiên bản Python 3.11+ (`python --version` / `python3 --version`).
   - Nếu thiếu Python, hiển thị hướng dẫn chi tiết giúp người dùng cài đặt Python 3.11+.
2. **Kiểm tra Cổng Khả Dụng**:
   - Xác nhận cổng 8787 đang trống và không bị chiếm bởi ứng dụng khác.
3. **Kiểm tra Quyền Cổng USB Serial**:
   - Trên Linux: Kiểm tra xem user hiện tại đã thuộc nhóm `dialout` hoặc `tty` chưa.
   - Trên Windows: Liệt kê các cổng COM đang hoạt động.
   - Trên macOS: Kiểm tra đường dẫn `/dev/cu.usbmodem*` hoặc `/dev/cu.usbserial*`.

### Pha 2: Thiết Lập Dịch Vụ Phụ Trợ Cục Bộ (Local Helper Setup)
1. **Tạo Môi Trường Ảo**:
   - Chạy `python -m venv software/.venv` (hoặc `python3 -m venv software/.venv`).
2. **Cài Đặt Thư Viện Phụ Thuộc**:
   - Cập nhật `pip` và cài đặt gói thư viện: `pip install -r software/requirements.txt` (bao gồm `flask`, `pyserial`, `cryptography`, v.v.).
3. **Khởi Chạy Daemon Service**:
   - Trên Windows: Chạy `run_portal_win.py` hoặc thi hành `start_touchpass.bat`.
   - Trên macOS/Linux: Thi hành `software/.venv/bin/python software/app.py` chạy ngầm.
   - Đảm bảo web server cục bộ sẵn sàng lắng nghe tại `http://127.0.0.1:8787/`.

### Pha 3: Nạp Firmware Qua Web Serial
1. **Chuyển Hướng Web Flasher**:
   - Nhắc người dùng mở trang [https://tody-agent.github.io/Touch-Pass/web/flasher/](https://tody-agent.github.io/Touch-Pass/web/flasher/) trên trình duyệt hỗ trợ Web Serial (Google Chrome, Microsoft Edge, Opera).
2. **Kết Nối & Nạp Firmware**:
   - Người dùng chọn cổng thiết bị ESP32-S3 và bấm nút **Install / Flash Firmware**.
3. **Hướng Dẫn Chế Độ Bootloader**:
   - Nếu thiết bị không tự động vào chế độ flash:
     1. Nhấn và giữ nút **BOOT** trên ESP32-S3 SuperMini.
     2. Nhấn và nhả nút **RESET** (EN).
     3. Nhả nút **BOOT**.
     4. Bấm **Connect** trên giao diện Web Flasher.

### Pha 4: Kiểm Tra Xác Nhận & Đăng Ký Vân Tay
1. **Kiểm Tra Endpoint Health**:
   - AI Agent gửi yêu cầu tới `http://127.0.0.1:8787/api/status` để kiểm tra kết quả JSON (`"status": "ok"`).
2. **Xác Minh Kết Nối Phần Cứng Serial**:
   - Agent kiểm tra kết nối giao tiếp serial giữa daemon Python và phần cứng ESP32-S3.
3. **Đăng Ký Vân Tay Trên Web Portal**:
   - Agent mở hoặc cung cấp đường dẫn `http://127.0.0.1:8787/`.
   - Người dùng làm theo hướng dẫn trên giao diện Web UI để đăng ký các ngón tay (ví dụ: Ngón trỏ cho thao tác gõ `y` + Enter duyệt prompt CLI).
4. **Thử Nghiệm Tự Động Duyệt Prompt**:
   - Người dùng thử chạm ngón tay khi terminal xuất hiện yêu cầu xác nhận (Claude Code, Cursor, terminal prompts) để tự động duyệt lệnh.

---

## 🤖 Hướng Dẫn Sử Dụng Theo Công Cụ AI Agent

### 1. Claude Code CLI
- **Cách thực thi**: Dán trực tiếp Universal Master Prompt vào terminal đang chạy `claude`:
  ```bash
  claude "Cài đặt TouchPass trên máy tính này theo quy trình 4 pha: kiểm tra môi trường, cài đặt software/.venv, link nạp web serial, và kiểm tra trạng thái daemon."
  ```
- **Kết quả**: Claude Code sẽ kiểm tra công cụ, thiết lập môi trường Python, chạy service ngầm và xuất các liên kết flasher & portal.

### 2. Cursor IDE
- **Cách thực thi**: Mở **Composer** (`Ctrl+I` / `Cmd+I`) hoặc **Chat** (`Ctrl+L` / `Cmd+L`), chuyển sang **Agent Mode**, và dán Master Prompt.
- **Kết quả**: Cursor khởi tạo `.venv`, chạy cài đặt thư viện và xác minh kết nối portal.

### 3. Antigravity AI Agent
- **Cách thực thi**: Nhập Master Prompt vào phiên làm việc Antigravity.
- **Kết quả**: Antigravity thực thi preflight hệ điều hành, quản lý daemon ngầm và xác nhận hệ thống sẵn sàng.

### 4. OpenCode
- **Cách thực thi**: Dán prompt vào khung chat của OpenCode agent.
- **Kết quả**: OpenCode thi hành các lệnh shell để cấu hình Python requirements, bật portal daemon và xác minh kết nối phần cứng.

### 5. ChatGPT CLI
- **Cách thực thi**: Gửi Master Prompt tới giao diện ChatGPT CLI.
- **Kết quả**: ChatGPT CLI kiểm tra môi trường, hướng dẫn tạo venv cục bộ, điều hướng nạp firmware Web Serial trên trình duyệt và kiểm tra API endpoint.

---

## 🔍 Kiểm Tra & Xử Lý Sự Cố

Sau khi cài đặt, bạn có thể kiểm tra trực tiếp trạng thái daemon và các endpoint:

```bash
# Kiểm tra endpoint HTTP status của daemon
curl -s http://127.0.0.1:8787/api/status

# Chạy thử portal engine trên Windows không tự mở trình duyệt
python run_portal_win.py --no-browser
```

### Các Bước Xử Lý Sự Cố Thường Gặp
1. **Không Nhận Diện Được Phần Cứng USB**:
   - Đảm bảo bạn đang sử dụng **Cáp Truyền Dữ Liệu USB 2.0/3.0**, không phải cáp sạc chỉ có nguồn.
   - Kiểm tra driver USB (CP210x hoặc CH340 nếu dùng mạch UART ngoài; ESP32-S3 native USB CDC nếu cắm trực tiếp).
2. **Nạp Firmware Web Serial Thất Bại**:
   - Sử dụng Google Chrome hoặc Microsoft Edge (Web Serial không được hỗ trợ trên Firefox hoặc Safari).
   - Đưa ESP32-S3 vào chế độ bootloader thủ công: Giữ nút **BOOT**, nhấn/nhả nút **RESET**, nhả nút **BOOT**.
3. **Cổng 8787 Đã Bị Sử Dụng**:
   - Dừng các tiến trình TouchPass đang chạy:
     - **Windows**: `taskkill /F /IM python.exe`
     - **macOS/Linux**: `pkill -f "software/app.py"`
4. **Lỗi Quyền Serial Trên Linux**:
   - Chạy lệnh `sudo usermod -a -G dialout $USER` rồi đăng xuất và đăng nhập lại để cập nhật quyền nhóm.
