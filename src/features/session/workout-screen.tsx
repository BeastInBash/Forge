import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { FontFamily, MaxContentWidth, Radius, Spacing, Temper } from '@/constants/theme';
import { errorMessage } from '@/features/auth/validation';
import { logLift } from '@/features/progress/api';
import { addLiftLocally } from '@/features/progress/lifts-store';
import { useTheme } from '@/hooks/use-theme';

import { ExerciseCard } from './components/exercise-card';
import {
  discardSession,
  finishSession,
  isClockRunning,
  resetSessionClock,
  startSessionClock,
  stopSessionClock,
  markSavedToProgress,
  type WorkoutSession,
} from './session-store';
import { exerciseDuration, formatClock, formatSpan, sessionDuration, setCounts } from './timing';
import { useNow, useWorkoutSession } from './use-session';

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

/**
 * The workout in progress: a running session clock, a timer and checks for every exercise, and
 * a summary of how long everything took once the last set is ticked (or the session is ended).
 */
export function WorkoutScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { session, loaded } = useWorkoutSession();

  if (!loaded) {
    return <ActivityIndicator color={theme.textSecondary} style={styles.loading} />;
  }
  if (!session) {
    return (
      <View style={[styles.empty, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ title: 'Workout' }} />
        <Text variant="bodyStrong">No workout in progress</Text>
        <Text variant="label" color="textSecondary">
          Start today’s session from the Today tab.
        </Text>
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <Text variant="label">Go back</Text>
        </Pressable>
      </View>
    );
  }
  return <Session session={session} />;
}

