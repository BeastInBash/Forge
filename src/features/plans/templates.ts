/**
 * Ready-made training splits a user can drop into their week. Each exercise lists a few names it
 * goes by; `resolveExercise` picks the one the catalog has (so the plan shows its image), and
 * falls back to the first name, which the backend adds to the catalog.
 */

import type { Exercise } from '@/features/exercises/api';
import { nameKey } from '@/features/exercises/search';
import type { Weekday } from '@/types/training';

import type { PlanExerciseInput } from './api';

export type TemplateExercise = {
  /** Names this exercise goes by, preferred first; the catalog's spelling wins when it has one. */
  names: string[];
  sets: number;
  repetition: number;
};

export type TemplateDay = {
  day: Weekday;
  /** Becomes the plan's muscle group, which also picks its split colour. */
  muscleGroup: string;
  exercises: TemplateExercise[];
};

export type SplitTemplate = {
  id: string;
  name: string;
  description: string;
  level: string;
  /** Training days only; every other weekday is rest. */
  days: TemplateDay[];
};

const ex = (names: string[], sets: number, repetition: number): TemplateExercise => ({
  names,
  sets,
  repetition,
});

// Shared exercises, each with the spellings already seen in the catalog.
const BENCH = ['Barbell Bench Press', 'Bench Press', 'Flat Bench Press'];
const INCLINE_DB = ['Incline Dumbbell Press', 'Incline Dumbbell Bench Press'];
const DB_BENCH = ['Dumbbell Bench Press', 'Dumbbell Press'];
const OHP = ['Overhead Press', 'Barbell Overhead Press', 'Military Press', 'Shoulder Press'];
const DB_SHOULDER = ['Seated Dumbbell Shoulder Press', 'Dumbbell Shoulder Press', 'Shoulder Press'];
const LATERAL = [
  'Cable Lateral Raises',
  'Cabel Lateral Raises',
  'Lateral Raises',
  'Dumbbell Lateral Raise',
];
const CHEST_FLY = ['Cable Crossover', 'Cable Fly', 'Chest Fly', 'Pec Deck'];
const PUSHDOWN = ['Tricep Pushdown', 'Triceps Pushdown', 'Cable Tricep Pushdown', 'Rope Pushdown'];
const OH_EXT = [
  'Overhead Tricep Extension',
  'Overhead Triceps Extension',
  'Cable Overhead Extension',
];
const CG_BENCH = ['Close Grip Bench Press', 'Close grip Bench Press'];
const DIPS = ['Dips', 'Tricep Dips', 'Chest Dips'];
const DEADLIFT = ['Deadlift', 'Barbell Deadlift', 'Conventional Deadlift'];
const PULLDOWN = ['Lat Pulldown', 'Wide Grip Lat Pulldown', 'Cable Lat Pulldown'];
const CG_PULLDOWN = ['Close Grip Lat Pulldown', 'Close-Grip Lat Pulldown'];
const PULL_UP = ['Pull Up', 'Pull-Up', 'Pull Ups', 'Pullups'];
const BB_ROW = ['Barbell Bent Over Row', 'Barbell Bentover Row', 'Bent Over Row', 'Barbell Row'];
const CABLE_ROW = ['Seated Cable Row', 'Cable Row', 'Cabel Row'];
const DB_ROW = ['Dumbbell Row', 'One Arm Dumbbell Row', 'Single Arm Dumbbell Row'];
const FACE_PULL = ['Face Pull', 'Face Pulls', 'Cable Face Pull'];
const REAR_DELT = ['Rear Delt Fly', 'Reverse Fly', 'Reverse Pec Deck'];
const BB_CURL = ['Barbell Curl', 'Barbell Bicep Curl', 'Bicep Curl'];
const HAMMER = ['Hammer Curl', 'Dumbbell Hammer Curl', 'Hammer Curls'];
const INCLINE_CURL = ['Incline Dumbbell Curl', 'Dumbbell Curl', 'Bicep Curl'];
const SQUAT = ['Barbell Squat', 'Back Squat', 'Barbell Back Squat', 'Squat'];
const FRONT_SQUAT = ['Front Squat', 'Barbell Front Squat', 'Goblet Squat'];
const RDL = ['Romanian Deadlift', 'RDL', 'Dumbbell Romanian Deadlift'];
const LEG_PRESS = ['Leg Press', 'Machine Leg Press'];
const LEG_CURL = ['Leg Curl', 'Lying Leg Curl', 'Seated Leg Curl', 'Hamstring Curl'];
const LEG_EXT = ['Leg Extension', 'Leg Extensions', 'Machine Leg Extension'];
const SPLIT_SQUAT = ['Bulgarian Split Squat', 'Split Squat', 'Lunges'];
const HIP_THRUST = ['Hip Thrust', 'Barbell Hip Thrust', 'Glute Bridge'];
const LUNGE = ['Walking Lunges', 'Lunges', 'Dumbbell Lunges'];
const CALF = ['Standing Calf Raise', 'Calf Raise', 'Calf Raises'];
const SEATED_CALF = ['Seated Calf Raise', 'Calf Raise', 'Calf Raises'];

