import { apiURL, authHeaders } from '@/lib/auth-client';

/** The daily water target and reminder window (`GET /api/v1/water/goal`). */
export type WaterGoal = {
  dailyGoalMl: number;
  remindersEnabled: boolean;
  /** Local "HH:mm" in `timezone`. */
  reminderStart: string;
  reminderEnd: string;
  reminderIntervalMin: number;
  /** IANA zone, e.g. "Asia/Karachi". */
  timezone: string;
  updatedAt: string;
  /** When the backend pushes reminders; null when they are off. */
  reminders: { times: string[]; perReminderMl: number } | null;
};

/** The body for `PUT /api/v1/water/goal`; it replaces every setting. */
export type WaterGoalInput = Omit<WaterGoal, 'updatedAt' | 'reminders'>;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiURL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...authHeaders(), ...init?.headers },
      credentials: 'include',
    });
  } catch {
    throw new Error('Can’t reach Forge right now. Check your connection.');
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || 'Something went wrong. Try again.');
  return body.data;
}

/** Null until the user has set a goal. */
export const fetchWaterGoal = () => request<WaterGoal | null>('/api/v1/water/goal');

export const saveWaterGoal = (input: WaterGoalInput) =>
  request<WaterGoal>('/api/v1/water/goal', { method: 'PUT', body: JSON.stringify(input) });

/** The device's time zone, which decides when the user's day starts and reminders fire. */
export function deviceTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}
