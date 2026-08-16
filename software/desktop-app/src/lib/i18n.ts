import type { ActionType, CommandErrorCode, SensorStatus, ValidationCode, WorkerStatus } from './types';

export type Locale = 'vi' | 'en' | 'zh-CN';
type Params = Record<string, string | number>;

const vi = {
  'toolbar.deviceReady': 'Thiết bị sẵn sàng',
  'toolbar.findingDevice': 'Đang tìm thiết bị',
  'toolbar.checkingDevice': 'Đang kiểm tra thiết bị',
  'toolbar.bootloader': 'Thiết bị ở chế độ nạp',
  'toolbar.sensorError': 'Cảm biến cần xử lý',
  'toolbar.settings': 'Cài đặt',
  'toolbar.help': 'Hướng dẫn nhanh',
  'main.title': 'Cấu hình ngón tay',
  'main.subtitle': 'Gán một tác vụ cho mỗi ngón. Mọi dữ liệu đều được xử lý cục bộ.',
  'main.configuredCount': 'Đã cấu hình {count}/10',
  'main.loading': 'Đang tải cấu hình…',
  'main.loadError': 'Không thể tải trạng thái TouchPass.',
  'main.retry': 'Thử lại',
  'device.disconnectedTitle': 'Chưa kết nối thiết bị',
  'device.disconnectedDescription': 'Bạn vẫn có thể chuẩn bị tác vụ. Hãy kết nối TouchPass trước khi quét hoặc thử.',
  'device.checkingTitle': 'Đang kiểm tra TouchPass',
  'device.checkingDescription': 'Vui lòng chờ trong khi ứng dụng xác nhận cảm biến vân tay.',
  'device.bootloaderTitle': 'TouchPass đang ở chế độ nạp',
  'device.bootloaderDescription': 'Nhả nút BOOT rồi khởi động lại thiết bị để quay về chế độ sử dụng.',
  'device.sensorErrorTitle': 'Cảm biến vân tay chưa sẵn sàng',
  'device.sensorErrorDescription': 'Kiểm tra cáp cảm biến rồi làm mới trạng thái trong Cài đặt.',
  'handMap.title': 'Bản đồ ngón tay',
  'handMap.description': 'Chọn một ngón để cấu hình hoặc quét lại vân tay.',
  'hand.left': 'Tay trái',
  'hand.right': 'Tay phải',
  'finger.configured': 'Đã cài',
  'finger.unconfigured': 'Chưa cài',
  'finger.selectedDescription': 'Chọn tác vụ, lưu và quét vân tay để bắt đầu.',
  'action.ai_accept.label': 'Đồng ý AI',
  'action.ai_accept.description': "Tự động gõ 'y' rồi nhấn Enter khi trợ lý AI yêu cầu.",
  'action.password.label': 'Điền mật khẩu',
  'action.password.description': 'Điền mật khẩu từ kho thông tin bảo mật của hệ điều hành.',
  'action.enter.label': 'Phím Enter',
  'action.enter.description': 'Gửi phím Enter tới cửa sổ đang hoạt động.',
  'action.escape.label': 'Phím Escape',
  'action.escape.description': 'Thoát hộp thoại hoặc hủy thao tác hiện tại.',
  'action.custom.label': 'Phím tắt tùy chọn',
  'action.custom.description': 'Gõ một chuỗi phím tắt hoặc văn bản tùy chọn.',
  'action.disabled.label': 'Tắt hành động',
  'action.disabled.description': 'Không thực hiện hành động khi chạm ngón này.',
  'field.password': 'Mật khẩu máy tính',
  'field.passwordStored': 'Đã lưu an toàn. Nhập mật khẩu mới để thay đổi.',
  'field.passwordPlaceholder': 'Nhập mật khẩu ASCII',
  'field.custom': 'Chuỗi phím tắt',
  'field.customPlaceholder': 'Ví dụ: /approve',
  'field.confirm': 'Chạm hai lần để xác nhận',
  'field.confirmDescription': 'Giảm rủi ro kích hoạt nhầm khi đang làm việc.',
  'button.saveAndEnroll': 'Lưu và quét vân tay',
  'button.saveChanges': 'Lưu thay đổi',
  'button.more': 'Thêm',
  'button.test': 'Thử hành động',
  'button.rescan': 'Quét lại vân tay',
  'button.disable': 'Tắt hành động',
  'button.delete': 'Xóa vân tay',
  'button.cancel': 'Hủy',
  'button.close': 'Đóng',
  'button.confirmDelete': 'Xóa vân tay',
  'delete.title': 'Xóa vân tay này?',
  'delete.description': 'Tác vụ đã gán và dữ liệu vân tay sẽ bị xóa khỏi thiết bị.',
  'validation.secret_required': 'Nhập mật khẩu trước khi lưu tác vụ này.',
  'validation.password_ascii': 'Mật khẩu phải là ASCII và không quá 128 ký tự.',
  'validation.custom_required': 'Nhập chuỗi phím tắt trước khi lưu.',
  'validation.custom_ascii': 'Chuỗi phím tắt phải là ASCII và không quá 128 ký tự.',
  'settings.title': 'Cài đặt',
  'settings.subtitle': 'Tùy chỉnh ngôn ngữ, khởi động và xem trạng thái thiết bị.',
  'settings.language': 'Ngôn ngữ',
  'settings.languageDescription': 'Giao diện và menu khay hệ thống sẽ cập nhật ngay lập tức.',
  'locale.vi': 'Tiếng Việt',
  'locale.en': 'English',
  'locale.zh-CN': '简体中文',
  'settings.device': 'Thiết bị',
  'settings.connected': 'Đã kết nối',
  'settings.searching': 'Đang tìm kiếm',
  'settings.port': 'Cổng',
  'settings.firmware': 'Phần mềm thiết bị',
  'settings.sensor': 'Cảm biến',
  'settings.localSecurity': 'Bảo mật cục bộ',
  'settings.localSecurityDescription': 'Không dùng đám mây, không đồng bộ ra ngoài máy.',
  'settings.autostart': 'Mở TouchPass khi đăng nhập',
  'settings.autostartUnavailable': 'Tùy chọn này chỉ khả dụng trong ứng dụng desktop.',
  'settings.developer': 'Thông tin chẩn đoán',
  'settings.developerDescription': 'Ẩn mặc định để giữ giao diện gọn gàng.',
  'settings.worker': 'Tiến trình nền',
  'settings.fingerprintCount': 'Số vân tay',
  'settings.hidKeyConfigured': 'Khóa HID đã cấu hình',
  'settings.refresh': 'Làm mới trạng thái',
  'common.yes': 'Có',
  'common.no': 'Không',
  'scan.title': 'Quét vân tay',
  'scan.doneTitle': 'Đã liên kết vân tay',
  'scan.linking': 'Đang liên kết với {finger}',
  'scan.placeFinger': 'Đặt ngón tay lên cảm biến…',
  'scan.touchAgain': 'Nhấc ngón tay ra rồi chạm lại…',
  'scan.complete': 'Hoàn tất!',
  'scan.step': 'Bước {step}/{total}',
  'hud.sensorMissing': 'Không thể quét: chưa tìm thấy cảm biến vân tay.',
  'hud.fingerprintReady': 'Vân tay đã sẵn sàng.',
  'hud.touchAgain': 'Chạm lại để chạy {action}',
  'hud.actionExecuted': 'Đã chạy {action}',
  'hud.saved': 'Đã lưu {action} cho {finger}.',
  'hud.deleted': 'Đã xóa cấu hình ngón tay.',
  'hud.placeFinger': 'Đặt ngón tay lên cảm biến.',
  'hud.testPrompt': 'Chạm {finger} lên cảm biến để thử {action}.',
  'hud.refreshed': 'Đã làm mới trạng thái thiết bị.',
  'error.invalid_finger': 'Ngón tay không hợp lệ.',
  'error.secret_required': 'Tác vụ này cần mật khẩu đã lưu.',
  'error.invalid_password': 'Mật khẩu không hợp lệ.',
  'error.invalid_custom_payload': 'Chuỗi phím tắt không hợp lệ.',
  'error.hardware_unavailable': 'Thiết bị hiện không khả dụng.',
  'error.persistence_failed': 'Không thể lưu dữ liệu cục bộ.',
  'error.internal': 'Đã xảy ra lỗi. Hãy thử lại.',
  'status.sensor.ok': 'Sẵn sàng',
  'status.sensor.error': 'Có lỗi',
  'status.sensor.checking': 'Đang kiểm tra',
  'status.sensor.bootloader': 'Chế độ nạp',
  'status.sensor.unavailable': 'Không khả dụng',
  'status.worker.starting': 'Đang khởi động',
  'status.worker.running': 'Đang chạy',
  'status.worker.unavailable': 'Không khả dụng',
  'status.firmware.hid': 'Bàn phím HID',
  'status.firmware.checking': 'Đang kiểm tra',
  'status.firmware.bootloader': 'Chế độ nạp',
  'status.firmware.unknown': 'Chưa xác định',
  'help.title': 'Thiết lập trong ba bước',
  'help.step1': 'Chọn ngón tay và tác vụ mong muốn.',
  'help.step2': 'Lưu cấu hình và quét vân tay.',
  'help.step3': 'Chạm vân tay để chạy tác vụ ngay.'
} as const;

