/**
 * Citizen submission pipeline service — Phase 2.
 *
 * Pipeline:
 *   Citizen suggestions
 *   → moderation
 *   → topic classification
 *   → duplicate detection
 *   → clustering of similar proposals
 *   → evidence summary
 *   → competing viewpoints
 *   → draft article options
 *   → legal review
 *   → citizen poll
 *   → approval decision
 *   → inclusion in a draft version
 *
 * Governance rules:
 *  - Do not silently discard minority viewpoints.
 *  - For every cluster, preserve supporting/opposing/neutral submissions,
 *    participant counts, region distribution, duplicate count, moderation
 *    exclusions, poll results, confidence and data limitations.
 *  - Duplicated proposals may be merged into one cluster without deleting
 *    the original submission. The original is preserved for audit.
 *  - A poll never auto-approves an article. Approval rules are configurable.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupabaseConfigured } from '../lib/supabase';
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
import { CONSTITUTIONAL_TOPIC_LABELS, POLL_STAGE_ORDER } from '../types';

const SUBMISSIONS_KEY = '@katibayetu/submissions';
const POLLS_KEY = '@katibayetu/multi_stage_polls';
const AUDIT_KEY = '@katibayetu/audit_events';
const VOTES_KEY = '@katibayetu/multi_stage_votes';

// ─── Mutex for atomic vote-casting ───────────────────────────────────────────
//
// AsyncStorage has no transaction support. Without a mutex, a double-tap on
// the "Vote" button could pass the `hasVoted` check twice before either
// write landed, allowing a single user to cast two votes.
//
// This mutex serialises the read-check-write sequence in castVote() and
// abstain() so the check + writes are atomic from the application's
// perspective. (AsyncStorage itself is still eventually-consistent across
// separate keys, but since both writes happen while the mutex is held, no
// other voter can interleave.)
class Mutex {
  private chain: Promise<unknown> = Promise.resolve();
  run<T>(task: () => Promise<T>): Promise<T> {
    const run = this.chain.then(task, task);
    // Swallow rejections on the chain so a failed task doesn't poison
    // subsequent voters. The caller still sees the rejection.
    this.chain = run.then(() => undefined, () => undefined);
    return run;
  }
}
const voteMutex = new Mutex();

// ─── Backend delegation (lazy to avoid circular import with backend.ts) ──────
//
// submissionWorkflow.ts is the public API the screens call. When Supabase is
// configured, it delegates the CRUD operations (loadSubmissions,
// createSubmission, updateSubmission, loadPolls, castVote, loadAuditEvents)
// and the moderation helpers (screenForHarmfulContent, detectDuplicates,
// classifyTopic) to the active backend adapters. Otherwise it uses the
// AsyncStorage-backed mock implementation below.
//
// The import is lazy (inside a function body) to avoid a circular-import
// problem: backend.ts imports mock helpers from this module, so importing
// backend.ts at module-init time here would create a cycle.
async function resolveRepository() {
  if (!isSupabaseConfigured) return null;
  const { getBackendRepository } = await import('./backend');
  return getBackendRepository();
}

// Note: moderation helpers (screenForHarmfulContent, detectDuplicates,
// classifyTopic) stay local to this module. They are only called in the
// AsyncStorage mock path of createSubmission(). When Supabase is configured,
// createSubmission() delegates to the server-side submit_citizen_proposal()
// RPC which performs moderation server-side — so these helpers are not
// invoked in the Supabase path.

// ─── Sanitization & validation ────────────────────────────────────────────────

const MAX_TITLE = 200;
const MAX_BODY = 4000;

function sanitizeText(value: string, max = MAX_BODY): string {
  // Strip null bytes; clamp length; never render untrusted HTML.
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
  proposedWordingSw?: string;
  proposedWordingEn?: string;
}): SubmissionValidationResult {
  const errors: { field: string; message: string }[] = [];
  if (!input.title || input.title.trim().length < 8) errors.push({ field: 'title', message: 'Jina linapaswa kuwa na herufi 8 zaidi. / Title must be at least 8 characters.' });
  if (!input.problem || input.problem.trim().length < 20) errors.push({ field: 'problem', message: 'Tatizo linapaswa kuelezwa kwa herufi 20 zaidi. / Problem must be at least 20 characters.' });
  if (!input.rationale || input.rationale.trim().length < 20) errors.push({ field: 'rationale', message: 'Sababu inapaswa kuwa na herufi 20 zaidi. / Rationale must be at least 20 characters.' });
  if (!input.topic) errors.push({ field: 'topic', message: 'Chagua mada. / Select a topic.' });
  if (input.proposedWordingSw && input.proposedWordingSw.length > MAX_BODY) errors.push({ field: 'proposedWordingSw', message: `Lugha haizidi herufi ${MAX_BODY}. / Proposed wording exceeds ${MAX_BODY} characters.` });
  if (input.proposedWordingEn && input.proposedWordingEn.length > MAX_BODY) errors.push({ field: 'proposedWordingEn', message: `Lugha haizidi herufi ${MAX_BODY}. / Proposed wording exceeds ${MAX_BODY} characters.` });
  return { ok: errors.length === 0, errors };
}

// ─── Mock moderation & classification ────────────────────────────────────────

const HARMFUL_KEYWORDS = ['trollable', 'hate', 'slur']; // demonstration only

export function screenForHarmfulContent(text: string): { flagged: boolean; reasons: string[]; confidence: number } {
  const lower = text.toLowerCase();
  const reasons: string[] = [];
  for (const kw of HARMFUL_KEYWORDS) if (lower.includes(kw)) reasons.push(`Harmful keyword detected: ${kw}`);
  // Mock heuristic: detect ALL CAPS shouting over 60 chars
  if (text.length > 60 && text === text.toUpperCase() && /[A-Z]/.test(text)) reasons.push('Excessive capitalisation detected');
  return { flagged: reasons.length > 0, reasons, confidence: reasons.length ? 0.7 : 0.2 };
}

export function detectDuplicates(submission: { title: string; problem: string }, existing: CitizenSubmission[]): { isDuplicate: boolean; similarIds: string[]; similarity: number } {
  const lower = `${submission.title} ${submission.problem}`.toLowerCase();
  const words = new Set(lower.split(/\s+/).filter(w => w.length > 4));
  let best: { id: string; similarity: number } | null = null;
  const similarIds: string[] = [];
  for (const sub of existing) {
    const other = `${sub.title} ${sub.problem}`.toLowerCase();
    const otherWords = new Set(other.split(/\s+/).filter(w => w.length > 4));
    let common = 0;
    for (const w of words) if (otherWords.has(w)) common++;
    const similarity = words.size > 0 ? common / words.size : 0;
    if (similarity >= 0.6) {
      similarIds.push(sub.id);
      if (!best || similarity > best.similarity) best = { id: sub.id, similarity };
    }
  }
  return { isDuplicate: best !== null && best.similarity >= 0.7, similarIds, similarity: best?.similarity ?? 0 };
}

export function classifyTopic(submission: { title: string; problem: string }): { label: ConstitutionalTopic; confidence: number; alternatives: { label: ConstitutionalTopic; confidence: number }[] } {
  const text = `${submission.title} ${submission.problem}`.toLowerCase();
  const scores: { label: ConstitutionalTopic; score: number }[] = [];
  const keywords: Record<ConstitutionalTopic, string[]> = {
    state: ['jamhuri', 'dola', 'republic', 'state'],
    union: ['muungano', 'union', 'zanzibar', 'tanganyika'],
    equality: ['usawa', 'equality', 'jinsia', 'gender', 'wanaume', 'wanawake'],
    expression: ['maoni', 'expression', 'uhuru wa kutoa', 'free speech'],
    religion: ['dini', 'religion', 'imani', 'belief'],
    association: ['kujumuika', 'association', 'chama', 'party'],
    property: ['mali', 'property', 'ardhi', 'land'],
    duties: ['wajibu', 'duty', 'duties', 'mchango'],
    governance: ['utawala', 'governance', 'serikali'],
    judiciary: ['mahakama', 'court', 'judiciary', 'haki'],
    legislature: ['bunge', 'parliament', 'legislature', 'wabunge'],
    executive: ['rais', 'president', 'mamlaka ya utendaji', 'executive', 'waziri'],
    citizenship: ['uraia', 'citizenship', 'raia'],
    rights_arrest: ['kushikwa', 'arrest', 'kufungwa', 'polisi'],
    labor: ['kazi', 'labor', 'ajira', 'employment'],
    education: ['elimu', 'education', 'shule', 'chuo'],
    health: ['afya', 'health', 'hospitali'],
    environment: ['mazingira', 'environment', 'asili'],
    other: [],
  };
  for (const label of Object.keys(keywords) as ConstitutionalTopic[]) {
    let score = 0;
    for (const kw of keywords[label]) if (text.includes(kw)) score += 1;
    scores.push({ label, score });
  }
  scores.sort((a, b) => b.score - a.score);
  const total = scores.reduce((sum, s) => sum + s.score, 0) || 1;
  const top = scores[0];
  const confidence = top.score > 0 ? top.score / total : 0.1;
  const alternatives = scores.slice(1, 4).filter(s => s.score > 0).map(s => ({ label: s.label, confidence: s.score / total }));
  return { label: top.label, confidence, alternatives };
}

// ─── Submission repository (AsyncStorage-backed mock) ─────────────────────────

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
  // Delegate to the active backend when configured (Supabase); otherwise use
  // the AsyncStorage-backed mock. This is the swappability seam.
  const repo = await resolveRepository();
  if (repo) return repo.listSubmissions();
  try {
    const raw = await AsyncStorage.getItem(SUBMISSIONS_KEY);
    if (!raw) return seedSubmissions();
    return JSON.parse(raw) as CitizenSubmission[];
  } catch { return seedSubmissions(); }
}

export async function saveSubmissions(list: CitizenSubmission[]): Promise<void> {
  // Surface failures to the caller. A silent console.warn here would let the
  // UI show "submission created" while the data was never persisted.
  await AsyncStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(list));
}

export async function createSubmission(input: SubmissionInput): Promise<{ submission: CitizenSubmission; events: ModerationEvent[]; duplicate?: { isDuplicate: boolean; similarity: number; similarIds: string[] } }> {
  const validation = validateSubmissionInput(input);
  if (!validation.ok) throw new Error(validation.errors[0].message);

  // Delegate to the active backend when configured. The server-side
  // submit_citizen_proposal() RPC handles validation, harmful-content
  // screening, duplicate detection, topic classification, clustering,
  // and audit logging — so we return early with the server-created row.
  const repo = await resolveRepository();
  if (repo) {
    const submission = await repo.createSubmission(input);
    return { submission, events: [], duplicate: undefined };
  }

  // ─── Local mock pipeline (AsyncStorage) ────────────────────────────────────
  const now = new Date().toISOString();
  const id = makeId('sub');
  const events: ModerationEvent[] = [];

  // Step 1: validation
  events.push({
    id: makeId('mod'), submissionId: id, kind: 'validation', outcome: 'passed',
    reason: 'Submission passed structural validation.', at: now,
  });

  // Step 2: harmful content screening
  const harmScreen = screenForHarmfulContent(`${input.title} ${input.problem} ${input.rationale}`);
  events.push({
    id: makeId('mod'), submissionId: id, kind: 'harmful_screening',
    outcome: harmScreen.flagged ? 'flagged' : 'passed',
    reason: harmScreen.flagged ? harmScreen.reasons.join('; ') : 'No harmful content detected by mock screening.',
    at: now,
  });

  // Step 3: duplicate detection
  const existing = await loadSubmissions();
  const dup = detectDuplicates({ title: input.title, problem: input.problem }, existing);
  events.push({
    id: makeId('mod'), submissionId: id, kind: 'duplicate_detection',
    outcome: dup.isDuplicate ? 'merged' : 'passed',
    reason: dup.isDuplicate ? `Duplicate of ${dup.similarIds.join(', ')} (similarity ${dup.similarity.toFixed(2)}). Original preserved; merged into cluster.` : `No duplicates detected (best similarity ${dup.similarity.toFixed(2)}).`,
    at: now,
  });

  // Step 4: topic classification
  const classification = classifyTopic({ title: input.title, problem: input.problem });
  events.push({
    id: makeId('mod'), submissionId: id, kind: 'topic_classification',
    outcome: 'passed', reason: `Classified as ${classification.label} (confidence ${classification.confidence.toFixed(2)}).`,
    at: now,
  });

  // Step 5: clustering (if duplicate, link to existing cluster; otherwise form a new one)
  let clusterId: string | undefined;
  if (dup.isDuplicate && dup.similarIds.length > 0) {
    const existingSub = existing.find(s => s.id === dup.similarIds[0]);
    if (existingSub) {
      clusterId = existingSub.clusterId ?? `cluster-${existingSub.id}`;
      events.push({
        id: makeId('mod'), submissionId: id, kind: 'clustering', outcome: 'merged',
        reason: `Merged into cluster ${clusterId}. Original submission preserved.`,
        at: now,
      });
    }
  } else {
    clusterId = `cluster-${id}`;
    events.push({
      id: makeId('mod'), submissionId: id, kind: 'clustering', outcome: 'passed',
      reason: `New cluster formed: ${clusterId}.`,
      at: now,
    });
  }

  const status: SubmissionStatus = harmScreen.flagged ? 'flagged' : dup.isDuplicate ? 'merged' : 'topic_classified';

  const submission: CitizenSubmission = {
    id,
    title: sanitizeText(input.title, MAX_TITLE),
    topic: input.topic,
    affectedArticleId: input.affectedArticleId,
    problem: sanitizeText(input.problem),
    proposedWordingSw: input.proposedWordingSw ? sanitizeText(input.proposedWordingSw) : undefined,
    proposedWordingEn: input.proposedWordingEn ? sanitizeText(input.proposedWordingEn) : undefined,
    rationale: sanitizeText(input.rationale),
    supportingEvidence: input.supportingEvidence ? sanitizeText(input.supportingEvidence) : undefined,
    region: input.region,
    district: input.district,
    anonymous: input.anonymous,
    authorId: input.authorId,
    authorDisplayName: input.anonymous ? 'Mwananchi' : sanitizeText(input.authorDisplayName, 100),
    authorVerified: input.authorVerified,
    authorVerificationTier: input.authorVerificationTier,
    createdAt: now,
    updatedAt: now,
    status,
    clusterId,
    moderationEvents: events,
    classification,
  };

  const next = [submission, ...existing];
  await saveSubmissions(next);
  await appendAuditEvent({
    id: makeId('audit'), kind: 'submission_created', submissionId: id,
    actorId: input.authorId, actorName: submission.authorDisplayName, actorRole: input.authorVerified ? 'verified_citizen' : 'citizen',
    description: `Submission "${submission.title}" created on topic ${CONSTITUTIONAL_TOPIC_LABELS[submission.topic].en}.`,
    publicMetadata: { topic: submission.topic, region: submission.region ?? null, district: submission.district ?? null, anonymous: submission.anonymous, duplicate: dup.isDuplicate, clusterId: clusterId ?? null },
    at: now,
  });

  return { submission, events, duplicate: dup };
}

/** Update a submission's mutable fields (used by the backend adapter). */
export async function updateSubmission(id: string, patch: Partial<CitizenSubmission>): Promise<CitizenSubmission> {
  const repo = await resolveRepository();
  if (repo) return repo.updateSubmission(id, patch);
  const list = await loadSubmissions();
  const idx = list.findIndex(s => s.id === id);
  if (idx === -1) throw new Error('Submission not found');
  const updated: CitizenSubmission = { ...list[idx], ...patch, updatedAt: new Date().toISOString() };
  list[idx] = updated;
  await saveSubmissions(list);
  return updated;
}

