import { useSyncExternalStore } from 'react';

import { getSnapshot, subscribe } from './session-store';

/** The workout in progress (or just finished), and whether it has been read from disk. */
export function useWorkoutSession() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

const tickEverySecond = (onTick: () => void) => {
  const id = setInterval(onTick, 1000);
  return () => clearInterval(id);
};
const noTicks = () => () => {};
/** Whole seconds, so the snapshot stays the same between ticks as useSyncExternalStore needs. */
const currentSecond = () => Math.floor(Date.now() / 1000) * 1000;

/** The current time (to the second), refreshed every second while `running`. */
export function useNow(running: boolean) {
  return useSyncExternalStore(running ? tickEverySecond : noTicks, currentSecond, currentSecond);
}
