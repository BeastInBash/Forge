import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Icon } from '@/components/ui/icon';
import { IconBadge } from '@/components/ui/icon-badge';
import { PressScale } from '@/components/ui/press-scale';
import { Text } from '@/components/ui/text';
import { CSS_EASE_OUT, EASE_OUT, enter, reflow, slideIn } from '@/constants/motion';
import { MaxContentWidth, Radius, Spacing, Temper } from '@/constants/theme';
import { errorMessage } from '@/features/auth/validation';
import type { Exercise } from '@/features/exercises/api';
import { ExerciseThumb } from '@/features/exercises/components/exercise-thumb';
import { useExercises } from '@/features/exercises/use-exercises';
import { useSurface, useTheme } from '@/hooks/use-theme';
import { WEEKDAYS } from '@/lib/week';
import type { Weekday, WorkoutPlan } from '@/types/training';

import { applyTemplate } from './apply-template';
import { splitFor } from './split';
import { catalogMatch, SPLIT_TEMPLATES, type SplitTemplate, type TemplateDay } from './templates';
import { usePlans } from './use-plans';

const short = (day: Weekday) => day.slice(0, 3);

/** Asks before a template replaces existing plans; resolves true to go ahead. */
function confirmReplace(template: SplitTemplate, plans: WorkoutPlan[]): Promise<boolean> {
  if (plans.length === 0) return Promise.resolve(true);
  const days = plans.map((plan) => short(plan.day)).join(', ');
  const message =
    `Your plans on ${days} will be replaced by ${template.name}. ` +
    'Days it leaves for rest are cleared. You can edit any day afterwards.';
  if (process.env.EXPO_OS === 'web') {
    return Promise.resolve(window.confirm(`Replace your week?\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(
      'Replace your week?',
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Replace', style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}

/** Ready-made splits; picking one turns it into the user's weekly plans. */
export function TemplatesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { plans } = usePlans();
  const { exercises } = useExercises();
  const [applying, setApplying] = useState<string>();
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function use(template: SplitTemplate) {
    if (!plans || applying) return;
    if (!(await confirmReplace(template, plans))) return;
    setApplying(template.id);
    setErrors((current) => ({ ...current, [template.id]: '' }));
    try {
      await applyTemplate(template, plans, exercises);
      if (process.env.EXPO_OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.back();
    } catch (e) {
      setErrors((current) => ({ ...current, [template.id]: errorMessage(e) }));
      setApplying(undefined);
    }
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}>
      <Animated.View entering={enter(0)}>
        <Text variant="label" color="textSecondary">
          Pick a split and it becomes your week. Every day stays editable afterwards.
        </Text>
      </Animated.View>
      {SPLIT_TEMPLATES.map((template, index) => (
        <Animated.View key={template.id} entering={enter(index + 1)}>
          <TemplateCard
            template={template}
            catalog={exercises}
            ready={!!plans}
            applying={applying === template.id}
            disabled={!!applying && applying !== template.id}
            error={errors[template.id]}
            onUse={() => use(template)}
          />
        </Animated.View>
      ))}
    </ScrollView>
  );
}

function TemplateCard({
  template,
  catalog,
  ready,
  applying,
  disabled,
  error,
  onUse,
}: {
  template: SplitTemplate;
  catalog?: Exercise[];
  /** The user's plans have loaded, so applying knows what it replaces. */
  ready: boolean;
  applying: boolean;
  disabled: boolean;
  error?: string;
  onUse: () => void;
}) {
  const theme = useTheme();
  const surface = useSurface();
  const [open, setOpen] = useState<Weekday>();
  const daysPerWeek = template.days.length;

  return (
    <View style={[styles.card, { backgroundColor: theme.surface }, surface.raised]}>
      <View style={styles.header}>
        <IconBadge
          ios="calendar"
          material="calendar_month"
          color={theme.text}
          background={theme.background}
          border={theme.line}
        />
        <View style={styles.headerText}>
          <Text variant="title">{template.name}</Text>
          <Text variant="caption" color="textSecondary">
            {daysPerWeek} days a week · {template.level}
          </Text>
        </View>
      </View>

      <Text variant="label" color="textSecondary">
        {template.description}
      </Text>

      <WeekBand template={template} />

      <View style={styles.days}>
        {template.days.map((day) => (
          <DayRow
            key={day.day}
            day={day}
            catalog={catalog}
            open={open === day.day}
            onToggle={() => setOpen((current) => (current === day.day ? undefined : day.day))}
          />
        ))}
      </View>

      {error ? (
        <Animated.View entering={FadeIn.duration(180).easing(EASE_OUT)}>
          <Text variant="label" color="danger" accessibilityRole="alert">
            {error}
          </Text>
        </Animated.View>
      ) : null}

      <Animated.View layout={reflow}>
        <PressScale
          onPress={onUse}
          disabled={!ready || applying || disabled}
          accessibilityRole="button"
          accessibilityLabel={`Use the ${template.name} split`}
          accessibilityState={{ busy: applying, disabled: !ready || disabled }}
          style={[
            styles.use,
            { backgroundColor: theme.accent },
            surface.accent,
            (!ready || disabled) && styles.disabled,
          ]}
          pressedStyle={styles.pressed}>
          {applying ? (
            <>
              <ActivityIndicator color={theme.onAccent} />
              <Text variant="bodyStrong" style={{ color: theme.onAccent }}>
                Setting up your week…
              </Text>
            </>
          ) : (
            <>
              <Icon ios="checkmark" material="check" size={18} color={theme.onAccent} />
              <Text variant="bodyStrong" style={{ color: theme.onAccent }}>
                Use this split
              </Text>
            </>
          )}
        </PressScale>
      </Animated.View>
    </View>
  );
}

/** Seven segments, Monday first, in each training day's split colour; rest days stay empty. */
function WeekBand({ template }: { template: SplitTemplate }) {
  const theme = useTheme();
  const surface = useSurface();
  return (
    <View
      style={styles.band}
      accessible
      accessibilityLabel={`Trains ${template.days.map((d) => d.day).join(', ')}`}>
      {WEEKDAYS.map((weekday) => {
        const day = template.days.find((d) => d.day === weekday);
        return (
          <View key={weekday} style={styles.segmentColumn}>
            <View
              style={[
                styles.segment,
                day
                  ? { backgroundColor: Temper[splitFor(day.muscleGroup)] }
                  : [{ backgroundColor: theme.background }, surface.sunken],
              ]}
            />
            <Text variant="caption" color={day ? 'text' : 'textSecondary'}>
              {weekday.charAt(0)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/** A training day; tapping it shows the day's exercises with sets and reps. */
function DayRow({
  day,
  catalog,
  open,
  onToggle,
}: {
  day: TemplateDay;
  catalog?: Exercise[];
  open: boolean;
  onToggle: () => void;
}) {
  const theme = useTheme();
  return (
    <Animated.View layout={reflow} style={[styles.day, { backgroundColor: theme.background }]}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${day.day}, ${day.muscleGroup}, ${day.exercises.length} exercises`}
        style={({ pressed }) => [styles.dayHeader, pressed && styles.rowPressed]}>
        <View style={[styles.dot, { backgroundColor: Temper[splitFor(day.muscleGroup)] }]} />
        <Text variant="caption" color="textSecondary" style={styles.weekday}>
          {short(day.day).toUpperCase()}
        </Text>
        <Text variant="bodyStrong" numberOfLines={1} style={styles.flex}>
          {day.muscleGroup}
        </Text>
        <Text variant="caption" color="textSecondary">
          {day.exercises.length} exercises
        </Text>
        <Animated.View
          style={{
            transform: [{ rotate: open ? '180deg' : '0deg' }],
            transitionProperty: 'transform',
            transitionDuration: 200,
            transitionTimingFunction: CSS_EASE_OUT,
          }}>
          <Icon ios="chevron.down" material="expand_more" size={16} color={theme.textSecondary} />
        </Animated.View>
      </Pressable>
      {open && (
        <View style={styles.exercises}>
          {day.exercises.map((exercise, index) => {
            const match = catalogMatch(exercise, catalog);
            return (
              <Animated.View
                key={exercise.names[0]}
                entering={slideIn(index)}
                style={styles.exercise}>
                <ExerciseThumb url={match?.exercise_icon ?? null} size={32} />
                <Text variant="label" numberOfLines={1} style={styles.flex}>
                  {match?.exercise_name ?? exercise.names[0]}
                </Text>
                <Text variant="caption" color="textSecondary">
                  {exercise.sets} × {exercise.repetition}
                </Text>
              </Animated.View>
            );
          })}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
  },
  card: {
    padding: Spacing.four,
    gap: Spacing.three,
    borderRadius: Radius.large,
    borderCurve: 'continuous',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  headerText: {
    flex: 1,
    gap: Spacing.half,
  },
  band: {
    flexDirection: 'row',
    gap: Spacing.one + Spacing.half,
  },
  segmentColumn: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
  },
  segment: {
    alignSelf: 'stretch',
    height: 8,
    borderRadius: 4,
  },
  days: {
    gap: Spacing.two,
  },
  day: {
    borderRadius: Radius.small,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    minHeight: 48,
  },
  rowPressed: {
    opacity: 0.6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  weekday: {
    width: 30,
    letterSpacing: 0.6,
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  exercises: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.two + Spacing.half,
  },
  exercise: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  use: {
    height: 52,
    borderRadius: Radius.small,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
});