export async function moderateSubmission(id: string, moderatorId: string, moderatorName: string, decision: 'approve' | 'reject' | 'merge' | 'flag', reason: string): Promise<CitizenSubmission> {
  const repo = await resolveRepository();
  if (repo) return repo.moderateSubmission(id, moderatorId, decision, reason);
  const list = await loadSubmissions();
  const idx = list.findIndex(s => s.id === id);
  if (idx === -1) throw new Error('Submission not found');
  const sub = list[idx];
  const now = new Date().toISOString();
  const newStatus: SubmissionStatus = decision === 'approve' ? 'topic_classified' : decision === 'reject' ? 'rejected_by_moderator' : decision === 'merge' ? 'merged' : 'flagged';
  const event: ModerationEvent = {
    id: makeId('mod'), submissionId: id, kind: 'human_review',
    outcome: decision === 'approve' ? 'manual_override' : decision === 'reject' ? 'rejected' : decision === 'merge' ? 'merged' : 'flagged',
    reason, moderatorId, moderatorName, at: now,
  };
  const updated: CitizenSubmission = { ...sub, status: newStatus, moderationEvents: [...sub.moderationEvents, event], updatedAt: now };
  list[idx] = updated;
  await saveSubmissions(list);
  await appendAuditEvent({
    id: makeId('audit'), kind: newStatus === 'rejected_by_moderator' ? 'submission_rejected' : 'submission_moderated',
    submissionId: id, actorId: moderatorId, actorName: moderatorName, actorRole: 'moderator',
    description: `Moderator ${moderatorName} decision: ${decision}. Reason: ${reason}`,
    publicMetadata: { decision, status: newStatus }, at: now,
  });
  return updated;
}

