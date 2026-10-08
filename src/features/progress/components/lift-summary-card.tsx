import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { ExerciseThumb } from '@/features/exercises/components/exercise-thumb';
import { useTheme } from '@/hooks/use-theme';

import type { LiftSummary } from '../api';
import { percentChange, relativeDay } from '../format';
import { describeSets, formatSet } from '../metrics';
import { Sparkline } from './sparkline';
import { TrendBadge } from './trend-badge';

type Props = {
  summary: LiftSummary;
  /** Position in the list, so sparklines draw one after another. */
  index: number;
  onPress: () => void;
};

/** One tracked exercise: its last session, best set and recent trend. */
export function LiftSummaryCard({ summary, index, onPress }: Props) {
  const theme = useTheme();
  const { exercise, last, best, trend, sessions } = summary;
  const change = percentChange(trend);
  const lineColor =
    change === undefined || Math.abs(change) < 0.05
      ? theme.textSecondary
      : change > 0
        ? theme.up
        : theme.danger;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint="Opens the lift's history and chart"
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.surface },
        pressed && styles.pressed,
      ]}>
      <View style={styles.top}>
        <ExerciseThumb url={exercise.iconUrl} size={48} />
        <View style={styles.title}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {exercise.name}
          </Text>
          <Text variant="caption" color="textSecondary">
            {relativeDay(last.performedAt)} · {sessions} {sessions === 1 ? 'session' : 'sessions'}
          </Text>
        </View>
        {trend.length > 1 && (
          <Sparkline values={trend} color={lineColor} delay={Math.min(index, 8) * 70} />
        )}
      </View>

      <View style={[styles.bottom, { borderTopColor: theme.line }]}>
        <View style={styles.stat}>
          <Text variant="caption" color="textSecondary">
            Last session
          </Text>
          <Text variant="label" numberOfLines={1}>
            {describeSets(last.sets)}
          </Text>
        </View>
        <View style={styles.statRight}>
          <Text variant="caption" color="textSecondary">
            Best set
          </Text>
          <Text variant="label" numberOfLines={1}>
            {best ? formatSet(best) : '–'}
          </Text>
        </View>
      </View>
      {change !== undefined && (
        <TrendBadge change={change} suffix={`over ${trend.length} sessions`} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    padding: Spacing.three,
    gap: Spacing.three,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  title: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.half,
  },
  bottom: {
    flexDirection: 'row',
    gap: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.three,
  },
  stat: {
    flex: 1.4,
    minWidth: 0,
    gap: Spacing.half,
  },
  statRight: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.half,
    alignItems: 'flex-end',
  },
});
