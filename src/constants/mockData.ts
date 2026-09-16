import type {
  Section, Poll, PollOption, Discussion, Comment,
  Suggestion, Analysis, Organization, User,
} from '../types';

// ─── Organizations ────────────────────────────────────────────────────────────

export const MOCK_ORGS: Organization[] = [
  {
    id: 'org-tls',
    name: 'Chama cha Mawakili Tanzania',
    type: 'law_society',
    verified: true,
    description: 'Tanzania Law Society',
  },
  {
    id: 'org-lhrc',
    name: 'Kituo cha Haki za Binadamu',
    type: 'ngo',
    verified: true,
    description: 'Legal and Human Rights Centre',
  },
  {
    id: 'org-udsm',
    name: 'Chuo Kikuu cha Dar es Salaam',
    type: 'academic',
    verified: true,
    description: 'University of Dar es Salaam — School of Law',
  },
];

// ─── Users ────────────────────────────────────────────────────────────────────

export const MOCK_USERS: User[] = [
  {
    id: 'user-anon',
    display_name: 'Mtumiaji asiyejulikana',
    verification_tier: 'phone',
    role: 'verified_citizen',
    anonymity_default: true,
    language_pref: 'sw',
    nida_verified: false,
    region: 'mwanza',
    created_at: '2026-08-01T00:00:00Z',
  },
  {
    id: 'user-mk',
    name: 'Makena Kamau',
    display_name: 'M. Kamau',
    verification_tier: 'nida',
    role: 'verified_citizen',
    anonymity_default: false,
    language_pref: 'sw',
    nida_verified: true,
    region: 'dodoma',
    created_at: '2026-07-15T00:00:00Z',
  },
];

// ─── Constitution Sections — Union 1977 ──────────────────────────────────────

