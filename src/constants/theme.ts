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
    /** Soft grey page; cards sit on it as borderless white panels, no shadows. */
    background: '#F2F4F7',
    surface: '#FFFFFF',
    text: '#0F172A',
    textSecondary: '#64748B',
    line: '#E4E8EE',
    /** Cast-iron panel used for the hero session card. */
    iron: '#111827',
    ironText: '#F8FAFC',
    ironTextSecondary: '#94A3B8',
    ironLine: '#2A3343',
    /** Primary action colour — straw, the first tempering colour. */
    accent: '#F2C14E',
    onAccent: '#1F1806',
    /** Validation and failure messages — overheated steel. */
    danger: '#C2410C',
    /** A lift going up — the green of a quenched, sound piece. */
    up: '#1E7B4A',
    /** Light green fill for health actions (the body calculator), with its text colour. */
    mint: '#DFF3E6',
    onMint: '#14532D',
    /** Water intake: the goal ruler, droplet and hydration progress, with its tile tint. */
    water: '#2563EB',
    waterSoft: '#DBEAFE',
    /** Dims the page behind a centred dialog. */
    scrim: 'rgba(15, 23, 42, 0.45)',
  },
  dark: {
    background: '#0A0D12',
    surface: '#151B24',
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    line: '#263040',
    iron: '#1B2433',
    ironText: '#F8FAFC',
    ironTextSecondary: '#94A3B8',
    ironLine: '#334155',
    accent: '#F2C14E',
    onAccent: '#1F1806',
    danger: '#F0855F',
    up: '#4ADE80',
    mint: '#173A27',
    onMint: '#BBF0CF',
    water: '#60A5FA',
    waterSoft: '#172554',
    scrim: 'rgba(0, 0, 0, 0.6)',
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
  display: 'Roboto_800ExtraBold',
  displayBold: 'Roboto_700Bold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
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
  /** Side padding of every screen's content; a touch wider than `three` so cards can breathe. */
  screen: 20,
} as const;

/**
 * Soft, rounded corners: 10 for controls, inputs and icon tiles, 14 for cards, 18 for the hero
 * panels. `pill` makes capsules for chips and small round buttons.
 */
export const Radius = {
  small: 10,
  medium: 14,
  large: 18,
  pill: 999,
} as const;

/**
 * Soft & airy. Cards are borderless white panels on the grey page; controls keep a faint 1px
 * border so they still read when they sit straight on the page. Every variant sets the same
 * border width (transparent where invisible), so swapping one for another (a card's pressed
 * state) never shifts layout.
 *
 * `raised` is for cards, `soft` for chips and secondary buttons, `sunken` for wells that take
 * input (fields, tracks, pressed buttons), `accent` for straw fills, and the iron variants for
 * buttons and wells on the dark session panel.
 */
function surfaces(palette: (typeof Colors)['light'] | (typeof Colors)['dark']) {
  const border = (color: string) => ({ borderWidth: 1, borderColor: color });
  return {
    raised: border('transparent'),
    soft: border(palette.line),
    // Wells sit on the page colour; a button swapping to it on press reads as pressed in.
    sunken: { ...border(palette.line), backgroundColor: palette.background },
    accent: border('transparent'),
    iron: border('transparent'),
    ironSoft: border(palette.ironLine),
    ironSunken: border(palette.ironLine),
  };
}

export const Surfaces = {
  light: surfaces(Colors.light),
  dark: surfaces(Colors.dark),
};

export type SurfaceVariant = keyof typeof Surfaces.light;

export const MaxContentWidth = 640;
