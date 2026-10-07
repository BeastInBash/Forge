/** Forge weeks run Monday to Sunday. */

import type { Weekday } from '@/types/training';

export const WEEKDAYS: Weekday[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

/** JS weeks start on Sunday; Forge weeks start on Monday. */
export function mondayIndex(date: Date) {
  return (date.getDay() + 6) % 7;
}

/** Midnight on the Monday of `date`'s week. */
export function startOfWeek(date: Date) {
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(date.getDate() - mondayIndex(date));
  return monday;
}
