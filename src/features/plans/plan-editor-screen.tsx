import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { FontFamily, MaxContentWidth, Radius, Spacing, Temper } from '@/constants/theme';
import { SubmitButton } from '@/features/auth/components/submit-button';
import { errorMessage } from '@/features/auth/validation';
import { useTheme } from '@/hooks/use-theme';
import { WEEKDAYS } from '@/lib/week';
import type { Weekday, WorkoutPlan } from '@/types/training';

import { createPlan, deletePlan, updatePlan } from './api';
import { ExercisePicker } from './components/exercise-picker';
import { PlanExerciseCard, type DraftExercise } from './components/plan-exercise-card';
import { removePlanLocally, savePlanLocally } from './plans-store';
import { MUSCLE_GROUP_SUGGESTIONS, splitFor } from './split';
import { usePlans } from './use-plans';

const DEFAULT_MINUTES = 18 * 60; // 6:00 PM
const TIME_STEP = 15;
const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

function minutesOf(iso: string) {
  const date = new Date(iso);
  return date.getHours() * 60 + date.getMinutes();
}

/** Today at the chosen local time, as ISO. Only the time of day matters to the app. */
function timeToIso(minutes: number) {
  const date = new Date();
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return date.toISOString();
}

function formatMinutes(minutes: number) {
  return timeFormat.format(new Date(timeToIso(minutes)));
}

function draftFrom(plan: WorkoutPlan): DraftExercise[] {
  return plan.exercises.map((item) => ({
    exerciseId: item.exercise.id,
    name: item.exercise.name,
    icon: item.exercise.iconUrl ?? null,
    sets: item.sets,
    repetition: item.repetition,
    weight: item.weight ?? null,
  }));
}

/**
 * Create or edit one day's plan. Opened as `/plan?day=Monday` for a new plan or `/plan?id=…` to
 * edit; the plan being edited comes from the shared plans cache the Workouts tab filled.
 */
export function PlanEditorScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ id?: string; day?: string }>();
  const { plans } = usePlans();
  const existing = params.id ? plans?.find((p) => p.id === params.id) : undefined;

  if (params.id && !existing) {
    return (
      <View style={[styles.missing, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ title: 'Edit plan' }} />
        <Text variant="body" color="textSecondary">
          {plans ? 'This plan no longer exists.' : 'Loading…'}
        </Text>
      </View>
    );
  }

  const day = WEEKDAYS.includes(params.day as Weekday) ? (params.day as Weekday) : 'Monday';
  // Keyed so the form's state starts from the plan once it's available.
  return (
    <PlanEditor
      key={existing?.id ?? 'new'}
      existing={existing}
      plans={plans ?? []}
      initialDay={existing?.day ?? day}
    />
  );
}

