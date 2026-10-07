/** Display helpers for the raw values in a `Profile`. */

const dateFormat = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});
const monthFormat = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });

export const formatDate = (iso: string) => dateFormat.format(new Date(iso));
export const formatDateTime = (iso: string) => dateTimeFormat.format(new Date(iso));
export const formatMonth = (iso: string) => monthFormat.format(new Date(iso));

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days since `iso`, counting the first day as day one. */
export function daysSince(iso: string, now = Date.now()) {
  return Math.max(1, Math.ceil((now - new Date(iso).getTime()) / DAY_MS));
}

/** "Just now", "5 min ago", "3 h ago", "2 days ago", then a date. */
export function timeAgo(iso: string, now = Date.now()) {
  const minutes = Math.floor((now - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return days === 1 ? 'Yesterday' : `${days} days ago`;
  return formatDate(iso);
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? '?').slice(0, 2);
  return letters.toUpperCase();
}

/** Better Auth provider ids, as people know them. */
export function providerLabel(providerId: string) {
  if (providerId === 'credential') return 'Email and password';
  if (providerId === 'google') return 'Google';
  return providerId.charAt(0).toUpperCase() + providerId.slice(1);
}

export type Device = { label: string; mobile: boolean };

/**
 * A readable device name from a session's user agent. The native app reports its HTTP stack
 * rather than a browser: OkHttp on Android, CFNetwork on iOS.
 */
export function describeDevice(userAgent: string | null): Device {
  if (!userAgent) return { label: 'Unknown device', mobile: false };
  if (/okhttp/i.test(userAgent)) return { label: 'Forge app on Android', mobile: true };
  if (/CFNetwork|Darwin/.test(userAgent)) return { label: 'Forge app on iOS', mobile: true };

  const browser = /Edg\//.test(userAgent)
    ? 'Edge'
    : /Firefox\//.test(userAgent)
      ? 'Firefox'
      : /Chrome\/|CriOS\//.test(userAgent)
        ? 'Chrome'
        : /Safari\//.test(userAgent)
          ? 'Safari'
          : 'Browser';
  const os = /Android/.test(userAgent)
    ? 'Android'
    : /iPhone|iPad/.test(userAgent)
      ? 'iOS'
      : /Windows/.test(userAgent)
        ? 'Windows'
        : /Mac OS X/.test(userAgent)
          ? 'macOS'
          : /Linux/.test(userAgent)
            ? 'Linux'
            : undefined;
  return {
    label: os ? `${browser} on ${os}` : browser,
    mobile: os === 'Android' || os === 'iOS',
  };
}
