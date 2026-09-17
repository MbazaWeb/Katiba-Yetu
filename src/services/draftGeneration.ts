/**
 * Draft generation service — Katiba Inayopendekezwa.
 *
 * Governance rule: the system may generate proposed wording, but it must never
 * present AI-generated text as an official constitution. Every generated item
 * is labelled with a ProposalStatus.
 *
 * When no AI backend exists, a deterministic mock generation service is used
 * behind the same interface. The mock NEVER generates constitutional wording
 * — it only re-frames clearly-labelled citizen input as a draft.
 */

import type {
  ProposedArticle,
  ProposedConstitution,
  ProposedChapter,
  DraftVersion,
  ProposalCluster,
  GenerationRun,
  ApprovalDecision,
  ProposalSource,
  RepresentationSummary,
  ProposalStatus,
} from '../types';
import { PROPOSAL_DISCLAIMER } from '../types';

export interface DraftGenerationInput {
  draftId: string;
  chapterId: string;
  proposedArticleNumber: string;
  proposedTitle: { sw?: string; en?: string };
  topic: string;
  problem: string;
  proposedWording: { sw?: string; en?: string };
  rationale: { sw?: string; en?: string };
  sourceArticleIds: string[];
  relatedCurrentArticles: string[];
  sources: ProposalSource[];
  pollResults: { support: number; oppose: number; abstain: number };
  representation: RepresentationSummary | null;
}

export interface DraftGenerationResult {
  article: ProposedArticle;
  run: GenerationRun;
  warnings: string[];
}

export interface DraftGenerationService {
  generate(input: DraftGenerationInput): Promise<DraftGenerationResult>;
  regenerate(articleId: string): Promise<DraftGenerationResult>;
  method: 'manual' | 'mock_deterministic' | 'ai_backend';
}

/**
 * Mock implementation — deterministic, transparent, never invents official
 * constitutional wording. It re-frames the citizen input and labels it
 * clearly as a system draft.
 */
export const draftGenerationService: DraftGenerationService = {
  method: 'mock_deterministic',

  async generate(input) {
    const now = new Date().toISOString();
    const id = `pa-${now}-${Math.random().toString(36).slice(2, 8)}`;
    const warnings: string[] = [];
    if (input.sources.length < 3) warnings.push('Idadi ya vyanzo ni chini ya 3. Ushiriki hauatoshelezi kwa rasimu yenye uzito. / Fewer than 3 sources — participation is insufficient for a weighted draft.');
    if (!input.representation || input.representation.verifiedParticipants < 5) warnings.push('Washiriki waliouthibitishwa ni chini ya 5. Onyo la uwakilishi. / Fewer than 5 verified participants — representation warning.');
    if (input.pollResults.support < 50) warnings.push('Msaada wa kura ni chini ya 50%. Inahitaji majadiliko zaidi. / Poll support below 50% — needs more deliberation.');
    if (input.representation && !input.representation.minimumParticipationMet) warnings.push('Ushiriki wa chini unahitajika. / Minimum participation not met.');

    const article: ProposedArticle = {
      id,
      draftId: input.draftId,
      chapterId: input.chapterId,
      proposedArticleNumber: input.proposedArticleNumber,
      proposedTitle: input.proposedTitle,
      proposedText: input.proposedWording,
      clauses: [],
      plainLanguageSummary: {
        sw: input.representation
          ? `Muhtasari wa lugha rahisi wa pendekezo la "${input.topic}". Washiriki ${input.representation.verifiedParticipants} waliouthibitishwa.`
          : `Muhtasari wa lugha rahisi wa pendekezo la "${input.topic}".`,
        en: input.representation
          ? `Plain-language summary of the proposal on "${input.topic}". ${input.representation.verifiedParticipants} verified participants.`
          : `Plain-language summary of the proposal on "${input.topic}".`,
      },
      rationale: input.rationale,
      sourceArticleIds: input.sourceArticleIds,
      relatedCurrentArticles: input.relatedCurrentArticles,
      supportingSuggestionIds: input.sources.filter(s => s.stance === 'support').map(s => s.suggestionId),
      opposingSuggestionIds: input.sources.filter(s => s.stance === 'oppose').map(s => s.suggestionId),
      discussionIds: input.sources.filter(s => s.discussionId).map(s => s.discussionId!),
      pollIds: input.sources.filter(s => s.pollId).map(s => s.pollId!),
      supportPercentage: input.pollResults.support,
      oppositionPercentage: input.pollResults.oppose,
      abstentionPercentage: input.pollResults.abstain,
      verifiedParticipantCount: input.representation?.verifiedParticipants ?? 0,
      regionalCoverage: input.representation ? Object.keys(input.representation.regionDistribution).length : 0,
      generatedBy: 'mock_deterministic',
      generatedAt: now,
      generationModel: null,
      generationPromptVersion: 'mock-v1',
      status: 'system_draft',
      legalReviewStatus: 'not_required',
      legalReviewerNotes: null,
      createdAt: now,
      updatedAt: now,
      version: 1,
      sources: input.sources,
      representation: input.representation,
      legalReviews: [],
    };

    const run: GenerationRun = {
      id: `run-${id}`,
      articleId: id,
      method: 'mock_deterministic',
      model: null,
      promptVersion: 'mock-v1',
      generatedAt: now,
      sourceIds: input.sources.map(s => s.suggestionId),
      unresolvedConflicts: warnings,
      minorityPositionSummary: input.sources.filter(s => s.stance === 'oppose').map(s => s.excerpt).join(' | ') || 'Hakuna maoni ya upinzani yaliyoingizwa. / No opposing views recorded.',
      legalRisks: [
        'Lugha inayopendekezwa inahitaji mapitio ya kisheria kabla ya kuingizwa kwenye rasimu rasmi. / Proposed wording requires legal review before inclusion in an official draft.',
      ],
      approved: false,
    };

    return { article, run, warnings };
  },

  async regenerate(articleId) {
    // For the mock, regenerate returns a fresh article with a new id.
    // In a real backend, this would call the model again without deleting earlier versions.
    throw new Error(`Regenerate not yet supported in the mock service for article ${articleId}. Implement when AI backend is connected.`);
  },
};

export { PROPOSAL_DISCLAIMER };

export type { ProposalStatus };
export type { ProposedArticle, ProposedConstitution, ProposedChapter, DraftVersion, ProposalCluster, GenerationRun, ApprovalDecision };
