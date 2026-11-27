/**
 * Dashboard read model against in-memory fakes. No database, no clock:
 * `now` is passed explicitly so every assertion is deterministic.
 */

import { describe, expect, it } from "vitest";

import { FakeUserRepository } from "../../../../test/fakes/advising";
import { FakeHomeworkRepository } from "../../../../test/fakes/planning";
import { FakeWeeklyGoalRepository } from "../../../../test/fakes/weekly-goal";
import {
  FakeCatalogRepository,
  FakeSchoolProgramRepository,
  FakeStudyPlanRepository,
} from "../../../../test/fakes/advisor-program";
import {
  createPlanningStore,
  FakeFreeTimeBudgetRepository,
  FakeHomeworkPlanRepository,
} from "../../../../test/fakes/planning";
import { FakeMealPlanRepository } from "../../../../test/fakes/nutrition-leisure";
import { GetDashboardOverviewUseCase } from "./dashboard";
import type { NewUser } from "@/modules/advising/domain/models";
import {
  iranDayKey,
  persianDayOf,
  shiftDayKey,
  weekStartKey,
} from "@/modules/advising/domain/day-key";

const NOW = new Date("2026-11-23T09:30:00Z"); // 2026-11-23 Iran (03:30)
const TODAY_KEY = iranDayKey(NOW);
const TOMORROW_KEY = shiftDayKey(TODAY_KEY, 1);
const WEEK_KEY = weekStartKey(TODAY_KEY);
const DAY_OF_WEEK = persianDayOf(TODAY_KEY);
const TODAY = new Date(`${TODAY_KEY}T10:00:00+03:30`);
const TOMORROW = new Date(`${TOMORROW_KEY}T10:00:00+03:30`);

function fakes() {
  const state = {
    groupNames: new Map<string, string>(),
    groupCounts: new Map<string, number>(),
  };
  const store = createPlanningStore();
  const users = new FakeUserRepository(state);
  const schoolProgram = new FakeSchoolProgramRepository();
  const homework = new FakeHomeworkRepository();
  const goals = new FakeWeeklyGoalRepository();
  const plans = new FakeStudyPlanRepository();
  const budgets = new FakeFreeTimeBudgetRepository(store);
  const homeworkPlans = new FakeHomeworkPlanRepository(store);
  const mealPlans = new FakeMealPlanRepository();
  const catalogs = new FakeCatalogRepository();
  catalogs.seed([], [], {
    books: [
      {
        id: "book-1",
        slug: "how-to-solve-it",
        title: "چگونه مسئله حل کنیم",
        author: "جورج پولیا",
        fieldLabel: null,
        codes: [
          "critical_fatigue",
          "heavy_workload",
          "overloaded_week",
          "balanced",
          "low_activity",
        ],
        active: true,
        sortOrder: 1,
      },
    ],
  });
  return {
    users,
    schoolProgram,
    homework,
    goals,
    plans,
    budgets,
    homeworkPlans,
    mealPlans,
    catalogs,
  };
}

async function build(overrides: {
  user?: Partial<NewUser>;
  sleepMinutes?: number;
  wakeMinutes?: number;
  schoolProgramToday?: { minutes: number; subject: string }[];
  homeworkToday?: number;
  homeworkTomorrow?: number;
  goalTestsDone?: number;
  goalBlocks?: string[];
  planEntries?: { minutes: number }[];
  planTestsTarget?: number;
  budgetToday?: number;
  mealPlanCalories?: number;
  physicalProfile?: boolean;
}) {
  const s = fakes();
  const user = await s.users.create({
    username: `u-${Math.random().toString(36).slice(2)}`,
    passwordHash: "x",
    email: null,
    role: "student",
    fullName: "سارا احمدی",
    grade: null,
    fieldOfStudy: null,
    schoolName: null,
    groupId: null,
    counselorId: null,
    ...overrides.user,
  });
  const userId = user.id;

  if (overrides.sleepMinutes !== undefined || overrides.wakeMinutes !== undefined) {
    await s.users.updateProfile(userId, {
      sleepMinutes: overrides.sleepMinutes ?? null,
      wakeMinutes: overrides.wakeMinutes ?? null,
    });
  }

  if (overrides.physicalProfile) {
    await s.users.updatePhysicalProfile(userId, {
      age: 17,
      gender: "male",
      heightCm: 180,
      weightKg: 70,
      activityLevel: "moderate",
      dietGoal: "maintain",
    });
  }

  for (const entry of overrides.schoolProgramToday ?? []) {
    await s.schoolProgram.create({
      studentId: userId,
      dayOfWeek: DAY_OF_WEEK,
      subject: entry.subject,
      minutes: entry.minutes,
    });
  }

  for (let i = 0; i < (overrides.homeworkToday ?? 0); i++) {
    await s.homework.create({
      studentId: userId,
      title: `تکلیف امروز ${i}`,
      subject: "riazi",
      priority: 3,
      deadline: TODAY,
    });
  }
  for (let i = 0; i < (overrides.homeworkTomorrow ?? 0); i++) {
    await s.homework.create({
      studentId: userId,
      title: `تکلیف فردا ${i}`,
      subject: "fizik",
      priority: 2,
      deadline: TOMORROW,
    });
  }

  if (overrides.goalTestsDone !== undefined || overrides.goalBlocks?.length) {
    s.goals.seed({
      id: "g-1",
      studentId: userId,
      weekKey: WEEK_KEY,
      testsDone: overrides.goalTestsDone ?? 0,
      completedBlocks: overrides.goalBlocks ?? [],
      createdAt: NOW,
      updatedAt: NOW,
    });
  }

  if (overrides.planEntries?.length || overrides.planTestsTarget !== undefined) {
    s.plans.seed([
      {
        id: "p-1",
        studentId: userId,
        counselorId: userId,
        testsTarget: overrides.planTestsTarget ?? 0,
        entries: (overrides.planEntries ?? []).map((e, i) => ({
          id: `e-${i}`,
          studentId: userId,
          dayOfWeek: DAY_OF_WEEK,
          subject: "riazi",
          minutes: e.minutes,
          testsTarget: 0,
          chapterIds: [],
          note: null,
          createdAt: NOW,
          updatedAt: NOW,
        })),
        createdAt: NOW,
        updatedAt: NOW,
      },
    ]);
  }

  if (overrides.budgetToday !== undefined) {
    s.budgets.seed(userId, TODAY_KEY, overrides.budgetToday);
  }

  if (overrides.mealPlanCalories !== undefined) {
    await s.mealPlans.upsert({
      studentId: userId,
      dayKey: TODAY_KEY,
      targetCalories: overrides.mealPlanCalories,
      meals: [],
    });
  }

  return {
    userId,
    useCase: new GetDashboardOverviewUseCase(
      s.users,
      s.homework,
      s.schoolProgram,
      s.goals,
      s.plans,
      s.budgets,
      s.homeworkPlans,
      s.mealPlans,
      s.catalogs,
    ),
  };
}

