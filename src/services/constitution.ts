import union from '../data/constitutions/union.json';
import zanzibar from '../data/constitutions/zanzibar.json';
import { validateBundle } from '../data/validateConstitution';
import type { ArticleCitation, ConstitutionArticle, ConstitutionBundle, ConstitutionClause, LibraryLanguage, LocalizedText, Section } from '../types';

export const DISCLAIMER = 'Maelezo haya yamerahisishwa kwa madhumuni ya elimu na si ushauri wa kisheria. Rejea maandishi rasmi ya Katiba kwa tafsiri ya kisheria.';
export const bundles: ConstitutionBundle[] = [validateBundle(union), validateBundle(zanzibar)];
export const documents = bundles.map(b => b.document);
export const articles = bundles.flatMap(b => b.articles);
export const localized = (text: LocalizedText, language: LibraryLanguage) => text[language] ?? text.sw ?? text.en ?? '—';
export const getBundle = (documentId: string) => bundles.find(b => b.document.id === documentId)!;
export const getArticle = (id: string) => articles.find(a => a.id === id || a.legacySectionId === id);
export const officialText = (article: ConstitutionArticle, language: LibraryLanguage) => {
  // Try the requested language first, fall back to Swahili (source language).
  // Both constitution PDFs are in Kiswahili, so the Swahili text is always
  // available even when the UI language is English.
  const text = article.texts[language] ?? article.texts.sw;
  if (!text) return undefined;
  // Show text if it's verified or pending. Only 'unavailable' hides it.
  return text.source.verificationStatus !== 'unavailable' ? text : undefined;
};
export const clauseText = (clauses: ConstitutionClause[]): string => clauses.map(c => `${c.number} ${c.text}\n${clauseText(c.children)}`).join('\n');
export function citationFor(article: ConstitutionArticle, language: LibraryLanguage): ArticleCitation {
  const doc = getBundle(article.documentId).document;
  const source = officialText(article, language)?.source ?? article.source;
  const title = localized(doc.title, language);
  return { articleId: article.id, documentTitle: title, documentVersion: source.documentVersion, articleNumber: article.number, language, sourceUrl: source.sourceUrl, verificationStatus: officialText(article, language) ? 'verified' : 'unavailable',
    formatted: `${title} (${doc.year}), ${language === 'sw' ? 'Ibara' : 'Article'} ${article.number}; ${source.documentVersion}; ${language.toUpperCase()}. ${source.sourceUrl ?? ''}${officialText(article, language) ? '' : ' [Official article text not verified in this library.]'}` };
}
/** Compatibility boundary for existing homepage/navigation callbacks. Never exports demo wording. */
export function asSection(article: ConstitutionArticle): Section {
  return { id: article.id, document_id: article.documentId, parent_id: article.chapterId, article_number: article.number, title_sw: localized(article.title, 'sw'), title_en: localized(article.title, 'en'), body_sw: '', body_en: '', level: 'article', order_index: article.order, is_muungano: article.unionMatter, version: 1 };
}
export interface LibraryFilters { query: string; documentId: string; chapterId: string; topic: string; language: LibraryLanguage | 'all'; unionOnly: boolean; rightsOnly: boolean }
export const emptyFilters: LibraryFilters = { query: '', documentId: 'all', chapterId: 'all', topic: 'all', language: 'all', unionOnly: false, rightsOnly: false };
export const topicLabels: Record<string, LocalizedText> = {
  state: { sw: 'Dola', en: 'State' }, union: { sw: 'Muungano', en: 'Union' }, equality: { sw: 'Usawa', en: 'Equality' }, expression: { sw: 'Maoni', en: 'Expression' }, religion: { sw: 'Dini', en: 'Religion' }, association: { sw: 'Kujumuika', en: 'Association' }, property: { sw: 'Mali', en: 'Property' }, duties: { sw: 'Wajibu', en: 'Duties' },
};
export function searchLibrary(filters: LibraryFilters, data: ConstitutionBundle[] = bundles) {
  const query = filters.query.trim().toLocaleLowerCase();
  const langs: LibraryLanguage[] = filters.language === 'all' ? ['sw', 'en'] : [filters.language];
  return data.flatMap(bundle => bundle.articles.filter(article => {
    if (filters.documentId !== 'all' && article.documentId !== filters.documentId) return false;
    if (filters.chapterId !== 'all' && article.chapterId !== filters.chapterId) return false;
    if (filters.topic !== 'all' && !article.topics.includes(filters.topic)) return false;
    if (filters.unionOnly && !article.unionMatter || filters.rightsOnly && !article.fundamentalRights) return false;
    if (filters.language !== 'all' && !article.title[filters.language] && !officialText(article, filters.language)) return false;
    const chapter = bundle.chapters.find(c => c.id === article.chapterId);
    const fields = [article.number, `Ibara ${article.number}`, `Article ${article.number}`, ...article.topics, ...article.rights, ...article.duties,
      ...langs.flatMap(lang => { const text = officialText(article, lang); return [article.title[lang] ?? '', chapter?.title[lang] ?? '', ...(article.topics.map(topic => topicLabels[topic]?.[lang] ?? topic)), ...(article.rights.length ? [lang === 'sw' ? 'haki' : 'rights'] : []), ...(article.duties.length ? [lang === 'sw' ? 'wajibu' : 'duties'] : []), text ? `${text.preamble}\n${clauseText(text.clauses)}` : '']; })];
    return !query || fields.some(field => field.toLocaleLowerCase().includes(query));
  }));
}
export function searchExcerpt(article: ConstitutionArticle, query: string, language: LibraryLanguage) {
  const text = officialText(article, language);
  const body = text ? `${text.preamble}\n${clauseText(text.clauses)}` : '';
  const index = body.toLowerCase().indexOf(query.trim().toLowerCase());
  if (body && query.trim() && index >= 0) return `${index > 60 ? '…' : ''}${body.slice(Math.max(0, index - 60), index + query.length + 120)}…`;
  return '';
}
/** Replace this adapter with an HTTP/database implementation without changing records. */
export const constitutionRepository = { listDocuments: () => documents, getBundle, getArticle, search: searchLibrary };
