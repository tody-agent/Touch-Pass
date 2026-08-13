/**
 * TouchPass Portal - Core Application, i18n Engine, 4-Step Flow & Robust Error Handling
 * Version: 2.1 (Error Handling & Fallback UI Upgrade)
 */

// 1. TRANSLATIONS DICTIONARY
const TRANSLATIONS = {
  en: {
    brandTitle: "TouchPass Portal",
    eyebrow: "ESP32-S3 · ZW101",
    statusConnected: "Connected",
    statusDisconnected: "Disconnected",
    step1Title: "🚀 1. Setup & Flash",
    step2Title: "📋 2. Presets",
    step3Title: "🖐️ 3. Biometric Studio",
    step4Title: "⚡ 4. Live Activity",
    step1Header: "1. Hardware & Device Initialization",
    step1Desc: "Connect ESP32-S3 microcontroller to ZW101 sensor, flash firmware via Web Flasher, and test USB HID keystrokes.",
    connStatusCardTitle: "Hardware Connection Status",
    webFlasherCardTitle: "Web Flasher Firmware",
    webFlasherCardDesc: "Flash or update ESP32-S3 firmware directly in Chrome/Edge via Web Serial API.",
    webFlasherBtn: "⚡ Open Web Flasher",
    hidSandboxTitle: "USB HID Keystroke Sandbox",
    hidSandboxDesc: "Focus the text box below and click Test Keystroke to verify hardware keyboard emulation.",
    hidTestPlaceholder: "Test keystroke input here...",
    hidTestBtn: "Test USB HID Keystroke",
    wiringTitle: "ZW101 Hardware Wiring Diagram",
    step2Header: "2. macOS AI Dev Presets",
    step2Desc: "Select shortcut presets optimized for AI development workflows (Claude Code, Cursor, Antigravity, Sudo Vault).",
    presetPreviewTitle: "Slot Allocation Preview",
    applyPresetBtn: "✦ Apply Preset",
    step3Header: "3. Biometric Studio",
    step3Desc: "10-Finger map corresponding to 10 biometric slots. Enroll new fingerprints or customize actions.",
    refreshBtn: "Refresh",
    leftHandTitle: "Left Hand (Slots 1–5)",
    rightHandTitle: "Right Hand (Slots 6–10)",
    step4Header: "4. Live Activity Console",
    step4Desc: "Monitor real-time activity logs from ESP32-S3 hardware and macOS Helper Service.",
    filterAll: "All",
    filterBiometric: "Biometric",
    filterSystem: "System",
    filterError: "Errors",
    pingTestBtn: "Ping Test",
    clearLogsBtn: "Clear Logs",
    exportLogsBtn: "Export Logs",
    enrollModalTitle: "ZW101 Fingerprint Enrollment",
    enrollPrompt: "Place finger on ZW101 sensor...",
    cancelEnrollBtn: "Cancel",
    editModalTitle: "Fingerprint Slot Settings",
    editLabelField: "Finger Name / Label",
    editPresetField: "Action Preset",
    editSecretField: "Secure Password Secret",
    editSecretHint: "Stored securely in macOS Keychain. Leave blank to keep existing.",
    editConfirmLabel: "Confirm Touch (Double touch protection)",
    cancelEditBtn: "Cancel",
    saveSlotBtn: "Save Settings",

    // Action Presets
    presetPassword: "Password + Enter",
    presetAccept: "Accept · Y + Enter",
    presetEnter: "Enter Key",
    presetEscape: "Escape Key",
    presetCustom: "Custom Macro Sequence",

    // Gallery Presets
    presetAIDevName: "🤖 AI Developer",
    presetAIDevDesc: "Shortcuts for Claude Code & AI Agents: Confirm, Accept Diff, Abort, Inline AI & Command Palette.",
    presetCLISpecialistName: "💻 CLI Specialist",
    presetCLISpecialistDesc: "Terminal optimization: Sudo Vault, Git Commit Accept, Ctrl+C Abort, Clear & Exit.",
    presetCursorMasterName: "🚀 Cursor & Antigravity Master",
    presetCursorMasterDesc: "Smart IDE controls: Cmd+K Inline Edit, Cmd+I Composer, Toggle Panel & Quick Search.",
    presetPasswordVaultName: "🔐 Password Vault",
    presetPasswordVaultDesc: "Secure password auto-fill vault stored in macOS Keychain with 10 finger slots.",

    // Troubleshooting & Errors
    troubleshootTitle: "Device Disconnected Troubleshooting Guide",
    troubleshootStep1: "Ensure ESP32-S3 USB cable is firmly plugged into your computer (use a USB Data Cable, not a charge-only cable).",
    troubleshootStep2: "Check that USB Serial driver (CH340 / CP210x or Native USB CDC) is recognized by your operating system.",
    troubleshootStep3: "If this is a new board, click Open Web Flasher to flash the TouchPass firmware in 1-click.",
    serverOfflineMsg: "Connection lost to TouchPass Local Server (127.0.0.1:8787). Reconnecting automatically...",

    telemetryLabelDevice: "Device",
    telemetryLabelPort: "Serial Port",
    telemetryLabelSensor: "ZW101 Sensor",
    colSensor: "ZW101 Sensor",
    colEspPin: "ESP32-S3 Pin",
    colNote: "Description",
    wiringNoteVcc: "Sensor VCC power supply (3.3V)",
    wiringNoteGnd: "System common ground (GND)",
    wiringNoteTx: "Serial data transmission (TX)",
    wiringNoteRx: "Serial data reception (RX)",
    wiringNoteIrq: "Fingerprint touch interrupt signal",
    btnEnrollPrimary: "Enroll Finger",
    btnManageSlot: "Manage Action",
    resetSlotBtn: "Reset Slot",
    actionPassword: "Password + Enter",
    actionAccept: "Accept (Y+Enter)",
    actionEnter: "Enter Key",
    actionEscape: "Escape Key",
    actionCustom: "Custom Macro",
    keychainLabel: "🔒 Keychain Vault",
    notAvailable: "Not Configured",
    handMapTitle: "Biometric Fingerprint Map",
    handMapSummaryLeft: "Left Hand: ",
    handMapSummaryRight: "Right Hand: ",
    handMapSummaryEnrolled: " enrolled",
    noLogsRecorded: "No logs recorded.",
    statusOnline: "Connected",
    statusOffline: "Offline",
    statusEnrolled: "Enrolled",
    statusUnenrolled: "Not Enrolled",
    enrollTimeout: "Enrollment timed out after 30s. Please place finger firmly on sensor and try again.",
    retryEnrollBtn: "🔄 Retry Enrollment",
    btnHardwareRequiredTooltip: "TouchPass USB Hardware must be connected to use this feature.",
    enrollStep1: "Position Finger",
    enrollStep2: "Touch Again",
    enrollStep3: "Completed",
    enrollStep1Prompt: "Place finger perpendicular on ZW101 sensor...",
    enrollStep2Prompt: "✅ First touch detected! Lift finger and touch again...",
    enrollStep3Prompt: "🎉 Fingerprint stored securely in hardware!",
    simTitle: "USB Hardware Unplugged — Running Simulation Mode",
    simBtn: "🧪 Simulate Sensor Touch"
  },
  ru: {
    brandTitle: "Портал TouchPass",
    eyebrow: "ESP32-S3 · ZW101",
    statusConnected: "Подключено",
    statusDisconnected: "Отключено",
    step1Title: "🚀 1. Настройка",
    step2Title: "📋 2. Пресеты",
    step3Title: "🖐️ 3. Студия",
    step4Title: "⚡ 4. Активность",
    step1Header: "1. Аппаратное обеспечение и инициализация",
    step1Desc: "Подключите ESP32-S3 к датчику ZW101, прошейте через Web Flasher и протестируйте ввод USB HID.",
    connStatusCardTitle: "Статус подключения оборудования",
    webFlasherCardTitle: "Прошивка Web Flasher",
    webFlasherCardDesc: "Прошивка или обновление ESP32-S3 прямо в Chrome/Edge через Web Serial API.",
    webFlasherBtn: "⚡ Открыть Web Flasher",
    hidSandboxTitle: "Песочница клавиш USB HID",
    hidSandboxDesc: "Нажмите на текстовое поле ниже и нажмите Кнопка теста для проверки эмуляции клавиатуры.",
    hidTestPlaceholder: "Тестовый ввод клавиш...",
    hidTestBtn: "Тест ввода USB HID",
    wiringTitle: "Схема подключения датчика ZW101",
    step2Header: "2. Пресеты для macOS AI Dev",
    step2Desc: "Выберите пресеты горячих клавиш для разработчиков AI (Claude Code, Cursor, Antigravity, Sudo Vault).",
    presetPreviewTitle: "Предпросмотр слотов",
    applyPresetBtn: "✦ Применить пресет",
    step3Header: "3. Biometric Studio",
    step3Desc: "Карта 10 пальцев для 10 биометрических слотов. Регистрируйте отпечатки или настраивайте действия.",
    refreshBtn: "Обновить",
    leftHandTitle: "Левая рука (Слоты 1–5)",
    rightHandTitle: "Правая рука (Слоты 6–10)",
    step4Header: "4. Консоль активности",
    step4Desc: "Мониторинг логов в реальном времени от ESP32-S3 и macOS Helper Service.",
    filterAll: "Все",
    filterBiometric: "Биометрия",
    filterSystem: "Система",
    filterError: "Ошибки",
    pingTestBtn: "Тест Ping",
    clearLogsBtn: "Очистить логи",
    exportLogsBtn: "Экспорт логов",
    enrollModalTitle: "Регистрация отпечатка ZW101",
    enrollPrompt: "Поместите палец на датчик ZW101...",
    cancelEnrollBtn: "Отмена",
    editModalTitle: "Настройка слота отпечатка",
    editLabelField: "Имя пальца / Метка",
    editPresetField: "Пресет действия",
    editSecretField: "Секретный пароль",
    editSecretHint: "Надежно хранится в macOS Keychain. Оставьте пустым, чтобы не менять.",
    editConfirmLabel: "Двойное касание (Защита от случайного нажатия)",
    cancelEditBtn: "Отмена",
    saveSlotBtn: "Сохранить",

    // Action Presets
    presetPassword: "Пароль + Enter",
    presetAccept: "Принять · Y + Enter",
    presetEnter: "Клавиша Enter",
    presetEscape: "Клавиша Escape",
    presetCustom: "Пользовательский макрос",

    // Gallery Presets
    presetAIDevName: "🤖 AI Developer",
    presetAIDevDesc: "Горячие клавиши для Claude Code и AI-агентов: подтверждение, принятие diff, отмена.",
    presetCLISpecialistName: "💻 CLI Specialist",
    presetCLISpecialistDesc: "Оптимизация терминала: Sudo Vault, Git Commit Accept, Ctrl+C Abort, Clear & Exit.",
    presetCursorMasterName: "🚀 Cursor & Antigravity Master",
    presetCursorMasterDesc: "Управление IDE: Cmd+K Inline Edit, Cmd+I Composer, переключение панелей.",
    presetPasswordVaultName: "🔐 Password Vault",
    presetPasswordVaultDesc: "Безопасное хранилище паролей в macOS Keychain для 10 отпечатков.",

    // Troubleshooting & Errors
    troubleshootTitle: "Руководство по устранению неполадок",
    troubleshootStep1: "Убедитесь, что USB-кабель ESP32-S3 надежно подключен (используйте кабель передачи данных).",
    troubleshootStep2: "Проверьте драйвер USB Serial (CH340 / CP210x или Native USB CDC).",
    troubleshootStep3: "Если прошивка отсутствует, нажмите Открыть Web Flasher для прошивки в 1 клик.",
    serverOfflineMsg: "Потеряно соединение с сервером TouchPass (127.0.0.1:8787). Повторная попытка...",

    telemetryLabelDevice: "Устройство",
    telemetryLabelPort: "Serial Порт",
    telemetryLabelSensor: "Датчик ZW101",
    colSensor: "Датчик ZW101",
    colEspPin: "Пин ESP32-S3",
    colNote: "Описание",
    wiringNoteVcc: "Питание датчика (3.3V)",
    wiringNoteGnd: "Общий минус (GND)",
    wiringNoteTx: "Передача данных Serial (TX)",
    wiringNoteRx: "Прием данных Serial (RX)",
    wiringNoteIrq: "Сигнал прерывания касания",
    btnEnrollPrimary: "Зарегистрировать",
    btnManageSlot: "Управление",
    resetSlotBtn: "Сбросить слот",
    actionPassword: "Пароль + Enter",
    actionAccept: "Принять (Y+Enter)",
    actionEnter: "Клавиша Enter",
    actionEscape: "Клавиша Escape",
    actionCustom: "Пользовательский макрос",
    keychainLabel: "🔒 Хранилище Keychain",
    notAvailable: "Не настроено",
    handMapTitle: "Карта биометрических отпечатков",
    handMapSummaryLeft: "Левая рука: ",
    handMapSummaryRight: "Правая рука: ",
    handMapSummaryEnrolled: " зарегистрировано",
    noLogsRecorded: "Записей нет.",
    statusOnline: "Подключено",
    statusOffline: "Отключено",
    statusEnrolled: "Зарегистрировано",
    statusUnenrolled: "Не зарегистрировано",
    enrollTimeout: "Время ожидания истекло (30с). Приложите палец к датчику и повторите попытку.",
    retryEnrollBtn: "🔄 Повторить регистрацию",
    btnHardwareRequiredTooltip: "Для использования требуется подключенное устройство USB TouchPass."
  },
  vi: {
    brandTitle: "TouchPass Portal",
    eyebrow: "ESP32-S3 · ZW101",
    statusConnected: "Đã kết nối",
    statusDisconnected: "Chưa kết nối",
    step1Title: "🚀 1. Setup & Flash",
    step2Title: "📋 2. Presets",
    step3Title: "🖐️ 3. Biometric Studio",
    step4Title: "⚡ 4. Live Activity",
    step1Header: "1. Phần Cứng & Khởi Tạo Device",
    step1Desc: "Đấu nối vi điều khiển ESP32-S3 với cảm biến ZW101, nạp firmware qua Web Flasher và thử nghiệm phím USB HID.",
    connStatusCardTitle: "Trạng thái kết nối Hardware",
    webFlasherCardTitle: "Web Flasher Firmware",
    webFlasherCardDesc: "Nạp hoặc nâng cấp firmware cho ESP32-S3 ngay trên trình duyệt Chrome/Edge qua Web Serial API.",
    webFlasherBtn: "⚡ Mở Web Flasher Web",
    hidSandboxTitle: "USB HID Keystroke Sandbox",
    hidSandboxDesc: "Nhấp vào ô văn bản bên dưới và nhấn nút Thử Gõ để kiểm tra tính năng giả lập phím gõ phần cứng.",
    hidTestPlaceholder: "Thử nghiệm nhập ký tự tại đây...",
    hidTestBtn: "Thử gõ USB HID (Test)",
    wiringTitle: "Sơ đồ đấu nối phần cứng ZW101",
    step2Header: "2. macOS AI Dev Presets",
    step2Desc: "Chọn bộ cấu hình phím tắt tối ưu cho workflow lập trình AI (Claude Code, Cursor, Antigravity, Sudo Vault).",
    presetPreviewTitle: "Xem trước Slot phân bổ",
    applyPresetBtn: "✦ Áp dụng Preset này",
    step3Header: "3. Biometric Studio",
    step3Desc: "Bản đồ 10 ngón tay tương ứng 10 Slot sinh trắc học. Đăng ký vân tay mới hoặc tùy chỉnh hành động.",
    refreshBtn: "Làm mới",
    leftHandTitle: "Bàn tay trái (Slot 1–5)",
    rightHandTitle: "Bàn tay phải (Slot 6–10)",
    step4Header: "4. Live Activity Console",
    step4Desc: "Theo dõi nhật ký hoạt động thời gian thực từ phần cứng ESP32-S3 và macOS Helper Service.",
    filterAll: "Tất cả",
    filterBiometric: "Sinh trắc",
    filterSystem: "Hệ thống",
    filterError: "Lỗi",
    pingTestBtn: "Test Ping",
    clearLogsBtn: "Xóa log",
    exportLogsBtn: "Xuất log",
    enrollModalTitle: "Đăng ký vân tay ZW101",
    enrollPrompt: "Đặt ngón tay lên cảm biến ZW101...",
    cancelEnrollBtn: "Hủy",
    editModalTitle: "Cấu hình Slot Vân Tay",
    editLabelField: "Tên ngón / Chức năng",
    editPresetField: "Hành động (Preset)",
    editSecretField: "Mật khẩu bảo mật",
    editSecretHint: "Lưu an toàn trong macOS Keychain. Để trống để giữ nguyên.",
    editConfirmLabel: "Chạm kép bảo vệ (Confirm Touch)",
    cancelEditBtn: "Hủy",
    saveSlotBtn: "Lưu cấu hình",

    // Action Presets
    presetPassword: "Mật khẩu + Enter",
    presetAccept: "Accept · Y + Enter",
    presetEnter: "Phím Enter",
    presetEscape: "Phím Escape",
    presetCustom: "Macro tùy chỉnh",

    // Gallery Presets
    presetAIDevName: "🤖 AI Developer",
    presetAIDevDesc: "Phân bổ phím tắt cho Claude Code & AI Agent. Confirm AI, Accept Diff, Abort, Inline AI & Command Palette.",
    presetCLISpecialistName: "💻 CLI Specialist",
    presetCLISpecialistDesc: "Tối ưu thao tác Terminal: Sudo Vault, Git Commit Accept, Ctrl+C Abort, Clear Terminal & Exit.",
    presetCursorMasterName: "🚀 Cursor & Antigravity Master",
    presetCursorMasterDesc: "Điều khiển IDE thông minh: Cmd+K Inline Edit, Cmd+I Composer, Toggle Panel & Quick Search.",
    presetPasswordVaultName: "🔐 Password Vault",
    presetPasswordVaultDesc: "Tạo kho điền mật khẩu an toàn lưu trong macOS Keychain với 10 slot phím vân tay.",

    // Troubleshooting & Errors
    troubleshootTitle: "Hướng dẫn khắc phục khi chưa nhận thiết bị USB",
    troubleshootStep1: "Kiểm tra cáp USB ESP32-S3 đã cắm chắc chắn vào máy tính (dùng cáp dữ liệu Data Cable, không dùng cáp sạc thuần túy).",
    troubleshootStep2: "Kiểm tra driver USB Serial (CH340 / CP210x hoặc Native USB CDC) đã được nhận trên hệ thống.",
    troubleshootStep3: "Nếu thiết bị mới hoặc chưa có firmware, nhấp nút Mở Web Flasher bên dưới để nạp firmware 1-Click.",
    serverOfflineMsg: "Mất kết nối tới TouchPass Local Server (127.0.0.1:8787). Đang tự động thử lại...",

    telemetryLabelDevice: "Thiết bị",
    telemetryLabelPort: "Cổng Serial",
    telemetryLabelSensor: "Cảm biến ZW101",
    colSensor: "Cảm biến ZW101",
    colEspPin: "Chân ESP32-S3",
    colNote: "Ghi chú",
    wiringNoteVcc: "Nguồn cấp cảm biến (3.3V)",
    wiringNoteGnd: "Mass chung hệ thống (GND)",
    wiringNoteTx: "Truyền dữ liệu Serial (TX)",
    wiringNoteRx: "Nhận dữ liệu Serial (RX)",
    wiringNoteIrq: "Tín hiệu ngắt cảm ứng vân tay",
    btnEnrollPrimary: "Đăng ký ngón này",
    btnManageSlot: "Quản lý phím tắt",
    resetSlotBtn: "Reset Slot",
    actionPassword: "Mật khẩu + Enter",
    actionAccept: "Chấp nhận (Y+Enter)",
    actionEnter: "Phím Enter",
    actionEscape: "Phím Escape",
    actionCustom: "Macro tùy chỉnh",
    keychainLabel: "🔒 Lưu Keychain",
    notAvailable: "Chưa cấu hình",
    handMapTitle: "Bản đồ 10 ngón tay sinh trắc học",
    handMapSummaryLeft: "Bàn tay trái: ",
    handMapSummaryRight: "Bàn tay phải: ",
    handMapSummaryEnrolled: " đã có vân tay",
    noLogsRecorded: "Chưa có nhật ký ghi nhận.",
    statusOnline: "Đã kết nối",
    statusOffline: "Chưa kết nối",
    statusEnrolled: "Đã đăng ký",
    statusUnenrolled: "Chưa đăng ký",
    enrollTimeout: "Đăng ký quá thời gian chờ (30s). Vui lòng đặt ngón tay vuông góc lên cảm biến ZW101 và thử lại.",
    retryEnrollBtn: "🔄 Thử lại đăng ký",
    btnHardwareRequiredTooltip: "Yêu cầu kết nối thiết bị USB TouchPass để sử dụng tính năng này.",
    enrollStep1: "Đặt ngón",
    enrollStep2: "Chạm lần 2",
    enrollStep3: "Hoàn tất",
    enrollStep1Prompt: "Đặt ngón tay vuông góc lên cảm biến ZW101...",
    enrollStep2Prompt: "✅ Đã nhận diện lần 1! Nhấc ngón tay và chạm lại lần 2...",
    enrollStep3Prompt: "🎉 Tuyệt vời! Vân tay đã được lưu trữ an toàn.",
    simTitle: "Chưa kết nối USB phần cứng — Đang chạy Chế độ Mô phỏng",
    simBtn: "🧪 Mô phỏng Chạm Cảm Biến"
  }
};

