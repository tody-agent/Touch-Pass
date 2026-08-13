import { ESPLoader, Transport } from "./vendor/esptool-js.js";

const i18n = {
  en: {
    navWebSerial: "Web Serial Flasher",
    heroBadge: "AI HARDWARE CONFIRMATION PORTAL",
    heroTitle: "TouchPass — Give every finger a superpower.",
    heroSubtitle: "1-Click Hardware Web Flasher & Setup Portal for AI Developers & Non-Tech Users.",
    howItWorks: "How TouchPass Works",
    featureDesc: "A single touch on your fingerprint hardware sends native USB HID keystrokes (y + Enter) instantly to confirm AI agent actions across your favorite development environments.",
    diagramStep1Title: "Touch Sensor",
    diagramStep1Desc: "Biometric scan via ZW111 / ZW101 sensor on ESP32-S3",
    diagramStep2Title: "Hardware USB HID",
    diagramStep2Desc: "Emulates physical keyboard without driver installation",
    diagramStep3Title: "Auto Confirmation",
    diagramStep3Desc: "Sends y + Enter to grant AI execution",
    flasherTitle: "1-Click Hardware Web Flasher",
    tagBrowserNative: "Browser Native",
    step1Title: "Connect USB Cable",
    step1Desc: "Plug your ESP32-S3 board into your computer with a USB data cable.",
    step2Title: "Choose Serial Port",
    step2Desc: "Click below and select your board from the browser serial prompt.",
    step3Title: "Automatic Flashing",
    step3Desc: "Firmware is flashed securely in seconds over WebSerial.",
    messageReady: "Ready. Nothing is written until you approve a serial port.",
    flashButton: "Connect & Flash Firmware",
    browserNote: "Open this page in Google Chrome, Microsoft Edge, or Brave.",
    compatBoards: "Compatible Boards",
    connIssues: "Board Not Found / Connection Issues?",
    connIssuesDesc: "Hold BOOT button, tap RESET, then release BOOT button and try again.",
    downloadsTitle: "Desktop Companion Downloads",
    downloadsDesc: "Download optional desktop tools and background daemons for advanced keybinding management and continuous monitoring.",
    downloadWinBtn1: "Download start_touchpass.bat",
    downloadWinBtn2: "Download TouchPass.exe",
    downloadMacBtn: "Download install.sh",
    promptTitle: "AI Agent 1-Prompt Setup",
    promptTag: "Automated Setup",
    promptDesc: "Copy this prompt into your AI coding assistant (Claude Code, Cursor, Antigravity, OpenCode) to automatically set up TouchPass on your machine.",
    promptText: "Set up TouchPass on this system: install the daemon/CLI, register auto-start, verify USB HID keybinding for 'y'+'Enter' confirmation, and test hardware connection.",
    copyPrompt: "Copy Prompt",
    copied: "Copied!",
    techLog: "Technical Flashing Log",
    noActivity: "No device activity yet.",
    footerText: "TouchPass · Local USB HID Security & AI Workflow Acceleration · No cloud data uploaded",
    errNoBoard: "No board was selected. Nothing was flashed.",
    errCouldNotConnect: "Could not connect to ESP32-S3. Hold BOOT button, tap RESET button, release BOOT button, then try again.",
    errBusy: "Serial port is busy. Please close other serial monitor/flashing tools.",
    errNotEsp32: "Connected board is not an ESP32-S3.",
    flashConnecting: "Choose the ESP32-S3 serial port in the browser window.",
    flashConnectingBoard: "Connecting to ESP32-S3…",
    stageConnecting: "Connecting",
    stageChecking: "Checking firmware",
    stageWriting: "Writing firmware",
    stageFinished: "Finished",
    flashComplete: "Flash complete! Unplug your board and reconnect it to use TouchPass USB HID.",
    flashAnother: "Flash another board",
  },
  vi: {
    navWebSerial: "Web Serial Flasher",
    heroBadge: "CỔNG NẠP FIRMWARE XÁC THỰC AI HARDWARE",
    heroTitle: "TouchPass — Nạp siêu năng lực cho từng ngón tay.",
    heroSubtitle: "Cổng Nạp Web Flasher 1-Click & Cài đặt tự động cho AI Developers & Người dùng Non-Tech.",
    howItWorks: "Cách TouchPass Hoạt Động",
    featureDesc: "Một cú chạm vân tay gửi phím USB HID nguyên bản (y + Enter) tức thì để xác nhận thực thi lệnh cho các AI Agent trên môi trường lập trình của bạn.",
    diagramStep1Title: "Cảm biến Vân tay",
    diagramStep1Desc: "Quét sinh trắc học qua cảm biến ZW111 / ZW101 trên ESP32-S3",
    diagramStep2Title: "Hardware USB HID",
    diagramStep2Desc: "Mô phỏng bàn phím phần cứng không cần cài driver",
    diagramStep3Title: "Xác nhận Tự động",
    diagramStep3Desc: "Gửi phím y + Enter để cấp quyền thực thi cho AI",
    flasherTitle: "Trình Nạp Firmware Web 1-Click",
    tagBrowserNative: "Trình duyệt Nguyên bản",
    step1Title: "Cắm cáp USB",
    step1Desc: "Cắm mạch ESP32-S3 vào máy tính bằng cáp truyền dữ liệu USB.",
    step2Title: "Chọn cổng Serial",
    step2Desc: "Bấm nút bên dưới và chọn mạch của bạn trong hộp thoại trình duyệt.",
    step3Title: "Nạp Firmware Tự động",
    step3Desc: "Firmware được nạp an toàn chỉ trong vài giây qua WebSerial.",
    messageReady: "Sẵn sàng. Chưa có dữ liệu nào được ghi cho đến khi bạn chọn cổng Serial.",
    flashButton: "Kết nối & Nạp Firmware",
    browserNote: "Mở trang này bằng Google Chrome, Microsoft Edge hoặc Brave.",
    compatBoards: "Mạch tương thích",
    connIssues: "Không tìm thấy mạch / Lỗi kết nối?",
    connIssuesDesc: "Giữ nút BOOT, bấm nhả nút RESET, sau đó thả nút BOOT và thử lại.",
    downloadsTitle: "Tải Phần mềm Máy tính",
    downloadsDesc: "Tải các công cụ máy tính và daemon chạy ngầm để quản lý phím tắt nâng cao và giám sát liên tục.",
    downloadWinBtn1: "Tải start_touchpass.bat",
    downloadWinBtn2: "Tải TouchPass.exe",
    downloadMacBtn: "Tải install.sh",
    promptTitle: "1-Prompt Tự động cho AI Agent",
    promptTag: "Cài đặt Tự động",
    promptDesc: "Copy đoạn prompt này dán vào AI Agent của bạn (Claude Code, Cursor, Antigravity, OpenCode) để tự động cài đặt TouchPass trên máy tính.",
    promptText: "Cài đặt TouchPass trên máy tính này: cài đặt daemon/CLI, đăng ký tự khởi chạy, xác minh phím tắt USB HID 'y'+'Enter', và kiểm tra kết nối phần cứng.",
    copyPrompt: "Sao chép Prompt",
    copied: "Đã sao chép!",
    techLog: "Nhật ký Kỹ thuật Nạp Chip",
    noActivity: "Chưa có hoạt động thiết bị.",
    footerText: "TouchPass · Bảo mật USB HID Local & Tăng tốc Workflow AI · Không tải dữ liệu lên cloud",
    errNoBoard: "Chưa chọn mạch nào. Chưa có thay đổi.",
    errCouldNotConnect: "Không thể kết nối ESP32-S3. Giữ nút BOOT, bấm nhả RESET, thả BOOT và thử lại.",
    errBusy: "Cổng Serial đang bận. Vui lòng đóng các phần mềm Serial khác.",
    errNotEsp32: "Mạch được kết nối không phải là ESP32-S3.",
    flashConnecting: "Vui lòng chọn cổng Serial ESP32-S3 trong cửa sổ trình duyệt.",
    flashConnectingBoard: "Đang kết nối ESP32-S3…",
    stageConnecting: "Đang kết nối",
    stageChecking: "Kiểm tra firmware",
    stageWriting: "Đang nạp firmware",
    stageFinished: "Hoàn tất",
    flashComplete: "Nạp hoàn tất! Rút cáp và cắm lại để sử dụng TouchPass USB HID.",
    flashAnother: "Nạp mạch khác",
  },
  zh: {
    navWebSerial: "Web Serial 刷机工具",
    heroBadge: "AI 硬件确认门户",
    heroTitle: "TouchPass — 赋予每根手指超级能力。",
    heroSubtitle: "面向 AI 开发者和非技术人员的 1 键硬件 Web 刷机与一键配置门户。",
    howItWorks: "TouchPass 工作原理",
    featureDesc: "只需要轻触指纹硬件，即可即时发送原生 USB HID 按键（y + Enter），在您喜爱的开发环境中确认 AI Agent 的操作。",
    diagramStep1Title: "指纹传感器",
    diagramStep1Desc: "通过 ESP32-S3 上的 ZW111 / ZW101 传感器进行生物识别",
    diagramStep2Title: "硬件 USB HID",
    diagramStep2Desc: "模拟物理键盘，无需安装任何驱动程序",
    diagramStep3Title: "自动确认",
    diagramStep3Desc: "发送 y + Enter 以授权 AI 执行操作",
    flasherTitle: "1 键网页硬件刷机工具",
    tagBrowserNative: "浏览器原生",
    step1Title: "连接 USB 线缆",
    step1Desc: "使用 USB 数据线将 ESP32-S3 开发板连接至计算机。",
    step2Title: "选择串口",
    step2Desc: "点击下方按钮，并在浏览器串口弹窗中选择您的开发板。",
    step3Title: "自动烧录",
    step3Desc: "固件通过 WebSerial 在几秒钟内安全完成烧录。",
    messageReady: "就绪。在您允许串口连接前，不会写入任何数据。",
    flashButton: "连接并烧录固件",
    browserNote: "请使用 Google Chrome、Microsoft Edge 或 Brave 打开此页面。",
    compatBoards: "兼容开发板",
    connIssues: "未找到开发板 / 连接错误？",
    connIssuesDesc: "按住 BOOT 按钮，点按 RESET，然后松开 BOOT 按钮重试。",
    downloadsTitle: "桌面客户端下载",
    downloadsDesc: "下载可选的桌面工具和后台服务，以进行高级按键绑定管理和持续监控。",
    downloadWinBtn1: "下载 start_touchpass.bat",
    downloadWinBtn2: "下载 TouchPass.exe",
    downloadMacBtn: "下载 install.sh",
    promptTitle: "AI Agent 1-Prompt 自动配置",
    promptTag: "全自动配置",
    promptDesc: "复制此提示词并粘贴到您的 AI 编程助手（Claude Code、Cursor、Antigravity、OpenCode）中，即可在您的电脑上自动配置 TouchPass。",
    promptText: "在本机配置 TouchPass：安装后台服务/CLI，注册开机自启，验证 'y'+'Enter' 确认按键，并测试硬件连接。",
    copyPrompt: "复制提示词",
    copied: "已复制！",
    techLog: "刷机技术日志",
    noActivity: "暂无设备活动。",
    footerText: "TouchPass · 本地 USB HID 安全与 AI 工作流加速 · 无云端数据上传",
    errNoBoard: "未选择开发板。未进行任何烧录。",
    errCouldNotConnect: "无法连接到 ESP32-S3。请按住 BOOT 按钮，按一下 RESET，松开 BOOT 按钮后再试。",
    errBusy: "串口被占用。请关闭其他串口监视器或刷机工具。",
    errNotEsp32: "连接的开发板不是 ESP32-S3。",
    flashConnecting: "请在浏览器弹窗中选择 ESP32-S3 串口。",
    flashConnectingBoard: "正在连接 ESP32-S3…",
    stageConnecting: "正在连接",
    stageChecking: "检查固件",
    stageWriting: "正在烧录固件",
    stageFinished: "完成",
    flashComplete: "烧录完成！请拔下开发板并重新连接以使用 TouchPass USB HID。",
    flashAnother: "烧录另一块开发板",
  },
  ru: {
    navWebSerial: "Web Serial Прошивальщик",
    heroBadge: "ПОРТАЛ ПОДТВЕРЖДЕНИЯ ДЛЯ AI АППАРАТУРЫ",
    heroTitle: "TouchPass — Сверхспособность для каждого пальца.",
    heroSubtitle: "Веб-прошивальщик в 1 клик и портал настройки для разработчиков ИИ и пользователей.",
    howItWorks: "Как работает TouchPass",
    featureDesc: "Одно касание сканера отпечатков мгновенно отправляет нажатия клавиш USB HID (y + Enter) для подтверждения действий ИИ-агента в вашей среде разработки.",
    diagramStep1Title: "Сканер отпечатков",
    diagramStep1Desc: "Биометрическое сканирование ZW111 / ZW101 на ESP32-S3",
    diagramStep2Title: "Аппаратный USB HID",
    diagramStep2Desc: "Эмулирует физическую клавиатуру без установки драйверов",
    diagramStep3Title: "Авто-подтверждение",
    diagramStep3Desc: "Отправляет y + Enter для разрешения выполнения ИИ",
    flasherTitle: "Веб-прошивальщик в 1 клик",
    tagBrowserNative: "Нативно в браузере",
    step1Title: "Подключите USB-кабель",
    step1Desc: "Подключите плату ESP32-S3 к компьютеру через USB-кабель данных.",
    step2Title: "Выберите COM-порт",
    step2Desc: "Нажмите кнопку ниже и выберите плату в окне браузера.",
    step3Title: "Автоматическая прошивка",
    step3Desc: "Прошивка безопасно записывается за несколько секунд через WebSerial.",
    messageReady: "Готово. Запись не начнется, пока вы не выберете COM-порт.",
    flashButton: "Подключить и прошить",
    browserNote: "Откройте эту страницу в Google Chrome, Microsoft Edge или Brave.",
    compatBoards: "Совместимые платы",
    connIssues: "Плата не найдена / Ошибка подключения?",
    connIssuesDesc: "Зажмите кнопку BOOT, нажмите RESET, затем отпустите BOOT и попробуйте снова.",
    downloadsTitle: "Загрузка ПО для ПК",
    downloadsDesc: "Загрузите утилиты для ПК и фоновые службы для управления сочетаниями клавиш.",
    downloadWinBtn1: "Скачать start_touchpass.bat",
    downloadWinBtn2: "Скачать TouchPass.exe",
    downloadMacBtn: "Скачать install.sh",
    promptTitle: "1-Prompt Настройка для ИИ-Агента",
    promptTag: "Авто-настройка",
    promptDesc: "Скопируйте этот промпт в ваш ИИ-ассистент (Claude Code, Cursor, Antigravity, OpenCode) для автоматической настройки TouchPass.",
    promptText: "Настрой TouchPass на этой системе: установи демона/CLI, добавь в автозапуск, проверь сочетание клавиш 'y'+'Enter' и проверь подключение.",
    copyPrompt: "Скопировать промпт",
    copied: "Скопировано!",
    techLog: "Технический журнал прошивки",
    noActivity: "Активность устройств отсутствует.",
    footerText: "TouchPass · Локальная безопасность USB HID и ускорение ИИ-процессов · Без загрузки в облако",
    errNoBoard: "Плата не выбрана. Запись не производилась.",
    errCouldNotConnect: "Не удалось подключиться к ESP32-S3. Зажмите BOOT, нажмите RESET, отпустите BOOT и повторите.",
    errBusy: "COM-порт занят. Закройте другие утилиты работы с COM-портом.",
    errNotEsp32: "Подключенная плата не является ESP32-S3.",
    flashConnecting: "Выберите COM-порт ESP32-S3 в окне браузера.",
    flashConnectingBoard: "Подключение к ESP32-S3…",
    stageConnecting: "Подключение",
    stageChecking: "Проверка прошивки",
    stageWriting: "Запись прошивки",
    stageFinished: "Завершено",
    flashComplete: "Прошивка завершена! Переподключите плату для использования TouchPass USB HID.",
    flashAnother: "Прошить другую плату",
  }
};

