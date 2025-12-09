import { UserAuthProfile } from '../types';

const STORAGE_KEY_AUTH = 'launchpad_auth_user';

export const getProfile = (): UserAuthProfile | null => {
  const stored = localStorage.getItem(STORAGE_KEY_AUTH);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as UserAuthProfile;
  } catch {
    return null;
  }
};

export const hasRegistered = (): boolean => {
  return !!getProfile();
};

export const saveProfile = async (profile: UserAuthProfile): Promise<UserAuthProfile> => {
  const identifier = profile.providerId || (profile.provider === 'google' ? profile.contactEmail : profile.contactFacebookUrl) || '';
  const payload = { ...profile, providerId: identifier };
  const r = await fetch('/api/users/upsert', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profile: payload }) });
  if (!r.ok) throw new Error('upsert_failed');
  const saved = await r.json();
  let finalProfile = saved as UserAuthProfile;
  try {
    const refreshed = await findProfile(payload.provider, payload.providerId);
    if (refreshed) finalProfile = refreshed;
  } catch {}
  localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(finalProfile));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth:profileUpdated'));
  }
  return finalProfile;
};

export const clearProfile = (): void => {
  localStorage.removeItem(STORAGE_KEY_AUTH);
};

export const findProfile = async (provider: 'google' | 'facebook', identifier: string): Promise<UserAuthProfile | null> => {
  const r = await fetch('/api/users/find', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider, identifier }) });
  if (!r.ok) return null;
  const j = await r.json();
  return j?.found ? (j.profile as UserAuthProfile) : null;
};

export const uploadFile = async (userId: string, file: File): Promise<string> => {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const encoded = result.split(',')[1] || '';
      resolve(encoded);
    };
    reader.onerror = () => reject(new Error('file_read_error'));
    reader.readAsDataURL(file);
  });
  const r = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, filename: file.name, contentBase64: base64 }) });
  if (!r.ok) throw new Error('upload_failed');
  const j = await r.json();
  const raw = (j?.url || j?.path) as string;
  if (!raw) return raw;
  const hasQuery = raw.includes('?');
  const sep = hasQuery ? '&' : '?';
  return `${raw}${sep}v=${Date.now()}`;
};

export const deleteAccount = async (provider: 'google'|'facebook', identifier: string): Promise<void> => {
  const r = await fetch('/api/users/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider, identifier }) });
  if (!r.ok) throw new Error('delete_failed');
  clearProfile();
};
