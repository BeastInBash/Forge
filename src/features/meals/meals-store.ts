/**
 * The signed-in user's logged meals: the history list for the Nutrition tab, and each meal's
 * full analysis once it has been opened. Screens read the in-memory copy straight away and
 * refresh it on focus; logging or deleting a meal updates the cache locally first.
 */

import { errorMessage } from '@/features/auth/validation';
import { deviceTimezone } from '@/features/water/api';

import {
  fetchMeal,
  fetchMealDay,
  fetchMeals,
  type Meal,
  type MealDay,
  type MealSummary,
} from './api';
import { isoDay } from './today';

type DetailState = { meal?: Meal; error?: string };

export type MealsState = {
  meals?: MealSummary[];
  /** Pass to `fetchMeals` for the next, older page; null when everything is loaded. */
  nextBefore?: string | null;
  error?: string;
  loadingMore: boolean;
  details: Record<string, DetailState>;
  /** Today's full nutrient totals, summed by the backend. */
  day?: MealDay;
};

let state: MealsState = { loadingMore: false, details: {} };
let listInFlight: Promise<void> | undefined;
let dayInFlight: Promise<void> | undefined;
const detailsInFlight = new Map<string, Promise<void>>();
const listeners = new Set<() => void>();

function setState(next: MealsState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function setDetail(id: string, next: DetailState) {
  setState({ ...state, details: { ...state.details, [id]: next } });
}

const newestFirst = (a: { eatenAt: string }, b: { eatenAt: string }) =>
  b.eatenAt.localeCompare(a.eatenAt);

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getSnapshot = () => state;

/** Refetches the newest page of meals; overlapping calls share one request. Never throws. */
export function revalidateMeals(): Promise<void> {
  listInFlight ??= (async () => {
    try {
      const page = await fetchMeals();
      setState({ ...state, meals: page.meals, nextBefore: page.nextBefore, error: undefined });
    } catch (e) {
      setState({ ...state, error: errorMessage(e) });
    }
  })().finally(() => {
    listInFlight = undefined;
  });
  return listInFlight;
}

/**
 * Refetches today's nutrient totals; overlapping calls share one request. Never throws: on
 * failure the last totals stay, and screens fall back to summing the history.
 */
export function revalidateMealDay(): Promise<void> {
  dayInFlight ??= (async () => {
    try {
      setState({ ...state, day: await fetchMealDay(isoDay(new Date()), deviceTimezone()) });
    } catch {
      // Keep the last totals
    }
  })().finally(() => {
    dayInFlight = undefined;
  });
  return dayInFlight;
}

/** Appends the next, older page of meals. Never throws. */
export async function loadMoreMeals() {
  const { meals, nextBefore, loadingMore } = state;
  if (!meals || !nextBefore || loadingMore) return;
  setState({ ...state, loadingMore: true });
  try {
    const page = await fetchMeals(nextBefore);
    const known = new Set(meals.map((m) => m.id));
    setState({
      ...state,
      meals: [...meals, ...page.meals.filter((m) => !known.has(m.id))],
      nextBefore: page.nextBefore,
      loadingMore: false,
    });
  } catch (e) {
    setState({ ...state, loadingMore: false, error: errorMessage(e) });
  }
}

/** Refetches one meal's analysis. Never throws. */
export function revalidateMeal(id: string): Promise<void> {
  let request = detailsInFlight.get(id);
  if (!request) {
    request = (async () => {
      try {
        setDetail(id, { meal: await fetchMeal(id) });
      } catch (e) {
        setDetail(id, { ...state.details[id], error: errorMessage(e) });
      }
    })().finally(() => detailsInFlight.delete(id));
    detailsInFlight.set(id, request);
  }
  return request;
}

/** The history row for a meal, derived from its analysis. */
export function toSummary(meal: Meal): MealSummary {
  const { energy, macros } = meal.total;
  return {
    id: meal.id,
    mealTime: meal.mealTime,
    eatenAt: meal.eatenAt,
    foods: meal.items.map((item) => item.name),
    total: {
      calories: energy.calories ?? 0,
      protein: macros.protein ?? 0,
      carbs: macros.carbs ?? 0,
      fat: macros.fat ?? 0,
    },
  };
}

/** Caches a newly logged meal so its detail opens instantly and the history shows it. */
export function addMealLocally(meal: Meal) {
  setState({
    ...state,
    meals: state.meals && [toSummary(meal), ...state.meals].sort(newestFirst),
    details: { ...state.details, [meal.id]: { meal } },
  });
  revalidateMealDay();
}

export function removeMealLocally(id: string) {
  const { [id]: _removed, ...details } = state.details;
  setState({ ...state, meals: state.meals?.filter((m) => m.id !== id), details });
  revalidateMealDay();
}

/** Cached meals are per user; drop them on sign-out. */
export function clearMeals() {
  setState({ loadingMore: false, details: {} });
}