type TranslationKey = keyof typeof vi;

const en: Record<TranslationKey, string> = {
  'toolbar.deviceReady': 'Device ready', 'toolbar.findingDevice': 'Looking for device', 'toolbar.checkingDevice': 'Checking device', 'toolbar.bootloader': 'Device in bootloader mode', 'toolbar.sensorError': 'Sensor needs attention', 'toolbar.settings': 'Settings', 'toolbar.help': 'Quick guide',
  'main.title': 'Finger configuration', 'main.subtitle': 'Assign one action to each finger. All data is processed locally.', 'main.configuredCount': '{count}/10 configured', 'main.loading': 'Loading configuration…', 'main.loadError': 'Could not load TouchPass status.', 'main.retry': 'Try again',
  'device.disconnectedTitle': 'Device not connected', 'device.disconnectedDescription': 'You can still prepare actions. Connect TouchPass before enrolling or testing.', 'device.checkingTitle': 'Checking TouchPass', 'device.checkingDescription': 'Wait while the app verifies the fingerprint sensor.', 'device.bootloaderTitle': 'TouchPass is in bootloader mode', 'device.bootloaderDescription': 'Release BOOT and restart the device to return to normal operation.', 'device.sensorErrorTitle': 'Fingerprint sensor is not ready', 'device.sensorErrorDescription': 'Check the sensor cable, then refresh status in Settings.',
  'handMap.title': 'Finger map', 'handMap.description': 'Select a finger to configure it or enroll it again.', 'hand.left': 'Left hand', 'hand.right': 'Right hand',
  'finger.configured': 'Configured', 'finger.unconfigured': 'Not configured', 'finger.selectedDescription': 'Choose an action, save it, and enroll your fingerprint to begin.',
  'action.ai_accept.label': 'Approve AI', 'action.ai_accept.description': "Types 'y' and presses Enter when an AI assistant asks.", 'action.password.label': 'Fill password', 'action.password.description': 'Fills a password from the operating system credential vault.', 'action.enter.label': 'Enter key', 'action.enter.description': 'Sends Enter to the active window.', 'action.escape.label': 'Escape key', 'action.escape.description': 'Closes a dialog or cancels the current operation.', 'action.custom.label': 'Custom shortcut', 'action.custom.description': 'Types a custom shortcut sequence or text.', 'action.disabled.label': 'Disable action', 'action.disabled.description': 'Does nothing when this finger is touched.',
  'field.password': 'Computer password', 'field.passwordStored': 'Stored securely. Enter a new password to replace it.', 'field.passwordPlaceholder': 'Enter an ASCII password', 'field.custom': 'Shortcut sequence', 'field.customPlaceholder': 'Example: /approve', 'field.confirm': 'Touch twice to confirm', 'field.confirmDescription': 'Reduces accidental activation while you work.',
  'button.saveAndEnroll': 'Save and enroll fingerprint', 'button.saveChanges': 'Save changes', 'button.more': 'More', 'button.test': 'Test action', 'button.rescan': 'Enroll fingerprint again', 'button.disable': 'Disable action', 'button.delete': 'Delete fingerprint', 'button.cancel': 'Cancel', 'button.close': 'Close', 'button.confirmDelete': 'Delete fingerprint',
  'delete.title': 'Delete this fingerprint?', 'delete.description': 'The assigned action and fingerprint data will be removed from the device.',
  'validation.secret_required': 'Enter a password before saving this action.', 'validation.password_ascii': 'The password must be ASCII and at most 128 characters.', 'validation.custom_required': 'Enter a shortcut sequence before saving.', 'validation.custom_ascii': 'The shortcut must be ASCII and at most 128 characters.',
  'settings.title': 'Settings', 'settings.subtitle': 'Choose a language, startup behavior, and view device status.', 'settings.language': 'Language', 'settings.languageDescription': 'The interface and system tray menu update immediately.', 'locale.vi': 'Tiếng Việt', 'locale.en': 'English', 'locale.zh-CN': '简体中文', 'settings.device': 'Device', 'settings.connected': 'Connected', 'settings.searching': 'Searching', 'settings.port': 'Port', 'settings.firmware': 'Firmware', 'settings.sensor': 'Sensor', 'settings.localSecurity': 'Local security', 'settings.localSecurityDescription': 'No cloud and no synchronization outside this computer.', 'settings.autostart': 'Open TouchPass at login', 'settings.autostartUnavailable': 'This option is only available in the desktop app.', 'settings.developer': 'Diagnostic information', 'settings.developerDescription': 'Hidden by default to keep the interface focused.', 'settings.worker': 'Background worker', 'settings.fingerprintCount': 'Fingerprints', 'settings.hidKeyConfigured': 'HID key configured', 'settings.refresh': 'Refresh status', 'common.yes': 'Yes', 'common.no': 'No',
  'scan.title': 'Enroll fingerprint', 'scan.doneTitle': 'Fingerprint linked', 'scan.linking': 'Linking {finger}', 'scan.placeFinger': 'Place your finger on the sensor…', 'scan.touchAgain': 'Lift your finger and touch again…', 'scan.complete': 'Complete!', 'scan.step': 'Step {step}/{total}',
  'hud.sensorMissing': 'Cannot enroll: fingerprint sensor not found.', 'hud.fingerprintReady': 'Fingerprint is ready.', 'hud.touchAgain': 'Touch again to run {action}', 'hud.actionExecuted': 'Ran {action}', 'hud.saved': 'Saved {action} for {finger}.', 'hud.deleted': 'Finger configuration deleted.', 'hud.placeFinger': 'Place your finger on the sensor.', 'hud.testPrompt': 'Touch {finger} on the sensor to test {action}.', 'hud.refreshed': 'Device status refreshed.',
  'error.invalid_finger': 'Invalid finger.', 'error.secret_required': 'This action requires a stored password.', 'error.invalid_password': 'Invalid password.', 'error.invalid_custom_payload': 'Invalid shortcut sequence.', 'error.hardware_unavailable': 'The device is unavailable.', 'error.persistence_failed': 'Could not save local data.', 'error.internal': 'Something went wrong. Try again.',
  'status.sensor.ok': 'Ready', 'status.sensor.error': 'Error', 'status.sensor.checking': 'Checking', 'status.sensor.bootloader': 'Bootloader mode', 'status.sensor.unavailable': 'Unavailable', 'status.worker.starting': 'Starting', 'status.worker.running': 'Running', 'status.worker.unavailable': 'Unavailable',
  'status.firmware.hid': 'HID keyboard', 'status.firmware.checking': 'Checking', 'status.firmware.bootloader': 'Bootloader mode', 'status.firmware.unknown': 'Unknown',
  'help.title': 'Set up in three steps', 'help.step1': 'Choose a finger and the action you want.', 'help.step2': 'Save the configuration and enroll your fingerprint.', 'help.step3': 'Touch the sensor to run the action immediately.'
};

