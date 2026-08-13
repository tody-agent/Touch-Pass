# TouchPass

🌐 **English** | [🇻🇳 **Tiếng Việt**](README.vi.md)

> **Give every finger a superpower.**

---


## ⚡ The Story: Why We Built TouchPass

Imagine this: You are in the flow state, building a complex feature with AI coding tools like **Claude Code CLI**, **Cursor**, or **Antigravity**.

Every 30 seconds, your terminal pauses and asks:
> *"Allow execution of `git status`? (y/n)"*

You reach for your keyboard, type `y`, hit `Enter`, and return your eyes to the code. Then 20 seconds later: *`Sudo password required`*. You stop, type your complex 20-character password, hoping you didn't mistype a symbol.

**These micro-interruptions kill your deep work flow.**

That’s why we created **TouchPass**. 

What if your desk had a physical biometric touch pad where **each finger is assigned a dedicated superpower**?
- ☝️ **Index finger**: Instantly accepts AI terminal prompts (`y` + Enter).
- 🖕 **Middle finger**: Types your developer sudo/SSH password from encrypted OS credential store.
- 🖐️ **Ring finger**: Triggers your custom multi-key macro sequence.

No app switching. No copy-pasting credentials. No typing errors. Just **one tap**, and your hardware executes the action at lightning speed.

---

## 🎯 The Solution: Physical Hardware Meets Biometric Security

**TouchPass** is an open-source **USB HID Native + Biometric Authentication Platform** built on an **ESP32-S3 Super Mini** microcontroller and a **ZW101** optical fingerprint sensor.

Unlike software macro apps that require custom background agents on target machines, TouchPass operates at the **hardware level**:

```text
┌───────────────────────┐             ┌───────────────────────┐             ┌───────────────────────┐
│  Physical Finger Touch│ ──────────► │  ESP32-S3 Hardware    │ ──────────► │  Computer / Terminal  │
│  (Biometric ZW101)    │             │  (USB HID Keyboard)   │             │  (Instant Keystrokes) │
└───────────────────────┘             └───────────────────────┘             └───────────────────────┘
```

Your computer recognizes TouchPass as a **standard USB physical keyboard**. It types text, sends hotkeys, executes delays, or inputs passwords into whichever window currently has cursor focus — **zero drivers or target software required**.

---

## 🚀 Key Use Cases: How TouchPass Transforms Your Workflow

### 1. 🤖 AI Pair Programming Accelerator
When working with AI agentic CLI tools (such as Claude Code), approving suggestions requires pressing `y` and `Enter` repeatedly.

![TouchPass approving a Claude prompt on a Mac mini](assets/demo/02-mac-mini-claude-accept-v2.png)

> **How it works:** When your terminal prompt asks for approval, tap your enrolled finger. TouchPass sends a key action that types `y` followed by Enter directly into your terminal-style prompt. Note: TouchPass sends native USB HID keyboard keystrokes to the focused field; it cannot click or press GUI button elements.

### 2. 🔑 One-Tap Secure Developer Authentication
Tired of typing complex passwords for `sudo`, SSH keys, database staging environments, or 2FA codes?
- TouchPass securely retrieves your password from your native OS Credential Store (Windows Credential Manager / macOS Keychain).
- The payload is encrypted over serial using HMAC-SHA256 and AES-CTR.
- The hardware inputs the exact password text instantly with zero typing errors.

### 3. ⌨️ Interactive Custom Keystroke & Macro Execution
Configure up to 10 distinct biometric slots (Slots 01–10) with custom macros:
- **Key Actions**: Send single key strokes or hotkey combinations like `Enter`, `Escape`, `Ctrl+C`, or `Cmd+K`.
- **Text Actions**: Type frequently used boilerplate code, git flags, or email templates.
- **Delay Actions**: Add millisecond delays between keystrokes for multi-step terminal sequences.

### 4. 🛡️ Double-Touch Confirmation Safety Guard
Worried about accidentally triggering an execution by bumping the sensor? TouchPass includes an intelligent safety engine:
- **Password actions**: Execute on a single touch.
- **Non-password actions** (`Enter`, `Escape`, `Accept`, Custom Macros): Require touching the same finger **twice within 3 seconds** to confirm before sending the keystrokes.

---

## 💎 Product Values: Why Developers Love TouchPass

- 🚀 **Plug & Play Universal Compatibility**: Works on Windows, macOS, and Linux as a standard USB HID keyboard.
- 🔐 **Zero-Cloud Local Privacy**: All biometrics are matched locally on the ZW101 sensor core. No fingerprints or passwords ever touch the cloud.
- ⚡ **Real-Time Telemetry & Web Portal**: Includes a sleek Web Portal (`http://127.0.0.1:8787/`) with an interactive **Shortcut Recorder** and **Live Debug Log Monitor**.
- 🛠️ **Open Source & Hackable**: Built on the open-source platform [ZimengXiong/TinyTouch](https://github.com/ZimengXiong/TinyTouch).

---

## 🎬 Feature Highlights

![TouchPass Feature Overview](assets/demo/04-features.png)

- **Self-Serve 4-Step Onboarding**: Get up and running in 5 minutes with interactive hardware checks.
- **AI Shortcut Library**: Built-in 1-click presets for Claude Code CLI, Cursor IDE, Claude Desktop, and Antigravity IDE.
- **Live Event Log Badges**: Monitor real-time hardware telemetry (`TOUCH`, `MATCH`, `PW`, `ERR`, `SYS`).

---

## 📖 Deep-Dive Guides & Documentation

Ready to build your own TouchPass or explore advanced configurations? Jump into our step-by-step guides:

- 🛠️ **[Build TouchPass (English)](docs/BUILD_GUIDE.md)** | **[🇻🇳 Bản Tiếng Việt](docs/BUILD_GUIDE.vi.md)**
  *Hardware wiring diagram, ZW101 pinout, enclosure assembly, `arduino-cli` firmware compilation, and 1-click Windows launcher.*

- 📖 **[User Guide & AI Presets (English)](docs/USER_GUIDE.md)** | **[🇻🇳 Bản Tiếng Việt](docs/USER_GUIDE.vi.md)**
  *Fingerprint enrollment, interactive shortcut recorder, double-touch safety rules, OS credential storage, and troubleshooting.*

---

## ⚖️ License & Acknowledgments

TouchPass is open-source software licensed under the MIT License. Built with ❤️ upon the foundational architecture of [ZimengXiong/TinyTouch](https://github.com/ZimengXiong/TinyTouch).
