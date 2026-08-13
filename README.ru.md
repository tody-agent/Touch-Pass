<div align="center">

# 🖐️ TouchPass

### *Дайте каждому пальцу суперспособность.*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Hardware](https://img.shields.io/badge/Hardware-ESP32--S3-orange.svg)](docs/BUILD_GUIDE.ru.md)
[![Download Executable](https://img.shields.io/badge/📥_Скачать-TouchPass.exe_(Windows)-blueviolet.svg)](https://github.com/tody-agent/Touch-Pass/releases/download/v2.0.0/TouchPass.exe)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg)](https://python.org)
[![Web Flasher](https://img.shields.io/badge/🌐_1--Click-Web_Flasher-success.svg)](https://tody-agent.github.io/Touch-Pass/web/flasher/)
[![AI Setup](https://img.shields.io/badge/🤖_1--Prompt-AI_Agent_Setup-purple.svg)](docs/AI_AGENT_PROMPT.ru.md)
[![Release](https://img.shields.io/badge/Release-v2.0.0-brightgreen.svg)](https://github.com/tody-agent/Touch-Pass/releases/tag/v2.0.0)

[🌐 **English**](README.md) | [🇻🇳 **Tiếng Việt**](README.vi.md) | [🇨🇳 **简体中文**](README.zh.md) | 🇷🇺 **Русский** | [📥 **Скачать TouchPass.exe**](https://github.com/tody-agent/Touch-Pass/releases/download/v2.0.0/TouchPass.exe) | [🌐 **1-Click Web-прошивка**](https://tody-agent.github.io/Touch-Pass/web/flasher/) | [🤖 **1-Prompt AI Agent Настройка (RU)**](docs/AI_AGENT_PROMPT.ru.md)

<br />

![TouchPass Hero](assets/demo/02-mac-mini-claude-accept-v2.png)

> **Принцип работы:** Когда в вашем терминале появляется запрос на подтверждение действия, коснитесь зарегистрированным пальцем. TouchPass отправляет событие клавиши `y` и нажатие Enter непосредственно в активное поле ввода. Примечание: TouchPass передаёт стандартные нажатия клавиш USB HID клавиатуры в сфокусированное окно; он не может кликать по кнопкам графического интерфейса (GUI).

</div>

---

## ⚡ Проблема vs. Решение: Разработано для AI-разработчиков

### 🔴 Проблема: Микро-отвлечения разрушают состояние глубокого погружения
При парном программировании с AI-агентами в CLI и IDE (**Claude Code**, **Cursor**, **Antigravity**, **OpenCode**) ваш рабочий процесс постоянно прерывается запросами на подтверждение:
> *"Разрешить выполнение `git status`? (y/n)"* или *`Требуется пароль Sudo`*.

Переключение контекста, сдвиг рук с клавиатуры, ввод `y` + `Enter` или ввод 20-значного пароля каждые 30 секунд разрушают состояние потока и тратят ценное время разработчика.

### 🟢 Решение: Физическое оборудование и биометрическая скорость
**TouchPass** превращает биометрическое касание в физические нажатия клавиш клавиатуры. Устройство создано на базе микроконтроллера **ESP32-S3 Super Mini** и оптического сканера отпечатков пальцев **ZW101**. TouchPass позволяет назначить персональную суперспособность каждому пальцу:

- ☝️ **Указательный палец**: Мгновенно подтверждает запросы AI в терминале (ввод `y` и нажатие Enter).
- 🖕 **Средний палец**: Безопасно извлекает и вводит ваши учетные данные `sudo` / SSH из системного хранилища паролей ОС.
- 🖐️ **Безымянный палец**: Запускает многошаговые макросы горячих клавиш (`Enter`, `Escape`, `Cmd+K`, пользовательские последовательности клавиш).

---

## 🎯 Матрица функций

| Функция | Возможности и архитектура | Преимущества для AI-разработчиков |
| :--- | :--- | :--- |
| 🌐 **Web Serial Flasher** | Прошивка через Web Serial API (`esptool-js`) прямо в Chrome/Edge | Прошивка без установки сторонних программ прямо из браузера с проверкой SHA-256 |
| 🤖 **1-Prompt AI Agent Настройка** | Готовый шаблон промпта для **Claude Code**, **Cursor**, **Antigravity**, **OpenCode** | Автоматическое определение ОС, создание venv, запуск демона и проверка железа за 1 промпт |
| 🔌 **Аппаратная USB HID клавиатура** | Эмуляция стандартной физической USB-клавиатуры на уровне ESP32-S3 | Работает без драйверов на Windows, macOS и Linux; отправляет нажатия в **активное сфокусированное** окно |
| 🖐️ **10 слотов отпечатков** | Оптический биометрический датчик ZW101 (слоты 01–10) с локальным сравнением на чипе | Нулевая зависимость от облака; назначение уникальных макросов или паролей на каждый палец |
| ⌨️ **Интерактивный рекордер сочетаний** | Веб-портал (`http://127.0.0.1:8787/`) с записью клавиш в реальном времени | Настройка последовательностей одиночных клавиш `key`, текста `text`, задержек `delay` (мс), `enter` или `escape` за секунды |
| 🚀 **Запуск в 1 клик** | Автоматический скрипт для Windows (`start_touchpass.bat`) и POSIX (`packaging/install.sh`) | Бесшовный запуск локального Flask-сервиса и фонового демона последовательного порта |

---

## 🏗️ Архитектура и поток данных

```text
┌─────────────────────────┐
│   Биометрический датчик │  Касание отпечатка (ZW101)
│  (10 зарегистрированных │
│        слотов)          │
└───────────┬─────────────┘
            │ Локальное сравнение на чипе (ID 01-10)
            ▼
┌─────────────────────────┐
│   Аппаратура ESP32-S3   │   HMAC-SHA256 Запрос-Ответ / UART Serial
│  (Стек USB HID Клавиатуры)◄═════════════════════════════════════════► ┌─────────────────────────┐
└───────────┬─────────────┘                                              │ Движок TouchPass Portal │
            │ Нажатие клавиши USB HID                                    │  (Python Flask / Web UI)│
            ▼                                                            └───────────┬─────────────┘
┌─────────────────────────┐                                                          │ Безопасный запрос пароля
│   Активное окно ПК      │  Ввод 'y' + Enter / Пароли / Горячие клавиши             ▼
│ (Claude Code, Терминал) │ ◄───────────────────────────────────────────────── ┌─────────────────────────┐
└─────────────────────────┘                                                    │  Хранилище паролей ОС   │
                                                                               │(Win Credential/Keychain)│
                                                                               └─────────────────────────┘
```

---

## 🚀 Руководство по быстрому старту

### 🌐 Веб-прошивка в браузере (Без установки ПО)
Прошейте прошивку ESP32-S3 в 1 клик на [🌐 **tody-agent.github.io/Touch-Pass/web/flasher/**](https://tody-agent.github.io/Touch-Pass/web/flasher/).

### 🤖 1-Prompt AI Agent Настройка
Передайте стандартный промпт вашему AI-ассистенту. См. [🤖 **1-Prompt AI Agent Интеграция**](docs/AI_AGENT_PROMPT.ru.md) | [🌐 **English**](docs/AI_AGENT_PROMPT.md) | [🇻🇳 **Tiếng Việt**](docs/AI_AGENT_PROMPT.vi.md).

### Windows
1. Скачайте **[TouchPass.exe](https://github.com/tody-agent/Touch-Pass/releases/download/v2.0.0/TouchPass.exe)** или клонируйте репозиторий:
   ```cmd
   git clone https://github.com/tody-agent/Touch-Pass.git
   cd Touch-Pass
   ```
2. Запустите **`TouchPass.exe`** или выполните **`start_touchpass.bat`**:
   ```cmd
   .\start_touchpass.bat
   ```
3. Откройте `http://127.0.0.1:8787/` в браузере для работы с веб-порталом.

### macOS / Linux
1. Выполните команду установки в терминале:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/tody-agent/Touch-Pass/main/packaging/install.sh | bash
   ```
2. Откройте `http://127.0.0.1:8787/` в браузере.

---

## 🎬 Главные возможности и визуальная демонстрация

![Обзор функций TouchPass](assets/demo/04-features.png)

- **Интерактивный мастер из 4 шагов**: Настройка и запуск за 5 минут благодаря автоматическому определению порта и проверке оборудования.
- **Защита двойным касанием (Double-Touch Guard)**: Действия без паролей требуют повторного касания того же пальца в течение 3 секунд для защиты от случайных нажатий.
- **Локальная конфиденциальность без облака**: Пароли при передаче по последовательному порту шифруются с использованием HMAC-SHA256 и AES-CTR, а хранение защищено системным хранилищем ОС (Диспетчер учетных данных Windows / Связка ключей macOS Keychain).

---

## 📖 Подробные руководства и документация

- 🤖 **[1-Prompt AI Agent Руководство по интеграции](docs/AI_AGENT_PROMPT.ru.md)** | **[🌐 English Version](docs/AI_AGENT_PROMPT.md)** | **[🇻🇳 Bản Tiếng Việt](docs/AI_AGENT_PROMPT.vi.md)** | **[🇨🇳 简体中文](docs/AI_AGENT_PROMPT.zh.md)**
  *Автоматическая настройка за 1 промпт для Claude Code, Cursor, Antigravity, OpenCode и ChatGPT CLI на Windows, macOS и Linux.*

- 🛠️ **[Руководство по сборке и подключению](docs/BUILD_GUIDE.ru.md)** | **[🌐 English Version](docs/BUILD_GUIDE.md)** | **[🇻🇳 Bản Tiếng Việt](docs/BUILD_GUIDE.vi.md)** | **[🇨🇳 简体中文](docs/BUILD_GUIDE.zh.md)**
  *Схема распиновки ESP32-S3 Super Mini и ZW101, сборка корпуса, компиляция через `arduino-cli`, модель безопасности UART и запуск в 1 клик на Windows.*

- 📖 **[Руководство пользователя и пресеты AI](docs/USER_GUIDE.ru.md)** | **[🌐 English Version](docs/USER_GUIDE.md)** | **[🇻🇳 Bản Tiếng Việt](docs/USER_GUIDE.vi.md)** | **[🇨🇳 简体中文](docs/USER_GUIDE.zh.md)**
  *Регистрация отпечатков пальцев, интерактивный рекордер горячих клавиш, правила защиты двойным касанием, хранение паролей в ОС и устранение неполадок.*

---

## 🙏 Благодарности и лицензия

TouchPass — это программное обеспечение с открытым исходным кодом, распространяемое по **[Лицензии MIT](LICENSE)**.

Особая благодарность **[Zimeng Xiong](https://github.com/ZimengXiong)** (создателю оригинального проекта **[TinyTouch](https://github.com/ZimengXiong/TinyTouch)**), чья архитектура открытого биометрического USB-устройства сделала TouchPass возможным. Проект создан с ❤️ на базе исходного кода ZimengXiong/TinyTouch.

---

## 🛡️ Политика безопасности и юридический дисклеймер / Security Policy & Legal Disclaimer

Программное обеспечение TouchPass предоставляется на условиях **"КАК ЕСТЬ" ("AS IS")**, без каких-либо явных или подразумеваемых гарантий. Пользователи берут на себя полную ответственность за физическую сборку оборудования, проверку схем подключения, соблюдение уровней напряжения (безопасность 3.3 В и 5 В), калибровку оптического биометрического датчика и обеспечение физической безопасности устройства. TouchPass напрямую интегрируется с защищенными хранилищами учетных данных ОС (Диспетчер учетных данных Windows / Связка ключей macOS Keychain / Linux Secret Service) и взаимодействует через Serial UART с использованием протокола авторизации "запрос-ответ" на основе HMAC-SHA256.

TouchPass is provided **"AS IS"**, without warranty of any kind, express or implied. Users assume full responsibility for physical hardware assembly, wiring diagram verification, voltage levels (3.3V vs 5V safety), optical biometric sensor calibration, and maintaining physical device security.

TouchPass được cung cấp **"NGUYÊN TRẠNG" (AS IS)** và không có bất kỳ bảo hành nào. Người dùng tự chịu toàn bộ trách nhiệm đối với việc lắp ráp phần cứng vật lý, kiểm tra sơ đồ đấu nối dây, an toàn điện áp, hiệu chuẩn cảm biến vân tay quang học и bảo đảm an toàn truy cập vật lý cho thiết bị.

Подробные сведения об архитектуре безопасности, поддерживаемых версиях, процедуре сообщения об уязвимостях и полный текст юридического дисклеймера см. в нашей **[Политике безопасности (SECURITY.ru.md)](SECURITY.ru.md)** | **[SECURITY.md](SECURITY.md)** | **[SECURITY.vi.md](SECURITY.vi.md)** | **[SECURITY.zh.md](SECURITY.zh.md)**.
