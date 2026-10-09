import type { FitnessGoal } from '@/features/onboarding/api';
import { apiURL, authHeaders } from '@/lib/auth-client';

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

export async function fetchProfile(signal?: AbortSignal): Promise<Profile> {
  let response: Response;
  try {
    response = await fetch(`${apiURL}/api/v1/profile`, {
      headers: authHeaders(),
      credentials: 'include',
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error('Can’t reach Forge right now. Check your connection.');
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.message || 'Couldn’t load your profile. Try again.');
  }
  return body.data;
}
