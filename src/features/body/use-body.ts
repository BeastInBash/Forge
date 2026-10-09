import { useFocusEffect } from 'expo-router';
import { useCallback, useSyncExternalStore } from 'react';

import { getSnapshot, loadPrefs, revalidateBody, subscribe } from './body-store';

/** The user's measurements and this device's sex and activity, refreshed on focus. */
export function useBody() {
  const state = useSyncExternalStore(subscribe, getSnapshot);

  useFocusEffect(
    useCallback(() => {
      loadPrefs();
      revalidateBody();
    }, [])
  );

  return {
    ...state,
    loading: (!state.measurements && !state.error) || !state.prefsLoaded,
  };
}