const zhCN: Record<TranslationKey, string> = {
  'toolbar.deviceReady': '设备已就绪', 'toolbar.findingDevice': '正在查找设备', 'toolbar.checkingDevice': '正在检查设备', 'toolbar.bootloader': '设备处于引导模式', 'toolbar.sensorError': '传感器需要处理', 'toolbar.settings': '设置', 'toolbar.help': '快速指南',
  'main.title': '指纹配置', 'main.subtitle': '为每个手指分配一个操作。所有数据均在本地处理。', 'main.configuredCount': '已配置 {count}/10', 'main.loading': '正在加载配置…', 'main.loadError': '无法加载 TouchPass 状态。', 'main.retry': '重试',
  'device.disconnectedTitle': '设备未连接', 'device.disconnectedDescription': '仍可以先设置操作。录入或测试前请连接 TouchPass。', 'device.checkingTitle': '正在检查 TouchPass', 'device.checkingDescription': '请稍候，应用正在确认指纹传感器状态。', 'device.bootloaderTitle': 'TouchPass 处于引导模式', 'device.bootloaderDescription': '松开 BOOT 按钮并重启设备以恢复正常模式。', 'device.sensorErrorTitle': '指纹传感器未就绪', 'device.sensorErrorDescription': '请检查传感器线缆，然后在设置中刷新状态。',
  'handMap.title': '手指映射', 'handMap.description': '选择手指以进行配置或重新录入。', 'hand.left': '左手', 'hand.right': '右手',
  'finger.configured': '已配置', 'finger.unconfigured': '未配置', 'finger.selectedDescription': '选择操作，保存并录入指纹即可开始。',
  'action.ai_accept.label': '确认 AI', 'action.ai_accept.description': "AI 助手询问时自动输入 'y' 并按 Enter。", 'action.password.label': '填充密码', 'action.password.description': '从操作系统凭据库中填充密码。', 'action.enter.label': 'Enter 键', 'action.enter.description': '向当前活动窗口发送 Enter 键。', 'action.escape.label': 'Escape 键', 'action.escape.description': '关闭对话框或取消当前操作。', 'action.custom.label': '自定义快捷键', 'action.custom.description': '输入自定义快捷键序列或文本。', 'action.disabled.label': '禁用操作', 'action.disabled.description': '触摸此手指时不执行任何操作。',
  'field.password': '电脑密码', 'field.passwordStored': '已安全保存。输入新密码即可替换。', 'field.passwordPlaceholder': '输入 ASCII 密码', 'field.custom': '快捷键序列', 'field.customPlaceholder': '例如：/approve', 'field.confirm': '触摸两次以确认', 'field.confirmDescription': '减少工作时意外触发。',
  'button.saveAndEnroll': '保存并录入指纹', 'button.saveChanges': '保存更改', 'button.more': '更多', 'button.test': '测试操作', 'button.rescan': '重新录入指纹', 'button.disable': '禁用操作', 'button.delete': '删除指纹', 'button.cancel': '取消', 'button.close': '关闭', 'button.confirmDelete': '删除指纹',
  'delete.title': '删除此指纹？', 'delete.description': '分配的操作和指纹数据将从设备中删除。',
  'validation.secret_required': '保存此操作前请输入密码。', 'validation.password_ascii': '密码必须为 ASCII，且不超过 128 个字符。', 'validation.custom_required': '保存前请输入快捷键序列。', 'validation.custom_ascii': '快捷键必须为 ASCII，且不超过 128 个字符。',
  'settings.title': '设置', 'settings.subtitle': '选择语言、启动方式并查看设备状态。', 'settings.language': '语言', 'settings.languageDescription': '界面和系统托盘菜单将立即更新。', 'locale.vi': 'Tiếng Việt', 'locale.en': 'English', 'locale.zh-CN': '简体中文', 'settings.device': '设备', 'settings.connected': '已连接', 'settings.searching': '正在搜索', 'settings.port': '端口', 'settings.firmware': '固件', 'settings.sensor': '传感器', 'settings.localSecurity': '本地安全', 'settings.localSecurityDescription': '不使用云端，不同步到此电脑之外。', 'settings.autostart': '登录时打开 TouchPass', 'settings.autostartUnavailable': '此选项仅在桌面应用中可用。', 'settings.developer': '诊断信息', 'settings.developerDescription': '默认隐藏，以保持界面简洁。', 'settings.worker': '后台进程', 'settings.fingerprintCount': '指纹数量', 'settings.hidKeyConfigured': 'HID 密钥已配置', 'settings.refresh': '刷新状态', 'common.yes': '是', 'common.no': '否',
  'scan.title': '录入指纹', 'scan.doneTitle': '指纹已关联', 'scan.linking': '正在关联 {finger}', 'scan.placeFinger': '请将手指放在传感器上…', 'scan.touchAgain': '抬起手指后再次触摸…', 'scan.complete': '完成！', 'scan.step': '第 {step}/{total} 步',
  'hud.sensorMissing': '无法录入：未找到指纹传感器。', 'hud.fingerprintReady': '指纹已就绪。', 'hud.touchAgain': '再次触摸以执行 {action}', 'hud.actionExecuted': '已执行 {action}', 'hud.saved': '已为 {finger} 保存 {action}。', 'hud.deleted': '已删除手指配置。', 'hud.placeFinger': '请将手指放在传感器上。', 'hud.testPrompt': '请触摸 {finger} 以测试 {action}。', 'hud.refreshed': '设备状态已刷新。',
  'error.invalid_finger': '手指无效。', 'error.secret_required': '此操作需要已保存的密码。', 'error.invalid_password': '密码无效。', 'error.invalid_custom_payload': '快捷键序列无效。', 'error.hardware_unavailable': '设备当前不可用。', 'error.persistence_failed': '无法保存本地数据。', 'error.internal': '出现错误，请重试。',
  'status.sensor.ok': '已就绪', 'status.sensor.error': '错误', 'status.sensor.checking': '正在检查', 'status.sensor.bootloader': '引导加载模式', 'status.sensor.unavailable': '不可用', 'status.worker.starting': '正在启动', 'status.worker.running': '正在运行', 'status.worker.unavailable': '不可用',
  'status.firmware.hid': 'HID 键盘', 'status.firmware.checking': '正在检查', 'status.firmware.bootloader': '引导加载模式', 'status.firmware.unknown': '未知',
  'help.title': '三步完成设置', 'help.step1': '选择手指和所需操作。', 'help.step2': '保存配置并录入指纹。', 'help.step3': '触摸传感器即可立即执行操作。'
};

