# TouchPass User Guide & Documentation
# Hướng Dẫn Sử Dụng & Tài Liệu TouchPass

Welcome to the official user guide for **TouchPass** — an open-source biometrics & developer macro automation platform powered by ESP32-S3 and ZW101 fingerprint sensors.

Chào mừng bạn đến với hướng dẫn sử dụng chính thức của **TouchPass** — nền tảng tự động hóa macro và xác thực sinh trắc học nguồn mở chạy trên vi điều khiển ESP32-S3 và cảm biến vân tay ZW101.

---

## Table of Contents / Mục Lục

1. [TouchPass Platform Overview / Tổng Quan Nền Tảng](#1-touchpass-platform-overview--tong-quan-nen-tang)
2. [Step-by-Step Self-Serve Onboarding / Hướng Dẫn Tự Cài Đặt](#2-step-by-step-self-serve-onboarding--huong-dan-tu-cai-dat)
3. [Interactive Keyboard Shortcut Recorder / Trình Ghi Phím Tắt Tương Tác](#3-interactive-keyboard-shortcut-recorder--trinh-ghi-phim-tat-tuong-tac)
4. [AI Developer Tools Shortcut Preset Library / Thư Viện Phím Tắt AI Tools](#4-ai-developer-tools-shortcut-preset-library--thu-vien-phim-tat-ai-tools)
5. [Debug Console & Live Event Logs / Nhật Ký Hệ Thống & Debug Console](#5-debug-console--live-event-logs--nhat-ky-he-thong--debug-console)
6. [Security & Safety Checklist / Danh Mục Kiểm Tra An Toàn](#6-security--safety-checklist--danh-muc-kiem-tra-an-toan)
7. [Troubleshooting Guide / Xử Lý Lỗi Phổ Biến](#7-troubleshooting-guide--xu-ly-loi-pho-bien)

---

## 1. TouchPass Platform Overview / Tổng Quan Nền Tảng

### English
TouchPass combines hardware-level USB HID keyboard emulation with biometric fingerprint recognition and a local Web Management Portal. It enables instant triggering of developer shortcuts, password fills, and multi-step custom macros with a touch of a finger.

Key Features:
- **10 Biometric Slots (01–10)**: Map each finger to a specific action (Password + Enter, Accept `y` + Enter, Enter, Escape, or Custom Macros).
- **Native USB HID Keyboard**: Direct hardware keyboard emulation recognized by any operating system (macOS, Windows, Linux) without requiring target machine drivers.
- **Double-Touch Confirmation Safety**: Password execution runs on a single touch; non-password actions (Accept, Enter, Escape, Custom Macros) require touching the same finger **twice within 3 seconds** to prevent accidental command execution.
- **Local Web Portal (`http://127.0.0.1:8787/`)**: Browser interface running locally for finger enrollment, shortcut recording, AI preset application, and live logging.

### Tiếng Việt
TouchPass kết hợp giả lập bàn phím phím phần cứng USB HID với công nghệ nhận diện vân tay sinh trắc học và Web Management Portal cục bộ. Thiết bị giúp bạn thực thi ngay lập tức các phím tắt lập trình, điền mật khẩu an toàn và chạy macro nhiều bước chỉ bằng một chạm.

Tính năng nổi bật:
- **10 Slot Sinh Trắc Học (01–10)**: Gán từng ngón tay với các hành động cụ thể (Mật khẩu + Enter, Accept `y` + Enter, Enter, Escape, hoặc Macro tùy chỉnh).
- **USB HID Native Phần Cứng**: Được mọi hệ điều hành (macOS, Windows, Linux) nhận diện trực tiếp như một bàn phím USB phần cứng.
- **Cơ Chế Bảo Vệ Chạm Kép (Double-Touch Safety)**: Hành động mật khẩu kích hoạt qua 1 lần chạm; các hành động điều khiển (Accept, Enter, Escape, Custom Macro) yêu cầu chạm lại cùng 1 ngón **2 lần trong vòng 3 giây** để tránh gõ nhầm lệnh.
- **Web Portal Cục Bộ (`http://127.0.0.1:8787/`)**: Giao diện trình duyệt chạy nội bộ hỗ trợ đăng ký ngón tay, bắt phím tắt tự động, áp dụng mẫu AI và xem log realtime.

---

## 2. Step-by-Step Self-Serve Onboarding / Hướng Dẫn Tự Cài Đặt

Follow these 4 steps to set up and test your TouchPass device.

---

### Step 1: Launch the Local Web Portal / Khởi Chạy Web Portal

1. Connect your ESP32-S3 device to your computer via a USB Data Cable.
2. Start the TouchPass helper service in your terminal:
   - **macOS / Linux**:
     ```bash
     .venv/bin/python software/macos-helper/tinytouch_helper.py
     ```
   - **Windows**:
     ```powershell
     python run_portal_win.py
     ```
3. Open your browser and navigate to:
   ```text
   http://127.0.0.1:8787/
   ```
4. Verify the top status badge reads: `ZW101 sẵn sàng` (ZW101 Ready) with your active COM/USB port.

---

### Step 2: Test USB HID Keyboard Output (Without Sensor) / Thử Nghiệm Gõ Phím USB HID

You can test the hardware USB HID keyboard output before wiring or enrolling fingerprints.

1. In the Web Portal, stay on **Tab 1: 🚀 Hướng dẫn ban đầu (Onboarding)**.
2. Under **Step 1: Test USB HID Keyboard Output**, click into the text input box labeled:
   `Thử nghiệm nhập ký tự tại đây...`
3. Click the **Thử gõ USB HID (Test)** button.
4. The ESP32-S3 will simulate physical key strokes directly into the input field.

---

### Step 3: ESP32-S3 & ZW101 Wiring Diagram / Sơ Đồ Đấu Nối Phần Cứng

Wire the ZW101 fingerprint sensor to the ESP32-S3 board according to the table below.

> [!IMPORTANT]
> **Voltage Warning**: The ZW101 operates on **3.3V logic and power**. Connecting VCC or UART to 5V will permanently damage the sensor!

| ZW101 Pin | Signal Name | ESP32-S3 Super Mini Pin | Description |
| :--- | :--- | :--- | :--- |
| **Pin 1** | `V_TOUCH` | `3V3` | Touch IC Operating Power (3.3V) |
| **Pin 2** | `TouchOut` | `GPIO 15` (or `GPIO 1`) | Touch Interrupt Signal (IRQ) |
| **Pin 3** | `VCC` | `3V3` | Sensor Main Logic Power (3.3V) |
| **Pin 4** | `TX` | `GPIO 18` / `GPIO 6` (RX) | Sensor Serial Output -> ESP32 RX |
| **Pin 5** | `RX` | `GPIO 17` / `GPIO 7` (TX) | Sensor Serial Input <- ESP32 TX |
| **Pin 6** | `GND` | `GND` | Common Ground |

> [!NOTE]
> Do not use strapping pins (`GPIO 0`, `GPIO 3`, `GPIO 45`, `GPIO 46`) for ZW101 serial communication.

---

### Step 4: Finger Enrollment Workflow / Quy Trình Đăng Ký Vân Tay

1. Navigate to **Tab 2: 🔑 Quản lý Vân tay (Slots)** in the portal.
2. Select an empty slot (e.g., Slot 01) and click **Cấu hình (Configure)**.
3. Assign a name (e.g., "Claude Compact"), choose an action preset, and click **Lưu cấu hình (Save)**.
4. Click **Đăng ký (Enroll)** on the slot card to launch the enrollment dialog.
5. Follow the visual instructions:
   - **Place finger**: Place your target finger onto the ZW101 sensor ring.
   - **Lift finger**: Lift your finger when prompted ("Nhấc ngón tay ra").
   - **Place same finger**: Place the **same finger** a second time for template confirmation.
6. When the status displays `Đăng ký hoàn tất` (Enrollment Complete), the slot is ready for live use.

---

## 3. Interactive Keyboard Shortcut Recorder / Trình Ghi Phím Tắt Tương Tác

TouchPass includes an interactive **Keyboard Shortcut Recorder** within the Custom Macro profile editor. It eliminates manual key code entry by automatically capturing physical keyboard keystrokes and modifier key bitmasks.

### How to Record Shortcuts / Cách Sử Dụng Trình Bắt Phím:

1. Click **Cấu hình (Configure)** on any slot and select **Macro tùy chỉnh** (Custom Macro) in the Action dropdown.
2. Locate the red shortcut recorder box:
   ```text
   🔴 Bấm vào đây và nhấn tổ hợp phím để bắt phím tự động
   ```
3. Click the recorder box. The box turns active with a pulsing border and reads:
   `🔴 Hãy nhấn tổ hợp phím bất kỳ trên bàn phím...`
4. Press any physical key combination on your keyboard (e.g., `Ctrl+Shift+L`, `Alt+Enter`, `Cmd+K`, `Ctrl+C`).
5. TouchPass automatically detects modifier flags and maps the target key code:
   - **Ctrl**: `0x01`
   - **Shift**: `0x02`
   - **Alt / Option**: `0x04`
   - **Cmd / Meta / Win**: `0x08`
6. The captured step is automatically added to the macro step sequence below.
7. Click **Lưu cấu hình (Save)** to finalize your slot profile.

---

## 4. AI Developer Tools Shortcut Preset Library / Thư Viện Phím Tắt AI Tools

TouchPass features a built-in **AI Tools Shortcut Library** (accessible in **Tab 4: 📚 Hướng dẫn & Mẫu**). You can apply shortcuts with a single click directly to any target slot.

### Complete AI Tools Preset Reference / Bảng Phím Tắt Tools AI:

| AI Tool / Application | Category | Target Shortcut / Action | Action Sequence | Description & Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **Claude Code CLI** | CLI Assistant | `Ctrl+C` | `Key: c (Ctrl)` | Interrupt running command / stop execution |
| **Claude Code CLI** | CLI Assistant | `Ctrl+L` | `Key: l (Ctrl)` | Clear terminal screen |
| **Claude Code CLI** | CLI Assistant | `/compact` + `Enter` | `Text: /compact` -> `Key: enter` | Compact conversation context window |
| **Cursor IDE** | IDE Editor | `Cmd/Ctrl+K` | `Key: k (Cmd/Ctrl)` | Trigger Inline AI Edit Prompt |
| **Cursor IDE** | IDE Editor | `Cmd/Ctrl+I` | `Key: i (Cmd/Ctrl)` | Open AI Composer Window |
| **Cursor IDE** | IDE Editor | `Cmd/Ctrl+L` | `Key: l (Cmd/Ctrl)` | Open AI Chat Side Panel |
| **Cursor IDE** | IDE Editor | `Shift+Tab` | `Key: tab (Shift)` | Unindent / Reject inline completion suggestion |
| **Claude Desktop** | Desktop App | `Cmd/Ctrl+K` | `Key: k (Cmd/Ctrl)` | Open Quick Search |
| **Claude Desktop** | Desktop App | `Cmd/Ctrl+Shift+O` | `Key: o (Cmd+Shift)` | Create New Chat Session |
| **Claude Desktop** | Desktop App | `Cmd/Ctrl+Shift+C` | `Key: c (Cmd+Shift)` | Copy Code Block |
| **Antigravity IDE** | AI Workstation | `Cmd/Ctrl+Shift+A` | `Key: a (Cmd+Shift)` | Launch AI Agent Side Panel |
| **Antigravity IDE** | AI Workstation | `Cmd/Ctrl+Shift+L` | `Key: l (Cmd+Shift)` | Open Agent Execution Logs |
| **Antigravity IDE** | AI Workstation | `Cmd/Ctrl+Shift+P` | `Key: p (Cmd+Shift)` | Open Command Palette |
| **OpenCode & Codex CLI** | CLI Agent | `Ctrl+Enter` | `Key: enter (Ctrl)` | Submit Prompt Immediately |
| **OpenCode & Codex CLI** | CLI Agent | `Alt+Enter` | `Key: enter (Alt)` | Insert Newline without submitting |

### How to Apply AI Presets (1-Click Application):
1. Go to **Tab 4: 📚 Hướng dẫn & Mẫu (Guide & Templates)**.
2. Scroll to the **🤖 AI Tools Shortcut Library** section.
3. Click **Áp dụng phím tắt này (Apply Shortcut)** on any tool card (e.g. Claude Code `/compact` or Cursor `Cmd/Ctrl+K`).
4. The portal automatically opens an available slot profile populated with the exact macro steps and label.
5. Click **Lưu cấu hình (Save)** and enroll your preferred finger!

---

## 5. Debug Console & Live Event Logs / Nhật Ký Hệ Thống & Debug Console

The **Debug & Logs** tab (**Tab 3: ⚡ Debug & Logs**) provides real-time telemetry and color-coded event log monitoring for hardware diagnostics.

### Telemetry Overview / Thống Kê Thiết Bị:
- **Trạng thái thiết bị (Device Status)**: Connection status (`Đã kết nối` / `Ngoại tuyến`).
- **Cổng Serial (Serial Port)**: Active communication port (e.g. `/dev/cu.usbmodem101` or `COM3`).
- **Cảm biến ZW101 (Sensor Status)**: Sensor readiness (`Hoạt động (OK)` or error code).
- **Tốc độ Baud (Baud Rate)**: Fixed UART speed (`115200 bps`).

### Event Log Badges Explained / Giải Thích Badge Nhật Ký:

| Badge | Color | Trigger Event | Explanation / Mô Tả |
| :--- | :--- | :--- | :--- |
| `TOUCH` | Cyan / Blue | Sensor IRQ Trigger | Physical finger touch detected on sensor ring surface. |
| `MATCH` | Green | Fingerprint Identification | Fingerprint matched successfully to slot ID (01–10) or match failed. |
| `PW` | Gold / Yellow | Keychain Password Fill | Password requested for slot; retrieved from OS Keychain and sent over HID. |
| `ERR` | Red | Error / Warning | UART communication error, sensor timeout, enrollment mismatch, or invalid key. |
| `SYS` | Slate / Gray | System & Portal RPC | System boot, USB status check, API ping, log clear, or configuration updates. |

### Live Log Controls:
- **Test Ping**: Send an echo ping command to verify RPC responsiveness.
- **Test Type**: Trigger a sample USB HID keyboard keystroke output.
- **Xóa log (Clear Logs)**: Clear the current log console history.
- **Tạm dừng (Pause / Resume)**: Pause or resume real-time log polling.

---

## 6. Security & Safety Checklist / Danh Mục Kiểm Tra An Toàn

Before using TouchPass for actions that issue terminal commands or fill credentials:

- [ ] **Focused Window**: Verify that your active cursor is focused on the intended input field.
- [ ] **Keyboard Layout**: Ensure system input language is set to **ABC** or **US English** (Vietnamese Telex/VNI layouts can modify password or macro characters).
- [ ] **Double-Touch Confirmation**: For non-password control macros, remember to touch the **same enrolled finger twice within 3 seconds**.
- [ ] **Keychain Storage**: Passwords are securely stored in the native OS Keychain (macOS Keychain / Credential Manager), never in plain text configuration files.

---

## 7. Troubleshooting Guide / Xử Lý Lỗi Phổ Biến

| Issue / Symptom | Possible Cause | Recommended Solution |
| :--- | :--- | :--- |
| **Portal shows "Chưa tìm thấy ESP32-S3"** | USB cable disconnected or wrong port | Ensure USB data cable is connected; restart helper script with `--port` flag if needed. |
| **ESP32 connected but ZW101 offline** | Wiring error or 3.3V supply fault | Recheck RX/TX cross wiring (ZW101 TX -> ESP32 RX) and 3.3V power connections. |
| **Enrollment fails on second touch** | Finger position shifted too much | Lift finger cleanly when prompted; touch with steady, full finger coverage. |
| **Double-touch action does not trigger** | Touch timeout exceeded (> 3s) | Touch the same finger again within 3 seconds. First touch arms; second touch executes. |
| **Wrong characters typed during macro** | Telex / VNI input source enabled | Switch input source to ABC / US Keyboard layout in your operating system. |
