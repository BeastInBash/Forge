import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { CSS_EASE_OUT } from '@/constants/motion';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { formatAmount } from '../nutrients';
import { remaining, type Target } from '../targets';
import { MACRO_COLORS } from './macro-bar';

const MACROS = [
  { key: 'protein', label: 'Protein' },
  { key: 'carbs', label: 'Carbs' },
  { key: 'fat', label: 'Fat' },
] as const;

type Macros = { protein: number; carbs: number; fat: number };

/** Each macro eaten today against its daily target: "49 / 120 g", what's left, and a bar. */
export function MacroTargets({
  macros,
  targets,
}: {
  macros: Macros;
  targets: Record<keyof Macros, Target>;
}) {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      {MACROS.map(({ key, label }) => {
        const target = targets[key];
        const { left, over, share } = remaining(macros[key], target);
        const status = over ? `${formatAmount(over)} g over` : `${formatAmount(left)} g left`;
        return (
          <View
            key={key}
            style={styles.row}
            accessible
            accessibilityLabel={`${label}: ${formatAmount(macros[key])} of ${target.amount} grams, ${status}`}>
            <View style={styles.head}>
              <View style={[styles.dot, { backgroundColor: MACRO_COLORS[key] }]} />
              <Text variant="label" style={{ color: theme.text }}>
                {label}
              </Text>
              <Text variant="label" style={[styles.amount, { color: theme.textSecondary }]}>
                {formatAmount(macros[key])} / {target.amount} g
              </Text>
              <Text variant="caption" style={{ color: over ? theme.danger : theme.textSecondary }}>
                {status}
              </Text>
            </View>
            <View style={[styles.track, { backgroundColor: theme.line }]}>
              <Animated.View
                style={[
                  styles.fill,
                  {
                    width: `${Math.min(100, share * 100)}%`,
                    backgroundColor: MACRO_COLORS[key],
                    transitionProperty: 'width',
                    transitionDuration: 400,
                    transitionTimingFunction: CSS_EASE_OUT,
                  },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.three,
  },
  row: {
    gap: Spacing.one + Spacing.half,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  amount: {
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
