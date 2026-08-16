import { describe, expect, it } from 'vitest';
import { defaultProfiles, validateActionDraft } from './types';

describe('profile state helpers', () => {
  it('creates ten unconfigured production profiles', () => {
    const profiles = defaultProfiles();
    expect(profiles).toHaveLength(10);
    expect(profiles.filter((profile) => profile.configured)).toHaveLength(0);
  });

  it('keeps localized presentation copy out of persisted profiles', () => {
    const profile = defaultProfiles()[0] as unknown as Record<string, unknown>;
    expect(profile).not.toHaveProperty('name');
    expect(profile).not.toHaveProperty('label');
    expect(profile).not.toHaveProperty('description');
    expect(profile).not.toHaveProperty('icon');
  });

  it('rejects password drafts without a stored or new secret', () => {
    expect(validateActionDraft({ actionType: 'password' })).toBe('secret_required');
    expect(validateActionDraft({ actionType: 'password', secretConfigured: true })).toBeUndefined();
  });

  it('rejects empty or non-ascii custom payloads', () => {
    expect(validateActionDraft({ actionType: 'custom', customPayload: '   ' })).toBe('custom_required');
    expect(validateActionDraft({ actionType: 'custom', customPayload: 'đồng ý' })).toBe('custom_ascii');
    expect(validateActionDraft({ actionType: 'custom', customPayload: '/approve' })).toBeUndefined();
  });
});
