import { describe, expect, it } from 'vitest';
import { actionLabels, defaultProfiles, validateActionDraft } from './types';

describe('profile state helpers', () => {
  it('creates ten profiles with two preview configured slots', () => {
    const profiles = defaultProfiles();
    expect(profiles).toHaveLength(10);
    expect(profiles.filter((profile) => profile.configured)).toHaveLength(2);
  });

  it('maps the AI preset to friendly copy', () => {
    expect(actionLabels.ai_accept.label).toBe('Đồng Ý AI');
    expect(actionLabels.ai_accept.description).toContain("'y' + Enter");
  });

  it('rejects password drafts without a stored or new secret', () => {
    expect(validateActionDraft({ actionType: 'password' })).toContain('mật khẩu');
    expect(validateActionDraft({ actionType: 'password', secretConfigured: true })).toBeUndefined();
  });

  it('rejects empty or non-ascii custom payloads', () => {
    expect(validateActionDraft({ actionType: 'custom', customPayload: '   ' })).toContain('chuỗi');
    expect(validateActionDraft({ actionType: 'custom', customPayload: 'đồng ý' })).toContain('ASCII');
    expect(validateActionDraft({ actionType: 'custom', customPayload: '/approve' })).toBeUndefined();
  });
});
