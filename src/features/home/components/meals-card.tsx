import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { PressScale } from '@/components/ui/press-scale';
import { IconBadge } from '@/components/ui/icon-badge';
import { Text } from '@/components/ui/text';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import type { MealSummary } from '@/features/meals/api';
import { mealTimeInfo } from '@/features/meals/nutrients';
import { useSurface, useTheme } from '@/hooks/use-theme';

const numberFormat = new Intl.NumberFormat();
const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

/** Below this share of the calorie goal, the day's bar turns red. */
const VERY_LOW_SHARE = 0.25;

type Props = {
  /** Today's logged meals, earliest first; undefined while they load. */
  meals: MealSummary[] | undefined;
  /** Daily calorie target; without one the bar just shows how the day's calories split. */
  goal: number | undefined;
  error?: string;
  onLogMeal: () => void;
  onOpenMeal: (id: string) => void;
};

/**
 * Today's food against the calorie goal, from the meals the user logged. The bar is split per
 * meal, so each meal's share of the day reads at a glance; each row opens that meal's analysis.
 */
export function MealsCard({ meals, goal, error, onLogMeal, onOpenMeal }: Props) {
  const theme = useTheme();
  const surface = useSurface();
  const eaten = meals?.reduce((sum, meal) => sum + meal.total.calories, 0) ?? 0;
  // Past the goal the bar fills with what was eaten rather than overflowing.
  const scale = Math.max(goal ?? 0, eaten);
  // Without a goal there's nothing to call low, so the bar stays green
  const barColor = goal && eaten < goal * VERY_LOW_SHARE ? theme.danger : theme.up;

  return (
    <View style={[styles.card, { backgroundColor: theme.surface }, surface.raised]}>
      <View style={styles.header}>
        <IconBadge
          ios="fork.knife"
          material="restaurant"
          color={theme.text}
          background={theme.background}
          border={theme.line}
        />
        <Text variant="title" style={styles.heading}>
          Meals today
        </Text>
        <PressScale
          onPress={onLogMeal}
          accessibilityRole="button"
          hitSlop={8}
          style={[styles.log, { backgroundColor: theme.mint }, surface.accent]}
          pressedStyle={styles.pressed}>
          <Icon ios="plus" material="add" size={16} color={theme.onMint} />
          <Text variant="label" style={{ color: theme.onMint }}>
            Log meal
          </Text>
        </PressScale>
      </View>

      <View style={styles.total}>
        <Text variant="display">{numberFormat.format(eaten)}</Text>
        <Text variant="label" color="textSecondary">
          {goal ? `of ${numberFormat.format(goal)} kcal` : 'kcal'}
        </Text>
        {goal && eaten <= goal ? (
          <View style={[styles.left, { backgroundColor: theme.up }]}>
            <Text variant="caption" style={[styles.leftText, { color: theme.surface }]}>
              {numberFormat.format(goal - eaten)} left
            </Text>
          </View>
        ) : null}
      </View>

      <View
        style={[styles.bar, { backgroundColor: theme.line }]}
        accessible
        accessibilityLabel={
          goal ? `${eaten} of ${goal} calories eaten` : `${eaten} calories eaten`
        }>
        {scale > 0 &&
          meals?.map((meal) =>
            meal.total.calories > 0 ? (
              <View
                key={meal.id}
                style={[
                  styles.segment,
                  { flex: meal.total.calories / scale, backgroundColor: barColor },
                ]}
              />
            ) : null
          )}
        {scale > 0 && <View style={{ flex: Math.max(0, 1 - eaten / scale) }} />}
      </View>

      {!meals ? (
        error ? (
          <Text variant="label" color="textSecondary">
            {error}
          </Text>
        ) : (
          <ActivityIndicator color={theme.textSecondary} style={styles.loading} />
        )
      ) : meals.length === 0 ? (
        <Text variant="label" color="textSecondary">
          Nothing logged yet today. Log a meal to see its calories, macros and nutrients.
        </Text>
      ) : (
        <View style={styles.meals}>
          {meals.map((meal) => {
            const info = mealTimeInfo(meal.mealTime);
            return (
              <Pressable
                key={meal.id}
                onPress={() => onOpenMeal(meal.id)}
                accessibilityRole="button"
                accessibilityLabel={`${info.label}, ${meal.total.calories} calories: ${meal.foods.join(', ')}`}
                style={({ pressed }) => [
                  styles.meal,
                  { backgroundColor: pressed ? theme.line : theme.background },
                ]}>
                <IconBadge
                  {...info.icon}
                  size={36}
                  color={theme.up}
                  background={theme.surface}
                  border={theme.line}
                />
                <View style={styles.mealBody}>
                  <Text
                    variant="caption"
                    color="textSecondary"
                    numberOfLines={1}
                    style={styles.caps}>
                    {timeFormat.format(new Date(meal.eatenAt))} · {info.label}
                  </Text>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {meal.foods.join(', ')}
                  </Text>
                </View>
                <Text variant="label">{numberFormat.format(meal.total.calories)} kcal</Text>
                <Icon
                  ios="chevron.right"
                  material="chevron_right"
                  size={16}
                  color={theme.textSecondary}
                />
              </Pressable>
            );
          })}
        </View>
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
    gap: Spacing.two + Spacing.half,
  },
  heading: {
    flex: 1,
  },
  caps: {
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  log: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three - Spacing.one,
    height: 32,
    borderRadius: Radius.small,
  },
  total: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  left: {
    marginLeft: 'auto',
    alignSelf: 'center',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.small,
  },
  leftText: {
    fontFamily: FontFamily.bodySemiBold,
  },
  bar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    gap: 2,
  },
  segment: {
    height: '100%',
  },
  loading: {
    paddingVertical: Spacing.two,
  },
  meals: {
    gap: Spacing.two,
  },
  meal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - Spacing.one,
    padding: Spacing.three - Spacing.one,
    borderRadius: Radius.small,
    borderCurve: 'continuous',
  },
  pressed: {
    opacity: 0.7,
  },
  mealBody: {
    flex: 1,
    gap: Spacing.half,
  },
});
