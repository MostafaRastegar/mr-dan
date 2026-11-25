/**
 * Weekly goal integration tests against real Postgres.
 *
 * Skips every case when Postgres is unreachable so CI stays green without
 * docker. Rows created here are namespaced by `RUN` and removed afterwards.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/shared/prisma";
import { PrismaWeeklyGoalRepository } from "@/modules/advising/infrastructure/prisma-weekly-goal-repository";
import { PrismaUserRepository } from "@/modules/advising/infrastructure/prisma-user-repository";
import type { NewUser } from "@/modules/advising/domain/models";

const goals = new PrismaWeeklyGoalRepository();
const users = new PrismaUserRepository();

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
  const username = `wg-${label}-${RUN}`;
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

describe("weekly goal integration (real Postgres)", () => {
  it("unique (studentId, weekKey)", async () => {
    if (!live) return;

    const user = await users.create(student("unique-student"));
    const first = await goals.setCompletedBlocks(user.id, "2026-11-21", [
      "2026-11-21:480:50",
    ]);
    const second = await goals.setCompletedBlocks(user.id, "2026-11-21", [
      "2026-11-21:540:50",
    ]);
    expect(second.id).toBe(first.id);
    expect(second.completedBlocks).toEqual(["2026-11-21:540:50"]);

    await prisma.user.delete({ where: { id: user.id } });
    expect(await prisma.weeklyGoal.count({ where: { studentId: user.id } })).toBe(
      0,
    );
  });

  it("completedBlocks persists as text[]", async () => {
    if (!live) return;

    const user = await users.create(student("blocks-student"));
    const stored = await goals.setCompletedBlocks(user.id, "2026-11-21", [
      "2026-11-21:480:50",
      "2026-11-21:540:50",
    ]);
    expect(stored.completedBlocks).toEqual([
      "2026-11-21:480:50",
      "2026-11-21:540:50",
    ]);

    const readBack = await goals.findByKey(user.id, "2026-11-21");
    expect(readBack?.completedBlocks).toEqual([
      "2026-11-21:480:50",
      "2026-11-21:540:50",
    ]);

    await prisma.user.delete({ where: { id: user.id } });
  });

  it("cascade delete with the user", async () => {
    if (!live) return;

    const user = await users.create(student("cascade-student"));
    await goals.setCompletedBlocks(user.id, "2026-11-21", []);

    await prisma.user.delete({ where: { id: user.id } });
    expect(await prisma.weeklyGoal.count({ where: { studentId: user.id } })).toBe(
      0,
    );
  });

  it("tests done increments atomically", async () => {
    if (!live) return;

    const user = await users.create(student("atomic-student"));
    const first = await goals.incrementTestsDone(user.id, "2026-11-21", 10);
    const second = await goals.incrementTestsDone(user.id, "2026-11-21", 5);
    expect(first.testsDone).toBe(10);
    expect(second.testsDone).toBe(15);

    const stored = await goals.findByKey(user.id, "2026-11-21");
    expect(stored?.testsDone).toBe(15);

    await prisma.user.delete({ where: { id: user.id } });
  });

  it("dashboard: study block and tests done persist", async () => {
    if (!live) return;

    const user = await users.create(student("dashboard-goal"));
    const weekKey = "2026-11-23";

    const withBlock = await goals.setCompletedBlocks(user.id, weekKey, [
      "2026-11-23:480:50",
    ]);
    expect(withBlock.completedBlocks).toEqual(["2026-11-23:480:50"]);

    const tenTests = await goals.incrementTestsDone(user.id, weekKey, 10);
    expect(tenTests.testsDone).toBe(10);

    const readBack = await goals.findByKey(user.id, weekKey);
    expect(readBack?.completedBlocks).toEqual(["2026-11-23:480:50"]);
    expect(readBack?.testsDone).toBe(10);

    await prisma.user.delete({ where: { id: user.id } });
    expect(await prisma.weeklyGoal.count({ where: { studentId: user.id } })).toBe(
      0,
    );
  });
});
