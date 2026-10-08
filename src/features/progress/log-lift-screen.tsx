import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { FontFamily, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { SubmitButton } from '@/features/auth/components/submit-button';
import { errorMessage } from '@/features/auth/validation';
import { ExerciseThumb } from '@/features/exercises/components/exercise-thumb';
import { useExercises } from '@/features/exercises/use-exercises';
import { ExercisePicker } from '@/features/plans/components/exercise-picker';
import { formatWeight, parseWeight } from '@/features/plans/components/plan-exercise-card';
import { Stepper } from '@/features/plans/components/stepper';
import { usePlans } from '@/features/plans/use-plans';
import { useTheme } from '@/hooks/use-theme';

import { logLift, type LiftExercise } from './api';
import { relativeDay } from './format';
import { addLiftLocally, getSnapshot } from './lifts-store';
import { describeSets } from './metrics';

type DraftSet = { key: number; weight: number | null; weightText: string; reps: number };

const MAX_DAYS_BACK = 60;
let nextKey = 0;

function draftSet(weight: number | null, reps: number): DraftSet {
  return { key: nextKey++, weight, weightText: formatWeight(weight), reps };
}

/** The date `daysBack` days ago, at the current time of day. */
function performedAt(daysBack: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysBack);
  return date.toISOString();
}

/**
 * Log one exercise's sets. Opened as `/log-lift?exerciseId=…` from an exercise's history, or
 * without one from the Progress tab, in which case the exercise is picked first. Sets start from
 * the last logged session, or from the user's plan when the exercise has never been logged.
 */
