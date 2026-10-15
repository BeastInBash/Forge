import Constants from 'expo-constants';
import { useEffect, useRef, useState } from 'react';
import { AppState, Linking } from 'react-native';

import { readPersisted, writePersisted } from '@/lib/persisted';

import { PlayUpdates } from '../../../modules/play-updates';

const DISMISSED_KEY = 'update-dismissed';
/** After "Not now", the same version is offered again a day later. */
const REMIND_AFTER_MS = 24 * 60 * 60 * 1000;

const storeURL = `https://play.google.com/store/apps/details?id=${Constants.expoConfig?.android?.package}`;

type Dismissed = { versionCode: number; at: number };

/**
 * Asks Google Play whether a newer Forge is published, on launch and whenever the app comes back
 * to the foreground. `versionCode` is set while the prompt should show. Does nothing outside a
 * Play install (iOS, web, Expo Go, sideloaded or debug builds), where Play can't answer.
 */
export function useAppUpdate() {
  const [versionCode, setVersionCode] = useState<number | null>(null);
  const [updating, setUpdating] = useState(false);
  // Play's update screen sends the app to the background; don't re-prompt when it returns.
  const busy = useRef(false);

  useEffect(() => {
    const updates = PlayUpdates;
    if (!updates) return;

    async function check() {
      if (busy.current) return;
      try {
        const result = await updates!.checkForUpdate();
        if (result.status === 'in-progress') {
          // The user started an update and left Play's screen; Play asks apps to resume it.
          busy.current = true;
          await updates!.startUpdate().catch(() => undefined);
          busy.current = false;
          return;
        }
        if (result.status !== 'available') return;
        const dismissed = await readPersisted<Dismissed>(DISMISSED_KEY);
        if (
          dismissed?.versionCode === result.availableVersionCode &&
          Date.now() - dismissed.at < REMIND_AFTER_MS
        ) {
          return;
        }
        setVersionCode(result.availableVersionCode);
      } catch {
        // Not installed from Play, or offline: there's nothing to offer.
      }
    }

    check();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => subscription.remove();
  }, []);

  function dismiss() {
    if (versionCode !== null) writePersisted(DISMISSED_KEY, { versionCode, at: Date.now() });
    setVersionCode(null);
  }

  async function update() {
    if (!PlayUpdates || versionCode === null) return;
    busy.current = true;
    setUpdating(true);
    try {
      // On success Play installs the update and restarts the app, so this rarely returns "ok".
      const result = await PlayUpdates.startUpdate();
      if (result === 'canceled') dismiss();
      else if (result !== 'ok') throw new Error(result);
    } catch {
      // Play couldn't run the in-app flow; the store listing still has the Update button.
      setVersionCode(null);
      Linking.openURL(storeURL).catch(() => undefined);
    } finally {
      setUpdating(false);
      busy.current = false;
    }
  }

  return { visible: versionCode !== null, updating, update, dismiss };
}
