import { apiURL, authHeaders } from '@/lib/auth-client';
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

/** What the editor sends; exercises are catalog picks, in order. */
export type PlanInput = {
  day: Weekday;
  /** ISO 8601 date-time; only the time of day is shown. */
  time: string;
  muscleGroup: string;
  exercises: { exerciseId: string; sets: number; repetition: number; weight: number | null }[];
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

function toBody(input: PlanInput) {
  return JSON.stringify({
    day: input.day,
    time: input.time,
    muscle_group: input.muscleGroup,
    exercises: input.exercises,
  });
}

export const fetchPlans = async () => (await request<ApiPlan[]>('/api/v1/workout')).map(toPlan);

export const createPlan = async (input: PlanInput) =>
  toPlan(
    await request<ApiPlan>('/api/v1/workout/create-workout', {
      method: 'POST',
      body: toBody(input),
    })
  );

export const updatePlan = async (id: string, input: PlanInput) =>
  toPlan(await request<ApiPlan>(`/api/v1/workout/${id}`, { method: 'PUT', body: toBody(input) }));

export const deletePlan = (id: string) =>
  request<null>(`/api/v1/workout/${id}`, { method: 'DELETE' });
