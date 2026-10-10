import type { ComponentProps } from 'react';

import type { Icon } from '@/components/ui/icon';

import type { MealTime } from './api';

type IconName = Pick<ComponentProps<typeof Icon>, 'ios' | 'material'>;

export const MEAL_TIMES: { value: MealTime; label: string; icon: IconName }[] = [
  { value: 'breakfast', label: 'Breakfast', icon: { ios: 'sunrise', material: 'wb_twilight' } },
  { value: 'lunch', label: 'Lunch', icon: { ios: 'sun.max', material: 'light_mode' } },
  { value: 'dinner', label: 'Dinner', icon: { ios: 'moon', material: 'dark_mode' } },
  { value: 'snack', label: 'Snack', icon: { ios: 'carrot', material: 'nutrition' } },
];

export const mealTimeInfo = (value: MealTime) =>
  MEAL_TIMES.find((m) => m.value === value) ?? MEAL_TIMES[0];

/** The meal time that fits the hour, so the log screen usually starts on the right one. */
export function mealTimeFor(date: Date): MealTime {
  const hour = date.getHours();
  if (hour >= 4 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 16) return 'lunch';
  if (hour >= 18 && hour < 23) return 'dinner';
  return 'snack';
}

/**
 * Display names and FDA Daily Values (adults, 2,000 kcal diet; 21 CFR 101.9). `limit` marks
 * nutrients where the Daily Value is a ceiling rather than a target. Sugar has no Daily Value.
 */
export const NUTRIENT_INFO: Record<string, { label: string; daily?: number; limit?: boolean }> = {
  calories: { label: 'Calories', daily: 2000 },
  protein: { label: 'Protein', daily: 50 },
  carbs: { label: 'Carbs', daily: 275 },
  fat: { label: 'Fat', daily: 78, limit: true },
  fiber: { label: 'Fiber', daily: 28 },
  sugar: { label: 'Sugar' },
  saturatedFat: { label: 'Saturated fat', daily: 20, limit: true },
  cholesterol: { label: 'Cholesterol', daily: 300, limit: true },
  vitaminA: { label: 'Vitamin A', daily: 900 },
  vitaminB1: { label: 'Thiamin (B1)', daily: 1.2 },
  vitaminB2: { label: 'Riboflavin (B2)', daily: 1.3 },
  vitaminB3: { label: 'Niacin (B3)', daily: 16 },
  vitaminB6: { label: 'Vitamin B6', daily: 1.7 },
  vitaminB12: { label: 'Vitamin B12', daily: 2.4 },
  folate: { label: 'Folate', daily: 400 },
  vitaminC: { label: 'Vitamin C', daily: 90 },
  vitaminD: { label: 'Vitamin D', daily: 20 },
  vitaminE: { label: 'Vitamin E', daily: 15 },
  vitaminK: { label: 'Vitamin K', daily: 120 },
  calcium: { label: 'Calcium', daily: 1300 },
  iron: { label: 'Iron', daily: 18 },
  magnesium: { label: 'Magnesium', daily: 420 },
  phosphorus: { label: 'Phosphorus', daily: 1250 },
  potassium: { label: 'Potassium', daily: 4700 },
  sodium: { label: 'Sodium', daily: 2300, limit: true },
  zinc: { label: 'Zinc', daily: 11 },
};

export const nutrientLabel = (key: string) => NUTRIENT_INFO[key]?.label ?? key;

/** Share of the Daily Value as a whole percentage, or undefined when there is none. */
export function dailyPercent(key: string, amount: number) {
  const daily = NUTRIENT_INFO[key]?.daily;
  return daily ? Math.round((amount / daily) * 100) : undefined;
}

const decimal = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });
const small = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
const whole = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });

/** `412` → "412", `9.04` → "9", `0.85` → "0.85": as precise as the size of the number needs. */
export function formatAmount(value: number) {
  if (value >= 100) return whole.format(value);
  if (value >= 1) return decimal.format(value);
  return small.format(value);
}

/** Share of the meal's calories from protein, carbs and fat (4, 4 and 9 kcal per gram). */
export function macroSplit({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const kcal = { protein: protein * 4, carbs: carbs * 4, fat: fat * 9 };
  const sum = kcal.protein + kcal.carbs + kcal.fat;
  if (!sum) return { protein: 0, carbs: 0, fat: 0 };
  return { protein: kcal.protein / sum, carbs: kcal.carbs / sum, fat: kcal.fat / sum };
}
