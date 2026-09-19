/**
 * Katiba Yetu — Phase 2 workflow types.
 *
 * Citizen submission pipeline, multi-stage polling, draft builder actions,
 * approval workflow, role-based permissions, and audit events.
 *
 * Governance rule: every generated item must be clearly labelled with one of
 * the ProposalStatus values. The system may generate proposed wording but it
 * must never present AI-generated text as an official constitution.
 */

import type { TanzaniaRegion, VerificationTier, LibraryLanguage } from './index';
import type { GenerationMethod } from './proposed';

// ─── Citizen Submission (input pipeline entry point) ─────────────────────────

export type SubmissionStatus =
  | 'submitted'
  | 'validation_failed'
  | 'in_moderation'
  | 'flagged'
  | 'duplicate_detected'
  | 'merged'
  | 'topic_classified'
  | 'clustered'
  | 'rejected_by_moderator'
  | 'withdrawn';

export type ConstitutionalTopic =
  | 'state'
  | 'union'
  | 'equality'
  | 'expression'
  | 'religion'
  | 'association'
  | 'property'
  | 'duties'
  | 'governance'
  | 'judiciary'
  | 'legislature'
  | 'executive'
  | 'citizenship'
  | 'rights_arrest'
  | 'labor'
  | 'education'
  | 'health'
  | 'environment'
  | 'other';

export const CONSTITUTIONAL_TOPIC_LABELS: Record<ConstitutionalTopic, { sw: string; en: string }> = {
  state:        { sw: 'Dola',                en: 'State' },
  union:        { sw: 'Muungano',            en: 'Union' },
  equality:     { sw: 'Usawa',               en: 'Equality' },
  expression:   { sw: 'Maoni',               en: 'Expression' },
  religion:     { sw: 'Dini',                en: 'Religion' },
  association:  { sw: 'Kujumuika',           en: 'Association' },
  property:     { sw: 'Mali',                en: 'Property' },
  duties:       { sw: 'Wajibu',              en: 'Duties' },
  governance:   { sw: 'Utawala',             en: 'Governance' },
  judiciary:    { sw: 'Mahakama',            en: 'Judiciary' },
  legislature:  { sw: 'Bunge',               en: 'Legislature' },
  executive:    { sw: 'Mamlaka ya Utendaji',  en: 'Executive' },
  citizenship:  { sw: 'Uraia',               en: 'Citizenship' },
  rights_arrest: { sw: 'Haki ya Kushikwa',   en: 'Rights on Arrest' },
  labor:        { sw: 'Kazi',                en: 'Labor' },
  education:    { sw: 'Elimu',               en: 'Education' },
  health:       { sw: 'Afya',                en: 'Health' },
  environment:  { sw: 'Mazingira',            en: 'Environment' },
  other:        { sw: 'Nyingine',            en: 'Other' },
};

export interface CitizenSubmission {
  id: string;
  title: string;
  topic: ConstitutionalTopic;
  affectedArticleId?: string;
  problem: string;
  proposedWordingSw?: string;
  proposedWordingEn?: string;
  rationale: string;
  supportingEvidence?: string;
  region?: TanzaniaRegion;
  /** Optional district id within the region (see src/constants/regions.ts). */
  district?: string;
  /** Anonymous preference — submissions may be displayed without author identity. */
  anonymous: boolean;
  authorId: string;
  authorDisplayName: string;
  authorVerified: boolean;
  authorVerificationTier: VerificationTier;
  createdAt: string;
  updatedAt: string;
  status: SubmissionStatus;
  /** Linked cluster when duplicates are detected and merged. */
  clusterId?: string;
  /** Moderation outcomes attached to this submission. */
  moderationEvents: ModerationEvent[];
  /** Topic classification confidence and labels suggested by the pipeline. */
  classification?: { label: ConstitutionalTopic; confidence: number; alternatives: { label: ConstitutionalTopic; confidence: number }[] };
}

export interface ModerationEvent {
  id: string;
  submissionId: string;
  kind: 'validation' | 'harmful_screening' | 'duplicate_detection' | 'topic_classification' | 'clustering' | 'human_review' | 'rejection' | 'restoration';
  outcome: 'passed' | 'flagged' | 'rejected' | 'merged' | 'restored' | 'manual_override';
  reason: string;
  moderatorId?: string;
  moderatorName?: string;
  at: string;
}

// ─── Multi-stage Polling ──────────────────────────────────────────────────────

export type PollStageStatus = 'draft' | 'open' | 'closed' | 'cancelled';