// ─── Multi-stage polling ──────────────────────────────────────────────────────

export async function loadPolls(): Promise<MultiStagePoll[]> {
  const repo = await resolveRepository();
  if (repo) return repo.listPolls();
  try {
    const raw = await AsyncStorage.getItem(POLLS_KEY);
    if (!raw) return seedPolls();
    return JSON.parse(raw) as MultiStagePoll[];
  } catch { return seedPolls(); }
}

export async function savePolls(list: MultiStagePoll[]): Promise<void> {
  // Surface failures to the caller. A silent console.warn here would let
  // the UI show "vote recorded" while the data was never persisted.
  await AsyncStorage.setItem(POLLS_KEY, JSON.stringify(list));
}

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
    representativenessWarning: 'Matokeo ya kura hayaonyesha uwakilishi wa kitaifa. Washiriki waliouthibitishwa wachache tu wamepiga kura. / Poll results do not represent national opinion. Only a small number of verified participants have voted.',
    totalVotes: 0, verifiedVotes: 0, abstentions: 0,
    regionDistribution: {}, verificationTierDistribution: {},
    autoApproved: false, humanReviewed: false,
  };
}

export async function castVote(pollId: string, optionId: string, voter: { id: string; verified: boolean; region?: TanzaniaRegion; tier: VerificationTier }): Promise<MultiStagePoll> {
  // Delegate to the active backend when configured. The server-side
  // cast_workflow_vote() RPC enforces one-vote-per-poller via RLS + unique
  // constraint, so the client-side mutex is not needed in that path. We keep
  // the mutex for the local-mock path below.
  const repo = await resolveRepository();
  if (repo) return repo.castVote(pollId, optionId, voter);

  return voteMutex.run(async () => {
    const polls = await loadPolls();
    const idx = polls.findIndex(p => p.id === pollId);
    if (idx === -1) throw new Error('Poll not found');
    const poll = polls[idx];
    if (poll.status !== 'open') throw new Error('Poll is not open');
    const now = Date.now();
    if (now < Date.parse(poll.opensAt) || now > Date.parse(poll.closesAt)) throw new Error('Poll is outside its voting window');

    // Bot detection (mock): reject if voter account is too new (< 60 seconds)
    // In real backend this would use account age, IP reputation, behavioral signals.
    // We can't enforce this without the user creation date; pass through for the mock.

    // Check one-vote-per-poll — this check + the writes below are now atomic
    // under voteMutex, so a double-tap cannot pass the check twice.
    const votes = await loadVotes();
    if (votes[pollId]?.[voter.id]) throw new Error('Mtumiaji ameshapiga kura. / Voter has already cast a vote.');

    const opt = poll.options.find(o => o.id === optionId);
    if (!opt) throw new Error('Option not found');

    const updatedPoll: MultiStagePoll = {
      ...poll,
      totalVotes: poll.totalVotes + 1,
      verifiedVotes: poll.verifiedVotes + (voter.verified ? 1 : 0),
      regionDistribution: voter.region ? { ...poll.regionDistribution, [voter.region]: (poll.regionDistribution[voter.region] ?? 0) + 1 } : poll.regionDistribution,
      verificationTierDistribution: { ...poll.verificationTierDistribution, [voter.tier]: (poll.verificationTierDistribution[voter.tier] ?? 0) + 1 },
      options: poll.options.map(o => o.id === optionId
        ? { ...o, votes: o.votes + 1, verifiedVotes: o.verifiedVotes + (voter.verified ? 1 : 0), percentage: 0 }
        : o,
      ),
    };
    // Recompute percentages
    const total = updatedPoll.totalVotes || 1;
    updatedPoll.options = updatedPoll.options.map(o => ({ ...o, percentage: Math.round((o.votes / total) * 100) }));
    updatedPoll.isRepresentative = updatedPoll.verifiedVotes >= updatedPoll.minimumParticipation;
    if (updatedPoll.isRepresentative) {
      updatedPoll.representativenessWarning = 'Ushiriki umefikia kiwango cha chini, lakini bado si uwakilishi wa kitaifa. / Participation has met the minimum threshold, but is still not national representation.';
    }
    polls[idx] = updatedPoll;
    // Save polls first; if this throws, no vote record is created either.
    await savePolls(polls);

    // Record vote — atomic with the poll update above (mutex held throughout).
    const allVotes = votes;
    if (!allVotes[pollId]) allVotes[pollId] = {};
    allVotes[pollId][voter.id] = optionId;
    await saveVotes(allVotes);

    return updatedPoll;
  });
}