// 2. ERROR TRANSLATION MAPPER
const ERROR_MAP = {
  "an admin job is already active": {
    vi: "⚠️ Cảm biến ZW101 đang bận thực hiện thao tác khác. Vui lòng chờ vài giây và thử lại.",
    en: "⚠️ ZW101 sensor is busy with another task. Please wait a few seconds and retry.",
    ru: "⚠️ Датчик ZW101 занят другой операцией. Пожалуйста, подождите немного."
  },
  "password actions require ASCII": {
    vi: "⚠️ Mật khẩu chỉ được chứa các ký tự ASCII hợp lệ (không chứa tiếng Việt có dấu).",
    en: "⚠️ Passwords must contain valid ASCII characters only (no accented letters).",
    ru: "⚠️ Пароль должен содержать только символы ASCII."
  },
  "label must contain between 1 and 64 characters": {
    vi: "⚠️ Tên ngón tay phải từ 1 đến 64 ký tự.",
    en: "⚠️ Finger label must be between 1 and 64 characters.",
    ru: "⚠️ Имя отпечатка должно содержать от 1 до 64 символов."
  },
  "password must contain between 1 and 128 ASCII bytes": {
    vi: "⚠️ Độ dài mật khẩu phải từ 1 đến 128 ký tự ASCII.",
    en: "⚠️ Password length must be between 1 and 128 ASCII bytes.",
    ru: "⚠️ Длина пароля должна быть от 1 до 128 байт ASCII."
  },
  "request rejected": {
    vi: "⚠️ Phiên làm việc bị từ chối (Token CSRF không hợp lệ). Vui lòng làm mới trang.",
    en: "⚠️ Session rejected (Invalid CSRF Token). Please refresh the page.",
    ru: "⚠️ Сеанс отклонен. Пожалуйста, обновите страницу."
  },
  "Failed to fetch": {
    vi: "🔴 Mất kết nối tới TouchPass Server (127.0.0.1:8787). Đang thử lại...",
    en: "🔴 Cannot connect to TouchPass Server (127.0.0.1:8787). Retrying...",
    ru: "🔴 Не удалось подключиться к серверу TouchPass (127.0.0.1:8787)."
  }
};