export const MOCK_SECTIONS: Section[] = [
  // ── Chapter 1 ──
  {
    id: 'sec-ch1',
    document_id: 'doc-union-1977',
    article_number: 'Sura 1',
    title_sw: 'Jamhuri ya Muungano wa Tanzania',
    title_en: 'United Republic of Tanzania',
    body_sw: '',
    body_en: '',
    level: 'chapter',
    order_index: 1,
    is_muungano: false,
    version: 1,
    meta: { discussion_count: 23, suggestion_count: 2, poll_count: 1, is_hot: false, has_active_poll: true },
    children: [
      {
        id: 'sec-art1',
        document_id: 'doc-union-1977',
        parent_id: 'sec-ch1',
        article_number: '1',
        title_sw: 'Nchi ya Tanzania na uhuru wake',
        title_en: 'Tanzania and its sovereignty',
        body_sw: 'Tanzania ni nchi huru yenye uhuru kamili na utawala wa kisheria. Nchi hii inajulikana kwa jina la Jamhuri ya Muungano wa Tanzania.',
        body_en: 'Tanzania is a free and independent country with full sovereignty and the rule of law. This country is known by the name of the United Republic of Tanzania.',
        level: 'article',
        order_index: 1,
        is_muungano: false,
        version: 1,
        meta: { discussion_count: 12, suggestion_count: 1, poll_count: 1, is_hot: false, has_active_poll: true },
      },
      {
        id: 'sec-art3',
        document_id: 'doc-union-1977',
        parent_id: 'sec-ch1',
        article_number: '3',
        title_sw: 'Muundo wa Serikali',
        title_en: 'Structure of Government',
        body_sw: 'Serikali ya Tanzania inajumuisha matawi matatu: Mtendaji, Bunge, na Mahakama. Kila tawi linafanya kazi yake kwa uhuru na kwa mujibu wa sheria.',
        body_en: 'The Government of Tanzania comprises three branches: Executive, Legislature, and Judiciary. Each branch operates independently and according to the law.',
        level: 'article',
        order_index: 2,
        is_muungano: false,
        version: 1,
        meta: { discussion_count: 8, suggestion_count: 0, poll_count: 0, is_hot: false, has_active_poll: false },
      },
    ],
  },
  // ── Chapter 3 — Bill of Rights ──
  {
    id: 'sec-ch3',
    document_id: 'doc-union-1977',
    article_number: 'Sura 3',
    title_sw: 'Haki za Msingi na Wajibu',
    title_en: 'Fundamental Rights and Duties',
    body_sw: '',
    body_en: '',
    level: 'chapter',
    order_index: 3,
    is_muungano: false,
    version: 1,
    meta: { discussion_count: 412, suggestion_count: 28, poll_count: 6, is_hot: true, has_active_poll: true },
    children: [
      {
        id: 'sec-art13',
        document_id: 'doc-union-1977',
        parent_id: 'sec-ch3',
        article_number: '13',
        title_sw: 'Usawa mbele ya sheria',
        title_en: 'Equality before the law',
        body_sw: 'Watu wote ni sawa mbele ya sheria na wana haki, bila ya ubaguzi wowote, kulindwa na sheria kwa usawa. Hakuna raia anayeweza kubaguliwa na chombo chochote cha Serikali kwa misingi ya rangi yake, kabila lake, mahali alipozaliwa, asili yake, jinsia yake, dini yake au hali yake.',
        body_en: 'All persons are equal before the law and are entitled, without any discrimination, to equal protection under the law. No citizen shall be discriminated against by any government institution on grounds of their race, ethnicity, place of birth, origin, sex, religion or status.',
        level: 'article',
        order_index: 13,
        is_muungano: false,
        version: 2,
        meta: { discussion_count: 87, suggestion_count: 5, poll_count: 2, is_hot: false, has_active_poll: true },
      },
      {
        id: 'sec-art19',
        document_id: 'doc-union-1977',
        parent_id: 'sec-ch3',
        article_number: '19',
        title_sw: 'Uhuru wa kutoa maoni',
        title_en: 'Freedom of expression',
        body_sw: 'Kila mtu ana haki ya uhuru wa kutoa maoni na kupokea habari bila ya kuzuiwa na mtu yeyote. Aidha, kila raia ana haki ya kuelimishwa na kupata habari ambazo ziko muhimu kwa ustawi na maendeleo ya Tanzania.',
        body_en: 'Every person has the right to freedom of expression and to receive information without obstruction from any person. Furthermore, every citizen has the right to be educated and to receive information which is important for the welfare and development of Tanzania.',
        level: 'article',
        order_index: 19,
        is_muungano: false,
        version: 1,
        meta: { discussion_count: 142, suggestion_count: 8, poll_count: 1, is_hot: true, has_active_poll: true },
      },
      {
        id: 'sec-art20',
        document_id: 'doc-union-1977',
        parent_id: 'sec-ch3',
        article_number: '20',
        title_sw: 'Uhuru wa kukusanyika',
        title_en: 'Freedom of assembly',
        body_sw: 'Kila mtu ana haki ya kukusanyika pamoja na watu wengine na kujiunga na vyama vya hiari kwa ajili ya kusimamia na kulinda maslahi yake.',
        body_en: 'Every person has the right to assemble peacefully and to associate with other persons and to form or join voluntary associations for the purpose of protecting their interests.',
        level: 'article',
        order_index: 20,
        is_muungano: false,
        version: 1,
        meta: { discussion_count: 54, suggestion_count: 3, poll_count: 1, is_hot: false, has_active_poll: true },
      },
      {
        id: 'sec-art26',
        document_id: 'doc-union-1977',
        parent_id: 'sec-ch3',
        article_number: '26',
        title_sw: 'Haki ya kumiliki mali',
        title_en: 'Right to property',
        body_sw: 'Kila mtu ana haki ya kumiliki mali binafsi na haki hiyo inalindwa na Katiba hii. Serikali haitanyang\'anya mali ya mtu yeyote bila ya kufuata sheria na bila ya fidia ya haki.',
        body_en: 'Every person has the right to own private property and this right is protected by this Constitution. The Government shall not deprive any person of their property except in accordance with the law and without fair compensation.',
        level: 'article',
        order_index: 26,
        is_muungano: false,
        version: 1,
        meta: { discussion_count: 87, suggestion_count: 5, poll_count: 0, is_hot: false, has_active_poll: false },
      },
    ],
  },
  // ── Muungano Chapter ──
  {
    id: 'sec-muungano',
    document_id: 'doc-union-1977',
    article_number: 'Muungano',
    title_sw: 'Mambo ya Muungano',
    title_en: 'Union Matters',
    body_sw: '',
    body_en: '',
    level: 'chapter',
    order_index: 0,
    is_muungano: true,
    version: 3,
    meta: { discussion_count: 310, suggestion_count: 18, poll_count: 4, is_hot: true, has_active_poll: true },
    children: [
      {
        id: 'sec-art4',
        document_id: 'doc-union-1977',
        parent_id: 'sec-muungano',
        article_number: '4',
        title_sw: 'Muundo wa Muungano',
        title_en: 'Structure of the Union',
        body_sw: 'Tanzania inajumuisha Jamhuri ya Muungano wa Tanzania Bara na Serikali ya Mapinduzi ya Zanzibar. Maeneo haya mawili yanashirikiana chini ya Muungano huu kwa mujibu wa masharti ya Katiba hii.',
        body_en: 'Tanzania comprises the United Republic of Mainland Tanzania and the Revolutionary Government of Zanzibar. These two territories cooperate under this Union in accordance with the provisions of this Constitution.',
        level: 'article',
        order_index: 4,
        is_muungano: true,
        version: 3,
        meta: { discussion_count: 189, suggestion_count: 12, poll_count: 3, is_hot: true, has_active_poll: true },
      },
      {
        id: 'sec-art5',
        document_id: 'doc-union-1977',
        parent_id: 'sec-muungano',
        article_number: '5',
        title_sw: 'Zanzibar ndani ya Muungano',
        title_en: 'Zanzibar within the Union',
        body_sw: 'Zanzibar ni sehemu ya Jamhuri ya Muungano wa Tanzania. Serikali ya Mapinduzi ya Zanzibar ina mamlaka ya kutunga sheria na kusimamia mambo yasiyo ya Muungano ndani ya Zanzibar.',
        body_en: 'Zanzibar is part of the United Republic of Tanzania. The Revolutionary Government of Zanzibar has authority to legislate and administer non-Union matters within Zanzibar.',
        level: 'article',
        order_index: 5,
        is_muungano: true,
        version: 2,
        meta: { discussion_count: 121, suggestion_count: 6, poll_count: 1, is_hot: false, has_active_poll: true },
      },
    ],
  },
  // ── Chapter 5 — Parliament ──
  {
    id: 'sec-ch5',
    document_id: 'doc-union-1977',
    article_number: 'Sura 5',
    title_sw: 'Bunge la Tanzania',
    title_en: 'Parliament of Tanzania',
    body_sw: '',
    body_en: '',
    level: 'chapter',
    order_index: 5,
    is_muungano: false,
    version: 1,
    meta: { discussion_count: 87, suggestion_count: 9, poll_count: 2, is_hot: false, has_active_poll: false },
  },
];

