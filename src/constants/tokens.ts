/**
 * Katiba Yetu — Design Tokens
 * Theme: Taifa (Nation) — forest green, savanna gold, sky blue, midnight black
 * Inspired by Tanzania's landscape and civic dignity
 */

import { Platform } from 'react-native';

/**
 * Font stacks must be platform-aware:
 * - React Native (iOS/Android) expects a SINGLE font family name — CSS-style
 *   comma stacks like "Georgia, serif" are invalid on native and silently
 *   fall back to the system font.
 * - react-native-web passes fontFamily straight through to CSS, so stacks are
 *   fine on web.
 */
const fontFamilies = Platform.select({
  ios: {
    serif: 'Georgia',
    sans: 'System',
    mono: 'Courier',
  },
  android: {
    serif: 'serif',       // Noto Serif (system)
    sans: 'sans-serif',   // Roboto (system)
    mono: 'monospace',    // Noto Mono / Droid Sans Mono (system)
  },
  web: {
    serif: 'Georgia, serif',
    sans: 'System',
    mono: 'Courier, monospace',
  },
  default: {
    serif: 'serif',
    sans: 'System',
    mono: 'monospace',
  },
})!;

export const Colors = {
  // ── Brand Core ──────────────────────────────────────────────────────────
  green: {
    50:  '#E8F5EE',
    100: '#C6E6D4',
    200: '#8FCFAA',
    300: '#52B47F',
    400: '#1F9456',
    500: '#0D7A3F',   // Primary action / header
    600: '#0A6233',
    700: '#074A27',
    800: '#04321A',
    900: '#021A0D',
  },
  gold: {
    50:  '#FDF8E7',
    100: '#FAF0C5',
    200: '#F4DC80',
    300: '#ECC63C',
    400: '#D4A80A',   // Accent / badges / highlights
    500: '#B08D07',
    600: '#8C7005',
    700: '#685304',
    800: '#443602',
    900: '#221B01',
  },
  blue: {
    50:  '#E6F0FB',
    100: '#C2D9F6',
    200: '#85B3EC',
    300: '#4A8EE0',
    400: '#1A6DCF',   // Links / secondary actions / polls
    500: '#1457A8',
    600: '#0F4284',
    700: '#0A2E60',
    800: '#061B3C',
    900: '#030D1E',
  },
  black: {
    true: '#000000',
    950: '#030303',
    900: '#0A0A0A',   // Primary text on light
    800: '#161616',   // App background (OLED-friendly)
    700: '#242424',
    600: '#333333',
    500: '#4A4A4A',
    400: '#666666',
    300: '#888888',
    200: '#AAAAAA',
    100: '#CCCCCC',
    50:  '#EEEEEE',
  },
  // ── Semantic ─────────────────────────────────────────────────────────────
  surface: {
    base:    '#0A0A0A',   // Deep black — OLED background
    raised:  '#141414',   // Cards, sheets
    overlay: '#1C1C1C',   // Modal, popover
    border:  '#2A2A2A',   // Hairlines
    borderStrong: '#3A3A3A',
  },
  text: {
    primary:   '#F0F0F0',
    secondary: '#A0A0A0',
    muted:     '#606060',
    inverse:   '#0A0A0A',
    onGreen:   '#FFFFFF',
    onGold:    '#1A0E00',
    onBlue:    '#FFFFFF',
  },
  // ── Status ──────────────────────────────────────────────────────────────
  status: {
    success: '#1F9456',
    warning: '#D4A80A',
    danger:  '#D63B3B',
    info:    '#1A6DCF',
    locked:  '#4A4A4A',
  },
  // ── Special Modules ──────────────────────────────────────────────────────
  muungano: '#B08D07',   // Gold for Union/Muungano module
  zanzibar: '#1457A8',   // Blue for Zanzibar constitution
  union:    '#0D7A3F',   // Green for Union constitution
} as const;

export const Typography = {
  family: fontFamilies,
  size: {
    xs:   11,
    sm:   12,
    base: 14,
    md:   15,
    lg:   17,
    xl:   20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 34,
    '5xl': 42,
  },
  weight: {
    regular: '400' as const,
    medium:  '500' as const,
    semibold:'600' as const,
    bold:    '700' as const,
  },
  lineHeight: {
    tight:   1.2,
    snug:    1.35,
    normal:  1.5,
    relaxed: 1.65,
    loose:   1.8,
  },
  letterSpacing: {
    tight:  -0.5,
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
  none: 0,
  sm:   4,
  md:   8,
  lg:   12,
  xl:   16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
} as const;

export const Shadow = {
  // iOS-style layered shadows — subtle, refined
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 10,
  },
  glow: {
    // Green glow for primary elements
    shadowColor: '#0D7A3F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  goldGlow: {
    shadowColor: '#D4A80A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
} as const;

export const Animation = {
  duration: {
    instant:  80,
    fast:     150,
    normal:   250,
    slow:     400,
    slower:   600,
  },
  easing: {
    standard:    'ease-in-out',
    decelerate:  'ease-out',
    accelerate:  'ease-in',
    spring:      'spring',
  },
} as const;

// Semantic convenience aliases
export const Theme = {
  bg:           Colors.surface.base,
  bgRaised:     Colors.surface.raised,
  bgOverlay:    Colors.surface.overlay,
  border:       Colors.surface.border,
  borderStrong: Colors.surface.borderStrong,
  primary:      Colors.green[500],
  primaryDark:  Colors.green[600],
  primaryLight: Colors.green[400],
  accent:       Colors.gold[400],
  accentDark:   Colors.gold[500],
  link:         Colors.blue[400],
  textPrimary:  Colors.text.primary,
  textSecondary:Colors.text.secondary,
  textMuted:    Colors.text.muted,
} as const;