export interface MultiStagePollOption {
  id: string;
  pollId: string;
  label: string;
  description?: string;
  orderIndex: number;
  votes: number;
  verifiedVotes: number;
  percentage: number;
}

export interface MultiStagePoll {
  id: string;
  articleId?: string;       // linked proposed article, if any
  clusterId?: string;      // linked proposal cluster
  stage: PollStageLike;
  title: string;
  description: string;
  options: MultiStagePollOption[];
  opensAt: string;
  closesAt: string;
  status: PollStageStatus;
  minimumParticipation: number;
  isRepresentative: boolean;
  representativenessWarning: string;
  totalVotes: number;
  verifiedVotes: number;
  abstentions: number;
  regionDistribution: Partial<Record<TanzaniaRegion, number>>;
  verificationTierDistribution: Partial<Record<VerificationTier, number>>;
  /** Whether the poll result has been used to auto-approve an article. Always false. */
  autoApproved: false;
  /** Whether the poll has been confirmed by a human reviewer as a valid signal. */
  humanReviewed: boolean;
}

export type PollStageLike =
  | 'problem_confirmation'
  | 'policy_direction'
  | 'article_wording'
  | 'approval_for_draft';

export const POLL_STAGE_ORDER: PollStageLike[] = [
  'problem_confirmation',
  'policy_direction',
  'article_wording',
  'approval_for_draft',
];

// ─── Draft Builder actions & audit ───────────────────────────────────────────

export type DraftBuilderActionKind =
  | 'create_version'
  | 'select_article'
  | 'assign_chapter'
  | 'assign_article_number'
  | 'reorder_chapter'
  | 'edit_wording'
  | 'attach_reviewer_notes'
  | 'send_back_for_discussion'
  | 'request_poll'
  | 'mark_legally_reviewed'
  | 'publish_version'
  | 'archive_version'
  | 'restore_from_version';

export interface DraftBuilderAction {
  id: string;
  versionId: string;
  actorId: string;
  actorName: string;
  actorRole: DraftBuilderRole;
  kind: DraftBuilderActionKind;
  articleId?: string;
  chapterId?: string;
  description: string;
  /** Snapshot of any field changed, for audit purposes. */
  before?: string;
  after?: string;
  at: string;
}

export type DraftBuilderRole =
  | 'citizen'
  | 'verified_citizen'
  | 'legal_expert'
  | 'moderator'
  | 'drafting_committee'
  | 'administrator';

export const DRAFT_BUILDER_ROLE_LABELS: Record<DraftBuilderRole, { sw: string; en: string }> = {
  citizen:             { sw: 'Mwananchi',                       en: 'Citizen' },
  verified_citizen:    { sw: 'Raia Aliyethibitishwa',            en: 'Verified Citizen' },
  legal_expert:        { sw: 'Mtaalamu wa Sheria',              en: 'Legal Expert' },
  moderator:           { sw: 'Msimamizi wa Yaliyomo',            en: 'Moderator' },
  drafting_committee:  { sw: 'Kamati ya Rasimu',                en: 'Drafting Committee' },
  administrator:       { sw: 'Msimamizi Mkuu',                  en: 'Administrator' },
};

// ─── Role-based permissions ──────────────────────────────────────────────────

export type Permission =
  | 'proposal.submit'
  | 'proposal.discuss'
  | 'proposal.vote'
  | 'proposal.endorse'
  | 'proposal.report'
  | 'proposal.moderate'
  | 'proposal.merge'
  | 'proposal.reject'
  | 'proposal.restore'
  | 'draft.review_legal'
  | 'draft.request_poll'
  | 'draft.send_back'
  | 'draft.create_version'
  | 'draft.edit_wording'
  | 'draft.publish_version'
  | 'draft.archive_version'
  | 'draft.restore_version'
  | 'admin.manage_roles'
  | 'admin.view_audit';

export const ROLE_PERMISSIONS: Record<DraftBuilderRole, Permission[]> = {
  citizen: ['proposal.submit', 'proposal.discuss', 'proposal.vote', 'proposal.endorse', 'proposal.report'],
  verified_citizen: ['proposal.submit', 'proposal.discuss', 'proposal.vote', 'proposal.endorse', 'proposal.report'],
  legal_expert: ['proposal.discuss', 'proposal.vote', 'proposal.endorse', 'draft.review_legal'],
  moderator: ['proposal.discuss', 'proposal.vote', 'proposal.endorse', 'proposal.moderate', 'proposal.merge', 'proposal.reject', 'proposal.restore'],
  drafting_committee: [
    'proposal.discuss', 'proposal.vote', 'proposal.endorse',
    'draft.request_poll', 'draft.send_back', 'draft.create_version',
    'draft.edit_wording', 'draft.publish_version',
  ],
  administrator: [
    'proposal.submit', 'proposal.discuss', 'proposal.vote', 'proposal.endorse', 'proposal.report',
    'proposal.moderate', 'proposal.merge', 'proposal.reject', 'proposal.restore',
    'draft.review_legal', 'draft.request_poll', 'draft.send_back',
    'draft.create_version', 'draft.edit_wording', 'draft.publish_version', 'draft.archive_version', 'draft.restore_version',
    'admin.manage_roles', 'admin.view_audit',
  ],
};