// ─── Polls ────────────────────────────────────────────────────────────────────

export const POLL_ART19: Poll = {
  id: 'poll-art19-1',
  section_id: 'sec-art19',
  scope: 'article',
  class: 'advisory',
  title_sw: 'Ibara 19 inahitaji kuboreshwa vipi zaidi?',
  title_en: 'How should Article 19 be improved?',
  type: 'multiple_choice',
  created_by: 'org-tls',
  opens_at: '2026-09-01T00:00:00Z',
  closes_at: '2026-10-30T23:59:59Z',
  visibility: 'public',
  status: 'open',
  total_votes: 4218,
  options: [
    { id: 'opt-1', poll_id: 'poll-art19-1', label_sw: 'Kuongeza ulinzi wa kidijitali', label_en: 'Add digital rights protection', order_index: 1, vote_count: 1729, percentage: 41 },
    { id: 'opt-2', poll_id: 'poll-art19-1', label_sw: 'Kurekebisha lugha ya sasa', label_en: 'Revise existing language', order_index: 2, vote_count: 1476, percentage: 35 },
    { id: 'opt-3', poll_id: 'poll-art19-1', label_sw: 'Ibara inatosha kama ilivyo', label_en: 'Article is sufficient as is', order_index: 3, vote_count: 1013, percentage: 24 },
  ],
};

