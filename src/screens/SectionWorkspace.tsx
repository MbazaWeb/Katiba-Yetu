import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Modal, Platform, Linking, StyleSheet, useWindowDimensions, KeyboardAvoidingView, SafeAreaView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppHeader } from '../components/sections/AppHeader';
import { Action, Notice, libraryStyles as s } from '../components/library/LibraryUI';
import { ChapterTree } from '../components/library/ChapterTree';
import { ClarificationPanel } from '../components/library/ClarificationPanel';
import { CommunityPanel } from '../components/library/CommunityPanel';
import { useArticleCommunity } from '../hooks/useArticleCommunity';
import { useAppContext } from '../hooks/useAppContext';
import { DISCLAIMER, asSection, citationFor, documents, getArticle, getBundle, localized, officialText } from '../services/constitution';
import { copyCitation, downloadArticle, shareArticle } from '../services/articleActions';
import { katibaAudioService, type AudioController } from '../services/audio';
import { StorageKeys } from '../lib/storage';
import { Colors, Layout, Typography, Spacing, Radius } from '../constants/tokens';
import { scaledSize } from '../utils';
import type { ConstitutionArticle, ConstitutionClause, Section } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';
import { getBookmark, setBookmark } from '../services/community';

type ReaderTab = 'read' | 'explain' | 'discussions' | 'suggestions' | 'polls' | 'references';
interface Props { section: Section; onBack: () => void; onSectionPress: (section: Section) => void }
export function SectionWorkspace({ section, onBack, onSectionPress }: Props) {
  const article = getArticle(section.id);
  const { language } = useAppContext();
  if (!article) return <View style={s.root}><AppHeader showBack onBack={onBack} title={language === 'sw' ? 'Maandishi hayajapatikana' : 'Text unavailable'} /><View style={s.content}><Notice>{language === 'sw' ? 'Ibara hii bado haijaingizwa katika orodha ya chanzo.' : 'This article has not been imported into the source index.'}</Notice><Action label={language === 'sw' ? 'Rudi' : 'Back'} onPress={onBack} /></View></View>;
  return <ArticleReader key={article.id} article={article} onBack={onBack} onSelect={next => onSectionPress(asSection(next))} />;
}

