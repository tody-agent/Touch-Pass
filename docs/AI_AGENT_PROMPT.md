# 🤖 TouchPass 1-Prompt AI Agent Integration Guide

🌐 **English** | [🇻🇳 **Tiếng Việt**](AI_AGENT_PROMPT.vi.md) | [🇨🇳 **简体中文**](AI_AGENT_PROMPT.zh.md) | [🇷🇺 **Русский**](AI_AGENT_PROMPT.ru.md)

This guide provides a standardized, copy-paste **1-Prompt Setup instructions** for non-technical users leveraging AI coding assistants and CLI agents (**Claude Code**, **Cursor**, **Antigravity**, **OpenCode**, and **ChatGPT CLI**).

With a single prompt, your AI agent autonomously inspects your operating system environment, provisions the Python local helper service (`http://127.0.0.1:8787/`), directs Web Serial firmware flashing, and validates hardware communication and fingerprint enrollment.

---

## 📐 1-Prompt Overview & 4-Phase Autonomous Execution Workflow

When an AI agent receives the Master Prompt, it executes a 4-phase workflow to complete setup without requiring manual command-line editing from the user:

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                    4-PHASE AUTONOMOUS EXECUTION WORKFLOW                      │
├──────────────────────────────────────────────────────────────────────────────┤
│ Phase 1: Environment Preflight                                               │
│   • Detect OS (Windows / macOS / Linux)                                      │
│   • Verify Python 3.11+ installation & shell environment                     │
│   • Check USB permissions (e.g. dialout on Linux, COM ports on Windows)       │
├──────────────────────────────────────────────────────────────────────────────┤
│ Phase 2: Local Helper Setup                                                  │
│   • Create virtual environment (`software/.venv`)                            │
│   • Install required dependencies from `software/requirements.txt`           │
│   • Start local portal daemon listening on http://127.0.0.1:8787/             │
├──────────────────────────────────────────────────────────────────────────────┤
│ Phase 3: Web Serial Firmware Flashing                                        │
│   • Direct non-technical users to https://tody-agent.github.io/Touch-Pass/web/flasher/ │
│   • Connect ESP32-S3 SuperMini via Chrome/Edge Web Serial API                │
│   • Guide bootloader entry (Hold BOOT, press RESET, release BOOT) if needed   │
├──────────────────────────────────────────────────────────────────────────────┤
│ Phase 4: Verification & Finger Enrollment                                    │
│   • Verify daemon health check at http://127.0.0.1:8787/api/status          │
│   • Confirm USB serial / HID hardware connection                             │
│   • Guide user through initial fingerprint enrollment & prompt auto-approval │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Copyable Master Prompt Templates

### 🌟 Universal Master Setup Prompt (Recommended)

Copy and paste this exact prompt into **Claude Code**, **Cursor**, **Antigravity**, **OpenCode**, or **ChatGPT CLI**:

```text
Set up TouchPass on this machine for non-technical 1-prompt automated operation:

Phase 1: Environment Preflight
- Detect the operating system (Windows, macOS, or Linux).
- Verify Python 3.11+ is installed (`python --version` or `python3 --version`).
- Verify USB serial access permissions (e.g. ensure `dialout` group access on Linux, active COM ports on Windows, or `/dev/cu.usbmodem*` on macOS).

Phase 2: Local Helper Setup
- Ensure the TouchPass codebase is available locally.
- Create a Python virtual environment in `software/.venv` if it doesn't exist.
- Install dependencies from `software/requirements.txt`.
- Start the TouchPass portal daemon (`run_portal_win.py` on Windows or `python3 software/app.py` on macOS/Linux) running in the background on port 8787.

Phase 3: Firmware Flashing Guidance
- Instruct the user to open https://tody-agent.github.io/Touch-Pass/web/flasher/ in Chrome/Edge to flash the ESP32-S3 firmware via Web Serial API.
- Provide step-by-step instructions if bootloader entry is required (Hold BOOT button, press & release RESET, release BOOT).

Phase 4: Verification & Finger Enrollment
- Check http://127.0.0.1:8787/api/status to verify the local daemon is running and active.
- Verify USB serial hardware connection to ESP32-S3.
- Guide the user on opening http://127.0.0.1:8787/ to enroll their first fingerprint and test the hardware 'y' + Enter keybinding for automated AI CLI prompt approvals.
```

---

### 🟧 Claude Code CLI Prompt

```text
Set up TouchPass on this machine using Claude Code CLI:
1. Perform Environment Preflight: Check OS type, verify Python 3.11+, and list available USB serial ports.
2. Local Helper Setup: Create software/.venv if missing, run pip install -r software/requirements.txt, and launch the portal daemon in background on http://127.0.0.1:8787/.
3. Direct user to https://tody-agent.github.io/Touch-Pass/web/flasher/ for 1-click Web Serial flashing on Chrome/Edge.
4. Verify daemon health at http://127.0.0.1:8787/api/status and report connection status.
```

