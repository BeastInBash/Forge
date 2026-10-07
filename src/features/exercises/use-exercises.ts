import { useFocusEffect } from 'expo-router';
import { useCallback, useState, useSyncExternalStore } from 'react';

import { getSnapshot, revalidate, subscribe } from './exercise-cache';

/**
 * The exercise catalog from the shared cache: shown at once from memory or disk, then checked
 * with the server whenever the screen gains focus. `refresh` (pull-to-refresh, retry) always
 * asks the server.
 */
export function useExercises() {
  const { exercises, error } = useSyncExternalStore(subscribe, getSnapshot);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      revalidate();
    }, [])
  );

  async function refresh() {
    setRefreshing(true);
    await revalidate({ force: true });
    setRefreshing(false);
  }

  return {
    exercises,
    // Cached data stays on screen when a background check fails.
    error: exercises ? undefined : error,
    refreshing,
    refresh,
    loading: !exercises && !error,
  };
}
