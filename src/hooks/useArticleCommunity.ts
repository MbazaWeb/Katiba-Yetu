import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { POLL_ART13 } from '../constants/mockData';
import type { ConstitutionArticle } from '../types';

export interface LocalContribution { id: string; body: string; createdAt: string }
interface CommunityState { discussions: LocalContribution[]; suggestions: LocalContribution[] }
const empty: CommunityState = { discussions: [], suggestions: [] };
export function useArticleCommunity(article: ConstitutionArticle) {
  const key = `@katibayetu/library/community/${article.id}/${article.source.documentVersion}`;
  const [data, setData] = useState<CommunityState>(empty);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let live = true;
    AsyncStorage.getItem(key).then(raw => {
      const parsed: unknown = raw ? JSON.parse(raw) : empty;
      if (!parsed || typeof parsed !== 'object' || !('discussions' in parsed) || !('suggestions' in parsed) || !Array.isArray(parsed.discussions) || !Array.isArray(parsed.suggestions)) throw new Error('Invalid community data');
      if (live) { setData(parsed as CommunityState); setReady(true); }
    }).catch(() => { if (live) setError(true); });
    return () => { live = false; };
  }, [key]);
  async function add(kind: keyof CommunityState, body: string) {
    if (!ready || saving || !body.trim()) return false;
    setSaving(true); setError(false);
    const next = { ...data, [kind]: [...data[kind], { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, body: body.trim(), createdAt: new Date().toISOString() }] };
    try { await AsyncStorage.setItem(key, JSON.stringify(next)); setData(next); return true; }
    catch { setError(true); return false; }
    finally { setSaving(false); }
  }
  // Only the Article 13 demo poll has a matching subject. Other legacy fixtures are not legal-library data.
  const polls = article.id === 'union-13' ? [POLL_ART13] : [];
  return { data, ready, saving, error, add, polls };
}
