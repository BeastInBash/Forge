import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { Text } from '@/components/ui/text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useExercises } from '@/features/exercises/use-exercises';
import { usePlans } from '@/features/plans/use-plans';
import { useTheme } from '@/hooks/use-theme';
import { mondayIndex, startOfWeek, WEEKDAYS } from '@/lib/week';
import type { Weekday } from '@/types/training';

import { LibraryCard } from './components/library-card';
import { SplitDay } from './components/split-day';
import { WeekOverview } from './components/week-overview';

const dayMonth = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
});

/** The user's weekly split from forge-backend, and the exercise library. */
export function WorkoutsScreen() {
  const theme = useTheme();
  const [now] = useState(() => new Date());
  const today = WEEKDAYS[mondayIndex(now)];
  const [expanded, setExpanded] = useState<Weekday | undefined>(today);
  const router = useRouter();
  const { exercises, error, refresh: refreshExercises } = useExercises();
  const { plans, error: plansError, loading: plansLoading, refresh: refreshPlans } = usePlans();
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    await Promise.all([refreshPlans(), refreshExercises()]);
    setRefreshing(false);
  }

  const monday = startOfWeek(now);
  const days = WEEKDAYS.map((day, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return { day, date, plan: plans?.find((p) => p.day === day) };
  });
  const rangeLabel = `${dayMonth.format(days[0].date)} – ${dayMonth.format(days[6].date)}`;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={theme.textSecondary}
        />
      }>
      <WeekOverview days={days} today={today} rangeLabel={rangeLabel} />

      <View style={styles.section}>
        <Text variant="label" color="textSecondary" style={styles.sectionTitle}>
          YOUR SPLIT
        </Text>
        {plansLoading ? (
          <ActivityIndicator color={theme.textSecondary} style={styles.loading} />
        ) : plansError ? (
          <View style={[styles.error, { backgroundColor: theme.surface }]}>
            <Text variant="bodyStrong">Couldn’t load your plans</Text>
            <Text variant="label" color="textSecondary">
              {plansError}
            </Text>
            <Pressable
              onPress={refresh}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.retry,
                { borderColor: theme.line },
                pressed && { backgroundColor: theme.line },
              ]}>
              <Text variant="label">Try again</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.days}>
            {days.map(({ day, date, plan }) => (
              <SplitDay
                key={day}
                day={day}
                date={date.getDate()}
                plan={plan}
                isToday={day === today}
                expanded={expanded === day}
                onToggle={() => setExpanded((current) => (current === day ? undefined : day))}
                onEdit={() =>
                  router.push({ pathname: '/plan', params: plan ? { id: plan.id } : { day } })
                }
              />
            ))}
          </View>
        )}
      </View>

      <LibraryCard exercises={exercises} error={error} />
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
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    paddingHorizontal: Spacing.one,
    letterSpacing: 1.2,
    fontSize: 12,
  },
  days: {
    gap: Spacing.two,
  },
  loading: {
    paddingVertical: Spacing.five,
  },
  error: {
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
    borderWidth: 1,
    justifyContent: 'center',
  },
});
