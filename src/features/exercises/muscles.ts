/**
 * The muscles an exercise can target, grouped by body region. Mirrors forge-backend's
 * `src/common/utils/muscles.ts`, which validates them; keep the two lists the same.
 */
export const MUSCLE_GROUPS = {
  Chest: ['Upper chest', 'Mid chest', 'Lower chest'],
  Shoulders: ['Front delts', 'Side delts', 'Rear delts'],
  Arms: ['Biceps', 'Triceps', 'Forearms'],
  Back: ['Lats', 'Upper back', 'Traps', 'Lower back'],
  Core: ['Abs', 'Obliques'],
  Legs: ['Quads', 'Hamstrings', 'Glutes', 'Calves', 'Adductors'],
} as const;

export type Muscle = (typeof MUSCLE_GROUPS)[keyof typeof MUSCLE_GROUPS][number];

export type MuscleTargets = { primary: Muscle[]; secondary: Muscle[] };

export const NO_MUSCLES: MuscleTargets = { primary: [], secondary: [] };

/** An exercise's muscles, empty when the catalog predates them. */
export function targetsOf(exercise: {
  primary_muscles?: string[];
  secondary_muscles?: string[];
}): MuscleTargets {
  return {
    primary: (exercise.primary_muscles ?? []) as Muscle[],
    secondary: (exercise.secondary_muscles ?? []) as Muscle[],
  };
}
