import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Radius, Spacing, Temper } from '@/constants/theme';
import { useSurface, useTheme } from '@/hooks/use-theme';
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
 * Monday-to-Sunday strip on a flat card. Each day carries a bar in its split's tempering colour;
 * rest days get an outline instead, so the shape of the week reads at a glance. The selected day
 * is a mint tile.
 */
export function WeekStrip({ days, today, selected, onSelect }: Props) {
  const theme = useTheme();
  const surface = useSurface();

  return (
    <View
      style={[styles.row, { backgroundColor: theme.surface }, surface.raised]}
      accessibilityRole="tablist">
      {days.map(({ day, date, plan }) => {
        const isSelected = day === selected;
        const isToday = day === today;
        const fg = isSelected ? theme.onMint : theme.text;

        return (
          <Pressable
            key={day}
            onPress={() => onSelect(day)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${day}${isToday ? ', today' : ''}${plan ? `, ${plan.muscleGroup}` : ', rest day'}`}
            style={({ pressed }) => [
              styles.day,
              isSelected && { backgroundColor: theme.mint },
              pressed && !isSelected && { backgroundColor: theme.background },
            ]}>
            <Text
              variant="caption"
              style={[styles.weekday, { color: isSelected ? fg : theme.textSecondary }]}>
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
    padding: Spacing.one + Spacing.half,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
  },
  weekday: {
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  day: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
    paddingTop: Spacing.two + Spacing.half,
    paddingBottom: Spacing.two + Spacing.one,
    borderRadius: Radius.small,
    borderCurve: 'continuous',
  },
  bar: {
    width: 18,
    height: 4,
    borderRadius: 2,
  },
  todayMark: {
    position: 'absolute',
    top: 4,
    right: 8,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});