export const translations: Record<Locale, Record<TranslationKey, string>> = { vi, en, 'zh-CN': zhCN };

export function resolveLocale(value?: string | null): Locale {
  const normalized = value?.toLowerCase() ?? '';
  if (normalized.startsWith('en')) return 'en';
  if (normalized.startsWith('zh')) return 'zh-CN';
  if (normalized.startsWith('vi')) return 'vi';
  return 'vi';
}

export function translate(locale: Locale, key: TranslationKey, params: Params = {}): string {
  return Object.entries(params).reduce((message, [name, value]) => message.replaceAll(`{${name}}`, String(value)), translations[locale][key]);
}

const fingerNames = [
  ['Ngón cái trái', 'Left thumb', '左手拇指'], ['Ngón trỏ trái', 'Left index finger', '左手食指'],
  ['Ngón giữa trái', 'Left middle finger', '左手中指'], ['Ngón áp út trái', 'Left ring finger', '左手无名指'],
  ['Ngón út trái', 'Left little finger', '左手小指'], ['Ngón cái phải', 'Right thumb', '右手拇指'],
  ['Ngón trỏ phải', 'Right index finger', '右手食指'], ['Ngón giữa phải', 'Right middle finger', '右手中指'],
  ['Ngón áp út phải', 'Right ring finger', '右手无名指'], ['Ngón út phải', 'Right little finger', '右手小指']
] as const;

