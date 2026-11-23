import { useSyncExternalStore } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

import { useThemePreference } from '@/lib/theme-preference';

const noSubscribe = () => () => {};

/**
 * The user's choice, or the browser's when set to "system". To support static rendering, this
 * value needs to be re-calculated on the client side for web.
 */
export function useColorScheme() {
  // False in the static render and while hydrating, true once running in the browser
  const hasHydrated = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
  const { preference } = useThemePreference();

  const system = useSystemColorScheme();

  if (!hasHydrated) return 'light';
  return preference === 'system' ? system : preference;
}
