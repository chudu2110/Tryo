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

export const saveProfile = (profile: UserAuthProfile): void => {
  localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(profile));
};

export const clearProfile = (): void => {
  localStorage.removeItem(STORAGE_KEY_AUTH);
};
