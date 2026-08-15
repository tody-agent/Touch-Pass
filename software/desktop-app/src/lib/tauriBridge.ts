import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import {
  defaultProfiles,
  defaultStatus,
  type AppStatusResponse,
  type DeviceStatusChange,
  type EnrollStepProgress,
  type FingerProfile,
  type FingerTouchEvent
} from './types';

type Handler<T> = (payload: T) => void;

const mockProfiles = defaultProfiles();

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export async function getAppStatus(): Promise<AppStatusResponse> {
  if (!isTauriRuntime()) {
    return { ...defaultStatus(), connected: true, port: 'Preview USB', sensorStatus: 'ok', backgroundWorker: 'mock' };
  }
  return invoke<AppStatusResponse>('get_app_status');
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
      profile.actionType === 'password' ? Boolean(secret || previous?.secretConfigured) : false;
    const saved = {
      ...profile,
      configured: profile.actionType === 'password' ? secretConfigured : profile.actionType !== 'disabled',
      secretConfigured
    };
    mockProfiles[index] = saved;
    return clone(saved);
  }
  return invoke<FingerProfile>('save_finger_profile', { profile, secret });
}

export async function resetFingerProfile(fingerId: number): Promise<FingerProfile> {
  if (!isTauriRuntime()) {
    const profile = defaultProfiles()[fingerId - 1];
    mockProfiles[fingerId - 1] = profile;
    return clone(profile);
  }
  return invoke<FingerProfile>('reset_finger_profile', { fingerId });
}

export async function startEnrollment(fingerId: number): Promise<void> {
  if (!isTauriRuntime()) {
    return;
  }
  return invoke<void>('start_enrollment', { fingerId });
}

export async function testDispatchAction(fingerId: number): Promise<void> {
  if (!isTauriRuntime()) {
    return;
  }
  return invoke<void>('test_dispatch_action', { fingerId });
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

export async function minimizeWindow(): Promise<void> {
  if (isTauriRuntime()) await getCurrentWindow().minimize();
}

export async function closeWindow(): Promise<void> {
  if (isTauriRuntime()) await getCurrentWindow().hide();
}

export async function startWindowDrag(): Promise<void> {
  if (isTauriRuntime()) await getCurrentWindow().startDragging();
}