function ArticleReader({ article, onBack, onSelect }: { article: ConstitutionArticle; onBack: () => void; onSelect: (article: ConstitutionArticle) => void }) {
  const { language, setLanguage, fontSize, user } = useAppContext();
  const { width } = useWindowDimensions();
  const desktop = Platform.OS === 'web' && width >= Layout.breakpointDesktop;
  const sidePanel = desktop && width >= 1600;
  const [tab, setTab] = useState<ReaderTab>('read');
  const [drawer, setDrawer] = useState(false);
  const [clarify, setClarify] = useState(false);
  const [navDocument, setNavDocument] = useState(article.documentId);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkReady, setBookmarkReady] = useState(false);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioRate, setAudioRate] = useState(1);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const audioControllerRef = useRef<AudioController | null>(null);
  const scroll = useRef<ScrollView>(null);
  const community = useArticleCommunity(article);
  const bundle = getBundle(article.documentId), doc = bundle.document;
  const chapter = bundle.chapters.find(ch => ch.id === article.chapterId)!;
  const text = officialText(article, language);
  const source = text?.source ?? article.source;
  const ordered = bundle.articles.slice().sort((a, b) => a.order - b.order);
  const index = ordered.findIndex(a => a.id === article.id);
  const previous = ordered[index - 1], next = ordered[index + 1];
  const copy = (sw: string, en: string) => language === 'sw' ? sw : en;
  const parts: string[] = [];
  let part = bundle.parts.find(p => p.id === article.partId);
  while (part) { parts.unshift(`${copy('Sehemu', 'Part')} ${part.number}: ${localized(part.title, language)}`); part = bundle.parts.find(p => p.id === part?.parentPartId); }

  // Load like state
  useEffect(() => {
    let live = true;
    const likeKey = `@katibayetu/likes/${article.id}`;
    AsyncStorage.getItem(likeKey).then(raw => {
      if (live && raw) { const data = JSON.parse(raw); setLiked(data.liked ?? false); setLikeCount(data.count ?? 0); }
    }).catch(() => {});
    return () => { live = false; };
  }, [article.id]);

  // Bookmark
  useEffect(() => {
    let live = true;
    if (isSupabaseConfigured && user) {
      getBookmark(article.id).then(value => { if (live) { setBookmarked(Boolean(value)); setBookmarkReady(true); } }).catch(() => { if (live) setMessage('Hifadhi haipatikani / Storage unavailable'); });
      return () => { live = false; };
    }
    AsyncStorage.getItem(StorageKeys.bookmarks).then(raw => {
      const ids: unknown = JSON.parse(raw ?? '[]');
      if (!Array.isArray(ids)) throw new Error('Invalid bookmarks');
      if (live) { setBookmarked(ids.includes(article.id) || !!article.legacySectionId && ids.includes(article.legacySectionId)); setBookmarkReady(true); }
    }).catch(() => { if (live) setMessage('Hifadhi haipatikani / Storage unavailable'); });
    return () => { live = false; };
  }, [article.id, article.legacySectionId, user]);

  async function toggleLike() {
    const newLiked = !liked;
    const newCount = likeCount + (newLiked ? 1 : -1);
    setLiked(newLiked);
    setLikeCount(Math.max(0, newCount));
    const likeKey = `@katibayetu/likes/${article.id}`;
    try { await AsyncStorage.setItem(likeKey, JSON.stringify({ liked: newLiked, count: newCount })); } catch {}
  }

  async function bookmark() {
    if (!bookmarkReady || bookmarkBusy) return;
    setBookmarkBusy(true);
    try {
      if (isSupabaseConfigured && user) {
        await setBookmark(article.id, !bookmarked);
        setBookmarked(!bookmarked);
        setMessage(copy('Alama imehifadhiwa.', 'Bookmark updated.'));
        return;
      }
      const ids: string[] = JSON.parse(await AsyncStorage.getItem(StorageKeys.bookmarks) ?? '[]');
      const updated = ids.filter(id => id !== article.id && id !== article.legacySectionId);
      if (!bookmarked) updated.push(article.id);
      await AsyncStorage.setItem(StorageKeys.bookmarks, JSON.stringify(updated)); setBookmarked(!bookmarked);
      setMessage(copy('Alama imehifadhiwa.', 'Bookmark updated.'));
    } catch { setMessage(copy('Alama haijahifadhiwa.', 'Could not save bookmark.')); }
    finally { setBookmarkBusy(false); }
  }
  async function perform(action: 'copy' | 'share' | 'download' | 'source') {
    setMessage('');
    try {
      if (action === 'copy') { await copyCitation(article, language); setMessage(copy('Rejea imenakiliwa.', 'Citation copied.')); }
      if (action === 'share') { const result = await shareArticle(article, language); setMessage(result === 'copied' ? copy('Rejea imenakiliwa kwa kushiriki.', 'Citation copied for sharing.') : copy('Dirisha la kushiriki limefunguliwa.', 'Share dialog opened.')); }
      if (action === 'download') await downloadArticle(article, language);
      if (action === 'source' && source.sourceUrl) await Linking.openURL(source.sourceUrl);
    } catch { setMessage(copy('Hatua haijakamilika. Jaribu tena.', 'Action did not complete. Please retry.')); }
  }
  function toggleAudio() {
    if (!katibaAudioService.isSupported()) { setMessage(copy('Sauti haipatikani kwenye kifaa hiki.', 'Audio is not supported on this device.')); return; }
    if (audioPlaying) { audioControllerRef.current?.pause(); setAudioPlaying(false); return; }
    if (audioControllerRef.current) { audioControllerRef.current.resume(); setAudioPlaying(true); return; }
    audioControllerRef.current = katibaAudioService.speak(article, language, {
      onstart: () => setAudioPlaying(true), onend: () => { setAudioPlaying(false); audioControllerRef.current = null; },
      onpause: () => setAudioPlaying(false), onresume: () => setAudioPlaying(true),
      onerror: (err) => { setMessage(err); setAudioPlaying(false); audioControllerRef.current = null; },
    });
    if (audioControllerRef.current) audioControllerRef.current.setRate(audioRate);
  }
  function changeRate() {
    const rates = [1, 1.25, 1.5, 0.75];
    const next = rates[(rates.indexOf(audioRate) + 1) % rates.length];
    setAudioRate(next); audioControllerRef.current?.setRate(next);
  }
  function stopAudio() { audioControllerRef.current?.stop(); audioControllerRef.current = null; setAudioPlaying(false); }
  useEffect(() => () => { stopAudio(); }, [article.id]);

  const navTree = <ScrollView contentContainerStyle={{ padding: 14, gap: 14 }}>
    <Text style={s.heading}>{copy('Hati na sura', 'Documents and chapters')}</Text>
    {!desktop && <Action label={copy('Funga menyu', 'Close navigation')} onPress={() => setDrawer(false)} />}
    {documents.map(document => <Action key={document.id} label={`${localized(document.title, language)} (${document.year})`} selected={document.id === navDocument} onPress={() => setNavDocument(document.id)} />)}
    <ChapterTree key={`${navDocument}-${article.id}`} documentId={navDocument} selectedId={article.id} onSelect={selected => { setDrawer(false); onSelect(selected); }} />
  </ScrollView>;

  const tabs: { key: ReaderTab; label: string; count?: number }[] = [
    { key: 'read', label: copy('Soma', 'Read') },
    { key: 'explain', label: copy('Ufafanuzi', 'Explain') },
    { key: 'discussions', label: copy('Maoni', 'Comments'), count: community.ready ? community.data.discussions.length : undefined },
    { key: 'suggestions', label: copy('Mapendekezo', 'Proposals'), count: community.ready ? community.data.suggestions.length : undefined },
    { key: 'polls', label: copy('Kura', 'Vote'), count: community.polls.length },
    { key: 'references', label: copy('Marejeo', 'Sources') },
  ];

  // Social action buttons — displayed below the article card
  const socialActions = (
    <View style={styles.socialBar}>
      {/* Like */}
      <Pressable style={styles.socialBtn} onPress={() => { void toggleLike(); }} accessibilityRole="button" accessibilityLabel={copy('Pendelea', 'Like')}>
        <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={liked ? Colors.red[400] : Colors.text.muted} />
        <Text style={[styles.socialText, liked && { color: Colors.red[400] }]}>{likeCount > 0 ? likeCount : ''}</Text>
      </Pressable>
      {/* Comment */}
      <Pressable style={styles.socialBtn} onPress={() => setTab('discussions')} accessibilityRole="button" accessibilityLabel={copy('Toa maoni', 'Comment')}>
        <Ionicons name="chatbubble-outline" size={22} color={Colors.text.muted} />
        <Text style={styles.socialText}>{community.ready ? community.data.discussions.length : 0}</Text>
      </Pressable>
      {/* Ufafanuzi — Clarification */}
      <Pressable style={styles.socialBtn} onPress={() => setClarify(true)} accessibilityRole="button" accessibilityLabel={copy('Uliza ufafanuzi', 'Ask clarification')}>
        <Ionicons name="bulb-outline" size={22} color={Colors.gold[400]} />
        <Text style={styles.socialText}>{copy('Ufafanuzi', 'Explain')}</Text>
      </Pressable>
      {/* Mapendekezo — Proposal */}
      <Pressable style={styles.socialBtn} onPress={() => setTab('suggestions')} accessibilityRole="button" accessibilityLabel={copy('Pendekeza', 'Propose')}>
        <Ionicons name="megaphone-outline" size={22} color={Colors.green[400]} />
        <Text style={styles.socialText}>{copy('Pendekeza', 'Propose')}</Text>
      </Pressable>
      {/* Vote */}
      <Pressable style={styles.socialBtn} onPress={() => setTab('polls')} accessibilityRole="button" accessibilityLabel={copy('Piga kura', 'Vote')}>
        <Ionicons name="stats-chart-outline" size={22} color={Colors.blue[400]} />
        <Text style={styles.socialText}>{community.polls.length > 0 ? community.polls.length : ''}</Text>
      </Pressable>
      {/* Share */}
      <Pressable style={styles.socialBtn} onPress={() => { void perform('share'); }} accessibilityRole="button" accessibilityLabel={copy('Shiriki', 'Share')}>
        <Ionicons name="share-social-outline" size={22} color={Colors.text.muted} />
        <Text style={styles.socialText}>{copy('Shiriki', 'Share')}</Text>
      </Pressable>
    </View>
  );

  return <View style={s.root}>
    <AppHeader showBack onBack={onBack} title={`${copy('Ibara', 'Article')} ${article.number}`} subtitle={localized(doc.title, language)} />
    <View style={styles.columns}>
      {desktop && <View style={[styles.navigation, { width: width < 1200 ? 210 : 250 }]}>{navTree}</View>}
      <View style={s.root}>
        {!desktop && (
          <View style={styles.chapterBar}>
            <Pressable style={styles.chapterBtn} onPress={() => setDrawer(true)} accessibilityRole="button" accessibilityLabel={copy('Sura na ibara', 'Chapters and articles')}>
              <Ionicons name="menu-outline" size={20} color={Colors.green[300]} />
              <Text style={styles.chapterBtnText}>{copy('Sura na Ibara', 'Chapters')}</Text>
            </Pressable>
          </View>
        )}
        <ScrollView horizontal style={styles.tabScroll} contentContainerStyle={styles.tabs} showsHorizontalScrollIndicator={false}>
          {tabs.map(item => <Action key={item.key} label={`${item.label}${item.count === undefined ? '' : ` (${item.count})`}`} selected={tab === item.key} onPress={() => { setTab(item.key); scroll.current?.scrollTo({ y: 0, animated: false }); }} />)}
        </ScrollView>
        <ScrollView ref={scroll} contentContainerStyle={styles.reader} keyboardShouldPersistTaps="handled">
          {/* Breadcrumb */}
          <Text style={s.small}>{localized(doc.title, language)} › {copy('Sura', 'Chapter')} {chapter.number}: {localized(chapter.title, language)}{parts.length ? ` › ${parts.join(' › ')}` : ''} › {copy('Ibara', 'Article')} {article.number}</Text>

          {/* ═══ ARTICLE CARD ═══ */}
          <View style={styles.articleCard}>
            {/* Card header: article number + title */}
            <View style={styles.cardHeader}>
              <View style={styles.articleNumberBadge}>
                <Text style={styles.articleNumberText}>{article.number}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text accessibilityRole="header" style={styles.cardTitle}>{text?.title ?? localized(article.title, language)}</Text>
                {!article.title[language] && !text && <Text style={styles.cardSubTitle}>{copy('Kichwa kutoka kwenye chanzo', 'Title from source')}</Text>}
              </View>
              <Pressable onPress={() => { void bookmark(); }} disabled={!bookmarkReady || bookmarkBusy} accessibilityRole="button" accessibilityLabel={copy('Alama', 'Bookmark')} hitSlop={8}>
                <Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={26} color={bookmarked ? Colors.gold[400] : Colors.text.muted} />
              </Pressable>
            </View>

            {/* Language switcher */}
            <View style={styles.langRow}>
              {(['sw', 'en'] as const).map(lang => (
                <Pressable key={lang} onPress={() => setLanguage(lang)} style={[styles.langPill, language === lang && styles.langPillActive]} accessibilityRole="button" accessibilityState={{ selected: language === lang }}>
                  <Text style={[styles.langText, language === lang && styles.langTextActive]}>{lang === 'sw' ? 'Kiswahili' : 'English'}</Text>
                </Pressable>
              ))}
            </View>

            {/* Audio controls */}
            {text && (
              <View style={styles.audioRow}>
                <Pressable style={styles.audioBtn} onPress={toggleAudio} accessibilityRole="button" accessibilityLabel={audioPlaying ? copy('Sitisha', 'Pause') : copy('Sikiliza', 'Listen')}>
                  <Ionicons name={audioPlaying ? 'pause-circle' : 'volume-high'} size={20} color={Colors.green[300]} />
                  <Text style={styles.audioBtnText}>{audioPlaying ? copy('Sitisha', 'Pause') : copy('Sikiliza', 'Listen')}</Text>
                </Pressable>
                {audioPlaying && <Pressable style={styles.audioBtn} onPress={changeRate}><Text style={styles.audioBtnText}>{audioRate}×</Text></Pressable>}
                {audioPlaying && <Pressable style={styles.audioBtn} onPress={stopAudio}><Ionicons name="stop-circle-outline" size={20} color={Colors.red[300]} /></Pressable>}
              </View>
            )}

            {/* Article text content */}
            {tab === 'read' && (
              <View style={styles.articleBody}>
                {text ? (
                  <>
                    {text.preamble ? <Text selectable style={[styles.officialText, { fontSize: scaledSize(18, fontSize), lineHeight: scaledSize(31, fontSize) }]}>{text.preamble}</Text> : null}
                    <ClauseList clauses={text.clauses} fontSize={scaledSize(18, fontSize)} />
                  </>
                ) : (
                  <View style={styles.textUnavailable}>
                    <Ionicons name="document-text-outline" size={40} color={Colors.text.muted} />
                    <Text style={styles.textUnavailableTitle}>{copy('Maandishi hayajapatikana', 'Text unavailable')}</Text>
                    <Text style={styles.textUnavailableBody}>{copy('Maandishi kamili rasmi yaliyohakikiwa katika lugha hii hayajapatikana. Fungua PDF ya chanzo.', 'Full verified official text in this language is unavailable. Open the source PDF.')}</Text>
                    {source.sourceUrl && <Pressable style={styles.sourceBtn} onPress={() => { void perform('source'); }}><Text style={styles.sourceBtnText}>{copy('Fungua PDF', 'Open PDF')}</Text></Pressable>}
                  </View>
                )}
              </View>
            )}

            {/* Explain tab content */}
            {tab === 'explain' && (
              <View style={styles.articleBody}>
                <Text style={s.heading}>{copy('Maelezo kwa lugha rahisi', 'Plain-language explanations')}</Text>
                {bundle.explanations.filter(e => e.articleId === article.id && e.language === language && e.documentVersion === source.documentVersion && e.kind === 'reviewed').map(e => (
                  <View key={e.id} style={styles.explainCard}><Text selectable style={s.body}>{e.text}</Text><Text style={s.small}>{copy('Mkaguzi', 'Reviewer')}: {e.reviewedBy}</Text></View>
                ))}
                {!bundle.explanations.some(e => e.articleId === article.id && e.language === language && e.kind === 'reviewed') && <Notice>{copy('Ufafanuzi uliohakikiwa bado haujapatikana.', 'A reviewed explanation is not yet available.')}</Notice>}
                <Pressable style={styles.clarifyBtn} onPress={() => setClarify(true)}><Ionicons name="bulb-outline" size={18} color={Colors.gold[400]} /><Text style={styles.clarifyBtnText}>{copy('Uliza ufafanuzi', 'Ask for clarification')}</Text></Pressable>
                <Text style={s.small}>{DISCLAIMER}</Text>
              </View>
            )}

            {/* Community tabs */}
            {(tab === 'discussions' || tab === 'suggestions' || tab === 'polls') && (
              <View style={styles.articleBody}><CommunityPanel key={tab} kind={tab} community={community} /></View>
            )}

            {/* References tab */}
            {tab === 'references' && (
              <View style={styles.articleBody}>
                <Text style={s.heading}>{copy('Chanzo na uhakiki', 'Source and verification')}</Text>
                <Text style={s.body}>{copy('Chanzo rasmi', 'Official source')}: {source.officialSource}</Text>
                <Text selectable style={s.body}>{source.sourceUrl ?? copy('Kiungo hakijapatikana', 'Source URL unavailable')}</Text>
                <Text style={s.body}>{copy('Toleo', 'Version')}: {source.documentVersion}</Text>
                <Text style={s.body}>{copy('Uhakiki', 'Verification')}: {text ? copy('Imehakikiwa', 'Verified') : copy('Haijahakikiwa', 'Unverified')}</Text>
                <Text selectable style={s.body}>{citationFor(article, language).formatted}</Text>
                {source.sourceUrl && <Pressable style={styles.sourceBtn} onPress={() => { void perform('source'); }}><Text style={styles.sourceBtnText}>{copy('Fungua chanzo rasmi', 'Open official source')}</Text></Pressable>}
              </View>
            )}

            {/* ═══ SOCIAL ACTION BAR ═══ */}
            {socialActions}

            {/* Quick action row */}
            <View style={styles.quickActions}>
              <Pressable style={styles.quickBtn} onPress={() => { void perform('copy'); }}><Ionicons name="copy-outline" size={18} color={Colors.text.muted} /><Text style={styles.quickBtnText}>{copy('Nakili', 'Copy')}</Text></Pressable>
              <Pressable style={styles.quickBtn} onPress={() => { void perform('share'); }}><Ionicons name="share-outline" size={18} color={Colors.text.muted} /><Text style={styles.quickBtnText}>{copy('Shiriki', 'Share')}</Text></Pressable>
              {text && <Pressable style={styles.quickBtn} onPress={() => { void perform('download'); }}><Ionicons name="download-outline" size={18} color={Colors.text.muted} /><Text style={styles.quickBtnText}>{copy('Pakua', 'Download')}</Text></Pressable>}
            </View>
          </View>

          {/* Pagination: Previous / Next article */}
          <View style={styles.paginationCard}>
            <Pressable style={[styles.pageBtn, !previous && styles.pageBtnDisabled]} disabled={!previous} onPress={() => previous && onSelect(previous)} accessibilityRole="button" accessibilityLabel={copy('Ibara iliyotangulia', 'Previous article')}>
              <Ionicons name="chevron-back" size={20} color={previous ? Colors.green[300] : Colors.text.muted} />
              <View>
                <Text style={styles.pageBtnLabel}>{copy('Iliyotangulia', 'Previous')}</Text>
                {previous && <Text style={styles.pageBtnArticle} numberOfLines={1}>{copy('Ibara', 'Article')} {previous.number}</Text>}
              </View>
            </Pressable>
            <Pressable style={[styles.pageBtn, !next && styles.pageBtnDisabled]} disabled={!next} onPress={() => next && onSelect(next)} accessibilityRole="button" accessibilityLabel={copy('Ibara inayofuata', 'Next article')}>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.pageBtnLabel}>{copy('Inayofuata', 'Next')}</Text>
                {next && <Text style={styles.pageBtnArticle} numberOfLines={1}>{copy('Ibara', 'Article')} {next.number}</Text>}
              </View>
              <Ionicons name="chevron-forward" size={20} color={next ? Colors.green[300] : Colors.text.muted} />
            </Pressable>
          </View>

          {message ? <Text accessibilityLiveRegion="polite" style={styles.messageText}>{message}</Text> : null}
          {!doc.inventoryComplete && <Text style={s.small}>{copy('Orodha ni sehemu tu ya hati. Sura na ibara nyingine bado hazijaingizwa.', 'Partial index. Other chapters and articles have not been imported.')}</Text>}
          <Text style={s.small}>{DISCLAIMER}</Text>
        </ScrollView>
      </View>
      {clarify && sidePanel && <View style={styles.clarification}><ClarificationPanel article={article} onClose={() => setClarify(false)} /></View>}
    </View>
    <Modal visible={drawer && !desktop} transparent animationType="slide" onRequestClose={() => setDrawer(false)}><View style={styles.scrim}><View accessibilityViewIsModal style={[styles.drawer, { width: Math.min(width - 24, 380) }]}>{navTree}</View></View></Modal>
    <Modal visible={clarify && !sidePanel} animationType="slide" onRequestClose={() => setClarify(false)}><SafeAreaView style={s.root}><KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ClarificationPanel key={article.id} article={article} onClose={() => setClarify(false)} /></KeyboardAvoidingView></SafeAreaView></Modal>
  </View>;
}

