import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useClay, useTheme } from '@/hooks/use-theme';

import type { MealSummary } from '../api';
import { formatAmount, mealTimeInfo } from '../nutrients';
import { MACRO_COLORS } from './macro-bar';

const time = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

/** One meal in the history: when, what, and its calories and macros. */
export function MealCard({ meal, onPress }: { meal: MealSummary; onPress: () => void }) {
  const theme = useTheme();
  const clay = useClay();
  const info = mealTimeInfo(meal.mealTime);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${info.label} at ${time.format(new Date(meal.eatenAt))}, ${meal.total.calories} calories: ${meal.foods.join(', ')}`}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.surface },
        pressed ? [clay.sunken, styles.pressed] : clay.raised,
      ]}>
      <View style={[styles.badge, { backgroundColor: theme.background }, clay.sunken]}>
        <Icon ios={info.icon.ios} material={info.icon.material} size={20} color={theme.text} />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text variant="bodyStrong">{info.label}</Text>
          <Text variant="caption" color="textSecondary">
            {time.format(new Date(meal.eatenAt))}
          </Text>
        </View>
        <Text variant="label" color="textSecondary" numberOfLines={1}>
          {meal.foods.join(', ')}
        </Text>
        <View style={styles.macros}>
          {(['protein', 'carbs', 'fat'] as const).map((key) => (
            <View key={key} style={styles.macro}>
              <View style={[styles.dot, { backgroundColor: MACRO_COLORS[key] }]} />
              <Text variant="caption" color="textSecondary">
                {key[0].toUpperCase()} {formatAmount(meal.total[key])}g
              </Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.kcal}>
        <Text variant="title">{meal.total.calories}</Text>
        <Text variant="caption" color="textSecondary">
          kcal
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.large,
    borderCurve: 'continuous',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.half,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  macros: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.half,
  },
  macro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: Radius.pill,
  },
  kcal: {
    alignItems: 'flex-end',
  },
});
