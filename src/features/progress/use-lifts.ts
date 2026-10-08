import { useFocusEffect } from 'expo-router';
import { useCallback, useState, useSyncExternalStore } from 'react';

import { getSnapshot, revalidateHistory, revalidateSummaries, subscribe } from './lifts-store';

/** One summary per logged exercise, refreshed whenever the screen gains focus. */
export function useLiftSummaries() {
  const { summaries, error } = useSyncExternalStore(subscribe, getSnapshot);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      revalidateSummaries();
    }, [])
  );

  async function refresh() {
    setRefreshing(true);
    await revalidateSummaries();
    setRefreshing(false);
  }

  return {
    summaries,
    error: summaries ? undefined : error,
    refreshing,
    refresh,
    loading: !summaries && !error,
  };
}

/** Every logged session of one exercise, oldest first, refreshed on focus. */
export function useLiftHistory(exerciseId: string) {
  const { histories, summaries } = useSyncExternalStore(subscribe, getSnapshot);
  const { history, error } = histories[exerciseId] ?? {};
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      revalidateHistory(exerciseId);
    }, [exerciseId])
  );

  async function refresh() {
    setRefreshing(true);
    await revalidateHistory(exerciseId);
    setRefreshing(false);
  }

  return {
    history,
    /** Shown while the history loads, so the header and latest session appear at once. */
    summary: summaries?.find((s) => s.exercise.id === exerciseId),
    error: history ? undefined : error,
    refreshing,
    refresh,
    loading: !history && !error,
  };
}
