# 🤖 TouchPass 1-Prompt AI Agent Integration Guide

This guide provides standardized, copy-paste **1-Prompt Setup instructions** for AI coding assistants and CLI agents (**Claude Code**, **Cursor**, **Antigravity**, **OpenCode**).

With a single prompt, your AI agent can clone, configure, launch, and verify the TouchPass local hardware helper and daemon on any operating system.

---

## 📐 1-Prompt Execution Workflow

When an AI agent executes the TouchPass 1-prompt sequence, it automatically runs through four deterministic steps:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                        1-PROMPT EXECUTION FLOW                          │
├─────────────────────────────────────────────────────────────────────────┤
│ 1. 🔍 Detect OS & Environment                                           │
│    Identifies Windows / macOS / Linux and checks Python 3.11+            │
├─────────────────────────────────────────────────────────────────────────┤
│ 2. 📦 Setup Virtual Environment & Dependencies                          │
│    Creates software/.venv and installs software/requirements.txt         │
├─────────────────────────────────────────────────────────────────────────┤
│ 3. 🚀 Launch TouchPass Portal Daemon                                     │
│    Starts local portal engine on http://127.0.0.1:8787/                 │
├─────────────────────────────────────────────────────────────────────────┤
│ 4. ⚡ Verify USB Connection & HID Keybinding                             │
│    Verifies ESP32-S3 serial port & confirms 'y' + Enter keybinding       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Copyable 1-Prompt Templates

Select and paste the appropriate prompt into your AI coding assistant.

### 🌟 Universal Cross-Platform Prompt (Recommended)

Works with **Claude Code**, **Cursor**, **Antigravity**, and **OpenCode** on any OS:

```text
Set up TouchPass on this machine for automated AI CLI prompt confirmation:
1. Detect the operating system (Windows, macOS, or Linux) and verify Python 3.11+ is installed.
2. Ensure the TouchPass repository is cloned locally or use current workspace files.
3. Create a Python virtual environment in `software/.venv` (if not present) and install dependencies from `software/requirements.txt`.
4. Start the TouchPass local portal service (`run_portal_win.py` on Windows or `python3 software/app.py` on macOS/Linux) in the background listening on port 8787.
5. Verify the Web Portal is responsive at http://127.0.0.1:8787/ and verify the ESP32-S3 USB HID connection for 'y' + Enter prompt auto-approval.
```

---

### 🪟 Windows Prompt (Command Prompt / PowerShell)

```text
Set up TouchPass on Windows:
1. Check for Python installation (`python` or `py -3`).
2. Run `start_touchpass.bat` to automatically create `software/.venv`, install requirements, and launch the portal service on http://127.0.0.1:8787/.
3. Verify that http://127.0.0.1:8787/ responds with HTTP 200 OK and check for connected ESP32-S3 serial ports.
```

---

### 🍎 macOS Prompt (Terminal / zsh)

```text
Set up TouchPass on macOS:
1. Verify Python 3.11+ is available via `python3 --version` or Homebrew.
2. Create virtual environment `python3 -m venv software/.venv` and install `pip install -r software/requirements.txt`.
3. Launch the TouchPass portal engine in the background: `nohup software/.venv/bin/python software/app.py > touchpass.log 2>&1 &`.
4. Verify port 8787 is active (`curl -s http://127.0.0.1:8787/api/status`) and check USB serial connection to ESP32-S3.
```

---

### 🐧 Linux Prompt (Bash / systemd)

```text
Set up TouchPass on Linux:
1. Check `python3 --version` and ensure `python3-venv` is installed.
2. Initialize virtual environment and install requirements: `python3 -m venv software/.venv && software/.venv/bin/pip install -r software/requirements.txt`.
3. Start the daemon in the background on port 8787 and verify `curl http://127.0.0.1:8787/api/status`.
4. Ensure dialout/tty permissions are configured for ESP32-S3 access (`sudo usermod -a -G dialout $USER`).
```

---

## ⚡ Shell Bootstrap One-Liners

If you prefer to launch TouchPass using a single terminal command before invoking your AI agent:

### Windows (PowerShell)
```powershell
powershell -Command "iwr -useb https://raw.githubusercontent.com/tody-agent/Touch-Pass/main/start_touchpass.bat -OutFile start_touchpass.bat; .\start_touchpass.bat"
```

### macOS / Linux (Bash)
```bash
curl -fsSL https://raw.githubusercontent.com/tody-agent/Touch-Pass/main/packaging/install.sh | bash
```

---

## 🤖 Guide by AI Agent Tool

### 1. Claude Code CLI
- **Usage**: Copy the Universal Prompt and paste it directly into your Claude Code terminal prompt:
  ```bash
  claude "Set up TouchPass on this machine: create venv in software/.venv, install requirements, launch run_portal_win.py or software/app.py on port 8787, and verify USB connection."
  ```
- **Result**: Claude Code will detect your system, execute the setup commands, and confirm daemon status.

### 2. Cursor IDE
- **Usage**: Open Composer (`Cmd+I` or `Ctrl+I`) or Chat (`Cmd+L` or `Ctrl+L`) in Cursor.
- **Action**: Paste the Universal Prompt and select **"Agent Mode"**. Cursor will create the virtual environment and start the daemon service.

### 3. Antigravity AI Agent
- **Usage**: Invoke the agent in your workspace with the 1-Prompt template.
- **Action**: Antigravity will automatically analyze `start_touchpass.bat` or `software/app.py`, set up the dependencies, start background tasks, and run verification gates.

### 4. OpenCode
- **Usage**: Send the setup prompt in the OpenCode agent window.
- **Action**: OpenCode will run shell commands to build `.venv`, launch port 8787, and verify connection to your ESP32-S3 fingerprint hardware.

---

## 🔍 Verification & Troubleshooting

After running the 1-prompt setup, verify status via terminal:

```bash
# Check if daemon API is responding
curl http://127.0.0.1:8787/api/status

# Check connected hardware ports
python run_portal_win.py --no-browser
```

If the USB hardware is not detected:
1. Ensure your ESP32-S3 SuperMini is connected via a **USB Data Cable** (not power-only).
2. If flashing new firmware, use the [🌐 **1-Click Web Flasher**](https://tody-agent.github.io/Touch-Pass/web/flasher/).
3. For bootloader manual entry, hold **BOOT**, press **RESET**, then release **BOOT**.
