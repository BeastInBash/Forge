/**
 * The signed-in user's water goal and today's drinks. Screens read the in-memory copy straight
 * away and refresh it on focus; saving a goal or logging a drink updates the cached copy first.
 */

import { errorMessage } from '@/features/auth/validation';

import {
  fetchWaterDay,
  fetchWaterGoal,
  logWater,
  type WaterDay,
  type WaterGoal,
  type WaterLog,
} from './api';

export type WaterState = {
  /** Undefined until loaded; null when the user hasn't set a goal. */
  goal?: WaterGoal | null;
  error?: string;
  /** Today's drinks; undefined until loaded. */
  day?: WaterDay;
  dayError?: string;
};

let state: WaterState = {};
let inFlight: Promise<void> | undefined;
let dayInFlight: Promise<void> | undefined;
/** Bumped by every local change, so an older day request can't overwrite it. */
let dayVersion = 0;
const listeners = new Set<() => void>();

function setState(next: WaterState) {
  state = next;
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getSnapshot = () => state;

/** Refetches the goal; overlapping calls share one request. Never throws. */
export function revalidateWaterGoal(): Promise<void> {
  inFlight ??= (async () => {
    try {
      setState({ ...state, goal: await fetchWaterGoal(), error: undefined });
    } catch (e) {
      setState({ ...state, error: errorMessage(e) });
    }
  })().finally(() => {
    inFlight = undefined;
  });
  return inFlight;
}

export function setWaterGoalLocally(goal: WaterGoal) {
  const { day } = state;
  setState({
    ...state,
    goal,
    error: undefined,
    day: day && withTotals({ ...day, goalMl: goal.dailyGoalMl }, day.logs),
  });
}

function fetchDay(): Promise<void> {
  const version = dayVersion;
  const request: Promise<void> = (async () => {
    try {
      const day = await fetchWaterDay();
      if (version === dayVersion) setState({ ...state, day, dayError: undefined });
    } catch (e) {
      if (version === dayVersion) setState({ ...state, dayError: errorMessage(e) });
    }
  })().finally(() => {
    if (dayInFlight === request) dayInFlight = undefined;
  });
  dayInFlight = request;
  return request;
}

/** Refetches today's drinks; overlapping calls share one request. Never throws. */
export function revalidateWaterDay(): Promise<void> {
  return dayInFlight ?? fetchDay();
}

/** `day` with `logs` and the totals worked out from them, as the backend would. */
function withTotals(day: WaterDay, logs: WaterLog[]): WaterDay {
  const consumedMl = logs.reduce((sum, log) => sum + log.amountMl, 0);
  return {
    ...day,
    logs,
    consumedMl,
    remainingMl: day.goalMl === null ? null : Math.max(0, day.goalMl - consumedMl),
    goalReached: day.goalMl !== null && consumedMl >= day.goalMl,
  };
}

/** Changes today's drinks at once, then fetches the backend's copy with a fresh request. */
function changeLogs(change: (logs: WaterLog[]) => WaterLog[]) {
  const { day } = state;
  if (day) setState({ ...state, day: withTotals(day, change(day.logs)) });
  dayVersion++;
  fetchDay();
}

export function addWaterLogLocally(log: WaterLog) {
  changeLogs((logs) => [...logs, log].sort((a, b) => a.drankAt.localeCompare(b.drankAt)));
}

/** Logs a drink and adds it to today's. Throws when the request fails. */
export async function drinkWater(amountMl: number) {
  addWaterLogLocally(await logWater(amountMl));
}

export function removeWaterLogLocally(id: string) {
  changeLogs((logs) => logs.filter((log) => log.id !== id));
}

/** The goal and drinks are per user; drop them on sign-out. */
export function clearWater() {
  dayVersion++;
  setState({});
}
