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
  localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(saved));
  return saved as UserAuthProfile;
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
  const arrayBuffer = await file.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
  const r = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, filename: file.name, contentBase64: base64 }) });
  if (!r.ok) throw new Error('upload_failed');
  const j = await r.json();
  return j?.path as string;
};

export const deleteAccount = async (provider: 'google'|'facebook', identifier: string): Promise<void> => {
  const r = await fetch('/api/users/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider, identifier }) });
  if (!r.ok) throw new Error('delete_failed');
  clearProfile();
};
