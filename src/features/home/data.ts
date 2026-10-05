/**
 * Sample data for the home screen until it is wired to forge-backend
 * (`GET /workouts` for the week's plans, meal times for today's food).
 */

import type { MealTime, WorkoutExercise, WorkoutPlan } from '@/types/training';

export const SAMPLE_USER = { name: 'Sam', dailyCalorieGoal: 2600 };

function exercises(list: [name: string, sets: number, repetition: number][]): WorkoutExercise[] {
  return list.map(([name, sets, repetition], order) => ({
    id: `${name}-${order}`,
    exercise: { id: name.toLowerCase().replace(/\W+/g, '-'), name },
    sets,
    repetition,
    order,
  }));
}

export const SAMPLE_WEEK: WorkoutPlan[] = [
  {
    id: 'mon',
    day: 'Monday',
    time: '2026-10-05T18:30:00',
    muscleGroup: 'Chest & triceps',
    split: 'push',
    exercises: exercises([
      ['Barbell bench press', 4, 6],
      ['Incline dumbbell press', 3, 10],
      ['Weighted dips', 3, 8],
      ['Cable fly', 3, 12],
      ['Rope pushdown', 3, 15],
    ]),
  },
  {
    id: 'tue',
    day: 'Tuesday',
    time: '2026-10-06T18:30:00',
    muscleGroup: 'Back & biceps',
    split: 'pull',
    exercises: exercises([
      ['Deadlift', 4, 5],
      ['Weighted pull-up', 4, 6],
      ['Chest-supported row', 3, 10],
      ['Face pull', 3, 15],
      ['Hammer curl', 3, 12],
    ]),
  },
  {
    id: 'thu',
    day: 'Thursday',
    time: '2026-10-08T07:00:00',
    muscleGroup: 'Legs',
    split: 'legs',
    exercises: exercises([
      ['Back squat', 5, 5],
      ['Romanian deadlift', 3, 8],
      ['Walking lunge', 3, 12],
      ['Leg curl', 3, 12],
      ['Standing calf raise', 4, 15],
    ]),
  },
  {
    id: 'fri',
    day: 'Friday',
    time: '2026-10-09T18:30:00',
    muscleGroup: 'Shoulders & arms',
    split: 'upper',
    exercises: exercises([
      ['Overhead press', 4, 6],
      ['Lateral raise', 4, 15],
      ['EZ-bar curl', 3, 10],
      ['Skull crusher', 3, 10],
    ]),
  },
  {
    id: 'sat',
    day: 'Saturday',
    time: '2026-10-10T10:00:00',
    muscleGroup: 'Glutes & hamstrings',
    split: 'lower',
    exercises: exercises([
      ['Hip thrust', 4, 8],
      ['Bulgarian split squat', 3, 10],
      ['Nordic curl', 3, 6],
    ]),
  },
];

export const SAMPLE_MEALS: MealTime[] = [
  {
    id: 'breakfast',
    name: 'Breakfast',
    at: '08:00',
    logged: true,
    foods: [
      { id: 'oats', name: 'Oats with blueberries', calories: 380 },
      { id: 'eggs', name: 'Two boiled eggs', calories: 156 },
    ],
  },
  {
    id: 'lunch',
    name: 'Lunch',
    at: '13:00',
    logged: true,
    foods: [
      { id: 'chicken', name: 'Chicken breast', calories: 280 },
      { id: 'rice', name: 'Jasmine rice', calories: 260 },
      { id: 'greens', name: 'Greens', calories: 45 },
    ],
  },
  {
    id: 'pre-workout',
    name: 'Pre-workout',
    at: '17:00',
    logged: false,
    foods: [
      { id: 'banana', name: 'Banana', calories: 105 },
      { id: 'yogurt', name: 'Greek yogurt', calories: 150 },
    ],
  },
  {
    id: 'dinner',
    name: 'Dinner',
    at: '20:30',
    logged: false,
    foods: [
      { id: 'salmon', name: 'Salmon fillet', calories: 410 },
      { id: 'potato', name: 'Baked potato', calories: 230 },
    ],
  },
];