function translateError(err) {
  if (!err) return "Unknown error occurred";
  const raw = typeof err === 'string' ? err : (err.message || err.toString());

  for (const [pattern, map] of Object.entries(ERROR_MAP)) {
    if (raw.includes(pattern)) {
      return map[state.lang] || map.en || raw;
    }
  }
  return raw;
}

// 3. CORE STATE MANAGEMENT
const state = {
  lang: localStorage.getItem('touchpass_lang') || 'vi',
  csrfToken: '',
  device: { connected: false, sensor: 'unknown', port: null },
  fingers: [],
  logs: [],
  activeTab: 'step1',
  selectedPreset: 'ai_dev',
  activeJobId: null,
  jobPollTimer: null,
  activeFilter: 'all',
  consecutiveFetchErrors: 0
};

// PRESET DEFINITIONS
const PRESETS = {
  ai_dev: {
    id: "ai_dev",
    nameKey: "presetAIDevName",
    descKey: "presetAIDevDesc",
    slots: {
      1: { label: "Ngón cái T: Sudo Vault", action: { preset: "password", confirm: false } },
      2: { label: "Ngón trỏ T: Inline AI (Cmd+K)", action: { preset: "custom", steps: [{ type: "key", key: "k", modifiers: 8 }] } },
      3: { label: "Ngón giữa T: Agent Panel (Cmd+I)", action: { preset: "custom", steps: [{ type: "key", key: "i", modifiers: 8 }] } },
      4: { label: "Ngón nhẫn T: Toggle Terminal", action: { preset: "custom", steps: [{ type: "key", key: "grave", modifiers: 4 }] } },
      5: { label: "Ngón út T: Command Palette", action: { preset: "custom", steps: [{ type: "key", key: "p", modifiers: 9 }] } },
      6: { label: "Ngón cái P: Accept Ghost Text (Tab)", action: { preset: "custom", steps: [{ type: "key", key: "tab" }] } },
      7: { label: "Ngón trỏ P: Approve AI (y+Enter)", action: { preset: "accept", confirm: false } },
      8: { label: "Ngón giữa P: Accept Composer Diff", action: { preset: "custom", steps: [{ type: "key", key: "enter", modifiers: 8 }] } },
      9: { label: "Ngón nhẫn P: Reject / Dismiss", action: { preset: "escape", confirm: false } },
      10: { label: "Ngón út P: Abort (Ctrl+C)", action: { preset: "custom", steps: [{ type: "key", key: "c", modifiers: 4 }] } }
    }
  },
  cli_specialist: {
    id: "cli_specialist",
    nameKey: "presetCLISpecialistName",
    descKey: "presetCLISpecialistDesc",
    slots: {
      1: { label: "Sudo Password Vault", action: { preset: "password", confirm: false } },
      2: { label: "Git Status", action: { preset: "custom", steps: [{ type: "text", value: "git status" }, { type: "key", key: "enter" }] } },
      3: { label: "Git Diff", action: { preset: "custom", steps: [{ type: "text", value: "git diff" }, { type: "key", key: "enter" }] } },
      4: { label: "Git Commit", action: { preset: "custom", steps: [{ type: "text", value: "git commit -am 'update'" }, { type: "key", key: "enter" }] } },
      5: { label: "Git Push", action: { preset: "custom", steps: [{ type: "text", value: "git push" }, { type: "key", key: "enter" }] } },
      6: { label: "Confirm y + Enter", action: { preset: "accept", confirm: false } },
      7: { label: "Submit Enter", action: { preset: "enter", confirm: false } },
      8: { label: "Interrupt (Ctrl+C)", action: { preset: "custom", steps: [{ type: "key", key: "c", modifiers: 4 }] } },
      9: { label: "Start Claude Code", action: { preset: "custom", steps: [{ type: "text", value: "claude" }, { type: "key", key: "enter" }] } },
      10: { label: "Clear Terminal", action: { preset: "custom", steps: [{ type: "text", value: "clear" }, { type: "key", key: "enter" }] } }
    }
  },
  cursor_master: {
    id: "cursor_master",
    nameKey: "presetCursorMasterName",
    descKey: "presetCursorMasterDesc",
    slots: {
      1: { label: "Undo AI Edit (Cmd+Z)", action: { preset: "custom", steps: [{ type: "key", key: "z", modifiers: 8 }] } },
      2: { label: "Global Search (Cmd+Shift+F)", action: { preset: "custom", steps: [{ type: "key", key: "f", modifiers: 9 }] } },
      3: { label: "Toggle Terminal (Ctrl+~)", action: { preset: "custom", steps: [{ type: "key", key: "grave", modifiers: 4 }] } },
      4: { label: "Toggle Sidebar (Cmd+B)", action: { preset: "custom", steps: [{ type: "key", key: "b", modifiers: 8 }] } },
      5: { label: "Close Active Tab (Cmd+W)", action: { preset: "custom", steps: [{ type: "key", key: "w", modifiers: 8 }] } },
      6: { label: "Accept Auto-complete (Tab)", action: { preset: "custom", steps: [{ type: "key", key: "tab" }] } },
      7: { label: "Accept Composer (Cmd+Enter)", action: { preset: "custom", steps: [{ type: "key", key: "enter", modifiers: 8 }] } },
      8: { label: "Inline Edit (Cmd+K)", action: { preset: "custom", steps: [{ type: "key", key: "k", modifiers: 8 }] } },
      9: { label: "Reject / Dismiss (Escape)", action: { preset: "escape", confirm: false } },
      10: { label: "Focus Chat (Cmd+L)", action: { preset: "custom", steps: [{ type: "key", key: "l", modifiers: 8 }] } }
    }
  },
  password_vault: {
    id: "password_vault",
    nameKey: "presetPasswordVaultName",
    descKey: "presetPasswordVaultDesc",
    slots: Object.fromEntries(
      Array.from({ length: 10 }, (_, i) => [
        i + 1,
        { label: `Password Slot ${i + 1}`, action: { preset: "password", confirm: false } }
      ])
    )
  }
};

