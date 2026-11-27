/**
 * Advising integration tests against real Postgres.
 *
 * Skips every case when Postgres is unreachable so CI stays green without
 * docker. Rows created here are namespaced by `RUN` and removed afterwards.
 */

import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/shared/prisma";
import { PrismaGroupRepository } from "@/modules/advising/infrastructure/prisma-group-repository";
import { PrismaSessionRepository } from "@/modules/advising/infrastructure/prisma-session-repository";
import { PrismaUserRepository } from "@/modules/advising/infrastructure/prisma-user-repository";
import type { NewUser } from "@/modules/advising/domain/models";

const users = new PrismaUserRepository();
const groups = new PrismaGroupRepository();
const sessions = new PrismaSessionRepository();

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

function account(
  label: string,
  role: NewUser["role"],
  email: string | null = null,
): NewUser & { passwordHash: string } {
  const username = `it-${label}-${RUN}`;
  createdUsernames.push(username);
  return {
    username,
    email,
    role,
    fullName: `تست ${label}`,
    grade: null,
    fieldOfStudy: null,
    schoolName: null,
    groupId: null,
    counselorId: null,
    passwordHash: PASSWORD_HASH,
  };
}

describe("advising integration (real Postgres)", () => {
  it("enforces unique username and unique email at the DB level", async () => {
    if (!live) return;

    const sharedEmail = `it-shared-${RUN}@example.com`;
    const first = account("unique-a", "student", sharedEmail);
    const second = account("unique-b", "student", sharedEmail);
    await users.create(first);

    await expect(users.create({ ...first, email: null })).rejects.toMatchObject({
      code: "username_taken",
    });
    await expect(users.create(second)).rejects.toMatchObject({
      code: "email_taken",
    });
  });

  it("allows two users with a null email", async () => {
    if (!live) return;

    const a = await users.create(account("null-a", "student"));
    const b = await users.create(account("null-b", "student"));

    expect(a.email).toBeNull();
    expect(b.email).toBeNull();
    expect(a.id).not.toBe(b.id);
  });

  it("deleting a user cascades their sessions", async () => {
    if (!live) return;

    const user = await users.create(account("cascade-user", "student"));
    await sessions.create({
      userId: user.id,
      tokenHash: randomUUID().replaceAll("-", ""),
      expiresAt: new Date(Date.now() + 60_000),
    });
    await sessions.create({
      userId: user.id,
      tokenHash: randomUUID().replaceAll("-", ""),
      expiresAt: new Date(Date.now() + 120_000),
    });
    expect(await prisma.session.count({ where: { userId: user.id } })).toBe(2);

    await prisma.user.delete({ where: { id: user.id } });

    expect(await prisma.session.count({ where: { userId: user.id } })).toBe(0);
  });

  it("deleting a group sets members' groupId to null", async () => {
    if (!live) return;

    const counselor = await users.create(account("cascade-counselor", "counselor"));
    const student = await users.create(account("cascade-student", "student"));
    const group = await groups.create({
      counselorId: counselor.id,
      name: `گروه ${RUN}`,
      description: null,
      targetGrade: null,
      targetField: null,
    });
    await users.assignToGroup({
      studentId: student.id,
      groupId: group.id,
      counselorId: counselor.id,
    });

    await prisma.group.delete({ where: { id: group.id } });

    const row = await users.findById(student.id);
    expect(row?.groupId).toBeNull();
    expect(row?.counselorId).toBe(counselor.id);
  });

  it("assignToGroup persists both columns in one read-back", async () => {
    if (!live) return;

    const counselor = await users.create(account("assign-counselor", "counselor"));
    const student = await users.create(account("assign-student", "student"));
    const group = await groups.create({
      counselorId: counselor.id,
      name: `گروه اسناد ${RUN}`,
      description: null,
      targetGrade: null,
      targetField: null,
    });

    await users.assignToGroup({
      studentId: student.id,
      groupId: group.id,
      counselorId: counselor.id,
    });

    const row = await users.findById(student.id);
    expect(row?.groupId).toBe(group.id);
    expect(row?.counselorId).toBe(counselor.id);
  });

  it("listAssignableStudents returns own and unassigned students only", async () => {
    if (!live) return;

    const mine = await users.create(account("roster-counselor", "counselor"));
    const other = await users.create(account("roster-other", "counselor"));
    const ownStudent = await users.create(account("roster-own", "student"));
    const unassigned = await users.create(account("roster-free", "student"));
    const foreign = await users.create(account("roster-foreign", "student"));
    const group = await groups.create({
      counselorId: mine.id,
      name: `گروه روستر ${RUN}`,
      description: null,
      targetGrade: null,
      targetField: null,
    });

    await users.assignToGroup({
      studentId: ownStudent.id,
      groupId: group.id,
      counselorId: mine.id,
    });
    await users.assignToGroup({
      studentId: foreign.id,
      groupId: null,
      counselorId: other.id,
    });

    const roster = await users.listAssignableStudents(mine.id);
    const ids = roster.map((student) => student.id);

    expect(ids).toContain(ownStudent.id);
    expect(ids).toContain(unassigned.id);
    expect(ids).not.toContain(foreign.id);
    expect(ids).not.toContain(other.id);
  });
});
