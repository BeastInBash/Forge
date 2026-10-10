import { useFocusEffect } from 'expo-router';
import { useCallback, useState, useSyncExternalStore } from 'react';

import {
  getSnapshot,
  loadMoreMeals,
  revalidateMeal,
  revalidateMeals,
  subscribe,
} from './meals-store';

/** The meal history, newest first, refreshed whenever the screen gains focus. */
export function useMeals() {
  const { meals, nextBefore, loadingMore, error } = useSyncExternalStore(subscribe, getSnapshot);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      revalidateMeals();
    }, [])
  );

  async function refresh() {
    setRefreshing(true);
    await revalidateMeals();
    setRefreshing(false);
  }

  return {
    meals,
    error: meals ? undefined : error,
    refreshing,
    refresh,
    loading: !meals && !error,
    hasMore: Boolean(nextBefore),
    loadingMore,
    loadMore: loadMoreMeals,
  };
}

/** One meal's full analysis, refreshed on focus. */
export function useMeal(id: string) {
  const { details, meals } = useSyncExternalStore(subscribe, getSnapshot);
  const { meal, error } = details[id] ?? {};
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      revalidateMeal(id);
    }, [id])
  );

  async function refresh() {
    setRefreshing(true);
    await revalidateMeal(id);
    setRefreshing(false);
  }

  return {
    meal,
    /** Shown while the analysis loads, so the header appears at once. */
    summary: meals?.find((m) => m.id === id),
    error: meal ? undefined : error,
    refreshing,
    refresh,
    loading: !meal && !error,
  };
}
