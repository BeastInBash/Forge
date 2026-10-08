import { apiURL, authHeaders } from '@/lib/auth-client';

export type FitnessGoal = 'WEIGHT_LOSS' | 'WEIGHT_GAIN' | 'MUSCLE_BUILDING';

/** The onboarding answers. A skipped step is null. */
export type OnboardingAnswers = {
  age: number | null;
  /** Height in cm. */
  heightCm: number | null;
  /** Body weight in kg. */
  weightKg: number | null;
  goal: FitnessGoal | null;
};

/** `PUT /api/v1/profile/onboarding` — stores the answers and marks onboarding done. */
export async function saveOnboarding(answers: OnboardingAnswers): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${apiURL}/api/v1/profile/onboarding`, {
      method: 'PUT',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(answers),
    });
  } catch {
    throw new Error('Can’t reach Forge right now. Check your connection.');
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || 'Couldn’t save your answers. Try again.');
  }
}
