import { useFocusEffect } from 'expo-router';
import { useCallback, useState, useSyncExternalStore } from 'react';

import { getSnapshot, revalidatePlans, subscribe } from './plans-store';

/** The user's plans, refreshed whenever the screen gains focus. */
export function usePlans() {
  const { plans, error } = useSyncExternalStore(subscribe, getSnapshot);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      revalidatePlans();
    }, [])
  );

  async function refresh() {
    setRefreshing(true);
    await revalidatePlans();
    setRefreshing(false);
  }

  return {
    plans,
    error: plans ? undefined : error,
    refreshing,
    refresh,
    loading: !plans && !error,
  };
}
