import type { FitnessGoal } from '@/features/onboarding/api';
import { apiRequest, apiSend } from '@/lib/api';

/** `GET /api/v1/profile` — everything forge-backend stores about the signed-in user. */
export type Profile = {
  id: string;
  name: string;
  email: string;
  bio: string | null;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  /** Onboarding answers; null when the step was skipped. */
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  goal: FitnessGoal | null;
  /** Linked sign-in methods. `credential` is email and password. */
  accounts: { providerId: string; createdAt: string }[];
  /** Unexpired sessions, most recently active first. */
  sessions: {
    createdAt: string;
    updatedAt: string;
    expiresAt: string;
    ipAddress: string | null;
    userAgent: string | null;
    current: boolean;
  }[];
  stats: { workoutPlans: number; exercisesCreated: number };
};

export const fetchProfile = (signal?: AbortSignal) =>
  apiRequest<Profile>('/api/v1/profile', {
    signal,
    fallbackMessage: 'Couldn’t load your profile. Try again.',
  });

/** `DELETE /api/v1/profile` — permanently deletes the signed-in user and everything they own. */
export async function deleteAccount(): Promise<void> {
  await apiSend('/api/v1/profile', {
    method: 'DELETE',
    fallbackMessage: 'Couldn’t delete your account. Try again.',
  });
}
