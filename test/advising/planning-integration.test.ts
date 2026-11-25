/**
 * Planning integration tests against real Postgres.
 *
 * Skips every case when Postgres is unreachable so CI stays green without
 * docker. Rows created here are namespaced by `RUN` and removed afterwards.
 */

import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/shared/prisma";
import { dayCapacity, fitsCapacity } from "@/modules/advising/domain/free-time";
import { PrismaFreeTimeBudgetRepository } from "@/modules/advising/infrastructure/prisma-free-time-budget-repository";
import { PrismaHomeworkPlanRepository } from "@/modules/advising/infrastructure/prisma-homework-plan-repository";
import { PrismaHomeworkRepository } from "@/modules/advising/infrastructure/prisma-homework-repository";
import { PrismaScheduleRepository } from "@/modules/advising/infrastructure/prisma-schedule-repository";
import { PrismaUserRepository } from "@/modules/advising/infrastructure/prisma-user-repository";
import type { NewUser } from "@/modules/advising/domain/models";

const users = new PrismaUserRepository();
const schedule = new PrismaScheduleRepository();
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

describe("planning integration (real Postgres)", () => {
  it("duplicate weekly slot", async () => {
    if (!live) return;

    const user = await users.create(student("dup-student"));
    await schedule.create({
      studentId: user.id,
      dayOfWeek: 1,
      startMinute: 540,
      endMinute: 600,
      subject: "riazi",
    });

    await expect(
      schedule.create({
        studentId: user.id,
        dayOfWeek: 1,
        startMinute: 540,
        endMinute: 660,
        subject: "fizik",
      }),
    ).rejects.toMatchObject({ code: "schedule_conflict" });

    const rows = await schedule.listByStudent(user.id);
    expect(rows).toHaveLength(1);
    expect(rows[0].subject).toBe("riazi");
  });

  it("cascades planning rows", async () => {
    if (!live) return;

    const user = await users.create(student("cascade-student"));
    await schedule.create({
      studentId: user.id,
      dayOfWeek: 2,
      startMinute: 480,
      endMinute: 540,
      subject: "zist",
    });
    const task = await homework.create({
      studentId: user.id,
      title: "پrašش",
      subject: null,
      priority: 2,
      deadline: new Date("2026-12-01T20:30:00Z"),
    });
    const dayKey = "2026-12-01";
    await budgets.upsertWithinUsed({
      studentId: user.id,
      dayKey,
      freeMinutes: 120,
      allows: () => true,
    });
    const planned = await plans.upsertWithinCapacity({
      studentId: user.id,
      homeworkId: task.id,
      dayKey,
      plannedMinutes: 60,
      allows: ({ freeMinutes, usedMinutes }) =>
        fitsCapacity(dayCapacity(freeMinutes, usedMinutes), 60),
    });
    expect(planned.ok).toBe(true);

    await prisma.user.delete({ where: { id: user.id } });

    expect(await schedule.listByStudent(user.id)).toEqual([]);
    expect(await homework.listByStudent(user.id, "all")).toEqual([]);
    expect(await prisma.freeTimeBudget.count({ where: { studentId: user.id } })).toBe(0);
    expect(await prisma.homeworkPlanEntry.count({ where: { studentId: user.id } })).toBe(0);
  });

  it("unknown entry", async () => {
    if (!live) return;

    const missing = randomUUID();
    await expect(
      schedule.update(missing, { subject: "x" }),
    ).rejects.toMatchObject({ code: "not_found" });
    await expect(schedule.delete(missing)).rejects.toMatchObject({
      code: "not_found",
    });
  });

  it("schedule round-trip", async () => {
    if (!live) return;

    const user = await users.create(student("sched-rt"));
    const created = await schedule.create({
      studentId: user.id,
      dayOfWeek: 3,
      startMinute: 480,
      endMinute: 540,
      subject: "riazi",
      teacher: "استاد",
      room: "101",
    });
    expect(created.dayOfWeek).toBe(3);

    const list = await schedule.listByStudent(user.id);
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(created.id);

    const updated = await schedule.update(created.id, { subject: "fizik" });
    expect(updated.subject).toBe("fizik");

    await schedule.delete(created.id);
    expect(await schedule.listByStudent(user.id)).toEqual([]);
  });

  it("homework round-trip", async () => {
    if (!live) return;

    const user = await users.create(student("hw-rt"));
    const created = await homework.create({
      studentId: user.id,
      title: "پrašش",
      subject: null,
      priority: 3,
      deadline: new Date("2026-12-01T20:30:00Z"),
    });
    expect(created.priority).toBe("high");

    const list = await homework.listByStudent(user.id, "all");
    expect(list).toHaveLength(1);
    expect(list[0].priority).toBe("high");

    const done = await homework.setCompletion(created.id, { completedAt: new Date(), spentMinutes: null });
    expect(done.completedAt).not.toBeNull();

    const pending = await homework.listByStudent(user.id, "pending");
    expect(pending).toEqual([]);

    await homework.delete(created.id);
    expect(await homework.listByStudent(user.id, "all")).toEqual([]);
  });

  it("free time budget round-trip", async () => {
    if (!live) return;

    const user = await users.create(student("budget-rt"));
    const dayKey = "2026-12-08";

    const created = await budgets.upsertWithinUsed({
      studentId: user.id,
      dayKey,
      freeMinutes: 120,
      allows: () => true,
    });
    expect(created.ok).toBe(true);

    const stored = await budgets.findByDay(user.id, dayKey);
    expect(stored?.freeMinutes).toBe(120);

    const updated = await budgets.upsertWithinUsed({
      studentId: user.id,
      dayKey,
      freeMinutes: 90,
      allows: () => true,
    });
    expect(updated.ok).toBe(true);

    expect(
      await prisma.freeTimeBudget.count({ where: { studentId: user.id, dayKey } }),
    ).toBe(1);
    const reread = await budgets.findByDay(user.id, dayKey);
    expect(reread?.freeMinutes).toBe(90);
  });

  it("homework plan round-trip", async () => {
    if (!live) return;

    const user = await users.create(student("plan-rt"));
    const dayKey = "2026-12-09";
    await budgets.upsertWithinUsed({
      studentId: user.id,
      dayKey,
      freeMinutes: 120,
      allows: () => true,
    });
    const task = await homework.create({
      studentId: user.id,
      title: "تکلیف",
      subject: null,
      priority: 2,
      deadline: new Date("2026-12-09T20:30:00Z"),
    });

    const first = await plans.upsertWithinCapacity({
      studentId: user.id,
      homeworkId: task.id,
      dayKey,
      plannedMinutes: 30,
      allows: ({ freeMinutes, usedMinutes }) =>
        fitsCapacity(dayCapacity(freeMinutes, usedMinutes), 30),
    });
    expect(first.ok).toBe(true);

    const second = await plans.upsertWithinCapacity({
      studentId: user.id,
      homeworkId: task.id,
      dayKey,
      plannedMinutes: 45,
      allows: ({ freeMinutes, usedMinutes }) =>
        fitsCapacity(dayCapacity(freeMinutes, usedMinutes), 45),
    });
    expect(second.ok).toBe(true);

    expect(
      await prisma.homeworkPlanEntry.count({
        where: { studentId: user.id, homeworkId: task.id, dayKey },
      }),
    ).toBe(1);
    const listed = await plans.listByDay(user.id, dayKey);
    expect(listed).toHaveLength(1);
    expect(listed[0].homeworkId).toBe(task.id);
    expect(listed[0].plannedMinutes).toBe(45);
  });

  it("plan row cascades with its homework", async () => {
    if (!live) return;

    const user = await users.create(student("plan-cascade"));
    const dayKey = "2026-12-10";
    await budgets.upsertWithinUsed({
      studentId: user.id,
      dayKey,
      freeMinutes: 120,
      allows: () => true,
    });
    const task = await homework.create({
      studentId: user.id,
      title: "تکلیف",
      subject: null,
      priority: 2,
      deadline: new Date("2026-12-10T20:30:00Z"),
    });
    const planned = await plans.upsertWithinCapacity({
      studentId: user.id,
      homeworkId: task.id,
      dayKey,
      plannedMinutes: 60,
      allows: ({ freeMinutes, usedMinutes }) =>
        fitsCapacity(dayCapacity(freeMinutes, usedMinutes), 60),
    });
    expect(planned.ok).toBe(true);

    await prisma.homework.delete({ where: { id: task.id } });

    expect(
      await prisma.homeworkPlanEntry.count({ where: { studentId: user.id, dayKey } }),
    ).toBe(0);
    expect(
      await prisma.freeTimeBudget.count({ where: { studentId: user.id, dayKey } }),
    ).toBe(1);
  });

  it("dashboard-homework: done-with-minutes persists", async () => {
    if (!live) return;

    const user = await users.create(student("dashboard-hw"));
    const task = await homework.create({
      studentId: user.id,
      title: "تکلیف ریاضی",
      subject: null,
      priority: 3,
      deadline: new Date("2026-12-01T20:30:00Z"),
    });

    const done = await homework.setCompletion(task.id, {
      completedAt: new Date("2026-12-01T21:00:00Z"),
      spentMinutes: 45,
    });
    expect(done.completedAt).not.toBeNull();
    expect(done.spentMinutes).toBe(45);

    const readBack = await homework.findById(task.id);
    expect(readBack?.completedAt).not.toBeNull();
    expect(readBack?.spentMinutes).toBe(45);

    await prisma.user.delete({ where: { id: user.id } });
    expect(await prisma.homework.count({ where: { studentId: user.id } })).toBe(0);
  });
});
