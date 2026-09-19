/**
 * Phase 3 — Backend integration layer.
 *
 * Provides a typed HTTP client and adapter implementations of the
 * BackendRepository, AIGenerationBackend, IdentityVerificationBackend,
 * ModerationBackend, and PDFExportBackend interfaces defined in
 * `src/types/proposedWorkflow.ts`.
 *
 * Currently, all adapters fall back to the existing mock (AsyncStorage-backed)
 * implementations when no real backend URL is configured. This is the seam
 * where a real server (Node.js/Express, PostgreSQL, MinIO, etc.) will plug in.
 *
 * Governance rule: do NOT pretend that a real backend is connected. Every
 * adapter exposes `isConfigured()` and `kind` so the UI can show the correct
 * status to the user.
 */

import type {
  BackendRepository,
  AIGenerationBackend,
  IdentityVerificationBackend,
  ModerationBackend,
  PDFExportBackend,
  CitizenSubmission,
  MultiStagePoll,
  AuditEvent,
  AIGenerationInput,
  AIGenerationResult,
  ConstitutionalTopic,
  TanzaniaRegion,
  VerificationTier,
  LibraryLanguage,
  DraftBuilderRole,
} from '../types';
import {
  loadSubmissions, createSubmission, updateSubmission,
  loadPolls, castVote, loadAuditEvents,
  screenForHarmfulContent, detectDuplicates, classifyTopic,
  moderateSubmission, abstain, closePoll, hasVoted,
} from './submissionWorkflow';
import { draftGenerationService } from './draftGeneration';
import type { DraftGenerationInput } from './draftGeneration';
import { getProposedChapters, getProposedArticles, getDraftVersion, getProposedConstitution } from './proposedConstitution';
import { PROPOSAL_DISCLAIMER } from '../types';
import { SupabaseBackendRepository } from './supabaseRepository';
import { isSupabaseConfigured } from '../lib/supabase';

// ─── HTTP client (web fetch-based) ────────────────────────────────────────────

export interface HttpClientOptions {
  baseUrl: string;
  /** Optional bearer token getter — for authenticated requests. */
  getToken?: () => Promise<string | null>;
  /** Optional request timeout (ms). Default 30s. */
  timeoutMs?: number;
}

export interface HttpRequest<TBody = unknown> {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: TBody;
  query?: Record<string, string | number | boolean | undefined>;
}

export interface HttpResponse<T> {
  status: number;
  body: T;
}

export class HttpClientError extends Error {
  constructor(public status: number, public body: unknown, message?: string) {
    super(message ?? `HTTP ${status}`);
    this.name = 'HttpClientError';
  }
}

/**
 * Web fetch-based HTTP client. On native, swap for a React Native fetch
 * polyfill or `react-native-fetch-api`. The interface is stable.
 */
export class HttpClient {
  readonly options: HttpClientOptions;

  constructor(options: HttpClientOptions) {
    this.options = options;
  }

  isConfigured(): boolean {
    return Boolean(this.options.baseUrl && /^https?:\/\//.test(this.options.baseUrl));
  }

  async request<TResp, TReq = unknown>(req: HttpRequest<TReq>): Promise<HttpResponse<TResp>> {
    if (!this.isConfigured()) throw new Error('HTTP backend is not configured.');
    const url = new URL(this.options.baseUrl.replace(/\/$/, '') + req.path);
    if (req.query) {
      for (const [k, v] of Object.entries(req.query)) if (v !== undefined) url.searchParams.set(k, String(v));
    }
    const controller = new AbortController();
    const timeoutMs = this.options.timeoutMs ?? 30000;
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
      const token = this.options.getToken ? await this.options.getToken() : null;
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch(url.toString(), {
        method: req.method,
        headers,
        body: req.body !== undefined ? JSON.stringify(req.body) : undefined,
        signal: controller.signal,
      });
      const text = await response.text();
      const body = text ? JSON.parse(text) : null;
      if (!response.ok) throw new HttpClientError(response.status, body, `HTTP ${response.status} ${response.statusText}`);
      return { status: response.status, body: body as TResp };
    } finally {
      clearTimeout(timer);
    }
  }
}

// ─── Configuration singleton ──────────────────────────────────────────────────

