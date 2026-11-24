/**
 * The signed-in user's logged lifts: one summary per exercise for the Progress tab, and each
 * exercise's full history once it has been opened. Screens read the in-memory copy straight away
 * and refresh it on focus.
 *
 * Logging or deleting a lift goes through the outbox (`@/lib/outbox`): it shows at once, is kept
 * on the device, and reaches the server in the background, even if that is offline or asleep.
 * The state screens see is the server's copy with the queued saves laid over it.
 */

import { errorMessage } from '@/features/auth/validation';
import { cancelPending, enqueue, onSynced, pendingOf, subscribeOutbox } from '@/lib/outbox';
import { createPersistedCache } from '@/lib/persisted-cache';
import { randomId } from '@/lib/random-id';

import {
  fetchLiftHistory,
  fetchLiftSummaries,
  toLift,
  type Lift,
  type LiftHistory,
  type LiftInput,
  type LiftSummary,
} from './api';

type HistoryState = { history?: LiftHistory; error?: string };

export type LiftsState = {
  summaries?: LiftSummary[];
  error?: string;
  histories: Record<string, HistoryState>;
};

const LOG = 'lift.log';
const DELETE = 'lift.delete';

/** The body of a queued `POST /api/v1/lifts`: the input plus the id made on the device. */
type QueuedLift = LiftInput & { id: string };

/** What the server last sent. */
let server: LiftsState = { histories: {} };
/** `server` with the queued saves laid over it; what screens read. */
let state: LiftsState = server;
let summariesInFlight: Promise<void> | undefined;
const historiesInFlight = new Map<string, Promise<void>>();
const listeners = new Set<() => void>();

const byDate = (a: Lift, b: Lift) => a.performedAt.localeCompare(b.performedAt);

/** A queued lift as the server will return it. */
const toQueuedLift = ({ id, exerciseId, performedAt, note, sets }: QueuedLift): Lift => ({
  id,
  exerciseId,
  performedAt,
  note: note ?? null,
  sets: sets.map((set, i) => ({ id: `${id}-${i}`, ...set })),
});

/** The server's lifts with queued ones added and queued deletes taken out. */
function overlay(base: LiftsState): LiftsState {
  const added = pendingOf(LOG).map((entry) => toQueuedLift(entry.body as QueuedLift));
  const deleted = new Set(pendingOf(DELETE).map((entry) => entry.recordId));
  if (added.length === 0 && deleted.size === 0) return base;

  const histories: Record<string, HistoryState> = {};
  for (const [exerciseId, entry] of Object.entries(base.histories)) {
    const { history } = entry;
    if (!history) {
      histories[exerciseId] = entry;
      continue;
    }
    const known = new Set(history.lifts.map((lift) => lift.id));
    const lifts = [
      ...history.lifts.filter((lift) => !deleted.has(lift.id)),
      ...added.filter((lift) => lift.exerciseId === exerciseId && !known.has(lift.id)),
    ].sort(byDate);
    histories[exerciseId] = { ...entry, history: { ...history, lifts } };
  }

  // Summaries are worked out by the server; a queued lift only bumps the count and the latest
  // session of an exercise already listed until it arrives and the summaries are refetched.
  const summaries = base.summaries?.map((summary) => {
    const extra = added.filter((lift) => lift.exerciseId === summary.exercise.id);
    if (extra.length === 0) return summary;
    const last = [summary.last, ...extra].reduce((a, b) => (byDate(a, b) >= 0 ? a : b));
    return { ...summary, sessions: summary.sessions + extra.length, last };
  });

  return { ...base, summaries, histories };
}

function publish() {
  state = overlay(server);
  listeners.forEach((listener) => listener());
}

/** The server's lifts as last seen, kept on the device for the next launch. */
type Saved = { summaries?: LiftSummary[]; histories: Record<string, LiftHistory> };
const cache = createPersistedCache<Saved>('lifts');