// 4. i18n TRANSLATION ENGINE
function t(key, fallback = '') {
  return TRANSLATIONS[state.lang]?.[key] || TRANSLATIONS.en?.[key] || fallback || key;
}

function setLanguage(lang) {
  if (!TRANSLATIONS[lang]) return;
  state.lang = lang;
  localStorage.setItem('touchpass_lang', lang);

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (key) {
      el.textContent = t(key, el.textContent);
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (key) {
      el.placeholder = t(key, el.placeholder);
    }
  });

  renderPresets();
  renderPresetPreview();
  renderHandMap();
  renderSlotGrid();
  if (state.device) updateDeviceTelemetry(state.device);
}

// 5. API COMMUNICATION LAYER WITH ERROR HANDLING
async function apiCall(path, method = 'GET', body = null) {
  const upperMethod = method.toUpperCase();

  // Auto-fetch CSRF token if missing for mutation requests
  if (['POST', 'PUT', 'DELETE'].includes(upperMethod) && !state.csrfToken && path !== '/api/status') {
    try {
      const statusRes = await fetch('/api/status');
      const statusData = await statusRes.json();
      if (statusData && statusData.csrf_token) {
        state.csrfToken = statusData.csrf_token;
      }
    } catch (e) {}
  }

  const options = {
    method: upperMethod,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (['POST', 'PUT', 'DELETE'].includes(upperMethod) && state.csrfToken) {
    options.headers['X-CSRF-Token'] = state.csrfToken;
  }

  if (body !== null && body !== undefined) {
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(path, options);
    const payload = await response.json();
    if (!response.ok) {
      const msg = payload.error || `HTTP ${response.status}`;
      throw new Error(msg);
    }
    state.consecutiveFetchErrors = 0;
    toggleOfflineBanner(false);
    return payload;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      state.consecutiveFetchErrors++;
      if (state.consecutiveFetchErrors >= 2) {
        toggleOfflineBanner(true);
      }
    }
    console.error(`API Call Error (${options.method} ${path}):`, err);
    throw err;
  }
}

