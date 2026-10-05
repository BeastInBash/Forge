/**
 * Better Auth client for forge-backend.
 *
 * On iOS and Android the Expo plugin keeps the session cookie in the secure store, sends it with
 * every auth request, and finishes social sign-in by deep-linking back through the `forge` scheme.
 * On web the browser's own cookie jar does that, so the plugin gets a no-op store.
 */

import { expoClient } from '@better-auth/expo/client';
import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const baseURL = process.env.EXPO_PUBLIC_API_URL;

if (!baseURL) {
  throw new Error('EXPO_PUBLIC_API_URL is not set. Add it to .env.local (see the comment there).');
}

const webStorage = {
  getItem: () => null,
  setItem: () => {},
};

const expo = expoClient({
  scheme: 'forge',
  storagePrefix: 'forge',
  storage: Platform.OS === 'web' ? webStorage : SecureStore,
});

/**
 * @better-auth/expo 1.6.27 annotates `getActions` with a narrower fetch type than
 * `BetterAuthClientPlugin` accepts under TypeScript 6. Widening only the parameters keeps the
 * inferred actions (`getCookie`) typed. Drop this once the package's types catch up.
 */
type ExpoPlugin = Omit<typeof expo, 'getActions'> & {
  getActions: (...args: any[]) => ReturnType<typeof expo.getActions>;
};

export const authClient = createAuthClient({
  baseURL,
  plugins: [expo as ExpoPlugin],
});

/**
 * Headers for calls to forge-backend's own API (`/api/v1/...`), so `requireAuth` sees the session.
 * Native requests carry the stored cookie; web relies on `credentials: 'include'` instead.
 */
export function authHeaders(): Record<string, string> {
  if (Platform.OS === 'web') return {};
  const cookie = authClient.getCookie();
  return cookie ? { Cookie: cookie } : {};
}
