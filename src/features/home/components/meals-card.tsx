import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useClay, useTheme } from '@/hooks/use-theme';
import type { MealTime } from '@/types/training';

const numberFormat = new Intl.NumberFormat();

function mealCalories(meal: MealTime) {
  return meal.foods.reduce((sum, food) => sum + food.calories, 0);
}

type Props = {
  meals: MealTime[];
  goal: number;
  onLogMeal: () => void;
};

/**
 * Today's food against the calorie goal. The bar is split per meal: logged meals are solid,
 * planned ones are faint, so what's eaten and what's still to come read in one line.
 */
export function MealsCard({ meals, goal, onLogMeal }: Props) {
  const theme = useTheme();
  const clay = useClay();
  const eaten = meals.filter((m) => m.logged).reduce((sum, m) => sum + mealCalories(m), 0);

  return (
    <View style={[styles.card, { backgroundColor: theme.surface }, clay.raised]}>
      <View style={styles.header}>
        <Text variant="title">Meals today</Text>
        <Pressable
          onPress={onLogMeal}
          accessibilityRole="button"
          hitSlop={8}
          style={({ pressed }) => [
            styles.log,
            { backgroundColor: theme.surface },
            pressed ? clay.sunken : clay.soft,
          ]}>
          <Icon ios="plus" material="add" size={16} color={theme.text} />
          <Text variant="label">Log meal</Text>
        </Pressable>
      </View>

      <View style={styles.total}>
        <Text variant="display">{numberFormat.format(eaten)}</Text>
        <Text variant="label" color="textSecondary">
          of {numberFormat.format(goal)} kcal
        </Text>
      </View>

      <View
        style={[styles.bar, { backgroundColor: theme.background }, clay.sunken]}
        accessible
        accessibilityLabel={`${eaten} of ${goal} calories eaten`}>
        {meals.map((meal) => (
          <View
            key={meal.id}
            style={[
              styles.segment,
              { flex: mealCalories(meal) / goal, backgroundColor: theme.text },
              !meal.logged && styles.planned,
            ]}
          />
        ))}
        <View style={{ flex: Math.max(0, 1 - meals.reduce((s, m) => s + mealCalories(m), 0) / goal) }} />
      </View>

      <View>
        {meals.map((meal, index) => (
          <View
            key={meal.id}
            style={[
              styles.meal,
              index > 0 && { borderTopColor: theme.line, borderTopWidth: StyleSheet.hairlineWidth },
            ]}>
            <Text variant="label" color="textSecondary" style={styles.time}>
              {meal.at}
            </Text>
            <View style={styles.mealBody}>
              <Text variant="bodyStrong" color={meal.logged ? 'text' : 'textSecondary'}>
                {meal.name}
              </Text>
              <Text variant="caption" color="textSecondary" numberOfLines={1}>
                {meal.foods.map((f) => f.name).join(', ')}
              </Text>
            </View>
            <Text variant="label" color={meal.logged ? 'text' : 'textSecondary'}>
              {mealCalories(meal)} kcal
            </Text>
            {meal.logged ? (
              <Icon ios="checkmark.circle.fill" material="check_circle" size={20} color={theme.text} />
            ) : (
              <Icon ios="circle" material="radio_button_unchecked" size={20} color={theme.line} />
            )}
          </View>
        ))}
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
    justifyContent: 'space-between',
  },
  log: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three - Spacing.one,
    height: 34,
    borderRadius: Radius.pill,
  },
  total: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  bar: {
    flexDirection: 'row',
    height: 14,
    padding: 3,
    borderRadius: Radius.pill,
    overflow: 'hidden',
    gap: 2,
  },
  segment: {
    height: '100%',
    borderRadius: Radius.pill,
  },
  planned: {
    opacity: 0.25,
  },
  meal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three - Spacing.one,
  },
  time: {
    width: 44,
  },
  mealBody: {
    flex: 1,
    gap: Spacing.half,
  },
});
