/**
 * The signed-in user's logged lifts: one summary per exercise for the Progress tab, and each
 * exercise's full history once it has been opened. Screens read the in-memory copy straight away
 * and refresh it on focus; logging or deleting a lift updates the cache locally first.
 */

import { errorMessage } from '@/features/auth/validation';

import {
  fetchLiftHistory,
  fetchLiftSummaries,
  type Lift,
  type LiftHistory,
  type LiftSummary,
} from './api';

type HistoryState = { history?: LiftHistory; error?: string };

export type LiftsState = {
  summaries?: LiftSummary[];
  error?: string;
  histories: Record<string, HistoryState>;
};

let state: LiftsState = { histories: {} };
let summariesInFlight: Promise<void> | undefined;
const historiesInFlight = new Map<string, Promise<void>>();
const listeners = new Set<() => void>();

function setState(next: LiftsState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function setHistory(exerciseId: string, next: HistoryState) {
  setState({ ...state, histories: { ...state.histories, [exerciseId]: next } });
}

const byDate = (a: Lift, b: Lift) => a.performedAt.localeCompare(b.performedAt);

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getSnapshot = () => state;

/** Refetches the per-exercise summaries; overlapping calls share one request. Never throws. */
export function revalidateSummaries(): Promise<void> {
  summariesInFlight ??= (async () => {
    try {
      setState({ ...state, summaries: await fetchLiftSummaries(), error: undefined });
    } catch (e) {
      setState({ ...state, error: errorMessage(e) });
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
        setHistory(exerciseId, { ...state.histories[exerciseId], error: errorMessage(e) });
      }
    })().finally(() => historiesInFlight.delete(exerciseId));
    historiesInFlight.set(exerciseId, request);
  }
  return request;
}

/** Puts a newly logged lift into its exercise's history, then refreshes the summaries. */
export function addLiftLocally(lift: Lift) {
  const current = state.histories[lift.exerciseId]?.history;
  if (current) {
    const lifts = [...current.lifts, lift].sort(byDate);
    setHistory(lift.exerciseId, { history: { ...current, lifts } });
  }
  revalidateSummaries();
}

export function removeLiftLocally(lift: Lift) {
  const current = state.histories[lift.exerciseId]?.history;
  if (current) {
    const lifts = current.lifts.filter((l) => l.id !== lift.id);
    setHistory(lift.exerciseId, { history: { ...current, lifts } });
  }
  revalidateSummaries();
}

/** Cached lifts are per user; drop them on sign-out. */
export function clearLifts() {
  setState({ histories: {} });
}
