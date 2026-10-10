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
    /** Soft putty — clay surfaces read as raised only against a mid-light, slightly tinted page. */
    background: '#E7EAF1',
    surface: '#F3F5FA',
    text: '#1B1F27',
    textSecondary: '#626A78',
    line: '#D3D8E2',
    /** Cast-iron panel used for the hero session card. */
    iron: '#2B313C',
    ironText: '#F3F5F8',
    ironTextSecondary: '#A3ACB9',
    ironLine: '#3D4552',
    /** Primary action colour — straw, the first tempering colour. */
    accent: '#F0C46A',
    onAccent: '#2A210C',
    /** Validation and failure messages — overheated steel. */
    danger: '#C24A36',
    /** A lift going up — the green of a quenched, sound piece. */
    up: '#2F8A5B',
    /** Light green fill for health actions (the body calculator), with its text colour. */
    mint: '#CDEBD8',
    onMint: '#163D29',
  },
  dark: {
    background: '#1C2027',
    surface: '#252A33',
    text: '#EEF0F4',
    textSecondary: '#9BA4B1',
    line: '#343B46',
    iron: '#2E3540',
    ironText: '#F3F5F8',
    ironTextSecondary: '#A3ACB9',
    ironLine: '#434C59',
    accent: '#F0C46A',
    onAccent: '#2A210C',
    danger: '#E8765F',
    up: '#5CC48C',
    mint: '#A9DBBD',
    onMint: '#11301F',
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
} as const;

export const Radius = {
  small: 12,
  medium: 20,
  large: 30,
  pill: 999,
} as const;

/**
 * Claymorphism. Every clay surface layers four shadows: a soft drop shadow down-right, a faint
 * glow up-left, and two inner shadows — a highlight on the top-left rim and a shade on the
 * bottom-right — which together make a flat fill read as a puffy, moulded body.
 *
 * `raised` is for cards, `soft` for small chips and secondary buttons, `sunken` for wells that
 * take input (fields, tracks, pressed buttons), and the tinted variants sit on accent or iron
 * fills where a white highlight would look chalky.
 */
export const Clay = {
  light: {
    raised: {
      boxShadow:
        '8px 10px 22px rgba(140, 150, 172, 0.45), -6px -6px 16px rgba(255, 255, 255, 0.85), inset 3px 3px 6px rgba(255, 255, 255, 0.9), inset -4px -4px 8px rgba(140, 150, 172, 0.22)',
    },
    soft: {
      boxShadow:
        '4px 5px 12px rgba(140, 150, 172, 0.4), -3px -3px 8px rgba(255, 255, 255, 0.85), inset 2px 2px 4px rgba(255, 255, 255, 0.9), inset -2px -3px 5px rgba(140, 150, 172, 0.2)',
    },
    sunken: {
      boxShadow:
        'inset 4px 4px 9px rgba(140, 150, 172, 0.42), inset -4px -4px 9px rgba(255, 255, 255, 0.9)',
    },
    accent: {
      boxShadow:
        '6px 8px 18px rgba(196, 146, 52, 0.42), -4px -4px 12px rgba(255, 255, 255, 0.75), inset 3px 3px 6px rgba(255, 246, 220, 0.85), inset -4px -5px 9px rgba(170, 118, 30, 0.35)',
    },
    iron: {
      boxShadow:
        '10px 12px 26px rgba(43, 49, 60, 0.38), -6px -6px 16px rgba(255, 255, 255, 0.8), inset 3px 3px 7px rgba(255, 255, 255, 0.14), inset -5px -5px 12px rgba(0, 0, 0, 0.35)',
    },
    /** For buttons sitting on an iron panel. */
    ironSoft: {
      boxShadow:
        '3px 4px 10px rgba(0, 0, 0, 0.35), inset 2px 2px 4px rgba(255, 255, 255, 0.12), inset -2px -3px 5px rgba(0, 0, 0, 0.3)',
    },
    /** For chips and wells sitting on an iron panel. */
    ironSunken: {
      boxShadow:
        'inset 3px 3px 7px rgba(0, 0, 0, 0.4), inset -3px -3px 6px rgba(255, 255, 255, 0.07)',
    },
  },
  dark: {
    raised: {
      boxShadow:
        '8px 10px 22px rgba(0, 0, 0, 0.5), -5px -5px 14px rgba(255, 255, 255, 0.035), inset 3px 3px 6px rgba(255, 255, 255, 0.07), inset -4px -4px 8px rgba(0, 0, 0, 0.3)',
    },
    soft: {
      boxShadow:
        '4px 5px 12px rgba(0, 0, 0, 0.45), -3px -3px 8px rgba(255, 255, 255, 0.03), inset 2px 2px 4px rgba(255, 255, 255, 0.07), inset -2px -3px 5px rgba(0, 0, 0, 0.28)',
    },
    sunken: {
      boxShadow:
        'inset 4px 4px 9px rgba(0, 0, 0, 0.45), inset -3px -3px 8px rgba(255, 255, 255, 0.045)',
    },
    accent: {
      boxShadow:
        '6px 8px 18px rgba(0, 0, 0, 0.5), inset 3px 3px 6px rgba(255, 246, 220, 0.7), inset -4px -5px 9px rgba(150, 100, 20, 0.45)',
    },
    iron: {
      boxShadow:
        '10px 12px 26px rgba(0, 0, 0, 0.55), -5px -5px 14px rgba(255, 255, 255, 0.035), inset 3px 3px 7px rgba(255, 255, 255, 0.1), inset -5px -5px 12px rgba(0, 0, 0, 0.35)',
    },
    ironSoft: {
      boxShadow:
        '3px 4px 10px rgba(0, 0, 0, 0.35), inset 2px 2px 4px rgba(255, 255, 255, 0.12), inset -2px -3px 5px rgba(0, 0, 0, 0.3)',
    },
    ironSunken: {
      boxShadow:
        'inset 3px 3px 7px rgba(0, 0, 0, 0.45), inset -3px -3px 6px rgba(255, 255, 255, 0.06)',
    },
  },
} as const;

export type ClayVariant = keyof typeof Clay.light;

export const MaxContentWidth = 640;
