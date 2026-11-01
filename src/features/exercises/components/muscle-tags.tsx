import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { MuscleTargets } from '../muscles';

/**
 * The muscles an exercise works, as small chips: primary in mint, secondary in grey. Renders
 * nothing when none are set.
 */
export function MuscleTags({ targets, max }: { targets: MuscleTargets; max?: number }) {
  const theme = useTheme();
  const all = [
    ...targets.primary.map((muscle) => ({ muscle, primary: true })),
    ...targets.secondary.map((muscle) => ({ muscle, primary: false })),
  ];
  if (all.length === 0) return null;
  const shown = max === undefined ? all : all.slice(0, max);
  const hidden = all.length - shown.length;

  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={
        `Targets ${targets.primary.join(', ')}` +
        (targets.secondary.length ? `; also ${targets.secondary.join(', ')}` : '')
      }>
      {shown.map(({ muscle, primary }) => (
        <View
          key={muscle}
          style={[styles.chip, { backgroundColor: primary ? theme.mint : theme.background }]}>
          <Text variant="caption" style={{ color: primary ? theme.onMint : theme.textSecondary }}>
            {muscle}
          </Text>
        </View>
      ))}
      {hidden > 0 && (
        <Text variant="caption" color="textSecondary" style={styles.more}>
          +{hidden}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.one,
  },
  chip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.pill,
  },
  more: {
    paddingHorizontal: Spacing.one,
  },
});
