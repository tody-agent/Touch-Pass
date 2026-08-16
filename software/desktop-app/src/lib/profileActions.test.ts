import { describe, expect, it, vi } from 'vitest';
import { saveProfileWithEnrollment } from './profileActions';
import { defaultProfiles } from './types';

describe('profile save flow', () => {
  it('enrolls an unconfigured finger only after save succeeds', async () => {
    const profile = defaultProfiles()[0];
    const saved = { ...profile, configured: true, actionType: 'enter' as const };
    const calls: string[] = [];
    const save = vi.fn(async () => {
      calls.push('save');
      return saved;
    });
    const enroll = vi.fn(async () => {
      calls.push('enroll');
    });

    await saveProfileWithEnrollment(profile, undefined, save, enroll);

    expect(calls).toEqual(['save', 'enroll']);
  });

  it('does not enroll when saving fails', async () => {
    const profile = defaultProfiles()[0];
    const enroll = vi.fn(async () => undefined);

    await expect(
      saveProfileWithEnrollment(profile, undefined, async () => {
        throw new Error('save failed');
      }, enroll)
    ).rejects.toThrow('save failed');
    expect(enroll).not.toHaveBeenCalled();
  });

  it('only saves an already configured finger', async () => {
    const profile = { ...defaultProfiles()[0], configured: true };
    const enroll = vi.fn(async () => undefined);

    await saveProfileWithEnrollment(profile, undefined, async (draft) => draft, enroll);

    expect(enroll).not.toHaveBeenCalled();
  });
});
