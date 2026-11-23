/**
 * Mifflin-St Jeor energy estimates and the meal split.
 *
 * Pure domain: no external imports. Each figure is rounded from its own
 * unrounded value (no compounded rounding) and only `targetCalories` is
 * floored (D-2). A partial profile never produces a number (D-3).
 */

export const GENDERS = ["male", "female"] as const;
export const ACTIVITY_LEVELS = ["sedentary", "light", "moderate", "active", "very_active"] as const;
export const DIET_GOALS = ["lose", "maintain", "gain"] as const;

export type Gender = (typeof GENDERS)[number];
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];
export type DietGoal = (typeof DIET_GOALS)[number];

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const DIET_GOAL_MULTIPLIERS: Record<DietGoal, number> = {
  lose: 0.85,
  maintain: 1,
  gain: 1.1,
};

export const MIN_TARGET_CALORIES = 1200;

export const AGE_RANGE = { min: 10, max: 100 } as const;
export const HEIGHT_RANGE = { min: 100, max: 250 } as const;
export const WEIGHT_RANGE = { min: 30, max: 300 } as const;

export interface PhysicalProfile {
  age: number | null;
  gender: Gender | null;
  heightCm: number | null;
  weightKg: number | null;
  activityLevel: ActivityLevel | null;
  dietGoal: DietGoal | null;
}

export interface CompletePhysicalProfile {
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  dietGoal: DietGoal;
}

/** The form always submits all six; there is no partial patch path. */
export type PhysicalProfilePatch = CompletePhysicalProfile;

export function isPhysicalProfileComplete(
  profile: PhysicalProfile,
): profile is CompletePhysicalProfile {
  return (
    profile.age !== null &&
    profile.gender !== null &&
    profile.heightCm !== null &&
    profile.weightKg !== null &&
    profile.activityLevel !== null &&
    profile.dietGoal !== null
  );
}

/** Mifflin-St Jeor, unrounded. */
export function bmrOf(input: CompletePhysicalProfile): number {
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age;
  return base + (input.gender === "male" ? 5 : -161);
}

export function computeEnergy(input: CompletePhysicalProfile): {
  bmr: number;
  tdee: number;
  targetCalories: number;
} {
  const bmrRaw = bmrOf(input);
  const tdeeRaw = bmrRaw * ACTIVITY_MULTIPLIERS[input.activityLevel];
  const targetRaw = tdeeRaw * DIET_GOAL_MULTIPLIERS[input.dietGoal];

  return {
    bmr: Math.round(bmrRaw),
    tdee: Math.round(tdeeRaw),
    targetCalories: Math.max(MIN_TARGET_CALORIES, Math.round(targetRaw)),
  };
}

export const MEAL_SLOTS = ["breakfast", "lunch", "dinner", "snack"] as const;

export type MealSlot = (typeof MEAL_SLOTS)[number];

/**
 * 25/35/30 percent for breakfast/lunch/dinner; the remainder goes to the
 * snack so the four values always sum exactly to `targetCalories`.
 */
export function mealDistribution(targetCalories: number): {
  slot: MealSlot;
  label: string;
  calories: number;
}[] {
  const breakfast = Math.round((targetCalories * 25) / 100);
  const lunch = Math.round((targetCalories * 35) / 100);
  const dinner = Math.round((targetCalories * 30) / 100);
  const snack = targetCalories - breakfast - lunch - dinner;

  return [
    { slot: "breakfast", label: "صبحانه", calories: breakfast },
    { slot: "lunch", label: "ناهار", calories: lunch },
    { slot: "dinner", label: "شام", calories: dinner },
    { slot: "snack", label: "میان‌وعده", calories: snack },
  ];
}