let currentLang = "en";

function getDict() {
  return i18n[currentLang] || i18n.en;
}

function setLanguage(lang) {
  if (!i18n[lang]) lang = "en";
  currentLang = lang;
  localStorage.setItem("touchpass_lang", lang);
  
  const dict = i18n[lang];
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) {
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.value = dict[key];
      } else {
        el.textContent = dict[key];
      }
    }
  });

  const langSelect = document.querySelector("#lang-select");
  if (langSelect && langSelect.value !== lang) {
    langSelect.value = lang;
  }
}

const images = [
  ["Bootloader", "./firmware/bootloader.bin", 0x0, "e0d0bd59a704ca41492582cd997fac0a9e4eb3fd7efbc1583a4658842905c978"],
  ["Partition table", "./firmware/partition-table.bin", 0x8000, "7f00b6c042a89b15b0cac534f82ed988caf29278ff5700b0c511eb1b5bb7c820"],
  ["Unified firmware", "./firmware/tiny_touch_smartcard.bin", 0x10000, "a0b8b92833f12bc6cd5ae71a550a634eeaf4fe49159f061cc8eef16bb317dc2f"],
];
const totalBytes = 413904;
const button = document.querySelector("#flash");
const message = document.querySelector("#message");
const browserNote = document.querySelector("#browser-note");
const progressWrap = document.querySelector("#progress-wrap");
const progress = document.querySelector("#progress");
const percent = document.querySelector("#percent");
const stage = document.querySelector("#stage");
const log = document.querySelector("#log");

