import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { enter } from '@/constants/motion';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { SubmitButton } from '@/features/auth/components/submit-button';
import { TextField } from '@/features/auth/components/text-field';
import { errorMessage } from '@/features/auth/validation';
import { useTheme } from '@/hooks/use-theme';

import { updateExercise, type Exercise } from './api';
import { ExerciseThumb } from './components/exercise-thumb';
import { MusclePicker } from './components/muscle-picker';
import { addToCache } from './exercise-cache';
import { targetsOf, type MuscleTargets } from './muscles';
import { nameKey } from './search';
import { useExercises } from './use-exercises';

/** Admins rename a catalog exercise and set the muscles it targets. */
export function EditExerciseScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { exercises } = useExercises();
  const exercise = exercises?.find((e) => e.id === id);

  return (
    <KeyboardAvoidingView behavior="padding" style={[styles.fill, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ title: exercise?.exercise_name ?? 'Edit exercise' }} />
      {exercise ? (
        // Keyed so the form starts from this exercise's values even if the screen is reused.
        <EditForm key={exercise.id} exercise={exercise} catalog={exercises ?? []} />
      ) : (
        <View style={styles.missing}>
          <Text variant="label" color="textSecondary">
            {exercises ? 'This exercise is no longer in the library.' : 'Loading…'}
          </Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function EditForm({ exercise, catalog }: { exercise: Exercise; catalog: Exercise[] }) {
  const router = useRouter();
  const [name, setName] = useState(exercise.exercise_name);
  const [muscles, setMuscles] = useState<MuscleTargets>(() => targetsOf(exercise));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string>();

  const taken = catalog.some(
    (e) => e.id !== exercise.id && nameKey(e.exercise_name) === nameKey(name)
  );
  const nameError = !name.trim()
    ? 'Enter the exercise name.'
    : taken
      ? 'Another exercise already has this name.'
      : undefined;

  async function save() {
    setFormError(undefined);
    if (nameError) return;
    setSaving(true);
    try {
      addToCache(await updateExercise(exercise.id, name.trim(), muscles));
      if (process.env.EXPO_OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.back();
    } catch (e) {
      setFormError(errorMessage(e));
      setSaving(false);
    }
  }

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}>
      <Animated.View entering={enter(0)} style={styles.header}>
        <ExerciseThumb url={exercise.exercise_icon} size={96} />
      </Animated.View>
      <Animated.View entering={enter(1)}>
        <TextField
          label="Exercise name"
          value={name}
          onChangeText={setName}
          error={nameError}
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={100}
          returnKeyType="done"
        />
      </Animated.View>
      <Animated.View entering={enter(2)}>
        <MusclePicker value={muscles} onChange={setMuscles} disabled={saving} />
      </Animated.View>
      <Animated.View entering={enter(3)} style={styles.footer}>
        {formError && (
          <Text variant="label" color="danger" accessibilityRole="alert">
            {formError}
          </Text>
        )}
        <SubmitButton label="Save changes" loading={saving} onPress={save} />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.screen,
    paddingVertical: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
  },
  header: {
    alignItems: 'center',
  },
  footer: {
    gap: Spacing.three,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
});
