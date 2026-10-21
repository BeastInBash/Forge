import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { enter } from '@/constants/motion';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useSession } from '@/features/auth/session';
import { summarize } from '@/features/body/summary';
import { useBody } from '@/features/body/use-body';
import { mealsOn } from '@/features/meals/today';
import { useMeals } from '@/features/meals/use-meals';
import { usePlans } from '@/features/plans/use-plans';
import { startSession, startSessionClock } from '@/features/session/session-store';
import { useWorkoutSession } from '@/features/session/use-session';
import { useTheme } from '@/hooks/use-theme';
import { mondayIndex, WEEKDAYS } from '@/lib/week';
import type { Weekday, WorkoutPlan } from '@/types/training';

import { BodyCard } from './components/body-card';
import { MealsCard } from './components/meals-card';
import { SessionCard } from './components/session-card';
import { WeekStrip, type WeekDay } from './components/week-strip';

const dateFormat = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

function buildWeek(now: Date, plans: WorkoutPlan[]): WeekDay[] {
  const monday = new Date(now);
  monday.setDate(now.getDate() - mondayIndex(now));
  return WEEKDAYS.map((day, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return { day, date: date.getDate(), plan: plans.find((p) => p.day === day) };
  });
}

function firstName(name: string | undefined) {
  return name?.trim().split(/\s+/)[0] || 'there';
}

function greeting(hour: number) {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { session } = useSession();
  const [now] = useState(() => new Date());
  const today = WEEKDAYS[mondayIndex(now)];
  const [selected, setSelected] = useState<Weekday>(today);
  const { plans, loading } = usePlans();
  const { session: workout } = useWorkoutSession();
  const body = useBody();
  const bodySummary = summarize(body.measurements ?? {}, body.prefs);
  const meals = useMeals();
  // The history is newest first; the card reads the day in order
  const mealsToday = meals.meals && mealsOn(meals.meals, now).reverse();

  const week = buildWeek(now, plans ?? []);
  const selectedPlan = week[WEEKDAYS.indexOf(selected)].plan;
  const selectedIndex = WEEKDAYS.indexOf(selected);
  const offset = selectedIndex - mondayIndex(now);
  const dayLabel = offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : selected;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}>
      <Animated.View entering={enter(0)} style={styles.intro}>
        <Text variant="label" color="textSecondary">
          {dateFormat.format(now)}
        </Text>
        <Text variant="title">
          {greeting(now.getHours())}, {firstName(session?.user.name)}
        </Text>
      </Animated.View>

      <Animated.View entering={enter(1)}>
        <WeekStrip days={week} today={today} selected={selected} onSelect={setSelected} />
      </Animated.View>

      <Animated.View entering={enter(2)}>
        <SessionCard
          day={selected}
          dayLabel={dayLabel}
          isToday={offset === 0}
          plan={selectedPlan}
          loading={loading}
          workout={workout && workout.planId === selectedPlan?.id ? workout : undefined}
          onStart={() => {
            if (selectedPlan) startSession(selectedPlan);
            // A session whose clock was reset shows "Start workout", so starting restarts the clock.
            if (workout && workout.clock.length === 0) startSessionClock();
            router.push('/workout');
          }}
          onPlan={() => router.navigate('/workouts')}
        />
      </Animated.View>

      <Animated.View entering={enter(3)}>
        <BodyCard
          summary={bodySummary}
          loading={body.loading}
          onOpen={() => router.push('/calculator')}
        />
      </Animated.View>

      <Animated.View entering={enter(4)}>
        <MealsCard
          meals={mealsToday}
          goal={bodySummary.goal?.calories ?? bodySummary.maintenance}
          error={meals.error}
          onLogMeal={() => router.push('/log-meal')}
          onOpenMeal={(mealId) => router.push({ pathname: '/meal/[mealId]', params: { mealId } })}
        />
      </Animated.View>
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
  intro: {
    gap: Spacing.half,
  },
});
