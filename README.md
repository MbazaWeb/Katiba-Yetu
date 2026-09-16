# Katiba Yetu 🇹🇿
**Tanzania Constitutional Deliberation Platform**

> Soma · Jadili · Pendekeza · Piga Kura  
> Read · Discuss · Propose · Vote

A bilingual (Kiswahili-first) civic platform for Tanzania's constitutional deliberation process.

---

## Tech Stack

| Layer | Tech |
|---|---|
| App framework | React Native 0.74 + Expo 51 |
| Styling | NativeWind v4 (Tailwind) |
| Storage (local) | react-native-mmkv |
| Backend | Node.js/Express on VPS |
| DB | PostgreSQL + pgvector |
| Cache | Redis |
| Search | Meilisearch |
| Files | MinIO / R2 |
| SMS/OTP | Africa's Talking |
| Identity | NIDA verification |

---

## Design Tokens

**Color palette — Taifa (Nation) theme:**
- **Green** `#0D7A3F` — Tanzania forest, primary actions, headers
- **Gold** `#D4A80A` — Savanna, Muungano module, accents
- **Blue** `#1A6DCF` — Sky, Zanzibar, polls, info
- **Black** `#0A0A0A` — Midnight OLED background

**Typography:**
- `Georgia, serif` — Article body (civic gravitas)
- `System` — UI chrome (clean, readable)
- `Courier, mono` — Article numbers, codes

---

## Project Structure

```
src/
├── components/
│   ├── ui/           # Primitives: Text, Button, Card, Badge, PollBar, Avatar
│   ├── sections/     # AppHeader, ArticleCard, FeaturedPollCard, ChapterRow
│   └── navigation/   # BottomTabBar
├── constants/
│   ├── tokens.ts     # Design tokens (colors, spacing, type, shadows)
│   └── mockData.ts   # Seed data for development
├── hooks/
│   └── useAppContext.ts
├── screens/
│   ├── HomeScreen.tsx
│   ├── BrowserScreen.tsx
│   └── SectionWorkspace.tsx  # 10-tab workspace (heart of the app)
├── types/
│   └── index.ts      # All TypeScript types
├── utils/
│   └── index.ts      # Formatting, date, text helpers
└── App.tsx           # Root with navigation state machine
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
```

---

## SectionWorkspace Tabs

The `SectionWorkspace` screen has 8 tabs (10 planned):

| Tab | Kiswahili | Description |
|---|---|---|
| `text` | Maandishi | Original constitutional text, SW/EN toggle |
| `plain` | Lugha rahisi | Plain language summary by TLS |
| `discussion` | Majadiliano | Public comment threads |
| `suggestions` | Mapendekezo | Proposed amendments with endorsement |
| `polls` | Kura | Advisory voting with animated bars |
| `analysis` | Uchambuzi | Expert publications and case law |
| `history` | Historia | Amendment timeline |
| `related` | Zinazohusiana | Related articles and international standards |

---

## Muungano Module

Articles relating to the Union between Tanzania Mainland and Zanzibar are flagged with:
- Gold `#D4A80A` border-left accent
- Warning banner above tabs
- Moderated discussion status
- Special amber icon badge in browser

---

## Next Steps

- [ ] Add `@expo/vector-icons` — replace text-based icons
- [ ] PollsScreen — full polls listing
- [ ] SearchScreen — full-text search via Meilisearch
- [ ] ProfileScreen + NIDA verification flow
- [ ] API integration (replace mockData)
- [ ] Offline packs — constitution download via `expo-file-system`
- [ ] Push notifications via `expo-notifications`
- [ ] Africa's Talking SMS/OTP auth
- [ ] Admin CMS (web-only React app)
