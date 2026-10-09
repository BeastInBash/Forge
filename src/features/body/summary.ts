import type { FitnessGoal } from '@/features/onboarding/api';

import type { Measurements } from './body-store';
import {
  GOAL_TARGETS,
  bmi,
  bmiBand,
  bmr,
  maintenance,
  roundCalories,
  type ActivityLevel,
  type Sex,
} from './metrics';

export type BodySummary = {
  bmi?: number;
  band?: ReturnType<typeof bmiBand>;
  /** Calories a day to hold the current weight. */
  maintenance?: number;
  /** Calories a day for the chosen goal. */
  goal?: { goal: FitnessGoal; label: string; calories: number };
  /** What's still needed for the calorie figures, in the order to ask for it. */
  missing: string[];
};

/** BMI and daily calories from whatever is known; anything that can't be worked out is left out. */
export function summarize(
  { age, heightCm, weightKg, goal }: Partial<Measurements>,
  { sex, activity }: { sex?: Sex; activity: ActivityLevel }
): BodySummary {
  const summary: BodySummary = { missing: [] };
  if (heightCm && weightKg) {
    summary.bmi = bmi(weightKg, heightCm);
    summary.band = bmiBand(summary.bmi);
  }

  if (!sex) summary.missing.push('sex');
  if (!age) summary.missing.push('age');
  if (!heightCm || !weightKg) summary.missing.push('height and weight');
  if (sex && age && heightCm && weightKg) {
    summary.maintenance = roundCalories(maintenance(bmr(sex, weightKg, heightCm, age), activity));
    const target = GOAL_TARGETS.find((t) => t.goal === goal);
    if (target) {
      summary.goal = {
        goal: target.goal,
        label: target.label,
        calories: summary.maintenance + target.offset,
      };
    }
  }
  return summary;
}
