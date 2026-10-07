/**
 * Small JSON values kept across launches, in localStorage. Reads and writes never throw: a
 * missing, corrupt or blocked entry (private mode, cleared site data) reads as `undefined`.
 */
export async function readPersisted<T>(key: string): Promise<T | undefined> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
}

export async function writePersisted(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // A cache that can't be written just means a slower next load.
  }
}
