/** Production backend adapters. No demo data or local mock fallback. */
import type {
  BackendRepository, AIGenerationBackend, IdentityVerificationBackend,
  ModerationBackend, PDFExportBackend, CitizenSubmission, MultiStagePoll,
  AuditEvent, AIGenerationInput, AIGenerationResult, ConstitutionalTopic,
  TanzaniaRegion, VerificationTier, LibraryLanguage, DraftBuilderRole,
} from '../types';
import { SupabaseBackendRepository } from './supabaseRepository';
import { isSupabaseConfigured } from '../lib/supabase';

export interface HttpClientOptions {
  baseUrl: string;
  getToken?: () => Promise<string | null>;
  timeoutMs?: number;
}
export interface HttpRequest<TBody = unknown> {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: TBody;
  query?: Record<string, string | number | boolean | undefined>;
}
export interface HttpResponse<T> { status: number; body: T }
export class HttpClientError extends Error {
  constructor(public status: number, public body: unknown, message?: string) {
    super(message ?? `HTTP ${status}`);
    this.name = 'HttpClientError';
  }
}
export class HttpClient {
  constructor(readonly options: HttpClientOptions) {}
  isConfigured() { return Boolean(this.options.baseUrl && /^https?:\/\//.test(this.options.baseUrl)); }
  async request<TResp, TReq = unknown>(req: HttpRequest<TReq>): Promise<HttpResponse<TResp>> {
    if (!this.isConfigured()) throw new Error('Backend service is not configured.');
    const url = new URL(this.options.baseUrl.replace(/\/$/, '') + req.path);
    for (const [key, value] of Object.entries(req.query ?? {})) if (value !== undefined) url.searchParams.set(key, String(value));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 30000);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
      const token = this.options.getToken ? await this.options.getToken() : null;
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await fetch(url.toString(), {
        method: req.method, headers,
        body: req.body === undefined ? undefined : JSON.stringify(req.body),
        signal: controller.signal,
      });
      const text = await response.text();
      const body = text ? JSON.parse(text) : null;
      if (!response.ok) throw new HttpClientError(response.status, body, `HTTP ${response.status} ${response.statusText}`);
      return { status: response.status, body: body as TResp };
    } finally { clearTimeout(timer); }
  }
}

export interface BackendConfig {
  apiBaseUrl: string; aiBaseUrl: string; nidaBaseUrl: string;
  moderationBaseUrl: string; pdfBaseUrl: string;
  getToken?: () => Promise<string | null>;
}
const DEFAULT_CONFIG: BackendConfig = {
  apiBaseUrl: '', aiBaseUrl: '', nidaBaseUrl: '', moderationBaseUrl: '', pdfBaseUrl: '',
};
let currentConfig: BackendConfig = DEFAULT_CONFIG;
export function configureBackend(config: BackendConfig) { currentConfig = { ...config }; }
export function getBackendConfig() { return currentConfig; }

