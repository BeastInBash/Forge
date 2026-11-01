/**
 * Push notifications through Expo's push service. The backend sends them (water reminders); this
 * module gets the device's Expo push token, with permission, and registers it with the backend.
 *
 * Remote push needs a development or store build: Expo Go on Android can't receive it, and
 * simulators have no push token. Those cases, and web, report `unavailable` instead of throwing.
 */

import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import type * as NotificationsModule from 'expo-notifications';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { registerPushToken, removePushToken } from './api';

/** Matches the `defaultChannel` of the expo-notifications plugin in app.json. */
const CHANNEL_ID = 'default';

export type PushStatus = 'registered' | 'denied' | 'unavailable';

/**
 * expo-notifications, or null where push can't work: web, Expo Go on Android (remote push was
 * removed from it in SDK 53, and touching the module there logs an error on every launch), and
 * builds missing its native side, where importing it throws "Cannot find native module …". It is
 * required lazily so the app runs on without push.
 */
export const Notifications = loadNotifications();

function loadNotifications(): typeof NotificationsModule | null {
  if (Platform.OS === 'web') return null;
  const expoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  if (expoGo && Platform.OS === 'android') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- may be missing natively
    return require('expo-notifications');
  } catch {
    return null;
  }
}

/** The token registered for the signed-in user, so sign-out can remove it. */
let registeredToken: string | undefined;

// Without a handler, notifications that arrive while the app is open aren't shown at all.
Notifications?.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Android 8+ files every notification under a channel the user can mute in system settings, and
 * Android 13+ only shows the permission prompt once a channel exists.
 */
async function ensureChannel(notifications: typeof NotificationsModule) {
  if (Platform.OS !== 'android') return;
  await notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Reminders',
    description: 'Water reminders through the day',
    importance: notifications.AndroidImportance.HIGH,
  });
}

/**
 * Registers this device for the signed-in user's notifications. With `prompt`, asks for
 * permission if it hasn't been decided yet; without it, only registers when already allowed (so
 * the app never pops the system dialog on launch). Never throws.
 */
export async function registerForPush({ prompt }: { prompt: boolean }): Promise<PushStatus> {
  if (!Notifications || !Device.isDevice) return 'unavailable';
  try {
    await ensureChannel(Notifications);
    let { granted, canAskAgain } = await Notifications.getPermissionsAsync();
    if (!granted && prompt && canAskAgain) {
      ({ granted } = await Notifications.requestPermissionsAsync());
    }
    if (!granted) return 'denied';

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await savePushToken(token);
    return 'registered';
  } catch (error) {
    // Expo Go on Android, a build without FCM credentials, or no network
    console.warn('Push registration failed', error);
    return 'unavailable';
  }
}

async function savePushToken(token: string) {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;
  await registerPushToken(token, Platform.OS);
  registeredToken = token;
}

/** Removes this device from the user's account. Call while still signed in. Never throws. */
export async function unregisterPush() {
  const token = registeredToken;
  registeredToken = undefined;
  if (token) await removePushToken(token).catch(() => {});
}

/** Forgets the token without telling the backend, e.g. after the account was deleted. */
export function forgetPushToken() {
  registeredToken = undefined;
}

/**
 * True when the user turned notifications off for good: the app can no longer ask, only system
 * settings can turn them back on. Checked on mount.
 */
export function useNotificationsBlocked() {
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    if (!Notifications || !Device.isDevice) return;
    let active = true;
    Notifications.getPermissionsAsync()
      .then(({ granted, canAskAgain }) => {
        if (active) setBlocked(!granted && !canAskAgain);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  return blocked;
}