function PlanEditor({
  existing,
  plans,
  initialDay,
}: {
  existing?: WorkoutPlan;
  plans: WorkoutPlan[];
  initialDay: Weekday;
}) {
  const theme = useTheme();
  const router = useRouter();
  const [day, setDay] = useState<Weekday>(initialDay);
  const [muscleGroup, setMuscleGroup] = useState(existing?.muscleGroup ?? '');
  const [minutes, setMinutes] = useState(existing ? minutesOf(existing.time) : DEFAULT_MINUTES);
  const [items, setItems] = useState<DraftExercise[]>(existing ? draftFrom(existing) : []);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [formError, setFormError] = useState<string>();

  const takenDays = new Set(plans.filter((p) => p.id !== existing?.id).map((p) => p.day));
  const errors = {
    muscleGroup: muscleGroup.trim() ? undefined : 'Name the session, e.g. Chest & triceps.',
    items: items.length ? undefined : 'Add at least one exercise.',
    day: takenDays.has(day) ? `You already have a ${day} plan.` : undefined,
  };
  const selectedIds = new Set(items.map((item) => item.exerciseId));
  const totalSets = items.reduce((sum, item) => sum + item.sets, 0);

  function update(index: number, item: DraftExercise) {
    setItems((current) => current.map((it, i) => (i === index ? item : it)));
  }

  function move(index: number, direction: -1 | 1) {
    setItems((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function save() {
    setSubmitted(true);
    setFormError(undefined);
    if (errors.muscleGroup || errors.items || errors.day) return;
    setSaving(true);
    const input = {
      day,
      time: timeToIso(minutes),
      muscleGroup: muscleGroup.trim(),
      exercises: items.map(({ exerciseId, sets, repetition, weight }) => ({
        exerciseId,
        sets,
        repetition,
        weight,
      })),
    };
    try {
      savePlanLocally(existing ? await updatePlan(existing.id, input) : await createPlan(input));
      router.back();
    } catch (e) {
      setFormError(errorMessage(e));
      setSaving(false);
    }
  }

  async function remove() {
    if (!existing) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setSaving(true);
    try {
      await deletePlan(existing.id);
      removePlanLocally(existing.id);
      router.back();
    } catch (e) {
      setFormError(errorMessage(e));
      setSaving(false);
      setConfirmDelete(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={[styles.fill, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ title: existing ? `Edit ${existing.day}` : 'New plan' }} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}>
        <Section title="Day">
          <View style={styles.days}>
            {WEEKDAYS.map((weekday) => {
              const selected = weekday === day;
              const taken = takenDays.has(weekday);
              return (
                <Pressable
                  key={weekday}
                  onPress={() => setDay(weekday)}
                  disabled={taken}
                  accessibilityRole="radio"
                  accessibilityState={{ selected, disabled: taken }}
                  accessibilityLabel={taken ? `${weekday}, already planned` : weekday}
                  style={[
                    styles.dayChip,
                    selected
                      ? { backgroundColor: theme.text }
                      : { backgroundColor: theme.surface, borderColor: theme.line, borderWidth: 1 },
                    taken && styles.taken,
                  ]}>
                  <Text variant="label" style={{ color: selected ? theme.background : theme.text }}>
                    {weekday.slice(0, 3)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {takenDays.size > 0 && (
            <Text variant="caption" color="textSecondary">
              Faded days already have a plan.
            </Text>
          )}
        </Section>

        <Section title="Session">
          <View
            style={[
              styles.nameBox,
              {
                backgroundColor: theme.surface,
                borderColor: submitted && errors.muscleGroup ? theme.danger : theme.line,
              },
            ]}>
            {muscleGroup.trim() ? (
              <View style={[styles.splitDot, { backgroundColor: Temper[splitFor(muscleGroup)] }]} />
            ) : null}
            <TextInput
              value={muscleGroup}
              onChangeText={setMuscleGroup}
              placeholder="e.g. Chest & triceps"
              placeholderTextColor={theme.textSecondary}
              maxLength={60}
              autoCapitalize="sentences"
              accessibilityLabel="Muscle group"
              style={[styles.nameInput, { color: theme.text }]}
            />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestions}>
            {MUSCLE_GROUP_SUGGESTIONS.map((suggestion) => {
              const active = suggestion === muscleGroup.trim();
              return (
                <Pressable
                  key={suggestion}
                  onPress={() => setMuscleGroup(suggestion)}
                  accessibilityRole="button"
                  style={[
                    styles.suggestion,
                    {
                      borderColor: active ? theme.accent : theme.line,
                      backgroundColor: active ? theme.accent : 'transparent',
                    },
                  ]}>
                  <View
                    style={[
                      styles.suggestionDot,
                      { backgroundColor: Temper[splitFor(suggestion)] },
                    ]}
                  />
                  <Text variant="label" style={{ color: active ? theme.onAccent : theme.text }}>
                    {suggestion}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          {submitted && errors.muscleGroup ? (
            <Text variant="caption" color="danger">
              {errors.muscleGroup}
            </Text>
          ) : null}

          <View style={[styles.timeRow, { backgroundColor: theme.surface }]}>
            <Icon ios="clock" material="schedule" size={18} color={theme.textSecondary} />
            <Text variant="bodyStrong" style={styles.timeLabel}>
              Time
            </Text>
            <TimeButton
              icon="minus"
              onPress={() => setMinutes((m) => (m - TIME_STEP + 1440) % 1440)}
            />
            <Text variant="title" style={styles.timeValue} accessibilityLiveRegion="polite">
              {formatMinutes(minutes)}
            </Text>
            <TimeButton icon="plus" onPress={() => setMinutes((m) => (m + TIME_STEP) % 1440)} />
          </View>
        </Section>

        <Section
          title={items.length ? `Exercises · ${items.length} · ${totalSets} sets` : 'Exercises'}>
          {items.map((item, index) => (
            <PlanExerciseCard
              key={item.exerciseId}
              item={item}
              index={index}
              count={items.length}
              onChange={(next) => update(index, next)}
              onMove={(direction) => move(index, direction)}
              onRemove={() => setItems((current) => current.filter((_, i) => i !== index))}
            />
          ))}
          <Pressable
            onPress={() => setPickerOpen(true)}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.addExercise,
              { borderColor: submitted && errors.items ? theme.danger : theme.line },
              pressed && { backgroundColor: theme.line },
            ]}>
            <Icon ios="plus" material="add" size={18} color={theme.text} />
            <Text variant="bodyStrong">
              {items.length ? 'Add more exercises' : 'Add exercises'}
            </Text>
          </Pressable>
          {submitted && errors.items ? (
            <Text variant="caption" color="danger">
              {errors.items}
            </Text>
          ) : null}
        </Section>

        {(formError || (submitted && errors.day)) && (
          <Text variant="label" color="danger" accessibilityRole="alert">
            {formError ?? errors.day}
          </Text>
        )}
        <SubmitButton
          label={existing ? 'Save changes' : 'Create plan'}
          loading={saving}
          onPress={save}
        />
        {existing && (
          <Pressable
            onPress={remove}
            disabled={saving}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.delete,
              { borderColor: confirmDelete ? theme.danger : theme.line },
              pressed && { backgroundColor: theme.line },
            ]}>
            <Icon ios="trash" material="delete" size={18} color={theme.danger} />
            <Text variant="bodyStrong" color="danger">
              {confirmDelete ? `Tap again to delete ${existing.day}` : 'Delete plan'}
            </Text>
          </Pressable>
        )}
      </ScrollView>

      <ExercisePicker
        visible={pickerOpen}
        selectedIds={selectedIds}
        onClose={() => setPickerOpen(false)}
        onToggle={(exercise) =>
          setItems((current) =>
            current.some((item) => item.exerciseId === exercise.id)
              ? current.filter((item) => item.exerciseId !== exercise.id)
              : [
                  ...current,
                  {
                    exerciseId: exercise.id,
                    name: exercise.exercise_name,
                    icon: exercise.exercise_icon,
                    sets: 3,
                    repetition: 10,
                    weight: null,
                  },
                ]
          )
        }
      />
    </KeyboardAvoidingView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="label" color="textSecondary" style={styles.sectionTitle}>
        {title.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

function TimeButton({ icon, onPress }: { icon: 'minus' | 'plus'; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={icon === 'minus' ? '15 minutes earlier' : '15 minutes later'}
      style={({ pressed }) => [
        styles.timeButton,
        { backgroundColor: theme.background },
        pressed && { backgroundColor: theme.line },
      ]}>
      <Icon
        ios={icon}
        material={icon === 'minus' ? 'remove' : 'add'}
        size={16}
        color={theme.text}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.three,
    paddingBottom: Spacing.six,
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
    flexDirection: 'row',
    gap: Spacing.one,
  },
  dayChip: {
    flex: 1,
    height: 40,
    borderRadius: Radius.small + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taken: {
    opacity: 0.35,
  },
  nameBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    borderWidth: 1,
    gap: Spacing.two,
  },
  splitDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  nameInput: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 17,
  },
  suggestions: {
    gap: Spacing.two,
    paddingVertical: Spacing.half,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + Spacing.half,
    paddingHorizontal: Spacing.three,
    height: 34,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  suggestionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    height: 56,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    marginTop: Spacing.two,
  },
  timeLabel: {
    flex: 1,
  },
  timeButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeValue: {
    minWidth: 92,
    textAlign: 'center',
    fontSize: 22,
  },
  addExercise: {
    minHeight: 52,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  delete: {
    minHeight: 52,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
});