if (!("serial" in navigator)) {
  button.disabled = true;
  browserNote.textContent = getDict().browserNote;
}

function writeLog(value) {
  const line = value.trim();
  if (!line) return;
  const noAct = getDict().noActivity;
  log.textContent = (log.textContent === "No device activity yet." || log.textContent === noAct) ? line : `${log.textContent}\n${line}`;
  log.scrollTop = log.scrollHeight;
}

function show(text, kind = "") {
  message.textContent = text;
  message.className = `message ${kind}`.trim();
}

async function sha256(data) {
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function loadFirmware() {
  const loaded = [];
  for (const [name, url, address, expected] of images) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`${name} could not be downloaded.`);
    const buffer = await response.arrayBuffer();
    if (await sha256(buffer) !== expected) throw new Error(`${name} failed its integrity check.`);
    loaded.push({ data: new Uint8Array(buffer), address });
  }
  return loaded;
}

function friendlyError(error) {
  const text = error instanceof Error ? error.message : String(error);
  const dict = getDict();
  if (/not an ESP32-S3|not ESP32-S3/i.test(text)) {
    return dict.errNotEsp32;
  }
  if (/notfound|no port selected|chooser|cancel/i.test(text)) {
    return dict.errNoBoard;
  }
  if (/already open|busy|networkerror|in use|invalidstate/i.test(text)) {
    return dict.errBusy;
  }
  if (/connect|serial data|timeout|sync/i.test(text)) {
    return dict.errCouldNotConnect;
  }
  return text || dict.errCouldNotConnect;
}

