import { apiSend } from '@/lib/api';

/** Tells the backend this device can receive the signed-in user's notifications. */
export async function registerPushToken(token: string, platform: 'ios' | 'android') {
  await apiSend('/api/v1/notifications/push-token', {
    method: 'POST',
    body: JSON.stringify({ token, platform }),
  });
}

/** Stops this device getting the signed-in user's notifications; call before signing out. */
export async function removePushToken(token: string) {
  await apiSend('/api/v1/notifications/push-token', {
    method: 'DELETE',
    body: JSON.stringify({ token }),
  });
}
