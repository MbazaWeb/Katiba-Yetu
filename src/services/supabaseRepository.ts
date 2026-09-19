/**
 * Katiba Yetu — Supabase Backend Repository
 *
 * Real implementation of BackendRepository backed by the Supabase Postgres
 * database (via the JS client). Automatically used when EXPO_PUBLIC_SUPABASE_URL
 * and EXPO_PUBLIC_SUPABASE_ANON_KEY are set and valid.
 *
 * Maps between DB snake_case rows and the camelCase TypeScript types used
 * throughout the app. Falls back gracefully — any error surfaces as a thrown
 * exception so callers can fall back to mock data if needed.
 */

import { supabase } from '../lib/supabase';
import type {
  BackendRepository,
  CitizenSubmission,
  MultiStagePoll,
  MultiStagePollOption,
  AuditEvent,
  TanzaniaRegion,
  VerificationTier,
  ModerationEvent,
} from '../types';
import type { ConstitutionalTopic, SubmissionStatus, PollStageLike } from '../types/proposedWorkflow';

// ─── Row → Domain mappers ─────────────────────────────────────────────────────

function mapSubmissionRow(row: Record<string, unknown>): CitizenSubmission {
  return {
    id: row.id as string,
    title: row.title as string,
    topic: row.topic as ConstitutionalTopic,
    affectedArticleId: (row.affected_article_id as string | null) ?? undefined,
    problem: row.problem as string,
    proposedWordingSw: (row.proposed_wording_sw as string | null) ?? undefined,
    proposedWordingEn: (row.proposed_wording_en as string | null) ?? undefined,
    rationale: row.rationale as string,
    supportingEvidence: (row.supporting_evidence as string | null) ?? undefined,
    region: (row.region as TanzaniaRegion | null) ?? undefined,
    district: (row.district as string | null) ?? undefined,
    anonymous: row.anonymous as boolean,
    authorId: row.author_id as string,
    authorDisplayName: (row as { profiles?: { display_name?: string } }).profiles?.display_name ?? 'Mwananchi',
    authorVerified: false, // populated separately if needed
    authorVerificationTier: 'email' as VerificationTier,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    status: row.status as SubmissionStatus,
    clusterId: (row.cluster_id as string | null) ?? undefined,
    moderationEvents: [], // loaded separately
    classification: row.classification_label
      ? {
          label: row.classification_label as ConstitutionalTopic,
          confidence: (row.classification_confidence as number) ?? 0,
          alternatives: (row.classification_alternatives as { label: ConstitutionalTopic; confidence: number }[]) ?? [],
        }
      : undefined,
  };
}

function mapModerationRow(row: Record<string, unknown>): ModerationEvent {
  return {
    id: row.id as string,
    submissionId: row.submission_id as string,
    kind: row.kind as ModerationEvent['kind'],
    outcome: row.outcome as ModerationEvent['outcome'],
    reason: row.reason as string,
    moderatorId: (row.moderator_id as string | null) ?? undefined,
    at: row.at as string,
  };
}

function mapPollRow(
  row: Record<string, unknown>,
  options: MultiStagePollOption[],
): MultiStagePoll {
  return {
    id: row.id as string,
    articleId: (row.article_id as string | null) ?? undefined,
    clusterId: (row.cluster_id as string | null) ?? undefined,
    stage: row.stage as PollStageLike,
    title: row.title as string,
    description: row.description as string,
    options,
    opensAt: row.opens_at as string,
    closesAt: row.closes_at as string,
    status: row.status as MultiStagePoll['status'],
    minimumParticipation: row.minimum_participation as number,
    isRepresentative: row.is_representative as boolean,
    representativenessWarning: row.representativeness_warning as string,
    totalVotes: row.total_votes as number,
    verifiedVotes: row.verified_votes as number,
    abstentions: row.abstentions as number,
    regionDistribution: (row.region_distribution as Record<TanzaniaRegion, number>) ?? {},
    verificationTierDistribution: (row.verification_tier_distribution as Record<VerificationTier, number>) ?? {},
    autoApproved: false as const,
    humanReviewed: row.human_reviewed as boolean,
  };
}

function mapOptionRow(row: Record<string, unknown>, totalVotes: number): MultiStagePollOption {
  const votes = row.votes as number;
  return {
    id: row.id as string,
    pollId: row.poll_id as string,
    label: row.label as string,
    description: (row.description as string | null) ?? undefined,
    orderIndex: row.order_index as number,
    votes,
    verifiedVotes: row.verified_votes as number,
    percentage: totalVotes > 0 ? Math.round((votes / totalVotes) * 10000) / 100 : 0,
  };
}