function ClauseList({ clauses, fontSize }: { clauses: ConstitutionClause[]; fontSize: number }) {
  return <View style={{ gap: 14 }}>{clauses.map(clause => <View key={clause.id} style={{ gap: 12 }}>
    <Text selectable style={[styles.officialText, { fontSize, lineHeight: fontSize * 1.75 }]}><Text style={{ fontWeight: '700' }}>{clause.number} </Text>{clause.text}</Text>
    {clause.children.length > 0 && <View style={{ paddingLeft: 16 }}><ClauseList clauses={clause.children} fontSize={fontSize} /></View>}
  </View>)}</View>;
}

const styles = StyleSheet.create({
  columns: { flex: 1, flexDirection: 'row', minHeight: 0 },
  navigation: { borderRightWidth: 1, borderColor: Colors.surface.borderStrong, backgroundColor: Colors.surface.raised },
  chapterBar: { padding: Spacing[2], borderBottomWidth: 1, borderBottomColor: Colors.surface.border },
  chapterBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: Spacing[2], borderRadius: Radius.md, backgroundColor: Colors.surface.overlay, minHeight: 44 },
  chapterBtnText: { color: Colors.green[300], fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold },
  tabScroll: { flexGrow: 0, flexShrink: 0, borderBottomWidth: 1, borderColor: Colors.surface.borderStrong },
  tabs: { padding: 8, gap: 6, alignItems: 'center' },
  reader: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 16, gap: 16, paddingBottom: 48 },
  // ─── Article card ───
  articleCard: { backgroundColor: Colors.surface.raised, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.surface.borderStrong, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], padding: Spacing[4], borderBottomWidth: 1, borderBottomColor: Colors.surface.border },
  articleNumberBadge: { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.green[900], borderWidth: 1, borderColor: Colors.green[400], alignItems: 'center', justifyContent: 'center' },
  articleNumberText: { color: Colors.green[300], fontSize: Typography.size.lg, fontWeight: Typography.weight.bold },
  cardTitle: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.text.primary, lineHeight: 28 },
  cardSubTitle: { fontSize: Typography.size.xs, color: Colors.text.muted, marginTop: 2, fontStyle: 'italic' },
  langRow: { flexDirection: 'row', gap: Spacing[2], paddingHorizontal: Spacing[4], paddingVertical: Spacing[2] },
  langPill: { paddingVertical: 4, paddingHorizontal: Spacing[3], borderRadius: Radius.full, backgroundColor: Colors.surface.overlay, borderWidth: 1, borderColor: Colors.surface.border },
  langPillActive: { backgroundColor: Colors.green[700], borderColor: Colors.green[400] },
  langText: { color: Colors.text.muted, fontSize: Typography.size.xs },
  langTextActive: { color: '#fff', fontWeight: Typography.weight.semibold },
  audioRow: { flexDirection: 'row', gap: Spacing[2], paddingHorizontal: Spacing[4], paddingBottom: Spacing[2] },
  audioBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: Spacing[3], borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.surface.borderStrong, backgroundColor: Colors.surface.overlay, minHeight: 36 },
  audioBtnText: { color: Colors.text.primary, fontSize: Typography.size.sm },
  articleBody: { padding: Spacing[4], gap: Spacing[3] },
  officialText: { color: Colors.text.primary, fontSize: 18, lineHeight: 32 },
  textUnavailable: { alignItems: 'center', gap: Spacing[3], paddingVertical: Spacing[6] },
  textUnavailableTitle: { fontSize: Typography.size.lg, fontWeight: Typography.weight.semibold, color: Colors.text.primary },
  textUnavailableBody: { fontSize: Typography.size.sm, color: Colors.text.muted, textAlign: 'center', maxWidth: 300, lineHeight: 20 },
  sourceBtn: { paddingVertical: Spacing[2], paddingHorizontal: Spacing[4], borderRadius: Radius.md, backgroundColor: Colors.green[700], minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  sourceBtnText: { color: '#fff', fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold },
  explainCard: { padding: Spacing[3], backgroundColor: Colors.surface.overlay, borderRadius: Radius.md, gap: Spacing[1] },
  clarifyBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], padding: Spacing[3], borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.gold[400], backgroundColor: Colors.gold[50], minHeight: 44 },
  clarifyBtnText: { color: Colors.gold[400], fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold },
  // ─── Social action bar ───
  socialBar: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: Spacing[2], borderTopWidth: 1, borderTopColor: Colors.surface.border, borderBottomWidth: 1, borderBottomColor: Colors.surface.border },
  socialBtn: { alignItems: 'center', gap: 2, paddingVertical: Spacing[1], paddingHorizontal: Spacing[2], minHeight: 44, minWidth: 44, justifyContent: 'center' },
  socialText: { fontSize: Typography.size.xs, color: Colors.text.muted },
  // ─── Quick actions ───
  quickActions: { flexDirection: 'row', justifyContent: 'center', gap: Spacing[4], padding: Spacing[3] },
  quickBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: Spacing[3], borderRadius: Radius.md, backgroundColor: Colors.surface.overlay },
  quickBtnText: { color: Colors.text.muted, fontSize: Typography.size.xs },
  // ─── Pagination ───
  paginationCard: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing[3], backgroundColor: Colors.surface.raised, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.surface.borderStrong, padding: Spacing[3] },
  pageBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing[2], padding: Spacing[2], borderRadius: Radius.md, minHeight: 56 },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnLabel: { fontSize: Typography.size.xs, color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  pageBtnArticle: { fontSize: Typography.size.sm, color: Colors.green[300], fontWeight: Typography.weight.semibold, marginTop: 2 },
  // ─── Misc ───
  messageText: { color: Colors.green[300], fontSize: Typography.size.sm, paddingVertical: Spacing[2] },
  clarification: { width: 340, borderLeftWidth: 1, borderColor: Colors.surface.borderStrong },
  scrim: { flex: 1, backgroundColor: '#00000099' },
  drawer: { flex: 1, backgroundColor: Colors.surface.base, paddingTop: 30 },
});

export default SectionWorkspace;
