/**
 * Katiba Yetu — Additional library types: audio, history, resources, amendments,
 * discussion forum, polls with stages, and auth/session.
 */

import type { LibraryLanguage } from './constitution';
import type { TanzaniaRegion, VerificationTier } from './index';

// ─── Constitution Source (full) ──────────────────────────────────────────────

export interface ConstitutionSource {
  officialSource: string;
  sourceUrl: string | null;
  documentVersion: string;
  amendmentDate: string | null;
  verificationStatus: 'unavailable' | 'pending' | 'verified';
  verifiedBy: string | null;
  verifiedAt: string | null;
  sourceLocator: string | null;
  checksum: string | null;
  sourcePage: number | null;
  sourceFile: string | null;
}

// ─── Constitution Amendment ──────────────────────────────────────────────────

export interface ConstitutionAmendment {
  id: string;
  documentId: string;
  amendmentNumber: string;
  title: string;
  date: string;
  description: string;
  affectedArticleIds: string[];
  sourceUrl: string | null;
  verificationStatus: 'unavailable' | 'pending' | 'verified';
}

// ─── Article Audio (Katiba kwa Sauti) ────────────────────────────────────────

export interface ArticleAudio {
  articleId: string;
  language: LibraryLanguage;
  /** Voice URI for pre-recorded audio. null means use device TTS. */
  audioUri: string | null;
  durationSeconds: number | null;
  generatedBy: 'device_tts' | 'studio' | null;
  verificationStatus: 'unavailable' | 'pending' | 'verified';
  generatedAt: string | null;
}

// ─── Constitutional History Timeline ─────────────────────────────────────────

export interface HistoryEntry {
  id: string;
  year: number;
  title: string;
  description: string;
  documentId?: string;
  amendmentId?: string;
  sourceReference: string;
  verificationStatus: 'unavailable' | 'pending' | 'verified';
  category: 'independence' | 'union' | 'zanzibar_revolution' | 'amendment' | 'review_process' | 'draft' | 'other';
}

// ─── Resource Library ────────────────────────────────────────────────────────

export type ResourceCategory =
  | 'original_constitution'
  | 'amendment'
  | 'draft_constitution'
  | 'report'
  | 'educational'
  | 'judgment'
  | 'other';

export type ResourceFileType = 'pdf' | 'docx' | 'txt' | 'html' | 'image' | 'audio' | 'other';

export interface ResourceEntry {
  id: string;
  title: string;
  description: string;
  category: ResourceCategory;
  fileType: ResourceFileType;
  year: number;
  language: LibraryLanguage | 'both';
  documentId?: string;
  url: string | null;
  localPath: string | null;
  fileSize: number | null;
  verificationStatus: 'unavailable' | 'pending' | 'verified';
  registeredAt: string;
}

// ─── Discussion Forum ─────────────────────────────────────────────────────────

export type DiscussionCategory =
  | 'historia'
  | 'mjadala_wa_jumla'
  | 'tafsiri_ya_kisheria'
  | 'maboresho_ya_katiba'
  | 'haki_na_wajibu'
  | 'muungano'
  | 'serikali_na_taasisi'
  | 'rasilimali_za_elimu';

export const DISCUSSION_CATEGORIES: { key: DiscussionCategory; sw: string; en: string }[] = [
  { key: 'historia',               sw: 'Historia ya Katiba',       en: 'Constitutional History' },
  { key: 'mjadala_wa_jumla',       sw: 'Mjadala wa Jumla',         en: 'General Discussion' },
  { key: 'tafsiri_ya_kisheria',    sw: 'Tafsiri ya Kisheria',      en: 'Legal Interpretation' },
  { key: 'maboresho_ya_katiba',    sw: 'Maboresho ya Katiba',      en: 'Constitutional Reform' },
  { key: 'haki_na_wajibu',         sw: 'Haki na Wajibu',           en: 'Rights and Duties' },
  { key: 'muungano',               sw: 'Muungano',                 en: 'Union Matters' },
  { key: 'serikali_na_taasisi',    sw: 'Serikali na Taasisi',      en: 'Government and Institutions' },
  { key: 'rasilimali_za_elimu',   sw: 'Rasilimali za Elimu',       en: 'Educational Resources' },
];

