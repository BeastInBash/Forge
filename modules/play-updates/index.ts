import { requireOptionalNativeModule } from 'expo';

export type UpdateCheck = {
  /** `in-progress`: the user started an update earlier and left Play's screen before it ended. */
  status: 'available' | 'in-progress' | 'none';
  availableVersionCode: number;
  /** Days since Play first offered this update to the device, or null if it hasn't yet. */
  stalenessDays: number | null;
  /** 0–5, set per release through the Play Developer API. */
  priority: number;
};

type PlayUpdatesModule = {
  checkForUpdate(): Promise<UpdateCheck>;
  startUpdate(): Promise<'ok' | 'canceled' | 'failed' | 'unavailable'>;
};

/** Null on iOS, web and Expo Go, where there is no Play Store to ask. */
export const PlayUpdates = requireOptionalNativeModule<PlayUpdatesModule>('PlayUpdates');
