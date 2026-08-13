<div align="center">

# 🖐️ TouchPass

### *Give every finger a superpower.*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Hardware](https://img.shields.io/badge/Hardware-ESP32--S3-orange.svg)](docs/BUILD_GUIDE.md)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg)](https://python.org)
[![Release](https://img.shields.io/badge/Release-v2.0.0-brightgreen.svg)](https://github.com/ZimengXiong/TinyTouch)

🌐 **English** | [🇻🇳 **Tiếng Việt**](README.vi.md)

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
| 🔌 **Native USB HID** | Emulates a standard USB physical keyboard hardware via ESP32-S3 stack | Driverless plug-and-play across Windows, macOS & Linux; sends keystrokes into whichever window is currently **focused** |
| 🖐️ **10 Fingerprint Slots** | ZW101 optical biometric sensor (Slots 01–10) matched locally on-chip | Zero cloud dependency; assign unique macro/password triggers to each finger |
| ⌨️ **Interactive Shortcut Recorder** | Web Portal UI (`http://127.0.0.1:8787/`) with live keystroke capture & action builder | Configure single `key`, `text`, `delay` (ms), `enter`, or `escape` action sequences in seconds |
| 🤖 **AI Tools Preset Library** | Built-in 1-click profiles for **Claude Code CLI**, **Cursor**, **Antigravity**, **OpenCode** | Instant setup for common AI CLI developer prompts and IDE shortcuts |
| 🚀 **1-Click Launcher** | Automatic Windows batch launcher (`start_touchpass.bat`) & macOS/Linux CLI | Launch local Flask service & unauthenticated UART serial daemon seamlessly |

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

### Windows
1. Clone the repository and navigate into the project directory:
   ```cmd
   git clone https://github.com/ZimengXiong/TinyTouch.git
   cd TouchPass
   ```
2. Double-click or run `start_touchpass.bat` from Command Prompt or PowerShell:
   ```cmd
   .\start_touchpass.bat
   ```
3. Open `http://127.0.0.1:8787/` in your browser to launch the Web Portal.

### macOS / Linux
1. Install Python dependencies and launch the TouchPass CLI:
   ```bash
   pip install -r requirements.txt
   python3 -m touchpass.cli start
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

- 🛠️ **[Hardware Build & Wiring Guide](docs/BUILD_GUIDE.md)** | **[🇻🇳 Bản Tiếng Việt](docs/BUILD_GUIDE.vi.md)**
  *ESP32-S3 Super Mini, ZW101 pinout, enclosure assembly, `arduino-cli` firmware compilation, unauthenticated UART security model, and 1-click Windows launcher setup.*

- 📖 **[User Guide & AI Presets](docs/USER_GUIDE.md)** | **[🇻🇳 Bản Tiếng Việt](docs/USER_GUIDE.vi.md)**
  *Fingerprint enrollment, interactive shortcut recorder, double-touch safety rules, OS credential storage, and troubleshooting.*

---

## ⚖️ License & Acknowledgments

TouchPass is open-source software licensed under the **[MIT License](LICENSE)**.

Built with ❤️ upon the foundational architecture of **[ZimengXiong/TinyTouch](https://github.com/ZimengXiong/TinyTouch)**.
