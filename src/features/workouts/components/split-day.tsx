import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Radius, Spacing, Temper } from '@/constants/theme';
import { ExerciseThumb } from '@/features/exercises/components/exercise-thumb';
import { MuscleTags } from '@/features/exercises/components/muscle-tags';
import { targetsOf } from '@/features/exercises/muscles';
import { useCatalogExercise } from '@/features/exercises/use-exercises';
import { plural } from '@/lib/plural';
import { useSurface, useTheme } from '@/hooks/use-theme';
import type { Weekday, WorkoutExercise, WorkoutPlan } from '@/types/training';

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

/** "4 × 8 · 60 kg", or "3 × 12" when no weight is set. */
function prescription(sets: number, reps: number, weight?: number | null) {
  return weight == null ? `${sets} × ${reps}` : `${sets} × ${reps} · ${weight} kg`;
}

/**
 * One day of the split. Training days show the muscle group, size and time, and expand to list
 * the exercises with an edit button; rest days stay a quiet single line that opens a new plan.
 */
export function SplitDay({ day, date, plan, isToday, expanded, onToggle, onEdit }: Props) {
  const theme = useTheme();
  const surface = useSurface();
  const sets = plan?.exercises.reduce((sum, e) => sum + e.sets, 0) ?? 0;

  const dateBadge = (
    <View
      style={[
        styles.date,
        isToday
          ? [{ backgroundColor: theme.accent }, surface.accent]
          : [{ backgroundColor: theme.background }, surface.sunken],
      ]}>
      <Text variant="caption" style={{ color: isToday ? theme.onAccent : theme.textSecondary }}>
        {day.slice(0, 3).toUpperCase()}
      </Text>
      <Text
        variant="title"
        style={[styles.dateNumber, { color: isToday ? theme.onAccent : theme.text }]}>
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
          { backgroundColor: theme.surface },
          pressed && styles.pressed,
        ]}>
        {dateBadge}
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Icon ios="bed.double" material="bedtime" size={16} color={theme.textSecondary} />
            <Text variant="bodyStrong" color="textSecondary">
              Rest day
            </Text>
          </View>
          <Text variant="caption" color="textSecondary">
            {isToday ? 'Today · tap to plan a workout' : 'Tap to plan a workout'}
          </Text>
        </View>
        <View style={[styles.planPill, { backgroundColor: theme.surface }, surface.soft]}>
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
      accessibilityLabel={`${day}, ${plan.muscleGroup}, ${plural(plan.exercises.length, 'exercise')}`}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.surface },
        pressed ? [styles.pressed, surface.sunken] : surface.raised,
      ]}>
      <View style={styles.main}>
        <View style={styles.header}>
          {dateBadge}
          <View style={styles.body}>
            <View style={styles.titleRow}>
              <View style={[styles.splitDot, { backgroundColor: Temper[plan.split] }]} />
              <Text variant="bodyStrong" numberOfLines={1} style={styles.title}>
                {plan.muscleGroup}
              </Text>
              {isToday && (
                <View style={[styles.todayPill, { backgroundColor: theme.accent }, surface.accent]}>
                  <Text variant="caption" style={{ color: theme.onAccent }}>
                    Today
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.meta}>
              <Icon ios="clock" material="schedule" size={13} color={theme.textSecondary} />
              <Text variant="caption" color="textSecondary" numberOfLines={1} style={styles.title}>
                {timeFormat.format(new Date(plan.time))} ·{' '}
                {plural(plan.exercises.length, 'exercise')} · {plural(sets, 'set')}
              </Text>
            </View>
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
              <ExerciseRow key={item.id} item={item} />
            ))}
            <Pressable
              onPress={onEdit}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${day} plan`}
              style={({ pressed }) => [
                styles.edit,
                { backgroundColor: theme.surface },
                pressed ? surface.sunken : surface.soft,
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

/** One exercise of the expanded day: image, name with its target muscles, and sets × reps. */
function ExerciseRow({ item }: { item: WorkoutExercise }) {
  const catalogEntry = useCatalogExercise(item.exercise.id);
  return (
    <View style={styles.exercise}>
      <ExerciseThumb url={item.exercise.iconUrl ?? null} size={36} />
      <View style={styles.exerciseInfo}>
        <Text variant="body" numberOfLines={1}>
          {item.exercise.name}
        </Text>
        {catalogEntry && <MuscleTags targets={targetsOf(catalogEntry)} max={4} />}
      </View>
      <Text variant="label" color="textSecondary">
        {prescription(item.sets, item.repetition, item.weight)}
      </Text>
    </View>
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
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  splitDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
    borderRadius: Radius.small,
    borderCurve: 'continuous',
    alignItems: 'center',
  },
  dateNumber: {
    fontSize: 17,
    lineHeight: 20,
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
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
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
  },
  edit: {
    marginTop: Spacing.two,
    minHeight: 44,
    borderRadius: Radius.small,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  exerciseInfo: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.one,
  },
});
