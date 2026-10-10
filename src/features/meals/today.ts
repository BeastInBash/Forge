import type { MealSummary } from './api';

/** Local calendar day of an ISO date-time, e.g. "2026-10-10". */
export function localDay(iso: string) {
  const date = new Date(iso);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

/** The meals eaten on `now`'s local day, in the order given. */
export function mealsOn(meals: MealSummary[], now: Date) {
  const day = localDay(now.toISOString());
  return meals.filter((meal) => localDay(meal.eatenAt) === day);
}

/** Calories and macros of several meals added up. */
export function sumMeals(meals: MealSummary[]): MealSummary['total'] {
  return meals.reduce(
    (sum, { total }) => ({
      calories: sum.calories + total.calories,
      protein: sum.protein + total.protein,
      carbs: sum.carbs + total.carbs,
      fat: sum.fat + total.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}
