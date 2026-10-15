/** "08:00" → "8 AM", "13:30" → "1:30 PM". */
export function formatClock(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours < 12 ? 'AM' : 'PM';
  const hour = hours % 12 || 12;
  return minutes ? `${hour}:${String(minutes).padStart(2, '0')} ${period}` : `${hour} ${period}`;
}

/** 120 → "2 hours", 90 → "90 minutes". */
function formatInterval(minutes: number) {
  if (minutes % 60 !== 0) return `${minutes} minutes`;
  const hours = minutes / 60;
  return hours === 1 ? 'hour' : `${hours} hours`;
}

/** "Reminders every 2 hours, 8 AM – 10 PM." */
export function reminderSummary(reminders: {
  reminderStart: string;
  reminderEnd: string;
  reminderIntervalMin: number;
}) {
  return `Reminders every ${formatInterval(reminders.reminderIntervalMin)}, ${formatClock(
    reminders.reminderStart
  )} – ${formatClock(reminders.reminderEnd)}.`;
}

/** 2500 → "2.5 L", 3000 → "3 L". */
export const formatLitres = (ml: number) => `${Math.round(ml / 100) / 10} L`;
