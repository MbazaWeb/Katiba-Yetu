/**
 * Katiba Yetu — Design Tokens
 * Theme: Taifa (Nation) — forest green, savanna gold, sky blue, midnight black
 * Inspired by Tanzania's landscape and civic dignity
 *
 * v2 — Dark-first theme. Surface values updated to match reference design.
 *       All legacy keys preserved (green.*, gold.*, blue.*, muungano, zanzibar, union).
 */

import { Platform } from 'react-native';

const fontFamilies = Platform.select({
  ios:     { serif: 'Georgia',     sans: 'System',      mono: 'Courier' },
  android: { serif: 'serif',       sans: 'sans-serif',  mono: 'monospace' },
  web:     { serif: 'Georgia, serif', sans: 'System',   mono: 'Courier, monospace' },
  default: { serif: 'serif',       sans: 'System',      mono: 'monospace' },
})!;

export const Colors = {
  // ── Brand Core — unchanged ─────────────────────────────────────────────
  green: {
    50:  '#0E1A14',   // surface tint (very dark)
    100: '#123524',   // hover tint
    200: '#1B5540',   // borders on dark
    300: '#4ADE80',   // bright accent text/icons (USE THIS for text on dark)
    400: '#22C55E',   // primary brand on dark
    500: '#16A34A',   // mid brand
    600: '#15803D',   // deeper (buttons on light surfaces)
    700: '#22C55E',   // ALIAS of 400 — legacy callers expecting "visible green"
    800: '#14532D',   // deep surface tint
    900: '#0A2A18',   // darkest surface (still bg-only, not text)
  },
  gold: {
    50:  '#1A1608',
    100: '#2A2208',
    200: '#5C4A0E',
    300: '#FACC15',
    400: '#EAB308',
    500: '#D4A80A',
    600: '#A16207',
    700: '#854D0E',
    800: '#713F12',
    900: '#422006',
  },
  blue: {
    50:  '#0A1420',
    100: '#0F1E30',
    200: '#1E3A5F',
    300: '#60A5FA',
    400: '#3B82F6',
    500: '#2563EB',
    600: '#1D4ED8',
    700: '#1E40AF',
    800: '#1E3A8A',
    900: '#172554',
  },
  red: {
    50:  '#200A0A',
    100: '#300F0F',
    200: '#5F1E1E',
    300: '#F87171',
    400: '#EF4444',
    500: '#DC2626',
    600: '#B91C1C',
    700: '#991B1B',
    800: '#7F1D1D',
    900: '#450A0A',
  },
  black: {
    true: '#000000',
    950:  '#050706',
    900:  '#0B0F0E',
    800:  '#131A18',
    700:  '#1A2421',
    600:  '#243230',
    500:  '#3A4A46',
    400:  '#5C6C68',
    300:  '#7A8A85',
    200:  '#A8B4B0',
    100:  '#D0D8D4',
    50:   '#EEF2F0',
  },

  // ── Surfaces — DARK (changed) ──────────────────────────────────────────
  surface: {
    base:         '#0B0F0E',
    raised:       '#131A18',
    overlay:      '#1A2421',
    border:       '#1F2B28',
    borderStrong: '#2A3A36',
  },
  text: {
    primary:   '#F5F7F6',
    secondary: '#B8C4C0',
    muted:     '#7A8A85',
    inverse:   '#0B0F0E',
    onGreen:   '#FFFFFF',
    onGold:    '#1A0E00',
    onBlue:    '#FFFFFF',
    onDark:    '#F5F7F6',
  },

  // ── Status — slightly brighter for dark bg ────────────────────────────
  status: {
    success: '#22C55E',
    warning: '#EAB308',
    danger:  '#EF4444',
    info:    '#3B82F6',
    locked:  '#7A8A85',
  },

  // ── Special Modules — unchanged ────────────────────────────────────────
  muungano: '#EAB308',
  zanzibar: '#3B82F6',
  union:    '#22C55E',

  // ── Backward-compat aliases (some screens may reference these) ────────
  white: '#FFFFFF',
  bg:    '#0B0F0E',
  card:  '#131A18',
} as const;

export const Typography = {
  family: fontFamilies,
  size: {
    xs:   12,
    sm:   13,
    base: 14,
    md:   15,
    lg:   17,
    xl:   20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 38,
    '5xl': 46,
  },
  weight: {
    regular:  '400' as const,
    medium:   '500' as const,
    semibold: '600' as const,
    bold:     '700' as const,
  },
  lineHeight: {
    tight:   1.15,
    snug:    1.30,
    normal:  1.5,
    relaxed: 1.65,
    loose:   1.8,
  },
  letterSpacing: {
    tight:  -0.4,
    normal:  0,
    wide:    0.3,
    wider:   0.6,
    widest:  1.2,
  },
} as const;

export const Spacing = {
  0:   0,
  0.5: 2,
  1:   4,
  1.5: 6,
  2:   8,
  2.5: 10,
  3:   12,
  4:   16,
  5:   20,
  6:   24,
  7:   28,
  8:   32,
  10:  40,
  12:  48,
  16:  64,
  20:  80,
} as const;

export const Radius = {
  none:  0,
  sm:    6,
  md:    10,
  lg:    12,
  xl:    14,
  '2xl': 18,
  '3xl': 24,
  full:  9999,
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.30,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.40,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.50,
    shadowRadius: 20,
    elevation: 8,
  },
  glow: {
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.30,
    shadowRadius: 8,
    elevation: 3,
  },
  goldGlow: {
    shadowColor: '#EAB308',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
} as const;

export const Animation = {
  duration: {
    instant: 80,
    fast:    150,
    normal:  250,
    slow:    400,
    slower:  600,
  },
  easing: {
    standard:   'ease-in-out',
    decelerate: 'ease-out',
    accelerate: 'ease-in',
    spring:     'spring',
  },
} as const;

/** Responsive layout constants — used by App shell & SidebarNav */
export const Layout = {
  maxWidth:          1440,
  contentMaxWidth:   1100,
  sidebarWidth:      240,
  sidebarCollapsed:  72,
  headerHeight:      64,
  contentPad:        24,
  breakpointDesktop: 900,
} as const;

// Semantic convenience aliases
export const Theme = {
  bg:            Colors.surface.base,
  bgRaised:      Colors.surface.raised,
  bgOverlay:     Colors.surface.overlay,
  border:        Colors.surface.border,
  borderStrong:  Colors.surface.borderStrong,
  primary:       Colors.green[500],
  primaryDark:   Colors.green[600],
  primaryLight:  Colors.green[400],
  accent:        Colors.gold[400],
  accentDark:    Colors.gold[500],
  link:          Colors.blue[400],
  textPrimary:   Colors.text.primary,
  textSecondary: Colors.text.secondary,
  textMuted:     Colors.text.muted,
} as const;
