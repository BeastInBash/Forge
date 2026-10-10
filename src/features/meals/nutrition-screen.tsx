import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { summarize } from '@/features/body/summary';
import { useBody } from '@/features/body/use-body';
import { relativeDay } from '@/features/progress/format';
import { useClay, useTheme } from '@/hooks/use-theme';

import type { MealSummary } from './api';
import { MacroBar } from './components/macro-bar';
import { MealCard } from './components/meal-card';
import { localDay, mealsOn, sumMeals } from './today';
import { useMeals } from './use-meals';

const numberFormat = new Intl.NumberFormat();

/** Meals grouped by the day they were eaten, keeping the newest-first order. */
function byDay(meals: MealSummary[]) {
  const days: { key: string; label: string; meals: MealSummary[] }[] = [];
  for (const meal of meals) {
    const key = localDay(meal.eatenAt);
    const last = days[days.length - 1];
    if (last?.key === key) last.meals.push(meal);
    else days.push({ key, label: relativeDay(meal.eatenAt), meals: [meal] });
  }
  return days;
}

/** Today's food against the calorie goal, then every logged meal, newest first. */
export function NutritionScreen() {
  const theme = useTheme();
  const clay = useClay();
  const router = useRouter();
  const { meals, error, loading, refreshing, refresh, hasMore, loadingMore, loadMore } =
    useMeals();
  const body = useBody();
  const bodySummary = summarize(body.measurements ?? {}, body.prefs);
  const goal = bodySummary.goal?.calories ?? bodySummary.maintenance;

  const eaten = sumMeals(mealsOn(meals ?? [], new Date()));
  const days = meals ? byDay(meals) : [];

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.textSecondary} />
      }>
      <View style={[styles.hero, { backgroundColor: theme.iron }, clay.iron]}>
        <Text variant="label" style={{ color: theme.ironTextSecondary }}>
          Eaten today
        </Text>
        <View style={styles.heroTotal}>
          <Text variant="hero" style={{ color: theme.ironText }}>
            {numberFormat.format(eaten.calories)}
          </Text>
          <Text variant="label" style={{ color: theme.ironTextSecondary }}>
            {goal ? `of ${numberFormat.format(goal)} kcal` : 'kcal'}
          </Text>
        </View>
        {goal ? (
          <View
            style={[styles.goalTrack, { backgroundColor: theme.ironLine }, clay.ironSunken]}
            accessible
            accessibilityLabel={`${eaten.calories} of ${goal} calories eaten`}>
            <View
              style={[
                styles.goalFill,
                {
                  width: `${Math.min(100, (eaten.calories / goal) * 100)}%`,
                  backgroundColor: theme.accent,
                },
              ]}
            />
          </View>
        ) : null}
        <MacroBar macros={eaten} onIron />
        <Pressable
          onPress={() => router.push('/log-meal')}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.primary,
            { backgroundColor: theme.accent },
            pressed ? [styles.pressed, clay.sunken] : clay.accent,
          ]}>
          <Icon ios="plus" material="add" size={18} color={theme.onAccent} />
          <Text variant="bodyStrong" style={{ color: theme.onAccent }}>
            Log a meal
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={theme.textSecondary} style={styles.loading} />
      ) : error ? (
        <View style={[styles.message, { backgroundColor: theme.surface }, clay.raised]}>
          <Text variant="bodyStrong">Couldn’t load your meals</Text>
          <Text variant="label" color="textSecondary">
            {error}
          </Text>
          <Pressable
            onPress={refresh}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.retry,
              { backgroundColor: theme.surface },
              pressed ? clay.sunken : clay.soft,
            ]}>
            <Text variant="label">Try again</Text>
          </Pressable>
        </View>
      ) : days.length ? (
        <>
          {days.map((day, dayIndex) => (
            <View key={day.key} style={styles.section}>
              <View style={styles.dayHeader}>
                <Text variant="label" color="textSecondary" style={styles.sectionTitle}>
                  {day.label.toUpperCase()}
                </Text>
                <Text variant="caption" color="textSecondary">
                  {numberFormat.format(day.meals.reduce((sum, m) => sum + m.total.calories, 0))}{' '}
                  kcal
                </Text>
              </View>
              {day.meals.map((meal, index) => (
                <Animated.View
                  key={meal.id}
                  entering={
                    dayIndex === 0 && index < 6
                      ? FadeInDown.delay(index * 50).duration(300)
                      : undefined
                  }>
                  <MealCard
                    meal={meal}
                    onPress={() =>
                      router.push({ pathname: '/meal/[mealId]', params: { mealId: meal.id } })
                    }
                  />
                </Animated.View>
              ))}
            </View>
          ))}
          {hasMore && (
            <Pressable
              onPress={loadMore}
              disabled={loadingMore}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.more,
                { backgroundColor: theme.surface },
                pressed ? clay.sunken : clay.soft,
              ]}>
              {loadingMore ? (
                <ActivityIndicator color={theme.textSecondary} />
              ) : (
                <Text variant="label">Load older meals</Text>
              )}
            </Pressable>
          )}
        </>
      ) : (
        <View style={[styles.message, { backgroundColor: theme.surface }, clay.raised]}>
          <Icon ios="fork.knife" material="restaurant" size={28} color={theme.textSecondary} />
          <Text variant="bodyStrong">No meals yet</Text>
          <Text variant="label" color="textSecondary">
            Write what you ate and how much, like “Chicken, 250g cooked”. Forge estimates the
            calories, macros, vitamins and minerals for you.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
  },
  hero: {
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  heroTotal: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
    marginTop: -Spacing.two,
  },
  goalTrack: {
    height: 14,
    padding: 3,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  goalFill: {
    height: '100%',
    borderRadius: Radius.pill,
  },
  primary: {
    marginTop: Spacing.one,
    height: 52,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  section: {
    gap: Spacing.three,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.one,
  },
  sectionTitle: {
    letterSpacing: 1.2,
    fontSize: 12,
  },
  loading: {
    paddingVertical: Spacing.five,
  },
  message: {
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  retry: {
    alignSelf: 'flex-start',
    marginTop: Spacing.two,
    minHeight: 40,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    justifyContent: 'center',
  },
  more: {
    alignSelf: 'center',
    minHeight: 44,
    minWidth: 180,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
