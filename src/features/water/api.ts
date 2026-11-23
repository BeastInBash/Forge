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

/** One drink. */
export type WaterLog = {
  id: string;
  amountMl: number;
  /** ISO 8601 date-time. */
  drankAt: string;
};

/** One local day's drinks against the goal (`GET /api/v1/water/day`). */
export type WaterDay = {
  /** Local "YYYY-MM-DD". */
  date: string;
  timezone: string;
  /** Null until the user has set a goal. */
  goalMl: number | null;
  consumedMl: number;
  remainingMl: number | null;
  goalReached: boolean;
  /** Oldest first. */
  logs: WaterLog[];
};

/** Today in the goal's time zone (the device's, before a goal is set). */
export const fetchWaterDay = () =>
  apiRequest<WaterDay>(`/api/v1/water/day?timezone=${encodeURIComponent(deviceTimezone())}`);

/** Logs a drink, now. The backend accepts 10–3000 ml. */
export const logWater = (amountMl: number) =>
  apiRequest<WaterLog>('/api/v1/water/logs', {
    method: 'POST',
    body: JSON.stringify({ amountMl }),
  });

export const deleteWaterLog = (id: string) =>
  apiRequest<null>(`/api/v1/water/logs/${id}`, { method: 'DELETE' });

/** The device's time zone, which decides when the user's day starts and reminders fire. */
export function deviceTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}