export function LogLiftScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ exerciseId?: string }>();
  const { exercises } = useExercises();
  const { plans } = usePlans();

  const [exercise, setExercise] = useState<LiftExercise | undefined>(() => {
    if (!params.exerciseId) return undefined;
    const { histories, summaries } = getSnapshot();
    return (
      histories[params.exerciseId]?.history?.exercise ??
      summaries?.find((s) => s.exercise.id === params.exerciseId)?.exercise
    );
  });
  const [sets, setSets] = useState<DraftSet[]>(() => startingSets(params.exerciseId));
  const [daysBack, setDaysBack] = useState(0);
  const [note, setNote] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string>();

  // Opened from a deep link before the caches were filled: fall back to the catalog.
  const catalogEntry =
    !exercise && params.exerciseId ? exercises?.find((e) => e.id === params.exerciseId) : undefined;
  const chosen: LiftExercise | undefined =
    exercise ??
    (catalogEntry && {
      id: catalogEntry.id,
      name: catalogEntry.exercise_name,
      iconUrl: catalogEntry.exercise_icon,
    });
  const previous = chosen ? lastLift(chosen.id) : undefined;

  /** Last session's sets, else the plan's prescription, else three empty sets of eight. */
  function startingSets(exerciseId: string | undefined): DraftSet[] {
    const last = exerciseId ? lastLift(exerciseId) : undefined;
    if (last) return last.sets.map((set) => draftSet(set.weight, set.reps));
    const planned = plans
      ?.flatMap((plan) => plan.exercises)
      .find((item) => item.exercise.id === exerciseId);
    if (planned) {
      return Array.from({ length: planned.sets }, () =>
        draftSet(planned.weight ?? null, planned.repetition)
      );
    }
    return [draftSet(null, 8), draftSet(null, 8), draftSet(null, 8)];
  }

  function updateSet(key: number, change: Partial<DraftSet>) {
    setSets((current) => current.map((set) => (set.key === key ? { ...set, ...change } : set)));
  }

  async function save() {
    setFormError(undefined);
    if (!chosen) {
      setFormError('Pick an exercise first.');
      return;
    }
    setSaving(true);
    try {
      const lift = await logLift({
        exerciseId: chosen.id,
        performedAt: performedAt(daysBack),
        sets: sets.map(({ weight, reps }) => ({ weight, reps })),
        note: note.trim() || undefined,
      });
      addLiftLocally(lift);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFormError(errorMessage(e));
      setSaving(false);
    }
  }

  const volume = sets.reduce((sum, set) => sum + (set.weight ?? 0) * set.reps, 0);

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={[styles.fill, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ title: chosen ? `Log ${chosen.name}` : 'Log a lift' }} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}>
        <Pressable
          onPress={() => setPickerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={chosen ? `Exercise: ${chosen.name}. Change` : 'Pick an exercise'}
          style={({ pressed }) => [
            styles.exercise,
            { backgroundColor: theme.surface },
            pressed && { opacity: 0.85 },
          ]}>
          <ExerciseThumb url={chosen?.iconUrl ?? null} size={52} />
          <View style={styles.exerciseText}>
            <Text variant="bodyStrong" numberOfLines={2}>
              {chosen?.name ?? 'Pick an exercise'}
            </Text>
            <Text variant="caption" color="textSecondary" numberOfLines={2}>
              {previous
                ? `Last time, ${relativeDay(previous.performedAt).toLowerCase()}: ${describeSets(previous.sets)}`
                : chosen
                  ? 'First time logging this one'
                  : 'From your exercise library'}
            </Text>
          </View>
          <Icon
            ios="chevron.right"
            material="chevron_right"
            size={20}
            color={theme.textSecondary}
          />
        </Pressable>

        <View style={[styles.dateRow, { backgroundColor: theme.surface }]}>
          <Icon ios="calendar" material="calendar_today" size={18} color={theme.textSecondary} />
          <Text variant="bodyStrong" style={styles.flex}>
            Date
          </Text>
          <RoundButton
            icon="chevron.left"
            material="chevron_left"
            label="A day earlier"
            disabled={daysBack >= MAX_DAYS_BACK}
            onPress={() => setDaysBack((d) => d + 1)}
          />
          <Text variant="bodyStrong" style={styles.dateValue} accessibilityLiveRegion="polite">
            {relativeDay(performedAt(daysBack))}
          </Text>
          <RoundButton
            icon="chevron.right"
            material="chevron_right"
            label="A day later"
            disabled={daysBack === 0}
            onPress={() => setDaysBack((d) => d - 1)}
          />
        </View>

        <View style={styles.section}>
          <Text variant="label" color="textSecondary" style={styles.sectionTitle}>
            {`SETS · ${sets.length}${volume ? ` · ${Math.round(volume).toLocaleString()} KG VOLUME` : ''}`}
          </Text>
          {sets.map((set, index) => (
            <Animated.View
              key={set.key}
              entering={FadeInDown.duration(220)}
              exiting={FadeOut.duration(150)}
              layout={LinearTransition.duration(200)}
              style={[styles.set, { backgroundColor: theme.surface }]}>
              <View style={[styles.setNumber, { backgroundColor: theme.background }]}>
                <Text variant="label">{index + 1}</Text>
              </View>
              <View style={styles.weight}>
                <Text variant="caption" color="textSecondary">
                  Weight
                </Text>
                <View style={[styles.weightBox, { backgroundColor: theme.background }]}>
                  <TextInput
                    value={set.weightText}
                    onChangeText={(text) => {
                      const weight = parseWeight(text);
                      updateSet(set.key, {
                        weightText: text,
                        ...(weight !== undefined && { weight }),
                      });
                    }}
                    onBlur={() => updateSet(set.key, { weightText: formatWeight(set.weight) })}
                    placeholder="BW"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="decimal-pad"
                    inputMode="decimal"
                    maxLength={6}
                    selectTextOnFocus
                    accessibilityLabel={`Set ${index + 1} weight in kilograms`}
                    style={[styles.weightInput, { color: theme.text }]}
                  />
                  <Text variant="caption" color="textSecondary">
                    kg
                  </Text>
                </View>
              </View>
              <Stepper
                label="Reps"
                value={set.reps}
                min={1}
                max={100}
                onChange={(reps) => updateSet(set.key, { reps })}
              />
              <Pressable
                onPress={() => setSets((current) => current.filter((s) => s.key !== set.key))}
                disabled={sets.length === 1}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={`Remove set ${index + 1}`}
                style={({ pressed }) => [
                  styles.remove,
                  pressed && { backgroundColor: theme.line },
                  sets.length === 1 && styles.disabled,
                ]}>
                <Icon ios="xmark" material="close" size={16} color={theme.textSecondary} />
              </Pressable>
            </Animated.View>
          ))}
          <Animated.View layout={LinearTransition.duration(200)}>
            <Pressable
              onPress={() => {
                const last = sets[sets.length - 1];
                setSets((current) => [...current, draftSet(last?.weight ?? null, last?.reps ?? 8)]);
              }}
              disabled={sets.length >= 30}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.addSet,
                { borderColor: theme.line },
                pressed && { backgroundColor: theme.line },
              ]}>
              <Icon ios="plus" material="add" size={18} color={theme.text} />
              <Text variant="bodyStrong">Add set</Text>
            </Pressable>
          </Animated.View>
        </View>

        <View style={styles.section}>
          <Text variant="label" color="textSecondary" style={styles.sectionTitle}>
            NOTE
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="How did it feel? (optional)"
            placeholderTextColor={theme.textSecondary}
            maxLength={200}
            multiline
            accessibilityLabel="Note"
            style={[styles.note, { backgroundColor: theme.surface, color: theme.text }]}
          />
        </View>

        {formError && (
          <Text variant="label" color="danger" accessibilityRole="alert">
            {formError}
          </Text>
        )}
        <SubmitButton label="Save lift" loading={saving} onPress={save} />
      </ScrollView>

      <ExercisePicker
        visible={pickerOpen}
        selectedIds={new Set(chosen ? [chosen.id] : [])}
        onClose={() => setPickerOpen(false)}
        onToggle={(picked) => {
          setExercise({ id: picked.id, name: picked.exercise_name, iconUrl: picked.exercise_icon });
          setSets(startingSets(picked.id));
          setPickerOpen(false);
        }}
      />
    </KeyboardAvoidingView>
  );
}

