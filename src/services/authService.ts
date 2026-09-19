/**
 * Unified AuthService — single seam for authentication across demo and
 * Supabase backends.
 *
 * The AuthScreen and ProfileScreen call `getAuthService()` and never need to
 * know whether the underlying implementation is AsyncStorage-backed demo
 * auth or Supabase auth. When Supabase is configured
 * (`EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set),
 * the swappable adapter is returned; otherwise the demo adapter is used.
 *
 * App.tsx still owns the `user` state. The service:
 *  - returns the current user (or null) via getCurrentUser()
 *  - subscribes to auth-state changes (Supabase only; demo returns a no-op)
 *  - signs in / registers / signs out
 *  - exposes `kind` so the UI can show which backend is active
 */

import { authService as demoAuthService } from './auth';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { loadProfile, signIn as supabaseSignIn, signUp as supabaseSignUp, signOut as supabaseSignOut } from './supabaseAuth';
import type { User, AuthCredentials, RegistrationInput, Language, AuthSession } from '../types';

export type AuthServiceKind = 'demo' | 'supabase';

export interface AuthService {
  readonly kind: AuthServiceKind;
  /** Returns true if a real backend (not the demo) is in use. */
  isConfigured(): boolean;
  /** Returns the current user, or null if signed out. */
  getCurrentUser(): Promise<User | null>;
  /** Subscribe to auth-state changes. Returns an unsubscribe function. */
  onAuthStateChange(handler: (user: User | null) => void): () => void;
  /** Sign in with email/phone + password. */
  signInWithCredentials(credentials: AuthCredentials): Promise<User>;
  /** Register a new account. */
  register(input: RegistrationInput): Promise<User>;
  /** Sign out the current user. */
  signOut(): Promise<void>;
}

// ─── Demo adapter ─────────────────────────────────────────────────────────────

const demoAdapter: AuthService = {
  kind: 'demo',
  isConfigured() { return false; },
  async getCurrentUser() {
    const session = await demoAuthService.getCurrentSession();
    if (!session) return null;
    return sessionToUser(session);
  },
  onAuthStateChange(_handler) {
    // Demo auth has no external state-change events. No-op.
    return () => {};
  },
  async signInWithCredentials(credentials) {
    const session = await demoAuthService.signInWithCredentials(credentials);
    return sessionToUser(session);
  },
  async register(input) {
    const session = await demoAuthService.register(input);
    return sessionToUser(session);
  },
  async signOut() {
    await demoAuthService.signOut();
  },
};

// ─── Supabase adapter ────────────────────────────────────────────────────────

const supabaseAdapter: AuthService = {
  kind: 'supabase',
  isConfigured() { return true; },
  async getCurrentUser() {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return null;
    return loadProfile(authUser);
  },
  onAuthStateChange(handler) {
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) { handler(null); return; }
      try {
        const profile = await loadProfile(session.user);
        handler(profile);
      } catch (e) {
        console.warn('[auth] supabase profile load failed', e);
        handler(null);
      }
    });
    return () => listener.subscription.unsubscribe();
  },
  async signInWithCredentials(credentials) {
    // Supabase auth uses email; if the identifier looks like a phone, reject.
    if (!credentials.identifier.includes('@')) {
      throw new Error('Tafadhali andika barua pepe. / Supabase sign-in requires an email address.');
    }
    await supabaseSignIn(credentials.identifier, credentials.password);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) throw new Error('Uthibitisho umefeli. / Authentication failed.');
    return loadProfile(authUser);
  },
  async register(input) {
    if (!input.email) throw new Error('Tafadhali andika barua pepe. / Supabase registration requires an email address.');
    await supabaseSignUp(input.email, input.password, input.displayName, input.languagePref as Language);
    // After signUp, Supabase may require email confirmation before the
    // session is active. We attempt to load the profile; if no session,
    // we return a minimal User object derived from the registration input.
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) return loadProfile(authUser);
    // No active session yet (likely awaiting email confirmation).
    // Return a placeholder user so the UI can show a "check your email" state.
    return {
      id: `pending-${Date.now()}`,
      display_name: input.displayName,
      email: input.email,
      phone: input.phone,
      nida_verified: false,
      verification_tier: 'none',
      role: 'registered',
      anonymity_default: input.anonymous,
      region: input.region,
      district: input.district,
      language_pref: input.languagePref,
      created_at: new Date().toISOString(),
    };
  },
  async signOut() {
    await supabaseSignOut();
  },
};

// ─── Resolver ────────────────────────────────────────────────────────────────

let currentAdapter: AuthService = isSupabaseConfigured ? supabaseAdapter : demoAdapter;

export function getAuthService(): AuthService {
  return currentAdapter;
}

/** Force a specific adapter — primarily for testing. */
export function setAuthService(adapter: AuthService): void {
  currentAdapter = adapter;
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function sessionToUser(session: AuthSession): User {
  return {
    id: session.userId,
    display_name: session.displayName,
    email: session.email,
    phone: session.phone,
    nida_verified: false,
    verification_tier: session.verificationTier,
    role: 'registered',
    anonymity_default: false,
    region: session.region,
    district: session.district,
    language_pref: session.languagePref,
    created_at: session.signedInAt,
  };
}
