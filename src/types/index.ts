// ─── Document & Constitution Types ───────────────────────────────────────────

export type DocumentType = 'union' | 'zanzibar' | 'review_act' | 'other';
export type DocumentStatus = 'draft' | 'published' | 'archived';

export * from './constitution';
export * from './library';
export * from './proposed';
export * from './proposedWorkflow';

export type SectionLevel = 'chapter' | 'part' | 'article' | 'clause' | 'subclause';

export interface Section {
  id: string;
  document_id: string;
  parent_id?: string;
  article_number: string;    // e.g. "19", "19(1)", "19(1)(a)"
  title_sw: string;
  title_en: string;
  body_sw: string;
  body_en: string;
  level: SectionLevel;
  order_index: number;
  is_muungano: boolean;
  version: number;
  children?: Section[];
  meta?: {
    discussion_count: number;
    suggestion_count: number;
    poll_count: number;
    is_hot: boolean;
    has_active_poll: boolean;
  };
}

// ─── User & Auth Types ────────────────────────────────────────────────────────

export type VerificationTier = 'none' | 'email' | 'phone' | 'nida';

/**
 * Stakeholder type selected during registration. Determines which navigation
 * items and contribution features the user sees. The `admin` stakeholder is
 * assigned server-side — users cannot self-select it.
 */
export type StakeholderType =
  | 'citizen'
  | 'institution'
  | 'court'
  | 'lawyer'
  | 'ngo'
  | 'ministry'
  | 'media'
  | 'other';

export const STAKEHOLDER_LABELS: Record<StakeholderType, { sw: string; en: string }> = {
  citizen:       { sw: 'Mwananchi',              en: 'Citizen' },
  institution:   { sw: 'Taasisi',                 en: 'Institution' },
  court:         { sw: 'Mahakama',                en: 'Court' },
  lawyer:        { sw: 'Mwanasheria',            en: 'Lawyer' },
  ngo:           { sw: 'Shirika la Kiraia',      en: 'NGO' },
  ministry:      { sw: 'Wizara ya Sheria',       en: 'Ministry of Law' },
  media:         { sw: 'Vyombo vya Habari',      en: 'Media' },
  other:         { sw: 'Wadau Wengine',           en: 'Other Stakeholders' },
};

export type UserRole =
  | 'guest'
  | 'registered'
  | 'verified_citizen'
  | 'moderator'
  | 'admin';

export interface User {
  id: string;
  name?: string;
  display_name: string;
  email?: string;
  phone?: string;
  nida_verified: boolean;
  verification_tier: VerificationTier;
  role: UserRole;
  stakeholder_type?: StakeholderType;
  anonymity_default: boolean;
  region?: TanzaniaRegion;
  district?: string;
  language_pref: 'sw' | 'en';
  avatar_url?: string;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  type: 'taasisi' | 'idara' | 'law_society' | 'academic' | 'ngo';
  verified: boolean;
  region?: TanzaniaRegion;
  logo_url?: string;
  description?: string;
}

// ─── Discussion & Comment Types ───────────────────────────────────────────────

export interface Discussion {
  id: string;
  section_id: string;
  user_id: string;
  user?: Partial<User>;
  org?: Partial<Organization>;
  title: string;
  body: string;
  is_anonymous: boolean;
  upvotes: number;
  reply_count: number;
  is_verified_author: boolean;
  created_at: string;
  status: 'active' | 'reported' | 'removed';
}

export interface Comment {
  id: string;
  discussion_id: string;
  parent_id?: string;
  user_id: string;
  user?: Partial<User>;
  org?: Partial<Organization>;
  body: string;
  is_anonymous: boolean;
  upvotes: number;
  replies?: Comment[];
  is_verified_author: boolean;
  created_at: string;
  status: 'active' | 'reported' | 'removed';
}

// ─── Suggestion Types ─────────────────────────────────────────────────────────

export type SuggestionStatus =
  | 'submitted'
  | 'under_review'
  | 'accepted'
  | 'rejected'
  | 'merged'
  | 'polled';

