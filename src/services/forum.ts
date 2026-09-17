/**
 * Discussion forum service.
 *
 * Improvements on the existing discussion feature using useful concepts:
 *  - categories
 *  - latest activity / unanswered filter
 *  - article-linked discussions
 *  - title search
 *  - replies (threaded)
 *  - subscriptions / bookmarks
 *  - report content
 *  - moderation status
 *
 * In-app contributions are saved only on the device. No public posting in this
 * build. Replace this adapter with a real backend without changing the interface.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ForumThread, ForumReply, DiscussionCategory } from '../types';

const STORAGE_KEY = '@katibayetu/forum';
const SUBSCRIPTIONS_KEY = '@katibayetu/forum_subscriptions';
const REPORTS_KEY = '@katibayetu/forum_reports';

/** Seed threads for demonstration. Clearly marked as local demo content. */
const seedThreads: ForumThread[] = [
  {
    id: 'thread-seed-1',
    category: 'historia',
    title: 'Je, muundo wa Muungano wa 1964 unahitaji kufanyiwa kazi upya?',
    body: 'Mjadala kuhusu kama muundo wa sasa wa Muungano unakidhi mahitaji ya kizamani. Mchango huu umehifadhiwa kwa madhumuni ya mfano pekee.',
    authorId: 'demo-1',
    authorName: 'Mwananchi (mfano)',
    authorVerified: false,
    isAnonymous: true,
    articleId: 'union-1',
    createdAt: '2026-09-10T10:00:00Z',
    lastActivityAt: '2026-09-15T14:00:00Z',
    replyCount: 4,
    upvotes: 12,
    hasAcceptedAnswer: false,
    isAnswered: true,
    isPinned: true,
    moderationStatus: 'active',
    subscriberIds: [],
    tagIds: ['muungano', 'muundo'],
  },
  {
    id: 'thread-seed-2',
    category: 'haki_na_wajibu',
    title: 'Uhuru wa kutoa maoni una mipaka ipi chini ya Ibara 18?',
    body: 'Tukiangalia uhuru wa kutoa maoni, je, kuna masharti au mipaka inayoelezwa kisheria? Mchango huu umehifadhiwa kwa madhumuni ya mfano pekee.',
    authorId: 'demo-2',
    authorName: 'Mwananchi (mfano)',
    authorVerified: false,
    isAnonymous: true,
    articleId: 'union-18',
    createdAt: '2026-09-12T08:00:00Z',
    lastActivityAt: '2026-09-16T09:00:00Z',
    replyCount: 2,
    upvotes: 7,
    hasAcceptedAnswer: false,
    isAnswered: false,
    isPinned: false,
    moderationStatus: 'active',
    subscriberIds: [],
    tagIds: ['uhuru', 'maoni'],
  },
  {
    id: 'thread-seed-3',
    category: 'maboresho_ya_katiba',
    title: 'Mapendekezo ya kuboresha uwakilishi wa wanawake katika bunge',
    body: 'Mjadala kuhusu namna ya kuongeza uwakilishi wa wanawake katika taasisi za uamuzi. Mchango huu umehifadhiwa kwa madhumuni ya mfano pekee.',
    authorId: 'demo-3',
    authorName: 'Mwananchi (mfano)',
    authorVerified: false,
    isAnonymous: false,
    createdAt: '2026-09-14T12:00:00Z',
    lastActivityAt: '2026-09-17T11:00:00Z',
    replyCount: 6,
    upvotes: 21,
    hasAcceptedAnswer: false,
    isAnswered: true,
    isPinned: false,
    moderationStatus: 'active',
    subscriberIds: [],
    tagIds: ['uwakilishi', 'wanawake'],
  },
  {
    id: 'thread-seed-4',
    category: 'tafsiri_ya_kisheria',
    title: 'Tafsiri ya kisheria ya "haki za msingi"',
    body: 'Je, "haki za msingi" zina maana gani tofauti na "haki za binadamu"? Mchango huu umehifadhiwa kwa madhumuni ya mfano pekee.',
    authorId: 'demo-4',
    authorName: 'Mwananchi (mfano)',
    authorVerified: false,
    isAnonymous: true,
    createdAt: '2026-09-15T15:00:00Z',
    lastActivityAt: '2026-09-15T15:00:00Z',
    replyCount: 0,
    upvotes: 3,
    hasAcceptedAnswer: false,
    isAnswered: false,
    isPinned: false,
    moderationStatus: 'active',
    subscriberIds: [],
    tagIds: ['tafsiri', 'haki'],
  },
];

const seedReplies: Record<string, ForumReply[]> = {
  'thread-seed-1': [
    {
      id: 'reply-1',
      threadId: 'thread-seed-1',
      body: 'Mchango wa kufuata. Muundo wa sasa unahitaji ufuatiliaji wa kisera zaidi. Mfano wa ndani pekee.',
      authorId: 'demo-5',
      authorName: 'Mwananchi (mfano)',
      authorVerified: false,
      isAnonymous: false,
      stance: 'alternative',
      isExpertContribution: false,
      createdAt: '2026-09-15T14:00:00Z',
      upvotes: 2,
      moderationStatus: 'active',
    },
  ],
};

