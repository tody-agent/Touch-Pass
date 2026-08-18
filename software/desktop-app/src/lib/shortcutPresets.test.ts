import { describe, expect, it } from 'vitest';
import { ACTION_PRESETS, getAvailablePresets, matchPreset } from './shortcutPresets';
import type { FingerProfile } from './types';

describe('shortcutPresets catalog', () => {
  it('contains valid presets with unique IDs and ASCII payloads <= 128 bytes', () => {
    const ids = new Set<string>();
    for (const preset of ACTION_PRESETS) {
      expect(ids.has(preset.id)).toBe(false);
      ids.add(preset.id);
      expect(preset.labelKey).toBeTruthy();
      expect(preset.descKey).toBeTruthy();
      if (preset.payload) {
        expect(preset.payload.length).toBeGreaterThan(0);
        expect(preset.payload.length).toBeLessThanOrEqual(128);
        expect(/^[\x00-\x7F]*$/.test(preset.payload)).toBe(true);
      }
    }
  });

  it('filters presets appropriately by operating system', () => {
    const winPresets = getAvailablePresets('windows');
    const macPresets = getAvailablePresets('macos');

    expect(winPresets.some((p) => p.id === 'win_switch_window')).toBe(true);
    expect(winPresets.some((p) => p.id === 'mac_switch_app')).toBe(false);

    expect(macPresets.some((p) => p.id === 'mac_switch_app')).toBe(true);
    expect(macPresets.some((p) => p.id === 'win_switch_window')).toBe(false);
  });

  it('matches a finger profile to its corresponding preset', () => {
    const aiProfile: FingerProfile = {
      id: 1,
      hand: 'left',
      configured: true,
      actionType: 'ai_accept',
      requireConfirm: true,
      secretConfigured: false
    };
    expect(matchPreset(aiProfile)?.id).toBe('ai_accept');

    const rejectProfile: FingerProfile = {
      id: 2,
      hand: 'left',
      configured: true,
      actionType: 'custom',
      customPayload: 'n',
      requireConfirm: true,
      secretConfigured: false
    };
    expect(matchPreset(rejectProfile)?.id).toBe('ai_reject');

    const claudeModeProfile: FingerProfile = {
      id: 3,
      hand: 'left',
      configured: true,
      actionType: 'custom',
      customPayload: 'Ctrl+Shift+C',
      requireConfirm: true,
      secretConfigured: false
    };
    expect(matchPreset(claudeModeProfile)?.id).toBe('claude_switch_mode');

    const customTextProfile: FingerProfile = {
      id: 4,
      hand: 'left',
      configured: true,
      actionType: 'custom',
      customPayload: 'my custom command',
      requireConfirm: true,
      secretConfigured: false
    };
    expect(matchPreset(customTextProfile)?.id).toBe('custom_input');
  });
});
