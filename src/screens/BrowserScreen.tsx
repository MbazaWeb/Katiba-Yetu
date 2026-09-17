import React, { useState } from 'react';
import { View, Text, ScrollView, Linking } from 'react-native';
import { AppHeader } from '../components/sections/AppHeader';
import { Action, Notice, libraryStyles as s } from '../components/library/LibraryUI';
import { ChapterTree } from '../components/library/ChapterTree';
import { LibrarySearch } from '../components/library/LibrarySearch';
import { documents, getBundle, localized, asSection } from '../services/constitution';
import { useAppContext } from '../hooks/useAppContext';
import type { Section } from '../types';

export function BrowserScreen({ onSectionPress, onBack, initialDocumentId = documents[0].id, onDocumentChange }: { onSectionPress: (section: Section) => void; onBack: () => void; initialDocumentId?: string; onDocumentChange?: (id: string) => void }) {
  const { language } = useAppContext();
  const [documentId, setDocumentId] = useState(initialDocumentId);
  const [search, setSearch] = useState(false);
  const [error, setError] = useState('');
  const bundle = getBundle(documentId), doc = bundle.document;
  const copy = (sw: string, en: string) => language === 'sw' ? sw : en;
  const verified = bundle.articles.filter(a => Object.values(a.texts).some(text => text.source.verificationStatus === 'verified')).length;
  return <View style={s.root}>
    <AppHeader showBack onBack={onBack} title={copy('Maktaba ya Katiba', 'Constitution library')} />
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Text accessibilityRole="header" style={s.title}>{copy('Katiba zetu', 'Our constitutions')}</Text>
      <View style={s.row}>{documents.map(document => <Action key={document.id} label={`${localized(document.title, language)} · ${document.year}`} selected={document.id === documentId} onPress={() => { setDocumentId(document.id); onDocumentChange?.(document.id); setError(''); }} />)}</View>
      <View style={s.card}>
        <Text accessibilityRole="header" style={s.heading}>{localized(doc.title, language)}, {doc.year}</Text>
        <Text style={s.body}>{copy('Toleo', 'Version')}: {doc.version}</Text>
        <Text style={s.body}>{copy('Marekebisho ya mwisho katika toleo', 'Last amendments in this edition')}: {localized(doc.amendmentNote, language)}</Text>
        <Text style={s.body}>{copy('Sura', 'Chapters')}: {doc.chapterCount ?? copy('Haijathibitishwa', 'Not verified')} · {copy('Ibara', 'Articles')}: {doc.articleCount ?? copy('Jumla haijathibitishwa', 'Total not verified')}</Text>
        <Text style={s.small}>{copy('Zilizoingizwa', 'Imported')}: {bundle.chapters.length} {copy('sura', 'chapters')}, {bundle.articles.length} {copy('vichwa vya ibara', 'article headings')}, {verified} {copy('ibara zenye maandishi yaliyohakikiwa', 'articles with verified text')}.</Text>
        <Text style={s.body}>{copy('Lugha za PDF ya chanzo', 'Source PDF languages')}: {Object.keys(doc.downloads).map(lang => lang === 'sw' ? 'Kiswahili' : 'English').join(', ') || copy('Hazijapatikana', 'Unavailable')}</Text>
        <Text style={s.small}>{copy('Lugha nyingine na maandishi kamili ya ndani ya programu yanaweza kutopatikana.', 'Other languages and full in-app text may be unavailable.')}</Text>
        <View style={s.row}>{Object.entries(doc.downloads).map(([lang, url]) => <Action key={lang} label={`${copy('Pakua PDF rasmi', 'Download official PDF')} · ${lang.toUpperCase()}`} onPress={() => { Linking.openURL(url!).catch(() => setError(copy('PDF haikufunguka. Jaribu tena.', 'Could not open PDF. Please retry.'))); }} />)}</View>
        {error ? <Text accessibilityRole="alert" style={s.body}>{error}</Text> : null}
      </View>
      {!doc.inventoryComplete && <Notice>{copy('Maktaba hii bado haina maandishi kamili yaliyohakikiwa. Orodha hii ni sehemu tu ya hati. Rejea PDF rasmi kwa hati kamili.', 'This library does not yet contain the complete verified text. This is a partial index. Consult the official PDF for the full document.')}</Notice>}
      <View style={s.row}><Action label={copy('Vinjari sura', 'Browse chapters')} selected={!search} onPress={() => setSearch(false)} /><Action label={copy('Tafuta na chuja', 'Search and filter')} selected={search} onPress={() => setSearch(true)} /></View>
      {search ? <LibrarySearch key={documentId} initialDocumentId={documentId} onSelect={article => onSectionPress(asSection(article))} /> : <ChapterTree key={documentId} documentId={documentId} onSelect={article => onSectionPress(asSection(article))} />}
    </ScrollView>
  </View>;
}
export default BrowserScreen;
