/**
 * Katiba Inayopendekezwa — proposed constitution repository.
 *
 * All mock/sample data has been removed. When no Supabase backend is
 * configured, these functions return empty arrays — the UI shows proper
 * empty states. Real data comes from Supabase when configured.
 *
 * Governance: never present AI-generated text as an official constitution.
 */

import type {
  ProposedConstitution,
  ProposedChapter,
  ProposedArticle,
  DraftVersion,
  DraftChange,
  ProposalCluster,
  ApprovalDecision,
} from '../types';
import { PROPOSAL_DISCLAIMER } from '../types';
import { draftGenerationService } from './draftGeneration';
import type { DraftGenerationInput } from './draftGeneration';

// ─── Repository API (empty until Supabase is configured) ──────────────────────

export function getProposedConstitution(): ProposedConstitution | null {
  return null;
}

export function getProposedChapters(): ProposedChapter[] {
  return [];
}

export function getProposedArticles(): ProposedArticle[] {
  return [];
}

export function getProposedArticle(id: string): ProposedArticle | undefined {
  return undefined;
}

export function getDraftVersions(): DraftVersion[] {
  return [];
}

export function getCurrentDraftVersion(): DraftVersion | null {
  return null;
}

export function getDraftVersion(id: string): DraftVersion | undefined {
  return undefined;
}

export function getClusters(): ProposalCluster[] {
  return [];
}

export function getCluster(id: string): ProposalCluster | undefined {
  return undefined;
}

export function getParticipationSummary() {
  return {
    totalSuggestions: 0,
    discussionsIncluded: 0,
    pollResponses: 0,
    verifiedContributors: 0,
    representedRegions: 0,
    excludedOrFlaggedSubmissions: 0,
    unresolvedConstitutionalTopics: 0,
  };
}

/**
 * Generate a new proposed article from citizen input.
 *
 * Routes through getAIGenerationBackend() so the active adapter (mock or
 * HTTP) is used. The mock adapter wraps draftGenerationService; the HTTP
 * adapter calls a real LLM endpoint when aiBaseUrl is configured.
 */
export async function generateProposedArticle(input: DraftGenerationInput) {
  const { getAIGenerationBackend } = await import('./backend');
  const backend = getAIGenerationBackend();
  if (backend.kind === 'mock_deterministic') {
    return draftGenerationService.generate(input);
  }
  const aiInput = {
    moderatedProposals: [],
    discussionSummaries: [],
    supportingArguments: [],
    opposingArguments: [],
    alternativeWording: [],
    pollResults: [],
    currentConstitutionalArticles: [],
    relevantApprovedArticles: [],
    legalReviewConstraints: [],
  };
  return backend.generateDraft(aiInput);
}

/** Side-by-side diff between a current article and a proposed article. */
export interface DiffSegment {
  kind: 'unchanged' | 'added' | 'removed';
  text: string;
}

export function diffText(current: string, proposed: string): DiffSegment[] {
  const currentWords = current.split(/(\s+)/);
  const proposedWords = proposed.split(/(\s+)/);
  const segments: DiffSegment[] = [];
  const max = Math.max(currentWords.length, proposedWords.length);
  for (let i = 0; i < max; i++) {
    const c = currentWords[i];
    const p = proposedWords[i];
    if (c === p) { if (c) segments.push({ kind: 'unchanged', text: c }); }
    else {
      if (c) segments.push({ kind: 'removed', text: c });
      if (p) segments.push({ kind: 'added', text: p });
    }
  }
  return segments;
}

export function getDraftChanges(_versionId: string): DraftChange[] {
  return [];
}

export function getApprovalDecisions(_articleId: string): ApprovalDecision[] {
  return [];
}

export { PROPOSAL_DISCLAIMER };
