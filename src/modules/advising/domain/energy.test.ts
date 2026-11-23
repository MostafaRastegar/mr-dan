import { describe, expect, it } from "vitest";

import {
  computeEnergy,
  isPhysicalProfileComplete,
  mealDistribution,
  type CompletePhysicalProfile,
  type PhysicalProfile,
} from "./energy";

const CASES: {
  input: CompletePhysicalProfile;
  expected: { bmr: number; tdee: number; targetCalories: number };
}[] = [
  {
    input: {
      age: 17,
      gender: "male",
      heightCm: 180,
      weightKg: 70,
      activityLevel: "moderate",
      dietGoal: "maintain",
    },
    expected: { bmr: 1745, tdee: 2705, targetCalories: 2705 },
  },
  {
    input: {
      age: 17,
      gender: "female",
      heightCm: 165,
      weightKg: 55,
      activityLevel: "sedentary",
      dietGoal: "lose",
    },
    expected: { bmr: 1335, tdee: 1602, targetCalories: 1362 },
  },
  {
    input: {
      age: 40,
      gender: "female",
      heightCm: 150,
      weightKg: 40,
      activityLevel: "sedentary",
      dietGoal: "lose",
    },
    expected: { bmr: 977, tdee: 1172, targetCalories: 1200 },
  },
  {
    input: {
      age: 20,
      gender: "male",
      heightCm: 175,
      weightKg: 60,
      activityLevel: "light",
      dietGoal: "gain",
    },
    expected: { bmr: 1599, tdee: 2198, targetCalories: 2418 },
  },
];

describe("computeEnergy", () => {
  it("mifflin st jeor", () => {
    for (const { input, expected } of CASES) {
      expect(computeEnergy(input)).toEqual(expected);
    }
  });

  it("diet goal", () => {
    const lose = computeEnergy(CASES[1]!.input);
    expect(lose.tdee).toBe(1602);
    expect(lose.targetCalories).toBe(1362);

    const gain = computeEnergy(CASES[3]!.input);
    expect(gain.tdee).toBe(2198);
    expect(gain.targetCalories).toBe(2418);
  });

  it("energy floor", () => {
    const floor = computeEnergy(CASES[2]!.input);
    expect(floor.targetCalories).toBe(1200);
    expect(floor.targetCalories).toBeGreaterThanOrEqual(1200);
  });
});

describe("isPhysicalProfileComplete", () => {
  it("incomplete physical profile", () => {
    const complete: CompletePhysicalProfile = CASES[0]!.input;
    expect(isPhysicalProfileComplete(complete)).toBe(true);

    const fields = Object.keys(complete) as (keyof CompletePhysicalProfile)[];
    for (const field of fields) {
      const partial: PhysicalProfile = { ...complete, [field]: null };
      expect(isPhysicalProfileComplete(partial)).toBe(false);
    }

    const empty: PhysicalProfile = {
      age: null,
      gender: null,
      heightCm: null,
      weightKg: null,
      activityLevel: null,
      dietGoal: null,
    };
    expect(isPhysicalProfileComplete(empty)).toBe(false);
  });
});

describe("mealDistribution", () => {
  it("meal distribution", () => {
    const big = mealDistribution(2705);
    expect(big.map((meal) => meal.calories)).toEqual([676, 947, 812, 270]);
    expect(big.reduce((sum, meal) => sum + meal.calories, 0)).toBe(2705);

    const floor = mealDistribution(1200);
    expect(floor.map((meal) => meal.calories)).toEqual([300, 420, 360, 120]);
    expect(floor.reduce((sum, meal) => sum + meal.calories, 0)).toBe(1200);

    expect(big.map((meal) => meal.slot)).toEqual(["breakfast", "lunch", "dinner", "snack"]);
  });
});
