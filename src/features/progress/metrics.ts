/**
 * The numbers a lift is tracked by. Mirrors forge-backend's `liftMetrics.ts` so the app can chart
 * any metric from the raw sets.
 */

import type { Lift, LiftSet } from './api';

export type Metric = 'e1rm' | 'topWeight' | 'volume' | 'topReps' | 'totalReps';

export const METRICS: Record<Metric, { label: string; unit: string; decimals: number }> = {
  e1rm: { label: 'Est. 1RM', unit: 'kg', decimals: 1 },
  topWeight: { label: 'Top weight', unit: 'kg', decimals: 1 },
  volume: { label: 'Volume', unit: 'kg', decimals: 0 },
  topReps: { label: 'Best set', unit: 'reps', decimals: 0 },
  totalReps: { label: 'Total reps', unit: 'reps', decimals: 0 },
};

export const WEIGHTED_METRICS: Metric[] = ['e1rm', 'topWeight', 'volume'];
export const BODYWEIGHT_METRICS: Metric[] = ['topReps', 'totalReps'];

/** Epley. A single is its own max; bodyweight sets have no load to estimate from. */
export function estimateOneRepMax({ weight, reps }: Pick<LiftSet, 'weight' | 'reps'>) {
  if (weight === null) return 0;
  return reps === 1 ? weight : weight * (1 + reps / 30);
}

/** The heaviest set by estimated max, or the one with most reps when every set is bodyweight. */
export function bestSet<T extends Pick<LiftSet, 'weight' | 'reps'>>(sets: T[]): T | undefined {
  return sets.reduce<T | undefined>((best, set) => {
    if (!best) return set;
    const delta = estimateOneRepMax(set) - estimateOneRepMax(best);
    return delta > 0 || (delta === 0 && set.reps > best.reps) ? set : best;
  }, undefined);
}

/** True when no set in any of the lifts carried a load. */
export function isBodyweight(lifts: Lift[]) {
  return lifts.every((lift) => lift.sets.every((set) => set.weight === null));
}

export function liftMetric(lift: Lift, metric: Metric): number {
  const { sets } = lift;
  switch (metric) {
    case 'e1rm':
      return Math.max(0, ...sets.map(estimateOneRepMax));
    case 'topWeight':
      return Math.max(0, ...sets.map((set) => set.weight ?? 0));
    case 'volume':
      return sets.reduce((sum, set) => sum + (set.weight ?? 0) * set.reps, 0);
    case 'topReps':
      return Math.max(0, ...sets.map((set) => set.reps));
    case 'totalReps':
      return sets.reduce((sum, set) => sum + set.reps, 0);
  }
}

/** "102.5" or "100" — kilos to at most one decimal, no trailing zero. */
export function formatKg(value: number) {
  return String(Math.round(value * 10) / 10);
}

export function formatMetric(value: number, metric: Metric) {
  const { decimals, unit } = METRICS[metric];
  const factor = 10 ** decimals;
  return `${(Math.round(value * factor) / factor).toLocaleString()} ${unit}`;
}

/** "100 kg × 5" or "BW × 12". */
export function formatSet({ weight, reps }: Pick<LiftSet, 'weight' | 'reps'>) {
  return `${weight === null ? 'BW' : `${formatKg(weight)} kg`} × ${reps}`;
}

/**
 * Collapses equal consecutive sets: 100×5, 100×5, 100×5, 95×8 → "3 × 5 @ 100 kg · 95 kg × 8".
 */
export function describeSets(sets: Pick<LiftSet, 'weight' | 'reps'>[]) {
  const groups: { weight: number | null; reps: number; count: number }[] = [];
  for (const set of sets) {
    const last = groups[groups.length - 1];
    if (last && last.weight === set.weight && last.reps === set.reps) last.count += 1;
    else groups.push({ ...set, count: 1 });
  }
  return groups
    .map(({ weight, reps, count }) => {
      if (count === 1) return formatSet({ weight, reps });
      return weight === null ? `${count} × ${reps}` : `${count} × ${reps} @ ${formatKg(weight)} kg`;
    })
    .join(' · ');
}
