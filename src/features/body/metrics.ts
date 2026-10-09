/**
 * Body metrics for the calculator: BMI with the WHO adult bands, and maintenance calories from
 * the Mifflin-St Jeor equation times an activity factor. Everything is metric (kg, cm), like the
 * rest of Forge.
 */

import { Temper } from '@/constants/theme';
import type { FitnessGoal } from '@/features/onboarding/api';

export type Sex = 'male' | 'female';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive';

export const ACTIVITY: Record<ActivityLevel, { label: string; detail: string; factor: number }> = {
  sedentary: { label: 'Sedentary', detail: 'Desk job, little or no exercise', factor: 1.2 },
  light: { label: 'Lightly active', detail: 'Training 1–3 days a week', factor: 1.375 },
  moderate: { label: 'Moderately active', detail: 'Training 3–5 days a week', factor: 1.55 },
  active: { label: 'Very active', detail: 'Hard training 6–7 days a week', factor: 1.725 },
  veryActive: {
    label: 'Extremely active',
    detail: 'Physical job plus daily training',
    factor: 1.9,
  },
};

/** Valid input ranges, matching what onboarding and forge-backend accept. */
export const LIMITS = {
  age: { min: 13, max: 100 },
  heightCm: { min: 100, max: 250 },
  weightKg: { min: 30, max: 300 },
} as const;

export function bmi(weightKg: number, heightCm: number) {
  const metres = heightCm / 100;
  return weightKg / (metres * metres);
}

export type BmiBand = 'underweight' | 'healthy' | 'overweight' | 'obese';

/** WHO adult bands. Each `upTo` is exclusive; obese has no upper bound. */
export const BMI_BANDS: { band: BmiBand; label: string; upTo: number }[] = [
  { band: 'underweight', label: 'Underweight', upTo: 18.5 },
  { band: 'healthy', label: 'Healthy', upTo: 25 },
  { band: 'overweight', label: 'Overweight', upTo: 30 },
  { band: 'obese', label: 'Obese', upTo: Infinity },
];

export function bmiBand(value: number) {
  return BMI_BANDS.find((b) => value < b.upTo) ?? BMI_BANDS[BMI_BANDS.length - 1];
}

/** The colour each band wears in the gauge and on the home screen. */
export function bandColor(band: BmiBand, theme: { up: string; danger: string }) {
  switch (band) {
    case 'underweight':
      return Temper.lower;
    case 'healthy':
      return theme.up;
    case 'overweight':
      return Temper.push;
    case 'obese':
      return theme.danger;
  }
}

/** The weights that put this height in the healthy band (BMI 18.5 to 24.9). */
export function healthyWeightRange(heightCm: number) {
  const metres = heightCm / 100;
  return { min: 18.5 * metres * metres, max: 24.9 * metres * metres };
}

/** Basal metabolic rate (kcal/day), Mifflin-St Jeor. */
export function bmr(sex: Sex, weightKg: number, heightCm: number, age: number) {
  return 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'male' ? 5 : -161);
}

/** Calories a day to hold the current weight. */
export function maintenance(basal: number, activity: ActivityLevel) {
  return basal * ACTIVITY[activity].factor;
}

/**
 * Daily targets per goal: a 500 kcal deficit loses about 0.5 kg a week, a 500 surplus gains about
 * as much, and a smaller 250 surplus keeps a muscle-building phase lean.
 */
export const GOAL_TARGETS: { goal: FitnessGoal; label: string; detail: string; offset: number }[] = [
  { goal: 'WEIGHT_LOSS', label: 'Lose weight', detail: 'About 0.5 kg a week', offset: -500 },
  { goal: 'MUSCLE_BUILDING', label: 'Build muscle', detail: 'Lean surplus', offset: 250 },
  { goal: 'WEIGHT_GAIN', label: 'Gain weight', detail: 'About 0.5 kg a week', offset: 500 },
];

/** Calories are only meaningful to the nearest ten. */
export function roundCalories(kcal: number) {
  return Math.round(kcal / 10) * 10;
}

/** Parses a typed number, accepting a comma as the decimal mark. Empty or invalid is undefined. */
export function parseNumber(text: string) {
  const value = Number(text.trim().replace(',', '.'));
  return text.trim() && Number.isFinite(value) ? value : undefined;
}
