<div align="center">

# 🖐️ TouchPass

### *Give every finger a superpower.*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Hardware](https://img.shields.io/badge/Hardware-ESP32--S3-orange.svg)](docs/BUILD_GUIDE.md)
[![Download Executable](https://img.shields.io/badge/📥_Download-TouchPass.exe_(Windows)-blueviolet.svg)](https://github.com/tody-agent/Touch-Pass/releases/download/v2.0.0/TouchPass.exe)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg)](https://python.org)
[![Web Flasher](https://img.shields.io/badge/🌐_1--Click-Web_Flasher-success.svg)](https://tody-agent.github.io/Touch-Pass/web/flasher/)
[![AI Setup](https://img.shields.io/badge/🤖_1--Prompt-AI_Agent_Setup-purple.svg)](docs/AI_AGENT_PROMPT.md)
[![Release](https://img.shields.io/badge/Release-v2.0.0-brightgreen.svg)](https://github.com/tody-agent/Touch-Pass/releases/tag/v2.0.0)

🌐 **English** | [🇻🇳 **Tiếng Việt**](README.vi.md) | [📥 **Download TouchPass.exe**](https://github.com/tody-agent/Touch-Pass/releases/download/v2.0.0/TouchPass.exe) | [🌐 **1-Click Web Flasher**](https://tody-agent.github.io/Touch-Pass/web/flasher/) | [🤖 **1-Prompt AI Agent Setup (EN)**](docs/AI_AGENT_PROMPT.md) | [🇻🇳 **(VI)**](docs/AI_AGENT_PROMPT.vi.md)

<br />

![TouchPass Hero](assets/demo/02-mac-mini-claude-accept-v2.png)

> **How it works:** When your terminal-style prompt asks for approval, tap your enrolled finger. TouchPass sends a key action that types `y` followed by enter directly into your prompt. Note: TouchPass sends native USB HID keyboard keystrokes to the focused field; it cannot click or press GUI button elements.

</div>

---

## ⚡ Problem vs. Solution: Designed for AI Developers

### 🔴 The Problem: Micro-Interruptions Kill Deep Work
When pairing with AI agentic CLI tools and IDEs (**Claude Code**, **Cursor**, **Antigravity**, **OpenCode**), your workflow is constantly halted by prompt confirmations:
> *"Allow execution of `git status`? (y/n)"* or *`Sudo password required`*.

Swapping context, repositioning your hands, typing `y` + `Enter`, or mistyping a 20-character password every 30 seconds breaks your flow state and wastes valuable developer time.

### 🟢 The Solution: Physical Hardware Meets Biometric Speed
**TouchPass** turns biometric touch into physical keyboard actions. Built on an **ESP32-S3 Super Mini** microcontroller and a **ZW101** optical fingerprint sensor, TouchPass lets you assign a dedicated hardware superpower to each finger:

- ☝️ **Index Finger**: Instantly accepts AI terminal prompts (`y` followed by Enter).
- 🖕 **Middle Finger**: Inputs your developer `sudo` / SSH credentials securely from your OS credential store.
- 🖐️ **Ring Finger**: Triggers multi-step hotkey macros (`Enter`, `Escape`, `Cmd+K`, custom keystroke sequences).

---

## 🎯 Feature Grid

| Feature | Capabilities & Architecture | Benefit for AI Workflows |
| :--- | :--- | :--- |
| 🌐 **Web Serial Flasher** | Browser-native flashing via Web Serial API (`esptool-js`) on Chrome/Edge | Zero-installation firmware flashing directly from browser with SHA-256 validation |
| 🤖 **1-Prompt AI Agent Setup** | Copyable setup prompt template for **Claude Code**, **Cursor**, **Antigravity**, **OpenCode** | Automated 1-prompt OS detection, venv creation, daemon launch, and hardware verification |
| 🔌 **Native USB HID** | Emulates a standard USB physical keyboard hardware via ESP32-S3 stack | Driverless plug-and-play across Windows, macOS & Linux; sends keystrokes into whichever window is currently **focused** |
| 🖐️ **10 Fingerprint Slots** | ZW101 optical biometric sensor (Slots 01–10) matched locally on-chip | Zero cloud dependency; assign unique macro/password triggers to each finger |
| ⌨️ **Interactive Shortcut Recorder** | Web Portal UI (`http://127.0.0.1:8787/`) with live keystroke capture & action builder | Configure single `key`, `text`, `delay` (ms), `enter`, or `escape` action sequences in seconds |
| 🚀 **1-Click Launcher** | Automatic Windows batch launcher (`start_touchpass.bat`) & POSIX script (`packaging/install.sh`) | Launch local Flask service & unauthenticated UART serial daemon seamlessly |

---

## 🏗️ Architecture & Data Flow

```text
┌─────────────────────────┐
│   Biometric Sensor      │  Fingerprint Touch (ZW101)
│  (10 Enrolled Finger ID)│
└───────────┬─────────────┘
            │ Local Match (ID 01-10)
            ▼
┌─────────────────────────┐
│    ESP32-S3 Hardware    │   HMAC-SHA256 Challenge / Serial UART
│  (USB HID Keyboard Stack)│ ◄═════════════════════════════════════════► ┌─────────────────────────┐
└───────────┬─────────────┘                                              │  TouchPass Portal Engine│
            │ Native Keyboard Keystroke                                  │  (Python Flask / Web UI)│
            ▼                                                            └───────────┬─────────────┘
┌─────────────────────────┐                                                          │ Secure Keychain
│   Host Computer Window  │  Types 'y' + Enter / Passwords / Hotkeys                 ▼
│ (Claude Code, Terminals)│ ◄───────────────────────────────────────────────── ┌─────────────────────────┐
└─────────────────────────┘                                                    │   OS Credential Store   │
                                                                               │(Win Credential/Keychain)│
                                                                               └─────────────────────────┘
```

---

## 🚀 Quick Start Guide

### 🌐 Browser Web Flasher (Zero Install)
Flash ESP32-S3 firmware in 1 click at [🌐 **tody-agent.github.io/Touch-Pass/web/flasher/**](https://tody-agent.github.io/Touch-Pass/web/flasher/).

### 🤖 1-Prompt AI Agent Setup
Pass the standardized setup prompt to your AI coding assistant. See [🤖 **1-Prompt AI Agent Integration Guide**](docs/AI_AGENT_PROMPT.md) | [🇻🇳 **Bản Tiếng Việt**](docs/AI_AGENT_PROMPT.vi.md).

### Windows
1. Download **[TouchPass.exe](https://github.com/tody-agent/Touch-Pass/releases/download/v2.0.0/TouchPass.exe)** or clone the repository:
   ```cmd
   git clone https://github.com/tody-agent/Touch-Pass.git
   cd Touch-Pass
   ```
2. Double-click **`TouchPass.exe`** or run **`start_touchpass.bat`**:
   ```cmd
   .\start_touchpass.bat
   ```
3. Open `http://127.0.0.1:8787/` in your browser to launch the Web Portal.

### macOS / Linux
1. Run the one-line POSIX installer:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/tody-agent/Touch-Pass/main/packaging/install.sh | bash
   ```
2. Open `http://127.0.0.1:8787/` in your browser.

---

## 🎬 Feature Highlights & Visual Tour

![TouchPass Feature Overview](assets/demo/04-features.png)

- **Self-Serve 4-Step Onboarding**: Get up and running in 5 minutes with interactive hardware check and automatic port discovery.
- **Double-Touch Confirmation Safety Guard**: Non-password actions require touching the same finger twice within 3 seconds to prevent accidental execution.
- **Zero-Cloud Local Privacy & Encryption**: Password payloads are encrypted over serial using HMAC-SHA256 and AES-CTR backed by OS Credential Store (Windows Credential Manager / macOS Keychain).

---

## 📖 Deep-Dive Guides & Documentation

- 🤖 **[1-Prompt AI Agent Integration Guide](docs/AI_AGENT_PROMPT.md)** | **[🇻🇳 Bản Tiếng Việt](docs/AI_AGENT_PROMPT.vi.md)**
  *Automated 1-prompt setup instructions for Claude Code, Cursor, Antigravity, OpenCode, and ChatGPT CLI across Windows, macOS, and Linux.*

- 🛠️ **[Hardware Build & Wiring Guide](docs/BUILD_GUIDE.md)** | **[🇻🇳 Bản Tiếng Việt](docs/BUILD_GUIDE.vi.md)**
  *ESP32-S3 Super Mini, ZW101 pinout, enclosure assembly, `arduino-cli` firmware compilation, unauthenticated UART security model, and 1-click Windows launcher setup.*

- 📖 **[User Guide & AI Presets](docs/USER_GUIDE.md)** | **[🇻🇳 Bản Tiếng Việt](docs/USER_GUIDE.vi.md)**
  *Fingerprint enrollment, interactive shortcut recorder, double-touch safety rules, OS credential storage, and troubleshooting.*

---

## 🙏 Acknowledgements & License

TouchPass is open-source software licensed under the **[MIT License](LICENSE)**.

Special thanks and full credit to **[Zimeng Xiong](https://github.com/ZimengXiong)**, the original creator of **[TinyTouch](https://github.com/ZimengXiong/TinyTouch)**, whose open-hardware biometric USB architecture made TouchPass possible. Built with ❤️ upon the foundational codebase of ZimengXiong/TinyTouch.

---

## 🛡️ Security Policy & Legal Disclaimer / Tuyên Bố Miễn Trừ Trách Nhiệm

TouchPass is provided **"AS IS"**, without warranty of any kind, express or implied. Users assume full responsibility for physical hardware assembly, wiring diagram verification, voltage levels (3.3V vs 5V safety), optical biometric sensor calibration, and maintaining physical device security. TouchPass integrates directly with OS secure credential stores (Windows Credential Manager / macOS Keychain / Linux Secret Service) and communicates over Serial UART using HMAC-SHA256 challenge-response authentication.

TouchPass được cung cấp **"NGUYÊN TRẠNG" (AS IS)** và không có bất kỳ bảo hành nào. Người dùng tự chịu toàn bộ trách nhiệm đối với việc lắp ráp phần cứng vật lý, kiểm tra sơ đồ đấu nối dây, an toàn điện áp, hiệu chuẩn cảm biến vân tay quang học và bảo đảm an toàn truy cập vật lý cho thiết bị.

For full security architecture details, supported versions, vulnerability reporting procedures, and complete legal disclaimers, please review our **[Security Policy & Legal Disclaimer (SECURITY.md)](SECURITY.md)**.

Chi tiết về kiến trúc bảo mật, các phiên bản được hỗ trợ, quy trình báo cáo lỗ hổng bảo mật và toàn văn tuyên bố miễn trừ trách nhiệm pháp lý có tại **[Chính Sách Bảo Mật (SECURITY.vi.md)](SECURITY.vi.md)**.

