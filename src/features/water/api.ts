import { apiRequest } from '@/lib/api';

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

/** Null until the user has set a goal. */
export const fetchWaterGoal = () => apiRequest<WaterGoal | null>('/api/v1/water/goal');

export const saveWaterGoal = (input: WaterGoalInput) =>
  apiRequest<WaterGoal>('/api/v1/water/goal', { method: 'PUT', body: JSON.stringify(input) });

/** The device's time zone, which decides when the user's day starts and reminders fire. */
export function deviceTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}
