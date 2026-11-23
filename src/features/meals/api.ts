import type { ImagePickerAsset } from 'expo-image-picker';

import { appendImage } from '@/features/exercises/image-part';
import { apiRequest } from '@/lib/api';

export type MealTime = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type NutrientGroup = 'energy' | 'macros' | 'vitamins' | 'minerals';

/** Rounded nutrient amounts, grouped as the API returns them; units are in `Meal.units`. */
export type NutritionReport = Record<NutrientGroup, Record<string, number>>;

export type MealItem = {
  /** The name and amount as the user typed them. */
  food: string;
  amount: string;
  /** What the AI understood, e.g. "Chicken breast". */
  name: string;
  grams: number;
  state: 'raw' | 'cooked' | null;
  assumption: string | null;
  /** 0–1; below 0.5 the estimate is worth a second look. */
  confidence: number;
  nutrition: NutritionReport;
};

/** A logged meal with its full analysis (`GET /api/v1/meals/:id`). */
export type Meal = {
  id: string;
  mealTime: MealTime;
  /** ISO 8601 date-time. */
  eatenAt: string;
  items: MealItem[];
  total: NutritionReport;
  /** Unit of each nutrient, e.g. `{ calories: 'kcal', vitaminC: 'mg' }`. */
  units: Record<string, string>;
  disclaimer: string;
};

/** A row of the meal history. */
export type MealSummary = {
  id: string;
  mealTime: MealTime;
  eatenAt: string;
  foods: string[];
  total: { calories: number; protein: number; carbs: number; fat: number };
};

export type MealPage = { meals: MealSummary[]; nextBefore: string | null };

/** Everything eaten on one local day, summed by the backend (`GET /api/v1/meals/day`). */
export type MealDay = {
  /** Local "YYYY-MM-DD". */
  date: string;
  timezone: string;
  mealCount: number;
  total: NutritionReport;
  units: Record<string, string>;
};

export type MealInput = {
  mealTime: MealTime;
  /** Food name → amount, e.g. `{ Chicken: '250g cooked' }`. */
  mealItem: Record<string, string>;
  eatenAt: string;
};

/** A just-logged meal, plus the entries that weren't recognised as food (and weren't saved). */
export type LoggedMeal = Meal & { unrecognized: { food: string; amount: string }[] };

/** The AI analysis can take a while; allow it well past the default limit. */
const LOG_MEAL_TIMEOUT_MS = 60_000;

export function fetchMeals(before?: string): Promise<MealPage> {
  const query = before ? `?before=${encodeURIComponent(before)}` : '';
  return apiRequest<MealPage>(`/api/v1/meals${query}`);
}

export const fetchMealDay = (date: string, timezone: string) =>
  apiRequest<MealDay>(
    `/api/v1/meals/day?date=${date}&timezone=${encodeURIComponent(timezone)}`
  );

export const fetchMeal = (id: string) => apiRequest<Meal>(`/api/v1/meals/${id}`);

/** Analyses the meal with AI and saves it; takes a few seconds. */
export const logMeal = (input: MealInput) =>
  apiRequest<LoggedMeal>('/api/v1/meals', {
    method: 'POST',
    body: JSON.stringify(input),
    timeoutMs: LOG_MEAL_TIMEOUT_MS,
  });

/** A food the AI saw in a meal photo, to check and edit before logging. */
export type PhotoFood = { food: string; amount: string };

/** Sends a meal photo for the AI to list its foods with estimated amounts. Saves nothing. */
export async function recognizeMealPhoto(image: ImagePickerAsset) {
  const form = new FormData();
  await appendImage(form, 'image', image);
  const { foods } = await apiRequest<{ foods: PhotoFood[] }>('/api/v1/meals/photo', {
    method: 'POST',
    body: form,
    timeoutMs: LOG_MEAL_TIMEOUT_MS,
  });
  return foods;
}

export const deleteMeal = (id: string) =>
  apiRequest<null>(`/api/v1/meals/${id}`, { method: 'DELETE' });
