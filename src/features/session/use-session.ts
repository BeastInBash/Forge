import { useEffect, useState, useSyncExternalStore } from 'react';

import { getSnapshot, subscribe } from './session-store';

/** The workout in progress (or just finished), and whether it has been read from disk. */
export function useWorkoutSession() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** The current time, refreshed every second while `running`. */
export function useNow(running: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);
  return now;
}
