export type LibraryLanguage = 'sw' | 'en';
export type LocalizedText = Partial<Record<LibraryLanguage, string>>;
export type VerificationStatus = 'unavailable' | 'pending' | 'verified';

export interface ArticleSource {
  officialSource: string;
  sourceUrl: string | null;
  documentVersion: string;
  amendmentDate: string | null;
  verificationStatus: VerificationStatus;
  verifiedBy: string | null;
  verifiedAt: string | null;
  sourceLocator: string | null;
  checksum: string | null;
}
export interface ConstitutionDocument {
  id: string;
  title: LocalizedText;
  year: number;
  version: string;
  amendmentNote: LocalizedText;
  chapterCount: number | null;
  articleCount: number | null;
  source: ArticleSource;
  downloads: Partial<Record<LibraryLanguage, string>>;
  inventoryComplete: boolean;
}
export interface ConstitutionChapter {
  id: string;
  documentId: string;
  number: string;
  title: LocalizedText;
  order: number;
}
export interface ConstitutionPart {
  id: string;
  documentId: string;
  chapterId: string;
  parentPartId: string | null;
  number: string;
  title: LocalizedText;
  order: number;
}
export interface ConstitutionClause {
  id: string;
  number: string;
  text: string;
  children: ConstitutionClause[];
}
export interface ArticleText {
  title: string;
  preamble: string;
  clauses: ConstitutionClause[];
  source: ArticleSource;
}
export interface ConstitutionArticle {
  id: string;
  documentId: string;
  chapterId: string;
  partId: string | null;
  number: string;
  order: number;
  /** Source-indexed titles, never machine translations of legal headings. */
  title: LocalizedText;
  source: ArticleSource;
  texts: Partial<Record<LibraryLanguage, ArticleText>>;
  topics: string[];
  rights: string[];
  duties: string[];
  unionMatter: boolean;
  fundamentalRights: boolean;
  legacySectionId?: string;
}
export interface ArticleExplanation {
  id: string;
  articleId: string;
  documentVersion: string;
  language: LibraryLanguage;
  text: string;
  kind: 'mock' | 'reviewed';
  reviewedBy: string | null;
}
export interface ArticleCitation {
  articleId: string;
  documentTitle: string;
  documentVersion: string;
  articleNumber: string;
  language: LibraryLanguage;
  sourceUrl: string | null;
  verificationStatus: VerificationStatus;
  formatted: string;
}
export interface ConstitutionBundle {
  schemaVersion: 1;
  document: ConstitutionDocument;
  chapters: ConstitutionChapter[];
  parts: ConstitutionPart[];
  articles: ConstitutionArticle[];
  explanations: ArticleExplanation[];
}
