import { useFocusEffect } from 'expo-router';
import { useCallback, useState, useSyncExternalStore } from 'react';

import { isoDay } from '@/features/meals/today';

import { getSnapshot, revalidateWaterDay, subscribe } from './water-store';

/** Today's drinks against the goal, refreshed whenever the screen gains focus. */
export function useWaterDay() {
  const { day: cached, dayError } = useSyncExternalStore(subscribe, getSnapshot);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      revalidateWaterDay();
    }, [])
  );

  async function refresh() {
    setRefreshing(true);
    await revalidateWaterDay();
    setRefreshing(false);
  }

  // Yesterday's drinks don't count once the day has turned over
  const day = cached?.date === isoDay(new Date()) ? cached : undefined;
  return {
    day,
    error: day ? undefined : dayError,
    loading: !day && !dayError,
    refreshing,
    refresh,
  };
}
