/**
 * Planning integration tests against real Postgres.
 *
 * Skips every case when Postgres is unreachable so CI stays green without
 * docker. Rows created here are namespaced by `RUN` and removed afterwards.
 */

import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/shared/prisma";
import { PrismaHomeworkRepository } from "@/modules/advising/infrastructure/prisma-homework-repository";
import { PrismaScheduleRepository } from "@/modules/advising/infrastructure/prisma-schedule-repository";
import { PrismaStudySessionRepository } from "@/modules/advising/infrastructure/prisma-study-session-repository";
import { PrismaUserRepository } from "@/modules/advising/infrastructure/prisma-user-repository";
import type { NewUser } from "@/modules/advising/domain/models";

const users = new PrismaUserRepository();
const schedule = new PrismaScheduleRepository();
const homework = new PrismaHomeworkRepository();
const study = new PrismaStudySessionRepository();

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
    await homework.create({
      studentId: user.id,
      title: "پrašش",
      subject: null,
      priority: 2,
      deadline: new Date("2026-12-01T20:30:00Z"),
    });
    await study.create({
      studentId: user.id,
      category: "study",
      subject: null,
      durationMinutes: 30,
      focusLevel: null,
      startedAt: new Date("2026-11-23T08:00:00Z"),
    });

    await prisma.user.delete({ where: { id: user.id } });

    expect(await schedule.listByStudent(user.id)).toEqual([]);
    expect(await homework.listByStudent(user.id, "all")).toEqual([]);
    expect(
      await study.listByStudentInRange(user.id, new Date(0), new Date()),
    ).toEqual([]);
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

    const done = await homework.setCompletedAt(created.id, new Date());
    expect(done.completedAt).not.toBeNull();

    const pending = await homework.listByStudent(user.id, "pending");
    expect(pending).toEqual([]);

    await homework.delete(created.id);
    expect(await homework.listByStudent(user.id, "all")).toEqual([]);
  });

  it("study session round-trip", async () => {
    if (!live) return;

    const user = await users.create(student("study-rt"));
    const started = new Date("2026-11-23T17:00:00Z");
    const created = await study.create({
      studentId: user.id,
      category: "study",
      subject: null,
      durationMinutes: 45,
      focusLevel: 4,
      startedAt: started,
    });
    expect(created.durationMinutes).toBe(45);

    const list = await study.listByStudentInRange(
      user.id,
      new Date("2026-11-23T00:00:00Z"),
      new Date("2026-11-24T00:00:00Z"),
    );
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(created.id);

    await prisma.studySession.delete({ where: { id: created.id } });
    expect(
      await study.listByStudentInRange(user.id, new Date(0), new Date()),
    ).toEqual([]);
  });
});
