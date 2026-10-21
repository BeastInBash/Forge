import type { Exercise } from './api';
import { MUSCLE_GROUPS } from './muscles';

/** Each muscle's body region ("Quads" → "Legs"), so a search for the region finds it too. */
const REGION = new Map<string, string>(
  Object.entries(MUSCLE_GROUPS).flatMap(([region, muscles]) => muscles.map((m) => [m, region]))
);

/** forge-backend's duplicate check: names are the same exercise once trimmed and lowercased. */
export function nameKey(name: string) {
  return name.trim().toLowerCase();
}

/**
 * Library exercises whose name contains every word typed, in any order ("squat barbell" finds
 * "Barbell Back Squat"). The exact name comes first, then names starting with the query.
 */
export function findMatches(exercises: Exercise[], query: string) {
  const key = nameKey(query);
  const words = key.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const rank = (e: Exercise) => {
    const name = nameKey(e.exercise_name);
    return name === key ? 0 : name.startsWith(key) ? 1 : 2;
  };
  return exercises
    .filter((e) => {
      const name = nameKey(e.exercise_name);
      return words.every((word) => name.includes(word));
    })
    .sort((a, b) => rank(a) - rank(b) || a.exercise_name.localeCompare(b.exercise_name));
}

/**
 * Search for browsing: like `findMatches`, but a word may also match a muscle the exercise
 * targets or its body region, so "chest" or "legs" finds those exercises. Name matches come
 * first.
 */
export function searchExercises(exercises: Exercise[], query: string) {
  const words = nameKey(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return exercises;
  const byName = new Set(findMatches(exercises, query));
  const byMuscle = exercises.filter((e) => {
    if (byName.has(e)) return false;
    const muscles = [...(e.primary_muscles ?? []), ...(e.secondary_muscles ?? [])];
    const regions = muscles.map((m) => REGION.get(m) ?? '');
    const text = nameKey([e.exercise_name, ...muscles, ...regions].join(' '));
    return words.every((word) => text.includes(word));
  });
  return [...byName, ...byMuscle];
}
