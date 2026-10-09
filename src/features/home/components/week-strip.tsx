import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Radius, Spacing, Temper } from '@/constants/theme';
import { useClay, useTheme } from '@/hooks/use-theme';
import type { Weekday, WorkoutPlan } from '@/types/training';

export type WeekDay = {
  day: Weekday;
  date: number;
  plan?: WorkoutPlan;
};

type Props = {
  days: WeekDay[];
  today: Weekday;
  selected: Weekday;
  onSelect: (day: Weekday) => void;
};

/**
 * Monday-to-Sunday strip. Each day carries a bar in its split's tempering colour; rest days get
 * an outline instead, so the shape of the week reads at a glance.
 */
export function WeekStrip({ days, today, selected, onSelect }: Props) {
  const theme = useTheme();
  const clay = useClay();

  return (
    <View style={styles.row} accessibilityRole="tablist">
      {days.map(({ day, date, plan }) => {
        const isSelected = day === selected;
        const isToday = day === today;
        const fg = theme.text;

        return (
          <Pressable
            key={day}
            onPress={() => onSelect(day)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${day}${isToday ? ', today' : ''}${plan ? `, ${plan.muscleGroup}` : ', rest day'}`}
            style={({ pressed }) => [
              styles.day,
              isSelected && [{ backgroundColor: theme.surface }, clay.raised],
              pressed && !isSelected && [{ backgroundColor: theme.background }, clay.sunken],
            ]}>
            <Text variant="caption" style={{ color: theme.textSecondary }}>
              {day.slice(0, 3)}
            </Text>
            <Text variant="title" style={{ color: fg }}>
              {date}
            </Text>
            <View
              style={[
                styles.bar,
                plan
                  ? { backgroundColor: Temper[plan.split] }
                  : { borderColor: theme.textSecondary, borderWidth: 1, opacity: 0.5 },
              ]}
            />
            {isToday && !isSelected ? (
              <View style={[styles.todayMark, { backgroundColor: theme.text }]} />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  day: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
    paddingTop: Spacing.two + Spacing.half,
    paddingBottom: Spacing.two + Spacing.one,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
  },
  bar: {
    width: 18,
    height: 4,
    borderRadius: Radius.pill,
  },
  todayMark: {
    position: 'absolute',
    top: 4,
    right: 8,
    width: 5,
    height: 5,
    borderRadius: Radius.pill,
  },
});