class UnavailableRepository implements BackendRepository {
  readonly kind = 'unavailable' as const;
  isConfigured() { return false; }
  private fail(): never { throw new Error('Supabase backend is not configured.'); }
  async listSubmissions(): Promise<CitizenSubmission[]> { return this.fail(); }
  async createSubmission(): Promise<CitizenSubmission> { return this.fail(); }
  async updateSubmission(): Promise<CitizenSubmission> { return this.fail(); }
  async moderateSubmission(): Promise<CitizenSubmission> { return this.fail(); }
  async listPolls(): Promise<MultiStagePoll[]> { return this.fail(); }
  async castVote(): Promise<MultiStagePoll> { return this.fail(); }
  async abstain(): Promise<MultiStagePoll> { return this.fail(); }
  async closePoll(): Promise<MultiStagePoll> { return this.fail(); }
  async hasVoted(): Promise<boolean> { return this.fail(); }
  async listAuditEvents(): Promise<AuditEvent[]> { return this.fail(); }
}
class HttpRepository implements BackendRepository {
  readonly kind = 'http' as const;
  constructor(private client: HttpClient) {}
  isConfigured() { return this.client.isConfigured(); }
  async listSubmissions() { return (await this.client.request<CitizenSubmission[]>({ method: 'GET', path: '/api/submissions' })).body; }
  async createSubmission(input: Omit<CitizenSubmission, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'moderationEvents'>) { return (await this.client.request<CitizenSubmission, typeof input>({ method: 'POST', path: '/api/submissions', body: input })).body; }
  async updateSubmission(id: string, patch: Partial<CitizenSubmission>) { return (await this.client.request<CitizenSubmission, typeof patch>({ method: 'PATCH', path: `/api/submissions/${id}`, body: patch })).body; }
  async moderateSubmission(id: string, _moderatorId: string, decision: 'approve' | 'reject' | 'merge' | 'flag', reason: string) { return (await this.client.request<CitizenSubmission, { decision: string; reason: string }>({ method: 'POST', path: `/api/submissions/${id}/moderate`, body: { decision, reason } })).body; }
  async listPolls(articleId?: string) { return (await this.client.request<MultiStagePoll[]>({ method: 'GET', path: '/api/polls', query: { articleId } })).body; }
  async castVote(pollId: string, optionId: string, _voter: { id: string; verified: boolean; region?: TanzaniaRegion; tier: VerificationTier }) { return (await this.client.request<MultiStagePoll, { optionId: string }>({ method: 'POST', path: `/api/polls/${pollId}/vote`, body: { optionId } })).body; }
  async abstain(pollId: string, _voter: { id: string; verified: boolean; region?: TanzaniaRegion; tier: VerificationTier }) { return (await this.client.request<MultiStagePoll>({ method: 'POST', path: `/api/polls/${pollId}/abstain` })).body; }
  async closePoll(pollId: string, _closer: { id: string; name: string; role: DraftBuilderRole }) { return (await this.client.request<MultiStagePoll>({ method: 'POST', path: `/api/polls/${pollId}/close` })).body; }
  async hasVoted(pollId: string, _voterId: string) { return (await this.client.request<{ hasVoted: boolean }>({ method: 'GET', path: `/api/polls/${pollId}/has-voted` })).body.hasVoted; }
  async listAuditEvents(articleId?: string) { return (await this.client.request<AuditEvent[]>({ method: 'GET', path: '/api/audit', query: { articleId } })).body; }
}
export function getBackendRepository(): BackendRepository {
  const config = getBackendConfig();
  if (config.apiBaseUrl) return new HttpRepository(new HttpClient({ baseUrl: config.apiBaseUrl, getToken: config.getToken }));
  return isSupabaseConfigured ? new SupabaseBackendRepository() : new UnavailableRepository();
}

class UnavailableAI implements AIGenerationBackend {
  readonly kind = 'unavailable' as const;
  isConfigured() { return false; }
  async generateDraft(_input: AIGenerationInput): Promise<AIGenerationResult> { throw new Error('AI generation service is not configured.'); }
  async regenerate(_articleId: string, _priorVersion?: number): Promise<AIGenerationResult> { throw new Error('AI generation service is not configured.'); }
}
class HttpAI implements AIGenerationBackend {
  readonly kind = 'ai_backend' as const;
  constructor(private client: HttpClient) {}
  isConfigured() { return this.client.isConfigured(); }
  async generateDraft(input: AIGenerationInput) { return (await this.client.request<AIGenerationResult, AIGenerationInput>({ method: 'POST', path: '/api/ai/generate-draft', body: input })).body; }
  async regenerate(articleId: string, priorVersion?: number) { return (await this.client.request<AIGenerationResult, { articleId: string; priorVersion?: number }>({ method: 'POST', path: '/api/ai/regenerate', body: { articleId, priorVersion } })).body; }
}
export function getAIGenerationBackend(): AIGenerationBackend {
  const c = getBackendConfig();
  return c.aiBaseUrl ? new HttpAI(new HttpClient({ baseUrl: c.aiBaseUrl, getToken: c.getToken })) : new UnavailableAI();
}