export interface BackendConfig {
  /** Base URL of the Katiba Yetu API server. Empty → use mock. */
  apiBaseUrl: string;
  /** Base URL of the AI generation service. Empty → use mock. */
  aiBaseUrl: string;
  /** Base URL of the NIDA verification gateway. Empty → use mock. */
  nidaBaseUrl: string;
  /** Base URL of the moderation service. Empty → use mock. */
  moderationBaseUrl: string;
  /** Base URL of the PDF generation service. Empty → use mock. */
  pdfBaseUrl: string;
  /** Optional bearer token getter — for authenticated requests. */
  getToken?: () => Promise<string | null>;
}

const DEFAULT_CONFIG: BackendConfig = {
  apiBaseUrl: '',
  aiBaseUrl: '',
  nidaBaseUrl: '',
  moderationBaseUrl: '',
  pdfBaseUrl: '',
};

let currentConfig: BackendConfig = DEFAULT_CONFIG;

export function configureBackend(config: BackendConfig): void {
  currentConfig = { ...config };
}

export function getBackendConfig(): BackendConfig {
  return currentConfig;
}

// ─── BackendRepository adapter ────────────────────────────────────────────────

class MockBackendRepository implements BackendRepository {
  readonly kind = 'mock' as const;
  isConfigured() { return true; /* always available as fallback */ }
  async listSubmissions(): Promise<CitizenSubmission[]> { return loadSubmissions(); }
  async createSubmission(input: Omit<CitizenSubmission, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'moderationEvents'>): Promise<CitizenSubmission> {
    const result = await createSubmission(input);
    return result.submission;
  }
  async updateSubmission(id: string, patch: Partial<CitizenSubmission>): Promise<CitizenSubmission> {
    return updateSubmission(id, patch);
  }
  async moderateSubmission(id: string, moderatorId: string, decision: 'approve' | 'reject' | 'merge' | 'flag', reason: string): Promise<CitizenSubmission> {
    return moderateSubmission(id, moderatorId, 'Moderator', decision, reason);
  }
  async listPolls(articleId?: string): Promise<MultiStagePoll[]> { return loadPolls().then(ps => articleId ? ps.filter(p => p.articleId === articleId) : ps); }
  async castVote(pollId: string, optionId: string, voter: { id: string; verified: boolean; region?: TanzaniaRegion; tier: VerificationTier }): Promise<MultiStagePoll> {
    return castVote(pollId, optionId, voter);
  }
  async abstain(pollId: string, voter: { id: string; verified: boolean; region?: TanzaniaRegion; tier: VerificationTier }): Promise<MultiStagePoll> {
    return abstain(pollId, voter);
  }
  async closePoll(pollId: string, closer: { id: string; name: string; role: DraftBuilderRole }): Promise<MultiStagePoll> {
    return closePoll(pollId, closer);
  }
  async hasVoted(pollId: string, voterId: string): Promise<boolean> {
    return hasVoted(pollId, voterId);
  }
  async listAuditEvents(articleId?: string): Promise<AuditEvent[]> { return loadAuditEvents(articleId); }
}

