import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
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
import { Segmented } from '@/components/ui/segmented';
import { Text } from '@/components/ui/text';
import { FontFamily, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { SubmitButton } from '@/features/auth/components/submit-button';
import { errorMessage } from '@/features/auth/validation';
import { relativeDay } from '@/features/progress/format';
import { useClay, useTheme } from '@/hooks/use-theme';

import { logMeal, type MealTime } from './api';
import { addMealLocally } from './meals-store';
import { MEAL_TIMES, mealTimeFor } from './nutrients';

type DraftFood = { key: number; name: string; amount: string };

const MAX_FOODS = 20;
const MAX_DAYS_BACK = 30;
let nextKey = 0;

const draftFood = (): DraftFood => ({ key: nextKey++, name: '', amount: '' });

/** The date `daysBack` days ago, at the current time of day. */
function eatenAt(daysBack: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysBack);
  return date.toISOString();
}

/**
 * Log a meal as food names and amounts. Saving sends it to the backend, which estimates the
 * nutrition with AI (a few seconds) and stores it; the meal's analysis opens straight after.
 */
export function LogMealScreen() {
  const theme = useTheme();
  const clay = useClay();
  const router = useRouter();
  const [mealTime, setMealTime] = useState<MealTime>(() => mealTimeFor(new Date()));
  const [foods, setFoods] = useState<DraftFood[]>(() => [draftFood(), draftFood()]);
  const [daysBack, setDaysBack] = useState(0);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string>();
  const amountRefs = useRef(new Map<number, TextInput | null>());

  function updateFood(key: number, change: Partial<DraftFood>) {
    setFoods((current) => current.map((food) => (food.key === key ? { ...food, ...change } : food)));
  }

  /** The foods as the API's `{ name: amount }` map, or an error to show. */
  function validate(): Record<string, string> | string {
    const filled = foods
      .map((food) => ({ name: food.name.trim(), amount: food.amount.trim() }))
      .filter((food) => food.name || food.amount);
    if (filled.length === 0) return 'Add at least one food.';
    if (filled.some((food) => !food.name)) return 'Every amount needs a food name.';
    if (filled.some((food) => !food.amount)) return 'Add an amount for each food, like “250g”.';
    const names = new Set(filled.map((food) => food.name.toLowerCase()));
    if (names.size !== filled.length) return 'Each food can only be listed once.';
    return Object.fromEntries(filled.map((food) => [food.name, food.amount]));
  }

  async function save() {
    setFormError(undefined);
    const mealItem = validate();
    if (typeof mealItem === 'string') {
      setFormError(mealItem);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setSaving(true);
    try {
      const { unrecognized, ...meal } = await logMeal({
        mealTime,
        mealItem,
        eatenAt: eatenAt(daysBack),
      });
      addMealLocally(meal);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({
        pathname: '/meal/[mealId]',
        params: {
          mealId: meal.id,
          ...(unrecognized.length > 0 && { ignored: unrecognized.map((u) => u.food).join(', ') }),
        },
      });
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFormError(errorMessage(e));
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={[styles.fill, { backgroundColor: theme.background }]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}>
        <Segmented
          options={MEAL_TIMES.map(({ value, label }) => ({ value, label }))}
          value={mealTime}
          onChange={setMealTime}
          accessibilityLabel="Meal"
        />

        <View style={[styles.dateRow, { backgroundColor: theme.surface }, clay.raised]}>
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
            {relativeDay(eatenAt(daysBack))}
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
            WHAT YOU ATE
          </Text>
          {foods.map((food, index) => (
            <Animated.View
              key={food.key}
              entering={FadeInDown.duration(220)}
              exiting={FadeOut.duration(150)}
              layout={LinearTransition.duration(200)}
              style={[styles.food, { backgroundColor: theme.surface }, clay.raised]}>
              <View style={styles.fields}>
                <TextInput
                  value={food.name}
                  onChangeText={(name) => updateFood(food.key, { name })}
                  placeholder={index === 0 ? 'Chicken' : index === 1 ? 'Rice' : 'Food'}
                  placeholderTextColor={theme.textSecondary}
                  maxLength={60}
                  autoCapitalize="sentences"
                  returnKeyType="next"
                  submitBehavior="submit"
                  onSubmitEditing={() => amountRefs.current.get(food.key)?.focus()}
                  accessibilityLabel={`Food ${index + 1} name`}
                  style={[
                    styles.input,
                    styles.nameInput,
                    { backgroundColor: theme.background, color: theme.text },
                    clay.sunken,
                  ]}
                />
                <TextInput
                  ref={(input) => {
                    amountRefs.current.set(food.key, input);
                  }}
                  value={food.amount}
                  onChangeText={(amount) => updateFood(food.key, { amount })}
                  placeholder={
                    index === 0 ? '250g cooked' : index === 1 ? '1 cup cooked' : 'Amount, e.g. 2 pieces'
                  }
                  placeholderTextColor={theme.textSecondary}
                  maxLength={100}
                  returnKeyType="done"
                  accessibilityLabel={`Food ${index + 1} amount`}
                  style={[
                    styles.input,
                    { backgroundColor: theme.background, color: theme.text },
                    clay.sunken,
                  ]}
                />
              </View>
              <Pressable
                onPress={() => setFoods((current) => current.filter((f) => f.key !== food.key))}
                disabled={foods.length === 1}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={`Remove food ${index + 1}`}
                style={({ pressed }) => [
                  styles.remove,
                  pressed && [{ backgroundColor: theme.background }, clay.sunken],
                  foods.length === 1 && styles.disabled,
                ]}>
                <Icon ios="xmark" material="close" size={16} color={theme.textSecondary} />
              </Pressable>
            </Animated.View>
          ))}
          <Animated.View layout={LinearTransition.duration(200)}>
            <Pressable
              onPress={() => setFoods((current) => [...current, draftFood()])}
              disabled={foods.length >= MAX_FOODS}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.addFood,
                { backgroundColor: theme.surface },
                pressed ? clay.sunken : clay.soft,
                foods.length >= MAX_FOODS && styles.disabled,
              ]}>
              <Icon ios="plus" material="add" size={18} color={theme.text} />
              <Text variant="bodyStrong">Add food</Text>
            </Pressable>
          </Animated.View>
          <Text variant="caption" color="textSecondary" style={styles.hint}>
            Amounts can be grams, pieces, cups or bowls. Say “cooked” or “raw” for meat, rice and
            lentils — it changes the numbers a lot.
          </Text>
        </View>

        {formError && (
          <Text variant="label" color="danger" accessibilityRole="alert">
            {formError}
          </Text>
        )}
        <SubmitButton label="Analyse and save" loading={saving} onPress={save} />
        {saving && (
          <Text
            variant="caption"
            color="textSecondary"
            style={styles.savingNote}
            accessibilityLiveRegion="polite">
            Estimating nutrition — this takes a few seconds.
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
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
  const clay = useClay();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.round,
        { backgroundColor: theme.surface },
        pressed ? clay.sunken : clay.soft,
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
    gap: Spacing.three,
  },
  sectionTitle: {
    paddingHorizontal: Spacing.one,
    letterSpacing: 1.2,
    fontSize: 12,
  },
  food: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.large,
    borderCurve: 'continuous',
  },
  fields: {
    flex: 1,
    gap: Spacing.two,
  },
  input: {
    height: 44,
    paddingHorizontal: Spacing.three,
    paddingVertical: 0,
    borderRadius: Radius.small,
    borderCurve: 'continuous',
    fontFamily: FontFamily.body,
    fontSize: 16,
  },
  nameInput: {
    fontFamily: FontFamily.bodySemiBold,
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
  addFood: {
    minHeight: 52,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  hint: {
    paddingHorizontal: Spacing.one,
  },
  savingNote: {
    textAlign: 'center',
    marginTop: -Spacing.two,
  },
});
