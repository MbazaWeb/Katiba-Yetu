import React, { useMemo, useState } from 'react';
import { Text, TextInput, View, Pressable } from 'react-native';
import { useAppContext } from '../../hooks/useAppContext';
import { bundles, documents, emptyFilters, localized, searchLibrary, searchExcerpt, topicLabels } from '../../services/constitution';
import type { LibraryFilters } from '../../services/constitution';
import type { ConstitutionArticle } from '../../types';
import { Action, Highlight, libraryStyles as s } from './LibraryUI';

export function LibrarySearch({ onSelect, initialDocumentId = 'all' }: { onSelect: (article: ConstitutionArticle) => void; initialDocumentId?: string }) {
  const { language } = useAppContext();
  const [filters, setFilters] = useState<LibraryFilters>({ ...emptyFilters, documentId: initialDocumentId });
  const [showFilters, setShowFilters] = useState(false);
  const results = useMemo(() => searchLibrary(filters), [filters]);
  const update = (patch: Partial<LibraryFilters>) => setFilters(current => ({ ...current, ...patch }));
  const copy = (sw: string, en: string) => language === 'sw' ? sw : en;
  return <View style={{ gap: 14 }}>
    <TextInput accessibilityLabel={copy('Tafuta kwenye maktaba', 'Search library')} value={filters.query} onChangeText={query => update({ query })} placeholder={copy('Ibara, kichwa, neno, haki au wajibu…', 'Article, title, words, rights or duties…')} placeholderTextColor="#8fa29b" style={s.input} returnKeyType="search" />
    <View style={s.row}><Action label={copy('Vichujio', 'Filters')} selected={showFilters} onPress={() => setShowFilters(!showFilters)} /><Action label={copy('Futa vichujio', 'Reset filters')} onPress={() => setFilters({ ...emptyFilters, documentId: initialDocumentId })} /></View>
    {showFilters && <View style={s.card}>
      <Text style={s.heading}>{copy('Hati', 'Document')}</Text><View style={s.row}><Action label={copy('Zote', 'All')} selected={filters.documentId === 'all'} onPress={() => update({ documentId: 'all', chapterId: 'all' })} />{documents.map(doc => <Action key={doc.id} label={localized(doc.title, language)} selected={filters.documentId === doc.id} onPress={() => update({ documentId: doc.id, chapterId: 'all' })} />)}</View>
      <Text style={s.heading}>{copy('Sura', 'Chapter')}</Text><View style={s.row}><Action label={copy('Zote', 'All')} selected={filters.chapterId === 'all'} onPress={() => update({ chapterId: 'all' })} />{bundles.filter(b => filters.documentId === 'all' || b.document.id === filters.documentId).flatMap(b => b.chapters.map(ch => <Action key={ch.id} label={`${b.document.year} · ${copy('Sura', 'Chapter')} ${ch.number}`} selected={filters.chapterId === ch.id} onPress={() => update({ chapterId: ch.id })} />))}</View>
      <Text style={s.heading}>{copy('Mada', 'Topic')}</Text><View style={s.row}><Action label={copy('Zote', 'All')} selected={filters.topic === 'all'} onPress={() => update({ topic: 'all' })} />{Array.from(new Set(bundles.flatMap(b => b.articles.flatMap(a => a.topics)))).map(topic => <Action key={topic} label={localized(topicLabels[topic] ?? { en: topic }, language)} selected={filters.topic === topic} onPress={() => update({ topic })} />)}</View>
      <Text style={s.heading}>{copy('Lugha ya maandishi au kichwa kilichoingizwa', 'Language of imported text or title')}</Text><View style={s.row}>{(['all', 'sw', 'en'] as const).map(lang => <Action key={lang} label={lang === 'all' ? copy('Zote', 'All') : lang === 'sw' ? 'Kiswahili' : 'English'} selected={filters.language === lang} onPress={() => update({ language: lang })} />)}</View>
      <View style={s.row}><Action label={copy('Mambo ya Muungano', 'Union matters')} selected={filters.unionOnly} onPress={() => update({ unionOnly: !filters.unionOnly })} /><Action label={copy('Haki za msingi', 'Fundamental rights')} selected={filters.rightsOnly} onPress={() => update({ rightsOnly: !filters.rightsOnly })} /></View>
    </View>}
    <Text style={s.small}>{copy('Matokeo katika orodha iliyoingizwa pekee', 'Results in the imported index only')}: {results.length}. {copy('Utafutaji wa maandishi rasmi unajumuisha maandishi yaliyohakikiwa pekee.', 'Full-text search includes verified official text only.')}</Text>
    {results.length === 0 && <Text style={s.body}>{copy('Hakuna matokeo. Jaribu kufuta vichujio. Kutokuwepo hapa hakumaanishi kuwa ibara haipo katika Katiba.', 'No matches. Try resetting filters. Absence from this index does not mean a provision is absent from the Constitution.')}</Text>}
    {results.map(article => {
      const bundle = bundles.find(b => b.document.id === article.documentId)!;
      const chapter = bundle.chapters.find(ch => ch.id === article.chapterId)!;
      const resultLanguage = filters.language === 'all' ? language : filters.language;
      const excerpt = searchExcerpt(article, filters.query, resultLanguage) || (filters.language === 'all' ? searchExcerpt(article, filters.query, language === 'sw' ? 'en' : 'sw') : '');
      return <Pressable key={article.id} accessibilityRole="button" onPress={() => onSelect(article)} style={({ pressed }) => [s.card, pressed && { opacity: 0.7 }]}>
        <Text style={s.small}><Highlight query={filters.query} text={`${localized(bundle.document.title, language)} · ${copy('Sura', 'Chapter')} ${chapter.number} · ${localized(chapter.title, resultLanguage)}`} /></Text>
        <Text style={s.heading}><Highlight query={filters.query} text={`${copy('Ibara', 'Article')} ${article.number}: ${localized(article.title, resultLanguage)}`} /></Text>
        {filters.language === 'all' && article.title.sw && article.title.en && <Text style={s.body}><Highlight query={filters.query} text={localized(article.title, resultLanguage === 'sw' ? 'en' : 'sw')} /></Text>}
        {excerpt ? <Text style={s.body}><Highlight query={filters.query} text={excerpt} /></Text> : <Text style={s.small}>{copy('Kichwa kutoka kwenye orodha ya chanzo; hakithibitishi upatikanaji wa maandishi kamili.', 'Source-indexed title; full verified text may be unavailable.')}</Text>}
        <Text style={s.small}><Highlight query={filters.query} text={[`Ibara ${article.number} / Article ${article.number}`, ...article.topics.flatMap(topic => [localized(topicLabels[topic] ?? { en: topic }, resultLanguage), topic]), ...(article.rights.length ? ['Haki / Rights', ...article.rights] : []), ...(article.duties.length ? ['Wajibu / Duties', ...article.duties] : [])].join(' · ')} /></Text>
      </Pressable>;
    })}
  </View>;
}
