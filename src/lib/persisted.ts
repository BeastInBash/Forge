import { File, Paths } from 'expo-file-system';

/**
 * Small JSON values kept across launches, one file per key in the app's document directory.
 * Reads and writes never throw: a missing or corrupt entry reads as `undefined`.
 */
function fileFor(key: string) {
  return new File(Paths.document, `${key.replace(/[^\w.-]/g, '_')}.json`);
}

export async function readPersisted<T>(key: string): Promise<T | undefined> {
  try {
    const file = fileFor(key);
    if (!file.exists) return undefined;
    return JSON.parse(await file.text()) as T;
  } catch {
    return undefined;
  }
}

export async function writePersisted(key: string, value: unknown) {
  try {
    const file = fileFor(key);
    if (!file.exists) file.create();
    file.write(JSON.stringify(value));
  } catch {
    // A cache that can't be written just means a slower next launch.
  }
}
