import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Segmented } from '@/components/ui/segmented';
import { Text } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import {
  setThemePreference,
  useThemePreference,
  type ThemePreference,
} from '@/lib/theme-preference';

import { Section } from './section';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

/** Light, dark, or follow the device. */
export function AppearanceSection() {
  const theme = useTheme();
  const { preference } = useThemePreference();
  const dark = useColorScheme() === 'dark';

  return (
    <Section title="Appearance">
      <View style={styles.body}>
        <View style={styles.header}>
          <View style={[styles.iconTile, { backgroundColor: theme.background }]}>
            <Icon
              ios={dark ? 'moon.fill' : 'sun.max.fill'}
              material={dark ? 'dark_mode' : 'light_mode'}
              size={18}
              color={theme.text}
            />
          </View>
          <View style={styles.text}>
            <Text variant="bodyStrong">Theme</Text>
            <Text variant="caption" color="textSecondary">
              {preference === 'system'
                ? `Following your device · ${dark ? 'dark' : 'light'} now`
                : `Always ${preference}`}
            </Text>
          </View>
        </View>
        <Segmented
          options={OPTIONS}
          value={preference}
          onChange={setThemePreference}
          accessibilityLabel="Theme"
        />
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingVertical: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: Radius.small + 4,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.half,
  },
});
