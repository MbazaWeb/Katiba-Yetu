import type { ConstitutionArticle, LibraryLanguage } from '../types';
import { officialText } from './constitution';

export const suggestedQuestions = [
  { sw: 'Ibara hii ina maana gani kwa lugha rahisi?', en: 'What does this article mean in plain language?' },
  { sw: 'Haki gani inalindwa hapa?', en: 'Which right is protected here?' },
  { sw: 'Ni wajibu gani unaotajwa?', en: 'Which duty is mentioned?' },
  { sw: 'Ibara hii inahusiana vipi na maisha ya kawaida?', en: 'How does this article relate to everyday life?' },
  { sw: 'Nipe mfano wa kuelewa vizuri.', en: 'Give me an example to help me understand.' },
];
export interface ClarificationTurn { question: string; answer: string; language: LibraryLanguage }
export interface ClarificationRequest {
  article: ConstitutionArticle;
  documentVersion: string;
  language: LibraryLanguage;
  question: string;
  history: ClarificationTurn[];
  signal?: AbortSignal;
}
export interface ClarificationResponse { text: string; kind: 'mock'; articleId: string; documentVersion: string }
export interface ClarificationService { ask(request: ClarificationRequest): Promise<ClarificationResponse> }

/** No generated constitutional wording. Replace this adapter when a grounded backend exists. */
export const localClarificationService: ClarificationService = {
  async ask({ article, documentVersion, question, history, language, signal }) {
    if (signal?.aborted) throw new Error('Cancelled');
    if (!question.trim() || question.length > 2000) throw new Error('Question must contain 1–2000 characters.');
    if (documentVersion !== article.source.documentVersion) throw new Error('Article version mismatch.');
    const sw = language === 'sw';
    const context = sw ? `Ibara ${article.number} · ${documentVersion}.` : `Article ${article.number} · ${documentVersion}.`;
    const unavailable = !officialText(article, language);
    const availability = unavailable
      ? (sw ? 'Maandishi rasmi yaliyohakikiwa katika lugha hii hayajapatikana hapa. Siwezi kuthibitisha maana, haki au wajibu wa ibara hii. Fungua chanzo rasmi katika Marejeo.' : 'Verified official text in this language is unavailable here. I cannot confirm this article’s meaning, rights or duties. Open the official source in References.')
      : (sw ? 'Huu ni mfano wa huduma ya ndani, si tafsiri ya kisheria ya ibara. Linganisha swali lako na maandishi rasmi na chanzo chake.' : 'This is a local service demonstration, not a legal interpretation of the article. Compare your question with the official text and its source.');
    const q = question.toLowerCase();
    let method = sw ? 'Njia ya kusoma: tambua anayehusika, jambo linaloelezwa, masharti na vighairi. Uliza kuhusu kipengele kimoja kwa wakati.' : 'Reading method: identify who is addressed, what is stated, the conditions and exceptions. Ask about one clause at a time.';
    if (/haki|right/.test(q)) method = sw ? 'Unaposoma chanzo, angalia ni nani anayenufaika na haki na kama kuna masharti au mipaka. Hapa hatutaji haki bila maandishi yaliyohakikiwa.' : 'In the source, identify who holds a right and any conditions or limits. This mock does not attribute rights without verified wording.';
    else if (/wajibu|duty/.test(q)) method = sw ? 'Unaposoma chanzo, tafuta anayewajibika, tendo linalotakiwa na masharti yake. Usichanganye wajibu na haki.' : 'In the source, look for who is responsible, the required action and its conditions. Distinguish duties from rights.';
    else if (/mfano|example|maisha|everyday/.test(q)) method = sw ? 'Mfano wa njia ya kujifunza tu: soma kipengele, andika hali ya kubuni, kisha linganisha kila sharti na hali hiyo. Huu si mfano wa matokeo ya kisheria ya ibara hii.' : 'Learning exercise only: read a clause, write a hypothetical situation, and compare each condition with that situation. This is not an example of this article’s legal effect.';
    const followup = history.length ? (sw ? ` Swali la kufuatilia ${history.length + 1}; muktadha unabaki ibara na toleo hili.` : ` Follow-up ${history.length + 1}; context remains this article and edition.`) : '';
    return { text: `${context}\n\n${availability}\n\n${method}${followup}`, kind: 'mock', articleId: article.id, documentVersion };
  },
};
