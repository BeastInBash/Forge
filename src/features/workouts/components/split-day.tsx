import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Radius, Spacing, Temper } from '@/constants/theme';
import { ExerciseThumb } from '@/features/exercises/components/exercise-thumb';
import { useTheme } from '@/hooks/use-theme';
import type { Weekday, WorkoutPlan } from '@/types/training';

const timeFormat = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
});

type Props = {
  day: Weekday;
  date: number;
  plan?: WorkoutPlan;
  isToday: boolean;
  expanded: boolean;
  onToggle: () => void;
  /** Open the editor: a new plan for a rest day, or this day's plan. */
  onEdit: () => void;
};

/** "4 × 8 · 60 kg", or "3 × 12 · BW" for bodyweight. */
function prescription(sets: number, reps: number, weight?: number | null) {
  return `${sets} × ${reps} · ${weight == null ? 'BW' : `${weight} kg`}`;
}

/**
 * One day of the split. Training days show the muscle group, size and time, and expand to list
 * the exercises with an edit button; rest days stay a quiet single line that opens a new plan.
 */
export function SplitDay({ day, date, plan, isToday, expanded, onToggle, onEdit }: Props) {
  const theme = useTheme();
  const sets = plan?.exercises.reduce((sum, e) => sum + e.sets, 0) ?? 0;

  const dateBadge = (
    <View
      style={[
        styles.date,
        isToday ? { backgroundColor: theme.text } : { backgroundColor: theme.background },
      ]}>
      <Text variant="caption" style={{ color: isToday ? theme.background : theme.textSecondary }}>
        {day.slice(0, 3).toUpperCase()}
      </Text>
      <Text
        variant="title"
        style={[styles.dateNumber, { color: isToday ? theme.background : theme.text }]}>
        {date}
      </Text>
    </View>
  );

  if (!plan) {
    return (
      <Pressable
        onPress={onEdit}
        accessibilityRole="button"
        accessibilityLabel={`${day}, rest day. Plan a workout`}
        style={({ pressed }) => [
          styles.card,
          styles.restCard,
          { borderColor: theme.line },
          pressed && { backgroundColor: theme.surface },
        ]}>
        {dateBadge}
        <View style={styles.body}>
          <Text variant="bodyStrong" color="textSecondary">
            Rest day
          </Text>
          <Text variant="caption" color="textSecondary">
            {isToday ? 'Today · tap to plan a workout' : 'Tap to plan a workout'}
          </Text>
        </View>
        <View style={[styles.planPill, { borderColor: theme.line }]}>
          <Icon ios="plus" material="add" size={14} color={theme.text} />
          <Text variant="caption">Plan</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityLabel={`${day}, ${plan.muscleGroup}, ${plan.exercises.length} exercises`}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.surface },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.temper, { backgroundColor: Temper[plan.split] }]} />
      <View style={styles.main}>
        <View style={styles.header}>
          {dateBadge}
          <View style={styles.body}>
            <View style={styles.titleRow}>
              <Text variant="bodyStrong" numberOfLines={1} style={styles.title}>
                {plan.muscleGroup}
              </Text>
              {isToday && (
                <View style={[styles.todayPill, { backgroundColor: theme.accent }]}>
                  <Text variant="caption" style={{ color: theme.onAccent }}>
                    Today
                  </Text>
                </View>
              )}
            </View>
            <Text variant="caption" color="textSecondary">
              {timeFormat.format(new Date(plan.time))} · {plan.exercises.length} exercises · {sets}{' '}
              sets
            </Text>
          </View>
          <Icon
            ios={expanded ? 'chevron.up' : 'chevron.down'}
            material={expanded ? 'expand_less' : 'expand_more'}
            size={20}
            color={theme.textSecondary}
          />
        </View>

        {expanded && (
          <View style={[styles.list, { borderTopColor: theme.line }]}>
            {plan.exercises.map((item) => (
              <View key={item.id} style={styles.exercise}>
                <ExerciseThumb url={item.exercise.iconUrl ?? null} size={36} />
                <Text variant="body" numberOfLines={1} style={styles.exerciseName}>
                  {item.exercise.name}
                </Text>
                <Text variant="label" color="textSecondary">
                  {prescription(item.sets, item.repetition, item.weight)}
                </Text>
              </View>
            ))}
            <Pressable
              onPress={onEdit}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${day} plan`}
              style={({ pressed }) => [
                styles.edit,
                { borderColor: theme.line },
                pressed && { backgroundColor: theme.line },
              ]}>
              <Icon ios="pencil" material="edit" size={16} color={theme.text} />
              <Text variant="bodyStrong">Edit plan</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  restCard: {
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    paddingLeft: Spacing.three + 5,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  pressed: {
    opacity: 0.85,
  },
  temper: {
    width: 5,
  },
  main: {
    flex: 1,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  date: {
    width: 48,
    paddingVertical: Spacing.one + Spacing.half,
    borderRadius: Radius.small + 4,
    borderCurve: 'continuous',
    alignItems: 'center',
  },
  dateNumber: {
    fontSize: 20,
    lineHeight: 22,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.half,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    flexShrink: 1,
  },
  todayPill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.pill,
  },
  list: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.two,
  },
  exercise: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.one + Spacing.half,
  },
  planPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    paddingHorizontal: Spacing.two + Spacing.half,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  edit: {
    marginTop: Spacing.two,
    minHeight: 44,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  exerciseName: {
    flex: 1,
    minWidth: 0,
  },
});