function toggleOfflineBanner(show) {
  const banner = document.querySelector('#server-offline-banner');
  if (banner) {
    banner.style.display = show ? 'flex' : 'none';
  }
}

async function api(path, options = {}) {
  const method = options.method || 'GET';
  const body = options.body ? options.body : null;
  return apiCall(path, method, body);
}

// 6. TAB SWITCHER
function switchTab(tabId) {
  if (!tabId) return;
  state.activeTab = tabId;
  localStorage.setItem('touchpass_active_tab', tabId);

  document.querySelectorAll('.step-tab-btn, .tab-button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  document.querySelectorAll('.tab-content, .tab-panel').forEach(panel => {
    const isTarget = panel.id === `tab-${tabId}` || panel.dataset.tab === tabId;
    panel.classList.toggle('active', isTarget);
  });

  if (tabId === 'step3') {
    fetchFingers();
  } else if (tabId === 'step4') {
    pollLogs();
  }
}

// 7. TOAST NOTIFICATIONS & TELEMETRY UPDATES
let toastTimer = null;
function showToast(message, type = 'info') {
  let toast = document.querySelector('#toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }

  toast.textContent = translateError(message);
  toast.className = `toast visible toast-${type}`;

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('visible');
  }, 4000);
}

async function triggerTestHID() {
  if (!state.device.connected) {
    showToast(t('btnHardwareRequiredTooltip'), 'error');
    return;
  }

  const chips = document.querySelectorAll('.key-chip, .key-combo kbd');
  chips.forEach(chip => chip.classList.add('flash'));
  setTimeout(() => chips.forEach(chip => chip.classList.remove('flash')), 400);

  const input = document.querySelector('#hid-test-input');
  if (input) input.focus();

  try {
    const res = await apiCall('/api/test', 'POST', { action: 'type_test' });
    showToast(t('testSuccess') || 'USB HID keystroke test sent!', 'success');
    return res;
  } catch (err) {
    showToast(translateError(err), 'error');
  }
}

function updateDeviceTelemetry(device) {
  if (!device) return;
  state.device = device;

  const badge = document.querySelector('#device-status');
  const text = document.querySelector('#device-status-text');
  const telemetryDevice = document.querySelector('#telemetry-device');
  const telemetryPort = document.querySelector('#telemetry-port');
  const telemetrySensor = document.querySelector('#telemetry-sensor');
  const troubleshootBanner = document.querySelector('#troubleshoot-banner');

  const isConnected = !!device.connected;
  const isHid = device.port?.includes('USB HID');

  if (badge) {
    badge.className = `status-pill ${isConnected ? 'status-online' : 'status-offline'}`;
  }

  if (text) {
    text.textContent = isConnected
      ? (isHid ? `${t('statusConnected')} (USB HID)` : `${t('statusConnected')} (${device.port || 'ESP32'})`)
      : t('statusDisconnected');
  }

  const deviceVal = isConnected ? (isHid ? `${t('statusOnline')} (USB HID)` : `${t('statusOnline')} (ESP32-S3)`) : t('statusOffline');
  const isSensorOk = device.sensor === 'ok';
  const portVal = device.port || t('notAvailable');

  if (telemetryDevice) telemetryDevice.textContent = deviceVal;
  if (telemetryPort) telemetryPort.textContent = portVal;
  if (telemetrySensor) {
    telemetrySensor.innerHTML = isSensorOk 
      ? `<span style="color: #22c55e; font-weight: 600;">✅ OK (ZW101)</span>`
      : `<span style="color: #f87171; font-weight: 600;" title="Chưa cắm mô-đun cảm biến ZW101 vào 4 chân ESP32-S3">🔴 Chưa đấu nối Cảm biến ZW101</span>`;
  }

  if (troubleshootBanner) {
    troubleshootBanner.style.display = isConnected ? 'none' : 'flex';
  }

  document.querySelectorAll('.btn-hardware-required').forEach(btn => {
    btn.disabled = !isConnected;
    btn.title = isConnected ? '' : t('btnHardwareRequiredTooltip');
  });
}

function updateStatusBadge(device) {
  return updateDeviceTelemetry(device);
}

async function pollStatus() {
  try {
    const data = await apiCall('/api/status');
    if (data) {
      if (data.csrf_token) state.csrfToken = data.csrf_token;
      if (data.device) updateDeviceTelemetry(data.device);
    }
    return data;
  } catch (err) {
    state.device = { connected: false, sensor: 'offline', port: null };
    updateDeviceTelemetry(state.device);
  }
}

async function fetchStatus() {
  return pollStatus();
}

// 8. STEP 2 LOGIC (PRESETS GALLERY & PREVIEW)
function renderPresets() {
  const container = document.querySelector('#preset-gallery');
  if (!container) return;

  container.innerHTML = Object.values(PRESETS).map(preset => `
    <article class="preset-card ${state.selectedPreset === preset.id ? 'active' : ''}" data-preset-id="${preset.id}">
      <h3 class="preset-card-title">${t(preset.nameKey, preset.id)}</h3>
      <p class="preset-card-desc">${t(preset.descKey, '')}</p>
    </article>
  `).join('');

  container.querySelectorAll('.preset-card').forEach(card => {
    card.addEventListener('click', () => {
      state.selectedPreset = card.dataset.presetId;
      renderPresets();
      renderPresetPreview();
    });
  });
}

function renderPresetPreview() {
  const container = document.querySelector('#preset-preview-sheet');
  if (!container) return;

  const preset = PRESETS[state.selectedPreset] || PRESETS.ai_dev;
  let html = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
      <h3 class="section-title" style="font-size: 1.1rem; margin: 0;">${t('presetPreviewTitle')}: ${t(preset.nameKey)}</h3>
      <button id="btn-apply-preset" class="button button-primary" type="button">${t('applyPresetBtn')}</button>
    </div>
    <div class="hand-grid" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px;">
      <div class="hand-section">
        <h4 class="hand-title">${t('leftHandTitle')}</h4>
        <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px;">
  `;

  for (let slot = 1; slot <= 5; slot++) {
    const item = preset.slots[slot];
    html += `<li style="font-size: 0.86rem; color: var(--text); padding: 8px 12px; background: var(--code-bg); border-radius: 8px; border: 1px solid var(--card-border);">
      <strong style="color: var(--accent);">Slot ${slot}:</strong> ${item ? item.label : 'N/A'}
    </li>`;
  }

  html += `</ul></div><div class="hand-section"><h4 class="hand-title">${t('rightHandTitle')}</h4><ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px;">`;

  for (let slot = 6; slot <= 10; slot++) {
    const item = preset.slots[slot];
    html += `<li style="font-size: 0.86rem; color: var(--text); padding: 8px 12px; background: var(--code-bg); border-radius: 8px; border: 1px solid var(--card-border);">
      <strong style="color: var(--accent);">Slot ${slot}:</strong> ${item ? item.label : 'N/A'}
    </li>`;
  }

  html += `</ul></div></div>`;
  container.innerHTML = html;

  const btnApply = container.querySelector('#btn-apply-preset');
  if (btnApply) {
    btnApply.addEventListener('click', applySelectedPreset);
  }
}

async function applySelectedPreset() {
  const preset = PRESETS[state.selectedPreset] || PRESETS.ai_dev;
  const btnApply = document.querySelector('#btn-apply-preset');
  const originalText = btnApply ? btnApply.textContent : '';

  if (btnApply) {
    btnApply.disabled = true;
    btnApply.textContent = `⏳ ${t('applyingPreset', 'Đang áp dụng mẫu...')}`;
  }

  showToast(`⏳ ${t('applyingPreset', 'Đang áp dụng mẫu phím tắt cho 10 slot...')}`, 'info');

  let successCount = 0;
  let lastError = null;

  try {
    // Ensure CSRF Token is loaded
    await pollStatus();

    for (const [slotStr, data] of Object.entries(preset.slots)) {
      const slot = parseInt(slotStr, 10);
      try {
        await apiCall(`/api/fingers/${slot}`, 'PUT', {
          label: data.label,
          action: data.action
        });
        successCount++;
      } catch (slotErr) {
        console.error(`Error updating slot ${slot}:`, slotErr);
        lastError = slotErr;
      }
    }

    if (successCount > 0) {
      showToast(t('presetApplied'), 'success');
      await fetchFingers();
      switchTab('step3');
    } else if (lastError) {
      throw lastError;
    }
  } catch (err) {
    showToast(translateError(err), 'error');
  } finally {
    if (btnApply) {
      btnApply.disabled = false;
      btnApply.textContent = originalText;
    }
  }
}

