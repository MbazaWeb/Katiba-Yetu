import { Linking, Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { citationFor, clauseText, officialText } from './constitution';
import type { ConstitutionArticle, LibraryLanguage } from '../types';

export async function copyCitation(article: ConstitutionArticle, language: LibraryLanguage) {
  const copied = await Clipboard.setStringAsync(citationFor(article, language).formatted);
  if (!copied) throw new Error('Clipboard unavailable');
}
export async function shareArticle(article: ConstitutionArticle, language: LibraryLanguage) {
  const citation = citationFor(article, language);
  if (Platform.OS === 'web') {
    if (typeof navigator !== 'undefined' && navigator.share) await navigator.share({ title: citation.documentTitle, text: citation.formatted });
    else { await copyCitation(article, language); return 'copied'; }
  } else await Share.share({ title: citation.documentTitle, message: citation.formatted });
  return 'shared';
}
export async function downloadArticle(article: ConstitutionArticle, language: LibraryLanguage) {
  const text = officialText(article, language);
  if (!text) throw new Error('Verified text unavailable');
  if (Platform.OS !== 'web') {
    if (!text.source.sourceUrl) throw new Error('Source unavailable');
    await Linking.openURL(text.source.sourceUrl); return;
  }
  const content = `${citationFor(article, language).formatted}\n\n${text.title}\n\n${text.preamble}\n${clauseText(text.clauses)}`;
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = `${article.id}-${language}.txt`;
  document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
