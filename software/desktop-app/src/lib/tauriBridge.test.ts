import { describe, expect, it } from 'vitest';
import { getAutostartEnabled, normalizeCommandError, setAutostartEnabled } from './tauriBridge';

describe('tauri bridge errors', () => {
  it('preserves a structured command error', () => {
    expect(normalizeCommandError({ code: 'hardware_unavailable', detail: 'worker stopped' })).toEqual({
      code: 'hardware_unavailable',
      detail: 'worker stopped'
    });
  });

  it('hides legacy raw errors behind the internal code', () => {
    expect(normalizeCommandError('profile lock poisoned')).toEqual({
      code: 'internal',
      detail: 'profile lock poisoned'
    });
  });
});

describe('autostart bridge', () => {
  it('reads, enables, and disables through the official plugin contract', async () => {
    const calls: string[] = [];
    const api = {
      isEnabled: async () => {
        calls.push('isEnabled');
        return true;
      },
      enable: async () => {
        calls.push('enable');
      },
      disable: async () => {
        calls.push('disable');
      }
    };

    expect(await getAutostartEnabled(api)).toBe(true);
    await setAutostartEnabled(true, api);
    await setAutostartEnabled(false, api);

    expect(calls).toEqual(['isEnabled', 'enable', 'disable']);
  });
});

describe('profile bridge mock operations', () => {
  it('preserves configured status when disabling an action and clears on reset', async () => {
    const { listFingerProfiles, resetFingerProfile, saveFingerProfile } = await import('./tauriBridge');
    const profiles = await listFingerProfiles();
    const target = profiles[1]; // id: 2 is configured in previewProfiles

    expect(target.configured).toBe(true);

    const disabled = await saveFingerProfile({ ...target, actionType: 'disabled' });
    expect(disabled.configured).toBe(true);
    expect(disabled.actionType).toBe('disabled');

    const reenabled = await saveFingerProfile({ ...disabled, actionType: 'ai_accept' });
    expect(reenabled.configured).toBe(true);
    expect(reenabled.actionType).toBe('ai_accept');

    const reset = await resetFingerProfile(2);
    expect(reset.configured).toBe(false);
    expect(reset.actionType).toBe('enter');
  });
});
