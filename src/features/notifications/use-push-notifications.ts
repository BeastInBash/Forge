import type { NotificationResponse } from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { Notifications, registerForPush } from './push';

/**
 * While signed in: keeps this device registered for push (only if permission was already
 * given; the water goal screen is where it is asked for), and opens the right screen when a
 * notification is tapped, whether the tap launched the app or found it running. Does nothing in
 * a build without expo-notifications.
 */
export function usePushNotifications(signedIn: boolean) {
  const router = useRouter();

  useEffect(() => {
    if (!signedIn || !Notifications) return;
    const notifications = Notifications;
    registerForPush({ prompt: false });

    function open(response: NotificationResponse | null) {
      if (response?.actionIdentifier !== notifications.DEFAULT_ACTION_IDENTIFIER) return;
      const { type } = response.notification.request.content.data ?? {};
      if (type === 'water-reminder') router.navigate('/nutrition');
      // Handled once: without this, signing in again would reopen the screen
      notifications.clearLastNotificationResponseAsync();
    }

    // A tap that launched the app arrived before this listener existed
    notifications.getLastNotificationResponseAsync().then(open);
    const tap = notifications.addNotificationResponseReceivedListener(open);
    // The OS can rotate the device token; a fresh Expo token then has to reach the backend.
    const rotation = notifications.addPushTokenListener(() => {
      registerForPush({ prompt: false });
    });
    return () => {
      tap.remove();
      rotation.remove();
    };
  }, [signedIn, router]);
}
