/**
 * The active colour palette, read from context so the whole tree switches together when the
 * system appearance changes. `ThemeColorsProvider` sits in the root layout and is the only place
 * that subscribes to the colour scheme.
 */

import { createContext, use, type ReactNode } from 'react';

import { Colors } from '@/constants/theme';

type Palette = (typeof Colors)['light'] | (typeof Colors)['dark'];

const ThemeContext = createContext<Palette>(Colors.light);

export function ThemeColorsProvider({
  scheme,
  children,
}: {
  scheme: 'light' | 'dark';
  children: ReactNode;
}) {
  return <ThemeContext value={Colors[scheme]}>{children}</ThemeContext>;
}

export function useTheme() {
  return use(ThemeContext);
}
