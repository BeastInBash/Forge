import type { Exercise } from '@/features/exercises/api';
import { revalidate as revalidateExercises } from '@/features/exercises/exercise-cache';
import { WEEKDAYS } from '@/lib/week';
import type { WorkoutPlan } from '@/types/training';

import { createPlan, deletePlan, updatePlan } from './api';
import { removePlanLocally, revalidatePlans, savePlanLocally } from './plans-store';
import { resolveExercise, type SplitTemplate } from './templates';

const DEFAULT_MINUTES = 18 * 60; // 6:00 PM, as in the plan editor

/** Today at 6:00 PM local, as ISO. Only the time of day matters to the app. */
function defaultTime() {
  const date = new Date();
  date.setHours(Math.floor(DEFAULT_MINUTES / 60), DEFAULT_MINUTES % 60, 0, 0);
  return date.toISOString();
}

/**
 * Makes `template` the user's week: each training day's plan is created, or replaces the plan
 * already on that day (keeping its time), and plans on the template's rest days are deleted.
 * Days run one at a time so a failure leaves the rest of the week as it was; the cache is then
 * refreshed from the server either way. Throws the first error.
 */
export async function applyTemplate(
  template: SplitTemplate,
  plans: WorkoutPlan[],
  catalog: Exercise[] | undefined
) {
  try {
    for (const day of WEEKDAYS) {
      const existing = plans.find((plan) => plan.day === day);
      const planned = template.days.find((d) => d.day === day);
      if (!planned) {
        if (existing) {
          await deletePlan(existing.id);
          removePlanLocally(existing.id);
        }
        continue;
      }
      const input = {
        day,
        time: existing?.time ?? defaultTime(),
        muscleGroup: planned.muscleGroup,
        exercises: planned.exercises.map((exercise) => resolveExercise(exercise, catalog)),
      };
      savePlanLocally(existing ? await updatePlan(existing.id, input) : await createPlan(input));
    }
  } finally {
    // Exercises sent by name may have joined the catalog; refresh both from the server.
    await Promise.all([revalidatePlans(), revalidateExercises({ force: true })]);
  }
}