export function canPerform(role: DraftBuilderRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

// ─── Approval workflow ───────────────────────────────────────────────────────

export type ApprovalStage =
  | 'citizen_input'
  | 'moderation'
  | 'clustering'
  | 'legal_review'
  | 'committee_approval'
  | 'published'
  | 'rejected';

export interface ApprovalWorkflowState {
  articleId: string;
  currentStage: ApprovalStage;
  stages: {
    stage: ApprovalStage;
    status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'skipped';
    decisionBy?: string;
    decisionAt?: string;
    rationale?: string;
    notes?: string;
  }[];
  /** Configurable approval rules — minimum participation, required poll stages, etc. */
  rules: ApprovalRules;
}

export interface ApprovalRules {
  minimumVerifiedParticipants: number;
  minimumRegions: number;
  requiredPollStages: PollStageLike[];
  /** A poll never auto-approves; this is always false unless overridden by a human. */
  requireLegalReview: boolean;
  requireCommitteeApproval: boolean;
  /** Minimum support percentage across all required poll stages. */
  minimumSupportPercentage: number;
}

export const DEFAULT_APPROVAL_RULES: ApprovalRules = {
  minimumVerifiedParticipants: 10,
  minimumRegions: 3,
  requiredPollStages: ['problem_confirmation', 'article_wording', 'approval_for_draft'],
  requireLegalReview: true,
  requireCommitteeApproval: true,
  minimumSupportPercentage: 60,
};

// ─── Audit events (publicly visible) ─────────────────────────────────────────

export type AuditEventKind =
  | 'submission_created'
  | 'submission_moderated'
  | 'submission_merged'
  | 'submission_rejected'
  | 'submission_restored'
  | 'cluster_formed'
  | 'cluster_dissolved'
  | 'generation_run'
  | 'wording_edited'
  | 'legal_review_recorded'
  | 'poll_opened'
  | 'poll_closed'
  | 'poll_result_recorded'
  | 'approval_decision'
  | 'draft_version_created'
  | 'draft_version_published'
  | 'draft_version_archived'
  | 'draft_version_restored';

export interface AuditEvent {
  id: string;
  kind: AuditEventKind;
  articleId?: string;
  versionId?: string;
  submissionId?: string;
  clusterId?: string;
  pollId?: string;
  /** Optional — system-generated events may have no actor. */
  actorId?: string;
  actorName: string;
  actorRole: DraftBuilderRole;
  description: string;
  /** Public metadata (excludes any protected personal or moderation information). */
  publicMetadata: Record<string, string | number | boolean | null>;
  at: string;
}

// ─── Phase 3 backend hooks (interfaces only — never pretend a live backend is connected) ─

/**
 * Backend repository adapter. The mock implementation persists to AsyncStorage;
 * the real implementation will issue authenticated HTTP calls to a server.
 *
 * Do NOT call this directly from UI components — use the typed service wrappers.
 */
export interface BackendRepository {
  readonly kind: 'unavailable' | 'http' | 'supabase';
  /** Returns true if a real backend URL has been configured. */
  isConfigured(): boolean;
  listSubmissions(): Promise<CitizenSubmission[]>;
  createSubmission(input: Omit<CitizenSubmission, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'moderationEvents'>): Promise<CitizenSubmission>;
  updateSubmission(id: string, patch: Partial<CitizenSubmission>): Promise<CitizenSubmission>;
  moderateSubmission(id: string, moderatorId: string, decision: 'approve' | 'reject' | 'merge' | 'flag', reason: string): Promise<CitizenSubmission>;
  listPolls(articleId?: string): Promise<MultiStagePoll[]>;
  castVote(pollId: string, optionId: string, voter: { id: string; verified: boolean; region?: TanzaniaRegion; tier: VerificationTier }): Promise<MultiStagePoll>;
  abstain(pollId: string, voter: { id: string; verified: boolean; region?: TanzaniaRegion; tier: VerificationTier }): Promise<MultiStagePoll>;
  closePoll(pollId: string, closer: { id: string; name: string; role: import('./proposedWorkflow').DraftBuilderRole }): Promise<MultiStagePoll>;
  hasVoted(pollId: string, voterId: string): Promise<boolean>;
  listAuditEvents(articleId?: string): Promise<AuditEvent[]>;
}

/**
 * AI generation backend hook. The mock implementation produces deterministic
 * labelled drafts; the real implementation will call a grounded LLM that cites
 * its source inputs and preserves minority viewpoints.
 *
 * Governance: never claims national consensus, never publishes directly,
 * requires human approval before entering a draft, logs generation date,
 * method and source IDs, and supports regeneration without deleting
 * earlier versions.
 */
export interface AIGenerationBackend {
  readonly kind: 'unavailable' | 'ai_backend';
  isConfigured(): boolean;
  generateDraft(input: AIGenerationInput): Promise<AIGenerationResult>;
  regenerate(articleId: string, priorVersion?: number): Promise<AIGenerationResult>;
}

export interface AIGenerationInput {
  moderatedProposals: CitizenSubmission[];
  discussionSummaries: { threadId: string; summary: string }[];
  supportingArguments: string[];
  opposingArguments: string[];
  alternativeWording: string[];
  pollResults: MultiStagePoll[];
  currentConstitutionalArticles: { id: string; number: string; text: string }[];
  relevantApprovedArticles: { id: string; number: string; text: string }[];
  legalReviewConstraints: string[];
}

export interface AIGenerationResult {
  proposedArticleText: { sw?: string; en?: string };
  proposedClauses: { number: string; text: string }[];
  plainLanguageExplanation: { sw?: string; en?: string };
  rationale: { sw?: string; en?: string };
  sourceMapping: { sourceId: string; citedExcerpt: string }[];
  unresolvedConflicts: string[];
  minorityPositionSummary: string;
  legalRisks: string[];
  generationMethod: GenerationMethod;
  modelIdentifier: string | null;
  promptVersion: string | null;
  /** Every generation run is logged with this id; do not silently delete prior runs. */
  runId: string;
}

/**
 * Identity verification hook. The mock implementation always returns false;
 * the real implementation will integrate with NIDA / OTP providers.
 */
export interface IdentityVerificationBackend {
  readonly kind: 'unavailable' | 'nida' | 'otp';
  isConfigured(): boolean;
  initiateNIDAVerification(nin: string): Promise<{ requestId: string; status: 'initiated' | 'rejected' }>;
  confirmNIDAVerification(requestId: string, otp: string): Promise<{ verified: boolean; tier: VerificationTier }>;
  initiatePhoneOTP(phone: string): Promise<{ requestId: string }>;
  confirmPhoneOTP(requestId: string, otp: string): Promise<{ verified: boolean }>;
}

/**
 * Moderation service hook. The mock implementation runs deterministic checks;
 * the real implementation will use a content classifier and a duplicate
 * detector backed by embeddings.
 */
export interface ModerationBackend {
  readonly kind: 'unavailable' | 'classifier';
  isConfigured(): boolean;
  screenForHarmfulContent(text: string): Promise<{ flagged: boolean; reasons: string[]; confidence: number }>;
  detectDuplicates(submission: { title: string; body: string }, existing: CitizenSubmission[]): Promise<{ isDuplicate: boolean; similarIds: string[]; similarity: number }>;
  detectBotingSignals(voter: { id: string; createdAt: string }): Promise<{ isBot: boolean; reasons: string[] }>;
  classifyTopic(submission: { title: string; body: string }): Promise<{ label: ConstitutionalTopic; confidence: number; alternatives: { label: ConstitutionalTopic; confidence: number }[] }>;
}

/**
 * PDF generation hook. The mock implementation builds an HTML print view;
 * the real implementation will render a server-side PDF.
 */
export interface PDFExportBackend {
  readonly kind: 'unavailable' | 'server';
  isConfigured(): boolean;
  exportDraft(versionId: string, options: { language: LibraryLanguage; includeMethodology: boolean }): Promise<{ blobUri: string; sizeBytes: number; generatedAt: string }>;
}

// ─── Type re-exports for backwards compatibility ─────────────────────────────
// Note: ProposalStatus, LegalReviewStatus, GenerationMethod are already exported
// from proposed.ts and re-exported via `export * from './proposed'` in index.ts.
// We intentionally DO NOT re-export them here to avoid duplicate export errors.
