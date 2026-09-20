/**
 * Citizen submission pipeline — thin delegation layer over BackendRepository.
 *
 * All local mock/sample/AsyncStorage fallbacks have been removed. Every
 * function delegates to the active backend (Supabase when configured).
 * If no backend is configured, functions throw immediately.
 */

import { POLL_STAGE_ORDER } from '../types';
import type {
  CitizenSubmission,
  ConstitutionalTopic,
  ModerationEvent,
  SubmissionStatus,
  MultiStagePoll,
  MultiStagePollOption,
  PollStageLike,
  AuditEvent,
  AuditEventKind,
  DraftBuilderRole,
  TanzaniaRegion,
  VerificationTier,
} from '../types';

// ─── Sanitization & validation ────────────────────────────────────────────────

const MAX_TITLE = 200;
const MAX_BODY = 4000;

function sanitizeText(value: string, max = MAX_BODY): string {
  return value.replace(/\u0000/g, '').slice(0, max).trim();
}

export interface SubmissionValidationResult {
  ok: boolean;
  errors: { field: string; message: string }[];
}

export function validateSubmissionInput(input: {
  title: string;
  problem: string;
  rationale: string;
  topic: ConstitutionalTopic;
}): SubmissionValidationResult {
  const errors: { field: string; message: string }[] = [];
  if (!input.title || input.title.trim().length < 8) errors.push({ field: 'title', message: 'Jina linapaswa kuwa na herufi 8 zaidi. / Title must be at least 8 characters.' });
  if (!input.problem || input.problem.trim().length < 20) errors.push({ field: 'problem', message: 'Tatizo linapaswa kuelezwa kwa herufi 20 zaidi. / Problem must be at least 20 characters.' });
  if (!input.rationale || input.rationale.trim().length < 20) errors.push({ field: 'rationale', message: 'Sababu inapaswa kuwa na herufi 20 zaidi. / Rationale must be at least 20 characters.' });
  if (!input.topic) errors.push({ field: 'topic', message: 'Chagua mada. / Select a topic.' });
  return { ok: errors.length === 0, errors };
}

// ─── Backend resolution ───────────────────────────────────────────────────────

async function resolveRepository() {
  const { getBackendRepository } = await import('./backend');
  return getBackendRepository();
}

// ─── Submission pipeline ─────────────────────────────────────────────────────

export interface SubmissionInput {
  title: string;
  topic: ConstitutionalTopic;
  affectedArticleId?: string;
  problem: string;
  proposedWordingSw?: string;
  proposedWordingEn?: string;
  rationale: string;
  supportingEvidence?: string;
  region?: TanzaniaRegion;
  district?: string;
  anonymous: boolean;
  authorId: string;
  authorDisplayName: string;
  authorVerified: boolean;
  authorVerificationTier: VerificationTier;
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function loadSubmissions(): Promise<CitizenSubmission[]> {
  const repo = await resolveRepository();
  return repo.listSubmissions();
}

export async function createSubmission(input: SubmissionInput): Promise<{ submission: CitizenSubmission; events: ModerationEvent[]; duplicate?: { isDuplicate: boolean; similarity: number; similarIds: string[] } }> {
  const validation = validateSubmissionInput(input);
  if (!validation.ok) throw new Error(validation.errors[0].message);
  const repo = await resolveRepository();
  const submission = await repo.createSubmission(input);
  return { submission, events: [], duplicate: undefined };
}

export async function updateSubmission(id: string, patch: Partial<CitizenSubmission>): Promise<CitizenSubmission> {
  const repo = await resolveRepository();
  return repo.updateSubmission(id, patch);
}

export async function moderateSubmission(id: string, moderatorId: string, moderatorName: string, decision: 'approve' | 'reject' | 'merge' | 'flag', reason: string): Promise<CitizenSubmission> {
  const repo = await resolveRepository();
  return repo.moderateSubmission(id, moderatorId, decision, reason);
}

// ─── Multi-stage polling ──────────────────────────────────────────────────────

export function nextPollStage(current: PollStageLike | null): PollStageLike | null {
  if (!current) return POLL_STAGE_ORDER[0];
  const idx = POLL_STAGE_ORDER.indexOf(current);
  if (idx < 0 || idx >= POLL_STAGE_ORDER.length - 1) return null;
  return POLL_STAGE_ORDER[idx + 1];
}

export function createPoll(input: {
  articleId?: string;
  clusterId?: string;
  stage: PollStageLike;
  title: string;
  description: string;
  options: { label: string; description?: string }[];
  opensAt: string;
  closesAt: string;
  minimumParticipation: number;
}): MultiStagePoll {
  const id = makeId('poll');
  const options: MultiStagePollOption[] = input.options.map((opt, i) => ({
    id: `${id}-opt-${i}`, pollId: id, label: opt.label, description: opt.description, orderIndex: i, votes: 0, verifiedVotes: 0, percentage: 0,
  }));
  return {
    id, articleId: input.articleId, clusterId: input.clusterId, stage: input.stage,
    title: sanitizeText(input.title, MAX_TITLE), description: sanitizeText(input.description, MAX_BODY),
    options, opensAt: input.opensAt, closesAt: input.closesAt, status: 'open',
    minimumParticipation: input.minimumParticipation, isRepresentative: false,
    representativenessWarning: 'Matokeo ya kura hayaonyesha uwakilishi wa kitaifa. / Poll results do not represent national opinion.',
    totalVotes: 0, verifiedVotes: 0, abstentions: 0,
    regionDistribution: {}, verificationTierDistribution: {},
    autoApproved: false, humanReviewed: false,
  };
}

export async function loadPolls(): Promise<MultiStagePoll[]> {
  const repo = await resolveRepository();
  return repo.listPolls();
}

export async function castVote(pollId: string, optionId: string, voter: { id: string; verified: boolean; region?: TanzaniaRegion; tier: VerificationTier }): Promise<MultiStagePoll> {
  const repo = await resolveRepository();
  return repo.castVote(pollId, optionId, voter);
}

export async function abstain(pollId: string, voter: { id: string; verified: boolean; region?: TanzaniaRegion; tier: VerificationTier }): Promise<MultiStagePoll> {
  const repo = await resolveRepository();
  return repo.abstain(pollId, voter);
}

export async function closePoll(pollId: string, closer: { id: string; name: string; role: DraftBuilderRole }): Promise<MultiStagePoll> {
  const repo = await resolveRepository();
  return repo.closePoll(pollId, closer);
}

export async function hasVoted(pollId: string, voterId: string): Promise<boolean> {
  const repo = await resolveRepository();
  return repo.hasVoted(pollId, voterId);
}

// ─── Audit log ────────────────────────────────────────────────────────────────

export async function loadAuditEvents(articleId?: string): Promise<AuditEvent[]> {
  const repo = await resolveRepository();
  return repo.listAuditEvents(articleId);
}

// ─── Type re-exports ──────────────────────────────────────────────────────────

export type {
  CitizenSubmission, ModerationEvent, SubmissionStatus, ConstitutionalTopic,
  MultiStagePoll, MultiStagePollOption, PollStageLike, AuditEvent, AuditEventKind, DraftBuilderRole,
};
