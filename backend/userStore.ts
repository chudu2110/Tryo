import fs from 'fs';
import path from 'path';

export interface UserRecord {
  id: string;
  name: string;
  provider: 'google' | 'facebook';
  providerId: string; // gmail or facebook profile link
  dateOfBirth?: string;
  bio?: string;
  links?: string[];
  contactEmail?: string;
  contactFacebookUrl?: string;
  cvFilePath?: string;
  portfolioFilePath?: string;
}

const dataDir = path.resolve(__dirname, 'data');
const usersPath = path.join(dataDir, 'users.json');
const blacklistPath = path.join(dataDir, 'blacklist.json');

export function ensureUserStore() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(usersPath)) fs.writeFileSync(usersPath, '[]', 'utf-8');
  if (!fs.existsSync(blacklistPath)) fs.writeFileSync(blacklistPath, '[]', 'utf-8');
}

function readUsers(): UserRecord[] {
  try {
    const raw = fs.readFileSync(usersPath, 'utf-8');
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr as UserRecord[];
    return [];
  } catch {
    return [];
  }
}

function writeUsers(users: UserRecord[]) {
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2), 'utf-8');
}

function readBlacklist(): string[] {
  try {
    const raw = fs.readFileSync(blacklistPath, 'utf-8');
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as string[]) : [];
  } catch {
    return [];
  }
}

function writeBlacklist(list: string[]) {
  fs.writeFileSync(blacklistPath, JSON.stringify(list, null, 2), 'utf-8');
}

export function isBlacklisted(identifier: string): boolean {
  const list = readBlacklist();
  return list.includes(identifier);
}

export function addToBlacklist(identifier: string) {
  const list = readBlacklist();
  if (!list.includes(identifier)) {
    list.push(identifier);
    writeBlacklist(list);
  }
}

export function findUser(provider: 'google'|'facebook', identifier: string): UserRecord | null {
  const users = readUsers();
  const found = users.find(u => u.provider === provider && u.providerId === identifier);
  return found || null;
}

export function upsertUser(record: UserRecord): UserRecord {
  if (isBlacklisted(record.providerId)) {
    throw new Error('identifier_blacklisted');
  }
  const users = readUsers();
  const idx = users.findIndex(u => u.provider === record.provider && u.providerId === record.providerId);
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...record };
  } else {
    users.push(record);
  }
  writeUsers(users);
  return record;
}

export function deleteUser(provider: 'google'|'facebook', identifier: string): boolean {
  const users = readUsers();
  const idx = users.findIndex(u => u.provider === provider && u.providerId === identifier);
  if (idx >= 0) {
    users.splice(idx, 1);
    writeUsers(users);
    addToBlacklist(identifier);
    return true;
  }
  return false;
}
