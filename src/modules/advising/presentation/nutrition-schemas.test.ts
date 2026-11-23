import { describe, expect, it } from "vitest";

import { physicalProfileSchema } from "./nutrition-schemas";

const valid = {
  age: 17,
  gender: "male",
  heightCm: 180,
  weightKg: 70,
  activityLevel: "moderate",
  dietGoal: "maintain",
};

function parse(overrides: Record<string, unknown>) {
  return physicalProfileSchema.safeParse({ ...valid, ...overrides });
}

describe("physicalProfileSchema", () => {
  it("physical field bounds", () => {
    const bounds: [string, number[]][] = [
      ["age", [9, 101]],
      ["heightCm", [99, 251]],
      ["weightKg", [29, 301]],
    ];

    for (const [field, values] of bounds) {
      for (const value of values) {
        const result = parse({ [field]: value });
        expect(result.success).toBe(false);
        if (!result.success) {
          const issues = result.error.issues.filter((issue) => issue.path[0] === field);
          expect(issues.length).toBeGreaterThan(0);
          for (const issue of issues) {
            expect(issue.message.length).toBeGreaterThan(0);
          }
        }
      }
    }

    const enums: [string, string][] = [
      ["gender", "other"],
      ["activityLevel", "extreme"],
      ["dietGoal", "bulk"],
    ];

    for (const [field, value] of enums) {
      const result = parse({ [field]: value });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path[0] === field)).toBe(true);
      }
    }

    // Boundary values are accepted.
    expect(parse({ age: 10, heightCm: 100, weightKg: 30 }).success).toBe(true);
    expect(parse({ age: 100, heightCm: 250, weightKg: 300 }).success).toBe(true);
  });
});
