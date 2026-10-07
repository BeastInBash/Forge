/**
 * Stale-while-revalidate cache for the exercise catalog, shared by every screen that shows it.
 *
 * The catalog is kept in memory and on disk with the ETag it was served with. Screens render the
 * cached copy immediately, then `revalidate` asks forge-backend whether it changed: an unchanged
 * catalog costs a bodiless 304, a changed one replaces the cache. Overlapping calls share one
 * request, and focus-triggered checks within `FRESH_MS` of the last one are skipped.
 */

import { errorMessage } from '@/features/auth/validation';
import { apiURL } from '@/lib/auth-client';
import { readPersisted, writePersisted } from '@/lib/persisted';

import { fetchExercises, type Exercise } from './api';

/** How long a successful check counts as current before a screen focus checks again. */
const FRESH_MS = 30_000;

/** Per backend, so switching EXPO_PUBLIC_API_URL never shows another server's catalog. */
const STORAGE_KEY = `exercise-catalog-${apiURL.replace(/^https?:\/\//, '')}`;

type Persisted = { exercises: Exercise[]; etag?: string };

export type CatalogState = {
  exercises?: Exercise[];
  /** Last failure, cleared by the next success. Screens show it only when there is no data. */
  error?: string;
};

let state: CatalogState = {};
let etag: string | undefined;
let validatedAt = 0;
let hydration: Promise<void> | undefined;
let inFlight: Promise<void> | undefined;
const listeners = new Set<() => void>();

function setState(next: CatalogState) {
  state = next;
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getSnapshot = () => state;

/** Loads the on-disk copy once per launch, unless the network got there first. */
function hydrate() {
  hydration ??= readPersisted<Persisted>(STORAGE_KEY).then((saved) => {
    if (saved && !state.exercises) {
      etag = saved.etag;
      setState({ ...state, exercises: saved.exercises });
    }
  });
  return hydration;
}

/**
 * Checks the catalog with the server. Without `force`, does nothing if the last check was under
 * `FRESH_MS` ago. Never throws; failures land in `state.error`.
 */
export function revalidate({ force = false } = {}): Promise<void> {
  if (inFlight) return inFlight;
  if (!force && Date.now() - validatedAt < FRESH_MS) return hydrate();

  inFlight = (async () => {
    await hydrate();
    try {
      const result = await fetchExercises(state.exercises ? etag : undefined);
      validatedAt = Date.now();
      if (result.notModified) {
        if (state.error) setState({ ...state, error: undefined });
        return;
      }
      etag = result.etag;
      setState({ exercises: result.data });
      writePersisted(STORAGE_KEY, { exercises: result.data, etag } satisfies Persisted);
    } catch (e) {
      setState({ ...state, error: errorMessage(e) });
    }
  })().finally(() => {
    inFlight = undefined;
  });
  return inFlight;
}

/**
 * Adds a just-created exercise so it shows up without waiting for the network, and marks the
 * cache stale: the old ETag no longer matches, so the next check fetches the real list.
 */
export function addToCache(exercise: Exercise) {
  const exercises = [...(state.exercises ?? []).filter((e) => e.id !== exercise.id), exercise].sort(
    (a, b) => a.exercise_name.localeCompare(b.exercise_name)
  );
  validatedAt = 0;
  setState({ ...state, exercises });
  writePersisted(STORAGE_KEY, { exercises, etag } satisfies Persisted);
}
