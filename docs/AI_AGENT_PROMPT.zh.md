# 🤖 TouchPass 1-Prompt AI Agent 集成指南

[🌐 **English**](AI_AGENT_PROMPT.md) | [🇻🇳 **Tiếng Việt**](AI_AGENT_PROMPT.vi.md) | 🇨🇳 **简体中文**

本指南为使用 AI 编程助手和 CLI Agent（**Claude Code**、**Cursor**、**Antigravity**、**OpenCode** 以及 **ChatGPT CLI**）的非技术用户提供标准化的、即复制即用的 **1-Prompt 设置指令**。

只需一条 Prompt，您的 AI Agent 即可自主检查您的操作系统环境、配置 Python 本地 Helper 服务（`http://127.0.0.1:8787/`）、引导 Web Serial 固件刷写，并验证硬件通信与指纹注册。

---

## 📐 1-Prompt 概览与 4 阶段自主执行工作流

当 AI Agent 收到 Master Prompt 后，它将执行 4 阶段工作流以完成设置，无需用户手动编辑命令行：

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                       4 阶段自主执行工作流 (4-PHASE WORKFLOW)                 │
├──────────────────────────────────────────────────────────────────────────────┤
│ Phase 1: Environment Preflight (阶段 1：环境预检)                             │
│   • 检测操作系统 (Windows / macOS / Linux)                                   │
│   • 校验 Python 3.11+ 安装与 Shell 环境                                      │
│   • 检查 USB 串口权限 (如 Linux 上的 dialout 组，Windows 上的 COM 端口)       │
├──────────────────────────────────────────────────────────────────────────────┤
│ Phase 2: Local Helper Setup (阶段 2：本地 Helper 设置)                       │
│   • 创建虚拟环境 (`software/.venv`)                                           │
│   • 从 `software/requirements.txt` 安装所需依赖                               │
│   • 启动监听在 http://127.0.0.1:8787/ 的本地 Web 门户 Daemon 后台进程          │
├──────────────────────────────────────────────────────────────────────────────┤
│ Phase 3: Web Serial Firmware Flashing (阶段 3：Web Serial 固件刷写)           │
│   • 引导非技术用户访问 https://tody-agent.github.io/Touch-Pass/web/flasher/  │
│   • 在 Chrome/Edge 中通过 Web Serial API 连接 ESP32-S3 SuperMini             │
│   • 如有需要，引导进入 Bootloader 模式 (按住 BOOT，按下并释放 RESET，释放 BOOT) │
├──────────────────────────────────────────────────────────────────────────────┤
│ Phase 4: Verification & Finger Enrollment (阶段 4：验证与指纹注册)            │
│   • 校验 Daemon 健康检查端点 http://127.0.0.1:8787/api/status                │
│   • 确认 USB 串口 / HID 硬件连接状态                                         │
│   • 引导用户完成初始指纹注册并测试 Prompt 自动批准按键                       │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 可复制的主 Prompt 模板

### 🌟 通用 Master 设置 Prompt（推荐）

复制并粘贴此 Prompt 到 **Claude Code**、**Cursor**、**Antigravity**、**OpenCode** 或 **ChatGPT CLI** 中：

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

### 🟦 Cursor IDE Prompt (Agent 模式)

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

### 🪟 Windows 设置 Prompt (PowerShell / CMD)

```text
Set up TouchPass on Windows:
1. Verify Python installation using `python --version` or `py -3 --version`.
2. Run `start_touchpass.bat` to create `software\.venv`, install `software\requirements.txt`, and launch `run_portal_win.py` on http://127.0.0.1:8787/.
3. Direct user to https://tody-agent.github.io/Touch-Pass/web/flasher/ for Web Serial firmware flashing.
4. Verify daemon health at http://127.0.0.1:8787/api/status and test USB serial connection.
```

---

### 🍎 macOS 设置 Prompt (Terminal / zsh)

