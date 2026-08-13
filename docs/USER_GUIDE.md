# TouchPass User Guide & Documentation

🌐 **English** | [🇻🇳 **Tiếng Việt**](USER_GUIDE.vi.md) | [🇨🇳 **简体中文**](USER_GUIDE.zh.md) | [🇷🇺 **Русский**](USER_GUIDE.ru.md)

Welcome to the official user guide for **TouchPass** — an open-source biometrics & developer macro automation platform powered by ESP32-S3 microcontrollers and ZW101 fingerprint sensors.

---

## Table of Contents

1. [Architecture Separation: Firmware vs. Local Helper](#1-architecture-separation-firmware-vs-local-helper)
2. [TouchPass Platform Overview](#2-touchpass-platform-overview)
3. [Step-by-Step Self-Serve Onboarding](#3-step-by-step-self-serve-onboarding)
4. [Interactive Keyboard Shortcut Recorder](#4-interactive-keyboard-shortcut-recorder)
5. [AI Developer Tools Shortcut Preset Library](#5-ai-developer-tools-shortcut-preset-library)
6. [Debug Console & Live Event Logs](#6-debug-console--live-event-logs)
7. [Security & Safety Checklist](#7-security--safety-checklist)
8. [Troubleshooting Guide](#8-troubleshooting-guide)

---

## 1. Architecture Separation: Firmware vs. Local Helper

TouchPass is designed with a clear separation of responsibility between **Hardware Firmware (ESP32-S3)** and **Local Helper (Host Software)** to ensure high performance and biometric credential security.

### Architecture Data Flow Diagram

```text
┌─────────────────────────┐
│ Fingerprint Sensor      │ (ZW101 Scanning & Matching)
│ (ZW101 Sensor)          │
└────────────┬────────────┘
             │ UART Serial (Matching Slot / IRQ Trigger)
             ▼
┌─────────────────────────┐
│ ESP32-S3 Firmware       │
│ (tiny_touch_keyboard)   │
└──────┬───────────▲──────┘
       │           │
  USB  │           │ USB Keyboard Output
Serial │           │ (HID Keystrokes typed directly)
       ▼           │
┌──────────────────┴──────┐
│ Python Local Helper     │ (run_portal_win.py / tinytouch_helper.py)
│ (http://127.0.0.1:8787) │
└────────────┬────────────┘
             │ Secure Credential Lookup
             ▼
┌─────────────────────────┐
│ OS Credential Store     │ (Windows Credential Manager / macOS Keychain)
└─────────────────────────┘
```

- **ESP32-S3 Firmware**: Responsible for low-level ZW101 UART communication, LED control, HMAC-SHA256 protocol verification, AES-CTR decryption, and hardware USB HID keyboard typing.
- **Local Helper Service**: Manages the local Web Portal HTTP server, handles enrollment requests, and securely retrieves passwords from the per-user helper OS Keychain / Credential Manager.

---

## 2. TouchPass Platform Overview

The TouchPass Web Portal provides a complete dashboard at `http://127.0.0.1:8787/` to manage up to 10 biometric fingerprint slots.

### Action Limits & Constraints
- **Maximum Action Length**: Each slot supports up to **16 steps** or a maximum of **256 encoded bytes**. If an action sequence exceeds 256 bytes, saving fails with a validation error.
- **Double-Touch Confirmation Safety**: Password execution runs on a single touch. Non-password actions (Accept, Enter, Escape, Custom Macros) require touching the same finger **twice within 3 seconds** to prevent accidental triggers.

---

## 3. Step-by-Step Self-Serve Onboarding

The Web Portal features a 4-step wizard for initial setup:

1. **Step 1: Test USB HID Keystrokes** — Verifies that the computer recognizes the ESP32-S3 as a USB HID keyboard.
2. **Step 2: Check Hardware Wiring** — Confirms UART connection between ESP32-S3 and ZW101.
3. **Step 3: Enroll First Fingerprint** — Enrolls a finger into Slot 01.
4. **Step 4: Assign First Action** — Assigns a shortcut or password fill action to the enrolled slot.

---

## 4. Interactive Keyboard Shortcut Recorder

The Web Portal includes an interactive **Shortcut Recorder**:
- Press any physical key or modifier combination (`Ctrl`, `Shift`, `Alt/Option`, `Cmd/Meta`).
- The recorder automatically captures keycodes and modifier bitmasks.
- Click **Save Action** to upload the recorded macro directly to the device.

---

## 5. AI Developer Tools Shortcut Preset Library

Built-in 1-click presets for top developer and AI tools:

- 🤖 **Claude Code CLI**: `y` + `Enter` (Accept prompt)
- 💻 **Cursor IDE**: `Cmd+K` / `Ctrl+K` (Inline AI Edit)
- 🖥️ **Claude Desktop**: `Cmd+Space` / `Ctrl+Space` (Global AI Quick Launcher)
- 🚀 **Antigravity IDE**: `Ctrl+Shift+A` (Agentic AI Command Window)

---

## 6. Debug Console & Live Event Logs

The Web Portal contains a real-time event log monitor with color-coded badges:
- 🟢 `TOUCH`: Fingerprint sensor touch detected.
- 🔵 `MATCH`: Fingerprint matched a stored slot ID.
- 🔑 `PW`: Password retrieved from Credential Store and executed.
- 🔴 `ERR`: Error or invalid HMAC MAC signature detected.
- ⚪ `SYS`: System status update or serial reconnect event.

---

## 7. Security & Safety Checklist

- **Focused Window Safety**: TouchPass operates as a standard USB HID keyboard. Keystrokes type directly into whichever application window currently has focus. Always verify your cursor location before touching the sensor.
- **Credential Storage**: Passwords are saved per-user helper in the OS Credential Manager (Windows Credential Manager / macOS Keychain).
- **Session Unlock Limits**: TouchPass supports session unlock while the user is logged in. It does NOT support FileVault cold boot unlock or unlock after logout, as the per-user helper and Keychain services are locked prior to user session login.

---

## 8. Troubleshooting Guide

| Symptom | Cause | Resolution |
| :--- | :--- | :--- |
| Portal shows `Disconnected` | USB serial port not opened | Check USB data cable and ensure `USB CDC On Boot` is enabled in firmware. |
| Sensor LED remains Off | Power wiring issue | Recheck `V_TOUCH` and `VCC` connections to `3V3`. |
| Action save fails or rejects | Exceeded limit | Ensure macro sequence is within 16 steps and 256 encoded bytes. |

---

## 9. 🛡️ Security Policy & Legal Disclaimer / Tuyên Bố Miễn Trừ Trách Nhiệm

TouchPass is provided **"AS IS"** without warranties of any kind, express or implied. Users assume full responsibility for physical hardware assembly, wiring diagram verification, voltage safety (3.3V power rails), biometric sensor calibration, and physical credential security.

TouchPass được cung cấp **"NGUYÊN TRẠNG" (AS IS)** và không có bất kỳ bảo hành nào. Người dùng tự chịu toàn bộ trách nhiệm đối với việc đấu nối phần cứng vật lý, an toàn nguồn 3.3V, hiệu chuẩn cảm biến vân tay quang học và bảo vệ thiết bị.

- 🇺🇸 **English**: For full security architecture details, supported versions, vulnerability reporting, and limitation of liability, see **[Security Policy & Legal Disclaimer (SECURITY.md)](../SECURITY.md)**.
- 🇻🇳 **Tiếng Việt**: Chi tiết về quy trình báo cáo lỗ hổng, các phiên bản hỗ trợ và miễn trừ trách nhiệm pháp lý, vui lòng tham khảo **[Chính Sách Bảo Mật (SECURITY.vi.md)](translations/SECURITY.vi.md)**.

