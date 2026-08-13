# 🤖 TouchPass 1-Prompt AI Agent Интеграционное руководство

[🌐 **English**](AI_AGENT_PROMPT.md) | [🇻🇳 **Tiếng Việt**](AI_AGENT_PROMPT.vi.md) | [🇨🇳 **简体中文**](AI_AGENT_PROMPT.zh.md) | 🇷🇺 **Русский**

Настоящее руководство предоставляет стандартизированные инструкции **1-Prompt Setup** (настройка за 1 промпт) для пользователей, взаимодействующих с AI-ассистентами и CLI-агентами (**Claude Code**, **Cursor**, **Antigravity**, **OpenCode** и **ChatGPT CLI**).

С помощью одного промпта ваш AI-агент автоматически проверит окружение операционной системы, настроит локальную службу TouchPass (`http://127.0.0.1:8787/`), перенаправит на веб-прошивку прошивки по Web Serial и проверит связь с оборудованием и регистрацию отпечатков.

---

## 📐 Обзор 1-Prompt и автономный рабочий процесс из 4 фаз (Phase 1–4)

Когда AI-агент получает Главный промпт (Master Prompt), он выполняет 4-фазный рабочий процесс (Phase 1 to Phase 4 / Фаза 1–Фаза 4) без необходимости ручного ввода команд пользователем:

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                 АВТОНОМНЫЙ РАБОЧИЙ ПРОЦЕСС ИЗ 4 ФАЗ (PHASE 1-4)              │
├──────────────────────────────────────────────────────────────────────────────┤
│ Phase 1 / Фаза 1: Предварительная проверка окружения                         │
│   • Определение ОС (Windows / macOS / Linux)                                 │
│   • Проверка установки Python 3.11+ и окружения оболочки                     │
│   • Проверка прав доступа к USB (например, группа dialout на Linux, COM-порты)│
├──────────────────────────────────────────────────────────────────────────────┤
│ Phase 2 / Фаза 2: Настройка локальной службы (Helper)                        │
│   • Создание виртуального окружения (`software/.venv`)                        │
│   • Установка зависимостей из `software/requirements.txt`                     │
│   • Запуск демона портала на http://127.0.0.1:8787/                           │
├──────────────────────────────────────────────────────────────────────────────┤
│ Phase 3 / Фаза 3: Прошивка прошивки через Web Serial                         │
│   • Перенаправление пользователя на https://tody-agent.github.io/Touch-Pass/web/flasher/ │
│   • Подключение ESP32-S3 SuperMini через Chrome/Edge Web Serial API           │
│   • Инструкции по входу в bootloader при необходимости                       │
├──────────────────────────────────────────────────────────────────────────────┤
│ Phase 4 / Фаза 4: Проверка и регистрация отпечатков                          │
│   • Проверка API статуса демона на http://127.0.0.1:8787/api/status           │
│   • Подтверждение соединения по USB Serial / HID                              │
│   • Руководство по регистрации отпечатка и авто-подтверждению запросов       │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Шаблоны Главных промптов (Master Prompts)

### 🌟 Универсальный Главный промпт установки (Рекомендуется)

Скопируйте и вставьте этот промпт в **Claude Code**, **Cursor**, **Antigravity**, **OpenCode** или **ChatGPT CLI**:

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

### 🟧 Промпт для Claude Code CLI

```text
Set up TouchPass on this machine using Claude Code CLI:
1. Perform Environment Preflight (Phase 1): Check OS type, verify Python 3.11+, and list available USB serial ports.
2. Local Helper Setup (Phase 2): Create software/.venv if missing, run pip install -r software/requirements.txt, and launch the portal daemon in background on http://127.0.0.1:8787/.
3. Direct user to https://tody-agent.github.io/Touch-Pass/web/flasher/ for 1-click Web Serial flashing on Chrome/Edge (Phase 3).
4. Verify daemon health at http://127.0.0.1:8787/api/status and report connection status (Phase 4).
```

---

### 🟦 Промпт для Cursor IDE (Режим Агента)

```text
Set up TouchPass environment in Cursor:
1. Verify Python 3.11+ is active in terminal (Phase 1).
2. Initialize software/.venv, install requirements from software/requirements.txt, and start background server at http://127.0.0.1:8787/ (Phase 2).
3. Prompt user to open https://tody-agent.github.io/Touch-Pass/web/flasher/ to flash ESP32-S3 firmware over Web Serial (Phase 3).
4. Confirm http://127.0.0.1:8787/api/status returns JSON status "ok" (Phase 4).
```

---

### 🟪 Промпт для Antigravity AI Agent