// 9. STEP 3 LOGIC (BIOMETRIC STUDIO, STALLED JOB SAFETY & ENROLLMENT)
async function fetchFingers() {
  try {
    const data = await apiCall('/api/fingers');
    if (data && data.fingers) {
      state.fingers = data.fingers;
      renderHandMap();
      renderSlotGrid();
    }
  } catch (err) {
    console.error('Failed to fetch fingers:', err);
  }
}

function renderHandMap() {
  const mapContainer = document.querySelector('#hand-map');
  if (!mapContainer) return;

  const leftEnrolled = state.fingers.slice(0, 5).filter(f => f.enrolled).length;
  const rightEnrolled = state.fingers.slice(5, 10).filter(f => f.enrolled).length;

  mapContainer.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
      <div>
        <h3 class="section-title" style="font-size: 1.15rem; margin: 0;">${t('handMapTitle')}</h3>
        <p class="section-desc" style="margin: 0; font-size: 0.86rem;">
          ${t('handMapSummaryLeft')}${leftEnrolled}/5${t('handMapSummaryEnrolled')} · ${t('handMapSummaryRight')}${rightEnrolled}/5${t('handMapSummaryEnrolled')}
        </p>
      </div>
      <button class="button button-secondary" type="button" onclick="fetchFingers()">${t('refreshBtn')}</button>
    </div>
  `;
}

function renderSlotGrid() {
  const gridContainer = document.querySelector('#slot-grid');
  if (!gridContainer) return;

  if (!state.fingers || state.fingers.length === 0) {
    gridContainer.innerHTML = `<div style="text-align: center; color: var(--muted); padding: 24px;">Loading...</div>`;
    return;
  }

  const leftFingers = state.fingers.slice(0, 5);
  const rightFingers = state.fingers.slice(5, 10);
  const isConnected = state.device.connected;

  const renderCard = (f) => {
    const presetKey = f.action?.preset || 'custom';
    const actionNameMap = {
      password: t('actionPassword'),
      accept: t('actionAccept'),
      enter: t('actionEnter'),
      escape: t('actionEscape'),
      custom: t('actionCustom')
    };
    const actionLabel = actionNameMap[presetKey] || t('actionCustom');
    const isSecret = f.action?.secret_configured;
    
    // "Don't Make Me Think" UX: 1 clear primary action per state
    let actionButtons = '';
    if (!f.enrolled) {
      actionButtons = `
        <button class="button button-primary" type="button" data-action="enroll" data-slot="${f.slot}" onclick="startEnrollment(${f.slot})">
          👆 ${t('btnEnrollPrimary')}
        </button>
        <button class="button button-secondary" type="button" title="${t('editModalTitle')}" data-action="edit" data-slot="${f.slot}" onclick="openEditModal(${f.slot})">
          ⚙️
        </button>
      `;
    } else {
      actionButtons = `
        <button class="button button-secondary" type="button" data-action="edit" data-slot="${f.slot}" onclick="openEditModal(${f.slot})">
          ⚙️ ${t('btnManageSlot')}
        </button>
        <button class="button button-quiet" type="button" title="${t('retryEnrollBtn')}" data-action="enroll" data-slot="${f.slot}" onclick="startEnrollment(${f.slot})">
          👆
        </button>
      `;
    }

    return `
      <article class="finger-card ${f.enrolled ? 'enrolled' : ''}" data-slot="${f.slot}">
        <div class="slot-number">${f.slot}</div>
        <div class="finger-info">
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: nowrap;">
            <h4 class="finger-name">${f.label || `Slot ${f.slot}`}</h4>
            ${f.enrolled ? `<span class="status-pill enrolled">${t('statusEnrolled')}</span>` : `<span class="status-pill unenrolled">${t('statusUnenrolled')}</span>`}
          </div>
          <p class="finger-meta">
            ${isSecret ? `${t('keychainLabel')} · ` : ''}Action: ${actionLabel}
          </p>
        </div>
        <div class="card-actions">
          ${actionButtons}
        </div>
      </article>
    `;
  };

  gridContainer.innerHTML = `
    <div class="hand-grid">
      <div class="hand-section">
        <h4 class="hand-title">${t('leftHandTitle')}</h4>
        <div class="finger-grid">${leftFingers.map(renderCard).join('')}</div>
      </div>
      <div class="hand-section">
        <h4 class="hand-title">${t('rightHandTitle')}</h4>
        <div class="finger-grid">${rightFingers.map(renderCard).join('')}</div>
      </div>
    </div>
  `;
}

// ENROLLMENT MODAL, STEPPER WIZARD & JOB TIMEOUT SAFETY (30s LIMIT)
const FINGER_NAMES = {
  1: { en: "Left Thumb (Slot 1)", ru: "Большой левой (Слот 1)", vi: "Ngón cái trái (Slot 1)" },
  2: { en: "Left Index (Slot 2)", ru: "Указательный левой (Слот 2)", vi: "Ngón trỏ trái (Slot 2)" },
  3: { en: "Left Middle (Slot 3)", ru: "Средний левой (Слот 3)", vi: "Ngón giữa trái (Slot 3)" },
  4: { en: "Left Ring (Slot 4)", ru: "Безымянный левой (Слот 4)", vi: "Ngón áp út trái (Slot 4)" },
  5: { en: "Left Pinky (Slot 5)", ru: "Мизинец левой (Слот 5)", vi: "Ngón út trái (Slot 5)" },
  6: { en: "Right Thumb (Slot 6)", ru: "Большой правой (Слот 6)", vi: "Ngón cái phải (Slot 6)" },
  7: { en: "Right Index (Slot 7)", ru: "Указательный правой (Слот 7)", vi: "Ngón trỏ phải (Slot 7)" },
  8: { en: "Right Middle (Slot 8)", ru: "Средний правой (Слот 8)", vi: "Ngón giữa phải (Slot 8)" },
  9: { en: "Right Ring (Slot 9)", ru: "Безымянный правой (Слот 9)", vi: "Ngón áp út phải (Slot 9)" },
  10: { en: "Right Pinky (Slot 10)", ru: "Мизинец правой (Слот 10)", vi: "Ngón út phải (Slot 10)" }
};

function getFingerAnatomicalName(slot) {
  const map = FINGER_NAMES[slot];
  return map ? (map[state.lang] || map.en) : `Slot ${slot}`;
}

function updateEnrollStepUI(phase) {
  const node1 = document.querySelector('#step-node-1');
  const node2 = document.querySelector('#step-node-2');
  const node3 = document.querySelector('#step-node-3');

  if (node1) node1.className = 'stepper-step' + (phase === 1 ? ' active' : (phase > 1 ? ' completed' : ''));
  if (node2) node2.className = 'stepper-step' + (phase === 2 ? ' active' : (phase > 2 ? ' completed' : ''));
  if (node3) node3.className = 'stepper-step' + (phase === 3 ? ' active completed' : '');
}

async function startEnrollment(slot) {
  state.activeSlot = slot;

  // Auto-cancel previous job if active
  if (state.activeJobId) {
    try {
      await apiCall(`/api/jobs/${state.activeJobId}/cancel`, 'POST');
    } catch (e) {}
  }

  try {
    const res = await apiCall(`/api/fingers/${slot}/enroll`, 'POST');
    if (res && res.job) {
      showEnrollModal(slot, res.job.id);
      pollEnrollJob(res.job.id, slot);
    } else {
      showEnrollModal(slot, 'active-enroll');
    }
  } catch (err) {
    const msg = typeof err === 'string' ? err : (err.message || '');
    if (msg.includes('active')) {
      try {
        await cancelEnrollment();
        const retryRes = await apiCall(`/api/fingers/${slot}/enroll`, 'POST');
        if (retryRes && retryRes.job) {
          showEnrollModal(slot, retryRes.job.id);
          pollEnrollJob(retryRes.job.id, slot);
          return;
        }
      } catch (e) {}
    }
    showEnrollModal(slot, 'active-enroll');
  }
}

function showEnrollModal(slot, jobId) {
  state.activeJobId = jobId;
  state.activeSlot = slot;
  const modal = document.querySelector('#enroll-modal');
  const text = document.querySelector('#enroll-status-text');
  const bar = document.querySelector('#enroll-progress-bar');
  const simBanner = document.querySelector('#sim-banner');
  const fingerNameEl = document.querySelector('#enroll-finger-name');

  if (fingerNameEl) fingerNameEl.textContent = getFingerAnatomicalName(slot);
  updateEnrollStepUI(1);

  if (modal) {
    modal.classList.add('active');
    if (typeof modal.showModal === 'function' && !modal.open) {
      modal.showModal();
    } else {
      modal.setAttribute('open', '');
    }
  }
  if (text) text.textContent = `① ${t('enrollStep1Prompt', 'Đặt ngón tay vuông góc lên cảm biến ZW101...')}`;
  if (bar) bar.style.width = '20%';

  if (simBanner) {
    simBanner.style.display = (state.device.connected && state.device.sensor === 'ok') ? 'none' : 'block';
  }
}

function hideEnrollModal() {
  const modal = document.querySelector('#enroll-modal');
  if (modal) {
    modal.classList.remove('active');
    if (typeof modal.close === 'function' && modal.open) {
      modal.close();
    }
    modal.removeAttribute('open');
  }
  clearInterval(state.jobPollTimer);
  state.activeJobId = null;
}

function pollEnrollJob(jobId, slot) {
  clearInterval(state.jobPollTimer);
  const startTime = Date.now();

  state.jobPollTimer = setInterval(async () => {
    // 30-Second Timeout Protection
    if (Date.now() - startTime > 30000) {
      clearInterval(state.jobPollTimer);
      try {
        await apiCall(`/api/jobs/${jobId}/cancel`, 'POST');
      } catch (e) {}
      
      const text = document.querySelector('#enroll-status-text');
      if (text) {
        text.innerHTML = `<span style="color: #f87171;">${t('enrollTimeout')}</span>`;
      }
      showToast(t('enrollTimeout'), 'error');
      setTimeout(() => hideEnrollModal(), 3000);
      return;
    }

    try {
      const res = await apiCall(`/api/jobs/${jobId}`);
      if (!res || !res.job) return;
      const job = res.job;
      const text = document.querySelector('#enroll-status-text');
      const bar = document.querySelector('#enroll-progress-bar');

      if (job.state === 'queued') {
        updateEnrollStepUI(1);
        if (text) text.textContent = `① ${t('enrollStep1Prompt', 'Đặt ngón tay vuông góc lên cảm biến ZW101...')}`;
        if (bar) bar.style.width = '30%';
      } else if (job.state === 'touch1' || job.state === 'running') {
        updateEnrollStepUI(2);
        if (text) text.textContent = `② ${t('enrollStep2Prompt', '✅ Đã nhận diện lần 1! Nhấc ngón tay và chạm lại lần 2...')}`;
        if (bar) bar.style.width = '65%';
      } else if (job.state === 'stored') {
        clearInterval(state.jobPollTimer);
        updateEnrollStepUI(3);
        if (text) text.textContent = `③ ${t('enrollStep3Prompt', '🎉 Tuyệt vời! Vân tay đã được lưu trữ an toàn.')}`;
        if (bar) bar.style.width = '100%';
        showToast(t('enrollSuccess'), 'success');
        setTimeout(() => {
          hideEnrollModal();
          fetchFingers();
        }, 1400);
      } else if (job.state === 'error' || job.state === 'cancelled') {
        clearInterval(state.jobPollTimer);
        const text = document.querySelector('#enroll-status-text');
        const bar = document.querySelector('#enroll-progress-bar');
        const errDetail = job.error === 'no_sensor_detected'
          ? '🔴 Chưa đấu nối Cảm biến ZW101! Hãy cắm 4 dây (VCC, GND, TX, RX) trước khi đăng ký.'
          : (t('enrollFailed') + (job.error ? `: ${job.error}` : ''));
        
        if (text) text.innerHTML = `<span style="color: #f87171; font-weight: 600;">${errDetail}</span>`;
        if (bar) {
          bar.style.background = '#ef4444';
          bar.style.width = '100%';
        }
        showToast(errDetail, 'error');
      }
    } catch (err) {
      clearInterval(state.jobPollTimer);
    }
  }, 600);
}

async function cancelEnrollment() {
  if (state.activeJobId) {
    try {
      await apiCall(`/api/jobs/${state.activeJobId}/cancel`, 'POST');
    } catch (e) {}
  }
  hideEnrollModal();
}

async function deleteSlot(slot) {
  if (!confirm(`Are you sure you want to delete fingerprint slot ${slot}?`)) return;
  try {
    await apiCall(`/api/fingers/${slot}`, 'DELETE');
    showToast(t('slotDeleted'), 'success');
    fetchFingers();
  } catch (err) {
    showToast(translateError(err), 'error');
  }
}

// 10. EDIT SLOT MODAL WITH FORM DRAFT PROTECTION
function openEditModal(slot) {
  const finger = state.fingers.find(f => f.slot === slot) || { slot, label: `Slot ${slot}`, action: { preset: 'enter' } };
  const modal = document.querySelector('#edit-modal');
  const titleEl = document.querySelector('#dialog-title');
  const inputLabel = document.querySelector('#edit-label');
  const selectPreset = document.querySelector('#edit-preset');
  const secretField = document.querySelector('#secret-field');
  const inputSecret = document.querySelector('#edit-secret');
  const checkConfirm = document.querySelector('#edit-confirm');
  const errorText = document.querySelector('#form-error');

  const fingerAnatomy = getFingerAnatomicalName(slot);
  if (titleEl) {
    titleEl.textContent = `Cấu hình Slot ${slot} · ${fingerAnatomy}`;
  }

  if (inputLabel) {
    inputLabel.value = finger.label || `Slot ${slot}`;
    inputLabel.classList.remove('input-error');
  }

  const currentPreset = finger.action?.preset || 'enter';
  if (selectPreset) selectPreset.value = currentPreset;
  if (secretField) {
    secretField.style.display = currentPreset === 'password' ? 'flex' : 'none';
  }

  if (inputSecret) {
    inputSecret.value = '';
    inputSecret.classList.remove('input-error');
  }
  if (checkConfirm) checkConfirm.checked = !!finger.action?.confirm;
  if (errorText) errorText.textContent = '';

  if (modal) {
    modal.dataset.slot = slot;
    modal.classList.add('active');
    if (typeof modal.showModal === 'function' && !modal.open) {
      modal.showModal();
    } else {
      modal.setAttribute('open', '');
    }
  }
}

function hideEditModal() {
  const modal = document.querySelector('#edit-modal');
  if (modal) {
    modal.classList.remove('active');
    if (typeof modal.close === 'function' && modal.open) {
      modal.close();
    }
    modal.removeAttribute('open');
  }
}

async function saveSlotEdit(e) {
  if (e) e.preventDefault();
  const modal = document.querySelector('#edit-modal');
  if (!modal) return;
  const slot = parseInt(modal.dataset.slot, 10);

  const inputLabel = document.querySelector('#edit-label');
  const inputSecret = document.querySelector('#edit-secret');
  const errorText = document.querySelector('#form-error');

  const label = inputLabel?.value.trim() || `Slot ${slot}`;
  const preset = document.querySelector('#edit-preset')?.value || 'enter';
  const secret = inputSecret?.value;
  const confirm = document.querySelector('#edit-confirm')?.checked;

  if (errorText) errorText.textContent = '';
  if (inputLabel) inputLabel.classList.remove('input-error');
  if (inputSecret) inputSecret.classList.remove('input-error');

  // Client-Side Validation
  if (!label || label.length > 64) {
    if (inputLabel) inputLabel.classList.add('input-error');
    if (errorText) errorText.textContent = t('label must contain between 1 and 64 characters');
    return;
  }

  if (preset === 'password' && secret) {
    // ASCII Check
    if (!/^[\x00-\x7F]*$/.test(secret)) {
      if (inputSecret) inputSecret.classList.add('input-error');
      if (errorText) errorText.textContent = translateError('password actions require ASCII');
      return;
    }
  }

  const payload = {
    label,
    action: { preset, confirm: !!confirm }
  };
  if (secret) {
    payload.secret = secret;
  }

  try {
    await apiCall(`/api/fingers/${slot}`, 'PUT', payload);
    showToast(t('slotSaved'), 'success');
    hideEditModal();
    fetchFingers();
  } catch (err) {
    const friendlyMsg = translateError(err);
    if (errorText) errorText.textContent = friendlyMsg;
    showToast(friendlyMsg, 'error');
  }
}

// 11. STEP 4 LOGIC (LIVE ACTIVITY CONSOLE)
async function pollLogs() {
  try {
    const data = await apiCall('/api/logs');
    if (data && data.logs) {
      state.logs = data.logs;
      renderLogs();
    }
  } catch (err) {
    console.error('Failed to poll logs:', err);
  }
}

function renderLogs() {
  const container = document.querySelector('#log-stream');
  if (!container) return;

  const filtered = state.logs.filter(entry => {
    if (state.activeFilter === 'all') return true;
    const tag = (entry.tag || '').toUpperCase();
    if (state.activeFilter === 'biometric') return ['ENROLL', 'TOUCH', 'MATCH'].includes(tag);
    if (state.activeFilter === 'system') return ['SYSTEM', 'CONFIG', 'INFO'].includes(tag);
    if (state.activeFilter === 'error') return ['ERROR', 'ERR'].includes(tag);
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="log-line" style="color: var(--muted);">${t('noLogsRecorded')}</div>`;
    return;
  }

  container.innerHTML = filtered.map(entry => {
    const timeStr = entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : '';
    const tag = (entry.tag || 'INFO').toUpperCase();
    let tagClass = 'system';
    if (['ENROLL', 'TOUCH', 'MATCH'].includes(tag)) tagClass = 'biometric';
    if (['CONFIG', 'PW'].includes(tag)) tagClass = 'config';
    if (['TEST', 'INFO'].includes(tag)) tagClass = 'test';
    if (['ERROR', 'ERR'].includes(tag)) tagClass = 'error';

    return `
      <div class="log-line">
        <span class="log-time">[${timeStr}]</span>
        <span class="log-tag ${tagClass}">${tag}</span>
        <span class="log-msg">${entry.message}</span>
      </div>
    `;
  }).join('');

  container.scrollTop = container.scrollHeight;
}