export async function abstain(pollId: string, voter: { id: string; verified: boolean; region?: TanzaniaRegion; tier: VerificationTier }): Promise<MultiStagePoll> {
  const repo = await resolveRepository();
  if (repo) return repo.abstain(pollId, voter);
  return voteMutex.run(async () => {
    const polls = await loadPolls();
    const idx = polls.findIndex(p => p.id === pollId);
    if (idx === -1) throw new Error('Poll not found');
    const poll = polls[idx];
    const votes = await loadVotes();
    if (votes[pollId]?.[voter.id]) throw new Error('Mtumiaji ameshapiga kura. / Voter has already cast a vote.');
    const updated: MultiStagePoll = {
      ...poll,
      abstentions: poll.abstentions + 1,
      totalVotes: poll.totalVotes + 1,
      verifiedVotes: poll.verifiedVotes + (voter.verified ? 1 : 0),
      regionDistribution: voter.region ? { ...poll.regionDistribution, [voter.region]: (poll.regionDistribution[voter.region] ?? 0) + 1 } : poll.regionDistribution,
      verificationTierDistribution: { ...poll.verificationTierDistribution, [voter.tier]: (poll.verificationTierDistribution[voter.tier] ?? 0) + 1 },
    };
    polls[idx] = updated;
    await savePolls(polls);
    if (!votes[pollId]) votes[pollId] = {};
    votes[pollId][voter.id] = '__abstain__';
    await saveVotes(votes);
    return updated;
  });
}