function mapAuditRow(row: Record<string, unknown>): AuditEvent {
  const payload = (row.payload as Record<string, unknown>) ?? {};
  return {
    id: row.id as string,
    kind: row.kind as AuditEvent['kind'],
    articleId: (payload.article_id as string | null) ?? (row.subject_id as string | null) ?? undefined,
    actorId: (row.actor_id as string | null) ?? undefined,
    actorName: (row.actor_name as string | null) ?? 'Mfumo',
    actorRole: 'citizen',
    description: String(row.kind).replace(/_/g, ' '),
    publicMetadata: payload as Record<string, string | number | boolean | null>,
    at: row.at as string,
  };
}

// ─── SupabaseBackendRepository ────────────────────────────────────────────────

export class SupabaseBackendRepository implements BackendRepository {
  readonly kind = 'supabase' as const;

  isConfigured(): boolean {
    return true; // only instantiated when Supabase is configured
  }

  // ── Submissions ─────────────────────────────────────────────────────────────

  async listSubmissions(): Promise<CitizenSubmission[]> {
    const { data, error } = await supabase
      .from('citizen_submissions')
      .select('*, profiles(display_name, verification_tier, nida_verified)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    return (data ?? []).map(row => {
      const profile = (row as unknown as { profiles?: Record<string, unknown> }).profiles;
      const submission = mapSubmissionRow(row as unknown as Record<string, unknown>);
      if (profile) {
        submission.authorDisplayName = (profile.display_name as string) ?? 'Mwananchi';
        submission.authorVerified = Boolean(profile.nida_verified);
        submission.authorVerificationTier = (profile.verification_tier as VerificationTier) ?? 'email';
      }
      return submission;
    });
  }

  async createSubmission(
    input: Omit<CitizenSubmission, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'moderationEvents'>,
  ): Promise<CitizenSubmission> {
    const { data, error } = await supabase.rpc('submit_citizen_proposal', {
      p_title: input.title,
      p_topic: input.topic,
      p_problem: input.problem,
      p_rationale: input.rationale,
      p_proposed_wording_sw: input.proposedWordingSw ?? null,
      p_proposed_wording_en: input.proposedWordingEn ?? null,
      p_supporting_evidence: input.supportingEvidence ?? null,
      p_affected_article_id: input.affectedArticleId ?? null,
      p_region: input.region ?? null,
      p_district: input.district ?? null,
      p_anonymous: input.anonymous,
    });

    if (error) throw error;

    // Fetch the created row
    const { data: row, error: fetchError } = await supabase
      .from('citizen_submissions')
      .select('*')
      .eq('id', data as string)
      .single();

    if (fetchError) throw fetchError;
    return mapSubmissionRow(row as unknown as Record<string, unknown>);
  }

  async updateSubmission(id: string, patch: Partial<CitizenSubmission>): Promise<CitizenSubmission> {
    // Only allow fields a citizen can update (withdraw only)
    const dbPatch: Record<string, unknown> = {};
    if (patch.status === 'withdrawn') dbPatch.status = 'withdrawn';
    if (patch.anonymous !== undefined) dbPatch.anonymous = patch.anonymous;

    const { data, error } = await supabase
      .from('citizen_submissions')
      .update(dbPatch)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return mapSubmissionRow(data as unknown as Record<string, unknown>);
  }

  // ── Polls ───────────────────────────────────────────────────────────────────

  async listPolls(articleId?: string): Promise<MultiStagePoll[]> {
    let query = supabase
      .from('workflow_polls')
      .select('*, workflow_poll_options(*)')
      .in('status', ['open', 'closed'])
      .order('opens_at', { ascending: false });

    if (articleId) query = query.eq('article_id', articleId);

    const { data, error } = await query;
    if (error) throw error;

    return (data ?? []).map(row => {
      const totalVotes = row.total_votes as number;
      const options = ((row as unknown as { workflow_poll_options: Record<string, unknown>[] }).workflow_poll_options ?? [])
        .sort((a, b) => (a.order_index as number) - (b.order_index as number))
        .map(o => mapOptionRow(o, totalVotes));
      return mapPollRow(row as unknown as Record<string, unknown>, options);
    });
  }

  async castVote(
    pollId: string,
    optionId: string,
    _voter: { id: string; verified: boolean; region?: TanzaniaRegion; tier: VerificationTier },
  ): Promise<MultiStagePoll> {
    const { error } = await supabase.rpc('cast_workflow_vote', {
      p_poll_id: pollId,
      p_option_id: optionId || null,
    });

    if (error) throw error;

    // Return fresh poll data
    const polls = await this.listPolls();
    const updated = polls.find(p => p.id === pollId);
    if (!updated) throw new Error('Poll not found after vote');
    return updated;
  }

  // ── Audit Events ────────────────────────────────────────────────────────────

  async listAuditEvents(articleId?: string): Promise<AuditEvent[]> {
    let query = supabase
      .from('audit_events')
      .select('*')
      .order('at', { ascending: false })
      .limit(200);

    if (articleId) {
      query = query.or(`subject_id.eq.${articleId},payload->>article_id.eq.${articleId}`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data ?? []).map(row => mapAuditRow(row as unknown as Record<string, unknown>));
  }
}

