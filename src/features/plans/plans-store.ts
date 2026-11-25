/**
 * The signed-in user's workout plans, shared by the Workouts tab and the plan editor. Screens
 * read the in-memory copy straight away and refresh it on focus.
 *
 * Creating, editing or deleting a plan in the editor goes through the outbox (`@/lib/outbox`):
 * it shows at once, is kept on the device, and reaches the server in the background, even if it
 * is offline or asleep. The state screens see is the server's copy with queued saves laid over
 * it, in the order they were made.
 */

import { errorMessage } from '@/features/auth/validation';
import {
  cancelPending,
  enqueue,
  getOutboxSnapshot,
  onSynced,
  pendingOf,
  subscribeOutbox,
  syncOutbox,
} from '@/lib/outbox';
import { createPersistedCache } from '@/lib/persisted-cache';
import { randomId } from '@/lib/random-id';
import { WEEKDAYS } from '@/lib/week';
import type { Weekday, WorkoutPlan } from '@/types/training';

import { fetchPlans, planBody, toPlan, type ApiPlan, type PlanInput } from './api';
import type { DraftExercise } from './components/plan-exercise-card';
import { splitFor } from './split';

export type PlansState = { plans?: WorkoutPlan[]; error?: string };

/** What the editor saves; exercises carry their names so the plan shows before it's sent. */
export type PlanDraft = {
  day: Weekday;
  /** ISO 8601 date-time; only the time of day is shown. */
  time: string;
  muscleGroup: string;
  exercises: DraftExercise[];
};

const CREATE = 'plan.create';
const UPDATE = 'plan.update';
const DELETE = 'plan.delete';
const KINDS = new Set([CREATE, UPDATE, DELETE]);

/** What the server last sent. */
let server: PlansState = {};
/** `server` with the queued saves laid over it; what screens read. */
let state: PlansState = server;
let inFlight: Promise<void> | undefined;
/** Bumped by every synced save, so an older list request can't undo it. */
let version = 0;
const listeners = new Set<() => void>();
/** The plans as last seen, kept on the device for the next launch. */
const cache = createPersistedCache<WorkoutPlan[]>('plans');

const byWeekday = (a: WorkoutPlan, b: WorkoutPlan) =>
  WEEKDAYS.indexOf(a.day) - WEEKDAYS.indexOf(b.day);

/** The queued plan saves, oldest first. */
const queuedSaves = () => getOutboxSnapshot().filter((entry) => KINDS.has(entry.kind));

/** The server's plans with the queued saves applied in order. */
function overlay(base: PlansState): PlansState {
  const queued = queuedSaves();
  if (queued.length === 0) return base;
  // Not loaded (offline, or the server is asleep): show the queued plans on their own
  let plans = base.plans ?? [];
  for (const entry of queued) {
    plans = plans.filter((plan) => plan.id !== entry.recordId);
    if (entry.kind !== DELETE) plans = [...plans, entry.local as WorkoutPlan];
  }
  return { ...base, plans: plans.sort(byWeekday) };
}

function publish() {
  state = overlay(server);
  listeners.forEach((listener) => listener());
}

function setServer(next: PlansState) {
  server = next;
  publish();
  if (next.plans) cache.save(next.plans);
}

// Last launch's copy, so the week opens with it; plans already fetched win
cache.load().then((saved) => {
  if (saved && !server.plans) setServer({ ...server, plans: saved });
});

subscribeOutbox(publish);

// A queued save reached the server: take its copy in
onSynced((entry, data) => {
  if (!KINDS.has(entry.kind)) return;
  version++;
  if (entry.kind === DELETE) {
    if (entry.recordId) removePlanLocally(entry.recordId);
  } else if (data) {
    savePlanLocally(toPlan(data as ApiPlan));
  } else {
    // Answered without a plan (a 409: another device took that day); show what the server has
    fetchFresh();
  }
});

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getSnapshot = () => state;

function fetchFresh(): Promise<void> {
  const started = version;
  const request: Promise<void> = (async () => {
    try {
      const plans = await fetchPlans();
      if (started === version) setServer({ plans });
    } catch (e) {
      if (started === version) setServer({ ...server, error: errorMessage(e) });
    }
  })().finally(() => {
    if (inFlight === request) inFlight = undefined;
  });
  inFlight = request;
  return request;
}

/** Refetches the plans; overlapping calls share one request. Never throws. */
export function revalidatePlans(): Promise<void> {
  return inFlight ?? fetchFresh();
}

/**
 * Creates a plan, or replaces `existingId`'s: it shows straight away and is sent in the
 * background (see the outbox). Returns the plan as it will be saved.
 */
export function savePlan(draft: PlanDraft, existingId?: string): WorkoutPlan {
  const id = existingId ?? randomId();
  const plan: WorkoutPlan = {
    id,
    day: draft.day,
    time: draft.time,
    muscleGroup: draft.muscleGroup,
    split: splitFor(draft.muscleGroup),
    exercises: draft.exercises.map((item, order) => ({
      id: `${id}-${order}`,
      exercise: { id: item.exerciseId, name: item.name, iconUrl: item.icon ?? undefined },
      sets: item.sets,
      repetition: item.repetition,
      weight: item.weight,
      order,
    })),
  };
  const input: PlanInput = {
    day: draft.day,
    time: draft.time,
    muscleGroup: draft.muscleGroup,
    exercises: draft.exercises.map(({ exerciseId, sets, repetition, weight }) => ({
      exerciseId,
      sets,
      repetition,
      weight,
    })),
  };
  enqueue(
    existingId
      ? {
          kind: UPDATE,
          method: 'PUT',
          path: `/api/v1/workout/${id}`,
          body: planBody(input),
          recordId: id,
          local: plan,
        }
      : {
          kind: CREATE,
          method: 'POST',
          path: '/api/v1/workout/create-workout',
          body: planBody(input, id),
          recordId: id,
          local: plan,
        }
  );
  return plan;
}

/** Deletes a plan at once; one whose create hasn't been sent is simply never sent. */
export function removePlan(id: string) {
  const unsentCreate = pendingOf(CREATE).some((entry) => entry.recordId === id);
  // Only a create still waiting makes the delete unnecessary; a queued edit of a plan the
  // server already has is cancelled too, but the server still needs the delete
  if (cancelPending(id) && unsentCreate) return;
  enqueue({ kind: DELETE, method: 'DELETE', path: `/api/v1/workout/${id}`, recordId: id });
}

/**
 * Sends any queued plan saves first and reports whether some are still waiting (offline or the
 * server is asleep). Changes made straight to the server, such as applying a template, must
 * wait for them, or they'd work from plans the server doesn't have yet.
 */
export async function planSavesPending(): Promise<boolean> {
  await syncOutbox();
  return queuedSaves().length > 0;
}

/** Puts a plan the server sent into the server copy. */
export function savePlanLocally(plan: WorkoutPlan) {
  const plans = [...(server.plans ?? []).filter((p) => p.id !== plan.id), plan].sort(byWeekday);
  setServer({ ...server, plans });
}

/** Takes a plan the server deleted out of the server copy. */
export function removePlanLocally(id: string) {
  setServer({ ...server, plans: server.plans?.filter((p) => p.id !== id) });
}

/** Cached plans are per user; drop them on sign-out. */
export function clearPlans() {
  version++;
  setServer({});
  cache.clear();
}
