import { apiRequest } from '@/lib/api';
import type { Weekday, WorkoutPlan } from '@/types/training';

import { splitFor } from './split';

/** A plan as forge-backend returns it (`GET /api/v1/workout`). */
type ApiPlan = {
  id: string;
  day: Weekday;
  time: string;
  muscle_group: string;
  workoutExercises: {
    id: string;
    exerciseId: string;
    sets: number;
    repetition: number;
    weight: number | null;
    order: number;
    exercise: { id: string; exercise_name: string; exercise_icon: string | null };
  }[];
};

/**
 * One exercise of a plan, in order: a catalog pick by id, or (from a split template) a name the
 * backend finds in the catalog, or adds to it, by its case-insensitive name.
 */
export type PlanExerciseInput = ({ exerciseId: string } | { exerciseName: string }) & {
  sets: number;
  repetition: number;
  weight: number | null;
};

/** What the editor sends. */
export type PlanInput = {
  day: Weekday;
  /** ISO 8601 date-time; only the time of day is shown. */
  time: string;
  muscleGroup: string;
  exercises: PlanExerciseInput[];
};

function toPlan(plan: ApiPlan): WorkoutPlan {
  return {
    id: plan.id,
    day: plan.day,
    time: plan.time,
    muscleGroup: plan.muscle_group,
    split: splitFor(plan.muscle_group),
    exercises: plan.workoutExercises.map((item) => ({
      id: item.id,
      exercise: {
        id: item.exercise.id,
        name: item.exercise.exercise_name,
        iconUrl: item.exercise.exercise_icon ?? undefined,
      },
      sets: item.sets,
      repetition: item.repetition,
      weight: item.weight,
      order: item.order,
    })),
  };
}

function toBody(input: PlanInput) {
  return JSON.stringify({
    day: input.day,
    time: input.time,
    muscle_group: input.muscleGroup,
    exercises: input.exercises.map(({ sets, repetition, weight, ...exercise }) =>
      'exerciseId' in exercise
        ? { exerciseId: exercise.exerciseId, sets, repetition, weight }
        : { exercise_name: exercise.exerciseName, sets, repetition, weight }
    ),
  });
}

export const fetchPlans = async () =>
  (await apiRequest<ApiPlan[]>('/api/v1/workout')).map(toPlan);

export const createPlan = async (input: PlanInput) =>
  toPlan(
    await apiRequest<ApiPlan>('/api/v1/workout/create-workout', {
      method: 'POST',
      body: toBody(input),
    })
  );

export const updatePlan = async (id: string, input: PlanInput) =>
  toPlan(
    await apiRequest<ApiPlan>(`/api/v1/workout/${id}`, { method: 'PUT', body: toBody(input) })
  );

export const deletePlan = (id: string) =>
  apiRequest<null>(`/api/v1/workout/${id}`, { method: 'DELETE' });