---

### 🟦 Cursor IDE Prompt (Agent Mode)

```text
Set up TouchPass environment in Cursor:
1. Verify Python 3.11+ is active in terminal.
2. Initialize software/.venv, install requirements from software/requirements.txt, and start background server at http://127.0.0.1:8787/.
3. Prompt user to open https://tody-agent.github.io/Touch-Pass/web/flasher/ to flash ESP32-S3 firmware over Web Serial.
4. Confirm http://127.0.0.1:8787/api/status returns JSON status "ok".
```

---

### 🟪 Antigravity AI Agent Prompt

```text
Initialize TouchPass hardware paired helper:
1. Detect host environment (Windows/macOS/Linux) and Python 3.11+ path.
2. Set up virtual environment in software/.venv, install dependencies, and launch daemon on port 8787.
3. Output Web Flasher link https://tody-agent.github.io/Touch-Pass/web/flasher/ with bootloader instructions.
4. Run health check on http://127.0.0.1:8787/api/status and confirm serial telemetry.
```

---

### 🟩 OpenCode Agent Prompt

```text
Set up TouchPass automated pair programming helper:
1. Perform preflight checks for Python 3.11+ and USB serial permissions.
2. Build software/.venv environment, install requirements, and execute background daemon software/app.py on http://127.0.0.1:8787/.
3. Guide user to https://tody-agent.github.io/Touch-Pass/web/flasher/ for browser firmware installation.
4. Test http://127.0.0.1:8787/api/status endpoint to confirm daemon readiness.
```

---

### 🟨 ChatGPT CLI Prompt

```text
Configure TouchPass daemon and firmware flasher flow via ChatGPT CLI:
1. Verify Python 3.11+ binary environment and serial communication permissions.
2. Create software/.venv, install dependencies from software/requirements.txt, and run portal daemon at http://127.0.0.1:8787/.
3. Direct user to open https://tody-agent.github.io/Touch-Pass/web/flasher/ for ESP32-S3 Web Serial flashing.
4. Perform API health check on http://127.0.0.1:8787/api/status and prompt user for fingerprint enrollment.
```

---

### 🪟 Windows Setup Prompt (PowerShell / CMD)

```text
Set up TouchPass on Windows:
1. Verify Python installation using `python --version` or `py -3 --version`.
2. Run `start_touchpass.bat` to create `software\.venv`, install `software\requirements.txt`, and launch `run_portal_win.py` on http://127.0.0.1:8787/.
3. Direct user to https://tody-agent.github.io/Touch-Pass/web/flasher/ for Web Serial firmware flashing.
4. Verify daemon health at http://127.0.0.1:8787/api/status and test USB serial connection.
```

---

### 🍎 macOS Setup Prompt (Terminal / zsh)

```text
Set up TouchPass on macOS:
1. Check Python version via `python3 --version` (install via Homebrew or Python installer if missing).
2. Run `python3 -m venv software/.venv && software/.venv/bin/pip install -r software/requirements.txt`.
3. Launch portal in background: `nohup software/.venv/bin/python software/app.py > touchpass.log 2>&1 &`.
4. Direct user to https://tody-agent.github.io/Touch-Pass/web/flasher/ for Web Serial firmware flashing.
5. Verify status at http://127.0.0.1:8787/api/status and check connected `/dev/cu.usbmodem*` ports.
```

---

### 🐧 Linux Setup Prompt (Bash / systemd)

```text
Set up TouchPass on Linux:
1. Check `python3 --version` and ensure `python3-venv` is installed.
2. Ensure dialout permissions: `sudo usermod -a -G dialout $USER`.
3. Run `python3 -m venv software/.venv && software/.venv/bin/pip install -r software/requirements.txt`.
4. Start daemon: `nohup software/.venv/bin/python software/app.py > touchpass.log 2>&1 &`.
5. Direct user to https://tody-agent.github.io/Touch-Pass/web/flasher/ for Web Serial firmware flashing.
6. Verify daemon endpoint `curl http://127.0.0.1:8787/api/status`.
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

## 🛠️ Detailed Step-by-Step Breakdown: What the AI Agent Does

Here is an explicit breakdown of the actions your AI agent executes automatically across each phase:

### Phase 1: Environment Preflight
1. **OS Detection & Binary Check**:
   - Executes `uname -s` or checks `%OS%` environment variables.
   - Checks if Python 3.11+ is installed (`python --version` / `python3 --version`).
   - If Python is missing, prompts user with specific instructions to install Python 3.11+.
2. **Port Availability Check**:
   - Confirms port 8787 is open and not occupied by another process.
3. **USB Serial Permission Inspection**:
   - On Linux, checks if current user belongs to `dialout` or `tty` group.
   - On Windows, lists available COM ports using PowerShell or `serial.tools.list_ports`.
   - On macOS, checks `/dev/cu.usbmodem*` or `/dev/cu.usbserial*`.

