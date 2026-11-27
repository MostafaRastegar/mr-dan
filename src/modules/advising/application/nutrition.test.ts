import { describe, expect, it } from "vitest";

import { createNutritionLeisureFakes } from "../../../../test/fakes/nutrition-leisure";
import {
  GetNutritionOverviewUseCase,
  SaveMealPlanUseCase,
  UpdatePhysicalProfileUseCase,
} from "@/modules/advising/application/nutrition";
import type { Actor } from "@/modules/advising/application/planning-access";
import type {
  CompletePhysicalProfile,
  PhysicalProfile,
} from "@/modules/advising/domain/energy";

const counselor: Actor = { id: "c1", role: "counselor" };
const otherCounselor: Actor = { id: "c2", role: "counselor" };
const student: Actor = { id: "s1", role: "student" };
const otherStudent: Actor = { id: "s2", role: "student" };

const maintainProfile: CompletePhysicalProfile = {
  age: 17,
  gender: "male",
  heightCm: 180,
  weightKg: 70,
  activityLevel: "moderate",
  dietGoal: "maintain",
};

const loseProfile: CompletePhysicalProfile = {
  ...maintainProfile,
  dietGoal: "lose",
};

function fiveOfSix(): PhysicalProfile {
  return { ...maintainProfile, dietGoal: null };
}

async function seedUser(
  users: ReturnType<typeof createNutritionLeisureFakes>["users"],
  id: string,
  role: "student" | "counselor",
  counselorId: string | null = null,
): Promise<void> {
  await users.create({
    id,
    username: id,
    email: null,
    role,
    fullName: id,
    grade: null,
    fieldOfStudy: null,
    schoolName: null,
    groupId: null,
    counselorId,
    passwordHash: "x",
  });
}

function seedPeople(fakes: ReturnType<typeof createNutritionLeisureFakes>): Promise<void[]> {
  return Promise.all([
    seedUser(fakes.users, counselor.id, "counselor"),
    seedUser(fakes.users, otherCounselor.id, "counselor"),
    seedUser(fakes.users, student.id, "student", counselor.id),
    seedUser(fakes.users, otherStudent.id, "student", otherCounselor.id),
  ]);
}

describe("nutrition use cases", () => {
  it("physical profile ownership", async () => {
    const fakes = createNutritionLeisureFakes();
    await seedPeople(fakes);
    fakes.users.seedPhysicalProfile(student.id, maintainProfile);

    const update = new UpdatePhysicalProfileUseCase(fakes.users);
    const save = new SaveMealPlanUseCase(fakes.users, fakes.mealPlans);
    const overview = new GetNutritionOverviewUseCase(fakes.users, fakes.mealPlans);

    // A counselor cannot write another user's profile, even their own student.
    await expect(
      update.execute({ actor: counselor, studentId: student.id, patch: maintainProfile }),
    ).rejects.toMatchObject({ code: "forbidden" });
    expect(fakes.users.physicalWrites).toBe(0);

    // A counselor cannot save a meal plan for their own student.
    await expect(
      save.execute({ actor: counselor, studentId: student.id }),
    ).rejects.toMatchObject({ code: "forbidden" });
    expect(fakes.mealPlans.writes).toBe(0);

    // A counselor cannot write their own physical profile either: nutrition is
    // a student self-feature.
    await expect(
      update.execute({ actor: counselor, patch: maintainProfile }),
    ).rejects.toMatchObject({ code: "forbidden" });
    expect(fakes.users.physicalWrites).toBe(0);

    // A counselor can read their own student's profile.
    const read = await overview.execute({ actor: counselor, studentId: student.id });
    expect(read.profile.weightKg).toBe(70);

    // A stranger (another counselor) cannot read that student.
    await expect(
      overview.execute({ actor: otherCounselor, studentId: student.id }),
    ).rejects.toMatchObject({ code: "forbidden" });

    // Another student cannot read them either.
    await expect(
      overview.execute({ actor: otherStudent, studentId: student.id }),
    ).rejects.toMatchObject({ code: "forbidden" });
  });

  it("profile incomplete", async () => {
    const fakes = createNutritionLeisureFakes();
    await seedPeople(fakes);
    fakes.users.seedPhysicalProfile(student.id, fiveOfSix());

    const save = new SaveMealPlanUseCase(fakes.users, fakes.mealPlans);
    await expect(save.execute({ actor: student })).rejects.toMatchObject({
      code: "profile_incomplete",
    });
    expect(fakes.mealPlans.writes).toBe(0);

    const overview = new GetNutritionOverviewUseCase(fakes.users, fakes.mealPlans);
    const read = await overview.execute({ actor: student });
    expect(read.energy).toBeNull();
    expect(read.profile.dietGoal).toBeNull();
  });

  it("meal plan upsert", async () => {
    const fakes = createNutritionLeisureFakes();
    await seedPeople(fakes);
    fakes.users.seedPhysicalProfile(student.id, maintainProfile);

    const save = new SaveMealPlanUseCase(fakes.users, fakes.mealPlans);
    const update = new UpdatePhysicalProfileUseCase(fakes.users);
    const day1 = new Date("2026-11-23T10:00:00Z");

    const first = await save.execute({ actor: student, now: day1 });
    expect(first.targetCalories).toBe(2705);
    expect(first.meals.reduce((sum, meal) => sum + meal.calories, 0)).toBe(2705);

    // Same day, changed goal: one row, latest value wins.
    await update.execute({ actor: student, patch: loseProfile });
    const second = await save.execute({ actor: student, now: day1 });
    expect(second.targetCalories).toBe(2299);
    expect(fakes.mealPlans.count()).toBe(1);

    // Next day: a second row.
    const day2 = new Date("2026-11-24T10:00:00Z");
    const nextDay = await save.execute({ actor: student, now: day2 });
    expect(nextDay.dayKey).toBe("2026-11-24");
    expect(fakes.mealPlans.count()).toBe(2);
    expect(fakes.mealPlans.writes).toBe(3);
  });
});
