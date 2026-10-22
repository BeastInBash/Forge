import { apiRequest } from '@/lib/api';

export type LiftSet = {
  id: string;
  /** Load in kg; null for bodyweight. */
  weight: number | null;
  reps: number;
};

/** One exercise as performed in one session. */
export type Lift = {
  id: string;
  exerciseId: string;
  /** ISO 8601 date-time. */
  performedAt: string;
  note: string | null;
  sets: LiftSet[];
};

export type LiftExercise = { id: string; name: string; iconUrl: string | null };

/** A row of `GET /api/v1/lifts`: one per exercise the user has logged. */
export type LiftSummary = {
  exercise: LiftExercise;
  sessions: number;
  last: Lift;
  /** The all-time best set by estimated one-rep max. */
  best: { weight: number | null; reps: number; performedAt: string } | null;
  /** Best estimated max (or reps, for bodyweight) of the last few sessions, oldest first. */
  trend: number[];
};

export type LiftHistory = { exercise: LiftExercise; lifts: Lift[] };

export type LiftInput = {
  exerciseId: string;
  performedAt: string;
  sets: { weight: number | null; reps: number }[];
  note?: string;
};

type ApiExercise = { id: string; exercise_name: string; exercise_icon: string | null };
type ApiLift = Lift;

const toExercise = (exercise: ApiExercise): LiftExercise => ({
  id: exercise.id,
  name: exercise.exercise_name,
  iconUrl: exercise.exercise_icon,
});

const toLift = (lift: ApiLift): Lift => ({
  id: lift.id,
  exerciseId: lift.exerciseId,
  performedAt: lift.performedAt,
  note: lift.note,
  sets: lift.sets.map(({ id, weight, reps }) => ({ id, weight, reps })),
});

export async function fetchLiftSummaries(): Promise<LiftSummary[]> {
  const rows =
    await apiRequest<
      (Omit<LiftSummary, 'exercise' | 'last'> & { exercise: ApiExercise; last: ApiLift })[]
    >('/api/v1/lifts');
  return rows.map((row) => ({
    ...row,
    exercise: toExercise(row.exercise),
    last: toLift(row.last),
  }));
}

export async function fetchLiftHistory(exerciseId: string): Promise<LiftHistory> {
  const data = await apiRequest<{ exercise: ApiExercise; lifts: ApiLift[] }>(
    `/api/v1/lifts/exercise/${exerciseId}`
  );
  return { exercise: toExercise(data.exercise), lifts: data.lifts.map(toLift) };
}

export const logLift = async (input: LiftInput) =>
  toLift(
    await apiRequest<ApiLift>('/api/v1/lifts', { method: 'POST', body: JSON.stringify(input) })
  );

export const deleteLift = (id: string) =>
  apiRequest<null>(`/api/v1/lifts/${id}`, { method: 'DELETE' });
