/**
 * TouchPass Portal - Core Application & i18n Engine
 * Version: 2.0 (Redesign)
 */

// 1. TRANSLATIONS DICTIONARY
const TRANSLATIONS = {
  en: {
    brandTitle: "TouchPass Portal",
    eyebrow: "ESP32-S3 · ZW101",
    statusConnected: "🟢 Connected",
    statusDisconnected: "🔴 Disconnected",
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
    cancelEnrollBtn: "Cancel Enrollment",
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

    // Notifications & Statuses
    testSuccess: "USB HID keystroke test sent!",
    testFailed: "HID test failed: ",
    presetApplied: "Preset applied successfully!",
    slotSaved: "Slot configuration saved.",
    slotDeleted: "Fingerprint deleted.",
    enrollStarted: "Enrollment started.",
    enrollSuccess: "Fingerprint enrolled successfully!",
    enrollFailed: "Enrollment failed.",
    logsCleared: "Console logs cleared.",
    pingSuccess: "Ping test sent!",
    pingFailed: "Ping test failed: ",
    statusEnrolled: "Enrolled",
    statusUnenrolled: "Unenrolled",
    fingerThumb: "Thumb",
    fingerIndex: "Index",
    fingerMiddle: "Middle",
    fingerRing: "Ring",
    fingerPinky: "Pinky"
  },
  ru: {
    brandTitle: "Портал TouchPass",
    eyebrow: "ESP32-S3 · ZW101",
    statusConnected: "🟢 Подключено",
    statusDisconnected: "🔴 Отключено",
    step1Title: "🚀 1. Настройка и прошивка",
    step2Title: "📋 2. Пресеты",
    step3Title: "🖐️ 3. Biometric Studio",
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
    cancelEnrollBtn: "Отмена регистрации",
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

    // Notifications & Statuses
    testSuccess: "Тест ввода USB HID отправлен!",
    testFailed: "Ошибка теста HID: ",
    presetApplied: "Пресет успешно применен!",
    slotSaved: "Настройки слота сохранены.",
    slotDeleted: "Отпечаток удален.",
    enrollStarted: "Регистрация начата.",
    enrollSuccess: "Отпечаток успешно зарегистрирован!",
    enrollFailed: "Ошибка регистрации.",
    logsCleared: "Логи очищены.",
    pingSuccess: "Тест Ping отправлен!",
    pingFailed: "Ошибка Ping: ",
    statusEnrolled: "Зарегистрировано",
    statusUnenrolled: "Не зарегистрировано",
    fingerThumb: "Большой",
    fingerIndex: "Указательный",
    fingerMiddle: "Средний",
    fingerRing: "Безымянный",
    fingerPinky: "Мизинец"
  },
  vi: {
    brandTitle: "TouchPass Portal",
    eyebrow: "ESP32-S3 · ZW101",
    statusConnected: "🟢 Đã kết nối",
    statusDisconnected: "🔴 Chưa kết nối",
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
    cancelEnrollBtn: "Hủy đăng ký",
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

    // Notifications & Statuses
    testSuccess: "Đã gửi lệnh gõ thử USB HID!",
    testFailed: "Lỗi gõ thử HID: ",
    presetApplied: "Đã áp dụng Preset thành công!",
    slotSaved: "Đã lưu cấu hình Slot.",
    slotDeleted: "Đã xóa vân tay.",
    enrollStarted: "Bắt đầu đăng ký vân tay.",
    enrollSuccess: "Đăng ký vân tay thành công!",
    enrollFailed: "Đăng ký thất bại.",
    logsCleared: "Đã xóa log console.",
    pingSuccess: "Đã gửi lệnh Test Ping!",
    pingFailed: "Lỗi Ping: ",
    statusEnrolled: "Đã đăng ký",
    statusUnenrolled: "Chưa có vân tay",
    fingerThumb: "Ngón cái",
    fingerIndex: "Ngón trỏ",
    fingerMiddle: "Ngón giữa",
    fingerRing: "Ngón áp út",
    fingerPinky: "Ngón út"
  }
};

// 2. CORE STATE MANAGEMENT
const state = {
  lang: localStorage.getItem('touchpass_lang') || 'vi',
  csrfToken: '',
  device: { connected: false, sensor: 'unknown', port: null },
  fingers: [],
  logs: [],
  activeTab: 'step1',
  selectedPreset: 'ai_dev'
};

// 3. i18n TRANSLATION ENGINE
function t(key, fallback = '') {
  return TRANSLATIONS[state.lang]?.[key] || TRANSLATIONS.en?.[key] || fallback || key;
}

