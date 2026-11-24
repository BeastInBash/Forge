/**
 * A store's last copy from the server, kept on the device so screens open with it at once (and
 * still have something to show while the server is offline or its database is waking up). The
 * store refetches on focus as usual and replaces it.
 *
 * The data is per user: `clear` on sign-out, and a copy still being read when `clear` runs is
 * thrown away, so it can't show up for the next user.
 */

import { readPersisted, writePersisted } from './persisted';

/** Updates often come in bursts (a refetch per screen); they are written once after this. */
const WRITE_DELAY_MS = 500;

export function createPersistedCache<T>(key: string) {
  let generation = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  return {
    /** The saved copy, or undefined when there is none (or it was cleared meanwhile). */
    async load(): Promise<T | undefined> {
      const started = generation;
      const saved = await readPersisted<T | null>(key);
      return started === generation && saved != null ? saved : undefined;
    },

    save(value: T) {
      clearTimeout(timer);
      timer = setTimeout(() => writePersisted(key, value), WRITE_DELAY_MS);
    },

    clear() {
      generation++;
      clearTimeout(timer);
      writePersisted(key, null);
    },
  };
}
