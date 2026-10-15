import { apiURL, authHeaders } from '@/lib/auth-client';

async function request(path: string, init: RequestInit) {
  let response: Response;
  try {
    response = await fetch(`${apiURL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...authHeaders(), ...init.headers },
      credentials: 'include',
    });
  } catch {
    throw new Error('Can’t reach Forge right now. Check your connection.');
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || 'Something went wrong. Try again.');
}

/** Tells the backend this device can receive the signed-in user's notifications. */
export const registerPushToken = (token: string, platform: 'ios' | 'android') =>
  request('/api/v1/notifications/push-token', {
    method: 'POST',
    body: JSON.stringify({ token, platform }),
  });

/** Stops this device getting the signed-in user's notifications; call before signing out. */
export const removePushToken = (token: string) =>
  request('/api/v1/notifications/push-token', {
    method: 'DELETE',
    body: JSON.stringify({ token }),
  });
