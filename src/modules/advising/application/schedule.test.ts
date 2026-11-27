import { describe, expect, it } from "vitest";

import { createPlanningFakes } from "../../../../test/fakes/planning";
import { FakeUserRepository } from "../../../../test/fakes/advising";
import {
  CreateScheduleEntryUseCase,
  DeleteScheduleEntryUseCase,
  ListWeeklyScheduleUseCase,
  UpdateScheduleEntryUseCase,
} from "@/modules/advising/application/schedule";
import { ScheduleConflictError } from "@/modules/advising/domain/errors";
import type { Actor } from "@/modules/advising/application/planning-access";
import type { Role } from "@/modules/advising/domain/models";

const counselor: Actor = { id: "c1", role: "counselor" };
const foreignCounselor: Actor = { id: "c2", role: "counselor" };
const student: Actor = { id: "s1", role: "student" };
const admin: Actor = { id: "a1", role: "admin" };

async function makeUsers() {
  const users = new FakeUserRepository({
    groupNames: new Map(),
    groupCounts: new Map(),
  });
  const seed = async (
    id: string,
    role: Role,
    counselorId: string | null = null,
  ) => {
    await users.create({
      id,
      username: id,
      email: null,
      role,
      fullName: id,
      grade: role === "student" ? "دهم" : null,
      fieldOfStudy: role === "student" ? "ریاضی فیزیک" : null,
      schoolName: null,
      groupId: null,
      counselorId,
      passwordHash: "x",
    });
  };
  await seed("c1", "counselor");
  await seed("c2", "counselor");
  await seed("a1", "admin");
  await seed("s1", "student", "c1");
  await seed("s2", "student", "c2");
  return users;
}

const entryInput = {
  dayOfWeek: 0 as const,
  startMinute: 480,
  endMinute: 540,
  subject: "riazi",
};

