/**
 * Saves waiting to reach forge-backend. A screen that saves something puts it here and carries
 * on at once; the outbox keeps it on the device and sends it in the background, one at a time
 * and in order, retrying while the server is unreachable or its database is waking up.
 *
 * Stores show queued saves on top of what the server last sent (`pendingOf`), and update their
 * server copy when one arrives (`onSynced`). Creates carry an id made on the device, so a save
 * sent again after a lost answer can't create a second row (the backend returns the saved one).
 *
 * Saves are per user: sign-out clears them, and nothing is sent until `setOutboxEnabled(true)`.
 */

import { AppState } from 'react-native';

import { ApiError, apiSend } from './api';
import { readPersisted, writePersisted } from './persisted';
import { randomId } from './random-id';
import { Sentry } from './sentry';

export type OutboxEntry = {
  id: string;
  /** What the save is, e.g. `lift.log`; stores pick out their own with it. */
  kind: string;
  method: 'POST' | 'PUT' | 'DELETE';
  path: string;
  /** Sent as JSON. */
  body?: unknown;
  /** The record the save is about (a lift or drink id), so it can be cancelled before it's sent. */
  recordId?: string;
  createdAt: number;
  /** Server errors (5xx) so far; time spent offline doesn't count. */
  serverErrors: number;
};

export type NewOutboxEntry = Pick<OutboxEntry, 'kind' | 'method' | 'path' | 'body' | 'recordId'>;

const KEY = 'outbox';
/** Nobody is waiting on a background save, so it can give a sleeping database time to wake. */
const SYNC_TIMEOUT_MS = 30_000;
const RETRY_MIN_MS = 5_000;
const RETRY_MAX_MS = 2 * 60_000;
/**
 * A save the server keeps failing on (a bug, not a sleeping database) is given up after this
 * many errors, so it can't hold back every save queued behind it.
 */
const MAX_SERVER_ERRORS = 10;

let entries: OutboxEntry[] = [];
const listeners = new Set<() => void>();
const syncedListeners = new Set<(entry: OutboxEntry, data: unknown) => void>();

let enabled = false;
let hydrated = false;
/** Bumped by `clearOutbox`, so work started for the previous user is dropped. */
let generation = 0;
let flushing: { generation: number; promise: Promise<void> } | undefined;
/** The entry being sent right now; it can't be cancelled, the server may already have it. */
let sendingId: string | undefined;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let retryDelay = RETRY_MIN_MS;

function setEntries(next: OutboxEntry[]) {
  entries = next;
  // Until the saved queue is read back, writing would overwrite it
  if (hydrated) writePersisted(KEY, entries);
  listeners.forEach((listener) => listener());
}

const ready = readPersisted<OutboxEntry[]>(KEY).then((saved) => {
  hydrated = true;
  // Saves made before the file was read go after the older ones
  const older = generation === 0 && Array.isArray(saved) ? saved : [];
  setEntries([...older, ...entries]);
});

