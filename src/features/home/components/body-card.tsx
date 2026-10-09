import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { PressScale } from '@/components/ui/press-scale';
import { Text } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { bandColor } from '@/features/body/metrics';
import type { BodySummary } from '@/features/body/summary';
import { useClay, useTheme } from '@/hooks/use-theme';

const numberFormat = new Intl.NumberFormat();

type Props = {
  summary: BodySummary;
  loading: boolean;
  onOpen: () => void;
};

/**
 * Today's numbers for the body: BMI, maintenance calories and the target for the user's goal,
 * worked out from what they last saved. Tapping anywhere opens the calculator to update them.
 */
export function BodyCard({ summary, loading, onOpen }: Props) {
  const theme = useTheme();
  const clay = useClay();
  const nothingYet = summary.bmi === undefined && summary.maintenance === undefined;

  return (
    <View style={[styles.card, { backgroundColor: theme.surface }, clay.raised]}>
      <View style={styles.header}>
        <Text variant="title">Your body</Text>
        {summary.band && (
          <View style={[styles.band, { backgroundColor: bandColor(summary.band.band, theme) }]}>
            <Text variant="caption" style={styles.bandText}>
              {summary.band.label}
            </Text>
          </View>
        )}
      </View>

      {loading && nothingYet ? (
        <ActivityIndicator color={theme.textSecondary} style={styles.loading} />
      ) : nothingYet ? (
        <Text variant="label" color="textSecondary">
          Add your height, weight and age to see your BMI and how much to eat each day.
        </Text>
      ) : (
        <View style={styles.tiles}>
          <Tile
            label="BMI"
            value={summary.bmi === undefined ? '–' : summary.bmi.toFixed(1)}
          />
          <Tile
            label="Maintain"
            value={summary.maintenance === undefined ? '–' : numberFormat.format(summary.maintenance)}
            unit={summary.maintenance === undefined ? undefined : 'kcal'}
          />
          <Tile
            label={summary.goal?.label ?? 'Goal'}
            value={summary.goal ? numberFormat.format(summary.goal.calories) : '–'}
            unit={summary.goal ? 'kcal' : undefined}
            highlight={summary.goal !== undefined}
          />
        </View>
      )}

      {!nothingYet && (summary.maintenance === undefined || !summary.goal) && (
        <Text variant="caption" color="textSecondary">
          {summary.maintenance === undefined
            ? `Add your ${summary.missing.join(', ')} to see your daily calories.`
            : 'Pick a goal to see your daily target.'}
        </Text>
      )}

      <PressScale
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityHint="Opens the BMI and maintenance calorie calculator"
        style={[styles.button, { backgroundColor: theme.surface }, clay.soft]}
        pressedStyle={clay.sunken}>
        <Icon ios="scalemass.fill" material="monitor_weight" size={18} color={theme.text} />
        <Text variant="bodyStrong" numberOfLines={2} style={styles.buttonLabel}>
          Calculate BMI & Maintenance Calories
        </Text>
        <Icon ios="chevron.right" material="chevron_right" size={18} color={theme.textSecondary} />
      </PressScale>
    </View>
  );
}

function Tile({
  label,
  value,
  unit,
  highlight = false,
}: {
  label: string;
  value: string;
  unit?: string;
  highlight?: boolean;
}) {
  const theme = useTheme();
  const clay = useClay();
  return (
    <View
      style={[
        styles.tile,
        highlight
          ? [{ backgroundColor: theme.accent }, clay.accent]
          : [{ backgroundColor: theme.background }, clay.sunken],
      ]}>
      <Text
        variant="caption"
        numberOfLines={1}
        style={{ color: highlight ? theme.onAccent : theme.textSecondary }}>
        {label}
      </Text>
      <Text
        variant="title"
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{ color: highlight ? theme.onAccent : theme.text }}>
        {value}
      </Text>
      {unit && (
        <Text variant="caption" style={{ color: highlight ? theme.onAccent : theme.textSecondary }}>
          {unit}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  band: {
    paddingHorizontal: Spacing.two + Spacing.half,
    paddingVertical: Spacing.half + 1,
    borderRadius: Radius.pill,
    boxShadow:
      'inset 2px 2px 4px rgba(255, 255, 255, 0.4), inset -2px -3px 5px rgba(0, 0, 0, 0.25)',
  },
  bandText: {
    color: '#FFFFFF',
  },
  loading: {
    paddingVertical: Spacing.three,
  },
  tiles: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  tile: {
    flex: 1,
    minWidth: 0,
    paddingVertical: Spacing.two + Spacing.one,
    paddingHorizontal: Spacing.two + Spacing.half,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    gap: Spacing.half,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
  },
  buttonLabel: {
    flex: 1,
    minWidth: 0,
  },
});