```text
Set up TouchPass on macOS:
1. Check Python version via `python3 --version` (install via Homebrew or Python installer if missing).
2. Run `python3 -m venv software/.venv && software/.venv/bin/pip install -r software/requirements.txt`.
3. Launch portal in background: `nohup software/.venv/bin/python software/app.py > touchpass.log 2>&1 &`.
4. Direct user to https://tody-agent.github.io/Touch-Pass/web/flasher/ for Web Serial firmware flashing.
5. Verify status at http://127.0.0.1:8787/api/status and check connected `/dev/cu.usbmodem*` ports.
```

---

### 🐧 Linux 设置 Prompt (Bash / systemd)

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

## ⚡ Shell 引导单行命令

如果您希望在调用 AI Agent 之前使用单条终端命令启动 TouchPass：

### Windows (PowerShell)
```powershell
powershell -Command "iwr -useb https://raw.githubusercontent.com/tody-agent/Touch-Pass/main/start_touchpass.bat -OutFile start_touchpass.bat; .\start_touchpass.bat"
```

### macOS / Linux (Bash)
```bash
curl -fsSL https://raw.githubusercontent.com/tody-agent/Touch-Pass/main/packaging/install.sh | bash
```

---

## 🛠️ 详细分步拆解：AI Agent 执行的具体操作

以下是您的 AI Agent 在各个阶段自动执行的具体操作拆解：

### Phase 1: Environment Preflight (环境预检)
1. **OS 检测与可执行文件检查**：
   - 执行 `uname -s` 或检查 `%OS%` 环境变量。
   - 校验 Python 3.11+ 是否已安装（`python --version` / `python3 --version`）。
   - 如果缺少 Python，向用户提示安装 Python 3.11+ 的具体说明。
2. **端口可用性检查**：
   - 确认 8787 端口空闲且未被其他进程占用。
3. **USB 串口权限检查**：
   - 在 Linux 上，检查当前用户是否属于 `dialout` 或 `tty` 用户组。
   - 在 Windows 上，使用 PowerShell 或 `serial.tools.list_ports` 列出可用的 COM 端口。
   - 在 macOS 上，检查 `/dev/cu.usbmodem*` 或 `/dev/cu.usbserial*`。

### Phase 2: Local Helper Setup (本地 Helper 设置)
1. **创建虚拟环境**：
   - 执行 `python -m venv software/.venv`（或 `python3 -m venv software/.venv`）。
2. **依赖项安装**：
   - 升级 `pip` 并安装所需的软件包：`pip install -r software/requirements.txt`（包含 `flask`、`pyserial`、`cryptography` 等）。
3. **Daemon 服务启动**：
   - 在 Windows 上：启动 `run_portal_win.py` 或运行 `start_touchpass.bat`。
   - 在 macOS/Linux 上：在后台执行 `software/.venv/bin/python software/app.py`。
   - 确保本地 Web 服务器正在监听 `http://127.0.0.1:8787/`。

