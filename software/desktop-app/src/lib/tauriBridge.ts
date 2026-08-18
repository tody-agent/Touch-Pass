import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { disable, enable, isEnabled } from '@tauri-apps/plugin-autostart';
import {
  defaultProfiles,
  defaultStatus,
  previewProfiles,
  type AppStatusResponse,
  type CommandError,
  type CommandErrorCode,
  type DeviceStatusChange,
  type EnrollStepProgress,
  type FingerProfile,
  type FingerTouchEvent
} from './types';
import type { Locale } from './i18n';

type Handler<T> = (payload: T) => void;

const mockProfiles = previewProfiles();
const commandErrorCodes = new Set<CommandErrorCode>([
  'invalid_finger',
  'secret_required',
  'invalid_password',
  'invalid_custom_payload',
  'hardware_unavailable',
  'device_configuration_failed',
  'persistence_failed',
  'internal'
]);

export interface AppPreferences {
  locale?: Locale;
}

export interface AutostartApi {
  isEnabled: () => Promise<boolean>;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
}

const defaultAutostartApi: AutostartApi = { isEnabled, enable, disable };

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export async function getAppStatus(): Promise<AppStatusResponse> {
  if (!isTauriRuntime()) {
    return { ...defaultStatus(), connected: true, port: 'Preview USB', sensorStatus: 'ok', backgroundWorker: 'running' };
  }
  return invoke<AppStatusResponse>('get_app_status');
}

export async function getAppPreferences(): Promise<AppPreferences> {
  if (!isTauriRuntime()) return {};
  return invoke<AppPreferences>('get_app_preferences');
}

export async function setAppLocale(locale: Locale): Promise<AppPreferences> {
  if (!isTauriRuntime()) return { locale };
  return invoke<AppPreferences>('set_app_locale', { locale });
}

export async function getAutostartEnabled(api?: AutostartApi): Promise<boolean> {
  if (!api && !isTauriRuntime()) return false;
  return (api ?? defaultAutostartApi).isEnabled();
}

export async function setAutostartEnabled(enabled: boolean, api?: AutostartApi): Promise<void> {
  if (!api && !isTauriRuntime()) return;
  const target = api ?? defaultAutostartApi;
  if (enabled) await target.enable();
  else await target.disable();
}

export function normalizeCommandError(error: unknown): CommandError {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const value = error as { code?: unknown; detail?: unknown };
    if (typeof value.code === 'string' && commandErrorCodes.has(value.code as CommandErrorCode)) {
      return {
        code: value.code as CommandErrorCode,
        detail: typeof value.detail === 'string' ? value.detail : undefined
      };
    }
  }
  return {
    code: 'internal',
    detail: error instanceof Error ? error.message : String(error)
  };
}

export async function listFingerProfiles(): Promise<FingerProfile[]> {
  if (!isTauriRuntime()) {
    return clone(mockProfiles);
  }
  return invoke<FingerProfile[]>('list_finger_profiles');
}

export async function saveFingerProfile(profile: FingerProfile, secret?: string): Promise<FingerProfile> {
  if (!isTauriRuntime()) {
    const index = mockProfiles.findIndex((item) => item.id === profile.id);
    const previous = mockProfiles[index];
    const secretConfigured =
      profile.actionType === 'password'
        ? Boolean(secret || previous?.secretConfigured)
        : profile.actionType === 'disabled'
          ? Boolean(previous?.secretConfigured)
          : false;
    const configured = profile.configured || Boolean(previous?.configured) || profile.actionType !== 'disabled';
    const saved: FingerProfile = {
      ...profile,
      configured,
      secretConfigured
    };
    mockProfiles[index] = saved;
    return clone(saved);
  }
  return invoke<FingerProfile>('save_finger_profile', { profile, secret });
}

export async function resetFingerProfile(fingerId: number, forceLocal?: boolean): Promise<FingerProfile> {
  if (!isTauriRuntime()) {
    const profile = defaultProfiles()[fingerId - 1];
    mockProfiles[fingerId - 1] = profile;
    return clone(profile);
  }
  return invoke<FingerProfile>('reset_finger_profile', { fingerId, forceLocal });
}

export async function startEnrollment(fingerId: number): Promise<void> {
  if (!isTauriRuntime()) {
    return;
  }
  return invoke<void>('start_enrollment', { fingerId });
}

export async function configureHidMode(repair: boolean): Promise<void> {
  if (!isTauriRuntime()) return;
  return invoke<void>('configure_hid_mode', { repair });
}

export async function subscribeDeviceStatus(handler: Handler<DeviceStatusChange>): Promise<UnlistenFn> {
  if (!isTauriRuntime()) return () => {};
  return listen<DeviceStatusChange>('device_status_change', (event) => handler(event.payload));
}

export async function subscribeEnrollProgress(handler: Handler<EnrollStepProgress>): Promise<UnlistenFn> {
  if (!isTauriRuntime()) return () => {};
  return listen<EnrollStepProgress>('enroll_step_progress', (event) => handler(event.payload));
}

export async function subscribeFingerTouch(handler: Handler<FingerTouchEvent>): Promise<UnlistenFn> {
  if (!isTauriRuntime()) return () => {};
  return listen<FingerTouchEvent>('finger_touch_event', (event) => handler(event.payload));
}
