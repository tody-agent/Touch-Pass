export type ActionType = 'ai_accept' | 'password' | 'enter' | 'escape' | 'custom' | 'disabled';
export type Hand = 'left' | 'right';
export type TouchStatus = 'armed' | 'executed';

export interface FingerProfile {
  id: number;
  name: string;
  hand: Hand;
  configured: boolean;
  actionType: ActionType;
  label: string;
  description: string;
  icon: string;
  requireConfirm: boolean;
  secretConfigured: boolean;
  secretRef?: string;
  customPayload?: string;
}

export interface AppStatusResponse {
  connected: boolean;
  port?: string;
  deviceId?: string;
  sensorStatus: string;
  firmwareMode: string;
  fingerprintCount: number;
  hidKeyConfigured: boolean;
  backgroundWorker: string;
}

export interface DeviceStatusChange {
  connected: boolean;
  port?: string;
}

export interface EnrollStepProgress {
  fingerId: number;
  step: number;
  total: number;
}

export interface FingerTouchEvent {
  fingerId: number;
  action: string;
  status: TouchStatus;
}

export const actionLabels: Record<ActionType, { label: string; description: string; icon: string }> = {
  ai_accept: {
    label: 'Đồng Ý AI',
    description: "Tự động gõ 'y' + Enter khi trợ lý AI hỏi",
    icon: 'bot'
  },
  password: {
    label: 'Điền Mật Khẩu',
    description: 'Điền mật khẩu máy tính từ kho bảo mật của hệ điều hành',
    icon: 'key'
  },
  enter: {
    label: 'Phím Enter',
    description: 'Gửi phím Enter vào cửa sổ đang focus',
    icon: 'enter'
  },
  escape: {
    label: 'Phím Escape',
    description: 'Thoát hộp thoại hoặc hủy thao tác hiện tại',
    icon: 'escape'
  },
  custom: {
    label: 'Phím Tắt Tự Chọn',
    description: 'Gõ một chuỗi phím tắt hoặc văn bản tự chọn',
    icon: 'wand'
  },
  disabled: {
    label: 'Tắt',
    description: 'Không thực hiện hành động khi chạm ngón này',
    icon: 'disabled'
  }
};

const names = [
  'Ngón Cái Trái',
  'Ngón Trỏ Trái',
  'Ngón Giữa Trái',
  'Ngón Áp Út Trái',
  'Ngón Út Trái',
  'Ngón Cái Phải',
  'Ngón Trỏ Phải',
  'Ngón Giữa Phải',
  'Ngón Áp Út Phải',
  'Ngón Út Phải'
];

export function defaultProfiles(): FingerProfile[] {
  return names.map((name, index) => {
    const preset = actionLabels.enter;
    return {
      id: index + 1,
      name,
      hand: index < 5 ? 'left' : 'right',
      configured: index === 1 || index === 6,
      actionType: index === 1 ? 'ai_accept' : index === 6 ? 'password' : 'enter',
      label: index === 1 ? actionLabels.ai_accept.label : index === 6 ? actionLabels.password.label : preset.label,
      description:
        index === 1
          ? actionLabels.ai_accept.description
          : index === 6
            ? actionLabels.password.description
            : preset.description,
      icon: index === 1 ? actionLabels.ai_accept.icon : index === 6 ? actionLabels.password.icon : preset.icon,
      requireConfirm: true,
      secretConfigured: index === 6
    };
  });
}

export function defaultStatus(): AppStatusResponse {
  return {
    connected: false,
    sensorStatus: 'unavailable',
    firmwareMode: 'unknown',
    fingerprintCount: 0,
    hidKeyConfigured: false,
    backgroundWorker: 'preview'
  };
}

export function validateActionDraft(args: {
  actionType: ActionType;
  customPayload?: string;
  secret?: string;
  secretConfigured?: boolean;
}): string | undefined {
  if (args.actionType === 'password') {
    if (!args.secretConfigured && !args.secret) return 'Nhập mật khẩu trước khi lưu năng lực này';
    if (args.secret && (!isAscii(args.secret) || args.secret.length > 128)) {
      return 'Mật khẩu phải là ASCII và tối đa 128 ký tự';
    }
  }

  if (args.actionType === 'custom') {
    const payload = args.customPayload?.trim() ?? '';
    if (!payload) return 'Nhập chuỗi phím tắt trước khi lưu';
    if (!isAscii(payload) || payload.length > 128) {
      return 'Chuỗi phím tắt phải là ASCII và tối đa 128 ký tự';
    }
  }

  return undefined;
}

function isAscii(value: string): boolean {
  return /^[\x00-\x7F]*$/.test(value);
}