class UnavailableIdentity implements IdentityVerificationBackend {
  readonly kind = 'unavailable' as const;
  isConfigured() { return false; }
  private fail(): never { throw new Error('Identity verification service is not configured.'); }
  async initiateNIDAVerification(_nin: string): Promise<{ requestId: string; status: 'initiated' | 'rejected' }> { return this.fail(); }
  async confirmNIDAVerification(_requestId: string, _otp: string): Promise<{ verified: boolean; tier: VerificationTier }> { return this.fail(); }
  async initiatePhoneOTP(_phone: string): Promise<{ requestId: string }> { return this.fail(); }
  async confirmPhoneOTP(_requestId: string, _otp: string): Promise<{ verified: boolean }> { return this.fail(); }
}
class HttpIdentity implements IdentityVerificationBackend {
  readonly kind = 'nida' as const;
  constructor(private client: HttpClient) {}
  isConfigured() { return this.client.isConfigured(); }
  async initiateNIDAVerification(nin: string) { return (await this.client.request<{ requestId: string; status: 'initiated' | 'rejected' }, { nin: string }>({ method: 'POST', path: '/api/identity/nida/initiate', body: { nin } })).body; }
  async confirmNIDAVerification(requestId: string, otp: string) { return (await this.client.request<{ verified: boolean; tier: VerificationTier }, { requestId: string; otp: string }>({ method: 'POST', path: '/api/identity/nida/confirm', body: { requestId, otp } })).body; }
  async initiatePhoneOTP(phone: string) { return (await this.client.request<{ requestId: string }, { phone: string }>({ method: 'POST', path: '/api/identity/phone/initiate', body: { phone } })).body; }
  async confirmPhoneOTP(requestId: string, otp: string) { return (await this.client.request<{ verified: boolean }, { requestId: string; otp: string }>({ method: 'POST', path: '/api/identity/phone/confirm', body: { requestId, otp } })).body; }
}
export function getIdentityVerificationBackend(): IdentityVerificationBackend {
  const c = getBackendConfig();
  return c.nidaBaseUrl ? new HttpIdentity(new HttpClient({ baseUrl: c.nidaBaseUrl, getToken: c.getToken })) : new UnavailableIdentity();
}

class UnavailableModeration implements ModerationBackend {
  readonly kind = 'unavailable' as const;
  isConfigured() { return false; }
  private fail(): never { throw new Error('Moderation service is not configured.'); }
  async screenForHarmfulContent(_text: string): Promise<{ flagged: boolean; reasons: string[]; confidence: number }> { return this.fail(); }
  async detectDuplicates(_submission: { title: string; body: string }, _existing: CitizenSubmission[]): Promise<{ isDuplicate: boolean; similarIds: string[]; similarity: number }> { return this.fail(); }
  async detectBotingSignals(_voter: { id: string; createdAt: string }): Promise<{ isBot: boolean; reasons: string[] }> { return this.fail(); }
  async classifyTopic(_submission: { title: string; body: string }): Promise<{ label: ConstitutionalTopic; confidence: number; alternatives: { label: ConstitutionalTopic; confidence: number }[] }> { return this.fail(); }
}
class HttpModeration implements ModerationBackend {
  readonly kind = 'classifier' as const;
  constructor(private client: HttpClient) {}
  isConfigured() { return this.client.isConfigured(); }
  async screenForHarmfulContent(text: string) { return (await this.client.request<{ flagged: boolean; reasons: string[]; confidence: number }, { text: string }>({ method: 'POST', path: '/api/moderation/harmful', body: { text } })).body; }
  async detectDuplicates(submission: { title: string; body: string }, existing: CitizenSubmission[]) { return (await this.client.request<{ isDuplicate: boolean; similarIds: string[]; similarity: number }, { submission: typeof submission; existing: CitizenSubmission[] }>({ method: 'POST', path: '/api/moderation/duplicates', body: { submission, existing } })).body; }
  async detectBotingSignals(voter: { id: string; createdAt: string }) { return (await this.client.request<{ isBot: boolean; reasons: string[] }, typeof voter>({ method: 'POST', path: '/api/moderation/bot-detection', body: voter })).body; }
  async classifyTopic(submission: { title: string; body: string }) { return (await this.client.request<{ label: ConstitutionalTopic; confidence: number; alternatives: { label: ConstitutionalTopic; confidence: number }[] }, typeof submission>({ method: 'POST', path: '/api/moderation/classify-topic', body: submission })).body; }
}
export function getModerationBackend(): ModerationBackend {
  const c = getBackendConfig();
  return c.moderationBaseUrl ? new HttpModeration(new HttpClient({ baseUrl: c.moderationBaseUrl, getToken: c.getToken })) : new UnavailableModeration();
}

