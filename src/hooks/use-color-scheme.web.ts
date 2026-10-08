import { useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

import { useThemePreference } from '@/lib/theme-preference';

/**
 * The user's choice, or the browser's when set to "system". To support static rendering, this
 * value needs to be re-calculated on the client side for web.
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const { preference } = useThemePreference();

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const system = useSystemColorScheme();

  if (!hasHydrated) return 'light';
  return preference === 'system' ? system : preference;
}
