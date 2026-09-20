import type { User as AuthUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

// Retry loadProfile up to maxAttempts — the DB trigger that creates the
// profiles row runs asynchronously after auth.signUp, so there is a small
// window where the row doesn't exist yet.
export async function loadProfile(authUser: AuthUser, maxAttempts = 5): Promise<User> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
    if (!error && data) {
      return {
        id: data.id,
        display_name: data.display_name,
        email: authUser.email,
        nida_verified: data.nida_verified,
        verification_tier: data.verification_tier,
        role: data.role,
        anonymity_default: data.anonymity_default,
        region: data.region ?? undefined,
        district: data.district ?? undefined,
        language_pref: data.language_pref,
        avatar_url: data.avatar_url ?? undefined,
        created_at: data.created_at,
      } as User;
    }
    lastError = error;
    // Back off: 300 ms, 600 ms, 1 s, 1.5 s
    if (attempt < maxAttempts) await new Promise(r => setTimeout(r, attempt * 300));
  }
  throw lastError;
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
}

export async function signUp(
  email: string,
  password: string,
  displayName: string,
  language: 'sw' | 'en',
  region?: string,
  district?: string,
  anonymityDefault?: boolean,
) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        display_name: displayName.trim() || 'Mwananchi',
        language_pref: language,
      },
    },
  });
  if (error) throw error;

  // After signUp the trigger creates the profile row. Update it with the
  // extra fields the trigger doesn't receive (region, district, anonymity).
  if (data.user && (region || district || anonymityDefault)) {
    const updates: Record<string, unknown> = {};
    if (region) updates.region = region;
    if (district) updates.district = district;
    if (anonymityDefault !== undefined) updates.anonymity_default = anonymityDefault;
    // Retry the update briefly — the trigger row must exist first.
    for (let i = 0; i < 4; i++) {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', data.user.id);
      if (!updateErr) break;
      await new Promise(r => setTimeout(r, (i + 1) * 300));
    }
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}


