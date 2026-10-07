import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { errorMessage } from '@/features/auth/validation';

import { fetchExercises, type Exercise } from './api';

/** The exercise catalog, reloaded whenever the screen regains focus (e.g. after adding one). */
export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>();
  const [error, setError] = useState<string>();
  const [refreshing, setRefreshing] = useState(false);
  const controller = useRef<AbortController>(null);

  const load = useCallback(async () => {
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    try {
      setExercises(await fetchExercises(current.signal));
      setError(undefined);
    } catch (e) {
      if (!current.signal.aborted) setError(errorMessage(e));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      return () => controller.current?.abort();
    }, [load])
  );

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return { exercises, error, refreshing, refresh, loading: !exercises && !error };
}
