import { useFocusEffect } from 'expo-router';
import { useCallback, useSyncExternalStore } from 'react';

import { getSnapshot, revalidateWaterGoal, subscribe } from './water-store';

/** The user's water goal (null when unset), refreshed whenever the screen gains focus. */
export function useWaterGoal() {
  const { goal, error } = useSyncExternalStore(subscribe, getSnapshot);

  useFocusEffect(
    useCallback(() => {
      revalidateWaterGoal();
    }, [])
  );

  return {
    goal,
    error: goal === undefined ? error : undefined,
    loading: goal === undefined && !error,
    retry: revalidateWaterGoal,
  };
}