describe("schedule authoring is counselor-of-record only", () => {
  it("AC-2: student create/update/delete → forbidden, nothing written", async () => {
    const users = await makeUsers();
    const fakes = createPlanningFakes();
    const create = new CreateScheduleEntryUseCase(users, fakes.schedule);
    const update = new UpdateScheduleEntryUseCase(users, fakes.schedule);
    const remove = new DeleteScheduleEntryUseCase(users, fakes.schedule);

    await expect(
      create.execute({ actor: student, studentId: student.id, ...entryInput }),
    ).rejects.toMatchObject({ code: "forbidden" });

    const existing = await create.execute({
      actor: counselor,
      studentId: student.id,
      ...entryInput,
    });
    const writesAfterCounselor = fakes.schedule.writes;

    await expect(
      update.execute({ actor: student, entryId: existing.id, ...entryInput }),
    ).rejects.toMatchObject({ code: "forbidden" });
    await expect(
      remove.execute({ actor: student, entryId: existing.id }),
    ).rejects.toMatchObject({ code: "forbidden" });

    expect(fakes.schedule.writes).toBe(writesAfterCounselor);
  });

  it("AC-2: counselor-of-record create/update/delete succeeds", async () => {
    const users = await makeUsers();
    const fakes = createPlanningFakes();
    const create = new CreateScheduleEntryUseCase(users, fakes.schedule);
    const update = new UpdateScheduleEntryUseCase(users, fakes.schedule);
    const remove = new DeleteScheduleEntryUseCase(users, fakes.schedule);

    const entry = await create.execute({
      actor: counselor,
      studentId: student.id,
      ...entryInput,
    });
    expect(entry.studentId).toBe(student.id);

    const changed = await update.execute({
      actor: counselor,
      entryId: entry.id,
      ...entryInput,
      subject: "fizik",
      startMinute: 600,
      endMinute: 660,
    });
    expect(changed.subject).toBe("fizik");

    await remove.execute({ actor: counselor, entryId: entry.id });
    expect(await fakes.schedule.listByStudent(student.id)).toEqual([]);
  });

  it("AC-3: foreign counselor and admin → forbidden, nothing written", async () => {
    const users = await makeUsers();
    const fakes = createPlanningFakes();
    const create = new CreateScheduleEntryUseCase(users, fakes.schedule);

    await expect(
      create.execute({
        actor: foreignCounselor,
        studentId: student.id,
        ...entryInput,
      }),
    ).rejects.toMatchObject({ code: "forbidden" });

    await expect(
      create.execute({ actor: admin, studentId: student.id, ...entryInput }),
    ).rejects.toMatchObject({ code: "forbidden" });

    expect(fakes.schedule.writes).toBe(0);
  });

  it("AC-3: counselor passing their own id is not counselor-of-record of self", async () => {
    const users = await makeUsers();
    const fakes = createPlanningFakes();
    const create = new CreateScheduleEntryUseCase(users, fakes.schedule);

    await expect(
      create.execute({ actor: counselor, studentId: counselor.id, ...entryInput }),
    ).rejects.toMatchObject({ code: "forbidden" });
    expect(fakes.schedule.writes).toBe(0);
  });

  it("AC-3: unknown entry → not_found", async () => {
    const users = await makeUsers();
    const fakes = createPlanningFakes();
    const update = new UpdateScheduleEntryUseCase(users, fakes.schedule);
    const remove = new DeleteScheduleEntryUseCase(users, fakes.schedule);

    await expect(
      update.execute({ actor: counselor, entryId: "no-such-id", ...entryInput }),
    ).rejects.toMatchObject({ code: "not_found" });

    await expect(
      remove.execute({ actor: counselor, entryId: "no-such-id" }),
    ).rejects.toMatchObject({ code: "not_found" });
  });

  it("AC-3: overlap conflict is checked after authorization", async () => {
    const users = await makeUsers();
    const fakes = createPlanningFakes();
    const create = new CreateScheduleEntryUseCase(users, fakes.schedule);

    await create.execute({
      actor: counselor,
      studentId: student.id,
      ...entryInput,
    });

    // A student cannot even reach the conflict check: authorization wins.
    await expect(
      create.execute({
        actor: student,
        studentId: student.id,
        dayOfWeek: 0,
        startMinute: 500,
        endMinute: 560,
        subject: "fizik",
      }),
    ).rejects.toMatchObject({ code: "forbidden" });

    await expect(
      create.execute({
        actor: counselor,
        studentId: student.id,
        dayOfWeek: 0,
        startMinute: 500,
        endMinute: 560,
        subject: "fizik",
      }),
    ).rejects.toMatchObject({ code: "schedule_conflict" });

    const touching = await create.execute({
      actor: counselor,
      studentId: student.id,
      dayOfWeek: 0,
      startMinute: 540,
      endMinute: 600,
      subject: "fizik",
    });
    expect(touching.endMinute).toBe(600);
    expect(fakes.schedule.writes).toBe(2);
  });

  it("AC-3: update excludes the edited row from the overlap check", async () => {
    const users = await makeUsers();
    const fakes = createPlanningFakes();
    const create = new CreateScheduleEntryUseCase(users, fakes.schedule);
    const update = new UpdateScheduleEntryUseCase(users, fakes.schedule);

    const entry = await create.execute({
      actor: counselor,
      studentId: student.id,
      ...entryInput,
    });

    const changed = await update.execute({
      actor: counselor,
      entryId: entry.id,
      dayOfWeek: 0,
      startMinute: 500,
      endMinute: 560,
      subject: "riazi",
    });
    expect(changed.startMinute).toBe(500);
  });

  it("AC-3: schedule conflict stays a 409 domain error", () => {
    const err = new ScheduleConflictError();
    expect(err.code).toBe("schedule_conflict");
    expect(err.status).toBe(409);
  });

  it("reads: own student for counselor, self for student, supervision for admin", async () => {
    const users = await makeUsers();
    const fakes = createPlanningFakes();
    const create = new CreateScheduleEntryUseCase(users, fakes.schedule);
    const list = new ListWeeklyScheduleUseCase(users, fakes.schedule);

    await create.execute({ actor: counselor, studentId: student.id, ...entryInput });

    expect(
      await list.execute({ actor: counselor, studentId: student.id }),
    ).toHaveLength(1);
    expect(await list.execute({ actor: student })).toHaveLength(1);
    expect(
      await list.execute({ actor: admin, studentId: student.id }),
    ).toHaveLength(1);

    await expect(
      list.execute({ actor: foreignCounselor, studentId: student.id }),
    ).rejects.toMatchObject({ code: "forbidden" });
  });
});