class UnavailablePDF implements PDFExportBackend {
  readonly kind = 'unavailable' as const;
  isConfigured() { return false; }
  async exportDraft(_versionId: string, _options: { language: LibraryLanguage; includeMethodology: boolean }): Promise<{ blobUri: string; sizeBytes: number; generatedAt: string }> { throw new Error('PDF export service is not configured.'); }
}
class ServerPDF implements PDFExportBackend {
  readonly kind = 'server' as const;
  constructor(private client: HttpClient) {}
  isConfigured() { return this.client.isConfigured(); }
  async exportDraft(versionId: string, options: { language: LibraryLanguage; includeMethodology: boolean }) { return (await this.client.request<{ blobUri: string; sizeBytes: number; generatedAt: string }, { versionId: string; language: LibraryLanguage; includeMethodology: boolean }>({ method: 'POST', path: '/api/pdf/export-draft', body: { versionId, ...options } })).body; }
}
export function getPDFExportBackend(): PDFExportBackend {
  const c = getBackendConfig();
  return c.pdfBaseUrl ? new ServerPDF(new HttpClient({ baseUrl: c.pdfBaseUrl, getToken: c.getToken })) : new UnavailablePDF();
}

export interface BackendStatus {
  api: { kind: 'unavailable' | 'http' | 'supabase'; configured: boolean; baseUrl: string };
  ai: { kind: 'unavailable' | 'ai_backend'; configured: boolean; baseUrl: string };
  identity: { kind: 'unavailable' | 'nida' | 'otp'; configured: boolean; baseUrl: string };
  moderation: { kind: 'unavailable' | 'classifier'; configured: boolean; baseUrl: string };
  pdf: { kind: 'unavailable' | 'server'; configured: boolean; baseUrl: string };
}
export function getBackendStatus(): BackendStatus {
  const c = getBackendConfig();
  return {
    api: { kind: c.apiBaseUrl ? 'http' : isSupabaseConfigured ? 'supabase' : 'unavailable', configured: Boolean(c.apiBaseUrl) || isSupabaseConfigured, baseUrl: c.apiBaseUrl || (isSupabaseConfigured ? process.env.EXPO_PUBLIC_SUPABASE_URL ?? '' : '') },
    ai: { kind: c.aiBaseUrl ? 'ai_backend' : 'unavailable', configured: Boolean(c.aiBaseUrl), baseUrl: c.aiBaseUrl },
    identity: { kind: c.nidaBaseUrl ? 'nida' : 'unavailable', configured: Boolean(c.nidaBaseUrl), baseUrl: c.nidaBaseUrl },
    moderation: { kind: c.moderationBaseUrl ? 'classifier' : 'unavailable', configured: Boolean(c.moderationBaseUrl), baseUrl: c.moderationBaseUrl },
    pdf: { kind: c.pdfBaseUrl ? 'server' : 'unavailable', configured: Boolean(c.pdfBaseUrl), baseUrl: c.pdfBaseUrl },
  };
}
export const BACKEND_DISCLAIMER = 'Huduma ambazo hazijaunganishwa zimezimwa; hakuna data ya mfano inayotumika. / Unconfigured services are disabled; no mock data is used.';
export type { TanzaniaRegion };