function setLanguage(lang) {
  if (!TRANSLATIONS[lang]) return;
  state.lang = lang;
  localStorage.setItem('touchpass_lang', lang);

  // Update active state on language switcher buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  // Translate all elements with data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (key) {
      el.textContent = t(key, el.textContent);
    }
  });

  // Translate all elements with data-i18n-placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (key) {
      el.placeholder = t(key, el.placeholder);
    }
  });

  // Re-render components if available
  if (typeof renderPresetPreview === 'function') renderPresetPreview();
  if (typeof renderHandMap === 'function') renderHandMap();
  if (state.device) updateStatusBadge(state.device);
}

// 4. API COMMUNICATION LAYER
async function apiCall(path, method = 'GET', body = null) {
  const options = {
    method: method.toUpperCase(),
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (['POST', 'PUT', 'DELETE'].includes(options.method) && state.csrfToken) {
    options.headers['X-CSRF-Token'] = state.csrfToken;
  }

  if (body !== null && body !== undefined) {
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(path, options);
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || `HTTP ${response.status}`);
    }
    return payload;
  } catch (err) {
    console.error(`API Call Error (${options.method} ${path}):`, err);
    throw err;
  }
}

// Backward compatibility helper wrapper
async function api(path, options = {}) {
  const method = options.method || 'GET';
  const body = options.body ? options.body : null;
  return apiCall(path, method, body);
}

// 5. TAB SWITCHER
function switchTab(tabId) {
  if (!tabId) return;
  state.activeTab = tabId;
  localStorage.setItem('touchpass_active_tab', tabId);

  // Update step tab buttons
  document.querySelectorAll('.step-tab-btn, .tab-button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  // Update tab content sections
  document.querySelectorAll('.tab-content, .tab-panel').forEach(panel => {
    const isTarget = panel.id === `tab-${tabId}` || panel.dataset.tab === tabId;
    panel.classList.toggle('active', isTarget);
  });
}

// 6. EVENT LISTENER SCAFFOLDING
function initEventListeners() {
  // Language switcher buttons ([data-lang])
  document.querySelectorAll('[data-lang]').forEach(btn => {
    btn.addEventListener('click', () => {
      setLanguage(btn.dataset.lang);
    });
  });

  // Step tab buttons ([data-tab])
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });
}

// 7. HELPER UTILITIES
let toastTimer = null;
function showToast(message, type = 'info') {
  const toast = document.querySelector('#toast');
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast visible toast-${type}`;

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('visible');
  }, 3000);
}

// Device Status Badge Updates
function updateStatusBadge(device) {
  state.device = device;
  const badge = document.querySelector('#device-status');
  const text = document.querySelector('#device-status-text');
  const telemetryStatus = document.querySelector('#telemetry-status');
  const telemetryPort = document.querySelector('#telemetry-port');
  const telemetrySensor = document.querySelector('#telemetry-sensor');

  if (!badge || !text) return;

  const isHid = device.port?.includes('USB HID');

  if (device.connected && device.sensor === 'ok') {
    badge.className = 'status-pill status-online';
    text.textContent = isHid
      ? `${t('statusConnected')} (USB HID · ${device.port})`
      : `${t('statusConnected')} (${device.port || 'ESP32-S3'})`;
  } else if (device.connected) {
    badge.className = 'status-pill status-warning';
    text.textContent = `🟡 ESP32 Connected (ZW101 ${device.sensor})`;
  } else {
    badge.className = 'status-pill status-offline';
    text.textContent = t('statusDisconnected');
  }

  if (telemetryStatus) {
    telemetryStatus.textContent = device.connected ? (isHid ? 'Connected (USB HID)' : 'Connected') : 'Offline';
  }
  if (telemetryPort) {
    telemetryPort.textContent = device.port || 'N/A';
  }
  if (telemetrySensor) {
    telemetrySensor.textContent = device.sensor === 'ok' ? 'OK (ZW101)' : (device.sensor || 'Offline');
  }
}

async function fetchStatus() {
  try {
    const data = await apiCall('/api/status');
    if (data.csrf_token) {
      state.csrfToken = data.csrf_token;
    }
    if (data.device) {
      updateStatusBadge(data.device);
    }
    return data;
  } catch (err) {
    updateStatusBadge({ connected: false, sensor: 'offline', port: null });
  }
}

// Initial Boot Scaffolding
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  setLanguage(state.lang);
  const savedTab = localStorage.getItem('touchpass_active_tab') || 'step1';
  switchTab(savedTab);
  fetchStatus();
  setInterval(fetchStatus, 3000);
});

// Export globally for browser console debugging / window scope
window.TouchPass = {
  state,
  TRANSLATIONS,
  t,
  setLanguage,
  apiCall,
  switchTab,
  showToast,
  fetchStatus
};