function clearLogs() {
  state.logs = [];
  renderLogs();
  showToast(t('logsCleared'), 'info');
}

async function pingTest() {
  if (!state.device.connected) {
    showToast(t('btnHardwareRequiredTooltip'), 'error');
    return;
  }

  try {
    await apiCall('/api/test', 'POST', { action: 'ping' });
    showToast(t('pingSuccess'), 'success');
    pollLogs();
  } catch (err) {
    showToast(translateError(err), 'error');
  }
}

function exportLogs() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.logs, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `touchpass-logs-${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// 12. EVENT LISTENERS INITIALIZATION
function initEventListeners() {
  document.querySelectorAll('[data-lang]').forEach(btn => {
    btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
  });

  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  const btnTestHid = document.querySelector('#btn-test-hid');
  if (btnTestHid) btnTestHid.addEventListener('click', triggerTestHID);

  // Indestructible Event Delegation for Slot Grid buttons
  const slotGrid = document.querySelector('#slot-grid');
  if (slotGrid) {
    slotGrid.addEventListener('click', (e) => {
      const btnEnroll = e.target.closest('[data-action="enroll"]');
      if (btnEnroll) {
        const slot = parseInt(btnEnroll.dataset.slot, 10);
        if (slot) startEnrollment(slot);
        return;
      }
      const btnEdit = e.target.closest('[data-action="edit"]');
      if (btnEdit) {
        const slot = parseInt(btnEdit.dataset.slot, 10);
        if (slot) openEditModal(slot);
        return;
      }
    });
  }

  const btnCancelEnroll = document.querySelector('#btn-cancel-enroll');
  if (btnCancelEnroll) btnCancelEnroll.addEventListener('click', cancelEnrollment);

  const btnCloseEnroll = document.querySelector('#btn-close-enroll');
  if (btnCloseEnroll) btnCloseEnroll.addEventListener('click', cancelEnrollment);

  const btnCloseEdit = document.querySelector('#btn-close-edit');
  if (btnCloseEdit) btnCloseEdit.addEventListener('click', hideEditModal);

  const formEdit = document.querySelector('#edit-form');
  if (formEdit) formEdit.addEventListener('submit', saveSlotEdit);

  const selectPreset = document.querySelector('#edit-preset');
  if (selectPreset) {
    selectPreset.addEventListener('change', () => {
      const secretField = document.querySelector('#secret-field');
      if (secretField) {
        secretField.style.display = selectPreset.value === 'password' ? 'flex' : 'none';
      }
    });
  }

  const btnCancelEdit = document.querySelector('#btn-cancel-edit');
  if (btnCancelEdit) btnCancelEdit.addEventListener('click', hideEditModal);

  const btnSaveSlot = document.querySelector('#btn-save-slot');
  if (btnSaveSlot) btnSaveSlot.addEventListener('click', saveSlotEdit);

  const btnDeleteModal = document.querySelector('#btn-delete-slot-modal');
  if (btnDeleteModal) {
    btnDeleteModal.addEventListener('click', async () => {
      const modal = document.querySelector('#edit-modal');
      if (!modal) return;
      const slot = parseInt(modal.dataset.slot, 10);
      if (slot) {
        hideEditModal();
        await deleteSlot(slot);
      }
    });
  }

  document.querySelectorAll('[id^="filter-"]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.activeFilter = btn.id.replace('filter-', '');
      document.querySelectorAll('[id^="filter-"]').forEach(b => b.classList.remove('button-primary'));
      btn.classList.add('button-primary');
      renderLogs();
    });
  });

  const btnClear = document.querySelector('#btn-clear-logs');
  if (btnClear) btnClear.addEventListener('click', clearLogs);

  const btnPing = document.querySelector('#btn-ping-test');
  if (btnPing) btnPing.addEventListener('click', pingTest);

  const btnExport = document.querySelector('#btn-export-logs');
  if (btnExport) btnExport.addEventListener('click', exportLogs);
}

// INITIAL BOOT SCAFFOLDING
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  setLanguage(state.lang);
  renderPresets();
  renderPresetPreview();

  const savedTab = localStorage.getItem('touchpass_active_tab') || 'step1';
  switchTab(savedTab);

  pollStatus();
  fetchFingers();

  setInterval(pollStatus, 2000);
  setInterval(() => {
    if (state.activeTab === 'step4') pollLogs();
  }, 2500);
});

// Export functions directly to global window object so inline HTML onclick attributes work 100%
Object.assign(window, {
  state,
  TRANSLATIONS,
  PRESETS,
  ERROR_MAP,
  translateError,
  t,
  setLanguage,
  apiCall,
  switchTab,
  showToast,
  triggerTestHID,
  updateDeviceTelemetry,
  updateStatusBadge,
  pollStatus,
  fetchStatus,
  renderPresets,
  renderPresetPreview,
  applySelectedPreset,
  fetchFingers,
  renderHandMap,
  renderSlotGrid,
  startEnrollment,
  cancelEnrollment,
  simulateTouch,
  deleteSlot,
  openEditModal,
  hideEditModal,
  saveSlotEdit,
  pollLogs,
  renderLogs,
  clearLogs,
  pingTest,
  exportLogs
});

window.TouchPass = window;
