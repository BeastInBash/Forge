import type { SessionExercise, TimerSegment, WorkoutSession } from './session-store';

/** Timer time up to `at`: the part of every segment that falls before it. */
export function timerTime(timer: TimerSegment[], at: number) {
  return timer.reduce(
    (sum, { start, end }) => sum + Math.max(0, Math.min(end ?? at, at) - start),
    0
  );
}

/** How long each set took, in ms; null when it wasn't timed. Same order as `exercise.sets`. */
export function setDurations(exercise: SessionExercise): (number | null)[] {
  const durations: (number | null)[] = exercise.sets.map(() => null);
  const firstStart = exercise.timer[0]?.start;
  if (firstStart === undefined) return durations;

  const order = exercise.sets
    .map((set, index) => ({ set, index }))
    .filter(({ set }) => set.completedAt !== undefined && set.completedAt >= firstStart)
    .sort((a, b) => a.set.completedAt! - b.set.completedAt!);

  let previous = 0;
  for (const { set, index } of order) {
    const at = timerTime(exercise.timer, set.completedAt!);
    if (!set.untimed) durations[index] = at - previous;
    previous = at;
  }
  return durations;
}

/** Timer time when the most recent set was checked (0 if none since the timer started). */
export function lastTickTime(exercise: SessionExercise) {
  const ticks = exercise.sets
    .filter((set) => set.completedAt !== undefined)
    .map((set) => timerTime(exercise.timer, set.completedAt!));
  return Math.max(0, ...ticks);
}

/** The exercise's time so far, or in total once done; null before its timer is started. */
export function exerciseDuration(exercise: SessionExercise, now: number) {
  if (!exercise.timer.length) return null;
  return timerTime(exercise.timer, exercise.completedAt ?? now);
}

export function sessionDuration(session: WorkoutSession, now: number) {
  return timerTime(session.clock, session.finishedAt ?? now);
}

export function setCounts(session: WorkoutSession) {
  const sets = session.exercises.flatMap((exercise) => exercise.sets);
  return { done: sets.filter((set) => set.completedAt !== undefined).length, total: sets.length };
}

/** "0:42", "12:05", "1:02:09". */
export function formatClock(ms: number) {
  const total = Math.floor(ms / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = String(total % 60).padStart(2, '0');
  return hours
    ? `${hours}:${String(minutes).padStart(2, '0')}:${seconds}`
    : `${minutes}:${seconds}`;
}

/** "42 s", "12 min", "1 h 5 min" — for summaries. */
export function formatSpan(ms: number) {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}