export function fingerName(locale: Locale, id: number): string {
  const item = fingerNames[Math.max(1, Math.min(10, id)) - 1];
  return item[locale === 'vi' ? 0 : locale === 'en' ? 1 : 2];
}

export function actionLabel(locale: Locale, actionType: ActionType): string {
  return translate(locale, `action.${actionType}.label` as TranslationKey);
}

export function actionDescription(locale: Locale, actionType: ActionType): string {
  return translate(locale, `action.${actionType}.description` as TranslationKey);
}

export function validationMessage(locale: Locale, code?: ValidationCode): string | undefined {
  return code ? translate(locale, `validation.${code}` as TranslationKey) : undefined;
}

export function commandErrorMessage(locale: Locale, code: CommandErrorCode = 'internal'): string {
  return translate(locale, `error.${code}` as TranslationKey);
}

export function sensorStatusLabel(locale: Locale, status: SensorStatus): string {
  return translate(locale, `status.sensor.${status}` as TranslationKey);
}

export function toolbarStatusLabel(locale: Locale, status: SensorStatus): string {
  const key = status === 'ok'
    ? 'toolbar.deviceReady'
    : status === 'checking'
      ? 'toolbar.checkingDevice'
      : status === 'bootloader'
        ? 'toolbar.bootloader'
        : status === 'error'
          ? 'toolbar.sensorError'
          : 'toolbar.findingDevice';
  return translate(locale, key);
}

