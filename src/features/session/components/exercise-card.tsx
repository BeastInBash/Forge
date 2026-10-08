import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { ExerciseThumb } from '@/features/exercises/components/exercise-thumb';
import { describeSets, formatSet } from '@/features/progress/metrics';
import { useTheme } from '@/hooks/use-theme';

import {
  isTimerRunning,
  resetExerciseTimer,
  startExerciseTimer,
  stopExerciseTimer,
  toggleExercise,
  toggleSet,
  type SessionExercise,
} from '../session-store';
import { exerciseDuration, formatClock, lastTickTime, setDurations } from '../timing';
import { useNow } from '../use-session';
import { CheckBox } from './check-box';

type Props = {
  exercise: SessionExercise;
  index: number;
  /** The session was ended early; nothing can change. */
  locked: boolean;
};

/**
 * One exercise in the running session: a timer to start (and stop or reset) as the user works, a
 * check per set, and a check for the whole exercise. Times appear next to each set as it's ticked.
 */
export function ExerciseCard({ exercise, index, locked }: Props) {
  const theme = useTheme();
  const started = exercise.timer.length > 0;
  const done = exercise.completedAt !== undefined;
  const running = isTimerRunning(exercise) && !done && !locked;
  const now = useNow(running);
  const durations = setDurations(exercise);
  const elapsed = exerciseDuration(exercise, now);
  const [confirmReset, setConfirmReset] = useState(false);

  // A reset needs a second tap within a few seconds.
  useEffect(() => {
    if (!confirmReset) return;
    const id = setTimeout(() => setConfirmReset(false), 3000);
    return () => clearTimeout(id);
  }, [confirmReset]);

  // The set the clock is counting towards: the first one not yet ticked.
  const nextSet = exercise.sets.findIndex((set) => set.completedAt === undefined);
  const sinceLastTick = Math.max(0, (elapsed ?? 0) - lastTickTime(exercise));

  function onReset() {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    setConfirmReset(false);
    resetExerciseTimer(index);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  function onToggleSet(setIndex: number) {
    const willComplete =
      exercise.sets[setIndex].completedAt === undefined &&
      exercise.sets.filter((set) => set.completedAt === undefined).length === 1;
    toggleSet(index, setIndex);
    if (willComplete) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function onToggleExercise() {
    toggleExercise(index);
    if (!done) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  return (
    <Animated.View
      layout={LinearTransition.duration(200)}
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: done ? theme.accent : 'transparent' },
      ]}>
      <View style={styles.header}>
        <ExerciseThumb url={exercise.iconUrl} size={48} />
        <View style={styles.title}>
          <Text variant="bodyStrong" numberOfLines={2}>
            {exercise.name}
          </Text>
          <Text variant="caption" color="textSecondary" numberOfLines={1}>
            {describeSets(exercise.sets)}
          </Text>
        </View>
        <CheckBox
          checked={done}
          onToggle={onToggleExercise}
          disabled={locked}
          size={36}
          label={done ? `Mark ${exercise.name} not done` : `Mark all of ${exercise.name} done`}
        />
      </View>

      {done ? (
        <View style={[styles.timer, { backgroundColor: theme.background }]}>
          <Icon ios="checkmark.seal.fill" material="verified" size={18} color={theme.up} />
          <Text variant="label" style={styles.timerLabel}>
            {elapsed === null ? 'Done' : 'Done in'}
          </Text>
          {elapsed !== null && <Text style={styles.clock}>{formatClock(elapsed)}</Text>}
        </View>
      ) : started ? (
        <View style={[styles.timer, { backgroundColor: theme.background }]}>
          {running ? (
            <Animated.View
              style={[
                styles.liveDot,
                { backgroundColor: theme.danger },
                {
                  animationName: { from: { opacity: 1 }, to: { opacity: 0.25 } },
                  animationDuration: '900ms',
                  animationIterationCount: 'infinite',
                  animationDirection: 'alternate',
                },
              ]}
            />
          ) : (
            <View style={[styles.liveDot, { backgroundColor: theme.textSecondary }]} />
          )}
          <Text variant="label" style={styles.timerLabel} numberOfLines={1}>
            {confirmReset ? 'Reset to 0:00?' : running ? 'Exercise time' : 'Stopped'}
          </Text>
          <Text
            style={[styles.clock, !running && { color: theme.textSecondary }]}
            accessibilityRole="timer">
            {formatClock(elapsed ?? 0)}
          </Text>
          {!locked && (
            <>
              <TimerButton
                ios={running ? 'stop.fill' : 'play.fill'}
                material={running ? 'stop' : 'play_arrow'}
                label={running ? `Stop ${exercise.name} timer` : `Resume ${exercise.name} timer`}
                tint={running ? theme.text : theme.onAccent}
                fill={running ? theme.surface : theme.accent}
                onPress={() => {
                  if (running) stopExerciseTimer(index);
                  else startExerciseTimer(index);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              />
              <TimerButton
                ios="arrow.counterclockwise"
                material="restart_alt"
                label={
                  confirmReset
                    ? `Confirm reset ${exercise.name} timer`
                    : `Reset ${exercise.name} timer`
                }
                tint={confirmReset ? theme.background : theme.text}
                fill={confirmReset ? theme.danger : theme.surface}
                onPress={onReset}
              />
            </>
          )}
        </View>
      ) : (
        <Pressable
          onPress={() => {
            startExerciseTimer(index);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }}
          disabled={locked}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.startTimer,
            { borderColor: theme.accent },
            pressed && styles.pressed,
            locked && styles.disabled,
          ]}>
          <Icon ios="timer" material="timer" size={18} color={theme.text} />
          <Text variant="bodyStrong">Start timer</Text>
        </Pressable>
      )}

      <View style={[styles.sets, { borderTopColor: theme.line }]}>
        {exercise.sets.map((set, setIndex) => {
          const checked = set.completedAt !== undefined;
          const counting = started && !done && setIndex === nextSet;
          const time = durations[setIndex];
          return (
            <Pressable
              key={setIndex}
              onPress={() => onToggleSet(setIndex)}
              disabled={locked}
              accessibilityRole="checkbox"
              accessibilityState={{ checked, disabled: locked }}
              accessibilityLabel={`Set ${setIndex + 1}, ${formatSet(set)}`}
              style={({ pressed }) => [styles.set, pressed && { opacity: 0.7 }]}>
              <CheckBox
                checked={checked}
                onToggle={() => onToggleSet(setIndex)}
                disabled={locked}
                size={26}
                label={`Set ${setIndex + 1}`}
              />
              <Text variant="label" color="textSecondary" style={styles.setNumber}>
                Set {setIndex + 1}
              </Text>
              <Text
                variant="bodyStrong"
                style={[styles.setLoad, checked && { color: theme.textSecondary }]}>
                {formatSet(set)}
              </Text>
              {checked ? (
                <Animated.View entering={FadeIn.duration(200)}>
                  <Text variant="label" color={time === null ? 'textSecondary' : 'text'}>
                    {time === null ? '–' : formatClock(time)}
                  </Text>
                </Animated.View>
              ) : counting ? (
                <Text
                  variant="label"
                  style={{ color: running ? theme.accent : theme.textSecondary }}>
                  {formatClock(sinceLastTick)}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}

function TimerButton({
  ios,
  material,
  label,
  tint,
  fill,
  onPress,
}: {
  ios: 'stop.fill' | 'play.fill' | 'arrow.counterclockwise';
  material: 'stop' | 'play_arrow' | 'restart_alt';
  label: string;
  tint: string;
  fill: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.timerButton,
        { backgroundColor: fill, transitionProperty: 'backgroundColor', transitionDuration: 150 },
        pressed && styles.pressed,
      ]}>
      <Icon ios={ios} material={material} size={16} color={tint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    borderWidth: 2,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  title: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.half,
  },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    height: 52,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.two,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
  },
  timerButton: {
    width: 34,
    height: 34,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timerLabel: {
    flex: 1,
  },
  clock: {
    fontFamily: FontFamily.displayBold,
    fontSize: 20,
    fontVariant: ['tabular-nums'],
  },
  startTimer: {
    height: 48,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  disabled: {
    opacity: 0.4,
  },
  sets: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.one,
  },
  set: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 48,
  },
  setNumber: {
    width: 44,
  },
  setLoad: {
    flex: 1,
  },
});
