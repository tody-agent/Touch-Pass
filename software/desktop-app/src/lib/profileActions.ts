import type { FingerProfile } from './types';

export async function saveProfileWithEnrollment(
  profile: FingerProfile,
  secret: string | undefined,
  save: (profile: FingerProfile, secret?: string) => Promise<FingerProfile>,
  enroll: (id: number) => Promise<void>
): Promise<FingerProfile> {
  const wasConfigured = profile.configured;
  const saved = await save(profile, secret);
  if (!wasConfigured) await enroll(saved.id);
  return saved;
}
