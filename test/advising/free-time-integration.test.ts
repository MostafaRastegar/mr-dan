/**
 * Free-time budget + homework plan integration tests against real Postgres.
 *
 * Exercises both adapters' Serializable transactions with the real domain
 * `allows` callbacks. Skips every case when Postgres is unreachable so CI stays
 * green without docker. Rows created here are namespaced by `RUN` and removed
 * afterwards.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/shared/prisma";
import { dayCapacity, fitsCapacity } from "@/modules/advising/domain/free-time";
import { PrismaFreeTimeBudgetRepository } from "@/modules/advising/infrastructure/prisma-free-time-budget-repository";
import { PrismaHomeworkPlanRepository } from "@/modules/advising/infrastructure/prisma-homework-plan-repository";
import { PrismaHomeworkRepository } from "@/modules/advising/infrastructure/prisma-homework-repository";
import { PrismaUserRepository } from "@/modules/advising/infrastructure/prisma-user-repository";
import type { NewUser } from "@/modules/advising/domain/models";

const users = new PrismaUserRepository();
const homework = new PrismaHomeworkRepository();
const budgets = new PrismaFreeTimeBudgetRepository();
const plans = new PrismaHomeworkPlanRepository();

const RUN = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const PASSWORD_HASH = `scrypt$16384$8$1$${"a".repeat(22)}$${"b".repeat(64)}`;
const createdUsernames: string[] = [];

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

function pendingHomework(userId: string, title: string, deadline: Date) {
  return homework.create({
    studentId: userId,
    title,
    subject: null,
    priority: 2,
    deadline,
  });
}

describe("free-time integration (real Postgres)", () => {
  it("plan over capacity writes nothing", async () => {
    if (!live) return;

    const user = await users.create(student("plan-over"));
    const dayKey = "2026-12-05";
    await budgets.upsertWithinUsed({
      studentId: user.id,
      dayKey,
      freeMinutes: 60,
      allows: () => true,
    });
    const task = await pendingHomework(user.id, "تکلیف", new Date("2026-12-05T20:30:00Z"));

    const result = await plans.upsertWithinCapacity({
      studentId: user.id,
      homeworkId: task.id,
      dayKey,
      plannedMinutes: 90,
      allows: ({ freeMinutes, usedMinutes }) =>
        fitsCapacity(dayCapacity(freeMinutes, usedMinutes), 90),
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected a capacity rejection");
    expect(result.freeMinutes).toBe(60);
    expect(
      await prisma.homeworkPlanEntry.count({ where: { studentId: user.id, dayKey } }),
    ).toBe(0);
  });

  it("concurrent plan writes keep the invariant", async () => {
    if (!live) return;

    const user = await users.create(student("plan-concurrent"));
    const dayKey = "2026-12-06";
    // 30 free minutes and two 30-minute plans: a serial order admits only the
    // first write, so a concurrent pair must be broken by the Serializable
    // transaction. With 60 minutes both plans fit in every serial order and
    // PostgreSQL legitimately commits both.
    await budgets.upsertWithinUsed({
      studentId: user.id,
      dayKey,
      freeMinutes: 30,
      allows: () => true,
    });
    const first = await pendingHomework(user.id, "اول", new Date("2026-12-06T20:30:00Z"));
    const second = await pendingHomework(user.id, "دوم", new Date("2026-12-06T20:30:00Z"));

    const fire = (homeworkId: string) =>
      plans.upsertWithinCapacity({
        studentId: user.id,
        homeworkId,
        dayKey,
        plannedMinutes: 30,
        allows: ({ freeMinutes, usedMinutes }) =>
          fitsCapacity(dayCapacity(freeMinutes, usedMinutes), 30),
      });

    const outcomes = await Promise.allSettled([fire(first.id), fire(second.id)]);
    const wins = outcomes.filter(
      (outcome) => outcome.status === "fulfilled" && outcome.value.ok,
    );
    expect(wins).toHaveLength(1);

    const loser = outcomes.find((outcome) => outcome !== wins[0]);
    if (!loser) throw new Error("expected exactly two outcomes");
    if (loser.status === "rejected") {
      expect(loser.reason).toMatchObject({ code: "plan_concurrent_write" });
    } else {
      expect(loser.value.ok).toBe(false);
    }

    const [sum] = await prisma.$queryRaw<{ total: bigint }[]>`
      SELECT COALESCE(SUM("plannedMinutes"), 0) AS total
      FROM "HomeworkPlanEntry"
      WHERE "studentId" = ${user.id} AND "dayKey" = ${dayKey}
    `;
    const planned = Number(sum.total);
    expect(planned).toBeLessThanOrEqual(60);
    expect(planned).toBe(30);
    expect(
      await prisma.homeworkPlanEntry.count({ where: { studentId: user.id, dayKey } }),
    ).toBe(1);

    // DB-level proof that no plan row can outlive its budget row.
    await prisma.freeTimeBudget.delete({
      where: { studentId_dayKey: { studentId: user.id, dayKey } },
    });
    expect(
      await prisma.homeworkPlanEntry.count({ where: { studentId: user.id, dayKey } }),
    ).toBe(0);
  });

  it("budget shrink below planned writes nothing", async () => {
    if (!live) return;

    const user = await users.create(student("budget-shrink"));
    const dayKey = "2026-12-07";
    await budgets.upsertWithinUsed({
      studentId: user.id,
      dayKey,
      freeMinutes: 120,
      allows: () => true,
    });
    const task = await pendingHomework(user.id, "تکلیف", new Date("2026-12-07T20:30:00Z"));
    const seeded = await plans.upsertWithinCapacity({
      studentId: user.id,
      homeworkId: task.id,
      dayKey,
      plannedMinutes: 90,
      allows: ({ freeMinutes, usedMinutes }) =>
        fitsCapacity(dayCapacity(freeMinutes, usedMinutes), 90),
    });
    expect(seeded.ok).toBe(true);

    const result = await budgets.upsertWithinUsed({
      studentId: user.id,
      dayKey,
      freeMinutes: 60,
      allows: (usedMinutes) => usedMinutes <= 60,
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected a below-planned rejection");
    expect(result.usedMinutes).toBe(90);

    const stored = await budgets.findByDay(user.id, dayKey);
    expect(stored?.freeMinutes).toBe(120);
  });
});
