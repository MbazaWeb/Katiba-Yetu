/**
 * Production authentication service backed exclusively by Supabase Auth.
 *
 * The AuthScreen and ProfileScreen call `getAuthService()` and never need to
 * Supabase must be configured with EXPO_PUBLIC_SUPABASE_URL and
 * EXPO_PUBLIC_SUPABASE_ANON_KEY. There is deliberately no local/demo fallback.
 *
 * App.tsx still owns the `user` state. The service:
 *  - returns the current user (or null) via getCurrentUser()
 *  - subscribes to auth-state changes (Supabase only; demo returns a no-op)
 *  - signs in / registers / signs out
 *  - exposes `kind` so the UI can show which backend is active
 */

import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { loadProfile, signIn as supabaseSignIn, signUp as supabaseSignUp, signOut as supabaseSignOut } from './supabaseAuth';
import type { User, AuthCredentials, RegistrationInput, Language } from '../types';

export type AuthServiceKind = 'supabase' | 'unavailable';

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
    const signUpData = await supabaseSignUp(input.email, input.password, input.displayName, input.languagePref as Language);
    // When email confirmation is disabled in Supabase, signUp returns a session immediately.
    // Use that user directly instead of calling getUser() (which returns null pre-confirmation).
    const authUser = signUpData?.user ?? null;
    if (authUser) return loadProfile(authUser);
    // Fallback: if somehow session isn't available, try getUser (shouldn't happen with auto-confirm on)
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) return loadProfile(currentUser);
    throw new Error('Hitilafu ya usajili. Tafadhali jaribu tena. / Registration error. Please try again.');
  },
  async signOut() {
    await supabaseSignOut();
  },
};

// ─── Resolver ────────────────────────────────────────────────────────────────

const unavailableAdapter: AuthService = {
  kind: 'unavailable',
  isConfigured() { return false; },
  async getCurrentUser() { return null; },
  onAuthStateChange() { return () => {}; },
  async signInWithCredentials() { throw new Error('Supabase Auth haijawekwa. / Supabase Auth is not configured.'); },
  async register() { throw new Error('Supabase Auth haijawekwa. / Supabase Auth is not configured.'); },
  async signOut() {},
};

let currentAdapter: AuthService = isSupabaseConfigured ? supabaseAdapter : unavailableAdapter;

export function getAuthService(): AuthService {
  return currentAdapter;
}

/** Force a specific adapter — primarily for testing. */
export function setAuthService(adapter: AuthService): void {
  currentAdapter = adapter;
}
