import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useSession } from '@/features/auth/session';
import { useTheme } from '@/hooks/use-theme';
import { mondayIndex, WEEKDAYS } from '@/lib/week';
import type { Weekday } from '@/types/training';

import { MealsCard } from './components/meals-card';
import { SessionCard } from './components/session-card';
import { WeekStrip, type WeekDay } from './components/week-strip';
import { SAMPLE_MEALS, SAMPLE_USER, SAMPLE_WEEK } from './data';

const dateFormat = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

function buildWeek(now: Date): WeekDay[] {
  const monday = new Date(now);
  monday.setDate(now.getDate() - mondayIndex(now));
  return WEEKDAYS.map((day, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return { day, date: date.getDate(), plan: SAMPLE_WEEK.find((p) => p.day === day) };
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

  const week = buildWeek(now);
  const selectedIndex = WEEKDAYS.indexOf(selected);
  const offset = selectedIndex - mondayIndex(now);
  const dayLabel = offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : selected;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}>
      <View style={styles.intro}>
        <Text variant="label" color="textSecondary">
          {dateFormat.format(now)}
        </Text>
        <Text variant="title">
          {greeting(now.getHours())}, {firstName(session?.user.name)}
        </Text>
      </View>

      <WeekStrip days={week} today={today} selected={selected} onSelect={setSelected} />

      <SessionCard
        day={selected}
        dayLabel={dayLabel}
        isToday={offset === 0}
        plan={week[selectedIndex].plan}
        onStart={() => router.navigate('/workouts')}
        onPlan={() => router.navigate('/workouts')}
      />

      <MealsCard
        meals={SAMPLE_MEALS}
        goal={SAMPLE_USER.dailyCalorieGoal}
        onLogMeal={() => router.navigate('/nutrition')}
      />
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
  intro: {
    gap: Spacing.half,
  },
});
