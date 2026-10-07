import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { errorMessage } from '@/features/auth/validation';

import { fetchProfile, type Profile } from './api';

/**
 * Loads the profile and refreshes it each time the tab comes into focus, so sessions and counts
 * stay current. `refresh` backs pull-to-refresh and the retry button.
 */
export function useProfile() {
  const [profile, setProfile] = useState<Profile>();
  const [error, setError] = useState<string>();
  const [refreshing, setRefreshing] = useState(false);
  const controller = useRef<AbortController>(null);

  const load = useCallback(async () => {
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    try {
      setProfile(await fetchProfile(current.signal));
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

  return { profile, error, refreshing, refresh, loading: !profile && !error };
}
