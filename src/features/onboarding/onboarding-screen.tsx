import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInLeft,
  FadeInRight,
  FadeOut,
  FadeOutLeft,
  FadeOutRight,
  ReduceMotion,
  useReducedMotion,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { EASE_OUT } from '@/constants/motion';
import { MaxContentWidth, Spacing, Temper } from '@/constants/theme';
import { FormError } from '@/features/auth/components/form-error';
import { SubmitButton } from '@/features/auth/components/submit-button';
import { useSession } from '@/features/auth/session';
import { errorMessage } from '@/features/auth/validation';
import { useTheme } from '@/hooks/use-theme';

import type { FitnessGoal, OnboardingAnswers } from './api';
import { GoalOption } from './components/goal-option';
import { RulerPicker } from './components/ruler-picker';
import { StepProgress } from './components/step-progress';

type MeasureKey = 'age' | 'heightCm' | 'weightKg';

type MeasureStep = {
  key: MeasureKey;
  title: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  majorEvery: number;
  /** Where the ruler starts — a typical adult, so most people scroll a short way. */
  start: number;
};

const MEASURES: MeasureStep[] = [
  {
    key: 'age',
    title: 'How old are you?',
    label: 'Age',
    unit: 'years',
    min: 13,
    max: 100,
    step: 1,
    majorEvery: 5,
    start: 25,
  },
  {
    key: 'heightCm',
    title: 'How tall are you?',
    label: 'Height',
    unit: 'cm',
    min: 100,
    max: 250,
    step: 1,
    majorEvery: 10,
    start: 170,
  },
  {
    key: 'weightKg',
    title: 'What do you weigh?',
    label: 'Weight',
    unit: 'kg',
    min: 30,
    max: 250,
    step: 0.5,
    majorEvery: 10,
    start: 70,
  },
];

const GOALS: {
  value: FitnessGoal;
  title: string;
  description: string;
  ios: 'arrow.down.right' | 'arrow.up.right' | 'dumbbell.fill';
  material: 'trending_down' | 'trending_up' | 'fitness_center';
  tint: string;
}[] = [
  {
    value: 'WEIGHT_LOSS',
    title: 'Lose weight',
    description: 'Burn fat while keeping your strength.',
    ios: 'arrow.down.right',
    material: 'trending_down',
    tint: Temper.upper,
  },
  {
    value: 'WEIGHT_GAIN',
    title: 'Gain weight',
    description: 'Put on size with a steady surplus.',
    ios: 'arrow.up.right',
    material: 'trending_up',
    tint: Temper.pull,
  },
  {
    value: 'MUSCLE_BUILDING',
    title: 'Build muscle',
    description: 'Get stronger and add lean mass.',
    ios: 'dumbbell.fill',
    material: 'fitness_center',
    tint: Temper.push,
  },
];

const TOTAL = MEASURES.length + 1;
const GOAL_STEP = MEASURES.length;

/**
 * First-run questions, one per step: age, height, weight, goal. Every step can be skipped, and
 * nothing is sent until the last one, so leaving halfway simply shows the flow again next time.
 */
