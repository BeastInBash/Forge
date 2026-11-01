import type { ComponentProps } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { IconBadge } from '@/components/ui/icon-badge';
import { PressScale } from '@/components/ui/press-scale';
import { Text } from '@/components/ui/text';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { bandColor } from '@/features/body/metrics';
import type { BodySummary } from '@/features/body/summary';
import { useSurface, useTheme } from '@/hooks/use-theme';

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
  const surface = useSurface();
  const nothingYet = summary.bmi === undefined && summary.maintenance === undefined;

  return (
    <View style={[styles.card, { backgroundColor: theme.surface }, surface.raised]}>
      <View style={styles.header}>
        <IconBadge
          ios="figure.stand"
          material="accessibility_new"
          color={theme.text}
          background={theme.background}
          border={theme.line}
        />
        <Text variant="title" style={styles.heading}>
          Your body
        </Text>
        {summary.band && (
          <BandChip color={bandColor(summary.band.band, theme)} label={summary.band.label} />
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
          <View style={styles.tileRow}>
            <Tile
              half
              icon={{ ios: 'scalemass', material: 'monitor_weight' }}
              label="BMI"
              value={summary.bmi === undefined ? '–' : summary.bmi.toFixed(1)}
            />
            <Tile
              half
              icon={{ ios: 'flame', material: 'local_fire_department' }}
              label="Maintenance"
              value={
                summary.maintenance === undefined ? '–' : numberFormat.format(summary.maintenance)
              }
              unit={summary.maintenance === undefined ? undefined : 'kcal'}
            />
          </View>
          {/* The goal target gets its own full-width row: it's the number to eat to */}
          <Tile
            icon={{ ios: 'target', material: 'track_changes' }}
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
        style={[styles.button, { backgroundColor: theme.surface }, surface.soft]}
        pressedStyle={{ backgroundColor: theme.background }}>
        <Icon ios="plus.forwardslash.minus" material="calculate" size={20} color={theme.textSecondary} />
        <Text variant="bodyStrong" numberOfLines={2} style={styles.buttonLabel}>
          Calculate BMI & maintenance calories
        </Text>
        <Icon ios="chevron.right" material="chevron_right" size={18} color={theme.textSecondary} />
      </PressScale>
    </View>
  );
}

/** The BMI band as a flat chip: a tint of the band's colour with a dot and label in it. */
function BandChip({ color, label }: { color: string; label: string }) {
  return (
    <View style={[styles.band, { backgroundColor: `${color}1F`, borderColor: `${color}55` }]}>
      <View style={[styles.bandDot, { backgroundColor: color }]} />
      <Text variant="caption" style={[styles.bandText, { color }]}>
        {label}
      </Text>
    </View>
  );
}

function Tile({
  icon,
  label,
  value,
  unit,
  highlight = false,
  half = false,
}: {
  icon: Pick<ComponentProps<typeof Icon>, 'ios' | 'material'>;
  label: string;
  value: string;
  unit?: string;
  highlight?: boolean;
  /** One of two tiles sharing a row. */
  half?: boolean;
}) {
  const theme = useTheme();
  const surface = useSurface();
  const fg = highlight ? theme.onMint : theme.text;
  const muted = highlight ? theme.onMint : theme.textSecondary;
  return (
    <View
      style={[
        styles.tile,
        half && styles.half,
        highlight
          ? [{ backgroundColor: theme.mint }, surface.accent]
          : [{ backgroundColor: theme.surface }, surface.soft],
      ]}>
      <View style={styles.tileLabel}>
        <Icon {...icon} size={14} color={muted} />
        <Text variant="caption" numberOfLines={1} style={[styles.caps, { color: muted }]}>
          {label}
        </Text>
      </View>
      <View style={styles.tileValue}>
        <Text variant="title" numberOfLines={1} adjustsFontSizeToFit style={{ color: fg }}>
          {value}
        </Text>
        {unit && (
          <Text variant="caption" style={{ color: muted }}>
            {unit}
          </Text>
        )}
      </View>
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
    gap: Spacing.two + Spacing.half,
  },
  heading: {
    flex: 1,
  },
  band: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + Spacing.half,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half + 1,
    borderWidth: 1,
    borderRadius: Radius.small,
  },
  bandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bandText: {
    fontFamily: FontFamily.bodySemiBold,
  },
  loading: {
    paddingVertical: Spacing.three,
  },
  tiles: {
    gap: Spacing.two,
  },
  tileRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  /** Two equal tiles side by side. */
  half: {
    flex: 1,
    minWidth: 0,
  },
  tile: {
    paddingVertical: Spacing.three - Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.small,
    borderCurve: 'continuous',
    gap: Spacing.one,
  },
  tileLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + Spacing.half,
  },
  caps: {
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  tileValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.one,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.small,
    borderCurve: 'continuous',
  },
  buttonLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    lineHeight: 18,
  },
});
