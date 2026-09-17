/**
 * Katiba Yetu — Proposed Constitution types.
 *
 * Governance rule: every generated item must be clearly labelled with one of
 * the ProposalStatus values. The system may generate proposed wording but it
 * must never present AI-generated text as an official constitution.
 */

import type { TanzaniaRegion, VerificationTier } from './index';
import type { LibraryLanguage } from './constitution';

export type ProposalStatus =
  | 'citizen_proposal'        // Pendekezo la Mwananchi
  | 'merged_proposal'         // Pendekezo Lililounganishwa
  | 'system_draft'            // Rasimu Iliyotengenezwa na Mfumo
  | 'under_discussion'        // Inajadiliwa
  | 'awaiting_legal_review'   // Inasubiri Mapitio ya Kisheria
  | 'legally_reviewed'        // Imepitiwa na Mtaalamu
  | 'approved_for_draft'      // Imeidhinishwa kwa Kuingizwa kwenye Rasimu
  | 'rejected'                // Imekataliwa
  | 'withdrawn';              // Imeondolewa

export type ChapterProposalStatus =
  | 'approved'
  | 'under_discussion'
  | 'awaiting_legal_review'
  | 'disputed'
  | 'insufficient_participation';

export type LegalReviewStatus =
  | 'not_required'
  | 'pending'
  | 'in_review'
  | 'returned_for_revision'
  | 'approved'
  | 'rejected';

export type GenerationMethod = 'manual' | 'mock_deterministic' | 'ai_backend';

export interface ProposalSource {
  suggestionId: string;
  discussionId?: string;
  pollId?: string;
  stance: 'support' | 'oppose' | 'neutral' | 'alternative';
  excerpt: string;
  contributorRegion?: TanzaniaRegion;
  contributorVerified: boolean;
}

export interface RepresentationSummary {
  totalParticipants: number;
  verifiedParticipants: number;
  regionDistribution: Partial<Record<TanzaniaRegion, number>>;
  verificationTierDistribution: Partial<Record<VerificationTier, number>>;
  /** Warning shown to user — never imply national representativeness from raw counts. */
  representativenessWarning: string;
  minimumParticipationMet: boolean;
}

export interface ProposedClause {
  id: string;
  number: string;
  text: string;
  children: ProposedClause[];
}

export interface LegalReview {
  id: string;
  articleId: string;
  reviewerId: string;
  reviewerName: string;
  status: LegalReviewStatus;
  notes: string;
  risks: string[];
  reviewedAt: string;
}

export interface ApprovalDecision {
  id: string;
  articleId: string;
  decidedBy: string;
  decidedAt: string;
  decision: 'approved' | 'rejected' | 'returned';
  rationale: string;
}

export interface DraftChange {
  id: string;
  versionId: string;
  kind: 'added' | 'removed' | 'modified' | 'moved' | 'renumbered';
  articleId: string;
  description: string;
  actorId: string;
  actorName: string;
  at: string;
}

export interface DraftVersion {
  id: string;
  constitutionId: string;
  name: string;          // e.g. "Rasimu 0.1"
  versionNumber: string;
  publishedAt: string | null;
  status: 'draft' | 'in_review' | 'published' | 'archived';
  totalChapters: number;
  totalArticles: number;
  awaitingLegalReview: number;
  approved: number;
  disputed: number;
  participationCount: number;
  regionalCoverage: number;
  lastUpdate: string;
  changeLog: DraftChange[];
  immutable: boolean;
}