function setServer(next: LiftsState) {
  server = next;
  publish();
  const histories: Record<string, LiftHistory> = {};
  for (const [exerciseId, { history }] of Object.entries(next.histories)) {
    if (history) histories[exerciseId] = history;
  }
  cache.save({ summaries: next.summaries, histories });
}

// Last launch's copy, so the Progress tab opens with it; anything already fetched wins
cache.load().then((saved) => {
  if (!saved) return;
  const histories: Record<string, HistoryState> = {};
  for (const [exerciseId, history] of Object.entries(saved.histories ?? {})) {
    histories[exerciseId] = { history };
  }
  // A fetch that already failed keeps its error but shows the saved history meanwhile
  for (const [exerciseId, entry] of Object.entries(server.histories)) {
    histories[exerciseId] = entry.history
      ? entry
      : { history: histories[exerciseId]?.history, error: entry.error };
  }
  setServer({ ...server, summaries: server.summaries ?? saved.summaries, histories });
});

function setHistory(exerciseId: string, next: HistoryState) {
  setServer({ ...server, histories: { ...server.histories, [exerciseId]: next } });
}

/** Changes the server copy of one exercise's history, if it has been loaded. */
function changeHistory(exerciseId: string, change: (lifts: Lift[]) => Lift[]) {
  const current = server.histories[exerciseId]?.history;
  if (current) setHistory(exerciseId, { history: { ...current, lifts: change(current.lifts) } });
}

subscribeOutbox(publish);

// A queued save reached the server: take its copy in, then refresh the summaries
onSynced((entry, data) => {
  if (entry.kind === LOG && data) {
    const lift = toLift(data as Lift);
    changeHistory(lift.exerciseId, (lifts) =>
      [...lifts.filter((l) => l.id !== lift.id), lift].sort(byDate)
    );
  } else if (entry.kind === DELETE && entry.recordId) {
    const id = entry.recordId;
    for (const exerciseId of Object.keys(server.histories)) {
      changeHistory(exerciseId, (lifts) => lifts.filter((l) => l.id !== id));
    }
  } else {
    return;
  }
  revalidateSummaries();
});

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getSnapshot = () => state;

/** Refetches the per-exercise summaries; overlapping calls share one request. Never throws. */
export function revalidateSummaries(): Promise<void> {
  summariesInFlight ??= (async () => {
    try {
      setServer({ ...server, summaries: await fetchLiftSummaries(), error: undefined });
    } catch (e) {
      setServer({ ...server, error: errorMessage(e) });
    }
  })().finally(() => {
    summariesInFlight = undefined;
  });
  return summariesInFlight;
}

/** Refetches one exercise's history. Never throws. */
export function revalidateHistory(exerciseId: string): Promise<void> {
  let request = historiesInFlight.get(exerciseId);
  if (!request) {
    request = (async () => {
      try {
        setHistory(exerciseId, { history: await fetchLiftHistory(exerciseId) });
      } catch (e) {
        setHistory(exerciseId, { ...server.histories[exerciseId], error: errorMessage(e) });
      }
    })().finally(() => historiesInFlight.delete(exerciseId));
    historiesInFlight.set(exerciseId, request);
  }
  return request;
}

/**
 * Logs a lift: it shows straight away and is sent in the background (see the outbox). Returns
 * the lift as it will be saved.
 */
export function saveLift(input: LiftInput): Lift {
  const body: QueuedLift = { ...input, id: randomId() };
  enqueue({ kind: LOG, method: 'POST', path: '/api/v1/lifts', body, recordId: body.id });
  return toQueuedLift(body);
}

/** Deletes a lift: it goes at once; one that hasn't reached the server is simply never sent. */
export function removeLift(lift: Lift) {
  if (cancelPending(lift.id)) return;
  enqueue({
    kind: DELETE,
    method: 'DELETE',
    path: `/api/v1/lifts/${lift.id}`,
    recordId: lift.id,
  });
}

/** Cached lifts are per user; drop them on sign-out. */
export function clearLifts() {
  setServer({ histories: {} });
  cache.clear();
}
