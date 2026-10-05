import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Radius, Spacing, Temper } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Weekday, WorkoutPlan } from '@/types/training';

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

/** Rough session length: about three minutes per working set, rest included. */
const MINUTES_PER_SET = 3;

type Props = {
  day: Weekday;
  /** "Today", "Tomorrow" or the weekday name. */
  dayLabel: string;
  isToday: boolean;
  plan?: WorkoutPlan;
  onStart: () => void;
  onPlan: () => void;
};

export function SessionCard({ day, dayLabel, isToday, plan, onStart, onPlan }: Props) {
  const theme = useTheme();

  if (!plan) {
    return (
      <View style={[styles.card, { backgroundColor: theme.iron }]}>
        <View style={styles.body}>
          <Text variant="label" style={{ color: theme.ironTextSecondary }}>
            {dayLabel}
          </Text>
          <Text variant="hero" style={{ color: theme.ironText }}>
            Rest day
          </Text>
          <Text variant="body" style={[styles.restCopy, { color: theme.ironTextSecondary }]}>
            Nothing is planned for {day}. Recovery is where the strength gets built.
          </Text>
          <SecondaryButton label="Plan a workout" onPress={onPlan} />
        </View>
      </View>
    );
  }

  const totalSets = plan.exercises.reduce((sum, item) => sum + item.sets, 0);

  return (
    <View style={[styles.card, { backgroundColor: theme.iron }]}>
      <View style={[styles.temper, { backgroundColor: Temper[plan.split] }]} />
      <View style={styles.body}>
        <Text variant="label" style={{ color: theme.ironTextSecondary }}>
          {dayLabel} at {timeFormat.format(new Date(plan.time))}
        </Text>
        <Text variant="hero" style={{ color: theme.ironText }}>
          {plan.muscleGroup}
        </Text>

        <View style={styles.stats}>
          <Stat value={plan.exercises.length} unit="exercises" />
          <Stat value={totalSets} unit="sets" />
          <Stat value={totalSets * MINUTES_PER_SET} unit="min" />
        </View>

        <View style={[styles.list, { borderTopColor: theme.ironLine }]}>
          {plan.exercises.map((item) => (
            <View key={item.id} style={styles.exercise}>
              <Text variant="title" style={[styles.order, { color: theme.ironTextSecondary }]}>
                {item.order + 1}
              </Text>
              <Text variant="body" numberOfLines={1} style={[styles.name, { color: theme.ironText }]}>
                {item.exercise.name}
              </Text>
              <Text variant="label" style={{ color: theme.ironTextSecondary }}>
                {item.sets} × {item.repetition}
              </Text>
            </View>
          ))}
        </View>

        {isToday ? (
          <Pressable
            onPress={onStart}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.primary,
              { backgroundColor: theme.accent },
              pressed && styles.pressed,
            ]}>
            <Icon ios="play.fill" material="play_arrow" size={18} color={theme.onAccent} />
            <Text variant="bodyStrong" style={{ color: theme.onAccent }}>
              Start workout
            </Text>
          </Pressable>
        ) : (
          <SecondaryButton label="Edit plan" onPress={onPlan} />
        )}
      </View>
    </View>
  );
}

function Stat({ value, unit }: { value: number; unit: string }) {
  const theme = useTheme();
  return (
    <View style={styles.stat}>
      <Text variant="title" style={{ color: theme.ironText }}>
        {value}
      </Text>
      <Text variant="caption" style={{ color: theme.ironTextSecondary }}>
        {unit}
      </Text>
    </View>
  );
}

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.secondary,
        { borderColor: theme.ironLine },
        pressed && { backgroundColor: theme.ironLine },
      ]}>
      <Text variant="bodyStrong" style={{ color: theme.ironText }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  temper: {
    height: 6,
  },
  body: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  restCopy: {
    marginBottom: Spacing.three,
    maxWidth: 320,
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.four,
    marginTop: Spacing.one,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.one,
  },
  list: {
    marginTop: Spacing.three,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  exercise: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  order: {
    width: 20,
  },
  name: {
    flex: 1,
  },
  primary: {
    marginTop: Spacing.three,
    height: 52,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  secondary: {
    marginTop: Spacing.three,
    height: 52,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});
