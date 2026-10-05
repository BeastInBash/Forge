/**
 * Client-side shapes for training and nutrition data. They mirror the forge-backend Prisma models
 * (`Workout_Plan`, `Workout_Exercise`, `Exercise`, `Meal_Time`, `Food_Items`) with camelCased keys,
 * plus the few presentation fields the app derives (`split`, `logged`).
 */

import type { TemperKey } from '@/constants/theme';

export type Weekday =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export type Exercise = {
  id: string;
  name: string;
  iconUrl?: string;
  videoUrl?: string;
};

export type WorkoutExercise = {
  id: string;
  exercise: Exercise;
  sets: number;
  repetition: number;
  order: number;
};

export type WorkoutPlan = {
  id: string;
  day: Weekday;
  /** ISO 8601 date-time the session is planned for. */
  time: string;
  muscleGroup: string;
  /** Which tempering colour the plan is drawn in. */
  split: Exclude<TemperKey, 'rest'>;
  exercises: WorkoutExercise[];
};

export type FoodItem = {
  id: string;
  name: string;
  calories: number;
};

export type MealTime = {
  id: string;
  name: string;
  /** 24h clock, e.g. "08:00". */
  at: string;
  foods: FoodItem[];
  logged: boolean;
};
