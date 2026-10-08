const shortDate = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const DAY = 24 * 3600 * 1000;

function startOfDay(date: Date) {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
}

/** "Today", "Yesterday", "3 days ago" within a week, then "Mar 4". */
export function relativeDay(iso: string, now = new Date()) {
  const date = new Date(iso);
  const days = Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / DAY);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days > 1 && days < 7) return `${days} days ago`;
  return shortDate.format(date);
}

/** Percentage change from the first to the last value, or undefined when it can't be told. */
export function percentChange(values: number[]) {
  if (values.length < 2 || values[0] <= 0) return undefined;
  return ((values[values.length - 1] - values[0]) / values[0]) * 100;
}
