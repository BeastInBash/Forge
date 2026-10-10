import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Radius, Spacing, Temper } from '@/constants/theme';
import { useClay, useTheme } from '@/hooks/use-theme';

import { formatAmount, macroSplit } from '../nutrients';

/** One tempering colour per macro, used wherever macros appear so each keeps its colour. */
export const MACRO_COLORS = {
  protein: Temper.upper,
  carbs: Temper.push,
  fat: Temper.legs,
} as const;

const MACROS = [
  { key: 'protein', label: 'Protein' },
  { key: 'carbs', label: 'Carbs' },
  { key: 'fat', label: 'Fat' },
] as const;

type Macros = { protein: number; carbs: number; fat: number };

/**
 * The share of calories from protein, carbs and fat as one split bar, with grams below. `onIron`
 * switches the text and track to sit on the cast-iron panel.
 */
export function MacroBar({ macros, onIron = false }: { macros: Macros; onIron?: boolean }) {
  const theme = useTheme();
  const clay = useClay();
  const split = macroSplit(macros);
  const empty = !macros.protein && !macros.carbs && !macros.fat;

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.track,
          { backgroundColor: onIron ? theme.ironLine : theme.background },
          onIron ? clay.ironSunken : clay.sunken,
        ]}
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
              style={{ color: onIron ? theme.ironTextSecondary : theme.textSecondary }}>
              {label}
            </Text>
            <Text variant="label" style={{ color: onIron ? theme.ironText : theme.text }}>
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
    height: 12,
    padding: 2,
    gap: 2,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  segment: {
    height: '100%',
    borderRadius: Radius.pill,
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
    borderRadius: Radius.pill,
  },
});
