import { useColorScheme as useSystemColorScheme } from 'react-native';

import { useThemePreference } from '@/lib/theme-preference';

/** The scheme the app draws in: the user's choice, or the device's when set to "system". */
export function useColorScheme() {
  const { preference } = useThemePreference();
  const system = useSystemColorScheme();
  return preference === 'system' ? system : preference;
}