class HttpBackendRepository implements BackendRepository {
  readonly kind = 'http' as const;
  private client: HttpClient;
  constructor(client: HttpClient) { this.client = client; }
  isConfigured() { return this.client.isConfigured(); }
  async listSubmissions(): Promise<CitizenSubmission[]> {
    const resp = await this.client.request<CitizenSubmission[]>({ method: 'GET', path: '/api/submissions' });
    return resp.body;
  }
  async createSubmission(input: Omit<CitizenSubmission, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'moderationEvents'>): Promise<CitizenSubmission> {
    const resp = await this.client.request<CitizenSubmission, typeof input>({ method: 'POST', path: '/api/submissions', body: input });
    return resp.body;
  }
  async updateSubmission(id: string, patch: Partial<CitizenSubmission>): Promise<CitizenSubmission> {
    const resp = await this.client.request<CitizenSubmission, typeof patch>({ method: 'PATCH', path: `/api/submissions/${id}`, body: patch });
    return resp.body;
  }
  async moderateSubmission(id: string, moderatorId: string, decision: 'approve' | 'reject' | 'merge' | 'flag', reason: string): Promise<CitizenSubmission> {
    const resp = await this.client.request<CitizenSubmission, { moderatorId: string; decision: string; reason: string }>({ method: 'POST', path: `/api/submissions/${id}/moderate`, body: { moderatorId, decision, reason } });
    return resp.body;
  }
  async listPolls(articleId?: string): Promise<MultiStagePoll[]> {
    const resp = await this.client.request<MultiStagePoll[]>({ method: 'GET', path: '/api/polls', query: { articleId } });
    return resp.body;
  }
  async castVote(pollId: string, optionId: string, voter: { id: string; verified: boolean; region?: TanzaniaRegion; tier: VerificationTier }): Promise<MultiStagePoll> {
    const resp = await this.client.request<MultiStagePoll, { optionId: string; voter: typeof voter }>({ method: 'POST', path: `/api/polls/${pollId}/vote`, body: { optionId, voter } });
    return resp.body;
  }
  async abstain(pollId: string, voter: { id: string; verified: boolean; region?: TanzaniaRegion; tier: VerificationTier }): Promise<MultiStagePoll> {
    const resp = await this.client.request<MultiStagePoll, { voter: typeof voter }>({ method: 'POST', path: `/api/polls/${pollId}/abstain`, body: { voter } });
    return resp.body;
  }
  async closePoll(pollId: string, closer: { id: string; name: string; role: DraftBuilderRole }): Promise<MultiStagePoll> {
    const resp = await this.client.request<MultiStagePoll, typeof closer>({ method: 'POST', path: `/api/polls/${pollId}/close`, body: closer });
    return resp.body;
  }
  async hasVoted(pollId: string, voterId: string): Promise<boolean> {
    const resp = await this.client.request<{ hasVoted: boolean }>({ method: 'GET', path: `/api/polls/${pollId}/has-voted`, query: { voterId } });
    return resp.body.hasVoted;
  }
  async listAuditEvents(articleId?: string): Promise<AuditEvent[]> {
    const resp = await this.client.request<AuditEvent[]>({ method: 'GET', path: '/api/audit', query: { articleId } });
    return resp.body;
  }
}

let backendRepository: BackendRepository = isSupabaseConfigured
  ? new SupabaseBackendRepository()
  : new MockBackendRepository();

export function getBackendRepository(): BackendRepository {
  const config = getBackendConfig();
  if (config.apiBaseUrl) {
    // Explicit HTTP backend takes highest priority (custom API server)
    const client = new HttpClient({ baseUrl: config.apiBaseUrl, getToken: config.getToken });
    backendRepository = new HttpBackendRepository(client);
  } else if (isSupabaseConfigured && !(backendRepository instanceof SupabaseBackendRepository)) {
    // Auto-use Supabase when configured and no custom API is set
    backendRepository = new SupabaseBackendRepository();
  }
  return backendRepository;
}

// ─── AI generation backend adapter ───────────────────────────────────────────

class MockAIGenerationBackend implements AIGenerationBackend {
  readonly kind = 'mock_deterministic' as const;
  isConfigured() { return true; }
  async generateDraft(input: AIGenerationInput): Promise<AIGenerationResult> {
    // Use the existing mock service behind the interface.
    const draftInput: DraftGenerationInput = {
      draftId: 'mock', chapterId: 'mock', proposedArticleNumber: 'TBD',
      proposedTitle: { sw: 'Pendekezo Lililounganishwa', en: 'Merged Proposal' },
      topic: input.moderatedProposals[0]?.topic ?? 'other',
      problem: input.moderatedProposals.map(p => p.problem).join(' | '),
      proposedWording: {
        sw: input.moderatedProposals[0]?.proposedWordingSw,
        en: input.moderatedProposals[0]?.proposedWordingEn,
      },
      rationale: { sw: input.supportingArguments.join(' | '), en: input.supportingArguments.join(' | ') },
      sourceArticleIds: [], relatedCurrentArticles: [],
      sources: input.moderatedProposals.map(p => ({
        suggestionId: p.id, stance: 'support' as const,
        excerpt: p.problem, contributorRegion: p.region,
        contributorVerified: p.authorVerified,
      })),
      pollResults: { support: 60, oppose: 25, abstain: 15 },
      representation: null,
    };
    const result = await draftGenerationService.generate(draftInput);
    return {
      proposedArticleText: result.article.proposedText,
      proposedClauses: [],
      plainLanguageExplanation: result.article.plainLanguageSummary,
      rationale: result.article.rationale,
      sourceMapping: result.article.sources.map(s => ({ sourceId: s.suggestionId, citedExcerpt: s.excerpt })),
      unresolvedConflicts: result.run.unresolvedConflicts,
      minorityPositionSummary: result.run.minorityPositionSummary,
      legalRisks: result.run.legalRisks,
      generationMethod: 'mock_deterministic',
      modelIdentifier: null,
      promptVersion: result.run.promptVersion,
      runId: result.run.id,
    };
  }
  async regenerate(_articleId: string, _priorVersion?: number): Promise<AIGenerationResult> {
    throw new Error('Regenerate not supported by the mock AI backend.');
  }
}

