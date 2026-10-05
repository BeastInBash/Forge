import type { ComponentProps } from 'react';
import type { Stack } from 'expo-router';

import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type StackScreenOptions = NonNullable<ComponentProps<typeof Stack>['screenOptions']>;

/** Native header styling shared by every tab's stack. */
export function useStackOptions(): Exclude<StackScreenOptions, (...args: never[]) => unknown> {
  const theme = useTheme();
  return {
    headerLargeTitle: true,
    headerShadowVisible: false,
    headerLargeTitleShadowVisible: false,
    headerStyle: { backgroundColor: theme.background },
    headerLargeStyle: { backgroundColor: theme.background },
    headerTintColor: theme.text,
    headerTitleStyle: { fontFamily: FontFamily.displayBold, fontSize: 22 },
    headerLargeTitleStyle: { fontFamily: FontFamily.display, fontSize: 40 },
    contentStyle: { backgroundColor: theme.background },
  };
}