### Phase 2: Local Helper Setup
1. **Virtual Environment Creation**:
   - Executes `python -m venv software/.venv` (or `python3 -m venv software/.venv`).
2. **Dependency Installation**:
   - Upgrades `pip` and installs required packages: `pip install -r software/requirements.txt` (including `flask`, `pyserial`, `cryptography`, etc.).
3. **Daemon Service Launch**:
   - On Windows: Launches `run_portal_win.py` or runs `start_touchpass.bat`.
   - On macOS/Linux: Executes `software/.venv/bin/python software/app.py` in the background.
   - Ensures local web server is listening on `http://127.0.0.1:8787/`.

### Phase 3: Web Serial Firmware Flashing
1. **Flasher Redirection**:
   - Instructs the user to open [https://tody-agent.github.io/Touch-Pass/web/flasher/](https://tody-agent.github.io/Touch-Pass/web/flasher/) in a Web Serial supported browser (Google Chrome, Microsoft Edge, Opera).
2. **Web Serial Connection & Flash**:
   - The user selects the connected ESP32-S3 device port and clicks **Install / Flash Firmware**.
3. **Bootloader Guidance**:
   - If device fails to enter flash mode automatically:
     1. Hold down the **BOOT** button on the ESP32-S3 SuperMini.
     2. Press and release the **RESET** (EN) button.
     3. Release the **BOOT** button.
     4. Click **Connect** on the Web Flasher.

### Phase 4: Verification & Finger Enrollment
1. **Health Gate Check**:
   - Agent queries `http://127.0.0.1:8787/api/status` to verify JSON response (`"status": "ok"` or active state).
2. **Hardware Serial Link Verification**:
   - Agent verifies that serial communication between the Python daemon and ESP32-S3 hardware is active.
3. **Web Portal Enrollment**:
   - Agent opens or provides the link to `http://127.0.0.1:8787/`.
   - User follows instructions on the Web Portal UI to register fingerprints (e.g. Index finger for `y` + Enter CLI prompt approval).
4. **Action Binding Test**:
   - User tests touching the sensor when prompted in terminal sessions (Claude Code, Cursor, terminal prompts) to automatically authorize commands.

---

## 🤖 AI Agent Tool-Specific Usage Guide

### 1. Claude Code CLI
- **Execution**: Paste the Universal Master Setup Prompt directly into your terminal running `claude`:
  ```bash
  claude "Set up TouchPass on this machine following the 4-phase setup flow: preflight environment, software/.venv setup, web serial flashing link, and daemon status check."
  ```
- **Outcome**: Claude Code inspects system tools, sets up Python environments, launches background services, and outputs the flasher and portal URLs.

### 2. Cursor IDE
- **Execution**: Open **Composer** (`Ctrl+I` / `Cmd+I`) or **Chat** (`Ctrl+L` / `Cmd+L`), switch to **Agent Mode**, and paste the Master Setup Prompt.
- **Outcome**: Cursor creates the `.venv`, executes package installation terminal tasks, and verifies portal responsiveness.

### 3. Antigravity AI Agent
- **Execution**: Provide the Master Prompt in the Antigravity session.
- **Outcome**: Antigravity runs OS preflight, manages background daemon execution, and confirms system readiness.

### 4. OpenCode
- **Execution**: Paste prompt into OpenCode agent chat window.
- **Outcome**: OpenCode executes shell commands to configure Python requirements, start the portal daemon, and verify hardware connectivity.

### 5. ChatGPT CLI
- **Execution**: Pass the Master Prompt to ChatGPT CLI interface.
- **Outcome**: ChatGPT CLI inspects environment, guides local venv provisioning, directs browser Web Serial flashing, and verifies API endpoints.

---

## 🔍 Verification & Troubleshooting

After setup, test daemon status and endpoints directly:

```bash
# Check daemon HTTP status endpoint
curl -s http://127.0.0.1:8787/api/status

# Test local portal engine on Windows without auto-launching browser
python run_portal_win.py --no-browser
```

### Common Troubleshooting Steps
1. **USB Hardware Not Detected**:
   - Ensure you are using a **USB 2.0/3.0 Data Cable**, not a power-only charging cable.
   - Verify USB drivers (CP210x or CH340 if using external UART bridge; ESP32-S3 native USB CDC otherwise).
2. **Web Serial Flashing Fails**:
   - Use Google Chrome or Microsoft Edge (Web Serial is not supported on Firefox or Safari).
   - Put ESP32-S3 in bootloader mode: Hold **BOOT** button, press/release **RESET**, release **BOOT**.
3. **Port 8787 Already in Use**:
   - Stop any existing TouchPass processes:
     - **Windows**: `taskkill /F /IM python.exe`
     - **macOS/Linux**: `pkill -f "software/app.py"`
4. **Linux Serial Permission Error**:
   - Run `sudo usermod -a -G dialout $USER` and log out/log in to apply group changes.