/** The most recent logged session of an exercise, from whichever cache has it. */
function lastLift(exerciseId: string) {
  const { histories, summaries } = getSnapshot();
  const lifts = histories[exerciseId]?.history?.lifts;
  return lifts?.length
    ? lifts[lifts.length - 1]
    : summaries?.find((s) => s.exercise.id === exerciseId)?.last;
}

function RoundButton({
  icon,
  material,
  label,
  disabled,
  onPress,
}: {
  icon: 'chevron.left' | 'chevron.right';
  material: 'chevron_left' | 'chevron_right';
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.round,
        { backgroundColor: theme.background },
        pressed && { backgroundColor: theme.line },
        disabled && styles.disabled,
      ]}>
      <Icon ios={icon} material={material} size={16} color={theme.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
  },
  exercise: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.two,
    paddingRight: Spacing.three,
    borderRadius: Radius.large,
    borderCurve: 'continuous',
  },
  exerciseText: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.half,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    height: 56,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
  },
  dateValue: {
    minWidth: 96,
    textAlign: 'center',
  },
  round: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    paddingHorizontal: Spacing.one,
    letterSpacing: 1.2,
    fontSize: 12,
  },
  set: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.large,
    borderCurve: 'continuous',
  },
  setNumber: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weight: {
    flex: 1,
    gap: Spacing.one,
  },
  weightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.small,
    gap: Spacing.one,
  },
  // Matches the plan editor's weight field; see the note there about Android text insets.
  weightInput: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    paddingVertical: 0,
    paddingHorizontal: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
    fontFamily: FontFamily.displayBold,
    fontSize: 18,
    textAlign: 'right',
  },
  remove: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.3,
  },
  addSet: {
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
  note: {
    minHeight: 80,
    padding: Spacing.three,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    fontFamily: FontFamily.body,
    fontSize: 16,
    textAlignVertical: 'top',
  },
});