export function subscribeOutbox(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Every queued save, oldest first. */
export const getOutboxSnapshot = () => entries;

/** Queued saves of one kind, oldest first. */
export const pendingOf = (kind: string) => entries.filter((entry) => entry.kind === kind);

/** Called with the server's `data` once a save has arrived, before it leaves the queue. */
export function onSynced(listener: (entry: OutboxEntry, data: unknown) => void) {
  syncedListeners.add(listener);
  return () => syncedListeners.delete(listener);
}

/** Queues a save and starts sending at once. */
export function enqueue(save: NewOutboxEntry): OutboxEntry {
  const entry: OutboxEntry = { ...save, id: randomId(), createdAt: Date.now(), serverErrors: 0 };
  setEntries([...entries, entry]);
  retryDelay = RETRY_MIN_MS;
  syncOutbox();
  return entry;
}

/** Queues a save that replaces any queued, unsent save of the same kind (e.g. settings). */
export function enqueueLatest(save: NewOutboxEntry): OutboxEntry {
  setEntries(entries.filter((entry) => entry.kind !== save.kind || entry.id === sendingId));
  return enqueue(save);
}

/**
 * Drops the queued saves about a record the app created, so a record deleted before it reached
 * the server is never sent. Returns false when there was none, or one is already on its way;
 * then the server has (or will have) the record and needs a delete of its own.
 */
export function cancelPending(recordId: string): boolean {
  const matching = entries.filter((entry) => entry.recordId === recordId);
  const sending = matching.some((entry) => entry.id === sendingId);
  setEntries(entries.filter((entry) => entry.recordId !== recordId || entry.id === sendingId));
  return matching.length > 0 && !sending;
}

/** Turned on while signed in; queued saves wait (and stay on the device) while it's off. */
export function setOutboxEnabled(on: boolean) {
  enabled = on;
  if (on) {
    retryDelay = RETRY_MIN_MS;
    syncOutbox();
  } else {
    clearTimeout(retryTimer);
  }
}

/** Sends queued saves until the queue is empty or the server can't be reached. Never throws. */
export function syncOutbox(): Promise<void> {
  if (!enabled) return Promise.resolve();
  if (flushing?.generation === generation) return flushing.promise;
  const run = { generation, promise: flush(generation) };
  run.promise = run.promise.finally(() => {
    if (flushing === run) flushing = undefined;
  });
  flushing = run;
  return run.promise;
}

type Outcome = 'sent' | 'retry' | 'server-error' | 'wait' | { rejected: string };

/** Whether a failed save is worth sending again. */
function outcomeOf(error: unknown, entry: OutboxEntry): Outcome {
  // No answer (offline, timed out), or something unexpected: keep it and try later
  if (!(error instanceof ApiError) || error.kind !== 'http') return 'retry';
  // Signed out: the session provider clears the queue along with everything else
  if (error.status === 401) return 'wait';
  if (error.status === 408 || error.status === 429) return 'retry';
  // Server or database trouble, usually a database still waking up
  if (error.status >= 500) {
    return entry.serverErrors + 1 >= MAX_SERVER_ERRORS
      ? { rejected: error.message }
      : 'server-error';
  }
  // Already done: a save whose first answer was lost
  if (error.status === 409 || (error.status === 404 && entry.method === 'DELETE')) return 'sent';
  // The server refused it (e.g. the exercise no longer exists); sending again won't help
  return { rejected: error.message };
}

async function flush(runGeneration: number) {
  await ready;
  clearTimeout(retryTimer);
  const current = () => enabled && runGeneration === generation;

  while (current()) {
    const entry = entries[0];
    if (!entry) return;

    sendingId = entry.id;
    let outcome: Outcome;
    let data: unknown;
    try {
      const { body } = await apiSend(entry.path, {
        method: entry.method,
        body: entry.body === undefined ? undefined : JSON.stringify(entry.body),
        timeoutMs: SYNC_TIMEOUT_MS,
      });
      data = body?.data;
      outcome = 'sent';
    } catch (error) {
      outcome = outcomeOf(error, entry);
    } finally {
      if (sendingId === entry.id) sendingId = undefined;
    }
    if (runGeneration !== generation) return;

    if (outcome === 'wait') return;
    if (outcome === 'retry' || outcome === 'server-error') {
      if (outcome === 'server-error') {
        setEntries(
          entries.map((e) => (e.id === entry.id ? { ...e, serverErrors: e.serverErrors + 1 } : e))
        );
      }
      retryTimer = setTimeout(syncOutbox, retryDelay);
      retryDelay = Math.min(retryDelay * 2, RETRY_MAX_MS);
      return;
    }

    retryDelay = RETRY_MIN_MS;
    if (outcome === 'sent') {
      // Stores take in the server's copy first, so the record never blinks out of the list
      syncedListeners.forEach((listener) => listener(entry, data));
    } else {
      console.warn(`Forge dropped a queued save (${entry.kind}): ${outcome.rejected}`);
      Sentry.captureMessage(`Outbox save rejected: ${entry.kind}`, {
        level: 'warning',
        extra: { message: outcome.rejected, serverErrors: entry.serverErrors },
      });
    }
    setEntries(entries.filter((e) => e.id !== entry.id));
  }
}

/** Queued saves belong to the signed-in user; drop them on sign-out. */
export function clearOutbox() {
  generation++;
  clearTimeout(retryTimer);
  sendingId = undefined;
  retryDelay = RETRY_MIN_MS;
  setEntries([]);
}

// Coming back to the app is a good moment to try again: the network or server may be back
AppState.addEventListener('change', (state) => {
  if (state !== 'active') return;
  retryDelay = RETRY_MIN_MS;
  syncOutbox();
});
