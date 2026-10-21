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
import Animated from 'react-native-reanimated';

import { SectionLabel } from '@/components/ui/section-label';
import { Text } from '@/components/ui/text';
import { enter } from '@/constants/motion';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useExercises } from '@/features/exercises/use-exercises';
import { usePlans } from '@/features/plans/use-plans';
import { useSurface, useTheme } from '@/hooks/use-theme';
import { mondayIndex, startOfWeek, WEEKDAYS } from '@/lib/week';
import type { Weekday } from '@/types/training';

import { LibraryCard } from './components/library-card';
import { SplitDay } from './components/split-day';
import { TemplatesEntry } from './components/templates-entry';
import { WeekOverview } from './components/week-overview';

const dayMonth = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
});

/** The user's weekly split from forge-backend, and the exercise library. */
export function WorkoutsScreen() {
  const theme = useTheme();
  const surface = useSurface();
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
      <Animated.View entering={enter(0)}>
        <WeekOverview days={days} today={today} rangeLabel={rangeLabel} />
      </Animated.View>

      <Animated.View entering={enter(1)} style={styles.section}>
        <SectionLabel icon={{ ios: 'calendar', material: 'calendar_month' }}>Your split</SectionLabel>
        <TemplatesEntry onPress={() => router.push('/templates')} />
        {plansLoading ? (
          <ActivityIndicator color={theme.textSecondary} style={styles.loading} />
        ) : plansError ? (
          <View style={[styles.error, { backgroundColor: theme.surface }, surface.raised]}>
            <Text variant="bodyStrong">Couldn’t load your plans</Text>
            <Text variant="label" color="textSecondary">
              {plansError}
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
        ) : (
          <View style={styles.days}>
            {days.map(({ day, date, plan }) => (
              <SplitDay
                // Rest and plan cards differ in key so switching between them mounts a new view:
                // Android failed to redraw the reused view after its rest-day styling was removed,
                // leaving a blank card until the screen was rebuilt.
                key={plan ? `${day}-${plan.id}` : `${day}-rest`}
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
      </Animated.View>

      <Animated.View entering={enter(2)}>
        <LibraryCard exercises={exercises} error={error} />
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
  section: {
    gap: Spacing.two,
  },
  days: {
    gap: Spacing.three,
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
    justifyContent: 'center',
  },
});