export async function closePoll(pollId: string, closer: { id: string; name: string; role: DraftBuilderRole }): Promise<MultiStagePoll> {
  const repo = await resolveRepository();
  if (repo) return repo.closePoll(pollId, closer);
  const polls = await loadPolls();
  const idx = polls.findIndex(p => p.id === pollId);
  if (idx === -1) throw new Error('Poll not found');
  const poll = polls[idx];
  const updated: MultiStagePoll = { ...poll, status: 'closed', humanReviewed: true };
  polls[idx] = updated;
  await savePolls(polls);
  await appendAuditEvent({
    id: makeId('audit'), kind: 'poll_closed', pollId,
    actorId: closer.id, actorName: closer.name, actorRole: closer.role,
    description: `Poll "${poll.title}" closed. Total votes: ${poll.totalVotes}.`,
    publicMetadata: { totalVotes: poll.totalVotes, verifiedVotes: poll.verifiedVotes, isRepresentative: poll.isRepresentative, autoApproved: false },
    at: new Date().toISOString(),
  });
  return updated;
}

export async function hasVoted(pollId: string, voterId: string): Promise<boolean> {
  const repo = await resolveRepository();
  if (repo) return repo.hasVoted(pollId, voterId);
  const votes = await loadVotes();
  return Boolean(votes[pollId]?.[voterId]);
}

