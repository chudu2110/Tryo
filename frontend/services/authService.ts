import { UserAuthProfile } from '../types';
import { supabase } from './supabaseClient';

const STORAGE_KEY_AUTH = 'launchpad_auth_user';
const STORAGE_KEY_PROFILE_INDEX = 'launchpad_profile_index';

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
  const payload = { ...profile, providerId: identifier } as UserAuthProfile & { providerId: string };
  const row = {
    id: payload.id,
    name: payload.name,
    provider: payload.provider,
    provider_id: payload.providerId,
    date_of_birth: payload.dateOfBirth ? new Date(payload.dateOfBirth).toISOString().slice(0,10) : null,
    bio: payload.bio ?? null,
    links: payload.links ?? null,
    contact_email: payload.contactEmail ?? null,
    contact_facebook_url: payload.contactFacebookUrl ?? null,
    phone_number: payload.phoneNumber ?? null,
    cv_url: payload.cvFilePath ?? null,
    portfolio_url: payload.portfolioFilePath ?? null
  };
  const up = await supabase.from('users').upsert(row, { onConflict: 'provider_id' });
  if (up.error) throw new Error('upsert_failed');
  const refreshed = await findProfile(payload.provider, payload.providerId);
  const finalProfile = refreshed ?? profile;
  localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(finalProfile));
  try {
    const key = (finalProfile.name || '').trim().toLowerCase();
    const indexRaw = localStorage.getItem(STORAGE_KEY_PROFILE_INDEX);
    const index = indexRaw ? JSON.parse(indexRaw) as Record<string, UserAuthProfile> : {};
    index[key] = finalProfile;
    localStorage.setItem(STORAGE_KEY_PROFILE_INDEX, JSON.stringify(index));
  } catch {}
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth:profileUpdated'));
  }
  return finalProfile;
};

export const clearProfile = (): void => {
  localStorage.removeItem(STORAGE_KEY_AUTH);
};

export const findProfile = async (provider: 'google' | 'facebook', identifier: string): Promise<UserAuthProfile | null> => {
  const r = await supabase.from('users').select('*').eq('provider', provider).eq('provider_id', identifier).single();
  const u = r.data as any;
  if (!u) return null;
  const profile: UserAuthProfile = {
    id: u.id,
    name: u.name,
    provider: u.provider,
    providerId: u.provider_id,
    dateOfBirth: u.date_of_birth ?? undefined,
    bio: u.bio ?? undefined,
    links: u.links ?? undefined,
    contactEmail: u.contact_email ?? undefined,
    contactFacebookUrl: u.contact_facebook_url ?? undefined,
    phoneNumber: u.phone_number ?? undefined,
    cvFilePath: u.cv_url ?? undefined,
    portfolioFilePath: u.portfolio_url ?? undefined
  };
  return profile;
};

export const getPublicProfileByName = async (name: string): Promise<UserAuthProfile | null> => {
  const r = await supabase.from('users').select('*').eq('name', name).single();
  const u = r.data as any;
  if (!u) return null;
  const profile: UserAuthProfile = {
    id: u.id,
    name: u.name,
    provider: u.provider,
    providerId: u.provider_id,
    dateOfBirth: u.date_of_birth ?? undefined,
    bio: u.bio ?? undefined,
    links: u.links ?? undefined,
    contactEmail: u.contact_email ?? undefined,
    contactFacebookUrl: u.contact_facebook_url ?? undefined,
    phoneNumber: u.phone_number ?? undefined,
    cvFilePath: u.cv_url ?? undefined,
    portfolioFilePath: u.portfolio_url ?? undefined
  };
  return profile;
};

export const getSavedProfileByName = (name: string): UserAuthProfile | null => {
  try {
    const key = (name || '').trim().toLowerCase();
    const indexRaw = localStorage.getItem(STORAGE_KEY_PROFILE_INDEX);
    if (!indexRaw) return null;
    const index = JSON.parse(indexRaw) as Record<string, UserAuthProfile>;
    return index[key] || null;
  } catch {
    return null;
  }
};

export const setSavedProfileByName = (name: string, profile: UserAuthProfile): void => {
  try {
    const key = (name || '').trim().toLowerCase();
    const indexRaw = localStorage.getItem(STORAGE_KEY_PROFILE_INDEX);
    const index = indexRaw ? JSON.parse(indexRaw) as Record<string, UserAuthProfile> : {};
    index[key] = profile;
    localStorage.setItem(STORAGE_KEY_PROFILE_INDEX, JSON.stringify(index));
  } catch {}
};

export const uploadFile = async (userId: string, file: File, assetType?: 'post_cover'|'cv'|'portfolio'|'avatar'): Promise<string> => {
  const path = `${userId}/${file.name}`;
  const up = await supabase.storage.from('uploads').upload(path, file, { upsert: true });
  if (up.error) throw new Error('upload_failed');
  const pub = supabase.storage.from('uploads').getPublicUrl(path);
  const raw = (pub?.data?.publicUrl as string) || '';
  const hasQuery = raw.includes('?');
  const sep = hasQuery ? '&' : '?';
  const url = `${raw}${sep}v=${Date.now()}`;
  try {
    await supabase.from('uploads').insert({ user_id: userId, filename: file.name, url, asset_type: assetType ?? 'unspecified' });
  } catch {}
  return url;
};

export const deleteAccount = async (provider: 'google'|'facebook', identifier: string): Promise<void> => {
  const del = await supabase.from('users').delete().eq('provider', provider).eq('provider_id', identifier);
  if (del.error) throw new Error('delete_failed');
  clearProfile();
};
