import { describe, expect, it } from "vitest";

import { FakeUserRepository } from "../../../../test/fakes/advising";
import { ForbiddenError } from "@/modules/advising/domain/errors";
import {
  assertCounselorOfStudent,
  assertPlanRead,
  assertPlanWrite,
  type Actor,
} from "@/modules/advising/application/planning-access";

const counselor: Actor = { id: "c1", role: "counselor" };
const admin: Actor = { id: "a1", role: "admin" };
const student: Actor = { id: "s1", role: "student" };
const operator: Actor = { id: "op1", role: "operator" };

async function makeUsers(): Promise<FakeUserRepository> {
  const users = new FakeUserRepository({
    groupNames: new Map(),
    groupCounts: new Map(),
  });
  for (const [id, role, counselorId] of [
    ["c1", "counselor", null],
    ["a1", "admin", null],
    ["s1", "student", "c1"],
    ["s2", "student", "c1"],
  ] as const) {
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
  return users;
}

describe("assertCounselorOfStudent", () => {
  it("passes for the student's own counselor", async () => {
    const users = await makeUsers();
    // Returns the student row so callers can read grade/field for options.
    await expect(
      assertCounselorOfStudent(users, counselor, "s1"),
    ).resolves.toMatchObject({ id: "s1", role: "student" });
  });

  it("rejects an admin who is not the student's counselor-of-record", async () => {
    const users = await makeUsers();
    await expect(
      assertCounselorOfStudent(users, admin, "s1"),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("rejects an unknown student for an admin", async () => {
    const users = await makeUsers();
    await expect(
      assertCounselorOfStudent(users, admin, "missing"),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("rejects a student role", async () => {
    const users = await makeUsers();
    await expect(
      assertCounselorOfStudent(users, student, "s1"),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("rejects an operator role", async () => {
    const users = await makeUsers();
    await expect(
      assertCounselorOfStudent(users, operator, "s1"),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("assertPlanWrite", () => {
  it("passes for the owner", () => {
    expect(() => assertPlanWrite(student, "schedule:write", "s1")).not.toThrow();
  });

  it("rejects a non-owner even with the capability", () => {
    expect(() => assertPlanWrite(student, "schedule:write", "s2")).toThrow(
      ForbiddenError,
    );
    expect(() => assertPlanWrite(counselor, "profile:write", "s1")).toThrow(
      ForbiddenError,
    );
  });

  it("passes for an admin on its own row", () => {
    expect(() => assertPlanWrite(admin, "schedule:write", "a1")).not.toThrow();
  });
});

describe("assertPlanRead", () => {
  it("passes for self", async () => {
    const users = await makeUsers();
    await expect(
      assertPlanRead(users, student, "s1"),
    ).resolves.toBeUndefined();
  });

  it("passes for the owner's counselor", async () => {
    const users = await makeUsers();
    await expect(
      assertPlanRead(users, counselor, "s2"),
    ).resolves.toBeUndefined();
  });

  it("rejects a non-owner non-counselor", async () => {
    const users = await makeUsers();
    await expect(
      assertPlanRead(users, student, "s2"),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      assertPlanRead(users, admin, "s2"),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
