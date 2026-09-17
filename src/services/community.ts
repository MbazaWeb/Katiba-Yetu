import { supabase } from '../lib/supabase';

export interface CommunityContribution { id: string; body: string; createdAt: string; mine?: boolean; author?: string }
export interface CommunityData { discussions: CommunityContribution[]; suggestions: CommunityContribution[] }

export async function fetchCommunity(articleId: string): Promise<CommunityData> {
  const [{ data: discussions, error: discussionError }, { data: suggestions, error: suggestionError }, { data: session }] = await Promise.all([
    supabase.from('discussions').select('id,body,created_at,user_id,is_anonymous,profiles(display_name)').eq('article_id', articleId).eq('status', 'active').order('created_at', { ascending: false }),
    supabase.from('suggestions').select('id,rationale,created_at,user_id,profiles(display_name)').eq('article_id', articleId).neq('status', 'rejected').order('created_at', { ascending: false }),
    supabase.auth.getSession(),
  ]);
  if (discussionError) throw discussionError;
  if (suggestionError) throw suggestionError;
  const userId = session.session?.user.id;
  return {
    discussions: (discussions ?? []).map((row: any) => ({ id: row.id, body: row.body, createdAt: row.created_at, mine: row.user_id === userId, author: row.is_anonymous ? undefined : row.profiles?.display_name })),
    suggestions: (suggestions ?? []).map((row: any) => ({ id: row.id, body: row.rationale, createdAt: row.created_at, mine: row.user_id === userId, author: row.profiles?.display_name })),
  };
}

export async function addContribution(articleId: string, kind: keyof CommunityData, body: string): Promise<CommunityContribution> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('AUTH_REQUIRED');
  const result = kind === 'discussions'
    ? await supabase.from('discussions').insert({ article_id: articleId, user_id: auth.user.id, body, title: '' }).select('id,created_at').single()
    : await supabase.from('suggestions').insert({ article_id: articleId, user_id: auth.user.id, rationale: body, title: '', status: 'submitted' }).select('id,created_at').single();
  const { data, error } = result;
  if (error) throw error;
  return { id: data.id, body, createdAt: data.created_at, mine: true };
}

export async function setBookmark(articleId: string, bookmarked: boolean) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error('AUTH_REQUIRED');
  const query = bookmarked
    ? supabase.from('bookmarks').upsert({ user_id: data.user.id, article_id: articleId })
    : supabase.from('bookmarks').delete().eq('user_id', data.user.id).eq('article_id', articleId);
  const { error } = await query;
  if (error) throw error;
}

export async function getBookmark(articleId: string) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: bookmark, error } = await supabase.from('bookmarks').select('article_id').eq('user_id', data.user.id).eq('article_id', articleId).maybeSingle();
  if (error) throw error;
  return Boolean(bookmark);
}

export async function castVote(pollId: string, optionId: string) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error('AUTH_REQUIRED');
  const { error } = await supabase.from('votes').upsert({ poll_id: pollId, poll_option_id: optionId, user_id: data.user.id }, { onConflict: 'poll_id,user_id' });
  if (error) throw error;
}