export interface ProposedArticle {
  id: string;
  draftId: string;
  chapterId: string;
  proposedArticleNumber: string;
  proposedTitle: LocalizedProposalText;
  proposedText: LocalizedProposalText;
  clauses: ProposedClause[];
  plainLanguageSummary: LocalizedProposalText;
  rationale: LocalizedProposalText;
  sourceArticleIds: string[];
  relatedCurrentArticles: string[];
  supportingSuggestionIds: string[];
  opposingSuggestionIds: string[];
  discussionIds: string[];
  pollIds: string[];
  supportPercentage: number;
  oppositionPercentage: number;
  abstentionPercentage: number;
  verifiedParticipantCount: number;
  regionalCoverage: number;
  generatedBy: GenerationMethod;
  generatedAt: string;
  generationModel: string | null;
  generationPromptVersion: string | null;
  status: ProposalStatus;
  legalReviewStatus: LegalReviewStatus;
  legalReviewerNotes: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
  sources: ProposalSource[];
  representation: RepresentationSummary | null;
  legalReviews: LegalReview[];
}

export interface ProposedChapter {
  id: string;
  constitutionId: string;
  number: string;
  title: LocalizedProposalText;
  order: number;
  articleIds: string[];
  status: ChapterProposalStatus;
}

export interface ProposedConstitution {
  id: string;
  name: LocalizedProposalText;
  description: LocalizedProposalText;
  createdAt: string;
  updatedAt: string;
  currentDraftId: string;
  draftIds: string[];
}

export type LocalizedProposalText = Partial<Record<LibraryLanguage, string>>;

export interface GenerationRun {
  id: string;
  articleId: string;
  method: GenerationMethod;
  model: string | null;
  promptVersion: string | null;
  generatedAt: string;
  sourceIds: string[];
  unresolvedConflicts: string[];
  minorityPositionSummary: string;
  legalRisks: string[];
  approved: boolean;
}

export interface ProposalCluster {
  id: string;
  topic: string;
  summary: string;
  supportingSubmissions: string[];
  opposingSubmissions: string[];
  neutralSubmissions: string[];
  totalParticipants: number;
  verifiedParticipantCount: number;
  regionDistribution: Partial<Record<TanzaniaRegion, number>>;
  duplicateCount: number;
  moderationExclusions: number;
  pollIds: string[];
  confidence: number;
  dataLimitations: string[];
  proposedArticleId: string | null;
}

export const PROPOSAL_DISCLAIMER =
  'Hii ni rasimu inayotokana na maoni na mijadala ya watumiaji. Si Katiba rasmi wala ushauri wa kisheria. ' +
  'Maudhui yanahitaji mapitio ya wataalamu, uthibitishaji wa uwakilishi na mchakato halali wa kikatiba.';

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, { sw: string; en: string }> = {
  citizen_proposal:       { sw: 'Pendekezo la Mwananchi',                  en: 'Citizen proposal' },
  merged_proposal:        { sw: 'Pendekezo Lililounganishwa',              en: 'Merged proposal' },
  system_draft:           { sw: 'Rasimu Iliyotengenezwa na Mfumo',         en: 'System-generated draft' },
  under_discussion:       { sw: 'Inajadiliwa',                              en: 'Under discussion' },
  awaiting_legal_review:  { sw: 'Inasubiri Mapitio ya Kisheria',          en: 'Awaiting legal review' },
  legally_reviewed:       { sw: 'Imepitiwa na Mtaalamu',                   en: 'Legally reviewed' },
  approved_for_draft:     { sw: 'Imeidhinishwa kwa Kuingizwa kwenye Rasimu', en: 'Approved for draft inclusion' },
  rejected:               { sw: 'Imekataliwa',                             en: 'Rejected' },
  withdrawn:              { sw: 'Imeondolewa',                              en: 'Withdrawn' },
};

export const CHAPTER_STATUS_LABELS: Record<ChapterProposalStatus, { sw: string; en: string }> = {
  approved:                    { sw: 'Imeidhinishwa',                en: 'Approved' },
  under_discussion:            { sw: 'Inajadiliwa',                  en: 'Under discussion' },
  awaiting_legal_review:       { sw: 'Inasubiri Mapitio ya Kisheria', en: 'Awaiting legal review' },
  disputed:                    { sw: 'Inakosolewa',                  en: 'Disputed' },
  insufficient_participation:  { sw: 'Ushiriki Hauatoshelezi',       en: 'Insufficient participation' },
};
