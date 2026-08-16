export type ActionType = 'ai_accept' | 'password' | 'enter' | 'escape' | 'custom' | 'disabled';
export type Hand = 'left' | 'right';
export type TouchStatus = 'armed' | 'executed';
export type SensorStatus = 'ok' | 'error' | 'checking' | 'bootloader' | 'unavailable';
export type WorkerStatus = 'starting' | 'running' | 'unavailable';
export type ValidationCode = 'secret_required' | 'password_ascii' | 'custom_required' | 'custom_ascii';
export type CommandErrorCode =
  | 'invalid_finger'
  | 'secret_required'
  | 'invalid_password'
  | 'invalid_custom_payload'
  | 'hardware_unavailable'
  | 'device_configuration_failed'
  | 'persistence_failed'
  | 'internal';

export interface FingerProfile {
  id: number;
  hand: Hand;
  configured: boolean;
  actionType: ActionType;
  requireConfirm: boolean;
  secretConfigured: boolean;
  secretRef?: string;
  customPayload?: string;
}

export interface AppStatusResponse {
  connected: boolean;
  port?: string;
  deviceId?: string;
  sensorStatus: SensorStatus;
  firmwareMode: string;
  fingerprintCount: number;
  hidKeyConfigured: boolean;
  hidConfigurationSupported: boolean;
  localPairingKeyConfigured: boolean;
  pairingInDoubt: boolean;
  backgroundWorker: WorkerStatus;
}

export interface DeviceStatusChange {
  connected: boolean;
  port?: string;
  sensorStatus: SensorStatus;
  firmwareMode: string;
  hidKeyConfigured: boolean;
  hidConfigurationSupported: boolean;
  localPairingKeyConfigured: boolean;
  pairingInDoubt: boolean;
}

export interface EnrollStepProgress {
  fingerId: number;
  step: number;
  total: number;
  message?: string;
}

export interface FingerTouchEvent {
  fingerId: number;
  actionType: ActionType;
  status: TouchStatus;
}

export interface CommandError {
  code: CommandErrorCode;
  detail?: string;
}

export function defaultProfiles(): FingerProfile[] {
  return Array.from({ length: 10 }, (_, index) => ({
    id: index + 1,
    hand: index < 5 ? 'left' : 'right',
    configured: false,
    actionType: 'enter',
    requireConfirm: true,
    secretConfigured: false
  }));
}

export function previewProfiles(): FingerProfile[] {
  return defaultProfiles().map((profile) => {
    if (profile.id === 2) return { ...profile, configured: true, actionType: 'ai_accept' };
    if (profile.id === 7) return { ...profile, configured: true, actionType: 'password', secretConfigured: true };
    return profile;
  });
}

export function defaultStatus(): AppStatusResponse {
  return {
    connected: false,
    sensorStatus: 'unavailable',
    firmwareMode: 'unknown',
    fingerprintCount: 0,
    hidKeyConfigured: false,
    hidConfigurationSupported: false,
    localPairingKeyConfigured: false,
    pairingInDoubt: false,
    backgroundWorker: 'starting'
  };
}

export function validateActionDraft(args: {
  actionType: ActionType;
  customPayload?: string;
  secret?: string;
  secretConfigured?: boolean;
}): ValidationCode | undefined {
  if (args.actionType === 'password') {
    if (!args.secretConfigured && !args.secret) return 'secret_required';
    if (args.secret && (!isAscii(args.secret) || args.secret.length > 128)) return 'password_ascii';
  }

  if (args.actionType === 'custom') {
    const payload = args.customPayload?.trim() ?? '';
    if (!payload) return 'custom_required';
    if (!isAscii(payload) || payload.length > 128) return 'custom_ascii';
  }

  return undefined;
}

function isAscii(value: string): boolean {
  return /^[\x00-\x7F]*$/.test(value);
}
