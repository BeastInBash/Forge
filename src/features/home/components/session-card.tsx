import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { IconBadge } from '@/components/ui/icon-badge';
import { Text } from '@/components/ui/text';
import { Radius, Spacing, Temper, type TemperKey } from '@/constants/theme';
import { isClockRunning, type WorkoutSession } from '@/features/session/session-store';
import { formatClock, formatSpan, sessionDuration } from '@/features/session/timing';
import { useNow } from '@/features/session/use-session';
import { useSurface, useTheme } from '@/hooks/use-theme';
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
  /** The plans are still loading. */
  loading?: boolean;
  /** A started or finished session of this plan. */
  workout?: WorkoutSession;
  onStart: () => void;
  onPlan: () => void;
};

export function SessionCard({
  day,
  dayLabel,
  isToday,
  plan,
  loading,
  workout,
  onStart,
  onPlan,
}: Props) {
  const theme = useTheme();
  const surface = useSurface();

  if (loading) {
    return (
      <View style={[styles.card, styles.loadingCard, { backgroundColor: theme.iron }, surface.iron]}>
        <ActivityIndicator color={theme.ironTextSecondary} />
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={[styles.card, { backgroundColor: theme.iron }, surface.iron]}>
        <View style={styles.body}>
          <CardHeader label={dayLabel} rest />
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
    <View style={[styles.card, { backgroundColor: theme.iron }, surface.iron]}>
      <View style={[styles.temper, { backgroundColor: Temper[plan.split] }]} />
      <View style={styles.body}>
        <CardHeader
          label={`${dayLabel} at ${timeFormat.format(new Date(plan.time))}`}
          split={plan.split}
        />
        <Text variant="hero" style={{ color: theme.ironText }}>
          {plan.muscleGroup}
        </Text>

        <View style={styles.stats}>
          <Stat icon="exercises" value={plan.exercises.length} unit="exercises" />
          <Stat icon="sets" value={totalSets} unit="sets" />
          <Stat icon="time" value={totalSets * MINUTES_PER_SET} unit="min" />
        </View>

        <View style={[styles.list, { borderTopColor: theme.ironLine }]}>
          {plan.exercises.map((item) => (
            <View key={item.id} style={styles.exercise}>
              <Text variant="title" style={[styles.order, { color: theme.ironTextSecondary }]}>
                {item.order + 1}
              </Text>
              <Text
                variant="body"
                numberOfLines={1}
                style={[styles.name, { color: theme.ironText }]}>
                {item.exercise.name}
              </Text>
              <Text variant="label" style={{ color: theme.ironTextSecondary }}>
                {item.sets} × {item.repetition}
              </Text>
            </View>
          ))}
        </View>

        {workout?.finishedAt !== undefined ? (
          <SecondaryButton
            label={`Done in ${formatSpan(sessionDuration(workout, workout.finishedAt))} · View`}
            onPress={onStart}
          />
        ) : workout && workout.clock.length > 0 ? (
          <ResumeButton workout={workout} onPress={onStart} />
        ) : isToday || workout ? (
          <Pressable
            onPress={onStart}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.primary,
              { backgroundColor: theme.accent },
              surface.accent,
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

/** "Resume workout" with the session clock beside it, still counting unless stopped. */
function ResumeButton({ workout, onPress }: { workout: WorkoutSession; onPress: () => void }) {
  const theme = useTheme();
  const surface = useSurface();
  const running = isClockRunning(workout);
  const now = useNow(running);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.primary,
        { backgroundColor: theme.accent },
        surface.accent,
        pressed && styles.pressed,
      ]}>
      <Icon ios="timer" material="timer" size={18} color={theme.onAccent} />
      <Text variant="bodyStrong" numberOfLines={1} style={{ color: theme.onAccent }}>
        Resume workout
      </Text>
      <Text
        variant="label"
        numberOfLines={1}
        style={[styles.resumeClock, { color: theme.onAccent }]}>
        {formatClock(sessionDuration(workout, now))}
        {running ? '' : ' · stopped'}
      </Text>
    </Pressable>
  );
}

/** The workout marker, the day's time, and the split as a chip in its tempering colour. */
function CardHeader({ label, split, rest }: { label: string; split?: TemperKey; rest?: boolean }) {
  const theme = useTheme();
  return (
    <View style={styles.header}>
      <IconBadge
        ios={rest ? 'bed.double' : 'dumbbell'}
        material={rest ? 'bedtime' : 'fitness_center'}
        color={rest ? theme.ironTextSecondary : theme.accent}
        background={theme.ironLine}
      />
      <Text
        variant="caption"
        numberOfLines={1}
        style={[styles.headerLabel, { color: theme.ironTextSecondary }]}>
        {label}
      </Text>
      {split && (
        <View style={[styles.split, { borderColor: theme.ironLine }]}>
          <View style={[styles.splitDot, { backgroundColor: Temper[split] }]} />
          <Text variant="caption" style={{ color: theme.ironText }}>
            {split[0].toUpperCase() + split.slice(1)}
          </Text>
        </View>
      )}
    </View>
  );
}

const STAT_ICONS = {
  exercises: { ios: 'list.bullet', material: 'format_list_bulleted' },
  sets: { ios: 'square.stack.3d.up', material: 'layers' },
  time: { ios: 'clock', material: 'schedule' },
} as const;

function Stat({
  icon,
  value,
  unit,
}: {
  icon: keyof typeof STAT_ICONS;
  value: number;
  unit: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.stat}>
      <View style={styles.statIcon}>
        <Icon {...STAT_ICONS[icon]} size={15} color={theme.ironTextSecondary} />
      </View>
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
  const surface = useSurface();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.secondary,
        { backgroundColor: theme.ironLine },
        pressed ? [styles.pressed, surface.ironSunken] : surface.ironSoft,
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
  resumeClock: {
    opacity: 0.75,
    flexShrink: 1,
  },
  loadingCard: {
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  temper: {
    height: 4,
  },
  body: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + Spacing.half,
    marginBottom: Spacing.one,
  },
  headerLabel: {
    flex: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  split: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + Spacing.half,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderWidth: 1,
    borderRadius: Radius.small,
  },
  splitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  restCopy: {
    marginBottom: Spacing.three,
    maxWidth: 320,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: Spacing.four,
    rowGap: Spacing.one,
    marginTop: Spacing.one,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.one,
  },
  statIcon: {
    alignSelf: 'center',
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
    borderRadius: Radius.small,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  secondary: {
    marginTop: Spacing.three,
    height: 52,
    borderRadius: Radius.small,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
