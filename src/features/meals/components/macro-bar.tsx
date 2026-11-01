import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Spacing, Temper } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { formatAmount, macroSplit } from '../nutrients';

/** One tempering colour per macro, used wherever macros appear so each keeps its colour. */
export const MACRO_COLORS = {
  protein: Temper.upper,
  carbs: Temper.push,
  fat: Temper.legs,
} as const;

/** Readable text on each macro colour: white on the blue and violet, dark on the straw. */
export const MACRO_TEXT_COLORS = {
  protein: '#FFFFFF',
  carbs: '#2A210C',
  fat: '#FFFFFF',
} as const;

const MACROS = [
  { key: 'protein', label: 'Protein' },
  { key: 'carbs', label: 'Carbs' },
  { key: 'fat', label: 'Fat' },
] as const;

type Macros = { protein: number; carbs: number; fat: number };

/**
 * The share of calories from protein, carbs and fat as one split bar, with grams below.
 */
export function MacroBar({ macros }: { macros: Macros }) {
  const theme = useTheme();
  const split = macroSplit(macros);
  const empty = !macros.protein && !macros.carbs && !macros.fat;

  return (
    <View style={styles.wrap}>
      <View
        style={[styles.track, { backgroundColor: theme.line }]}
        accessible
        accessibilityLabel={MACROS.map(
          ({ key, label }) => `${label} ${formatAmount(macros[key])} grams`
        ).join(', ')}>
        {!empty &&
          MACROS.map(({ key }) =>
            split[key] > 0 ? (
              <View
                key={key}
                style={[styles.segment, { flex: split[key], backgroundColor: MACRO_COLORS[key] }]}
              />
            ) : null
          )}
      </View>
      <View style={styles.legend}>
        {MACROS.map(({ key, label }) => (
          <View key={key} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: MACRO_COLORS[key] }]} />
            <Text
              variant="caption"
              style={{ color: theme.textSecondary }}>
              {label}
            </Text>
            <Text variant="label" style={{ color: theme.text }}>
              {formatAmount(macros[key])} g
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.two,
  },
  track: {
    flexDirection: 'row',
    height: 8,
    gap: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  segment: {
    height: '100%',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: Spacing.three,
    rowGap: Spacing.one,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
});
