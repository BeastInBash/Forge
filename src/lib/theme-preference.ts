/**
 * The user's light/dark choice, kept across launches. "system" follows the device. On iOS and
 * Android the choice is also handed to `Appearance`, so native chrome (tab bar, keyboard, status
 * bar, alerts) switches with the app.
 */

import { useSyncExternalStore } from 'react';
import { Appearance, Platform } from 'react-native';

import { readPersisted, writePersisted } from './persisted';

export type ThemePreference = 'system' | 'light' | 'dark';

const KEY = 'theme-preference';

let state: { preference: ThemePreference; loaded: boolean } = {
  preference: 'system',
  loaded: false,
};
const listeners = new Set<() => void>();

function setState(next: typeof state) {
  state = next;
  listeners.forEach((listener) => listener());
}

function apply(preference: ThemePreference) {
  if (Platform.OS !== 'web') {
    Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => state;

readPersisted<ThemePreference>(KEY).then((saved) => {
  const preference = saved === 'light' || saved === 'dark' ? saved : 'system';
  apply(preference);
  setState({ preference, loaded: true });
});

export function setThemePreference(preference: ThemePreference) {
  apply(preference);
  setState({ ...state, preference });
  writePersisted(KEY, preference);
}

/** The saved choice, and whether it has been read from disk yet. */
export function useThemePreference() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