class HttpAIGenerationBackend implements AIGenerationBackend {
  readonly kind = 'ai_backend' as const;
  private client: HttpClient;
  constructor(client: HttpClient) { this.client = client; }
  isConfigured() { return this.client.isConfigured(); }
  async generateDraft(input: AIGenerationInput): Promise<AIGenerationResult> {
    const resp = await this.client.request<AIGenerationResult, AIGenerationInput>({ method: 'POST', path: '/api/ai/generate-draft', body: input });
    return resp.body;
  }
  async regenerate(articleId: string, priorVersion?: number): Promise<AIGenerationResult> {
    const resp = await this.client.request<AIGenerationResult, { articleId: string; priorVersion?: number }>({ method: 'POST', path: '/api/ai/regenerate', body: { articleId, priorVersion } });
    return resp.body;
  }
}

let aiBackend: AIGenerationBackend = new MockAIGenerationBackend();

export function getAIGenerationBackend(): AIGenerationBackend {
  const config = getBackendConfig();
  if (config.aiBaseUrl) {
    const client = new HttpClient({ baseUrl: config.aiBaseUrl, getToken: config.getToken });
    aiBackend = new HttpAIGenerationBackend(client);
  }
  return aiBackend;
}

// ─── Identity verification backend adapter ───────────────────────────────────

class MockIdentityVerificationBackend implements IdentityVerificationBackend {
  readonly kind = 'mock' as const;
  isConfigured() { return false; /* mock always reports "not configured" */ }
  async initiateNIDAVerification(_nin: string) {
    return { requestId: `mock-req-${Date.now()}`, status: 'rejected' as const };
  }
  async confirmNIDAVerification(_requestId: string, _otp: string) {
    return { verified: false, tier: 'none' as VerificationTier };
  }
  async initiatePhoneOTP(_phone: string) {
    return { requestId: `mock-req-${Date.now()}` };
  }
  async confirmPhoneOTP(_requestId: string, _otp: string) {
    return { verified: false };
  }
}

class HttpIdentityVerificationBackend implements IdentityVerificationBackend {
  readonly kind = 'nida' as const;
  private client: HttpClient;
  constructor(client: HttpClient) { this.client = client; }
  isConfigured() { return this.client.isConfigured(); }
  async initiateNIDAVerification(nin: string) {
    const resp = await this.client.request<{ requestId: string; status: 'initiated' | 'rejected' }, { nin: string }>({ method: 'POST', path: '/api/identity/nida/initiate', body: { nin } });
    return resp.body;
  }
  async confirmNIDAVerification(requestId: string, otp: string) {
    const resp = await this.client.request<{ verified: boolean; tier: VerificationTier }, { requestId: string; otp: string }>({ method: 'POST', path: '/api/identity/nida/confirm', body: { requestId, otp } });
    return resp.body;
  }
  async initiatePhoneOTP(phone: string) {
    const resp = await this.client.request<{ requestId: string }, { phone: string }>({ method: 'POST', path: '/api/identity/phone/initiate', body: { phone } });
    return resp.body;
  }
  async confirmPhoneOTP(requestId: string, otp: string) {
    const resp = await this.client.request<{ verified: boolean }, { requestId: string; otp: string }>({ method: 'POST', path: '/api/identity/phone/confirm', body: { requestId, otp } });
    return resp.body;
  }
}

