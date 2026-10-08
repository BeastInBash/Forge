/**
 * The workout in progress. Everything is stored as timestamps rather than running counters, so
 * the clocks stay right while the app is in the background or closed, and the session is saved
 * to disk on every change so it survives a restart.
 *
 * Timing rules: an exercise's timer runs in segments — started with its timer button, stopped
 * with the stop button or by checking its last set — and only time inside a segment counts. Each
 * set's time is the timer time between the previous checked set (or the timer start) and its own
 * check. Checking a whole exercise at once completes its remaining sets together, so only the
 * exercise gets a time, not those sets. Resetting the timer clears its segments; sets already
 * checked keep their tick but lose their time.
 */

import { readPersisted, writePersisted } from '@/lib/persisted';
import type { WorkoutPlan } from '@/types/training';

export type SessionSet = {
  reps: number;
  weight: number | null;
  /** When the set was checked off; undefined while it's still to do. */
  completedAt?: number;
  /** Checked as part of a whole exercise, or before a timer reset, so it has no time of its own. */
  untimed?: boolean;
};

export type TimerSegment = { start: number; end?: number };

export type SessionExercise = {
  /** The plan row's id. */
  id: string;
  exerciseId: string;
  name: string;
  iconUrl: string | null;
  sets: SessionSet[];
  /** When the exercise's timer ran; the last segment has no `end` while it's running. */
  timer: TimerSegment[];
  /** When its last set was checked. */
  completedAt?: number;
};

export type WorkoutSession = {
  planId: string;
  muscleGroup: string;
  split: WorkoutPlan['split'];
  startedAt: number;
  /**
   * When the session clock ran. It starts with the session, can be stopped and started again,
   * and stops when the session finishes; the last segment has no `end` while it's running.
   */
  clock: TimerSegment[];
  /** Set when the last exercise is completed, or when the user ends the session early. */
  finishedAt?: number;
  /** Ended with the Finish button; the session is then read-only. */
  endedEarly?: boolean;
  exercises: SessionExercise[];
  /** True once the finished session's sets were logged to Progress. */
  savedToProgress?: boolean;
};

const KEY = 'workout-session';

let state: { session?: WorkoutSession; loaded: boolean } = { loaded: false };
const listeners = new Set<() => void>();

function setSession(session: WorkoutSession | undefined) {
  state = { session, loaded: true };
  listeners.forEach((listener) => listener());
  writePersisted(KEY, session ?? null);
}

/** A session saved by an earlier build: one timer start, and `bulk` for untimed sets. */
type SavedExercise = Omit<SessionExercise, 'timer' | 'sets'> & {
  timer?: TimerSegment[];
  timerStartedAt?: number;
  sets: (SessionSet & { bulk?: boolean })[];
};

/** Brings a saved session up to the current shape; anything unreadable is dropped. */
function migrate(saved: unknown): WorkoutSession | undefined {
  const session = saved as
    | (Omit<WorkoutSession, 'exercises' | 'clock'> & {
        exercises?: unknown;
        clock?: TimerSegment[];
      })
    | null;
  if (!session || !Array.isArray(session.exercises)) return undefined;
  return {
    ...session,
    clock: session.clock ?? [{ start: session.startedAt, end: session.finishedAt }],
    exercises: (session.exercises as SavedExercise[]).map(
      ({ timerStartedAt, timer, sets, ...exercise }) => ({
        ...exercise,
        timer:
          timer ??
          (timerStartedAt === undefined
            ? []
            : [{ start: timerStartedAt, end: exercise.completedAt }]),
        sets: sets.map(({ bulk, ...set }) => ({ ...set, untimed: set.untimed ?? bulk })),
      })
    ),
  };
}

readPersisted<unknown>(KEY).then((saved) => {
  // A change made before the disk read finished wins over what was on disk.
  if (state.loaded) return;
  state = { session: migrate(saved), loaded: true };
  listeners.forEach((listener) => listener());
});

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getSnapshot = () => state;

/** Starts a session from the plan, or keeps the one already running for it. */
export function startSession(plan: WorkoutPlan, now = Date.now()) {
  const current = state.session;
  if (current?.planId === plan.id && !current.finishedAt) return;
  setSession({
    planId: plan.id,
    muscleGroup: plan.muscleGroup,
    split: plan.split,
    startedAt: now,
    clock: [{ start: now }],
    exercises: plan.exercises.map((item) => ({
      id: item.id,
      exerciseId: item.exercise.id,
      name: item.exercise.name,
      iconUrl: item.exercise.iconUrl ?? null,
      timer: [],
      sets: Array.from({ length: item.sets }, () => ({
        reps: item.repetition,
        weight: item.weight ?? null,
      })),
    })),
  });
}

