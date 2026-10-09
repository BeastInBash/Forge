/**
 * The user's body measurements, shared by the home screen and the calculator so a save in one
 * shows in the other straight away. Age, height, weight and goal live on the profile in
 * forge-backend; sex and activity level aren't stored there, so they stay on this device.
 */

import { errorMessage } from '@/features/auth/validation';
import { saveOnboarding, type FitnessGoal } from '@/features/onboarding/api';
import { fetchProfile } from '@/features/profile/api';
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

let state: BodyState = { prefs: DEFAULT_PREFS, prefsLoaded: false };
let inFlight: Promise<void> | undefined;
let prefsRead: Promise<void> | undefined;
const listeners = new Set<() => void>();

function setState(next: BodyState) {
  state = next;
  listeners.forEach((listener) => listener());
}

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
      setState({ ...state, measurements: { age, heightCm, weightKg, goal }, error: undefined });
    } catch (e) {
      setState({ ...state, error: errorMessage(e) });
    }
  })().finally(() => {
    inFlight = undefined;
  });
  return inFlight;
}

/** Reads sex and activity from the device, once per launch. */
export function loadPrefs(): Promise<void> {
  prefsRead ??= readPersisted<BodyPrefs>(PREFS_KEY).then((saved) => {
    setState({ ...state, prefs: { ...DEFAULT_PREFS, ...saved }, prefsLoaded: true });
  });
  return prefsRead;
}

/**
 * Saves the measurements to the profile and sex and activity to this device. The profile has no
 * endpoint of its own for measurements, so this goes through the onboarding one, which writes all
 * four answers at once (and re-stamps `onboardedAt`, which is harmless here).
 */
export async function saveBody(measurements: Measurements, prefs: BodyPrefs) {
  await saveOnboarding(measurements);
  await writePersisted(PREFS_KEY, prefs);
  setState({ ...state, measurements, prefs, prefsLoaded: true, error: undefined });
}

/** Measurements are per user; drop them, and this device's sex and activity, on sign-out. */
export function clearBody() {
  prefsRead = Promise.resolve();
  writePersisted(PREFS_KEY, DEFAULT_PREFS);
  setState({ prefs: DEFAULT_PREFS, prefsLoaded: true });
}