describe("GetDashboardOverviewUseCase", () => {
  it("aggregates every card from the database", async () => {
    const { userId, useCase } = await build({
      sleepMinutes: 1380,
      wakeMinutes: 390,
      schoolProgramToday: [
        { minutes: 60, subject: "riazi" },
        { minutes: 80, subject: "fizik" },
      ],
      homeworkToday: 1,
      homeworkTomorrow: 1,
      goalTestsDone: 5,
      goalBlocks: [`${TODAY_KEY}:e-0`],
      planEntries: [{ minutes: 60 }, { minutes: 90 }],
      planTestsTarget: 40,
      mealPlanCalories: 2200,
      physicalProfile: true,
    });

    const overview = await useCase.execute({ actor: { id: userId, role: "student" }, now: NOW });

    expect(overview.greetingName).toBe("سارا احمدی");
    expect(overview.todayKey).toBe(TODAY_KEY);
    expect(overview.profile).toEqual({ fullName: "سارا احمدی", role: "student" });
    expect(overview.homework.today).toHaveLength(1);
    expect(overview.homework.tomorrow).toHaveLength(1);
    expect(overview.homework.today[0].studentId).toBe(userId);
    // One tickable block per counselor plan entry for today.
    expect(overview.blocks).toHaveLength(2);
    expect(overview.blocks.map((b) => b.entryId)).toEqual(["e-0", "e-1"]);
    expect(overview.blocks.every((b) => b.dayKey === TODAY_KEY)).toBe(true);
    expect(overview.freeMinutes).toBe(990 - 140 - 0 - 0);
    expect(overview.freeTimeBreakdown).toEqual({
      wakingMinutes: 990,
      schoolMinutes: 140,
      otherOccupiedMinutes: 0,
      homeworkAverageMinutes: 0,
    });
    expect(overview.goal).toEqual({
      studiedMinutes: 60,
      studyMinutesTarget: 150,
      testsTarget: 40,
      testsDone: 5,
      completedBlocks: [`${TODAY_KEY}:e-0`],
      testsBySubject: {},
      subjects: ["riazi"],
      testsTargetBySubject: { riazi: 0 },
    });
    expect(overview.needLabel).toBe("نیاز به 90 دقیقه مطالعه بیشتر برای رسیدن به هدف هفته");
    expect(overview.meal.plan).not.toBeNull();
    expect(overview.meal.targetCalories).toBe(2705);
    expect(overview.meal.hasPhysicalProfile).toBe(true);
    expect(typeof overview.book).toBe("string");
    expect(overview.book!.length).toBeGreaterThan(0);
  });

  it("shows zeros and the no-plan label when nothing exists yet", async () => {
    const { userId, useCase } = await build({ sleepMinutes: 1380, wakeMinutes: 390 });

    const overview = await useCase.execute({ actor: { id: userId, role: "student" }, now: NOW });

    expect(overview.homework.today).toEqual([]);
    expect(overview.homework.tomorrow).toEqual([]);
    expect(overview.blocks).toEqual([]);
    expect(overview.freeMinutes).toBe(990);
    expect(overview.goal).toEqual({
      studiedMinutes: 0,
      studyMinutesTarget: 0,
      testsTarget: 0,
      testsDone: 0,
      completedBlocks: [],
      testsBySubject: {},
      subjects: [],
      testsTargetBySubject: {},
    });
    expect(overview.needLabel).toBe("برنامهٔ مشاور ثبت نشده است");
    expect(overview.meal.plan).toBeNull();
    expect(overview.meal.targetCalories).toBeNull();
    expect(overview.meal.hasPhysicalProfile).toBe(false);
  });

  it("has no study targets when there is a goal but no plan", async () => {
    const { userId, useCase } = await build({
      sleepMinutes: 1380,
      wakeMinutes: 390,
      goalTestsDone: 3,
      goalBlocks: [],
    });

    const overview = await useCase.execute({ actor: { id: userId, role: "student" }, now: NOW });

    expect(overview.goal?.studyMinutesTarget).toBe(0);
    expect(overview.goal?.testsTarget).toBe(0);
    expect(overview.goal?.testsDone).toBe(3);
  });

  it("throws when the session user does not exist", async () => {
    const { useCase } = await build({});
    await expect(
      useCase.execute({ actor: { id: "missing", role: "student" }, now: NOW }),
    ).rejects.toThrow();
  });
});