// ─── Supabase-backed moderation helpers ───────────────────────────────────────

/**
 * Load moderation events for a submission. Used by moderator screens.
 */
export async function loadModerationEvents(submissionId: string): Promise<ModerationEvent[]> {
  const { data, error } = await supabase
    .from('moderation_events')
    .select('*')
    .eq('submission_id', submissionId)
    .order('at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(row => mapModerationRow(row as unknown as Record<string, unknown>));
}

/**
 * Update submission status (moderator/admin only).
 * Calls the DB function which enforces role check server-side.
 */
export async function moderateSubmission(
  submissionId: string,
  status: SubmissionStatus,
  eventKind: ModerationEvent['kind'],
  outcome: ModerationEvent['outcome'],
  reason = '',
): Promise<void> {
  const { error } = await supabase.rpc('update_submission_status', {
    p_submission_id: submissionId,
    p_status: status,
    p_event_kind: eventKind,
    p_outcome: outcome,
    p_reason: reason,
  });
  if (error) throw error;
}

/**
 * Merge a submission into a cluster (moderator/admin only).
 */
export async function mergeIntoCluster(
  submissionId: string,
  clusterId: string,
  reason = 'Duplicate detected',
): Promise<void> {
  const { error } = await supabase.rpc('merge_into_cluster', {
    p_submission_id: submissionId,
    p_cluster_id: clusterId,
    p_reason: reason,
  });
  if (error) throw error;
}

/**
 * Full-text search across published constitution articles.
 */
export async function searchArticles(
  query: string,
  lang: 'sw' | 'en' = 'sw',
  docId?: string,
  limit = 20,
  offset = 0,
) {
  const { data, error } = await supabase.rpc('search_articles', {
    p_query: query,
    p_lang: lang,
    p_doc_id: docId ?? null,
    p_limit: limit,
    p_offset: offset,
  });
  if (error) throw error;
  return data ?? [];
}

/**
 * Get poll results with percentages (safe to call before/after close).
 */
export async function getPollResults(pollId: string) {
  const { data, error } = await supabase.rpc('get_poll_results', {
    p_poll_id: pollId,
  });
  if (error) throw error;
  return data;
}

/**
 * Publish a draft version (committee/admin only). Immutable after this.
 */
export async function publishDraftVersion(versionId: string): Promise<void> {
  const { error } = await supabase.rpc('publish_draft_version', {
    p_version_id: versionId,
  });
  if (error) throw error;
}

/**
 * Restore a draft version as a new draft (never overwrites published versions).
 */
export async function restoreDraftVersion(sourceVersionId: string, newTitle: string): Promise<string> {
  const { data, error } = await supabase.rpc('restore_draft_version', {
    p_source_version_id: sourceVersionId,
    p_new_title: newTitle,
  });
  if (error) throw error;
  return data as string;
}

/**
 * Record a committee approval/rejection decision on an article.
 */
export async function recordCommitteeDecision(
  articleId: string,
  stage: string,
  decision: 'approved' | 'rejected' | 'sent_back',
  rationale: string,
): Promise<string> {
  const { data, error } = await supabase.rpc('record_committee_decision', {
    p_article_id: articleId,
    p_stage: stage,
    p_decision: decision,
    p_rationale: rationale,
  });
  if (error) throw error;
  return data as string;
}

/**
 * Get participation summary for an article (submission/cluster counts).
 */
export async function getArticleParticipationSummary(articleId: string) {
  const { data, error } = await supabase.rpc('get_article_participation_summary', {
    p_article_id: articleId,
  });
  if (error) throw error;
  return data;
}
