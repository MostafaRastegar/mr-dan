/**
 * Seed tests against real Postgres (skipped when unreachable).
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/shared/prisma";
import { seedAdvising } from "../../scripts/seed-advising";

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
  await prisma.$disconnect();
});

describe("advising demo seed", () => {
  it("seed is idempotent", async () => {
    if (!live) return;

    const first = await seedAdvising();
    const before = await prisma.user.findUnique({
      where: { username: "student" },
      select: { passwordHash: true, groupId: true, counselorId: true },
    });

    const second = await seedAdvising();

    expect(second.counselorId).toBe(first.counselorId);
    expect(second.groupId).toBe(first.groupId);
    expect(second.studentId).toBe(first.studentId);

    expect(await prisma.user.count({ where: { username: "counselor" } })).toBe(1);
    expect(await prisma.user.count({ where: { username: "student" } })).toBe(1);
    expect(await prisma.group.count({ where: { id: first.groupId } })).toBe(1);

    const after = await prisma.user.findUnique({
      where: { username: "student" },
      select: { passwordHash: true, groupId: true, counselorId: true },
    });
    expect(after?.passwordHash).toBe(before?.passwordHash);
    expect(after?.groupId).toBe(first.groupId);
    expect(after?.counselorId).toBe(first.counselorId);

    // A re-run repairs a broken assignment without touching the hash.
    await prisma.user.update({
      where: { username: "student" },
      data: { groupId: null, counselorId: null },
    });
    await seedAdvising();
    const repaired = await prisma.user.findUnique({
      where: { username: "student" },
      select: { passwordHash: true, groupId: true, counselorId: true },
    });
    expect(repaired?.groupId).toBe(first.groupId);
    expect(repaired?.counselorId).toBe(first.counselorId);
    expect(repaired?.passwordHash).toBe(before?.passwordHash);
  });

  it("seed refuses production", async () => {
    if (!live) return;

    // Scoped counts: the full suite runs other DB tests in parallel.
    const counselorBefore = await prisma.user.count({ where: { username: "counselor" } });
    const studentBefore = await prisma.user.count({ where: { username: "student" } });
    const groupsBefore = await prisma.group.count({ where: { name: "کلاس دوازدهم تجربی" } });
    await expect(seedAdvising({ env: { NODE_ENV: "production" } })).rejects.toThrow(/production/);

    expect(await prisma.user.count({ where: { username: "counselor" } })).toBe(counselorBefore);
    expect(await prisma.user.count({ where: { username: "student" } })).toBe(studentBefore);
    expect(await prisma.group.count({ where: { name: "کلاس دوازدهم تجربی" } })).toBe(groupsBefore);
  });
});
