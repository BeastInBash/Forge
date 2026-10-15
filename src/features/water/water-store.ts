/**
 * The signed-in user's water goal. Screens read the in-memory copy straight away and refresh it
 * on focus; saving a goal replaces the cached copy.
 */

import { errorMessage } from '@/features/auth/validation';

import { fetchWaterGoal, type WaterGoal } from './api';

export type WaterState = {
  /** Undefined until loaded; null when the user hasn't set a goal. */
  goal?: WaterGoal | null;
  error?: string;
};

let state: WaterState = {};
let inFlight: Promise<void> | undefined;
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
      setState({ goal: await fetchWaterGoal(), error: undefined });
    } catch (e) {
      setState({ ...state, error: errorMessage(e) });
    }
  })().finally(() => {
    inFlight = undefined;
  });
  return inFlight;
}

export function setWaterGoalLocally(goal: WaterGoal) {
  setState({ goal, error: undefined });
}

/** The goal is per user; drop it on sign-out. */
export function clearWater() {
  setState({});
}
