/**
 * Personal daily nutrient targets. Macros follow the calorie goal from `features/body`: protein
 * per kg of body weight for the goal, fat a quarter of calories, carbs the rest. Vitamins and
 * minerals are the US Dietary Reference Intakes (RDA, or AI where there is none) for the user's
 * sex and age; they don't depend on weight or calories. Without sex, the FDA Daily Values in
 * `NUTRIENT_INFO` stand in.
 */

import type { Measurements } from '@/features/body/body-store';
import { bmi, healthyWeightRange, type Sex } from '@/features/body/metrics';
import type { FitnessGoal } from '@/features/onboarding/api';

import { NUTRIENT_INFO } from './nutrients';

export type Target = {
  amount: number;
  /** A ceiling to stay under rather than an amount to reach. */
  limit?: boolean;
};

/** Grams of protein per kg of body weight a day. */
const PROTEIN_PER_KG: Record<FitnessGoal, number> = {
  WEIGHT_LOSS: 2.0,
  MUSCLE_BUILDING: 1.8,
  WEIGHT_GAIN: 1.6,
};
const PROTEIN_PER_KG_DEFAULT = 1.6;

/** Share of calories from fat. */
const FAT_SHARE = 0.25;

/** Targets worked out from the calorie goal, so the FDA's 2,000 kcal values never stand in. */
const CALORIE_BASED = new Set(['calories', 'protein', 'carbs', 'fat', 'fiber', 'saturatedFat']);

type Micros = Record<string, number>;

/** Adults 19–50 (Institute of Medicine DRIs; potassium from the 2019 update). */
const ADULT: Record<Sex, Micros> = {
  male: {
    vitaminA: 900,
    vitaminB1: 1.2,
    vitaminB2: 1.3,
    vitaminB3: 16,
    vitaminB6: 1.3,
    vitaminB12: 2.4,
    folate: 400,
    vitaminC: 90,
    vitaminD: 15,
    vitaminE: 15,
    vitaminK: 120,
    calcium: 1000,
    iron: 8,
    magnesium: 420,
    phosphorus: 700,
    potassium: 3400,
    zinc: 11,
  },
  female: {
    vitaminA: 700,
    vitaminB1: 1.1,
    vitaminB2: 1.1,
    vitaminB3: 14,
    vitaminB6: 1.3,
    vitaminB12: 2.4,
    folate: 400,
    vitaminC: 75,
    vitaminD: 15,
    vitaminE: 15,
    vitaminK: 90,
    calcium: 1000,
    iron: 18,
    magnesium: 320,
    phosphorus: 700,
    potassium: 2600,
    zinc: 8,
  },
};

/** Where other ages differ from adults 19–50. Under 19 uses the 14–18 values. */
function microsFor(sex: Sex, age: number | null): Micros {
  const base = ADULT[sex];
  const male = sex === 'male';
  if (age && age < 19) {
    const teen = { vitaminK: 75, calcium: 1300, phosphorus: 1250 };
    return male
      ? { ...base, ...teen, vitaminC: 75, iron: 11, magnesium: 410, potassium: 3000 }
      : {
          ...base,
          ...teen,
          vitaminB1: 1.0,
          vitaminB2: 1.0,
          vitaminB6: 1.2,
          vitaminC: 65,
          iron: 15,
          magnesium: 360,
          potassium: 2300,
          zinc: 9,
        };
  }
  if (age && age <= 30) return { ...base, magnesium: male ? 400 : 310 };
  if (age && age >= 51) {
    return {
      ...base,
      vitaminB6: male ? 1.7 : 1.5,
      ...(male ? {} : { iron: 8 }),
      calcium: !male || age >= 71 ? 1200 : 1000,
      vitaminD: age >= 71 ? 20 : 15,
    };
  }
  return base;
}

/**
 * Body weight to base protein on. For an obese BMI it's the top of the healthy range, so the
 * target tracks lean mass rather than climbing with body fat.
 */
function proteinWeight(weightKg: number, heightCm: number) {
  return bmi(weightKg, heightCm) >= 30 ? healthyWeightRange(heightCm).max : weightKg;
}

/**
 * Daily targets by nutrient key. Macros, fiber and the ceilings scaled to calories are only
 * there when the calorie goal is known (sex, age, height and weight are set).
 */
export function dailyTargets({
  calories,
  measurements,
  sex,
}: {
  calories?: number;
  measurements?: Partial<Measurements>;
  sex?: Sex;
}) {
  const targets: Record<string, Target> = {};

  for (const [key, info] of Object.entries(NUTRIENT_INFO)) {
    if (info.daily && !CALORIE_BASED.has(key)) {
      targets[key] = { amount: info.daily, limit: info.limit };
    }
  }
  if (sex) {
    for (const [key, amount] of Object.entries(microsFor(sex, measurements?.age ?? null))) {
      targets[key] = { amount };
    }
  }

  const { weightKg, heightCm, goal } = measurements ?? {};
  if (calories && weightKg && heightCm) {
    const perKg = goal ? PROTEIN_PER_KG[goal] : PROTEIN_PER_KG_DEFAULT;
    const protein = Math.round(proteinWeight(weightKg, heightCm) * perKg);
    const fat = Math.round((calories * FAT_SHARE) / 9);
    const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
    targets.calories = { amount: calories };
    targets.protein = { amount: protein };
    targets.carbs = { amount: carbs };
    targets.fat = { amount: fat };
    // 14 g per 1,000 kcal; WHO's under-10%-of-calories ceilings for sugar and saturated fat
    targets.fiber = { amount: Math.round((calories / 1000) * 14) };
    targets.sugar = { amount: Math.round((calories * 0.1) / 4), limit: true };
    targets.saturatedFat = { amount: Math.round((calories * 0.1) / 9), limit: true };
  }
  return targets;
}

/** What's left to reach a target, or how far over a ceiling (or past a target) it is. */
export function remaining(eaten: number, { amount }: Target) {
  const left = amount - eaten;
  return { left: Math.max(0, left), over: Math.max(0, -left), share: amount ? eaten / amount : 0 };
}