let identityBackend: IdentityVerificationBackend = new MockIdentityVerificationBackend();

export function getIdentityVerificationBackend(): IdentityVerificationBackend {
  const config = getBackendConfig();
  if (config.nidaBaseUrl) {
    const client = new HttpClient({ baseUrl: config.nidaBaseUrl, getToken: config.getToken });
    identityBackend = new HttpIdentityVerificationBackend(client);
  }
  return identityBackend;
}

// ─── Moderation backend adapter ──────────────────────────────────────────────

// Note: screenForHarmfulContent, detectDuplicates, classifyTopic are imported
// at the top of this file from ./submissionWorkflow.

class MockModerationBackend implements ModerationBackend {
  readonly kind = 'mock' as const;
  isConfigured() { return true; }
  async screenForHarmfulContent(text: string) {
    return screenForHarmfulContent(text);
  }
  async detectDuplicates(submission: { title: string; body: string }, existing: CitizenSubmission[]) {
    // The underlying mock function expects { title, problem }. Map body→problem.
    return detectDuplicates({ title: submission.title, problem: submission.body }, existing);
  }
  async detectBotingSignals(voter: { id: string; createdAt: string }) {
    const reasons: string[] = [];
    const accountAgeMs = Date.now() - new Date(voter.createdAt).getTime();
    if (accountAgeMs < 60_000) reasons.push('Account is younger than 60 seconds.');
    return { isBot: reasons.length > 0, reasons };
  }
  async classifyTopic(submission: { title: string; body: string }) {
    return classifyTopic({ title: submission.title, problem: submission.body });
  }
}

class HttpModerationBackend implements ModerationBackend {
  readonly kind = 'classifier' as const;
  private client: HttpClient;
  constructor(client: HttpClient) { this.client = client; }
  isConfigured() { return this.client.isConfigured(); }
  async screenForHarmfulContent(text: string) {
    const resp = await this.client.request<{ flagged: boolean; reasons: string[]; confidence: number }, { text: string }>({ method: 'POST', path: '/api/moderation/harmful', body: { text } });
    return resp.body;
  }
  async detectDuplicates(submission: { title: string; body: string }, existing: CitizenSubmission[]) {
    const resp = await this.client.request<{ isDuplicate: boolean; similarIds: string[]; similarity: number }, { submission: typeof submission; existing: typeof existing }>({ method: 'POST', path: '/api/moderation/duplicates', body: { submission, existing } });
    return resp.body;
  }
  async detectBotingSignals(voter: { id: string; createdAt: string }) {
    const resp = await this.client.request<{ isBot: boolean; reasons: string[] }, typeof voter>({ method: 'POST', path: '/api/moderation/bot-detection', body: voter });
    return resp.body;
  }
  async classifyTopic(submission: { title: string; body: string }) {
    const resp = await this.client.request<{ label: ConstitutionalTopic; confidence: number; alternatives: { label: ConstitutionalTopic; confidence: number }[] }, typeof submission>({ method: 'POST', path: '/api/moderation/classify-topic', body: submission });
    return resp.body;
  }
}

let moderationBackend: ModerationBackend = new MockModerationBackend();

export function getModerationBackend(): ModerationBackend {
  const config = getBackendConfig();
  if (config.moderationBaseUrl) {
    const client = new HttpClient({ baseUrl: config.moderationBaseUrl, getToken: config.getToken });
    moderationBackend = new HttpModerationBackend(client);
  }
  return moderationBackend;
}

// ─── PDF export backend adapter ───────────────────────────────────────────────

// Note: LibraryLanguage, getProposedChapters/Articles, getDraftVersion,
// getProposedConstitution, PROPOSAL_DISCLAIMER are imported at the top.

/**
 * HTML-escape a string for safe interpolation into an HTML document.
 *
 * Citizen-proposed wording is untrusted user content. Without escaping, a
 * submission containing `<script>…</script>` or `<img src=x onerror=…>`
 * would execute when the PDF export opens the blob URI in a new tab.
 *
 * This is the ONLY way to safely put user content into the printable HTML
 * view — never interpolate raw values.
 */
