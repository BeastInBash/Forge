/**
 * The signed-in user's workout plans, shared by the Workouts tab and the plan editor. Screens
 * read the in-memory copy straight away and refresh it on focus; saves and deletes update it
 * locally so returning to the week shows the change without waiting for a refetch.
 */

import { errorMessage } from '@/features/auth/validation';
import { WEEKDAYS } from '@/lib/week';
import type { WorkoutPlan } from '@/types/training';

import { fetchPlans } from './api';

export type PlansState = { plans?: WorkoutPlan[]; error?: string };

let state: PlansState = {};
let inFlight: Promise<void> | undefined;
const listeners = new Set<() => void>();

function setState(next: PlansState) {
  state = next;
  listeners.forEach((listener) => listener());
}

const byWeekday = (a: WorkoutPlan, b: WorkoutPlan) =>
  WEEKDAYS.indexOf(a.day) - WEEKDAYS.indexOf(b.day);

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getSnapshot = () => state;

/** Refetches the plans; overlapping calls share one request. Never throws. */
export function revalidatePlans(): Promise<void> {
  inFlight ??= (async () => {
    try {
      setState({ plans: await fetchPlans() });
    } catch (e) {
      setState({ ...state, error: errorMessage(e) });
    }
  })().finally(() => {
    inFlight = undefined;
  });
  return inFlight;
}

/** Puts a created or updated plan into the cache. */
export function savePlanLocally(plan: WorkoutPlan) {
  const plans = [...(state.plans ?? []).filter((p) => p.id !== plan.id), plan].sort(byWeekday);
  setState({ ...state, plans });
}

export function removePlanLocally(id: string) {
  setState({ ...state, plans: state.plans?.filter((p) => p.id !== id) });
}

/** Cached plans are per user; drop them on sign-out. */
export function clearPlans() {
  setState({});
}
