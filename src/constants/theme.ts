/**
 * Forge design tokens.
 *
 * The palette borrows from the forge itself: a cool mill-scale grey for the page, cast iron for
 * the one panel that matters most (today's session), and the oxide colours steel passes through
 * as it is tempered — straw, bronze, violet, blue — to tell muscle groups apart.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    background: '#ECEEF1',
    surface: '#FFFFFF',
    text: '#16191D',
    textSecondary: '#5E6570',
    line: '#D6DAE0',
    /** Cast-iron panel used for the hero session card. */
    iron: '#1F242B',
    ironText: '#F1F3F5',
    ironTextSecondary: '#9AA3AE',
    ironLine: '#343B44',
    /** Primary action colour — straw, the first tempering colour. */
    accent: '#E4B95B',
    onAccent: '#1F1A0E',
  },
  dark: {
    background: '#15181C',
    surface: '#1E2227',
    text: '#EEF0F3',
    textSecondary: '#97A0AB',
    line: '#2D333A',
    iron: '#262C34',
    ironText: '#F1F3F5',
    ironTextSecondary: '#9AA3AE',
    ironLine: '#3A424C',
    accent: '#E4B95B',
    onAccent: '#1F1A0E',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * Tempering colours, one per training split. Shared by the week strip and the session card so a
 * muscle group keeps the same colour everywhere it appears.
 */
export const Temper = {
  push: '#E4B95B',
  pull: '#C07F45',
  legs: '#8A5BA8',
  upper: '#4C78C2',
  lower: '#6FA8C9',
  rest: 'transparent',
} as const;

export type TemperKey = keyof typeof Temper;

/** Families registered by `useFonts` in the root layout. */
export const FontFamily = {
  display: 'BigShouldersDisplay_800ExtraBold',
  displayBold: 'BigShouldersDisplay_700Bold',
  body: 'Archivo_400Regular',
  bodyMedium: 'Archivo_500Medium',
  bodySemiBold: 'Archivo_600SemiBold',
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  small: 8,
  medium: 14,
  large: 24,
  pill: 999,
} as const;

export const MaxContentWidth = 640;