function Session({ session }: { session: WorkoutSession }) {
  const theme = useTheme();
  const router = useRouter();
  const finished = session.finishedAt !== undefined;
  const clockRunning = isClockRunning(session);
  const now = useNow(clockRunning);
  const { done, total } = setCounts(session);
  const exercisesDone = session.exercises.filter((e) => e.completedAt !== undefined).length;
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // A reset needs a second tap within a few seconds.
  useEffect(() => {
    if (!confirmReset) return;
    const id = setTimeout(() => setConfirmReset(false), 3000);
    return () => clearTimeout(id);
  }, [confirmReset]);

  // One success tap when the last set completes the session.
  const wasFinished = useRef(finished);
  useEffect(() => {
    if (finished && !wasFinished.current) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    wasFinished.current = finished;
  }, [finished]);

  const fraction = total ? done / total : 0;
  const barStyle = useAnimatedStyle(() => ({
    width: withTiming(`${fraction * 100}%`, { duration: 300, easing: EASE_OUT }),
  }));

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: session.muscleGroup }} />

      <View style={[styles.hero, { backgroundColor: theme.iron }]}>
        <View style={[styles.temper, { backgroundColor: Temper[session.split] }]} />
        <View style={styles.heroBody}>
          <Text variant="label" style={{ color: theme.ironTextSecondary }}>
            {finished
              ? 'Session time'
              : confirmReset
                ? 'Reset the session clock to 0:00?'
                : clockRunning
                  ? 'Session running'
                  : 'Session clock stopped'}
          </Text>
          <View style={styles.clockRow}>
            <Text
              style={[
                styles.sessionClock,
                { color: clockRunning || finished ? theme.ironText : theme.ironTextSecondary },
              ]}
              accessibilityRole="timer">
              {formatClock(sessionDuration(session, now))}
            </Text>
            {!finished && (
              <View style={styles.clockButtons}>
                <Pressable
                  onPress={() => {
                    if (!confirmReset) {
                      setConfirmReset(true);
                      return;
                    }
                    setConfirmReset(false);
                    resetSessionClock();
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={
                    confirmReset ? 'Confirm reset session clock' : 'Reset session clock'
                  }
                  style={({ pressed }) => [
                    styles.resetButton,
                    {
                      backgroundColor: confirmReset ? theme.danger : theme.ironLine,
                      transitionProperty: 'backgroundColor',
                      transitionDuration: 150,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <Icon
                    ios="arrow.counterclockwise"
                    material="restart_alt"
                    size={20}
                    color={theme.ironText}
                  />
                </Pressable>
                <Pressable
                  onPress={() => {
                    if (clockRunning) stopSessionClock();
                    else startSessionClock();
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={clockRunning ? 'Stop session clock' : 'Start session clock'}
                  style={({ pressed }) => [
                    styles.clockButton,
                    {
                      backgroundColor: clockRunning ? theme.ironLine : theme.accent,
                      transitionProperty: 'backgroundColor',
                      transitionDuration: 150,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <Icon
                    ios={clockRunning ? 'stop.fill' : 'play.fill'}
                    material={clockRunning ? 'stop' : 'play_arrow'}
                    size={20}
                    color={clockRunning ? theme.ironText : theme.onAccent}
                  />
                  <Text
                    variant="bodyStrong"
                    style={{ color: clockRunning ? theme.ironText : theme.onAccent }}>
                    {clockRunning ? 'Stop' : 'Start'}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
          <View style={[styles.track, { backgroundColor: theme.ironLine }]}>
            <Animated.View style={[styles.fill, { backgroundColor: theme.accent }, barStyle]} />
          </View>
          <Text variant="label" style={{ color: theme.ironTextSecondary }}>
            {done} of {total} sets · {exercisesDone} of {session.exercises.length} exercises
          </Text>
        </View>
      </View>

      {finished && <Summary session={session} />}

      {session.exercises.map((exercise, index) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          index={index}
          locked={session.endedEarly === true}
        />
      ))}

      {finished ? (
        <Pressable
          onPress={() => {
            discardSession();
            router.back();
          }}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.button,
            { borderColor: theme.line, backgroundColor: theme.surface },
            pressed && { backgroundColor: theme.line },
          ]}>
          <Text variant="bodyStrong">Close workout</Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={() => {
            if (!confirmFinish) {
              setConfirmFinish(true);
              return;
            }
            finishSession();
          }}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.button,
            {
              borderColor: confirmFinish ? theme.danger : theme.line,
              backgroundColor: theme.surface,
            },
            pressed && { backgroundColor: theme.line },
          ]}>
          <Icon ios="flag.checkered" material="sports_score" size={18} color={theme.text} />
          <Text variant="bodyStrong">
            {confirmFinish ? 'Tap again to end the session now' : 'Finish workout'}
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

/** How long the session and each exercise took, and a way to log the sets to Progress. */
function Summary({ session }: { session: WorkoutSession }) {
  const theme = useTheme();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const { done, total } = setCounts(session);
  const finishedAt = session.finishedAt ?? Date.now();
  const logged = session.exercises.filter((e) => e.sets.some((s) => s.completedAt !== undefined));

  async function save() {
    setSaving(true);
    setError(undefined);
    try {
      const lifts = await Promise.all(
        logged.map((exercise) => {
          const sets = exercise.sets.filter((set) => set.completedAt !== undefined);
          return logLift({
            exerciseId: exercise.exerciseId,
            performedAt: new Date(Math.max(...sets.map((set) => set.completedAt!))).toISOString(),
            sets: sets.map(({ weight, reps }) => ({ weight, reps })),
          });
        })
      );
      lifts.forEach(addLiftLocally);
      markSavedToProgress();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      style={[styles.summary, { backgroundColor: theme.surface }]}>
      <View style={styles.summaryHead}>
        <Icon ios="trophy.fill" material="emoji_events" size={22} color={theme.accent} />
        <Text variant="title">{session.endedEarly ? 'Session ended' : 'Session complete'}</Text>
      </View>
      <Text variant="label" color="textSecondary">
        {formatSpan(sessionDuration(session, finishedAt))} in total · {done} of {total} sets done
      </Text>

      <View style={[styles.summaryList, { borderTopColor: theme.line }]}>
        {session.exercises.map((exercise) => {
          const time = exerciseDuration(exercise, finishedAt);
          const setsDone = exercise.sets.filter((s) => s.completedAt !== undefined).length;
          return (
            <View key={exercise.id} style={styles.summaryRow}>
              <Text variant="label" numberOfLines={1} style={styles.flex}>
                {exercise.name}
              </Text>
              <Text variant="caption" color="textSecondary">
                {setsDone}/{exercise.sets.length} sets
              </Text>
              <Text variant="bodyStrong" style={styles.summaryTime}>
                {time === null ? '–' : formatClock(time)}
              </Text>
            </View>
          );
        })}
      </View>

      {error && (
        <Text variant="label" color="danger" accessibilityRole="alert">
          {error}
        </Text>
      )}
      {logged.length > 0 &&
        (session.savedToProgress ? (
          <View style={styles.saved}>
            <Icon ios="checkmark.circle.fill" material="check_circle" size={18} color={theme.up} />
            <Text variant="label" style={{ color: theme.up }}>
              Saved to Progress
            </Text>
          </View>
        ) : (
          <Pressable
            onPress={save}
            disabled={saving}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.save,
              { backgroundColor: theme.accent },
              pressed && styles.pressed,
            ]}>
            {saving ? (
              <ActivityIndicator color={theme.onAccent} />
            ) : (
              <>
                <Icon
                  ios="chart.line.uptrend.xyaxis"
                  material="show_chart"
                  size={18}
                  color={theme.onAccent}
                />
                <Text variant="bodyStrong" style={{ color: theme.onAccent }}>
                  Save sets to Progress
                </Text>
              </>
            )}
          </Pressable>
        ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  loading: {
    paddingVertical: Spacing.six,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  hero: {
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  temper: {
    height: 6,
  },
  heroBody: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  clockButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  resetButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    height: 44,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
  },
  sessionClock: {
    fontFamily: FontFamily.display,
    fontSize: 64,
    lineHeight: 66,
    fontVariant: ['tabular-nums'],
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: Spacing.one,
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 4,
  },
  summary: {
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  summaryHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  summaryList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  flex: {
    flex: 1,
  },
  summaryTime: {
    minWidth: 52,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  saved: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  save: {
    marginTop: Spacing.two,
    height: 52,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  button: {
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
