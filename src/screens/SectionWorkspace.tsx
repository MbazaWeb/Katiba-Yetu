import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Modal, Platform, Linking, StyleSheet, useWindowDimensions, KeyboardAvoidingView, SafeAreaView } from 'react-native';
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
import { StorageKeys } from '../lib/storage';
import { Colors, Layout } from '../constants/tokens';
import { scaledSize } from '../utils';
import type { ConstitutionArticle, ConstitutionClause, Section } from '../types';

type ReaderTab = 'read' | 'explain' | 'discussions' | 'suggestions' | 'polls' | 'references';
interface Props { section: Section; onBack: () => void; onSectionPress: (section: Section) => void }
export function SectionWorkspace({ section, onBack, onSectionPress }: Props) {
  const article = getArticle(section.id);
  const { language } = useAppContext();
  if (!article) return <View style={s.root}><AppHeader showBack onBack={onBack} title={language === 'sw' ? 'Maandishi hayajapatikana' : 'Text unavailable'} /><View style={s.content}><Notice>{language === 'sw' ? 'Ibara hii bado haijaingizwa katika orodha ya chanzo. Maandishi ya mfano hayaonyeshwi kama maandishi rasmi.' : 'This article has not been imported into the source index. Demo wording is not displayed as official text.'}</Notice><Action label={language === 'sw' ? 'Rudi' : 'Back'} onPress={onBack} /></View></View>;
  return <ArticleReader key={article.id} article={article} onBack={onBack} onSelect={next => onSectionPress(asSection(next))} />;
}
function ArticleReader({ article, onBack, onSelect }: { article: ConstitutionArticle; onBack: () => void; onSelect: (article: ConstitutionArticle) => void }) {
  const { language, setLanguage, fontSize } = useAppContext();
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
  const scroll = useRef<ScrollView>(null);
  const community = useArticleCommunity(article);
  const bundle = getBundle(article.documentId), doc = bundle.document;
  const chapter = bundle.chapters.find(ch => ch.id === article.chapterId)!;
  const text = officialText(article, language);
  const source = text?.source ?? article.source;
  const ordered = bundle.articles.slice().sort((a,b) => a.order-b.order);
  const index = ordered.findIndex(a => a.id === article.id);
  const previous = ordered[index-1], next = ordered[index+1];
  const copy = (sw: string, en: string) => language === 'sw' ? sw : en;
  const parts: string[] = [];
  let part = bundle.parts.find(p => p.id === article.partId);
  while (part) { parts.unshift(`${copy('Sehemu', 'Part')} ${part.number}: ${localized(part.title, language)}`); part = bundle.parts.find(p => p.id === part?.parentPartId); }
  useEffect(() => {
    let live = true;
    AsyncStorage.getItem(StorageKeys.bookmarks).then(raw => {
      const ids: unknown = JSON.parse(raw ?? '[]');
      if (!Array.isArray(ids)) throw new Error('Invalid bookmarks');
      if (live) { setBookmarked(ids.includes(article.id) || !!article.legacySectionId && ids.includes(article.legacySectionId)); setBookmarkReady(true); }
    }).catch(() => { if (live) setMessage('Hifadhi haipatikani / Storage unavailable'); });
    return () => { live = false; };
  }, [article.id, article.legacySectionId]);
  async function bookmark() {
    if (!bookmarkReady || bookmarkBusy) return;
    setBookmarkBusy(true);
    try {
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
  const navTree = <ScrollView contentContainerStyle={{ padding: 14, gap: 14 }}>
    <Text style={s.heading}>{copy('Hati na sura', 'Documents and chapters')}</Text>
    {!desktop && <Action label={copy('Funga menyu', 'Close navigation')} onPress={() => setDrawer(false)} />}
    {documents.map(document => <Action key={document.id} label={`${localized(document.title, language)} (${document.year})`} selected={document.id === navDocument} onPress={() => setNavDocument(document.id)} />)}
    <ChapterTree key={`${navDocument}-${article.id}`} documentId={navDocument} selectedId={article.id} onSelect={selected => { setDrawer(false); onSelect(selected); }} />
  </ScrollView>;
  const tabs: { key: ReaderTab; label: string; count?: number }[] = [
    { key: 'read', label: copy('Soma', 'Read') }, { key: 'explain', label: copy('Ufafanuzi', 'Explanation') },
    { key: 'discussions', label: copy('Majadiliano', 'Discussions'), count: community.ready ? community.data.discussions.length : undefined },
    { key: 'suggestions', label: copy('Mapendekezo', 'Proposals'), count: community.ready ? community.data.suggestions.length : undefined },
    { key: 'polls', label: copy('Kura', 'Polls'), count: community.polls.length }, { key: 'references', label: copy('Marejeo', 'References') },
  ];
  return <View style={s.root}>
    <AppHeader showBack onBack={onBack} title={`${copy('Ibara', 'Article')} ${article.number}`} subtitle={localized(doc.title, language)} />
    <View style={styles.columns}>
      {desktop && <View style={[styles.navigation, { width: width < 1200 ? 210 : 250 }]}>{navTree}</View>}
      <View style={s.root}>
        {!desktop && <View style={{ padding: 10 }}><Action label={copy('☰ Sura na ibara', '☰ Chapters and articles')} onPress={() => setDrawer(true)} /></View>}
        <ScrollView horizontal style={styles.tabScroll} contentContainerStyle={styles.tabs} showsHorizontalScrollIndicator={false}>{tabs.map(item => <Action key={item.key} label={`${item.label}${item.count === undefined ? '' : ` (${item.count})`}`} selected={tab === item.key} onPress={() => { setTab(item.key); scroll.current?.scrollTo({ y: 0, animated: false }); }} />)}</ScrollView>
        <ScrollView ref={scroll} contentContainerStyle={styles.reader} keyboardShouldPersistTaps="handled">
          <Text style={s.small}>{localized(doc.title, language)} › {copy('Sura', 'Chapter')} {chapter.number}: {localized(chapter.title, language)}{parts.length ? ` › ${parts.join(' › ')}` : ''} › {copy('Ibara', 'Article')} {article.number}</Text>
          <Text accessibilityRole="header" style={s.title}>{copy('Ibara', 'Article')} {article.number}</Text>
          <Text style={s.heading}>{text?.title ?? localized(article.title, language)}</Text>
          {!article.title[language] && !text && <Text style={s.small}>{copy('Kichwa kimeonyeshwa katika lugha ya chanzo. Tafsiri rasmi haijaingizwa.', 'Title is shown in the source language. An official translation has not been imported.')}</Text>}
          <View style={s.row}>{(['sw', 'en'] as const).map(lang => <Action key={lang} label={lang === 'sw' ? 'Kiswahili' : 'English'} selected={language === lang} onPress={() => setLanguage(lang)} />)}</View>
          <View style={s.row}>
            <Action label={bookmarked ? copy('★ Ondoa alama', '★ Remove bookmark') : copy('☆ Weka alama', '☆ Bookmark')} selected={bookmarked} disabled={!bookmarkReady || bookmarkBusy} onPress={() => { void bookmark(); }} />
            <Action label={copy('Shiriki', 'Share')} onPress={() => { void perform('share'); }} />
            <Action label={copy('Nakili rejea', 'Copy citation')} onPress={() => { void perform('copy'); }} />
            <Action label={copy('Pakua ibara', 'Download article')} disabled={!text} onPress={() => { void perform('download'); }} />
            <Action primary label={copy('Uliza ufafanuzi', 'Ask for clarification')} onPress={() => setClarify(true)} />
          </View>
          {message ? <Text accessibilityLiveRegion="polite" style={s.body}>{message}</Text> : null}
          <Text style={s.small}>{copy('Toleo', 'Version')}: {source.documentVersion} · {text ? copy('Maandishi yamehakikiwa', 'Text verified') : copy('Maandishi hayajathibitishwa / hayajapatikana', 'Text not verified / unavailable')}</Text>
          {tab === 'read' && <View style={{ gap: 16 }}>
            <Text accessibilityRole="header" style={s.heading}>{copy('Maandishi rasmi ya Katiba', 'Official constitutional text')}</Text>
            {text ? <><Text selectable style={[styles.officialText, { fontSize: scaledSize(18, fontSize), lineHeight: scaledSize(31, fontSize) }]}>{text.preamble}</Text><ClauseList clauses={text.clauses} fontSize={scaledSize(18, fontSize)} /></> : <Notice>{copy('Maandishi kamili rasmi yaliyohakikiwa katika lugha hii hayajapatikana. Hakuna maandishi ya mfano au tafsiri iliyobuniwa inayoonyeshwa hapa. Fungua PDF ya chanzo; upakuaji wa ibara utawezeshwa baada ya uhakiki.', 'Full verified official text in this language is unavailable. No demo wording or invented translation is displayed here. Open the source PDF; article download will be enabled after verification.')}</Notice>}
            <Action label={copy('Fungua / pakua PDF ya chanzo', 'Open / download source PDF')} disabled={!source.sourceUrl} onPress={() => { void perform('source'); }} />
          </View>}
          {tab === 'explain' && <View style={{ gap: 16 }}><Text accessibilityRole="header" style={s.heading}>{copy('Maelezo kwa lugha rahisi', 'Plain-language explanations')}</Text>
            {bundle.explanations.filter(e => e.articleId === article.id && e.language === language && e.documentVersion === source.documentVersion && e.kind === 'reviewed').map(e => <View key={e.id} style={s.card}><Text selectable style={s.body}>{e.text}</Text><Text style={s.small}>{copy('Mkaguzi', 'Reviewer')}: {e.reviewedBy}</Text></View>)}
            {!bundle.explanations.some(e => e.articleId === article.id && e.language === language && e.kind === 'reviewed') && <Notice>{copy('Ufafanuzi uliohakikiwa bado haujapatikana kwa ibara na lugha hii.', 'A reviewed explanation is not yet available for this article and language.')}</Notice>}
            <Action label={copy('Uliza ufafanuzi · mfano wa ndani', 'Ask for clarification · local demo')} onPress={() => setClarify(true)} /><Text style={s.small}>{DISCLAIMER}</Text>
          </View>}
          {(tab === 'discussions' || tab === 'suggestions' || tab === 'polls') && <CommunityPanel key={tab} kind={tab} community={community} />}
          {tab === 'references' && <View style={s.card}>
            <Text accessibilityRole="header" style={s.heading}>{copy('Chanzo na uhakiki', 'Source and verification')}</Text>
            <Text style={s.body}>{copy('Chanzo rasmi', 'Official source')}: {source.officialSource}</Text>
            <Text selectable style={s.body}>{source.sourceUrl ?? copy('Kiungo hakijapatikana', 'Source URL unavailable')}</Text>
            <Text style={s.body}>{copy('Toleo la hati', 'Document version')}: {source.documentVersion}</Text>
            <Text style={s.body}>{copy('Tarehe ya marekebisho ya ibara', 'Article amendment date')}: {source.amendmentDate ?? copy('Haijathibitishwa', 'Not verified')}</Text>
            <Text style={s.body}>{localized(doc.amendmentNote, language)}</Text>
            <Text style={s.body}>{copy('Hali ya uhakiki wa lugha hii', 'Verification for this language')}: {text ? copy('Imehakikiwa', 'Verified') : copy('Haijapatikana / haijahakikiwa', 'Unavailable / unverified')}</Text>
            <Text style={s.small}>{copy('Mkaguzi', 'Reviewer')}: {source.verifiedBy ?? '—'} · {source.verifiedAt ?? '—'}</Text>
            <Text style={s.small}>{source.sourceLocator}</Text>
            <Text selectable style={s.small}>{source.checksum ? `SHA-256: ${source.checksum}` : ''}</Text>
            <Text selectable style={s.body}>{citationFor(article, language).formatted}</Text>
            <Action label={copy('Fungua chanzo rasmi', 'Open official source')} disabled={!source.sourceUrl} onPress={() => { void perform('source'); }} />
          </View>}
          <View style={styles.pagination}>
            <Action label={previous ? `← ${copy('Ibara', 'Article')} ${previous.number}` : copy('← Iliyotangulia', '← Previous')} disabled={!previous} onPress={() => previous && onSelect(previous)} />
            <Action label={next ? `${copy('Ibara', 'Article')} ${next.number} →` : copy('Inayofuata →', 'Next →')} disabled={!next} onPress={() => next && onSelect(next)} />
          </View>
          {!doc.inventoryComplete && <Text style={s.small}>{copy('Vifungo hivi vinapitia ibara zilizoingizwa tu. Ibara zinazokosekana kati yake hazijaingizwa bado.', 'These controls navigate indexed articles only. Intervening missing articles have not yet been imported.')}</Text>}
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
  return <View style={{ gap: 14 }}>{clauses.map(clause => <View key={clause.id} style={{ gap: 12 }}><Text selectable style={[styles.officialText, { fontSize, lineHeight: fontSize * 1.75 }]}><Text style={{ fontWeight: '700' }}>{clause.number} </Text>{clause.text}</Text>{clause.children.length > 0 && <View style={{ paddingLeft: 16 }}><ClauseList clauses={clause.children} fontSize={fontSize} /></View>}</View>)}</View>;
}
const styles = StyleSheet.create({
  columns: { flex: 1, flexDirection: 'row', minHeight: 0 },
  navigation: { borderRightWidth: 1, borderColor: Colors.surface.borderStrong, backgroundColor: Colors.surface.raised },
  tabScroll: { flexGrow: 0, flexShrink: 0, borderBottomWidth: 1, borderColor: Colors.surface.borderStrong },
  tabs: { padding: 12, gap: 8, alignItems: 'center' },
  reader: { width: '100%', maxWidth: 780, alignSelf: 'center', padding: 20, gap: 20, paddingBottom: 44 },
  officialText: { color: Colors.text.primary, fontSize: 18, lineHeight: 32 },
  pagination: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginTop: 12 },
  clarification: { width: 340, borderLeftWidth: 1, borderColor: Colors.surface.borderStrong },
  scrim: { flex: 1, backgroundColor: '#00000099' },
  drawer: { flex: 1, backgroundColor: Colors.surface.base, paddingTop: 30 },
});
export default SectionWorkspace;