```text
Initialize TouchPass hardware paired helper:
1. Detect host environment (Windows/macOS/Linux) and Python 3.11+ path (Phase 1).
2. Set up virtual environment in software/.venv, install dependencies, and launch daemon on port 8787 (Phase 2).
3. Output Web Flasher link https://tody-agent.github.io/Touch-Pass/web/flasher/ with bootloader instructions (Phase 3).
4. Run health check on http://127.0.0.1:8787/api/status and confirm serial telemetry (Phase 4).
```

---

### 🟩 Промпт для OpenCode Agent

```text
Set up TouchPass automated pair programming helper:
1. Perform preflight checks for Python 3.11+ and USB serial permissions (Phase 1).
2. Build software/.venv environment, install requirements, and execute background daemon software/app.py on http://127.0.0.1:8787/ (Phase 2).
3. Guide user to https://tody-agent.github.io/Touch-Pass/web/flasher/ for browser firmware installation (Phase 3).
4. Test http://127.0.0.1:8787/api/status endpoint to confirm daemon readiness (Phase 4).
```

---

### 🟨 Промпт для ChatGPT CLI

```text
Configure TouchPass daemon and firmware flasher flow via ChatGPT CLI:
1. Verify Python 3.11+ binary environment and serial communication permissions (Phase 1).
2. Create software/.venv, install dependencies from software/requirements.txt, and run portal daemon at http://127.0.0.1:8787/ (Phase 2).
3. Direct user to open https://tody-agent.github.io/Touch-Pass/web/flasher/ for ESP32-S3 Web Serial flashing (Phase 3).
4. Perform API health check on http://127.0.0.1:8787/api/status and prompt user for fingerprint enrollment (Phase 4).
```

---

### 🪟 Промпт для Windows (PowerShell / CMD)

```text
Set up TouchPass on Windows:
1. Verify Python installation using `python --version` or `py -3 --version`.
2. Run `start_touchpass.bat` to create `software\.venv`, install `software\requirements.txt`, and launch `run_portal_win.py` on http://127.0.0.1:8787/.
3. Direct user to https://tody-agent.github.io/Touch-Pass/web/flasher/ for Web Serial firmware flashing.
4. Verify daemon health at http://127.0.0.1:8787/api/status and test USB serial connection.
```

---

### 🍎 Промпт для macOS (Terminal / zsh)

```text
Set up TouchPass on macOS:
1. Check Python version via `python3 --version`.
2. Run `python3 -m venv software/.venv && software/.venv/bin/pip install -r software/requirements.txt`.
3. Launch portal in background: `nohup software/.venv/bin/python software/app.py > touchpass.log 2>&1 &`.
4. Direct user to https://tody-agent.github.io/Touch-Pass/web/flasher/ for Web Serial firmware flashing.
5. Verify status at http://127.0.0.1:8787/api/status and check connected `/dev/cu.usbmodem*` ports.
```

---

### 🐧 Промпт для Linux (Bash / systemd)

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

## ⚡ Однострочные команды инициализации (Bootstrap)

### Windows (PowerShell)
```powershell
powershell -Command "iwr -useb https://raw.githubusercontent.com/tody-agent/Touch-Pass/main/start_touchpass.bat -OutFile start_touchpass.bat; .\start_touchpass.bat"
```

### macOS / Linux (Bash)
```bash
curl -fsSL https://raw.githubusercontent.com/tody-agent/Touch-Pass/main/packaging/install.sh | bash
```

---

## 🛠️ Подробный разбор шагов AI-агента

### Phase 1 / Фаза 1: Предварительная проверка окружения
1. **Определение ОС и Python**: Выполнение `uname -s` или проверка `%OS%`. Проверка Python 3.11+.
2. **Проверка портов**: Проверка доступности порта 8787.
3. **Права доступа к USB**: На Linux проверка группы `dialout`, на Windows проверка COM-портов, на macOS проверка `/dev/cu.usbmodem*`.

### Phase 2 / Фаза 2: Настройка локальной службы
1. **Виртуальное окружение**: Создание `software/.venv`.
2. **Зависимости**: Установка `requirements.txt`.
3. **Запуск демона**: Запуск `run_portal_win.py` или `software/app.py` на порту 8787 (`http://127.0.0.1:8787/`).

### Phase 3 / Фаза 3: Прошивка через Web Serial
1. **Перенаправление**: Открытие страницы [https://tody-agent.github.io/Touch-Pass/web/flasher/](https://tody-agent.github.io/Touch-Pass/web/flasher/) в Chrome/Edge.
2. **Инструкции по входу в Bootloader**: Удержание BOOT, сброс RESET, отпускание BOOT.

### Phase 4 / Фаза 4: Проверка и регистрация
1. **Проверка работоспособности**: Запрос `http://127.0.0.1:8787/api/status`.
2. **Открытие веб-портала**: Переход на `http://127.0.0.1:8787/` для регистрации пальцев.
