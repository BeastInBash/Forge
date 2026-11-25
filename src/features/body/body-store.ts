/**
 * The user's body measurements, shared by the home screen and the calculator so a save in one
 * shows in the other straight away. Age, height, weight and goal live on the profile in
 * forge-backend; sex and activity level aren't stored there, so they stay on this device.
 *
 * Saving the measurements goes through the outbox (`@/lib/outbox`): they show at once, are kept
 * on the device, and reach the server in the background, even if it is offline or asleep.
 */

import { errorMessage } from '@/features/auth/validation';
import type { FitnessGoal } from '@/features/onboarding/api';
import { fetchProfile } from '@/features/profile/api';
import { enqueueLatest, onSynced, pendingOf, subscribeOutbox } from '@/lib/outbox';
import { readPersisted, writePersisted } from '@/lib/persisted';

import type { ActivityLevel, Sex } from './metrics';

export type Measurements = {
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  goal: FitnessGoal | null;
};

export type BodyPrefs = { sex?: Sex; activity: ActivityLevel };

export type BodyState = {
  measurements?: Measurements;
  prefs: BodyPrefs;
  /** Sex and activity have been read from the device. */
  prefsLoaded: boolean;
  error?: string;
};

const PREFS_KEY = 'body-prefs';
const DEFAULT_PREFS: BodyPrefs = { activity: 'moderate' };
const SAVE = 'body.measurements';

/** What the server last sent, plus the device's prefs. */
let server: BodyState = { prefs: DEFAULT_PREFS, prefsLoaded: false };
/** `server` with a queued save laid over it; what screens read. */
let state: BodyState = server;
let inFlight: Promise<void> | undefined;
let prefsRead: Promise<void> | undefined;
const listeners = new Set<() => void>();

/** The latest queued measurements stand in for the server's until they arrive. */
function overlay(base: BodyState): BodyState {
  const queued = pendingOf(SAVE);
  const latest = queued[queued.length - 1]?.body as Measurements | undefined;
  return latest ? { ...base, measurements: latest, error: undefined } : base;
}

function publish() {
  state = overlay(server);
  listeners.forEach((listener) => listener());
}

function setState(next: BodyState) {
  server = next;
  publish();
}

subscribeOutbox(publish);

// The server has the saved measurements now; the endpoint answers without them
onSynced((entry) => {
  if (entry.kind !== SAVE) return;
  setState({ ...server, measurements: entry.body as Measurements, error: undefined });
});

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getSnapshot = () => state;

/** Refetches the measurements from the profile; overlapping calls share one request. */
export function revalidateBody(): Promise<void> {
  inFlight ??= (async () => {
    try {
      const { age, heightCm, weightKg, goal } = await fetchProfile();
      setState({ ...server, measurements: { age, heightCm, weightKg, goal }, error: undefined });
    } catch (e) {
      setState({ ...server, error: errorMessage(e) });
    }
  })().finally(() => {
    inFlight = undefined;
  });
  return inFlight;
}

/** Reads sex and activity from the device, once per launch. */
export function loadPrefs(): Promise<void> {
  prefsRead ??= readPersisted<BodyPrefs>(PREFS_KEY).then((saved) => {
    setState({ ...server, prefs: { ...DEFAULT_PREFS, ...saved }, prefsLoaded: true });
  });
  return prefsRead;
}

/**
 * Saves the measurements to the profile and sex and activity to this device. The profile has no
 * endpoint of its own for measurements, so this goes through the onboarding one, which writes all
 * four answers at once (and re-stamps `onboardedAt`, which is harmless here).
 *
 * The measurements show straight away and are sent in the background (see the outbox); only the
 * latest unsent save is kept, since each one replaces all four.
 */
export async function saveBody(measurements: Measurements, prefs: BodyPrefs) {
  enqueueLatest({
    kind: SAVE,
    method: 'PUT',
    path: '/api/v1/profile/onboarding',
    body: measurements,
  });
  await writePersisted(PREFS_KEY, prefs);
  setState({ ...server, prefs, prefsLoaded: true });
}

/** Measurements are per user; drop them, and this device's sex and activity, on sign-out. */
export function clearBody() {
  prefsRead = Promise.resolve();
  writePersisted(PREFS_KEY, DEFAULT_PREFS);
  setState({ prefs: DEFAULT_PREFS, prefsLoaded: true });
}