export interface Suggestion {
  id: string;
  section_id: string;
  user_id: string;
  user?: Partial<User>;
  org?: Partial<Organization>;
  title: string;
  rationale: string;
  proposed_text_sw: string;
  proposed_text_en: string;
  status: SuggestionStatus;
  endorse_count: number;
  oppose_count: number;
  created_at: string;
}

// ─── Poll & Vote Types ────────────────────────────────────────────────────────

export type PollType =
  | 'yes_no'
  | 'agree_disagree'
  | 'multiple_choice'
  | 'ranked_choice'
  | 'multi_select';

export type PollClass = 'advisory' | 'official';
export type PollScope = 'section' | 'article' | 'document' | 'muungano';
export type PollVisibility = 'public' | 'hidden_until_close' | 'segmented';
export type PollStatus = 'draft' | 'open' | 'closed' | 'archived';

export interface PollOption {
  id: string;
  poll_id: string;
  label_sw: string;
  label_en: string;
  order_index: number;
  vote_count?: number;
  percentage?: number;
}

export interface Poll {
  id: string;
  section_id: string;
  scope: PollScope;
  class: PollClass;
  title_sw: string;
  title_en: string;
  type: PollType;
  created_by: string;
  org_id?: string;
  opens_at: string;
  closes_at: string;
  visibility: PollVisibility;
  status: PollStatus;
  total_votes: number;
  options: PollOption[];
  user_voted?: string;  // poll_option_id if user already voted
}

export interface Vote {
  id: string;
  poll_id: string;
  poll_option_id: string;
  user_id: string;
  verification_tier: VerificationTier;
  region?: TanzaniaRegion;
  created_at: string;
}

// ─── Analysis Types ───────────────────────────────────────────────────────────

export interface Analysis {
  id: string;
  section_id: string;
  org_id: string;
  org: Partial<Organization>;
  title: string;
  abstract: string;
  body: string;
  tags: string[];
  published_at: string;
  attachment_url?: string;
}

// ─── Navigation Types ─────────────────────────────────────────────────────────

export type RootTabParamList = {
  Home: undefined;
  Browser: undefined;
  Polls: undefined;
  Search: undefined;
  Profile: undefined;
};

export type BrowserStackParamList = {
  DocumentList: undefined;
  ChapterList: { document_id: string; document_title: string };
  SectionWorkspace: { section_id: string; section: Section };
};

export type HomeStackParamList = {
  HomeScreen: undefined;
  SectionWorkspace: { section_id: string; section: Section };
  MuunganoHub: undefined;
};

// ─── Tanzania Regions ─────────────────────────────────────────────────────────

export type TanzaniaRegion =
  | 'arusha' | 'dar_es_salaam' | 'dodoma' | 'geita' | 'iringa'
  | 'kagera' | 'katavi' | 'kigoma' | 'kilimanjaro' | 'lindi'
  | 'manyara' | 'mara' | 'mbeya' | 'morogoro' | 'mtwara'
  | 'mwanza' | 'njombe' | 'pwani' | 'rukwa' | 'ruvuma'
  | 'shinyanga' | 'simiyu' | 'singida' | 'songwe' | 'tabora'
  | 'tanga' | 'zanzibar_north' | 'zanzibar_south' | 'zanzibar_west'
  | 'pemba_north' | 'pemba_south';

// ─── UI State Types ───────────────────────────────────────────────────────────

export type Language = 'sw' | 'en';
export type FontSize = 'sm' | 'md' | 'lg' | 'xl';
export type ColorScheme = 'dark';  // App is dark-only (OLED)

export interface AppState {
  language: Language;
  fontSize: FontSize;
  isOffline: boolean;
  user: User | null;
}

export type WorkspaceTab =
  | 'text'
  | 'plain'
  | 'discussion'
  | 'suggestions'
  | 'options'
  | 'polls'
  | 'analysis'
  | 'cases'
  | 'history'
  | 'related';
