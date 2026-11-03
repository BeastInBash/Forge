import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { Icon } from '@/components/ui/icon';
import { IconBadge } from '@/components/ui/icon-badge';
import { PressScale } from '@/components/ui/press-scale';
import { SectionLabel } from '@/components/ui/section-label';
import { Text } from '@/components/ui/text';
import { enter, reflow, slideIn } from '@/constants/motion';
import { FontFamily, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { FormError } from '@/features/auth/components/form-error';
import { errorMessage } from '@/features/auth/validation';
import { useSurface, useTheme } from '@/hooks/use-theme';

import { deleteWaterLog, type WaterLog } from './api';
import { WaterProgress } from './components/water-progress';
import { formatLitres, formatWater, reminderSummary } from './format';
import { useWaterDay } from './use-water-day';
import { useWaterGoal } from './use-water-goal';
import { drinkWater, removeWaterLogLocally } from './water-store';

const GLASS_ML = 250;
/** Other common sizes: a small cup, a can, a bottle. */
const QUICK_ML = [150, 330, 500];
/** What the backend accepts for one drink. */
const MIN_ML = 10;
const MAX_ML = 3000;

const time = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

/** Today's water: how much is drunk against the goal, quick ways to log a drink, and the list. */
export function WaterScreen() {
  const theme = useTheme();
  const surface = useSurface();
  const router = useRouter();
  const { goal } = useWaterGoal();
  const { day, error, loading, refreshing, refresh } = useWaterDay();
  /** The amount being logged, so only that button shows a spinner. */
  const [adding, setAdding] = useState<number>();
  const [customOpen, setCustomOpen] = useState(false);
  const [custom, setCustom] = useState('');
  const [formError, setFormError] = useState<string>();

  const goalMl = day?.goalMl ?? goal?.dailyGoalMl ?? null;
  const consumedMl = day?.consumedMl ?? 0;

  async function add(amountMl: number) {
    if (adding !== undefined) return;
    setAdding(amountMl);
    setFormError(undefined);
    try {
      await drinkWater(amountMl);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCustom('');
      setCustomOpen(false);
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFormError(errorMessage(e));
    } finally {
      setAdding(undefined);
    }
  }

  function addCustom() {
    const amountMl = Number(custom);
    if (!Number.isInteger(amountMl) || amountMl < MIN_ML || amountMl > MAX_ML) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFormError(`Enter a whole number of ml between ${MIN_ML} and ${MAX_ML}.`);
      return;
    }
    add(amountMl);
  }

  return (
    <KeyboardAvoidingView
      behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined}
      style={styles.fill}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={theme.textSecondary}
          />
        }>
        <Animated.View
          entering={enter(0)}
          style={[styles.hero, { backgroundColor: theme.surface }, surface.raised]}>
          <View style={styles.eyebrow}>
            <IconBadge
              ios="drop.fill"
              material="water_drop"
              color={theme.water}
              background={theme.waterSoft}
            />
            <Text variant="caption" color="textSecondary" style={styles.caps}>
              Drunk today
            </Text>
          </View>
          <View style={styles.heroTotal}>
            <Text variant="hero">{(consumedMl / 1000).toFixed(consumedMl % 100 ? 2 : 1)}</Text>
            <Text variant="label" color="textSecondary">
              {goalMl ? `of ${formatLitres(goalMl)}` : 'L'}
            </Text>
          </View>
          {goalMl ? (
            <>
              <WaterProgress consumedMl={consumedMl} goalMl={goalMl} />
              <Text
                variant="label"
                style={{ color: consumedMl >= goalMl ? theme.up : theme.textSecondary }}>
                {consumedMl >= goalMl
                  ? 'Goal reached — nice work'
                  : `${formatWater(goalMl - consumedMl)} to go`}
              </Text>
            </>
          ) : null}

          <View style={styles.chips}>
            {QUICK_ML.map((amountMl) => (
              <Chip
                key={amountMl}
                label={`${amountMl} ml`}
                loading={adding === amountMl}
                disabled={adding !== undefined}
                onPress={() => add(amountMl)}
              />
            ))}
            <Chip
              label="Custom"
              icon
              selected={customOpen}
              disabled={adding !== undefined}
              onPress={() => {
                setCustomOpen(!customOpen);
                setFormError(undefined);
              }}
            />
          </View>

          {customOpen && (
            <Animated.View
              entering={FadeIn.duration(180)}
              exiting={FadeOut.duration(120)}
              style={styles.customRow}>
              <TextInput
                value={custom}
                onChangeText={(text) => setCustom(text.replace(/[^0-9]/g, ''))}
                placeholder="Amount in ml"
                placeholderTextColor={theme.textSecondary}
                keyboardType="number-pad"
                maxLength={4}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={addCustom}
                accessibilityLabel="Custom amount in millilitres"
                style={[
                  styles.input,
                  { backgroundColor: theme.background, color: theme.text },
                  surface.sunken,
                ]}
              />
              <Pressable
                onPress={addCustom}
                disabled={adding !== undefined || !custom}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.customAdd,
                  { backgroundColor: theme.surface },
                  pressed ? surface.sunken : surface.soft,
                  !custom && styles.disabled,
                ]}>
                {adding !== undefined && adding === Number(custom) ? (
                  <ActivityIndicator color={theme.textSecondary} />
                ) : (
                  <Text variant="label">Add</Text>
                )}
              </Pressable>
            </Animated.View>
          )}

          {formError && <FormError message={formError} />}

          <PressScale
            onPress={() => add(GLASS_ML)}
            disabled={adding !== undefined}
            accessibilityRole="button"
            accessibilityLabel={`Add a glass, ${GLASS_ML} millilitres`}
            style={[styles.primary, { backgroundColor: theme.accent }, surface.accent]}
            pressedStyle={styles.pressed}>
            {adding === GLASS_ML ? (
              <ActivityIndicator color={theme.onAccent} />
            ) : (
              <>
                <Icon ios="plus" material="add" size={18} color={theme.onAccent} />
                <Text variant="bodyStrong" style={{ color: theme.onAccent }}>
                  Add a glass · {GLASS_ML} ml
                </Text>
              </>
            )}
          </PressScale>
        </Animated.View>

        <Animated.View entering={enter(1)} layout={reflow} style={styles.section}>
          <SectionLabel
            icon={{ ios: 'clock', material: 'schedule' }}
            trailing={
              day?.logs.length ? (
                <Text variant="caption" color="textSecondary">
                  {day.logs.length} {day.logs.length === 1 ? 'drink' : 'drinks'}
                </Text>
              ) : undefined
            }>
            Today’s drinks
          </SectionLabel>
          {loading ? (
            <ActivityIndicator color={theme.textSecondary} style={styles.loading} />
          ) : error ? (
            <View style={[styles.message, { backgroundColor: theme.surface }, surface.raised]}>
              <Text variant="bodyStrong">Couldn’t load today’s water</Text>
              <Text variant="label" color="textSecondary">
                {error}
              </Text>
              <Pressable
                onPress={refresh}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.retry,
                  { backgroundColor: theme.surface },
                  pressed ? surface.sunken : surface.soft,
                ]}>
                <Text variant="label">Try again</Text>
              </Pressable>
            </View>
          ) : day?.logs.length ? (
            <View style={[styles.list, { backgroundColor: theme.surface }, surface.raised]}>
              {/* Newest first, like the meal history */}
              {[...day.logs].reverse().map((log, index) => (
                <DrinkRow key={log.id} log={log} index={index} />
              ))}
            </View>
          ) : (
            <View style={[styles.message, { backgroundColor: theme.surface }, surface.raised]}>
              <Text variant="bodyStrong">Nothing logged yet today</Text>
              <Text variant="label" color="textSecondary">
                Tap “Add a glass” whenever you drink, or when a reminder comes in.
              </Text>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={enter(2)} layout={reflow} style={styles.section}>
          <SectionLabel icon={{ ios: 'target', material: 'track_changes' }}>
            Goal & reminders
          </SectionLabel>
          <Pressable
            onPress={() => router.push('/water-goal')}
            accessibilityRole="button"
            accessibilityHint="Opens the daily water goal"
            style={({ pressed }) => [
              styles.goalRow,
              { backgroundColor: theme.surface },
              surface.raised,
              pressed && { backgroundColor: theme.background },
            ]}>
            <IconBadge
              ios="target"
              material="track_changes"
              color={theme.text}
              background={theme.background}
              border={theme.line}
            />
            <View style={styles.flex}>
              <Text variant="bodyStrong">
                {goal ? `${formatLitres(goal.dailyGoalMl)} a day` : 'Set a daily goal'}
              </Text>
              {goal && (
                <Text variant="caption" color="textSecondary">
                  {goal.remindersEnabled ? reminderSummary(goal) : 'Reminders off'}
                </Text>
              )}
            </View>
            <Icon ios="chevron.right" material="chevron_right" size={16} color={theme.textSecondary} />
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** A small capsule button for a drink size. */
function Chip({
  label,
  icon,
  selected,
  loading,
  disabled,
  onPress,
}: {
  label: string;
  /** Shows a pencil, for the custom amount. */
  icon?: boolean;
  selected?: boolean;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const surface = useSurface();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: theme.surface },
        pressed || selected ? surface.sunken : surface.soft,
        selected && { backgroundColor: theme.waterSoft, borderColor: `${theme.water}55` },
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={theme.textSecondary} />
      ) : (
        <>
          {icon ? (
            <Icon ios="pencil" material="edit" size={14} color={selected ? theme.water : theme.text} />
          ) : (
            <Icon ios="drop.fill" material="water_drop" size={14} color={theme.water} />
          )}
          <Text variant="label" style={selected && { color: theme.water }}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

/** One drink in today's list, with a button to remove it. */
function DrinkRow({ log, index }: { log: WaterLog; index: number }) {
  const theme = useTheme();
  const surface = useSurface();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(false);
  const at = time.format(new Date(log.drankAt));

  async function remove() {
    setDeleting(true);
    setError(false);
    try {
      await deleteWaterLog(log.id);
      Haptics.selectionAsync();
      removeWaterLogLocally(log.id);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(true);
      setDeleting(false);
    }
  }

  return (
    <Animated.View
      entering={slideIn(index, 0)}
      exiting={FadeOut.duration(150)}
      layout={LinearTransition.duration(200)}
      style={styles.row}>
      <IconBadge
        ios="drop.fill"
        material="water_drop"
        size={36}
        color={theme.water}
        background={theme.waterSoft}
      />
      <View style={styles.flex}>
        <Text variant="bodyStrong">{formatWater(log.amountMl)}</Text>
        <Text variant="caption" style={{ color: error ? theme.danger : theme.textSecondary }}>
          {error ? 'Couldn’t remove it. Try again.' : at}
        </Text>
      </View>
      <Pressable
        onPress={remove}
        disabled={deleting}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${formatWater(log.amountMl)} at ${at}`}
        style={({ pressed }) => [
          styles.remove,
          pressed && [{ backgroundColor: theme.background }, surface.sunken],
        ]}>
        {deleting ? (
          <ActivityIndicator size="small" color={theme.textSecondary} />
        ) : (
          <Icon ios="trash" material="delete" size={16} color={theme.textSecondary} />
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  flex: {
    flex: 1,
    gap: Spacing.half,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.five,
  },
  hero: {
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + Spacing.half,
  },
  caps: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroTotal: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    minHeight: 36,
    minWidth: 72,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
  },
  customRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    height: 44,
    paddingHorizontal: Spacing.three,
    paddingVertical: 0,
    borderRadius: Radius.small,
    borderCurve: 'continuous',
    fontFamily: FontFamily.body,
    fontSize: 16,
  },
  customAdd: {
    height: 44,
    minWidth: 72,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.small,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
  primary: {
    marginTop: Spacing.one,
    height: 52,
    borderRadius: Radius.small,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.85,
  },
  section: {
    gap: Spacing.three,
  },
  loading: {
    paddingVertical: Spacing.five,
  },
  list: {
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    padding: Spacing.three,
    gap: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  remove: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
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
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.large,
    borderCurve: 'continuous',
  },
});