export const POLL_ART13: Poll = {
  id: 'poll-art13-1',
  section_id: 'sec-art13',
  scope: 'article',
  class: 'advisory',
  title_sw: 'Je, ibara 13 inalinda haki za wote kikamilifu?',
  title_en: 'Does Article 13 fully protect everyone\'s rights?',
  type: 'yes_no',
  created_by: 'org-lhrc',
  opens_at: '2026-09-10T00:00:00Z',
  closes_at: '2026-10-30T23:59:59Z',
  visibility: 'public',
  status: 'open',
  total_votes: 8127,
  options: [
    { id: 'opt-y', poll_id: 'poll-art13-1', label_sw: 'Ndiyo', label_en: 'Yes', order_index: 1, vote_count: 5039, percentage: 62 },
    { id: 'opt-n', poll_id: 'poll-art13-1', label_sw: 'Hapana', label_en: 'No', order_index: 2, vote_count: 2276, percentage: 28 },
    { id: 'opt-a', poll_id: 'poll-art13-1', label_sw: 'Sijui', label_en: 'Not sure', order_index: 3, vote_count: 812, percentage: 10 },
  ],
};

// ─── Discussions & Comments ───────────────────────────────────────────────────

export const DISCUSSIONS_ART19: Discussion[] = [
  {
    id: 'disc-1',
    section_id: 'sec-art19',
    user_id: 'org-tls',
    org: MOCK_ORGS[0],
    title: 'Haja ya ulinzi wa kidijitali',
    body: 'Ibara hii inahitaji kuboreshwa ili kufafanua wazi mipaka ya uhuru wa maoni kwenye mitandao ya kijamii, ambayo halikuwepo wakati Katiba iliandikwa mwaka 1977. Viwango vya kimataifa vya haki za binadamu (ICCPR Ibara 19) vinatoa mwongozo mzuri.',
    is_anonymous: false,
    upvotes: 89,
    reply_count: 12,
    is_verified_author: true,
    created_at: '2026-09-10T14:30:00Z',
    status: 'active',
  },
  {
    id: 'disc-2',
    section_id: 'sec-art19',
    user_id: 'user-mk',
    user: MOCK_USERS[1],
    title: 'Kulinganisha na Kenya',
    body: 'Nakubaliana na TLS. Nchini Kenya, Katiba ya 2010 imefafanua hili vizuri zaidi katika Ibara 33 na 34. Tunaweza kujifunza kutoka kwao, hasa kuhusu uhuru wa vyombo vya habari na mitandao ya kijamii.',
    is_anonymous: false,
    upvotes: 34,
    reply_count: 5,
    is_verified_author: true,
    created_at: '2026-09-12T09:15:00Z',
    status: 'active',
  },
  {
    id: 'disc-3',
    section_id: 'sec-art19',
    user_id: 'user-anon',
    user: MOCK_USERS[0],
    title: 'Hofu za usalama wa taifa',
    body: 'Tunahitaji kuzingatia usawa kati ya uhuru wa maoni na usalama wa taifa. Baadhi ya nchi zimeshuhudia mitandao ya kijamii ikiwa chanzo cha machafuko ya kisiasa. Je, tunaweza kuweka mipaka ya busara?',
    is_anonymous: true,
    upvotes: 21,
    reply_count: 8,
    is_verified_author: false,
    created_at: '2026-09-13T16:45:00Z',
    status: 'active',
  },
];

// ─── Suggestions ──────────────────────────────────────────────────────────────

export const SUGGESTIONS_ART19: Suggestion[] = [
  {
    id: 'sugg-1',
    section_id: 'sec-art19',
    user_id: 'org-tls',
    org: MOCK_ORGS[0],
    title: 'Kuongeza aya ya ulinzi wa kidijitali',
    rationale: 'Katiba ya 1977 haikuzingatia teknolojia ya kisasa. Tunahitaji kufafanua wazi kwamba uhuru wa maoni unajumuisha majukwaa ya kidijitali, na kwamba serikali haiwezi kuzuia wavuti au mitandao ya kijamii bila ya amri ya mahakama.',
    proposed_text_sw: '"...ikiwemo uhuru wa kutoa maoni kwenye majukwaa ya kidijitali, bila ya kuchukuliwa hatua kwa maoni ya amani ambayo hayadhuru wengine."',
    proposed_text_en: '"...including the freedom to express opinions on digital platforms, without facing action for peaceful expression that does not harm others."',
    status: 'under_review',
    endorse_count: 67,
    oppose_count: 12,
    created_at: '2026-09-05T10:00:00Z',
  },
  {
    id: 'sugg-2',
    section_id: 'sec-art19',
    user_id: 'user-anon',
    user: MOCK_USERS[0],
    title: 'Kurekebisha lugha ya mstari wa kwanza',
    rationale: 'Lugha "bila ya kuzuiwa na mtu yeyote" ni pana sana na haifafanui vizuri mipaka. Inapaswa kusema "bila ya kuzuiwa kiholela" ili kuruhusu vikwazo vya kisheria vinavyokubalika kimataifa.',
    proposed_text_sw: '"Kila mtu ana haki ya uhuru wa kutoa maoni na kupokea habari za kweli na zenye usawa bila ya kuzuiwa kiholela..."',
    proposed_text_en: '"Every person has the right to freedom of expression and to receive truthful and balanced information without arbitrary obstruction..."',
    status: 'accepted',
    endorse_count: 141,
    oppose_count: 8,
    created_at: '2026-09-08T14:20:00Z',
  },
];

