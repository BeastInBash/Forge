import { apiURL, authHeaders } from '@/lib/auth-client';

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

export type MealInput = {
  mealTime: MealTime;
  /** Food name → amount, e.g. `{ Chicken: '250g cooked' }`. */
  mealItem: Record<string, string>;
  eatenAt: string;
};

/** A just-logged meal, plus the entries that weren't recognised as food (and weren't saved). */
export type LoggedMeal = Meal & { unrecognized: { food: string; amount: string }[] };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiURL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...authHeaders(), ...init?.headers },
      credentials: 'include',
    });
  } catch {
    throw new Error('Can’t reach Forge right now. Check your connection.');
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || 'Something went wrong. Try again.');
  return body.data;
}

export function fetchMeals(before?: string): Promise<MealPage> {
  const query = before ? `?before=${encodeURIComponent(before)}` : '';
  return request<MealPage>(`/api/v1/meals${query}`);
}

export const fetchMeal = (id: string) => request<Meal>(`/api/v1/meals/${id}`);

/** Analyses the meal with AI and saves it; takes a few seconds. */
export const logMeal = (input: MealInput) =>
  request<LoggedMeal>('/api/v1/meals', { method: 'POST', body: JSON.stringify(input) });

export const deleteMeal = (id: string) =>
  request<null>(`/api/v1/meals/${id}`, { method: 'DELETE' });