function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

class MockPDFExportBackend implements PDFExportBackend {
  readonly kind = 'mock' as const;
  isConfigured() { return false; }
  async exportDraft(versionId: string, options: { language: LibraryLanguage; includeMethodology: boolean }) {
    // Build a printable HTML view in-memory. Real backend would render server-side.
    const version = getDraftVersion(versionId);
    if (!version) throw new Error('Draft version not found');
    const constitution = getProposedConstitution();
    const constitutionName = constitution?.name ?? { sw: 'Rasimu ya Katiba', en: 'Draft Constitution' };
    const chapters = getProposedChapters();
    const articles = getProposedArticles().filter(a => a.draftId === versionId);
    const lang: LibraryLanguage = options.language;
    // Every interpolated value is HTML-escaped. Citizen-proposed wording is
    // untrusted user content — never interpolate raw.
    const e = escapeHtml;
    const html = `<!DOCTYPE html>
<html lang="${e(lang)}">
<head>
<meta charset="utf-8">
<title>${e(constitutionName[lang] ?? constitutionName.sw)} — ${e(version.name)}</title>
<style>
  body { font-family: Georgia, serif; max-width: 800px; margin: 2em auto; padding: 1em; color: #0b0f0e; }
  h1 { font-size: 2em; margin-bottom: 0.2em; }
  h2 { font-size: 1.4em; margin-top: 1.5em; border-bottom: 1px solid #ccc; padding-bottom: 0.2em; }
  h3 { font-size: 1.1em; margin-top: 1em; }
  .disclaimer { background: #fff7d6; border-left: 4px solid #d4a80a; padding: 1em; font-size: 0.85em; }
  .meta { color: #555; font-size: 0.9em; margin-bottom: 1em; }
  .article { margin: 1em 0; padding: 0.5em 0; border-bottom: 1px solid #eee; }
  .article-number { font-weight: bold; }
  .plain-language { color: #444; font-style: italic; }
  .source { color: #777; font-size: 0.8em; margin-top: 0.5em; }
</style>
</head>
<body>
<h1>${e(constitutionName[lang] ?? constitutionName.sw)}</h1>
<div class="meta">
  <strong>${e(lang === 'sw' ? 'Toleo' : 'Version')}:</strong> ${e(version.name)} (${e(version.versionNumber)})<br>
  <strong>${e(lang === 'sw' ? 'Tarehe' : 'Date')}:</strong> ${e(version.publishedAt ? new Date(version.publishedAt).toLocaleDateString() : (lang === 'sw' ? 'Haijachapishwa' : 'Unpublished'))}<br>
  <strong>${e(lang === 'sw' ? 'Sura' : 'Chapters')}:</strong> ${e(version.totalChapters)} ·
  <strong>${e(lang === 'sw' ? 'Ibara' : 'Articles')}:</strong> ${e(version.totalArticles)}
</div>
<div class="disclaimer">${e(PROPOSAL_DISCLAIMER)}</div>
${chapters.map(chapter => {
  const chapterArticles = articles.filter(a => a.chapterId === chapter.id);
  return `<h2>${e(lang === 'sw' ? 'Sura' : 'Chapter')} ${e(chapter.number)}: ${e(chapter.title[lang] ?? chapter.title.sw ?? '')}</h2>
${chapterArticles.map(article => `<div class="article">
  <h3><span class="article-number">${e(lang === 'sw' ? 'Ibara' : 'Article')} ${e(article.proposedArticleNumber)}:</span> ${e(article.proposedTitle[lang] ?? article.proposedTitle.sw ?? '')}</h3>
  <p>${e(article.proposedText[lang] ?? article.proposedText.sw ?? '')}</p>
  ${article.plainLanguageSummary[lang] ? `<p class="plain-language">${e(article.plainLanguageSummary[lang])}</p>` : ''}
  <p class="source">${e(lang === 'sw' ? 'Imetengenezwa na' : 'Generated by')}: ${e(article.generatedBy)} · ${e(lang === 'sw' ? 'Washiriki waliouthibitishwa' : 'Verified participants')}: ${e(article.verifiedParticipantCount)}</p>
</div>`).join('')}`;
}).join('')}
${options.includeMethodology ? `<h2>${e(lang === 'sw' ? 'Muhtasari wa Mbinu' : 'Methodology Summary')}</h2>
<p>${e(lang === 'sw' ? 'Rasimu hii imetokana na michango ya wananchi, majadiliano, na kura. Imepitia udhibiti, uainishaji wa mada, na kuunganishwa. Imekaguliwa kisheria na kuidhinishwa na Kamati ya Rasimu.' : 'This draft was generated from citizen submissions, discussions, and polls. It passed moderation, topic classification, and clustering. It was legally reviewed and approved by the Drafting Committee.')}</p>` : ''}
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const uri = URL.createObjectURL(blob);
    return { blobUri: uri, sizeBytes: html.length, generatedAt: new Date().toISOString() };
  }
}

class ServerPDFExportBackend implements PDFExportBackend {
  readonly kind = 'server' as const;
  private client: HttpClient;
  constructor(client: HttpClient) { this.client = client; }
  isConfigured() { return this.client.isConfigured(); }
  async exportDraft(versionId: string, options: { language: LibraryLanguage; includeMethodology: boolean }) {
    const resp = await this.client.request<{ blobUri: string; sizeBytes: number; generatedAt: string }, { versionId: string; language: LibraryLanguage; includeMethodology: boolean }>({
      method: 'POST', path: '/api/pdf/export-draft', body: { versionId, language: options.language, includeMethodology: options.includeMethodology },
    });
    return resp.body;
  }
}

let pdfBackend: PDFExportBackend = new MockPDFExportBackend();

export function getPDFExportBackend(): PDFExportBackend {
  const config = getBackendConfig();
  if (config.pdfBaseUrl) {
    const client = new HttpClient({ baseUrl: config.pdfBaseUrl, getToken: config.getToken });
    pdfBackend = new ServerPDFExportBackend(client);
  }
  return pdfBackend;
}

// ─── Backend status reporting ─────────────────────────────────────────────────

export interface BackendStatus {
  api: { kind: 'mock' | 'http' | 'supabase'; configured: boolean; baseUrl: string };
  ai: { kind: 'mock_deterministic' | 'ai_backend'; configured: boolean; baseUrl: string };
  identity: { kind: 'mock' | 'nida' | 'otp'; configured: boolean; baseUrl: string };
  moderation: { kind: 'mock' | 'classifier'; configured: boolean; baseUrl: string };
  pdf: { kind: 'mock' | 'server'; configured: boolean; baseUrl: string };
}

export function getBackendStatus(): BackendStatus {
  const config = getBackendConfig();
  return {
    api: {
      kind: config.apiBaseUrl ? 'http' : isSupabaseConfigured ? 'supabase' : 'mock',
      configured: Boolean(config.apiBaseUrl) || isSupabaseConfigured,
      baseUrl: config.apiBaseUrl || (isSupabaseConfigured ? process.env.EXPO_PUBLIC_SUPABASE_URL ?? '' : ''),
    },
    ai: { kind: config.aiBaseUrl ? 'ai_backend' : 'mock_deterministic', configured: Boolean(config.aiBaseUrl), baseUrl: config.aiBaseUrl },
    identity: { kind: config.nidaBaseUrl ? 'nida' : 'mock', configured: Boolean(config.nidaBaseUrl), baseUrl: config.nidaBaseUrl },
    moderation: { kind: config.moderationBaseUrl ? 'classifier' : 'mock', configured: Boolean(config.moderationBaseUrl), baseUrl: config.moderationBaseUrl },
    pdf: { kind: config.pdfBaseUrl ? 'server' : 'mock', configured: Boolean(config.pdfBaseUrl), baseUrl: config.pdfBaseUrl },
  };
}

export const BACKEND_DISCLAIMER =
  'Sehemu ya mifumo inatumia mfano wa ndani (mock). Hakuna AI halisi, uthibitisho wa NIDA, au seva ya kisheria imeunganishwa bado. ' +
  'Some subsystems use mock implementations. No real AI, NIDA verification, or legal server is connected yet.';

// Re-export TanzaniaRegion for downstream consumers
export type { TanzaniaRegion };
