import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import type { ImagePickerAsset } from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';

import { Icon } from '@/components/ui/icon';
import { IconBadge } from '@/components/ui/icon-badge';
import { Segmented } from '@/components/ui/segmented';
import { SectionLabel } from '@/components/ui/section-label';
import { Text } from '@/components/ui/text';
import { FontFamily, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { SubmitButton } from '@/features/auth/components/submit-button';
import { errorMessage } from '@/features/auth/validation';
import { relativeDay } from '@/features/progress/format';
import { useSurface, useTheme } from '@/hooks/use-theme';

import { logMeal, recognizeMealPhoto, type MealTime } from './api';
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
  const surface = useSurface();
  const router = useRouter();
  const [mealTime, setMealTime] = useState<MealTime>(() => mealTimeFor(new Date()));
  const [foods, setFoods] = useState<DraftFood[]>(() => [draftFood(), draftFood()]);
  const [daysBack, setDaysBack] = useState(0);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [photo, setPhoto] = useState<ImagePickerAsset>();
  const [photoNote, setPhotoNote] = useState<string>();
  const [recognizing, setRecognizing] = useState(false);
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

  /** Takes or picks a meal photo, then fills the foods with what the AI saw in it. */
  async function snapMeal(source: 'camera' | 'library') {
    setFormError(undefined);
    // Loaded on demand, as in add-exercise-screen: an older build without the module still starts.
    let ImagePicker: typeof import('expo-image-picker');
    try {
      ImagePicker = await import('expo-image-picker');
    } catch {
      setFormError('This build can’t take photos yet. Update the app.');
      return;
    }
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setFormError('Allow camera access in Settings to snap your meal.');
        return;
      }
    }
    // Quality 0.5 keeps a phone photo well under the backend's 4 MB limit; the AI needs no more.
    const options = { mediaTypes: 'images', quality: 0.5 } as const;
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled) return;

    const image = result.assets[0];
    setPhoto(image);
    setPhotoNote(undefined);
    setRecognizing(true);
    try {
      const found = (await recognizeMealPhoto(image)).slice(0, MAX_FOODS);
      setFoods(
        found.map((item) => ({
          key: nextKey++,
          name: item.food.slice(0, 60),
          amount: item.amount.slice(0, 100),
        })),
      );
      setPhotoNote(
        `Found ${found.length} ${found.length === 1 ? 'food' : 'foods'}. Check the amounts, then save.`,
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setPhoto(undefined);
      setFormError(errorMessage(e));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setRecognizing(false);
    }
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

        <View style={[styles.dateRow, { backgroundColor: theme.surface }, surface.raised]}>
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

        <View style={[styles.photoCard, { backgroundColor: theme.surface }, surface.raised]}>
          <View style={styles.photoHeader}>
            {photo ? (
              <Image
                source={photo.uri}
                style={styles.thumb}
                contentFit="cover"
                accessibilityLabel="Your meal photo"
              />
            ) : (
              <IconBadge
                ios="camera"
                material="photo_camera"
                color={theme.text}
                background={theme.background}
                border={theme.line}
                size={40}
              />
            )}
            <View style={styles.flex}>
              <Text variant="bodyStrong">Snap your meal</Text>
              <Text variant="caption" color="textSecondary" accessibilityLiveRegion="polite">
                {recognizing
                  ? 'Looking at your photo — this takes a few seconds.'
                  : (photoNote ?? 'AI lists the foods and amounts for you to check.')}
              </Text>
            </View>
            {recognizing && <ActivityIndicator color={theme.textSecondary} />}
          </View>
          <View style={styles.photoButtons}>
            <PhotoButton
              ios="camera"
              material="photo_camera"
              label="Take photo"
              disabled={recognizing || saving}
              onPress={() => snapMeal('camera')}
            />
            <PhotoButton
              ios="photo.on.rectangle"
              material="photo_library"
              label="Choose photo"
              disabled={recognizing || saving}
              onPress={() => snapMeal('library')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <SectionLabel icon={{ ios: 'fork.knife', material: 'restaurant' }}>What you ate</SectionLabel>
          {foods.map((food, index) => (
            <Animated.View
              key={food.key}
              entering={FadeInDown.duration(220)}
              exiting={FadeOut.duration(150)}
              layout={LinearTransition.duration(200)}
              style={[styles.food, { backgroundColor: theme.surface }, surface.raised]}>
              <View style={[styles.foodNumber, { backgroundColor: theme.mint }]}>
                <Text variant="caption" style={[styles.foodNumberText, { color: theme.onMint }]}>
                  {index + 1}
                </Text>
              </View>
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
                    surface.sunken,
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
                    surface.sunken,
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
                  pressed && [{ backgroundColor: theme.background }, surface.sunken],
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
                pressed ? surface.sunken : surface.soft,
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
        <SubmitButton
          label="Analyse and save"
          loading={saving}
          disabled={recognizing}
          onPress={save}
        />
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

function PhotoButton({
  ios,
  material,
  label,
  disabled,
  onPress,
}: {
  ios: 'camera' | 'photo.on.rectangle';
  material: 'photo_camera' | 'photo_library';
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const surface = useSurface();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.photoButton,
        { backgroundColor: theme.surface },
        pressed ? surface.sunken : surface.soft,
        disabled && styles.disabled,
      ]}>
      <Icon ios={ios} material={material} size={18} color={theme.text} />
      <Text variant="bodyStrong">{label}</Text>
    </Pressable>
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
  const surface = useSurface();
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
        pressed ? surface.sunken : surface.soft,
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
    paddingHorizontal: Spacing.screen,
    paddingVertical: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.five,
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
  photoCard: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
  },
  photoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: Radius.small,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  photoButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: Radius.small,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  foodNumber: {
    alignSelf: 'flex-start',
    width: 24,
    height: 24,
    marginTop: Spacing.two + Spacing.half,
    borderRadius: Radius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodNumberText: {
    fontFamily: FontFamily.bodySemiBold,
  },
  food: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.medium,
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
    borderRadius: Radius.small,
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
