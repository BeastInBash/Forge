import type { WorkoutPlan } from '@/types/training';

/** Ready-made muscle groups offered in the plan editor; any text is allowed. */
export const MUSCLE_GROUP_SUGGESTIONS = [
  'Chest & triceps',
  'Chest & biceps',
  'Back & biceps',
  'Back & triceps',
  'Shoulders & arms',
  'Legs',
  'Glutes & hamstrings',
  'Push',
  'Pull',
  'Upper body',
  'Lower body',
  'Full body',
];

const RULES: [RegExp, WorkoutPlan['split']][] = [
  [/\b(lower|leg|legs|quad|quads|hamstring|hamstrings|glute|glutes|calf|calves)\b/i, 'legs'],
  [/\b(pull|back|lat|lats|row|bicep|biceps)\b/i, 'pull'],
  [/\b(push|chest|pec|pecs|tricep|triceps|shoulder|shoulders)\b/i, 'push'],
];

/**
 * The tempering colour a plan is drawn in, guessed from its muscle group: legs first (so "Glutes
 * & hamstrings" isn't read as anything else), then pull, then push; anything else is "upper".
 */
export function splitFor(muscleGroup: string): WorkoutPlan['split'] {
  if (/\blower\b/i.test(muscleGroup)) return 'lower';
  for (const [pattern, split] of RULES) if (pattern.test(muscleGroup)) return split;
  return 'upper';
}
