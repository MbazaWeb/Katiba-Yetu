import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/sections/AppHeader';
import { Colors, Typography, Spacing, Radius } from '../constants/tokens';
import { useAppContext } from '../hooks/useAppContext';
import { Action, Notice, libraryStyles as s } from '../components/library/LibraryUI';
import {
  loadForumState, saveForumState, filterThreads, createThread, createReply, nestReplies,
  type ForumFilters,
} from '../services/forum';
import { DISCUSSION_CATEGORIES } from '../types';
import type { ForumThread, ForumReply, DiscussionCategory } from '../types';

export function DiscussionScreen({ onBack }: { onBack?: () => void }) {
  const { language, user } = useAppContext();
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [repliesMap, setRepliesMap] = useState<Record<string, ForumReply[]>>({});
  const [filters, setFilters] = useState<ForumFilters>({ category: 'all', query: '', filter: 'all' });
  const [selectedThread, setSelectedThread] = useState<ForumThread | null>(null);
  const [showNewThread, setShowNewThread] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [draftCategory, setDraftCategory] = useState<DiscussionCategory>('mjadala_wa_jumla');
  const [replyDraft, setReplyDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const copy = (sw: string, en: string) => language === 'sw' ? sw : en;

  useEffect(() => {
    let live = true;
    loadForumState().then(state => {
      if (!live) return;
      setThreads(state.threads);
      setRepliesMap(state.replies);
    });
    return () => { live = false; };
  }, []);

  const persist = useCallback(async (next: ForumThread[], replies: Record<string, ForumReply[]>) => {
    setThreads(next); setRepliesMap(replies);
    await saveForumState(next, replies);
  }, []);

  const filtered = filterThreads(threads, filters);

  async function submitNewThread() {
    if (!draftTitle.trim() || !draftBody.trim()) return;
    setBusy(true);
    try {
      const author = user ?? { id: 'anon', display_name: 'Mwananchi', verification_tier: 'none' as const };
      const thread = createThread({
        category: draftCategory,
        title: draftTitle,
        body: draftBody,
        isAnonymous: true,
        authorId: author.id,
        authorName: author.display_name,
        authorVerified: false,
      });
      await persist([thread, ...threads], { ...repliesMap, [thread.id]: [] });
      setDraftTitle(''); setDraftBody(''); setShowNewThread(false);
    } finally { setBusy(false); }
  }

  async function submitReply() {
    if (!selectedThread || !replyDraft.trim()) return;
    setBusy(true);
    try {
      const author = user ?? { id: 'anon', display_name: 'Mwananchi', verification_tier: 'none' as const };
      const reply = createReply({
        threadId: selectedThread.id,
        body: replyDraft,
        authorId: author.id,
        authorName: author.display_name,
        authorVerified: false,
        isAnonymous: true,
      });
      const updatedReplies = { ...repliesMap, [selectedThread.id]: [...(repliesMap[selectedThread.id] ?? []), reply] };
      const updatedThreads = threads.map(t => t.id === selectedThread.id
        ? { ...t, replyCount: t.replyCount + 1, lastActivityAt: new Date().toISOString(), isAnswered: true }
        : t
      );
      await persist(updatedThreads, updatedReplies);
      setReplyDraft('');
      setSelectedThread(updatedThreads.find(t => t.id === selectedThread.id) ?? null);
    } finally { setBusy(false); }
  }

  return (
    <View style={styles.root}>
      <AppHeader showBack={!!onBack} onBack={onBack} title={copy('Majadiliano', 'Discussions')} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Ionicons name="chatbubbles-outline" size={34} color={Colors.green[300]} />
          <Text style={styles.heroTitle}>{copy('Jukwaa la Majadiliano', 'Discussion Forum')}</Text>
          <Text style={styles.heroSub}>
            {copy(
              'Jadili katiba, historia, haki, muungano na maboresho. Michango yako huhifadhiwa kwenye kifaa hiki tu.',
              'Discuss the constitution, history, rights, the union and reform. Your contributions are stored only on this device.'
            )}
          </Text>
        </View>

        <View style={styles.row}>
          <Action primary label={copy('+ Mjadala mpya', '+ New discussion')} onPress={() => setShowNewThread(true)} />
        </View>

        <TextInput
          accessibilityLabel={copy('Tafuta mjadala', 'Search discussion')}
          value={filters.query}
          onChangeText={query => setFilters(f => ({ ...f, query }))}
          placeholder={copy('Tafuta kwa jina…', 'Search by title…')}
          placeholderTextColor={Colors.text.muted}
          style={[s.input, { fontSize: 16 }]}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
          <Action label={copy('Zote', 'All')} selected={filters.category === 'all'} onPress={() => setFilters(f => ({ ...f, category: 'all' }))} />
          {DISCUSSION_CATEGORIES.map(c => (
            <Action key={c.key} label={language === 'sw' ? c.sw : c.en} selected={filters.category === c.key} onPress={() => setFilters(f => ({ ...f, category: c.key }))} />
          ))}
        </ScrollView>

        <View style={styles.row}>
          <Action label={copy('Wote', 'All')} selected={filters.filter === 'all'} onPress={() => setFilters(f => ({ ...f, filter: 'all' }))} />
          <Action label={copy('Haijajibiwa', 'Unanswered')} selected={filters.filter === 'unanswered'} onPress={() => setFilters(f => ({ ...f, filter: 'unanswered' }))} />
          <Action label={copy('Imejibiwa', 'Answered')} selected={filters.filter === 'answered'} onPress={() => setFilters(f => ({ ...f, filter: 'answered' }))} />
        </View>

        <Text style={styles.countText}>{copy('Mijadala', 'Threads')}: {filtered.length}</Text>

        {filtered.map(thread => {
          const cat = DISCUSSION_CATEGORIES.find(c => c.key === thread.category)!;
          return (
            <Pressable key={thread.id} style={({ pressed }) => [styles.threadCard, pressed && { opacity: 0.75 }]} onPress={() => setSelectedThread(thread)} accessibilityRole="button">
              <View style={styles.threadHeader}>
                <Text style={styles.threadCategory}>{language === 'sw' ? cat.sw : cat.en}</Text>
                {thread.isPinned && <Ionicons name="pin-outline" size={14} color={Colors.gold[400]} />}
              </View>
              <Text style={styles.threadTitle}>{thread.title}</Text>
              <Text style={styles.threadBody} numberOfLines={2}>{thread.body}</Text>
              <View style={styles.threadFooter}>
                <View style={styles.threadMeta}>
                  <Ionicons name="chatbox-outline" size={14} color={Colors.text.muted} />
                  <Text style={styles.metaText}>{thread.replyCount}</Text>
                </View>
                <View style={styles.threadMeta}>
                  <Ionicons name="heart-outline" size={14} color={Colors.text.muted} />
                  <Text style={styles.metaText}>{thread.upvotes}</Text>
                </View>
                {thread.isAnswered ? (
                  <View style={[styles.statusPill, styles.answered]}>
                    <Ionicons name="checkmark-circle" size={12} color={Colors.green[400]} />
                    <Text style={[styles.statusText, { color: Colors.green[400] }]}>{copy('Imejibiwa', 'Answered')}</Text>
                  </View>
                ) : (
                  <View style={[styles.statusPill, styles.unanswered]}>
                    <Text style={[styles.statusText, { color: Colors.text.muted }]}>{copy('Haijajibiwa', 'Unanswered')}</Text>
                  </View>
                )}
                <Text style={styles.timeText}>{new Date(thread.lastActivityAt).toLocaleDateString()}</Text>
              </View>
            </Pressable>
          );
        })}

        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color={Colors.text.muted} />
            <Text style={styles.emptyText}>{copy('Hakuna mjadala unaofanana. Anzisha mjadala mpya.', 'No matching discussions. Start a new one.')}</Text>
          </View>
        )}

        <Notice>
          {copy(
            'Michango hii si maandishi rasmi ya Katiba. Inahifadhiwa kwenye kifaa chako pekee; hakichapishwi kwa umma.',
            'Contributions are not official constitutional text. They are stored on your device only; nothing is published publicly.'
          )}
        </Notice>
      </ScrollView>

      {/* New thread modal */}
      <Modal visible={showNewThread} animationType="slide" transparent onRequestClose={() => setShowNewThread(false)}>
        <View style={styles.scrim}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{copy('Mjadala mpya', 'New discussion')}</Text>
              <Pressable onPress={() => setShowNewThread(false)}><Ionicons name="close" size={24} color={Colors.text.muted} /></Pressable>
            </View>
            <ScrollView contentContainerStyle={{ gap: Spacing[3] }}>
              <Text style={styles.label}>{copy('Kategoria', 'Category')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {DISCUSSION_CATEGORIES.map(c => (
                  <Action key={c.key} label={language === 'sw' ? c.sw : c.en} selected={draftCategory === c.key} onPress={() => setDraftCategory(c.key)} />
                ))}
              </ScrollView>
              <Text style={styles.label}>{copy('Jina la mjadala', 'Discussion title')}</Text>
              <TextInput style={[s.input, { fontSize: 16 }]} value={draftTitle} onChangeText={setDraftTitle} placeholder={copy('Andika jina…', 'Enter title…')} placeholderTextColor={Colors.text.muted} maxLength={200} />
              <Text style={styles.label}>{copy('Maudhui', 'Body')}</Text>
              <TextInput style={[s.input, { minHeight: 120 }]} value={draftBody} onChangeText={setDraftBody} placeholder={copy('Andika mjadala wako…', 'Write your discussion…')} placeholderTextColor={Colors.text.muted} multiline maxLength={3000} />
              <Action primary label={copy('Tuma', 'Submit')} disabled={busy || !draftTitle.trim() || !draftBody.trim()} onPress={() => { void submitNewThread(); }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Thread detail modal */}
      <Modal visible={!!selectedThread} animationType="slide" transparent onRequestClose={() => setSelectedThread(null)}>
        <View style={styles.scrim}>
          <View style={[styles.sheet, { flex: 1 }]}>
            {selectedThread && (
              <>
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle} numberOfLines={2}>{selectedThread.title}</Text>
                  <Pressable onPress={() => setSelectedThread(null)}><Ionicons name="close" size={24} color={Colors.text.muted} /></Pressable>
                </View>
                <ScrollView contentContainerStyle={{ gap: Spacing[3], paddingBottom: Spacing[5] }}>
                  <Text style={styles.threadBody}>{selectedThread.body}</Text>
                  <Text style={styles.metaText}>{new Date(selectedThread.createdAt).toLocaleString()}</Text>
                  <Text style={styles.label}>{copy('Majibu', 'Replies')} ({(repliesMap[selectedThread.id] ?? []).length})</Text>
                  {nestReplies(repliesMap[selectedThread.id] ?? []).map(reply => (
                    <View key={reply.id} style={styles.replyCard}>
                      <Text style={styles.replyAuthor}>{reply.authorName}{reply.isExpertContribution ? ' · ' + copy('Mtaalamu', 'Expert') : ''}</Text>
                      <Text style={styles.replyBody}>{reply.body}</Text>
                      <Text style={styles.metaText}>{new Date(reply.createdAt).toLocaleString()}</Text>
                    </View>
                  ))}
                  {(repliesMap[selectedThread.id] ?? []).length === 0 && (
                    <Text style={styles.emptyText}>{copy('Hakuna majibu bado. Kuwa wa kwanza kujibu.', 'No replies yet. Be the first to reply.')}</Text>
                  )}
                  <View style={{ height: 16 }} />
                </ScrollView>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                  <View style={styles.replyBar}>
                    <TextInput style={[s.input, { flex: 1, minHeight: 44 }]} value={replyDraft} onChangeText={setReplyDraft} placeholder={copy('Andika jibu…', 'Write a reply…')} placeholderTextColor={Colors.text.muted} maxLength={3000} />
                    <Action primary label={copy('Tuma', 'Send')} disabled={busy || !replyDraft.trim()} onPress={() => { void submitReply(); }} />
                  </View>
                </KeyboardAvoidingView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface.base },
  content: { padding: Spacing[5], paddingBottom: Spacing[20], maxWidth: 920, alignSelf: 'center', width: '100%', gap: Spacing[4] },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  hero: { alignItems: 'center', gap: Spacing[2], paddingVertical: Spacing[3] },
  heroTitle: { fontFamily: Typography.family.serif, fontSize: Typography.size['2xl'], fontWeight: Typography.weight.bold, color: Colors.text.primary, textAlign: 'center' },
  heroSub: { fontSize: Typography.size.sm, color: Colors.text.muted, textAlign: 'center', maxWidth: 560, lineHeight: 21 },
  countText: { fontSize: Typography.size.sm, color: Colors.text.muted },
  threadCard: { backgroundColor: Colors.surface.raised, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.surface.borderStrong, padding: Spacing[4], gap: Spacing[2] },
  threadHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  threadCategory: { fontSize: Typography.size.xs, color: Colors.green[300], fontWeight: Typography.weight.medium, textTransform: 'uppercase', letterSpacing: 0.5 },
  threadTitle: { fontSize: Typography.size.lg, fontWeight: Typography.weight.semibold, color: Colors.text.primary },
  threadBody: { fontSize: Typography.size.sm, color: Colors.text.secondary, lineHeight: 21 },
  threadFooter: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], marginTop: Spacing[1] },
  threadMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: Typography.size.xs, color: Colors.text.muted },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing[2], paddingVertical: 2, borderRadius: Radius.full, backgroundColor: Colors.surface.overlay },
  answered: { backgroundColor: Colors.green[900] },
  unanswered: {},
  statusText: { fontSize: Typography.size.xs, fontWeight: Typography.weight.medium },
  timeText: { fontSize: Typography.size.xs, color: Colors.text.muted, marginLeft: 'auto' },
  emptyState: { alignItems: 'center', gap: Spacing[3], paddingVertical: Spacing[8] },
  emptyText: { color: Colors.text.muted, fontSize: Typography.size.sm, textAlign: 'center', maxWidth: 320 },
  scrim: { flex: 1, backgroundColor: '#00000099', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surface.base, borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'], padding: Spacing[5], maxHeight: '90%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[3] },
  sheetTitle: { fontFamily: Typography.family.serif, fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.text.primary, flex: 1 },
  label: { fontSize: Typography.size.sm, color: Colors.text.secondary, fontWeight: Typography.weight.medium },
  replyCard: { backgroundColor: Colors.surface.raised, borderRadius: Radius.md, padding: Spacing[3], gap: Spacing[1], borderWidth: 1, borderColor: Colors.surface.border },
  replyAuthor: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.green[300] },
  replyBody: { fontSize: Typography.size.sm, color: Colors.text.secondary, lineHeight: 21 },
  replyBar: { flexDirection: 'row', gap: Spacing[2], padding: Spacing[3], borderTopWidth: 1, borderTopColor: Colors.surface.border, backgroundColor: Colors.surface.raised, alignItems: 'center' },
});

export default DiscussionScreen;