async function loadVotes(): Promise<Record<string, Record<string, string>>> {
  try {
    const raw = await AsyncStorage.getItem(VOTES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

async function saveVotes(votes: Record<string, Record<string, string>>): Promise<void> {
  // Surface failures to the caller. Vote integrity depends on this write.
  await AsyncStorage.setItem(VOTES_KEY, JSON.stringify(votes));
}

// ─── Audit log ────────────────────────────────────────────────────────────────

export async function loadAuditEvents(articleId?: string): Promise<AuditEvent[]> {
  const repo = await resolveRepository();
  if (repo) return repo.listAuditEvents(articleId);
  try {
    const raw = await AsyncStorage.getItem(AUDIT_KEY);
    const list: AuditEvent[] = raw ? JSON.parse(raw) : seedAuditEvents();
    return articleId ? list.filter(e => e.articleId === articleId) : list;
  } catch { return seedAuditEvents(); }
}

export async function appendAuditEvent(event: AuditEvent): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(AUDIT_KEY);
    const list: AuditEvent[] = raw ? JSON.parse(raw) : [];
    list.unshift(event);
    // Keep the audit log bounded to avoid unbounded growth in demo storage.
    const trimmed = list.slice(0, 500);
    await AsyncStorage.setItem(AUDIT_KEY, JSON.stringify(trimmed));
  } catch (e) { console.warn('[audit] save failed', e); }
}

export async function logAuditEvent(input: Partial<AuditEvent> & { kind: AuditEventKind; actorId: string; actorName: string; description: string; actorRole: DraftBuilderRole }): Promise<void> {
  const event: AuditEvent = {
    id: input.id ?? makeId('audit'),
    kind: input.kind,
    articleId: input.articleId,
    versionId: input.versionId,
    submissionId: input.submissionId,
    clusterId: input.clusterId,
    pollId: input.pollId,
    actorId: input.actorId,
    actorName: input.actorName,
    actorRole: input.actorRole,
    description: input.description,
    publicMetadata: input.publicMetadata ?? {},
    at: input.at ?? new Date().toISOString(),
  };
  await appendAuditEvent(event);
}

// ─── No seed data ────────────────────────────────────────────────────────────
// All mock/sample data has been removed. When no Supabase backend is
// configured and AsyncStorage is empty, these return empty arrays — the UI
// shows proper empty states. Real data comes from Supabase when configured.

function seedSubmissions(): CitizenSubmission[] {
  return [];
}

function seedPolls(): MultiStagePoll[] {
  return [];
}

function seedAuditEvents(): AuditEvent[] {
  return [];
}

export async function resetAllWorkflowData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([SUBMISSIONS_KEY, POLLS_KEY, AUDIT_KEY, VOTES_KEY]);
  } catch (e) {
    console.warn('[workflow] reset failed', e);
  }
}

// ─── Type re-exports for convenience ─────────────────────────────────────────

export type {
  CitizenSubmission, ModerationEvent, SubmissionStatus, ConstitutionalTopic,
  MultiStagePoll, MultiStagePollOption, PollStageLike, AuditEvent, AuditEventKind, DraftBuilderRole,
};
