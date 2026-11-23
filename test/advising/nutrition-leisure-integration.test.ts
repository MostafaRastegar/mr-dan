/**
 * Nutrition integration tests against real Postgres.
 *
 * Skips every case when Postgres is unreachable so CI stays green without
 * docker. Rows created here are namespaced by `RUN` and removed afterwards.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/shared/prisma";
import { PrismaMealPlanRepository } from "@/modules/advising/infrastructure/prisma-meal-plan-repository";
import { PrismaUserRepository } from "@/modules/advising/infrastructure/prisma-user-repository";
import { mealDistribution } from "@/modules/advising/domain/energy";
import type {
  CompletePhysicalProfile,
  NewUser,
  PhysicalProfile,
} from "@/modules/advising/domain/models";

const users = new PrismaUserRepository();
const mealPlans = new PrismaMealPlanRepository();

const RUN = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const PASSWORD_HASH = `scrypt$16384$8$1$${"a".repeat(22)}$${"b".repeat(64)}`;
const createdUsernames: string[] = [];

const EMPTY_PROFILE: PhysicalProfile = {
  age: null,
  gender: null,
  heightCm: null,
  weightKg: null,
  activityLevel: null,
  dietGoal: null,
};

let live = false;

beforeAll(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    live = true;
  } catch {
    live = false;
  }
});

afterAll(async () => {
  if (live && createdUsernames.length > 0) {
    await prisma.user.deleteMany({ where: { username: { in: createdUsernames } } });
  }
  await prisma.$disconnect();
});

function student(label: string): NewUser & { passwordHash: string } {
  const username = `it-${label}-${RUN}`;
  createdUsernames.push(username);
  return {
    username,
    email: null,
    role: "student",
    fullName: `تست ${label}`,
    grade: null,
    fieldOfStudy: null,
    schoolName: null,
    groupId: null,
    counselorId: null,
    passwordHash: PASSWORD_HASH,
  };
}

describe("nutrition integration (real Postgres)", () => {
  it("meal plan unique per day", async () => {
    if (!live) return;

    const user = await users.create(student("meal-plan"));
    const day1 = "2026-11-23";
    const day2 = "2026-11-24";

    await mealPlans.upsert({
      studentId: user.id,
      dayKey: day1,
      targetCalories: 2705,
      meals: mealDistribution(2705),
    });
    await mealPlans.upsert({
      studentId: user.id,
      dayKey: day1,
      targetCalories: 2000,
      meals: mealDistribution(2000),
    });

    expect(
      await prisma.mealPlan.count({ where: { studentId: user.id } }),
    ).toBe(1);

    const sameDay = await mealPlans.findByDay(user.id, day1);
    expect(sameDay?.targetCalories).toBe(2000);
    expect(sameDay?.meals).toHaveLength(4);
    expect(sameDay?.meals.reduce((sum, meal) => sum + meal.calories, 0)).toBe(2000);

    await mealPlans.upsert({
      studentId: user.id,
      dayKey: day2,
      targetCalories: 1200,
      meals: mealDistribution(1200),
    });
    expect(
      await prisma.mealPlan.count({ where: { studentId: user.id } }),
    ).toBe(2);

    await prisma.user.delete({ where: { id: user.id } });
    expect(
      await prisma.mealPlan.count({ where: { studentId: user.id } }),
    ).toBe(0);
  });

  it("physical profile columns", async () => {
    if (!live) return;

    const user = await users.create(student("physical"));
    expect(await users.findPhysicalProfile(user.id)).toEqual(EMPTY_PROFILE);

    const profile: CompletePhysicalProfile = {
      age: 17,
      gender: "male",
      heightCm: 180,
      weightKg: 70,
      activityLevel: "moderate",
      dietGoal: "maintain",
    };
    const updated = await users.updatePhysicalProfile(user.id, profile);
    expect(updated).toEqual(profile);
    expect(await users.findPhysicalProfile(user.id)).toEqual(profile);

    const other = await users.create(student("physical-other"));
    expect(await users.findPhysicalProfile(other.id)).toEqual(EMPTY_PROFILE);
  });
});