export interface ForumFilters {
  category: DiscussionCategory | 'all';
  query: string;
  filter: 'all' | 'unanswered' | 'answered' | 'pinned';
  articleId?: string;
}

export const emptyForumFilters: ForumFilters = {
  category: 'all',
  query: '',
  filter: 'all',
};

function sanitizeText(value: string, max = 3000): string {
  return value.trim().slice(0, max).replace(/\u0000/g, '');
}

export async function loadForumState(): Promise<{ threads: ForumThread[]; replies: Record<string, ForumReply[]> }> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { threads: seedThreads, replies: seedReplies };
    const parsed = JSON.parse(raw) as { threads: ForumThread[]; replies: Record<string, ForumReply[]> };
    return { threads: parsed.threads ?? seedThreads, replies: parsed.replies ?? seedReplies };
  } catch {
    return { threads: seedThreads, replies: seedReplies };
  }
}

export async function saveForumState(threads: ForumThread[], replies: Record<string, ForumReply[]>): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ threads, replies }));
  } catch (e) {
    console.warn('[forum] save failed', e);
  }
}

export function filterThreads(threads: ForumThread[], filters: ForumFilters): ForumThread[] {
  const query = filters.query.trim().toLocaleLowerCase();
  return threads
    .filter(t => t.moderationStatus !== 'removed')
    .filter(t => filters.category === 'all' || t.category === filters.category)
    .filter(t => !filters.articleId || t.articleId === filters.articleId)
    .filter(t => {
      if (filters.filter === 'unanswered') return !t.isAnswered;
      if (filters.filter === 'answered') return t.isAnswered;
      if (filters.filter === 'pinned') return t.isPinned;
      return true;
    })
    .filter(t => !query || t.title.toLocaleLowerCase().includes(query) || t.body.toLocaleLowerCase().includes(query))
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
    });
}

export function createThread(input: { category: DiscussionCategory; title: string; body: string; articleId?: string; isAnonymous: boolean; authorName: string; authorId: string; authorVerified: boolean }): ForumThread {
  const now = new Date().toISOString();
  return {
    id: `thread-${now}-${Math.random().toString(36).slice(2, 8)}`,
    category: input.category,
    title: sanitizeText(input.title, 200),
    body: sanitizeText(input.body, 3000),
    authorId: input.authorId,
    authorName: input.isAnonymous ? 'Mwananchi' : sanitizeText(input.authorName, 100),
    authorVerified: input.authorVerified,
    isAnonymous: input.isAnonymous,
    articleId: input.articleId,
    createdAt: now,
    lastActivityAt: now,
    replyCount: 0,
    upvotes: 0,
    hasAcceptedAnswer: false,
    isAnswered: false,
    isPinned: false,
    moderationStatus: 'active',
    subscriberIds: [],
    tagIds: [],
  };
}

export function createReply(input: { threadId: string; body: string; authorId: string; authorName: string; authorVerified: boolean; isAnonymous: boolean; stance?: ForumReply['stance']; parentId?: string }): ForumReply {
  return {
    id: `reply-${new Date().toISOString()}-${Math.random().toString(36).slice(2, 8)}`,
    threadId: input.threadId,
    parentId: input.parentId,
    body: sanitizeText(input.body, 3000),
    authorId: input.authorId,
    authorName: input.isAnonymous ? 'Mwananchi' : sanitizeText(input.authorName, 100),
    authorVerified: input.authorVerified,
    isAnonymous: input.isAnonymous,
    stance: input.stance,
    isExpertContribution: input.stance === 'expert',
    createdAt: new Date().toISOString(),
    upvotes: 0,
    moderationStatus: 'active',
  };
}

export function nestReplies(flat: ForumReply[]): ForumReply[] {
  const byId = new Map(flat.map(r => [r.id, { ...r, children: [] as ForumReply[] }]));
  const roots: ForumReply[] = [];
  for (const reply of byId.values()) {
    if (reply.parentId && byId.has(reply.parentId)) byId.get(reply.parentId)!.children!.push(reply);
    else roots.push(reply);
  }
  return roots;
}

export async function loadSubscriptions(userId: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(SUBSCRIPTIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Record<string, string[]>;
    return parsed[userId] ?? [];
  } catch { return []; }
}

export async function toggleSubscription(userId: string, threadId: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(SUBSCRIPTIONS_KEY);
    const parsed: Record<string, string[]> = raw ? JSON.parse(raw) : {};
    const current = new Set(parsed[userId] ?? []);
    if (current.has(threadId)) current.delete(threadId); else current.add(threadId);
    const updated = Array.from(current);
    parsed[userId] = updated;
    await AsyncStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(parsed));
    return updated;
  } catch { return []; }
}

export async function reportContent(input: { threadId?: string; replyId?: string; reason: string; reporterId: string }): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(REPORTS_KEY);
    const parsed = raw ? JSON.parse(raw) as any[] : [];
    parsed.push({ ...input, at: new Date().toISOString() });
    await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(parsed));
  } catch (e) {
    console.warn('[forum] report save failed', e);
  }
}
