/**
 * Crash and error reporting. Imported first by the root layout so it catches errors from the very
 * start. Off in development and when no DSN is set, so local work never sends reports.
 */

import * as Sentry from '@sentry/react-native';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: !__DEV__ && Boolean(dsn),
  // No IP addresses, cookies or request bodies: only the user id set after sign-in.
  sendDefaultPii: false,
  // Performance traces for a sample of sessions; errors are always sent.
  tracesSampleRate: 0.2,
});

export { Sentry };
