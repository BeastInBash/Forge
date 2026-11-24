/**
 * The signed-in user's water goal and today's drinks. Screens read the in-memory copy straight
 * away and refresh it on focus.
 *
 * Logging or removing a drink and saving the goal go through the outbox (`@/lib/outbox`): they
 * show at once, are kept on the device, and reach the server in the background, even if it is
 * offline or asleep. The state screens see is the server's copy with queued saves laid over it.
 */

import { errorMessage } from '@/features/auth/validation';
import {
  cancelPending,
  enqueue,
  enqueueLatest,
  onSynced,
  pendingOf,
  subscribeOutbox,
} from '@/lib/outbox';
import { createPersistedCache } from '@/lib/persisted-cache';
import { randomId } from '@/lib/random-id';

import {
  deviceTimezone,
  fetchWaterDay,
  fetchWaterGoal,
  type WaterDay,
  type WaterGoal,
  type WaterGoalInput,
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

const LOG = 'water.log';
const DELETE = 'water.delete';
const GOAL = 'water.goal';

/** What the server last sent. */
let server: WaterState = {};
/** `server` with the queued saves laid over it; what screens read. */
let state: WaterState = server;
let inFlight: Promise<void> | undefined;
let dayInFlight: Promise<void> | undefined;
/** Bumped by every local change, so an older day request can't overwrite it. */
let dayVersion = 0;
const listeners = new Set<() => void>();

const byTime = (a: WaterLog, b: WaterLog) => a.drankAt.localeCompare(b.drankAt);

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

/** Today on this device, "YYYY-MM-DD". */
function localToday() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** The server's goal and drinks with queued ones added and queued removals taken out. */
function overlay(base: WaterState): WaterState {
  const goals = pendingOf(GOAL);
  const queuedGoal = goals[goals.length - 1]?.body as WaterGoalInput | undefined;
  const added = pendingOf(LOG).map((entry) => entry.body as WaterLog);
  const deleted = new Set(pendingOf(DELETE).map((entry) => entry.recordId));
  if (!queuedGoal && added.length === 0 && deleted.size === 0) return base;

  // Reminder times are worked out by the server; the old ones stand in until the save arrives
  const goal = queuedGoal
    ? {
        ...queuedGoal,
        updatedAt: new Date().toISOString(),
        reminders: base.goal?.reminders ?? null,
      }
    : base.goal;

  // Drinks logged before today's midnight belong to an earlier day
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  const today = added.filter((log) => new Date(log.drankAt) >= midnight);

  // Not loaded (offline, or the server is asleep): today starts empty on the device
  let day = base.day;
  if (!day && (today.length > 0 || queuedGoal)) {
    day = {
      date: localToday(),
      timezone: deviceTimezone(),
      goalMl: null,
      consumedMl: 0,
      remainingMl: null,
      goalReached: false,
      logs: [],
    };
  }
  if (day) {
    const known = new Set(day.logs.map((log) => log.id));
    const logs = [
      ...day.logs.filter((log) => !deleted.has(log.id)),
      ...today.filter((log) => !known.has(log.id)),
    ].sort(byTime);
    day = withTotals({ ...day, goalMl: goal?.dailyGoalMl ?? day.goalMl }, logs);
  }

  return {
    ...base,
    goal,
    error: queuedGoal ? undefined : base.error,
    day,
    // A day made on the device has nothing to show an error for
    dayError: day && !base.day ? undefined : base.dayError,
  };
}

function publish() {
  state = overlay(server);
  listeners.forEach((listener) => listener());
}

/** The server's goal and day as last seen, kept on the device for the next launch. */
type Saved = Pick<WaterState, 'goal' | 'day'>;
const cache = createPersistedCache<Saved>('water');

function setServer(next: WaterState) {
  server = next;
  publish();
  cache.save({ goal: next.goal, day: next.day });
}

// Last launch's copy, so the water card opens with it; anything already fetched wins. A saved
// day from before midnight is ignored by `useWaterDay`.
cache.load().then((saved) => {
  if (!saved) return;
  setServer({
    ...server,
    goal: server.goal === undefined ? saved.goal : server.goal,
    day: server.day ?? saved.day,
  });
});

subscribeOutbox(publish);

// A queued save reached the server: take its copy in, then refetch today's drinks
onSynced((entry, data) => {
  const { day } = server;
  if (entry.kind === GOAL && data) {
    const goal = data as WaterGoal;
    setServer({
      ...server,
      goal,
      error: undefined,
      day: day && withTotals({ ...day, goalMl: goal.dailyGoalMl }, day.logs),
    });
  } else if (entry.kind === LOG && data) {
    const log = data as WaterLog;
    if (day) {
      const logs = [...day.logs.filter((l) => l.id !== log.id), log].sort(byTime);
      setServer({ ...server, day: withTotals(day, logs) });
    }
    refetchDay();
  } else if (entry.kind === DELETE) {
    if (day) {
      const logs = day.logs.filter((l) => l.id !== entry.recordId);
      setServer({ ...server, day: withTotals(day, logs) });
    }
    refetchDay();
  }
});

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getSnapshot = () => state;

/** Refetches the goal; overlapping calls share one request. Never throws. */
export function revalidateWaterGoal(): Promise<void> {
  inFlight ??= (async () => {
    try {
      setServer({ ...server, goal: await fetchWaterGoal(), error: undefined });
    } catch (e) {
      setServer({ ...server, error: errorMessage(e) });
    }
  })().finally(() => {
    inFlight = undefined;
  });
  return inFlight;
}

function fetchDay(): Promise<void> {
  const version = dayVersion;
  const request: Promise<void> = (async () => {
    try {
      const day = await fetchWaterDay();
      if (version === dayVersion) setServer({ ...server, day, dayError: undefined });
    } catch (e) {
      if (version === dayVersion) setServer({ ...server, dayError: errorMessage(e) });
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

/** Fetches today's drinks with a fresh request, so one sent before a change can't undo it. */
function refetchDay() {
  dayVersion++;
  fetchDay();
}

/**
 * Saves the goal: it shows straight away and is sent in the background (see the outbox). Only
 * the latest unsent goal is kept, since each one replaces every setting.
 */
export function setWaterGoal(input: WaterGoalInput) {
  enqueueLatest({ kind: GOAL, method: 'PUT', path: '/api/v1/water/goal', body: input });
}

/** Logs a drink, now: it shows straight away and is sent in the background. */
export function drinkWater(amountMl: number) {
  const log: WaterLog = { id: randomId(), amountMl, drankAt: new Date().toISOString() };
  enqueue({ kind: LOG, method: 'POST', path: '/api/v1/water/logs', body: log, recordId: log.id });
}

/** Removes a drink at once; one that hasn't reached the server is simply never sent. */
export function removeDrink(id: string) {
  if (cancelPending(id)) return;
  enqueue({ kind: DELETE, method: 'DELETE', path: `/api/v1/water/logs/${id}`, recordId: id });
}

/** The goal and drinks are per user; drop them on sign-out. */
export function clearWater() {
  dayVersion++;
  setServer({});
  cache.clear();
}
