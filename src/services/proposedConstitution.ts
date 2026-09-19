/**
 * Katiba Inayopendekezwa — proposed constitution repository.
 *
 * Phase 1 scaffolding: types, mock services, dashboard, proposal workspace,
 * comparison view, version history, and navigation.
 *
 * Phase 2 (submission flow, discussions, poll stages, draft builder,
 * approval workflow) and Phase 3 (real backend, AI integration, identity
 * verification, moderation, PDF generation) are scaffolded via interfaces.
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
  RepresentationSummary,
} from '../types';
import { PROPOSAL_DISCLAIMER } from '../types';
import { draftGenerationService } from './draftGeneration';
import type { DraftGenerationInput } from './draftGeneration';

// ─── Mock data ────────────────────────────────────────────────────────────────

export const mockProposedConstitution: ProposedConstitution = {
  id: 'pc-1',
  name: { sw: 'Rasimu ya Wananchi ya Katiba', en: 'Citizens Draft Constitution' },
  description: {
    sw: 'Rasimu inayotokana na maoni na mijadala ya watumiaji. Si Katiba rasmi wala ushauri wa kisheria.',
    en: 'A draft generated from user contributions and discussions. Not an official constitution or legal advice.',
  },
  createdAt: '2026-09-01T00:00:00Z',
  updatedAt: '2026-09-17T12:00:00Z',
  currentDraftId: 'dv-0-2',
  draftIds: ['dv-0-1', 'dv-0-2'],
};

export const mockChapters: ProposedChapter[] = [
  {
    id: 'pc-ch1',
    constitutionId: 'pc-1',
    number: '1',
    title: { sw: 'Jamhuri na Watu', en: 'The Republic and the People' },
    order: 1,
    articleIds: ['pa-1'],
    status: 'approved',
  },
  {
    id: 'pc-ch3',
    constitutionId: 'pc-1',
    number: '3',
    title: { sw: 'Haki za Msingi na Wajibu', en: 'Fundamental Rights and Duties' },
    order: 3,
    articleIds: ['pa-2', 'pa-3'],
    status: 'under_discussion',
  },
];

const mockRepresentation: RepresentationSummary = {
  totalParticipants: 142,
  verifiedParticipants: 47,
  regionDistribution: { dar_es_salaam: 38, dodoma: 21, mwanza: 18, arusha: 14, mbeya: 10, zanzibar_west: 8 },
  verificationTierDistribution: { phone: 31, email: 12, nida: 4 },
  representativenessWarning:
    'Washiriki 142 na 47 waliouthibitishwa hawawakilishi wanananchi wote wa Tanzania. Rasimu hii inahitaji uthibitishaji zaidi wa uwakilishi. ' +
    '142 participants and 47 verified do not represent all Tanzanians. This draft requires further representativeness verification.',
  minimumParticipationMet: false,
};

export const mockArticles: ProposedArticle[] = [
  {
    id: 'pa-1',
    draftId: 'dv-0-2',
    chapterId: 'pc-ch1',
    proposedArticleNumber: '1',
    proposedTitle: {
      sw: 'Utangulizi wa Jamhuri',
      en: 'Declaration of the Republic',
    },
    proposedText: {
      sw: '[Pendekezo lililounganishwa] Jamhuri ya Muungano wa Tanzania ni dola inayojitegemea inayojengwa juu ya misingi ya utu, haki na uwajibikaji.',
      en: '[Merged proposal] The United Republic of Tanzania is a sovereign state founded on human dignity, rights and accountability.',
    },
    clauses: [],
    plainLanguageSummary: {
      sw: 'Ibara hii inathibitisha kuwa Tanzania ni nchi huru inayojali utu na haki za watu wake.',
      en: 'This article affirms that Tanzania is a free nation that values human dignity and the rights of its people.',
    },
    rationale: {
      sw: 'Washiriki 18 walipendekeza kuimarisha utu na uwajibikaji katika utangulizi wa Jamhuri.',
      en: '18 participants proposed strengthening dignity and accountability in the declaration of the Republic.',
    },
    sourceArticleIds: ['union-1'],
    relatedCurrentArticles: ['union-1'],
    supportingSuggestionIds: ['sg-1', 'sg-2', 'sg-3'],
    opposingSuggestionIds: ['sg-4'],
    discussionIds: ['thread-seed-1'],
    pollIds: ['poll-stage-1'],
    supportPercentage: 72,
    oppositionPercentage: 18,
    abstentionPercentage: 10,
    verifiedParticipantCount: 31,
    regionalCoverage: 6,
    generatedBy: 'mock_deterministic',
    generatedAt: '2026-09-10T10:00:00Z',
    generationModel: null,
    generationPromptVersion: 'mock-v1',
    status: 'approved_for_draft',
    legalReviewStatus: 'approved',
    legalReviewerNotes: 'Lugha imepitishwa kwa mapitio ya kisheria. Inasubiri kuingizwa kwenye rasimu inayofuata.',
    createdAt: '2026-09-08T10:00:00Z',
    updatedAt: '2026-09-15T14:00:00Z',
    version: 2,
    sources: [
      { suggestionId: 'sg-1', stance: 'support', excerpt: 'Tuongeze uwajibikaji katika utangulizi.', contributorVerified: true, contributorRegion: 'dar_es_salaam' },
      { suggestionId: 'sg-2', stance: 'support', excerpt: 'UtU ni msingi wa dola yetu.', contributorVerified: false, contributorRegion: 'dodoma' },
      { suggestionId: 'sg-3', stance: 'support', excerpt: 'Haki na utu vinapaswa kuonekana mwanzoni.', contributorVerified: true, contributorRegion: 'mwanza' },
      { suggestionId: 'sg-4', stance: 'oppose', excerpt: 'Lugha ya sasa inatosha; tunahitaji mabadiliko makubwa zaidi.', contributorVerified: true, contributorRegion: 'arusha' },
    ],
    representation: mockRepresentation,
    legalReviews: [
      { id: 'lr-1', articleId: 'pa-1', reviewerId: 'expert-1', reviewerName: 'Mtaalamu wa Sheria (mfano)', status: 'approved', notes: 'Lugha ni wazi na inakidhi misingi ya kisheria.', risks: [], reviewedAt: '2026-09-14T12:00:00Z' },
    ],
  },
  {
    id: 'pa-2',
    draftId: 'dv-0-2',
    chapterId: 'pc-ch3',
    proposedArticleNumber: '12',
    proposedTitle: {
      sw: 'Haki ya Maoni',
      en: 'Freedom of Expression',
    },
    proposedText: {
      sw: '[Pendekezo lililounganishwa] Kila mtu ana haki ya kutoa na kupokea maoni bila ya woga, isipokuwa kama inavyoelezwa kisheria kwa ajili ya haki za wengine na usalama wa taifa.',
      en: '[Merged proposal] Everyone has the right to express and receive opinions without fear, except as provided by law for the rights of others and national security.',
    },
    clauses: [],
    plainLanguageSummary: {
      sw: 'Ibara hii inalinda uhuru wa kutoa maoni huku ikizingatia haki za wengine na usalama wa taifa.',
      en: 'This article protects freedom of expression while considering the rights of others and national security.',
    },
    rationale: {
      sw: 'Washiriki 26 walipendekeza kufafanua mipaka ya uhuru wa maoni kwa uwazi zaidi.',
      en: '26 participants proposed clarifying the limits of freedom of expression more clearly.',
    },
    sourceArticleIds: ['union-18'],
    relatedCurrentArticles: ['union-18'],
    supportingSuggestionIds: ['sg-5', 'sg-6'],
    opposingSuggestionIds: [],
    discussionIds: ['thread-seed-2'],
    pollIds: ['poll-stage-2'],
    supportPercentage: 64,
    oppositionPercentage: 22,
    abstentionPercentage: 14,
    verifiedParticipantCount: 19,
    regionalCoverage: 4,
    generatedBy: 'mock_deterministic',
    generatedAt: '2026-09-12T10:00:00Z',
    generationModel: null,
    generationPromptVersion: 'mock-v1',
    status: 'awaiting_legal_review',
    legalReviewStatus: 'pending',
    legalReviewerNotes: null,
    createdAt: '2026-09-10T10:00:00Z',
    updatedAt: '2026-09-16T09:00:00Z',
    version: 1,
    sources: [
      { suggestionId: 'sg-5', stance: 'support', excerpt: 'Mipaka ya uhuru wa maoni iwe wazi zaidi.', contributorVerified: true, contributorRegion: 'dar_es_salaam' },
      { suggestionId: 'sg-6', stance: 'alternative', excerpt: 'Tuzingatie haki za wengine pia.', contributorVerified: false, contributorRegion: 'mbeya' },
    ],
    representation: mockRepresentation,
    legalReviews: [],
  },
  {
    id: 'pa-3',
    draftId: 'dv-0-2',
    chapterId: 'pc-ch3',
    proposedArticleNumber: '14',
    proposedTitle: {
      sw: 'Usawa wa Kijinsia',
      en: 'Gender Equality',
    },
    proposedText: {
      sw: '[Pendekezo lililounganishwa] Wanaume na wanawake wana haki sawa mbele ya sheria, na wanapaswa kupewa fursa sawa katika siasa, uchumi na maisha ya kijamii.',
      en: '[Merged proposal] Men and women have equal rights before the law and should be afforded equal opportunities in politics, the economy and social life.',
    },
    clauses: [],
    plainLanguageSummary: {
      sw: 'Ibara hii inathibitisha usawa kamili wa kijinsia mbele ya sheria na katika maisha ya kijamii.',
      en: 'This article affirms full gender equality before the law and in social life.',
    },
    rationale: {
      sw: 'Washiriki 31 walipendekeza kuongeza uwazi kuhusu usawa wa kijinsia.',
      en: '31 participants proposed strengthening language on gender equality.',
    },
    sourceArticleIds: ['union-12'],
    relatedCurrentArticles: ['union-12', 'zanzibar-19'],
    supportingSuggestionIds: ['sg-7', 'sg-8'],
    opposingSuggestionIds: [],
    discussionIds: ['thread-seed-3'],
    pollIds: ['poll-stage-3'],
    supportPercentage: 81,
    oppositionPercentage: 12,
    abstentionPercentage: 7,
    verifiedParticipantCount: 22,
    regionalCoverage: 5,
    generatedBy: 'mock_deterministic',
    generatedAt: '2026-09-13T10:00:00Z',
    generationModel: null,
    generationPromptVersion: 'mock-v1',
    status: 'legally_reviewed',
    legalReviewStatus: 'approved',
    legalReviewerNotes: 'Inapendekezwa kwa ajili ya kuingizwa kwenye rasimu inayofuata.',
    createdAt: '2026-09-11T10:00:00Z',
    updatedAt: '2026-09-16T15:00:00Z',
    version: 1,
    sources: [
      { suggestionId: 'sg-7', stance: 'support', excerpt: 'Usawa wa kijinsia uwe wazi zaidi.', contributorVerified: true, contributorRegion: 'dar_es_salaam' },
      { suggestionId: 'sg-8', stance: 'support', excerpt: 'Fursa sawa katika siasa na uchumi.', contributorVerified: false, contributorRegion: 'mwanza' },
    ],
    representation: mockRepresentation,
    legalReviews: [
      { id: 'lr-2', articleId: 'pa-3', reviewerId: 'expert-2', reviewerName: 'Mtaalamu wa Sheria (mfano)', status: 'approved', notes: 'Lugha ni sahihi na inazingatia mifumo ya kimataifa.', risks: [], reviewedAt: '2026-09-15T12:00:00Z' },
    ],
  },
];

export const mockVersions: DraftVersion[] = [
  {
    id: 'dv-0-1',
    constitutionId: 'pc-1',
    name: 'Rasimu 0.1',
    versionNumber: '0.1',
    publishedAt: '2026-09-05T12:00:00Z',
    status: 'published',
    totalChapters: 1,
    totalArticles: 1,
    awaitingLegalReview: 0,
    approved: 1,
    disputed: 0,
    participationCount: 64,
    regionalCoverage: 3,
    lastUpdate: '2026-09-05T12:00:00Z',
    changeLog: [
      { id: 'dc-1', versionId: 'dv-0-1', kind: 'added', articleId: 'pa-1', description: 'Ibara ya 1 imeongezwa kwa ajili ya utangulizi wa Jamhuri.', actorId: 'committee-1', actorName: 'Kamati ya Rasimu', at: '2026-09-05T12:00:00Z' },
    ],
    immutable: true,
  },
  {
    id: 'dv-0-2',
    constitutionId: 'pc-1',
    name: 'Rasimu 0.2',
    versionNumber: '0.2',
    publishedAt: null,
    status: 'draft',
    totalChapters: 2,
    totalArticles: 3,
    awaitingLegalReview: 1,
    approved: 2,
    disputed: 0,
    participationCount: 142,
    regionalCoverage: 6,
    lastUpdate: '2026-09-17T12:00:00Z',
    changeLog: [
      { id: 'dc-2', versionId: 'dv-0-2', kind: 'added', articleId: 'pa-2', description: 'Ibara ya 12 imeongezwa — Haki ya Maoni.', actorId: 'committee-1', actorName: 'Kamati ya Rasimu', at: '2026-09-12T10:00:00Z' },
      { id: 'dc-3', versionId: 'dv-0-2', kind: 'added', articleId: 'pa-3', description: 'Ibara ya 14 imeongezwa — Usawa wa Kijinsia.', actorId: 'committee-1', actorName: 'Kamati ya Rasimu', at: '2026-09-13T10:00:00Z' },
      { id: 'dc-4', versionId: 'dv-0-2', kind: 'modified', articleId: 'pa-1', description: 'Lugha ya utangulizi imeboreshwa kufunga zaidi.', actorId: 'expert-1', actorName: 'Mtaalamu wa Sheria', at: '2026-09-14T12:00:00Z' },
    ],
    immutable: false,
  },
];

const mockClusters: ProposalCluster[] = [
  {
    id: 'cluster-1',
    topic: 'Utangulizi wa Jamhuri',
    summary: 'Tunalugha ya utu na uwajibikaji katika utangulizi wa Jamhuri.',
    supportingSubmissions: ['sg-1', 'sg-2', 'sg-3'],
    opposingSubmissions: ['sg-4'],
    neutralSubmissions: [],
    totalParticipants: 18,
    verifiedParticipantCount: 11,
    regionDistribution: { dar_es_salaam: 8, dodoma: 4, mwanza: 3, arusha: 3 },
    duplicateCount: 2,
    moderationExclusions: 0,
    pollIds: ['poll-stage-1'],
    confidence: 0.72,
    dataLimitations: ['Idadi ya washiriki inasubiri kuongezeka.', 'Region 4 tu zimewakilishwa.'],
    proposedArticleId: 'pa-1',
  },
  {
    id: 'cluster-2',
    topic: 'Uhuru wa Maoni',
    summary: 'Mipaka ya uhuru wa maoni ielezwe kwa uwazi.',
    supportingSubmissions: ['sg-5', 'sg-6'],
    opposingSubmissions: [],
    neutralSubmissions: [],
    totalParticipants: 26,
    verifiedParticipantCount: 14,
    regionDistribution: { dar_es_salaam: 12, mbeya: 5, mwanza: 5, arusha: 4 },
    duplicateCount: 1,
    moderationExclusions: 1,
    pollIds: ['poll-stage-2'],
    confidence: 0.64,
    dataLimitations: ['Washiriki waliouthibitishwa ni chini ya 50.'],
    proposedArticleId: 'pa-2',
  },
];

// ─── Repository API ───────────────────────────────────────────────────────────

export function getProposedConstitution(): ProposedConstitution {
  return mockProposedConstitution;
}

export function getProposedChapters(): ProposedChapter[] {
  return mockChapters.slice().sort((a, b) => a.order - b.order);
}

export function getProposedArticles(): ProposedArticle[] {
  return mockArticles;
}

export function getProposedArticle(id: string): ProposedArticle | undefined {
  return mockArticles.find(a => a.id === id);
}

export function getDraftVersions(): DraftVersion[] {
  return mockVersions.slice().sort((a, b) => b.versionNumber.localeCompare(a.versionNumber, undefined, { numeric: true }));
}

export function getCurrentDraftVersion(): DraftVersion {
  const current = mockVersions.find(v => v.id === mockProposedConstitution.currentDraftId);
  if (!current) throw new Error('Current draft not found');
  return current;
}

export function getDraftVersion(id: string): DraftVersion | undefined {
  return mockVersions.find(v => v.id === id);
}

export function getClusters(): ProposalCluster[] {
  return mockClusters;
}

export function getCluster(id: string): ProposalCluster | undefined {
  return mockClusters.find(c => c.id === id);
}

export function getParticipationSummary() {
  return {
    totalSuggestions: 87,
    discussionsIncluded: 12,
    pollResponses: 142,
    verifiedContributors: 47,
    representedRegions: 6,
    excludedOrFlaggedSubmissions: 3,
    unresolvedConstitutionalTopics: 2,
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
  // Lazy import to avoid a circular dependency at module-init time.
  const { getAIGenerationBackend } = await import('./backend');
  const backend = getAIGenerationBackend();
  // The backend's AIGenerationInput shape is richer than DraftGenerationInput
  // (it expects moderatedProposals, discussionSummaries, etc.). For the mock
  // adapter, we pass through directly. For the HTTP adapter, the caller should
  // construct the full AIGenerationInput. Here we bridge by wrapping the
  // simpler DraftGenerationInput into the shape the backend expects.
  if (backend.kind === 'mock_deterministic') {
    return draftGenerationService.generate(input);
  }
  // HTTP / real AI backend — delegate to the backend with a minimal input.
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
  // Simple word-level diff. Real implementation uses Myers diff or similar.
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

export function getDraftChanges(versionId: string): DraftChange[] {
  const v = mockVersions.find(v => v.id === versionId);
  return v ? v.changeLog : [];
}

export function getApprovalDecisions(articleId: string): ApprovalDecision[] {
  // Mock — Phase 2 will persist real approval decisions.
  if (articleId === 'pa-1') {
    return [
      { id: 'ad-1', articleId: 'pa-1', decidedBy: 'committee-1', decidedAt: '2026-09-15T14:00:00Z', decision: 'approved', rationale: 'Imepata msaada wa 72% na mapitio ya kisheria.' },
    ];
  }
  return [];
}

export { PROPOSAL_DISCLAIMER };
