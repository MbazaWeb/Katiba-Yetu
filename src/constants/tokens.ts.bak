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
    50:  '#F0F5EF',
    100: '#DCE9DA',
    200: '#BCD3B8',
    300: '#91B28A',
    400: '#628E5C',
    500: '#356B3F',
    600: '#285735',
    700: '#1F452C',
    800: '#173523',
    900: '#10271B',
  },
  gold: {
    50:  '#FBF6E8',
    100: '#F4E9C9',
    200: '#E8D39A',
    300: '#D6B765',
    400: '#B88B32',
    500: '#966E24',
    600: '#79561C',
    700: '#5D4119',
    800: '#443016',
    900: '#302312',
  },
  blue: {
    50:  '#EEF4F5',
    100: '#D8E7EA',
    200: '#AECBD1',
    300: '#7EABB4',
    400: '#4D8490',
    500: '#356C77',
    600: '#2B5862',
    700: '#23464E',
    800: '#1A353C',
    900: '#12272C',
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
    base:    '#F3F0E8',
    raised:  '#FFFEFA',
    overlay: '#EAE6DC',
    border:  '#DDD7CA',
    borderStrong: '#C9C1B2',
  },
  text: {
    primary:   '#20231F',
    secondary: '#555A52',
    muted:     '#7A7D74',
    inverse:   '#FFFEFA',
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
  xl:   12,
  '2xl': 16,
  '3xl': 20,
  full: 9999,
} as const;

export const Shadow = {
  // iOS-style layered shadows — subtle, refined
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 14,
    elevation: 4,
  },
  glow: {
    // Green glow for primary elements
    shadowColor: '#0D7A3F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 2,
  },
  goldGlow: {
    shadowColor: '#D4A80A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.10,
    shadowRadius: 5,
    elevation: 2,
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