button.addEventListener("click", async () => {
  let transport;
  const dict = getDict();
  button.disabled = true;
  progressWrap.hidden = false;
  progress.value = 0;
  percent.textContent = "0%";
  stage.textContent = dict.stageConnecting;
  log.textContent = dict.noActivity;
  show(dict.flashConnecting);
  try {
    const port = await navigator.serial.requestPort();
    transport = new Transport(port, false);
    const terminal = { clean(){ log.textContent = ""; }, write: writeLog, writeLine: writeLog };
    const loader = new ESPLoader({ transport, baudrate: 460800, terminal, debugLogging: false });
    show(dict.flashConnectingBoard);
    const chip = await loader.main();
    if (!/ESP32-S3/i.test(chip)) throw new Error("Connected board is not an ESP32-S3.");

    stage.textContent = dict.stageChecking;
    const fileArray = await loadFirmware();
    stage.textContent = dict.stageWriting;
    const written = [0, 0, 0];
    await loader.writeFlash({
      fileArray,
      flashMode: "dio",
      flashFreq: "80m",
      flashSize: "4MB",
      eraseAll: false,
      compress: true,
      reportProgress(index, amount) {
        written[index] = amount;
        const value = Math.min(100, Math.round(written.reduce((sum, item) => sum + item, 0) / totalBytes * 100));
        progress.value = value;
        percent.textContent = `${value}%`;
      },
    });
    progress.value = 100;
    percent.textContent = "100%";
    stage.textContent = dict.stageFinished;
    await loader.after("hard_reset");
    await transport.disconnect();
    transport = undefined;
    show(dict.flashComplete, "success");
    button.textContent = dict.flashAnother;
  } catch (error) {
    show(friendlyError(error), "error");
    try { await transport?.disconnect(); } catch {}
  } finally {
    button.disabled = false;
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const langSelect = document.querySelector("#lang-select");
  if (langSelect) {
    langSelect.addEventListener("change", (e) => {
      setLanguage(e.target.value);
    });
  }

  // Detect initial language
  const savedLang = localStorage.getItem("touchpass_lang");
  if (savedLang && i18n[savedLang]) {
    setLanguage(savedLang);
  } else {
    const userLang = (navigator.language || navigator.userLanguage || "en").toLowerCase();
    if (userLang.startsWith("vi")) setLanguage("vi");
    else if (userLang.startsWith("zh")) setLanguage("zh");
    else if (userLang.startsWith("ru")) setLanguage("ru");
    else setLanguage("en");
  }

  // Copy prompt button listener
  const copyBtn = document.querySelector("#ai-prompt-copy");
  const promptText = document.querySelector("#ai-prompt-text");
  
  if (copyBtn && promptText) {
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(promptText.textContent.trim());
        const dict = getDict();
        const origHTML = copyBtn.innerHTML;
        copyBtn.classList.add("copied");
        copyBtn.innerHTML = `<span class="copy-icon">✅</span><span class="copy-text">${dict.copied}</span>`;
        setTimeout(() => {
          copyBtn.classList.remove("copied");
          copyBtn.innerHTML = origHTML;
        }, 2000);
      } catch (err) {
        console.error("Failed to copy text: ", err);
      }
    });
  }
});