// ─── Analysis Papers ──────────────────────────────────────────────────────────

export const ANALYSIS_ART19: Analysis[] = [
  {
    id: 'anal-1',
    section_id: 'sec-art19',
    org_id: 'org-lhrc',
    org: MOCK_ORGS[1],
    title: 'Uhuru wa kutoa maoni Tanzania: Tathmini ya kisheria na ulinganisho wa kimataifa',
    abstract: 'Makala hii inachunguza Ibara 19 ya Katiba ya 1977 kwa kuzingatia viwango vya kimataifa vya haki za binadamu, hasa ICCPR Ibara 19 na Afrika Mkataba wa Haki za Binadamu na Watu Ibara 9.',
    body: '',
    tags: ['uhuru wa maoni', 'kidijitali', 'ICCPR', 'haki za binadamu'],
    published_at: '2026-07-15T00:00:00Z',
  },
  {
    id: 'anal-2',
    section_id: 'sec-art19',
    org_id: 'org-udsm',
    org: MOCK_ORGS[2],
    title: 'Mitandao ya kijamii na vikwazo vya kikatiba: Mwelekeo wa kisheria',
    abstract: 'Utafiti huu unachunguza namna sheria za Tanzania zinavyoshughulikia uhuru wa maoni kwenye mitandao ya kijamii, ukizingatia matatizo ya "hate speech" na habari za uongo.',
    body: '',
    tags: ['mitandao ya kijamii', 'sheria ya mtandao', 'habari za uongo'],
    published_at: '2026-08-20T00:00:00Z',
  },
];

// ─── History Items ────────────────────────────────────────────────────────────

export interface HistoryItem {
  year: number;
  title_sw: string;
  title_en: string;
  description_sw: string;
  description_en: string;
  is_current?: boolean;
}

export const HISTORY_ART19: HistoryItem[] = [
  {
    year: 1977,
    title_sw: 'Toleo la asili',
    title_en: 'Original version',
    description_sw: 'Ibara iliandikwa na kujumuishwa katika Katiba ya kwanza ya Jamhuri ya Muungano.',
    description_en: 'Article written and included in the first Constitution of the United Republic.',
  },
  {
    year: 1984,
    title_sw: 'Marekebisho madogo',
    title_en: 'Minor amendments',
    description_sw: 'Aya ya pili iliongezwa kuhusu haki ya kupata habari.',
    description_en: 'Second paragraph added regarding the right to access information.',
  },
  {
    year: 2026,
    title_sw: 'Mapitio yanayoendelea',
    title_en: 'Ongoing review',
    description_sw: 'Mapendekezo 8 yanayopitiwa na Tume ya Katiba.',
    description_en: '8 proposals currently under review by the Constitutional Commission.',
    is_current: true,
  },
];

// ─── Trending Feed ────────────────────────────────────────────────────────────

export interface TrendingItem {
  section: Section;
  poll?: Poll;
  recent_activity: string;
}

export const TRENDING: TrendingItem[] = [
  {
    section: MOCK_SECTIONS[1].children![1], // Art 19
    poll: POLL_ART19,
    recent_activity: 'Maoni 142 · Kura 4,218',
  },
  {
    section: MOCK_SECTIONS[1].children![0], // Art 13
    poll: POLL_ART13,
    recent_activity: 'Maoni 87 · Kura 8,127',
  },
  {
    section: MOCK_SECTIONS[2].children![0], // Muungano Art 4
    recent_activity: 'Maoni 189 · Mapendekezo 12',
  },
];