export function OnboardingScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { session, completeOnboarding } = useSession();
  const reduced = useReducedMotion();

  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<MeasureKey, number>>({
    age: MEASURES[0].start,
    heightCm: MEASURES[1].start,
    weightKg: MEASURES[2].start,
  });
  const [skipped, setSkipped] = useState<Set<MeasureKey>>(new Set());
  const [goal, setGoal] = useState<FitnessGoal | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  // +1 forward, -1 back. The leaving step takes its exit from its last render, so `go` commits
  // the new direction a frame before swapping steps — otherwise going back would exit forwards.
  const [direction, setDirection] = useState<1 | -1>(1);
  const { entering, exiting } = stepMotion(direction, reduced);

  function go(to: number) {
    setError(undefined);
    setDirection(to > step ? 1 : -1);
    requestAnimationFrame(() => setStep(to));
  }

  // Android's back button steps back through the flow before it leaves the app.
  useEffect(() => {
    if (step === 0 || saving) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      go(step - 1);
      return true;
    });
    return () => subscription.remove();
  });

  async function finish(finalGoal: FitnessGoal | null, finalSkipped: Set<MeasureKey>) {
    const answers: OnboardingAnswers = {
      age: finalSkipped.has('age') ? null : values.age,
      heightCm: finalSkipped.has('heightCm') ? null : values.heightCm,
      weightKg: finalSkipped.has('weightKg') ? null : values.weightKg,
      goal: finalGoal,
    };
    setSaving(true);
    setError(undefined);
    try {
      await completeOnboarding(answers);
      // The route guard swaps this screen for the tabs; nothing else to do here.
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setError(errorMessage(e));
      setSaving(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  function next() {
    if (step === GOAL_STEP) return finish(goal, skipped);
    const key = MEASURES[step].key;
    setSkipped((current) => without(current, key));
    go(step + 1);
  }

  function skip() {
    if (step === GOAL_STEP) {
      setGoal(null);
      return finish(null, skipped);
    }
    const key = MEASURES[step].key;
    setSkipped((current) => new Set(current).add(key));
    go(step + 1);
  }

  const firstName = session?.user.name.split(' ')[0];
  const measure = step < GOAL_STEP ? MEASURES[step] : undefined;

  return (
    <View
      style={[
        styles.fill,
        {
          backgroundColor: theme.background,
          paddingTop: insets.top + Spacing.two,
          paddingBottom: insets.bottom + Spacing.three,
        },
      ]}>
      <View style={styles.column}>
        <View style={styles.header}>
          <Pressable
            onPress={() => go(step - 1)}
            disabled={step === 0 || saving}
            accessibilityRole="button"
            accessibilityLabel="Back"
            accessibilityElementsHidden={step === 0}
            importantForAccessibility={step === 0 ? 'no-hide-descendants' : 'auto'}
            hitSlop={8}
            style={({ pressed }) => [
              styles.headerButton,
              { opacity: step === 0 ? 0 : pressed ? 0.5 : 1 },
            ]}>
            <Icon ios="chevron.left" material="arrow_back" size={20} color={theme.text} />
          </Pressable>
          <StepProgress step={step} total={TOTAL} />
          <Pressable
            onPress={skip}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel={step === GOAL_STEP ? 'Skip and finish' : 'Skip this question'}
            hitSlop={8}
            style={({ pressed }) => [styles.headerButton, styles.skip, pressed && styles.pressed]}>
            <Text variant="label" color="textSecondary">
              Skip
            </Text>
          </Pressable>
        </View>

        <Animated.View key={step} entering={entering} exiting={exiting} style={styles.step}>
          <View style={styles.intro}>
            <Text variant="label" color="textSecondary">
              Step {step + 1} of {TOTAL}
            </Text>
            <Text variant="display" accessibilityRole="header">
              {measure ? measure.title : 'What are you training for?'}
            </Text>
            {step === 0 && (
              <Text variant="body" color="textSecondary">
                {firstName ? `Welcome, ${firstName}. ` : 'Welcome. '}A few quick questions so Forge
                fits you. Skip any you’d rather not answer.
              </Text>
            )}
          </View>

          {measure ? (
            <View style={styles.measure}>
              <RulerPicker
                min={measure.min}
                max={measure.max}
                step={measure.step}
                majorEvery={measure.majorEvery}
                value={values[measure.key]}
                onChange={(value) => setValues((current) => ({ ...current, [measure.key]: value }))}
                label={measure.label}
                unit={measure.unit}
              />
            </View>
          ) : (
            <View style={styles.goals} accessibilityRole="radiogroup">
              {GOALS.map((option) => (
                <GoalOption
                  key={option.value}
                  title={option.title}
                  description={option.description}
                  ios={option.ios}
                  material={option.material}
                  tint={option.tint}
                  selected={goal === option.value}
                  onSelect={() => {
                    if (goal !== option.value) Haptics.selectionAsync();
                    setGoal(option.value);
                  }}
                />
              ))}
            </View>
          )}
        </Animated.View>

        <View style={styles.footer}>
          {error && <FormError message={error} />}
          <SubmitButton
            label={step === GOAL_STEP ? 'Finish' : 'Continue'}
            loading={saving}
            disabled={step === GOAL_STEP && goal === null}
            onPress={next}
          />
        </View>
      </View>
    </View>
  );
}

/**
 * Steps slide in the direction of travel. Exits run faster than entrances, so the old step is
 * out of the way before the new one settles. Reduced motion keeps only the crossfade — set to
 * `Never` so the system setting doesn't drop that too.
 */
function stepMotion(direction: 1 | -1, reduced: boolean) {
  if (reduced) {
    return {
      entering: FadeIn.duration(200).reduceMotion(ReduceMotion.Never),
      exiting: FadeOut.duration(120).reduceMotion(ReduceMotion.Never),
    };
  }
  const enter = direction === 1 ? FadeInRight : FadeInLeft;
  const exit = direction === 1 ? FadeOutLeft : FadeOutRight;
  return {
    entering: enter.duration(300).easing(EASE_OUT),
    exiting: exit.duration(160).easing(EASE_OUT),
  };
}

function without<T>(set: Set<T>, item: T) {
  if (!set.has(item)) return set;
  const next = new Set(set);
  next.delete(item);
  return next;
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 44,
  },
  headerButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
  },
  skip: {
    alignItems: 'flex-end',
  },
  pressed: {
    opacity: 0.5,
  },
  step: {
    flex: 1,
    paddingTop: Spacing.five,
    gap: Spacing.five,
  },
  intro: {
    gap: Spacing.two,
  },
  measure: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.four,
    // The ruler runs edge to edge, past the column's padding.
    marginHorizontal: -Spacing.three,
    paddingBottom: Spacing.six,
  },
  goals: {
    gap: Spacing.three,
  },
  footer: {
    gap: Spacing.three,
  },
});