export function deviceGuidance(locale: Locale, status: SensorStatus): { title: string; description: string } {
  const prefix = status === 'checking'
    ? 'device.checking'
    : status === 'bootloader'
      ? 'device.bootloader'
      : status === 'error'
        ? 'device.sensorError'
        : 'device.disconnected';
  return {
    title: translate(locale, `${prefix}Title` as TranslationKey),
    description: translate(locale, `${prefix}Description` as TranslationKey)
  };
}

export function workerStatusLabel(locale: Locale, status: WorkerStatus): string {
  return translate(locale, `status.worker.${status}` as TranslationKey);
}

export function firmwareModeLabel(locale: Locale, mode: string): string {
  const normalized = ['hid', 'checking', 'bootloader'].includes(mode) ? mode : 'unknown';
  return translate(locale, `status.firmware.${normalized}` as TranslationKey);
}

const enrollmentMessages: Record<Locale, Record<string, string>> = {
  vi: {
    unlock_existing: 'Chạm một vân tay đã đăng ký để mở khóa cấu hình.', touch: 'Đặt ngón tay lên cảm biến…',
    lift: 'Nhấc ngón tay khỏi cảm biến…', touch_again: 'Đặt lại cùng ngón tay lên cảm biến…', stored: 'Vân tay đã được lưu vào cảm biến.',
    timeout: 'Đã hết thời gian quét. Hãy thử lại.', connection_lost: 'Mất kết nối với TouchPass trong khi quét.', serial_write: 'Không thể gửi lệnh tới TouchPass.',
    sensor_unavailable: 'Không tìm thấy cảm biến vân tay.', persistence_failed: 'Không thể lưu trạng thái vân tay. Hãy thử lại.', busy: 'Một thao tác cấu hình khác đang chạy.', unlock_failed: 'Không thể xác thực vân tay đã đăng ký.',
    image_failed: 'Ảnh vân tay chưa đủ rõ. Lau cảm biến và thử lại.', mismatch: 'Hai lần quét chưa phải cùng một ngón tay.', store_failed: 'Cảm biến không thể lưu mẫu vân tay.'
  },
  en: {
    unlock_existing: 'Touch an already enrolled finger to unlock configuration.', touch: 'Place your finger on the sensor…',
    lift: 'Lift your finger from the sensor…', touch_again: 'Place the same finger on the sensor again…', stored: 'The fingerprint was stored on the sensor.',
    timeout: 'Fingerprint enrollment timed out. Try again.', connection_lost: 'Connection to TouchPass was lost during enrollment.', serial_write: 'Could not send a command to TouchPass.',
    sensor_unavailable: 'The fingerprint sensor was not found.', persistence_failed: 'Could not save the fingerprint state. Try again.', busy: 'Another configuration operation is already active.', unlock_failed: 'The enrolled fingerprint could not be verified.',
    image_failed: 'The fingerprint image was unclear. Clean the sensor and try again.', mismatch: 'Use the same finger for both scans.', store_failed: 'The sensor could not store the fingerprint template.'
  },
  'zh-CN': {
    unlock_existing: '请触摸已录入的指纹以解锁配置。', touch: '请将手指放在传感器上…', lift: '请将手指移开…', touch_again: '请再次放置同一根手指…', stored: '指纹已保存到传感器。',
    timeout: '录入已超时，请重试。', connection_lost: '录入过程中与 TouchPass 的连接已断开。', serial_write: '无法向 TouchPass 发送命令。', sensor_unavailable: '未找到指纹传感器。', persistence_failed: '无法保存指纹状态，请重试。',
    busy: '另一个配置操作正在进行。', unlock_failed: '无法验证已录入的指纹。', image_failed: '指纹图像不清晰，请清洁传感器后重试。', mismatch: '两次扫描必须使用同一根手指。', store_failed: '传感器无法保存指纹模板。'
  }
};

export function enrollmentMessage(locale: Locale, code?: string): string {
  const messages = enrollmentMessages[locale];
  if (!code) return messages.touch;
  if (messages[code]) return messages[code];
  if (code.startsWith('config_unlock:') || code === 'config_locked') return messages.unlock_failed;
  if (code.includes('admin operation is already active')) return messages.busy;
  if (code.startsWith('enroll:reg_model:')) return messages.mismatch;
  if (code.startsWith('enroll:store:')) return messages.store_failed;
  if (code.startsWith('enroll:image2tz_')) return messages.image_failed;
  return messages.sensor_unavailable;
}
