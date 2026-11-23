import { describe, expect, it } from "vitest";

import {
  createPlanningFakes,
} from "../../../../test/fakes/planning";
import { FakeUserRepository } from "../../../../test/fakes/advising";
import {
  CreateScheduleEntryUseCase,
  DeleteScheduleEntryUseCase,
  ListWeeklyScheduleUseCase,
  UpdateScheduleEntryUseCase,
} from "@/modules/advising/application/schedule";
import { ScheduleConflictError } from "@/modules/advising/domain/errors";
import type { Actor } from "@/modules/advising/application/planning-access";

const counselor = { id: "c1", role: "counselor" as const };
const student = { id: "s1", role: "student" as const };
const otherCounselor = { id: "c2", role: "counselor" as const };

function actorOf(user: { id: string; role: "student" | "counselor" }): Actor {
  return { id: user.id, role: user.role };
}

function studentOfCounselor(counselorId: string) {
  return { id: `student-of-${counselorId}`, role: "student" as const, counselorId };
}

describe("schedule use cases", () => {
  it("counselor writes own plan", async () => {
    const fakes = createPlanningFakes();
    const users = new FakeUserRepository({ groupNames: new Map(), groupCounts: new Map() });
    await users.create({
      id: counselor.id,
      username: "counselor",
      email: null,
      role: "counselor",
      fullName: "مشاور",
      grade: null,
      fieldOfStudy: null,
      schoolName: null,
      groupId: null,
      counselorId: null,
      passwordHash: "x",
    });

    const list = new ListWeeklyScheduleUseCase(users, fakes.schedule);
    const create = new CreateScheduleEntryUseCase(fakes.schedule);

    const entry = await create.execute({
      actor: actorOf(counselor),
      dayOfWeek: 0,
      startMinute: 480,
      endMinute: 540,
      subject: "riazi",
    });

    expect(entry.studentId).toBe(counselor.id);
    const listed = await list.execute({ actor: actorOf(counselor) });
    expect(listed).toHaveLength(1);
    expect(listed[0].id).toBe(entry.id);
  });

  it("counselor cannot write others", async () => {
    const fakes = createPlanningFakes();
    const create = new CreateScheduleEntryUseCase(fakes.schedule);

    await expect(
      create.execute({
        actor: actorOf(counselor),
        studentId: "someone-else",
        dayOfWeek: 0,
        startMinute: 480,
        endMinute: 540,
        subject: "riazi",
      }),
    ).rejects.toMatchObject({ code: "forbidden" });

    expect(fakes.schedule.writes).toBe(0);
  });

  it("another counselor's student", async () => {
    const fakes = createPlanningFakes();
    const users = new FakeUserRepository({ groupNames: new Map(), groupCounts: new Map() });
    const foreign = studentOfCounselor(otherCounselor.id);
    await users.create({
      id: counselor.id,
      username: "counselor",
      email: null,
      role: "counselor",
      fullName: "مشاور",
      grade: null,
      fieldOfStudy: null,
      schoolName: null,
      groupId: null,
      counselorId: null,
      passwordHash: "x",
    });
    await users.create({
      id: foreign.id,
      username: foreign.id,
      email: null,
      role: "student",
      fullName: "دانش‌آموز دیگر",
      grade: null,
      fieldOfStudy: null,
      schoolName: null,
      groupId: null,
      counselorId: otherCounselor.id,
      passwordHash: "x",
    });

    const list = new ListWeeklyScheduleUseCase(users, fakes.schedule);

    await expect(
      list.execute({ actor: actorOf(counselor), studentId: foreign.id }),
    ).rejects.toMatchObject({ code: "forbidden" });
  });

  it("duplicate weekly slot", async () => {
    const fakes = createPlanningFakes();
    const create = new CreateScheduleEntryUseCase(fakes.schedule);

    await create.execute({
      actor: actorOf(student),
      dayOfWeek: 0,
      startMinute: 480,
      endMinute: 540,
      subject: "riazi",
    });

    await expect(
      create.execute({
        actor: actorOf(student),
        studentId: student.id,
        dayOfWeek: 0,
        startMinute: 480,
        endMinute: 540,
        subject: "fizik",
      }),
    ).rejects.toMatchObject({ code: "schedule_conflict" });
  });

  it("overlapping entry", async () => {
    const fakes = createPlanningFakes();
    const create = new CreateScheduleEntryUseCase(fakes.schedule);

    await create.execute({
      actor: actorOf(student),
      studentId: student.id,
      dayOfWeek: 0,
      startMinute: 480,
      endMinute: 540,
      subject: "riazi",
    });

    await expect(
      create.execute({
        actor: actorOf(student),
        studentId: student.id,
        dayOfWeek: 0,
        startMinute: 500,
        endMinute: 560,
        subject: "fizik",
      }),
    ).rejects.toMatchObject({ code: "schedule_conflict" });

    expect(fakes.schedule.writes).toBe(1);
  });

  it("touching intervals", async () => {
    const fakes = createPlanningFakes();
    const create = new CreateScheduleEntryUseCase(fakes.schedule);

    await create.execute({
      actor: actorOf(student),
      studentId: student.id,
      dayOfWeek: 0,
      startMinute: 480,
      endMinute: 540,
      subject: "riazi",
    });

    const second = await create.execute({
      actor: actorOf(student),
      studentId: student.id,
      dayOfWeek: 0,
      startMinute: 540,
      endMinute: 600,
      subject: "fizik",
    });

    expect(second.endMinute).toBe(600);
  });

  it("unknown entry", async () => {
    const fakes = createPlanningFakes();
    const update = new UpdateScheduleEntryUseCase(fakes.schedule);
    const del = new DeleteScheduleEntryUseCase(fakes.schedule);

    await expect(
      update.execute({
        actor: actorOf(student),
        entryId: "no-such-id",
        dayOfWeek: 0,
        startMinute: 480,
        endMinute: 540,
        subject: "riazi",
      }),
    ).rejects.toMatchObject({ code: "not_found" });

    await expect(
      del.execute({ actor: actorOf(student), entryId: "no-such-id" }),
    ).rejects.toMatchObject({ code: "not_found" });
  });

  it("schedule conflict is a domain error", () => {
    const err = new ScheduleConflictError();
    expect(err.code).toBe("schedule_conflict");
    expect(err.status).toBe(409);
  });
});