export interface ForumThread {
  id: string;
  category: DiscussionCategory;
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  authorVerified: boolean;
  isAnonymous: boolean;
  articleId?: string;
  createdAt: string;
  lastActivityAt: string;
  replyCount: number;
  upvotes: number;
  hasAcceptedAnswer: boolean;
  isAnswered: boolean;
  isPinned: boolean;
  moderationStatus: 'active' | 'reported' | 'hidden' | 'removed';
  subscriberIds: string[];
  tagIds: string[];
}

export interface ForumReply {
  id: string;
  threadId: string;
  parentId?: string;
  body: string;
  authorId: string;
  authorName: string;
  authorVerified: boolean;
  isAnonymous: boolean;
  stance?: 'support' | 'oppose' | 'alternative' | 'expert' | 'neutral';
  isExpertContribution: boolean;
  createdAt: string;
  upvotes: number;
  moderationStatus: 'active' | 'reported' | 'hidden' | 'removed';
  attachmentUrl?: string;
  children?: ForumReply[];
}

// ─── Poll stages (multi-stage polling for proposed articles) ─────────────────

export type PollStage =
  | 'problem_confirmation'
  | 'policy_direction'
  | 'article_wording'
  | 'approval_for_draft';

export const POLL_STAGE_LABELS: Record<PollStage, { sw: string; en: string }> = {
  problem_confirmation:  { sw: 'Uthibitisho wa Tatizo',     en: 'Problem Confirmation' },
  policy_direction:      { sw: 'Mwelekeo wa Sera',           en: 'Policy Direction' },
  article_wording:       { sw: 'Ufupisho wa Ibara',          en: 'Article Wording' },
  approval_for_draft:    { sw: 'Idhini ya Rasimu',            en: 'Approval for Draft' },
};

export interface PollStageResult {
  pollId: string;
  stage: PollStage;
  totalVotes: number;
  verifiedVotes: number;
  abstentions: number;
  regionDistribution: Partial<Record<TanzaniaRegion, number>>;
  verificationTierDistribution: Partial<Record<VerificationTier, number>>;
  opensAt: string;
  closesAt: string;
  minimumParticipation: number;
  representativenessWarning: string;
  options: { id: string; label: string; votes: number; percentage: number }[];
}

// ─── Auth / Session ──────────────────────────────────────────────────────────

export type ProposedUserRole =
  | 'citizen'
  | 'verified_citizen'
  | 'legal_expert'
  | 'moderator'
  | 'drafting_committee'
  | 'administrator';

export const PROPOSED_USER_ROLE_LABELS: Record<ProposedUserRole, { sw: string; en: string }> = {
  citizen:              { sw: 'Mwananchi',                    en: 'Citizen' },
  verified_citizen:     { sw: 'Raia Aliyethibitishwa',         en: 'Verified Citizen' },
  legal_expert:         { sw: 'Mtaalamu wa Sheria',            en: 'Legal Expert' },
  moderator:            { sw: 'Msimamizi wa Yaliyomo',        en: 'Moderator' },
  drafting_committee:   { sw: 'Kamati ya Rasimu',              en: 'Drafting Committee' },
  administrator:        { sw: 'Msimamizi Mkuu',               en: 'Administrator' },
};

export interface AuthSession {
  userId: string;
  displayName: string;
  email?: string;
  phone?: string;
  role: ProposedUserRole;
  stakeholderType?: import('./index').StakeholderType;
  verificationTier: VerificationTier;
  region?: TanzaniaRegion;
  district?: string;
  languagePref: LibraryLanguage;
  signedInAt: string;
  /** Demo only — no real credentials are stored. */
  isDemo: boolean;
}

export interface AuthCredentials {
  identifier: string;  // email or phone
  password: string;
}

export interface RegistrationInput {
  displayName: string;
  email?: string;
  phone?: string;
  password: string;
  region?: TanzaniaRegion;
  district?: string;
  stakeholderType: import('./index').StakeholderType;
  languagePref: LibraryLanguage;
  anonymous: boolean;
}
