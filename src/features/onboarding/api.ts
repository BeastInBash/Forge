import { apiSend } from '@/lib/api';

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
  await apiSend('/api/v1/profile/onboarding', {
    method: 'PUT',
    body: JSON.stringify(answers),
    fallbackMessage: 'Couldn’t save your answers. Try again.',
  });
}
