import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { POLL_ART13 } from '../constants/mockData';
import type { ConstitutionArticle } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';
import { addContribution, fetchCommunity, type CommunityContribution, type CommunityData } from '../services/community';

export type LocalContribution = CommunityContribution;
type CommunityState = CommunityData;
const empty: CommunityState = { discussions: [], suggestions: [] };
export function useArticleCommunity(article: ConstitutionArticle) {
  const key = `@katibayetu/library/community/${article.id}/${article.source.documentVersion}`;
  const [data, setData] = useState<CommunityState>(empty);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let live = true;
    const load = isSupabaseConfigured ? fetchCommunity(article.id) : AsyncStorage.getItem(key).then(raw => {
      const parsed: unknown = raw ? JSON.parse(raw) : empty;
      if (!parsed || typeof parsed !== 'object' || !('discussions' in parsed) || !('suggestions' in parsed) || !Array.isArray(parsed.discussions) || !Array.isArray(parsed.suggestions)) throw new Error('Invalid community data');
      return parsed as CommunityState;
    });
    load.then(result => { if (live) { setData(result); setReady(true); } }).catch(() => { if (live) { setError(true); setReady(true); } });
    return () => { live = false; };
  }, [key, article.id]);
  async function add(kind: keyof CommunityState, body: string) {
    if (!ready || saving || !body.trim()) return false;
    setSaving(true); setError(false);
    try {
      const contribution = isSupabaseConfigured
        ? await addContribution(article.id, kind, body.trim())
        : { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, body: body.trim(), createdAt: new Date().toISOString(), mine: true };
      const next = { ...data, [kind]: [contribution, ...data[kind]] };
      if (!isSupabaseConfigured) await AsyncStorage.setItem(key, JSON.stringify(next));
      setData(next); return true;
    }
    catch { setError(true); return false; }
    finally { setSaving(false); }
  }
  // Only the Article 13 demo poll has a matching subject. Other legacy fixtures are not legal-library data.
  const polls = article.id === 'union-13' ? [POLL_ART13] : [];
  return { data, ready, saving, error, add, polls };
}
