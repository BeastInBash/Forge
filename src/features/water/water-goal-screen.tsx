import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconBadge } from '@/components/ui/icon-badge';
import { RulerPicker } from '@/components/ui/ruler-picker';
import { Text } from '@/components/ui/text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { FormError } from '@/features/auth/components/form-error';
import { SubmitButton } from '@/features/auth/components/submit-button';
import { errorMessage } from '@/features/auth/validation';
import { useBody } from '@/features/body/use-body';
import { registerForPush, useNotificationsBlocked } from '@/features/notifications/push';
import { useSurface, useTheme } from '@/hooks/use-theme';

import { deviceTimezone, saveWaterGoal, type WaterGoal, type WaterGoalInput } from './api';
import { reminderSummary } from './format';
import { useWaterGoal } from './use-water-goal';
import { setWaterGoalLocally } from './water-store';

/** The ruler's range in litres; the backend accepts 0.5–10 L. */
const MIN_L = 0.5;
const MAX_L = 6;
const DEFAULT_L = 2.5;
/** A common rule of thumb: about 35 ml a day per kg of body weight. */
const ML_PER_KG = 35;
const GLASS_ML = 250;

/** Reminder settings a first goal starts with; the backend uses the same defaults. */
const DEFAULT_REMINDERS = {
  remindersEnabled: true,
  reminderStart: '08:00',
  reminderEnd: '22:00',
  reminderIntervalMin: 120,
};

const toLitres = (ml: number) => Math.round(ml / 100) / 10;
const clampLitres = (litres: number) => Math.min(MAX_L, Math.max(MIN_L, litres));

/**
 * Set how much water to drink a day on a blue ruler, the same control as onboarding's age and
 * weight. Starts at the saved goal, or at a suggestion from body weight for a first goal.
 */
export function WaterGoalScreen() {
  const theme = useTheme();
  const { goal, error, loading, retry } = useWaterGoal();
  const { measurements } = useBody();

  if (loading) {
    return (
      <View style={[styles.fill, styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.textSecondary} />
      </View>
    );
  }
  if (error) return <LoadError message={error} onRetry={retry} />;

  const weightKg = measurements?.weightKg ?? null;
  const suggested = weightKg ? clampLitres(toLitres(weightKg * ML_PER_KG)) : null;
  return (
    <GoalForm
      goal={goal ?? null}
      start={goal ? clampLitres(toLitres(goal.dailyGoalMl)) : (suggested ?? DEFAULT_L)}
      weightKg={weightKg}
      suggested={suggested}
    />
  );
}

function GoalForm({
  goal,
  start,
  weightKg,
  suggested,
}: {
  goal: WaterGoal | null;
  /** The ruler only reads its value when it mounts, so this is fixed for the form's life. */
  start: number;
  weightKg: number | null;
  suggested: number | null;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [litres, setLitres] = useState(start);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string>();
  // Once refused, only system settings can turn notifications back on
  const blocked = useNotificationsBlocked();

  const reminders = goal ?? DEFAULT_REMINDERS;
  const glasses = Math.round((litres * 1000) / GLASS_ML);

  async function save() {
    setSaving(true);
    setFormError(undefined);
    // PUT replaces every setting, so the saved reminder window goes back unchanged
    const input: WaterGoalInput = {
      dailyGoalMl: Math.round(litres * 1000),
      remindersEnabled: reminders.remindersEnabled,
      reminderStart: reminders.reminderStart,
      reminderEnd: reminders.reminderEnd,
      reminderIntervalMin: reminders.reminderIntervalMin,
      timezone: deviceTimezone(),
    };
    try {
      setWaterGoalLocally(await saveWaterGoal(input));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Reminders are pushes, so this is the moment to ask; saving doesn't depend on the answer
      if (input.remindersEnabled) await registerForPush({ prompt: true });
      router.back();
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFormError(errorMessage(e));
      setSaving(false);
    }
  }

  return (
    <View
      style={[
        styles.fill,
        { backgroundColor: theme.background, paddingBottom: insets.bottom + Spacing.three },
      ]}>
      <View style={styles.column}>
        <View style={styles.intro}>
          <View style={styles.eyebrow}>
            <IconBadge
              ios="drop.fill"
              material="water_drop"
              color={theme.water}
              background={theme.waterSoft}
            />
            <Text variant="label" color="textSecondary" style={styles.caps}>
              Hydration
            </Text>
          </View>
          <Text variant="display" accessibilityRole="header">
            How much water a day?
          </Text>
          <Text variant="body" color="textSecondary">
            {suggested && !goal
              ? `About ${suggested} L suits your weight (${weightKg} kg). Slide to change it.`
              : 'Slide the ruler to set your daily target.'}
          </Text>
        </View>

        <View style={styles.measure}>
          <RulerPicker
            min={MIN_L}
            max={MAX_L}
            step={0.1}
            majorEvery={10}
            value={litres}
            onChange={setLitres}
            label="Daily water goal"
            unit="L"
            color={theme.water}
            pointer="droplet"
          />
          <Text variant="label" color="textSecondary" style={styles.center}>
            About {glasses} {glasses === 1 ? 'glass' : 'glasses'} of {GLASS_ML} ml
          </Text>
        </View>

        <View style={styles.footer}>
          {reminders.remindersEnabled && (
            <Text variant="caption" color="textSecondary" style={styles.center}>
              {reminderSummary(reminders)}
            </Text>
          )}
          {reminders.remindersEnabled && blocked && (
            <Pressable onPress={() => Linking.openSettings()} accessibilityRole="link" hitSlop={8}>
              <Text variant="caption" style={[styles.center, { color: theme.danger }]}>
                Notifications are off for Forge, so reminders can’t reach you. Open settings
              </Text>
            </Pressable>
          )}
          {formError && <FormError message={formError} />}
          <SubmitButton label={goal ? 'Save goal' : 'Set goal'} loading={saving} onPress={save} />
        </View>
      </View>
    </View>
  );
}

function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const theme = useTheme();
  const surface = useSurface();
  return (
    <View style={[styles.fill, { backgroundColor: theme.background }]}>
      <View style={styles.column}>
        <View style={[styles.message, { backgroundColor: theme.surface }, surface.raised]}>
          <Text variant="bodyStrong">Couldn’t load your water goal</Text>
          <Text variant="label" color="textSecondary">
            {message}
          </Text>
          <Pressable
            onPress={onRetry}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.retry,
              { backgroundColor: theme.surface },
              pressed ? surface.sunken : surface.soft,
            ]}>
            <Text variant="label">Try again</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    textAlign: 'center',
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    gap: Spacing.four,
  },
  intro: {
    gap: Spacing.two,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + Spacing.half,
    marginBottom: Spacing.one,
  },
  caps: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  measure: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.three,
    // The ruler runs edge to edge, past the column's padding.
    marginHorizontal: -Spacing.three,
  },
  footer: {
    gap: Spacing.three,
  },
  message: {
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  retry: {
    alignSelf: 'flex-start',
    marginTop: Spacing.two,
    minHeight: 40,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    justifyContent: 'center',
  },
});