### Phase 3: Web Serial Firmware Flashing (固件刷写)
1. **刷机页面重定向**：
   - 引导用户在支持 Web Serial 的浏览器（Google Chrome、Microsoft Edge、Opera）中打开 [https://tody-agent.github.io/Touch-Pass/web/flasher/](https://tody-agent.github.io/Touch-Pass/web/flasher/)。
2. **Web Serial 连接与刷写**：
   - 用户选择已连接的 ESP32-S3 设备端口并点击 **Install / Flash Firmware**。
3. **Bootloader 模式引导**：
   - 如果设备未能自动进入刷写模式：
     1. 按住 ESP32-S3 SuperMini 上的 **BOOT** 按钮。
     2. 按下并释放 **RESET** (EN) 按钮。
     3. 释放 **BOOT** 按钮。
     4. 在 Web 刷机工具上点击 **Connect**。

### Phase 4: Verification & Finger Enrollment (验证与指纹注册)
1. **健康门禁检查**：
   - Agent 请求 `http://127.0.0.1:8787/api/status` 校验 JSON 响应（`"status": "ok"` 或活跃状态）。
2. **硬件串口链路验证**：
   - Agent 验证 Python Daemon 与 ESP32-S3 硬件之间的串口通信处于活跃状态。
3. **Web 门户指纹注册**：
   - Agent 打开或提供通往 `http://127.0.0.1:8787/` 的链接。
   - 用户按照 Web 门户 UI 上的说明注册指纹（例如录制食指用于 `y` + Enter 终端提示批准）。
4. **动作绑定测试**：
   - 用户在终端会话（Claude Code、Cursor、终端提示）中收到提示时测试触摸传感器，以自动授权命令。

---

## 🤖 AI Agent 工具专属使用指南

### 1. Claude Code CLI
- **执行方式**：将 Universal Master Setup Prompt 直接粘贴到运行 `claude` 的终端中：
  ```bash
  claude "Set up TouchPass on this machine following the 4-phase setup flow: preflight environment, software/.venv setup, web serial flashing link, and daemon status check."
  ```
- **预期结果**：Claude Code 检查系统工具、配置 Python 环境、启动后台服务并输出刷机工具及门户 URL。

### 2. Cursor IDE
- **执行方式**：打开 **Composer** (`Ctrl+I` / `Cmd+I`) 或 **Chat** (`Ctrl+L` / `Cmd+L`)，切换到 **Agent Mode**，然后粘贴 Master Setup Prompt。
- **预期结果**：Cursor 创建 `.venv`，执行安装软件包的终端任务，并验证 Web 门户响应性。

### 3. Antigravity AI Agent
- **执行方式**：在 Antigravity 会话中提供 Master Prompt。
- **预期结果**：Antigravity 运行 OS 预检、管理后台 Daemon 的执行并确认系统就绪状态。

### 4. OpenCode
- **执行方式**：将 Prompt 粘贴到 OpenCode Agent 聊天窗口中。
- **预期结果**：OpenCode 执行 Shell 命令配置 Python 依赖，启动 Web 门户 Daemon，并验证硬件连接。

### 5. ChatGPT CLI
- **执行方式**：将 Master Prompt 传递给 ChatGPT CLI 界面。
- **预期结果**：ChatGPT CLI 检查环境、引导本地 venv 配置、指示浏览器 Web Serial 刷写并校验 API 端点。

---

## 🔍 验证与故障排查

在完成设置后，可直接测试 Daemon 状态与 API 端点：

```bash
# 检查 Daemon HTTP 状态端点
curl -s http://127.0.0.1:8787/api/status

# 在 Windows 上测试本地 Web 门户引擎（不自动打开浏览器）
python run_portal_win.py --no-browser
```

### 常见故障排查步骤
1. **未检测到 USB 硬件**：
   - 确保使用的是 **USB 2.0/3.0 数据传输线**，而非仅能充电的电源线。
   - 验证 USB 驱动程序（如果使用外置 UART 转接桥则需要 CP210x 或 CH340；ESP32-S3 原生 USB CDC 则无需外置驱动）。
2. **Web Serial 固件刷写失败**：
   - 请使用 Google Chrome 或 Microsoft Edge（Firefox 或 Safari 不支持 Web Serial API）。
   - 将 ESP32-S3 置于 Bootloader 模式：按住 **BOOT** 按钮，按下/释放 **RESET**，释放 **BOOT**。
3. **8787 端口已被占用**：
   - 停止任何已存在的 TouchPass 进程：
     - **Windows**：`taskkill /F /IM python.exe`
     - **macOS/Linux**：`pkill -f "software/app.py"`
4. **Linux 串口权限错误**：
   - 运行 `sudo usermod -a -G dialout $USER`，然后注销并重新登录以应用用户组变更。
