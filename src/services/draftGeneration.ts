/** Types shared with the configured server-side AI generation service. */
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
  method: 'manual' | 'ai_backend';
}

export { PROPOSAL_DISCLAIMER };
export type { ProposalStatus };
export type { ProposedArticle, ProposedConstitution, ProposedChapter, DraftVersion, ProposalCluster, GenerationRun, ApprovalDecision };
