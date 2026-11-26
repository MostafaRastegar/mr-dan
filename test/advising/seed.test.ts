/**
 * Seed tests against real Postgres (skipped when unreachable).
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/shared/prisma";
import { seedAdvising, seedCatalogs } from "../../scripts/seed-advising";

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

  it("catalog seed is idempotent", async () => {
    if (!live) return;

    const first = await seedCatalogs();
    const second = await seedCatalogs();

    // Idempotent by natural key: same returned counts, no duplicate rows.
    expect(second).toEqual(first);
    expect(first.fields).toBeGreaterThan(0);
    expect(first.grades).toBeGreaterThan(0);
    expect(first.subjects).toBeGreaterThan(0);
    expect(first.books).toBeGreaterThan(0);

    // The seed source lives in scripts/, so assert against the seeded DB rows.
    expect(await prisma.field.findUnique({ where: { label: "علوم تجربی" } })).not.toBeNull();
    expect(await prisma.grade.findUnique({ where: { label: "دوازدهم" } })).not.toBeNull();

    const subject = await prisma.subject.findUnique({ where: { slug: "riazi" } });
    expect(subject?.label).toBe("ریاضی");
    expect(subject?.fieldLabels).toEqual([]);
    expect(subject?.gradeLabels).toEqual([]);

    const fieldSpecific = await prisma.subject.findUnique({ where: { slug: "zist" } });
    expect(fieldSpecific?.fieldLabels).toEqual(["علوم تجربی"]);

    const book = await prisma.book.findUnique({ where: { slug: "how-to-solve-it" } });
    expect(book?.fieldLabel).toBe("ریاضی فیزیک");

    expect(await prisma.field.count({ where: { label: "علوم تجربی" } })).toBe(1);
    expect(await prisma.grade.count({ where: { label: "دوازدهم" } })).toBe(1);
    expect(await prisma.subject.count({ where: { slug: "riazi" } })).toBe(1);
    expect(await prisma.book.count({ where: { slug: "how-to-solve-it" } })).toBe(1);
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
