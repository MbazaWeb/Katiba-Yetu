# Katiba Yetu 🇹🇿
**Tanzania Constitutional Deliberation Platform**

> Soma · Jadili · Pendekeza · Piga Kura  
> Read · Discuss · Propose · Vote

A bilingual (Kiswahili-first) civic platform for Tanzania's constitutional deliberation process.

---

## Tech Stack

| Layer | Tech |
|---|---|
| App framework | React Native 0.86 + Expo SDK 57 (React 19) |
| Styling | StyleSheet-based design tokens (`src/constants/tokens.ts`) |
| Storage (local) | @react-native-async-storage/async-storage (language, font size, bookmarks, votes, likes, endorsements) |
| Icons | @expo/vector-icons (Ionicons) |
| Backend (planned) | Node.js/Express on VPS |
| DB (planned) | PostgreSQL + pgvector |
| Cache (planned) | Redis |
| Search (planned) | Meilisearch |
| Files (planned) | MinIO / R2 |
| SMS/OTP (planned) | Africa's Talking |
| Identity (planned) | NIDA verification |

> **Note:** styling is intentionally plain `StyleSheet` + design tokens. NativeWind/Tailwind
> was removed in v0.1.1 because it was never wired (no `className` usage, no babel/metro
> integration). Re-introduce it only together with `nativewind/babel`, `withNativeWind`,
> and `react-native-reanimated`.

---

## Design Tokens

**Color palette — Taifa (Nation) theme:**
- **Green** `#0D7A3F` — Tanzania forest, primary actions, headers
- **Gold** `#D4A80A` — Savanna, Muungano module, accents
- **Blue** `#1A6DCF` — Sky, Zanzibar, polls, info
- **Black** `#0A0A0A` — Midnight OLED background

**Typography (platform-aware):**
- `Georgia` (iOS) / `serif` (Android) / `Georgia, serif` (web) — Article body (civic gravitas)
- `System` — UI chrome (clean, readable)
- `Courier` / `monospace` — Article numbers, codes

> CSS-style font stacks are invalid in React Native on native platforms —
> `Typography.family` resolves per-platform via `Platform.select`.

---

## Project Structure

```
src/
├── components/
│   ├── ErrorBoundary.tsx  # Root-level render error boundary
│   ├── ui/                # Primitives: Button, Card, Badge, PollBar, Avatar
│   ├── sections/          # AppHeader, ArticleCard, FeaturedPollCard, ChapterRow
│   └── navigation/        # BottomTabBar
├── constants/
│   ├── tokens.ts          # Design tokens (colors, spacing, type, shadows)
│   └── mockData.ts        # Seed data for development
├── hooks/
│   └── useAppContext.ts   # Language / font size / user context
├── lib/
│   └── storage.ts         # AsyncStorage wrapper (preferences + interactions)
├── screens/
│   ├── HomeScreen.tsx
│   ├── BrowserScreen.tsx
│   ├── PollsScreen.tsx
│   ├── SearchScreen.tsx
│   ├── ProfileScreen.tsx
│   └── SectionWorkspace.tsx  # 8-tab workspace (heart of the app)
├── types/
│   └── index.ts           # All TypeScript types
├── utils/
│   └── index.ts           # Formatting, date, text helpers
└── App.tsx                # Root with navigation state machine
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Start Expo dev server
npx expo start

# iOS (requires macOS + Xcode)
npx expo run:ios

# Android
npx expo run:android

# Lint + type-check
npm run lint
npm run type-check
```

---

## SectionWorkspace Tabs

The `SectionWorkspace` screen has 8 tabs (10 planned):

| Tab | Kiswahili | Description |
|---|---|---|
| `text` | Maandishi | Original constitutional text, SW/EN toggle, reading-size scaling |
| `plain` | Lugha rahisi | Plain language summary by TLS |
| `discussion` | Majadiliano | Public comment threads — working sort (Top/New/Verified) + composer |
| `suggestions` | Mapendekezo | Proposed amendments with endorsement toggle |
| `polls` | Kura | Advisory voting with animated bars, persisted votes |
| `analysis` | Uchambuzi | Expert publications and case law |
| `history` | Historia | Amendment timeline |
| `related` | Zinazohusiana | Related articles and international standards |

---

## Local Persistence (v0.1.1)

Interactions survive app restarts via AsyncStorage (`src/lib/storage.ts`):

| Key | Content |
|---|---|
| `@katibayetu/language` | UI language (`sw` / `en`) |
| `@katibayetu/fontSize` | Reading size (`sm` / `md` / `lg` / `xl`) |
| `@katibayetu/bookmarks` | Bookmarked section ids |
| `@katibayetu/votes` | Poll votes (`pollId -> optionId`) |
| `@katibayetu/likes` | Liked discussion ids |
| `@katibayetu/endorsements` | Suggestion endorsements |

---

## Muungano Module

Articles relating to the Union between Tanzania Mainland and Zanzibar are flagged with:
- Gold `#D4A80A` border-left accent
- Warning banner above tabs
- Moderated discussion status
- Special amber icon badge in browser

---

## Changelog

### v0.1.1
- **Fixed:** platform-aware font stacks (serif/sans/mono now render correctly on iOS & Android)
- **Fixed:** reading-size setting actually scales article text (previously dead code); added `xl` size
- **Fixed:** discussion sort (Top/New/Verified) now really sorts; Post button publishes your comment
- **Added:** local persistence — language, font size, bookmarks, votes, likes, endorsements
- **Added:** root-level error boundary; app icon, adaptive icon, favicon, splash art
- **Fixed:** browser search now matches English body text; Zanzibar tab no longer runs union search
- **Fixed:** poll navigation carries the selected poll (surfaced first in Polls list); stats computed from data
- **Chore:** removed 9 unused dependencies incl. unwired NativeWind/Tailwind stack and react-native-mmkv
- **Chore:** working ESLint (eslint-config-expo), fixed tsconfig include, README accuracy pass

### v0.1.0
- Initial frontend codebase — all 5 screens + SectionWorkspace functional

---

## Next Steps

- [ ] PollsScreen — full polls listing (filter by status/document)
- [ ] SearchScreen — full-text search via Meilisearch (replaces local mock filter)
- [ ] ProfileScreen + NIDA verification flow (sign-in is currently a placeholder)
- [ ] API integration (replace mockData + local-only interactions)
- [ ] Offline packs — constitution download via `expo-file-system`
- [ ] Push notifications via `expo-notifications` (+ `POST_NOTIFICATIONS` permission on Android 13+)
- [ ] Africa's Talking SMS/OTP auth
- [ ] Admin CMS (web-only React app)
