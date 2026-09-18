/**
 * Authentication service — local demo only.
 *
 * No real credentials are stored. This interface is the seam where a real
 * backend (NIDA verification, OAuth, phone OTP) will be wired in Phase 3.
 *
 * Do NOT pretend that demo sessions are verified identities.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthSession, AuthCredentials, RegistrationInput } from '../types';

const SESSION_KEY = '@katibayetu/session';
const USERS_KEY = '@katibayetu/users';

interface StoredUser {
  id: string;
  displayName: string;
  email?: string;
  phone?: string;
  passwordHash: string; // demo only — never store real passwords
  region?: string;
  district?: string;
  languagePref: 'sw' | 'en';
  anonymous: boolean;
  createdAt: string;
}

/** Demo hash — NOT secure. Replace with a server-side authentication flow. */
function demoHash(value: string): string {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = ((h << 5) - h + value.charCodeAt(i)) | 0;
  return `demo:${h.toString(16)}`;
}

export interface AuthService {
  getCurrentSession(): Promise<AuthSession | null>;
  signInWithCredentials(credentials: AuthCredentials): Promise<AuthSession>;
  register(input: RegistrationInput): Promise<AuthSession>;
  signOut(): Promise<void>;
  isDemoBackend: true;
}

export const authService: AuthService = {
  isDemoBackend: true,

  async getCurrentSession() {
    try {
      const raw = await AsyncStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as AuthSession;
    } catch { return null; }
  },

  async signInWithCredentials(credentials) {
    const identifier = credentials.identifier.trim().toLowerCase();
    if (!identifier || !credentials.password) throw new Error('Tafadhali jaza kitambulisho na nywila. / Identifier and password are required.');
    const users = await loadUsers();
    const user = users.find(u => (u.email && u.email.toLowerCase() === identifier) || (u.phone && u.phone === identifier));
    if (!user || user.passwordHash !== demoHash(credentials.password)) {
      throw new Error('Kitambulisho au nywila si sahihi. / Identifier or password is incorrect.');
    }
    const session: AuthSession = {
      userId: user.id,
      displayName: user.displayName,
      email: user.email,
      phone: user.phone,
      role: 'citizen',
      verificationTier: 'none',
      region: user.region as AuthSession['region'],
      languagePref: user.languagePref,
      signedInAt: new Date().toISOString(),
      isDemo: true,
    };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  async register(input) {
    const users = await loadUsers();
    const email = input.email?.trim().toLowerCase();
    const phone = input.phone?.trim();
    if (!email && !phone) throw new Error('Tafadhali andika barua pepe au namba ya simu. / Please provide an email or phone number.');
    if (users.some(u => (email && u.email === email) || (phone && u.phone === phone))) {
      throw new Error('Mtumiaji mwenye kitambulisho hiki tayari yupo. / A user with this identifier already exists.');
    }
    if (input.password.length < 6) throw new Error('Nywila inapaswa kuwa na herufi 6 zaidi. / Password must be at least 6 characters.');
    const user: StoredUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      displayName: input.displayName.trim().slice(0, 100),
      email,
      phone,
      passwordHash: demoHash(input.password),
      region: input.region,
      district: input.district,
      languagePref: input.languagePref,
      anonymous: input.anonymous,
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
    const session: AuthSession = {
      userId: user.id,
      displayName: user.displayName,
      email: user.email,
      phone: user.phone,
      role: 'citizen',
      verificationTier: 'none',
      region: user.region as AuthSession['region'],
      district: user.district,
      languagePref: user.languagePref,
      signedInAt: new Date().toISOString(),
      isDemo: true,
    };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  async signOut() {
    try { await AsyncStorage.removeItem(SESSION_KEY); } catch {}
  },
};

async function loadUsers(): Promise<StoredUser[]> {
  try {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredUser[];
  } catch { return []; }
}

export const AUTH_DISCLAIMER =
  'Hii ni kuingia kwa mfano wa ndani pekee. Hakuna uthibitisho halisi wa NIDA au simu unafanyika. ' +
  'Demo sign-in only. No real NIDA or phone verification is performed.';
