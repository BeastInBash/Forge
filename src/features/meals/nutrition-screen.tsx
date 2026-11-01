import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { Icon } from '@/components/ui/icon';
import { PressScale } from '@/components/ui/press-scale';
import { IconBadge } from '@/components/ui/icon-badge';
import { SectionLabel } from '@/components/ui/section-label';
import { Text } from '@/components/ui/text';
import { CSS_EASE_OUT, enter, reflow } from '@/constants/motion';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { summarize } from '@/features/body/summary';
import { useBody } from '@/features/body/use-body';
import { relativeDay } from '@/features/progress/format';
import { WaterGoalCard } from '@/features/water/components/water-goal-card';
import { useWaterGoal } from '@/features/water/use-water-goal';
import { useSurface, useTheme } from '@/hooks/use-theme';

import type { MealSummary } from './api';
import { MacroBar } from './components/macro-bar';
import { MacroTargets } from './components/macro-targets';
import { MealCard } from './components/meal-card';
import { NutrientTargetsCard } from './components/nutrient-targets-card';
import { dailyTargets } from './targets';
import { localDay, mealsOn, sumMeals } from './today';
import { useMealDay, useMeals } from './use-meals';

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
  const surface = useSurface();
  const router = useRouter();
  const { meals, error, loading, refreshing, refresh, hasMore, loadingMore, loadMore } =
    useMeals();
  const body = useBody();
  const water = useWaterGoal();
  const { day, refresh: refreshDay } = useMealDay();
  const bodySummary = summarize(body.measurements ?? {}, body.prefs);
  const goal = bodySummary.goal?.calories ?? bodySummary.maintenance;
  const targets = dailyTargets({
    calories: goal,
    measurements: body.measurements,
    sex: body.prefs.sex,
  });
  const { protein, carbs, fat } = targets;

  // The backend's day totals; until they load, the history's meals from today add up the same
  const eaten = day
    ? {
        calories: day.total.energy.calories ?? 0,
        protein: day.total.macros.protein ?? 0,
        carbs: day.total.macros.carbs ?? 0,
        fat: day.total.macros.fat ?? 0,
      }
    : sumMeals(mealsOn(meals ?? [], new Date()));
  const days = meals ? byDay(meals) : [];

  function refreshAll() {
    refreshDay();
    return refresh();
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refreshAll}
          tintColor={theme.textSecondary}
        />
      }>
      <Animated.View
        entering={enter(0)}
        style={[styles.hero, { backgroundColor: theme.surface }, surface.raised]}>
        <View style={styles.eyebrow}>
          <IconBadge
            ios="flame"
            material="local_fire_department"
            color={theme.text}
            background={theme.background}
            border={theme.line}
          />
          <Text variant="caption" style={[styles.caps, { color: theme.textSecondary }]}>
            Eaten today
          </Text>
        </View>
        <View style={styles.heroTotal}>
          <Text variant="hero" style={{ color: theme.text }}>
            {numberFormat.format(eaten.calories)}
          </Text>
          <Text variant="label" style={{ color: theme.textSecondary }}>
            {goal ? `of ${numberFormat.format(goal)} kcal` : 'kcal'}
          </Text>
        </View>
        {goal ? (
          <View
            style={[styles.goalTrack, { backgroundColor: theme.line }]}
            accessible
            accessibilityLabel={`${eaten.calories} of ${goal} calories eaten`}>
            {/* A childless fill in a clipped track, so easing its width re-lays out nothing else. */}
            <Animated.View
              style={[
                styles.goalFill,
                {
                  width: `${Math.min(100, (eaten.calories / goal) * 100)}%`,
                  backgroundColor: theme.accent,
                  transitionProperty: 'width',
                  transitionDuration: 400,
                  transitionTimingFunction: CSS_EASE_OUT,
                },
              ]}
            />
          </View>
        ) : null}
        {protein && carbs && fat ? (
          <MacroTargets macros={eaten} targets={{ protein, carbs, fat }} />
        ) : (
          <>
            <MacroBar macros={eaten} />
            {!body.loading && bodySummary.missing.length ? (
              <Pressable
                onPress={() => router.push('/calculator')}
                accessibilityRole="button"
                style={styles.setup}>
                <Icon ios="target" material="track_changes" size={14} color={theme.textSecondary} />
                <Text variant="caption" color="textSecondary" style={styles.setupText}>
                  Add your {bodySummary.missing.join(', ')} to see daily protein, carb and fat
                  targets
                </Text>
                <Icon
                  ios="chevron.right"
                  material="chevron_right"
                  size={14}
                  color={theme.textSecondary}
                />
              </Pressable>
            ) : null}
          </>
        )}
        <PressScale
          onPress={() => router.push('/log-meal')}
          accessibilityRole="button"
          style={[styles.primary, { backgroundColor: theme.accent }, surface.accent]}
          pressedStyle={styles.pressed}>
          <Icon ios="plus" material="add" size={18} color={theme.onAccent} />
          <Text variant="bodyStrong" style={{ color: theme.onAccent }}>
            Log a meal
          </Text>
        </PressScale>
      </Animated.View>

      {day ? (
        <Animated.View entering={enter(1)}>
          <NutrientTargetsCard day={day} targets={targets} />
        </Animated.View>
      ) : null}

      <Animated.View entering={enter(1)} layout={reflow}>
        <WaterGoalCard goal={water.goal} onPress={() => router.push('/water-goal')} />
      </Animated.View>

      {loading ? (
        <ActivityIndicator color={theme.textSecondary} style={styles.loading} />
      ) : error ? (
        <View style={[styles.message, { backgroundColor: theme.surface }, surface.raised]}>
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
              pressed ? surface.sunken : surface.soft,
            ]}>
            <Text variant="label">Try again</Text>
          </Pressable>
        </View>
      ) : days.length ? (
        <>
          {days.map((day, dayIndex) => (
            <View key={day.key} style={styles.section}>
              <SectionLabel
                icon={{ ios: 'calendar', material: 'calendar_today' }}
                trailing={
                  <Text variant="caption" color="textSecondary">
                    {numberFormat.format(day.meals.reduce((sum, m) => sum + m.total.calories, 0))}{' '}
                    kcal
                  </Text>
                }>
                {day.label}
              </SectionLabel>
              {day.meals.map((meal, index) => (
                <Animated.View
                  key={meal.id}
                  entering={
                    dayIndex === 0 && index < 6 ? enter(index + 2) : undefined
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
                pressed ? surface.sunken : surface.soft,
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
        <View style={[styles.message, { backgroundColor: theme.surface }, surface.raised]}>
          <IconBadge
            ios="fork.knife"
            material="restaurant"
            size={44}
            color={theme.up}
            background={theme.mint}
          />
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
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.five,
  },
  hero: {
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + Spacing.half,
  },
  caps: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroTotal: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  goalTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  goalFill: {
    height: '100%',
  },
  setup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + Spacing.half,
  },
  setupText: {
    flex: 1,
  },
  primary: {
    marginTop: Spacing.one,
    height: 52,
    borderRadius: Radius.small,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.85,
  },
  section: {
    gap: Spacing.three,
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
