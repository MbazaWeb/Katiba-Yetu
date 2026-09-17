import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { getBundle, localized } from '../../services/constitution';
import { useAppContext } from '../../hooks/useAppContext';
import { Action, libraryStyles as s } from './LibraryUI';
import type { ConstitutionArticle, ConstitutionPart } from '../../types';

export function ChapterTree({ documentId, selectedId, onSelect }: { documentId: string; selectedId?: string; onSelect: (article: ConstitutionArticle) => void }) {
  const { language } = useAppContext();
  const bundle = getBundle(documentId);
  const selectedChapter = bundle.articles.find(a => a.id === selectedId)?.chapterId;
  const [expanded, setExpanded] = useState<string[]>(selectedChapter ? [selectedChapter] : []);
  const articleRow = (article: ConstitutionArticle) => <Pressable key={article.id} accessibilityRole="button" accessibilityState={{ selected: article.id === selectedId }} onPress={() => onSelect(article)} style={[s.action, article.id === selectedId && s.selected]}>
    <Text style={s.actionText}>{language === 'sw' ? 'Ibara' : 'Article'} {article.number} · {localized(article.title, language)}</Text>
    <Text style={s.small}>{article.title[language] ? '' : `${language === 'sw' ? 'Kichwa cha chanzo' : 'Source title'} · `}{Object.values(article.texts).some(text => text.source.verificationStatus === 'verified') ? (language === 'sw' ? 'Maandishi yamehakikiwa' : 'Verified text available') : (language === 'sw' ? 'Maandishi hayajapatikana' : 'Official text unavailable')}</Text>
  </Pressable>;
  const partBranch = (part: ConstitutionPart): React.ReactNode => <View key={part.id} style={{ gap: 8, paddingLeft: 10, borderLeftWidth: 1, borderColor: '#2a3a36' }}>
    <Text style={s.heading}>{language === 'sw' ? 'Sehemu' : 'Part'} {part.number}</Text><Text style={s.small}>{localized(part.title, language)}</Text>
    {bundle.articles.filter(a => a.partId === part.id).sort((a,b) => a.order-b.order).map(articleRow)}
    {bundle.parts.filter(p => p.parentPartId === part.id).sort((a,b) => a.order-b.order).map(partBranch)}
  </View>;
  return <View style={{ gap: 12 }}>
    {bundle.chapters.slice().sort((a,b) => a.order-b.order).map(chapter => {
      const open = expanded.includes(chapter.id);
      return <View key={chapter.id} style={{ gap: 10 }}>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setExpanded(ids => open ? ids.filter(id => id !== chapter.id) : [...ids, chapter.id])} style={s.action}>
          <Text style={s.heading}>{open ? '−' : '+'} {language === 'sw' ? 'Sura' : 'Chapter'} {chapter.number}</Text><Text style={s.small}>{localized(chapter.title, language)}</Text>
        </Pressable>
        {open && <View style={{ gap: 10, paddingLeft: 8 }}>{bundle.articles.filter(a => a.chapterId === chapter.id && !a.partId).sort((a,b) => a.order-b.order).map(articleRow)}{bundle.parts.filter(p => p.chapterId === chapter.id && !p.parentPartId).sort((a,b) => a.order-b.order).map(partBranch)}</View>}
      </View>;
    })}
    {!bundle.document.inventoryComplete && <Text style={s.small}>{language === 'sw' ? 'Orodha ni sehemu tu ya hati. Sura na ibara nyingine bado hazijaingizwa; hazijabuniwa.' : 'Partial source index. Other chapters and articles have not been imported; no missing provisions are invented.'}</Text>}
    <Action label={language === 'sw' ? 'Panua sura zote' : 'Expand all chapters'} onPress={() => setExpanded(bundle.chapters.map(c => c.id))} />
  </View>;
}