function updateExercise(index: number, change: (exercise: SessionExercise) => SessionExercise) {
  const session = state.session;
  if (!session || session.endedEarly) return;
  const exercises = session.exercises.map((exercise, i) =>
    i === index ? withCompletion(change(exercise)) : exercise
  );
  const allDone = exercises.every((exercise) => exercise.completedAt !== undefined);
  const finishedAt = allDone
    ? Math.max(...exercises.map((exercise) => exercise.completedAt!))
    : undefined;
  // Finishing stops the session clock; unchecking a set of a finished session restarts it.
  const clock =
    finishedAt !== undefined
      ? closeTimer(session.clock, finishedAt)
      : session.finishedAt !== undefined && !hasOpenSegment(session.clock)
        ? [...session.clock, { start: Date.now() }]
        : session.clock;
  setSession({
    ...session,
    exercises,
    clock,
    finishedAt,
    savedToProgress: allDone ? session.savedToProgress : false,
  });
}

/**
 * Sets `completedAt` from the sets: done when every set is checked, open otherwise. Completing
 * the exercise stops its timer at the last check.
 */
function withCompletion(exercise: SessionExercise): SessionExercise {
  const done = exercise.sets.every((set) => set.completedAt !== undefined);
  const completedAt = done ? Math.max(...exercise.sets.map((set) => set.completedAt!)) : undefined;
  return {
    ...exercise,
    completedAt,
    timer: completedAt === undefined ? exercise.timer : closeTimer(exercise.timer, completedAt),
  };
}

function closeTimer(timer: TimerSegment[], at: number) {
  return timer.map((segment) =>
    segment.end === undefined ? { start: segment.start, end: Math.max(segment.start, at) } : segment
  );
}

const hasOpenSegment = (timer: TimerSegment[]) =>
  timer.some((segment) => segment.end === undefined);

export const isTimerRunning = (exercise: SessionExercise) => hasOpenSegment(exercise.timer);

export const isClockRunning = (session: WorkoutSession) =>
  session.finishedAt === undefined && hasOpenSegment(session.clock);

/** Starts the session clock again after a stop. */
export function startSessionClock(now = Date.now()) {
  const session = state.session;
  if (!session || session.finishedAt !== undefined || hasOpenSegment(session.clock)) return;
  setSession({ ...session, clock: [...session.clock, { start: now }] });
}

/** Sets the session clock back to 0:00; it keeps running if it was running. */
export function resetSessionClock(now = Date.now()) {
  const session = state.session;
  if (!session || session.finishedAt !== undefined) return;
  setSession({ ...session, clock: hasOpenSegment(session.clock) ? [{ start: now }] : [] });
}

/** Stops the session clock; time until it's started again doesn't count. */
export function stopSessionClock(now = Date.now()) {
  const session = state.session;
  if (!session || session.finishedAt !== undefined) return;
  setSession({ ...session, clock: closeTimer(session.clock, now) });
}

/** Starts the exercise's timer, or resumes it after a stop. */
export function startExerciseTimer(index: number, now = Date.now()) {
  updateExercise(index, (exercise) =>
    isTimerRunning(exercise)
      ? exercise
      : { ...exercise, timer: [...exercise.timer, { start: now }] }
  );
}

/** Stops the exercise's timer; time until it's started again doesn't count. */
export function stopExerciseTimer(index: number, now = Date.now()) {
  updateExercise(index, (exercise) => ({ ...exercise, timer: closeTimer(exercise.timer, now) }));
}

/** Clears the exercise's timer back to zero. Checked sets stay checked but lose their times. */
export function resetExerciseTimer(index: number) {
  updateExercise(index, (exercise) => ({
    ...exercise,
    timer: [],
    sets: exercise.sets.map((set) =>
      set.completedAt === undefined ? set : { ...set, untimed: true }
    ),
  }));
}

/** Checks or unchecks one set. */
export function toggleSet(exerciseIndex: number, setIndex: number, now = Date.now()) {
  updateExercise(exerciseIndex, (exercise) => ({
    ...exercise,
    sets: exercise.sets.map((set, i) =>
      i === setIndex
        ? set.completedAt === undefined
          ? { ...set, completedAt: now, untimed: false }
          : { reps: set.reps, weight: set.weight }
        : set
    ),
  }));
}

/** Checks every remaining set of an exercise, or unchecks them all if it was done. */
export function toggleExercise(index: number, now = Date.now()) {
  updateExercise(index, (exercise) => ({
    ...exercise,
    sets: exercise.completedAt
      ? exercise.sets.map(({ reps, weight }) => ({ reps, weight }))
      : exercise.sets.map((set) =>
          set.completedAt === undefined ? { ...set, completedAt: now, untimed: true } : set
        ),
  }));
}

/** Ends the session now, even with exercises left. */
export function finishSession(now = Date.now()) {
  const session = state.session;
  if (session && !session.finishedAt) {
    setSession({
      ...session,
      clock: closeTimer(session.clock, now),
      finishedAt: now,
      endedEarly: true,
    });
  }
}

export function markSavedToProgress() {
  if (state.session) setSession({ ...state.session, savedToProgress: true });
}

export function discardSession() {
  setSession(undefined);
}

/** The session is per user; drop it on sign-out. */
export function clearSession() {
  setSession(undefined);
}
