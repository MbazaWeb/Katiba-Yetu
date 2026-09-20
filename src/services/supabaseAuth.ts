import type { User as AuthUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

export async function loadProfile(authUser: AuthUser): Promise<User> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
  if (error) throw error;
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

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
}

export async function signUp(email: string, password: string, displayName: string, language: 'sw' | 'en') {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(), password,
    options: { data: { display_name: displayName.trim() || 'Mwananchi', language_pref: language } },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

