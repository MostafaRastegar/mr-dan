import { beforeEach, describe, expect, it } from "vitest";

import {
  AssignStudentToGroupUseCase,
  CounselorRosterUseCase,
  CreateGroupUseCase,
} from "@/modules/advising/application/groups";
import { createAdvisingFakes, type AdvisingFakes } from "../../../../test/fakes/advising";
import type { Role } from "@/modules/advising/domain/models";

const PASSWORD = "a".repeat(8);

let fakes: AdvisingFakes;

beforeEach(() => {
  fakes = createAdvisingFakes();
});

async function createUser(
  username: string,
  role: Role,
  fullName = username,
) {
  return fakes.users.create({
    username,
    email: null,
    role,
    fullName,
    grade: null,
    fieldOfStudy: null,
    schoolName: null,
    groupId: null,
    counselorId: null,
    passwordHash: await fakes.crypto.hashPassword(PASSWORD),
  });
}

function createGroup(actor: { id: string; role: Role }, name = "گروه یک") {
  return new CreateGroupUseCase(fakes.groups).execute({ actor, name });
}

function assign(
  actor: { id: string; role: Role },
  studentId: string,
  groupId: string | null,
) {
  return new AssignStudentToGroupUseCase(fakes.users, fakes.groups).execute({
    actor,
    studentId,
    groupId,
  });
}

describe("groups", () => {
  it("non-counselor cannot create a group", async () => {
    const student = await createUser("student1", "student");

    await expect(createGroup({ id: student.id, role: student.role })).rejects.toMatchObject({
      code: "forbidden",
    });
    expect(fakes.groups.count()).toBe(0);
  });

  it("create group returns studentCount 0", async () => {
    const counselor = await createUser("counselor1", "counselor");
    const group = await createGroup({ id: counselor.id, role: counselor.role });

    expect(group.studentCount).toBe(0);
    expect(group.counselorId).toBe(counselor.id);
  });

  it("assign student sets both groupId and counselorId", async () => {
    const counselor = await createUser("counselor1", "counselor");
    const student = await createUser("student1", "student");
    const group = await createGroup({ id: counselor.id, role: counselor.role });

    await assign({ id: counselor.id, role: counselor.role }, student.id, group.id);

    const row = fakes.users.rowByUsername("student1");
    expect(row?.groupId).toBe(group.id);
    expect(row?.counselorId).toBe(counselor.id);
  });

  it("assign to another counselor's group is forbidden and changes nothing", async () => {
    const owner = await createUser("counselor1", "counselor");
    const other = await createUser("counselor2", "counselor");
    const student = await createUser("student1", "student");
    const group = await createGroup({ id: owner.id, role: owner.role });

    await expect(
      assign({ id: other.id, role: other.role }, student.id, group.id),
    ).rejects.toMatchObject({ code: "forbidden" });

    const row = fakes.users.rowByUsername("student1");
    expect(row?.groupId).toBeNull();
    expect(row?.counselorId).toBeNull();
  });

  it("counselor cannot assign another counselor's student and changes nothing", async () => {
    const owner = await createUser("counselor1", "counselor");
    const other = await createUser("counselor2", "counselor");
    const student = await createUser("student1", "student");
    const ownerGroup = await createGroup({ id: owner.id, role: owner.role });
    const otherGroup = await createGroup(
      { id: other.id, role: other.role },
      "گروه دو",
    );

    await assign({ id: owner.id, role: owner.role }, student.id, ownerGroup.id);

    await expect(
      assign({ id: other.id, role: other.role }, student.id, otherGroup.id),
    ).rejects.toMatchObject({ code: "forbidden" });

    const row = fakes.users.rowByUsername("student1");
    expect(row?.groupId).toBe(ownerGroup.id);
    expect(row?.counselorId).toBe(owner.id);
  });

  it("unassigning keeps the student's counselor id", async () => {
    const owner = await createUser("counselor1", "counselor");
    const student = await createUser("student1", "student");
    const group = await createGroup({ id: owner.id, role: owner.role });

    await assign({ id: owner.id, role: owner.role }, student.id, group.id);
    await assign({ id: owner.id, role: owner.role }, student.id, null);

    const row = fakes.users.rowByUsername("student1");
    expect(row?.groupId).toBeNull();
    expect(row?.counselorId).toBe(owner.id);
  });

  it("assign with a missing group or student returns not_found", async () => {
    const counselor = await createUser("counselor1", "counselor");
    const student = await createUser("student1", "student");
    const group = await createGroup({ id: counselor.id, role: counselor.role });

    await expect(
      assign({ id: counselor.id, role: counselor.role }, student.id, "group-404"),
    ).rejects.toMatchObject({ code: "not_found" });

    await expect(
      assign({ id: counselor.id, role: counselor.role }, "user-404", group.id),
    ).rejects.toMatchObject({ code: "not_found" });
  });

  it("assigning a counselor as a student returns invalid_input", async () => {
    const counselor = await createUser("counselor1", "counselor");
    const target = await createUser("counselor2", "counselor");
    const group = await createGroup({ id: counselor.id, role: counselor.role });

    await expect(
      assign({ id: counselor.id, role: counselor.role }, target.id, group.id),
    ).rejects.toMatchObject({ code: "invalid_input" });
  });

  it("roster excludes other counselors' students", async () => {
    const first = await createUser("counselor1", "counselor");
    const second = await createUser("counselor2", "counselor");
    const mine = await createUser("student1", "student", "دانش‌آموز من");
    const unassigned = await createUser("student2", "student", "بدون مشاور");
    const foreign = await createUser("student3", "student", "دانش‌آموز دیگر");
    const group = await createGroup({ id: first.id, role: first.role });

    await assign({ id: first.id, role: first.role }, mine.id, group.id);
    const secondGroup = await createGroup(
      { id: second.id, role: second.role },
      "گروه دو",
    );
    await assign(
      { id: second.id, role: second.role },
      foreign.id,
      secondGroup.id,
    );

    const roster = await new CounselorRosterUseCase(
      fakes.users,
      fakes.groups,
    ).execute({ actor: { id: first.id, role: first.role } });

    const ids = roster.students.map((student) => student.id);
    expect(ids).toContain(mine.id);
    expect(ids).toContain(unassigned.id);
    expect(ids).not.toContain(foreign.id);
    expect(roster.groups).toHaveLength(1);
  });
});