const PUSH_A = [
  ex(BENCH, 4, 8),
  ex(INCLINE_DB, 3, 10),
  ex(OHP, 3, 8),
  ex(LATERAL, 3, 15),
  ex(PUSHDOWN, 3, 12),
  ex(OH_EXT, 3, 12),
];
const PULL_A = [
  ex(DEADLIFT, 3, 5),
  ex(PULLDOWN, 3, 10),
  ex(BB_ROW, 3, 8),
  ex(FACE_PULL, 3, 15),
  ex(BB_CURL, 3, 10),
  ex(HAMMER, 3, 12),
];
const LEGS_A = [
  ex(SQUAT, 4, 8),
  ex(RDL, 3, 10),
  ex(LEG_PRESS, 3, 12),
  ex(LEG_CURL, 3, 12),
  ex(CALF, 4, 15),
];
const PUSH_B = [
  ex(DB_BENCH, 4, 10),
  ex(DB_SHOULDER, 3, 10),
  ex(CHEST_FLY, 3, 12),
  ex(LATERAL, 3, 15),
  ex(CG_BENCH, 3, 10),
  ex(DIPS, 3, 12),
];
const PULL_B = [
  ex(PULL_UP, 4, 8),
  ex(CG_PULLDOWN, 3, 10),
  ex(CABLE_ROW, 3, 10),
  ex(DB_ROW, 3, 10),
  ex(REAR_DELT, 3, 15),
  ex(INCLINE_CURL, 3, 12),
];
const LEGS_B = [
  ex(FRONT_SQUAT, 4, 8),
  ex(HIP_THRUST, 3, 10),
  ex(SPLIT_SQUAT, 3, 10),
  ex(LEG_EXT, 3, 12),
  ex(LEG_CURL, 3, 12),
  ex(SEATED_CALF, 4, 15),
];

const UPPER_A = [
  ex(BENCH, 4, 6),
  ex(BB_ROW, 4, 8),
  ex(OHP, 3, 8),
  ex(PULLDOWN, 3, 10),
  ex(BB_CURL, 3, 10),
  ex(PUSHDOWN, 3, 12),
];
const LOWER_A = [
  ex(SQUAT, 4, 6),
  ex(RDL, 3, 8),
  ex(LEG_PRESS, 3, 10),
  ex(LEG_CURL, 3, 12),
  ex(CALF, 4, 15),
];
const UPPER_B = [
  ex(INCLINE_DB, 4, 10),
  ex(CABLE_ROW, 4, 10),
  ex(DB_SHOULDER, 3, 10),
  ex(PULL_UP, 3, 8),
  ex(LATERAL, 3, 15),
  ex(HAMMER, 3, 12),
  ex(OH_EXT, 3, 12),
];
const LOWER_B = [
  ex(DEADLIFT, 3, 5),
  ex(FRONT_SQUAT, 3, 8),
  ex(LUNGE, 3, 12),
  ex(LEG_EXT, 3, 12),
  ex(SEATED_CALF, 4, 15),
];

export const SPLIT_TEMPLATES: SplitTemplate[] = [
  {
    id: 'ppl-6',
    name: 'Push · Pull · Legs',
    description:
      'Each muscle group twice a week. Push days train chest, shoulders and triceps, pull ' +
      'days back and biceps, leg days the whole lower body.',
    level: 'Intermediate',
    days: [
      { day: 'Monday', muscleGroup: 'Push A', exercises: PUSH_A },
      { day: 'Tuesday', muscleGroup: 'Pull A', exercises: PULL_A },
      { day: 'Wednesday', muscleGroup: 'Legs A', exercises: LEGS_A },
      { day: 'Thursday', muscleGroup: 'Push B', exercises: PUSH_B },
      { day: 'Friday', muscleGroup: 'Pull B', exercises: PULL_B },
      { day: 'Saturday', muscleGroup: 'Legs B', exercises: LEGS_B },
    ],
  },
  {
    id: 'upper-lower-4',
    name: 'Upper · Lower',
    description:
      'Four days with a rest day in the middle. Heavier compound lifts early in the week, ' +
      'more volume later.',
    level: 'Beginner friendly',
    days: [
      { day: 'Monday', muscleGroup: 'Upper body A', exercises: UPPER_A },
      { day: 'Tuesday', muscleGroup: 'Lower body A', exercises: LOWER_A },
      { day: 'Thursday', muscleGroup: 'Upper body B', exercises: UPPER_B },
      { day: 'Friday', muscleGroup: 'Lower body B', exercises: LOWER_B },
    ],
  },
];

/** The catalog exercise for a template entry, if the catalog has any of its names. */
export function catalogMatch(exercise: TemplateExercise, catalog: Exercise[] | undefined) {
  if (!catalog) return undefined;
  for (const name of exercise.names) {
    const match = catalog.find((e) => nameKey(e.exercise_name) === nameKey(name));
    if (match) return match;
  }
  return undefined;
}

/** A template entry as the plan API takes it: by catalog id when possible, else by name. */
export function resolveExercise(
  exercise: TemplateExercise,
  catalog: Exercise[] | undefined
): PlanExerciseInput {
  const match = catalogMatch(exercise, catalog);
  const load = { sets: exercise.sets, repetition: exercise.repetition, weight: null };
  return match ? { exerciseId: match.id, ...load } : { exerciseName: exercise.names[0], ...load };
}
