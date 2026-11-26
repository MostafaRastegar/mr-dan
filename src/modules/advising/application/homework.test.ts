import { describe, expect, it } from "vitest";

import { createPlanningFakes } from "../../../../test/fakes/planning";
import { FakeUserRepository } from "../../../../test/fakes/advising";
import {
  CreateHomeworkUseCase,
  DeleteHomeworkUseCase,
  ListHomeworkUseCase,
  SetHomeworkCompletionUseCase,
} from "@/modules/advising/application/homework";
import type { Actor } from "@/modules/advising/application/planning-access";

const student = { id: "s1", role: "student" as const };
const counselor = { id: "c1", role: "counselor" as const };

function actorOf(user: { id: string; role: "student" | "counselor" }): Actor {
  return { id: user.id, role: user.role };
}

function makeUsers() {
  return new FakeUserRepository({ groupNames: new Map(), groupCounts: new Map() });
}

async function seedUser(users: FakeUserRepository, id: string, role: "student" | "counselor", counselorId: string | null = null) {
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

describe("homework use cases", () => {
  it("create/list filters", async () => {
    const users = makeUsers();
    await seedUser(users, student.id, "student");
    const fakes = createPlanningFakes();
    const list = new ListHomeworkUseCase(users, fakes.homework);
    const create = new CreateHomeworkUseCase(fakes.homework);

    await create.execute({
      actor: actorOf(student),
      studentId: student.id,
      title: "رياضيات",
      subject: "riazi",
      priority: 3,
      deadline: new Date("2026-11-25T20:30:00Z"),
    });
    await create.execute({
      actor: actorOf(student),
      studentId: student.id,
      title: "فیزیک",
      subject: null,
      priority: 1,
      deadline: new Date("2026-11-24T20:30:00Z"),
    });

    const all = await list.execute({ actor: actorOf(student), studentId: student.id });
    expect(all.items).toHaveLength(2);
    expect(all.total).toBe(2);

    const paged = await list.execute({
      actor: actorOf(student),
      studentId: student.id,
      page: "1",
    });
    expect(paged.items).toHaveLength(2);
    expect(paged.page).toBe(1);
    expect(paged.pageSize).toBe(10);

    const pending = await list.execute({
      actor: actorOf(student),
      studentId: student.id,
      filter: "pending",
    });
    expect(pending.items).toHaveLength(2);

    await fakes.homework.setCompletion(all.items[0].id, { completedAt: new Date(), spentMinutes: null });
    const done = await list.execute({
      actor: actorOf(student),
      studentId: student.id,
      filter: "done",
    });
    expect(done.items).toHaveLength(1);
  });

  it("toggle sets then clears completedAt", async () => {
    const users = makeUsers();
    await seedUser(users, student.id, "student");
    const fakes = createPlanningFakes();
    const create = new CreateHomeworkUseCase(fakes.homework);
    const toggle = new SetHomeworkCompletionUseCase(fakes.homework);

    const item = await create.execute({
      actor: actorOf(student),
      studentId: student.id,
      title: "تکلیف",
      subject: null,
      priority: 2,
      deadline: new Date("2026-11-25T20:30:00Z"),
    });
    expect(item.completedAt).toBeNull();

    const done = await toggle.execute({
      actor: actorOf(student),
      homeworkId: item.id,
      completed: true,
      spentMinutes: 30,
    });
    expect(done.completedAt).not.toBeNull();

    const undone = await toggle.execute({
      actor: actorOf(student),
      homeworkId: item.id,
      completed: false,
    });
    expect(undone.completedAt).toBeNull();
  });

  it("foreign row → 403", async () => {
    const users = makeUsers();
    await seedUser(users, student.id, "student");
    const fakes = createPlanningFakes();
    const create = new CreateHomeworkUseCase(fakes.homework);
    const del = new DeleteHomeworkUseCase(fakes.homework);

    const item = await create.execute({
      actor: actorOf(student),
      studentId: student.id,
      title: "تکلیف",
      subject: null,
      priority: 2,
      deadline: new Date("2026-11-25T20:30:00Z"),
    });

    // another student tries to delete
    const other = { id: "s2", role: "student" as const };
    await seedUser(users, other.id, "student");

    await expect(
      del.execute({ actor: actorOf(other), homeworkId: item.id }),
    ).rejects.toMatchObject({ code: "forbidden" });

    expect(fakes.homework.writes).toBe(1); // only the create happened
  });

  it("counselor cannot write own student's row", async () => {
    const users = makeUsers();
    await seedUser(users, counselor.id, "counselor");
    await seedUser(users, student.id, "student", counselor.id);
    const fakes = createPlanningFakes();
    const create = new CreateHomeworkUseCase(fakes.homework);

    await expect(
      create.execute({
        actor: actorOf(counselor),
        studentId: student.id,
        title: "تکلیف",
        subject: null,
        priority: 2,
        deadline: new Date("2026-11-25T20:30:00Z"),
      }),
    ).rejects.toMatchObject({ code: "forbidden" });

    expect(fakes.homework.writes).toBe(0);
  });

  it("unknown homework → not_found", async () => {
    const fakes = createPlanningFakes();
    const toggle = new SetHomeworkCompletionUseCase(fakes.homework);

    await expect(
      toggle.execute({ actor: actorOf(student), homeworkId: "nope", completed: true }),
    ).rejects.toMatchObject({ code: "not_found" });
  });

  it("AC-24: homework spent minutes (tick with 45 minutes → spentMinutes 45 and completedAt set)", async () => {
    const users = makeUsers();
    await seedUser(users, student.id, "student");
    const fakes = createPlanningFakes();
    const create = new CreateHomeworkUseCase(fakes.homework);
    const toggle = new SetHomeworkCompletionUseCase(fakes.homework);

    const item = await create.execute({
      actor: actorOf(student),
      studentId: student.id,
      title: "تکلیف",
      subject: null,
      priority: 2,
      deadline: new Date("2026-11-25T20:30:00Z"),
    });

    const done = await toggle.execute({
      actor: actorOf(student),
      homeworkId: item.id,
      completed: true,
      spentMinutes: 45,
    });
    expect(done.spentMinutes).toBe(45);
    expect(done.completedAt).not.toBeNull();
  });

  it("AC-24: homework spent minutes (tick without minutes → rejected, completedAt stays null)", async () => {
    const users = makeUsers();
    await seedUser(users, student.id, "student");
    const fakes = createPlanningFakes();
    const create = new CreateHomeworkUseCase(fakes.homework);
    const toggle = new SetHomeworkCompletionUseCase(fakes.homework);

    const item = await create.execute({
      actor: actorOf(student),
      studentId: student.id,
      title: "تکلیف",
      subject: null,
      priority: 2,
      deadline: new Date("2026-11-25T20:30:00Z"),
    });

    await expect(
      toggle.execute({ actor: actorOf(student), homeworkId: item.id, completed: true }),
    ).rejects.toMatchObject({ code: "invalid_input" });

    const stillPending = await fakes.homework.findById(item.id);
    expect(stillPending?.completedAt).toBeNull();
    expect(stillPending?.spentMinutes).toBeNull();
  });

  it("AC-24: homework spent minutes (tick with 1441 minutes → rejected, completedAt stays null)", async () => {
    const users = makeUsers();
    await seedUser(users, student.id, "student");
    const fakes = createPlanningFakes();
    const create = new CreateHomeworkUseCase(fakes.homework);
    const toggle = new SetHomeworkCompletionUseCase(fakes.homework);

    const item = await create.execute({
      actor: actorOf(student),
      studentId: student.id,
      title: "تکلیف",
      subject: null,
      priority: 2,
      deadline: new Date("2026-11-25T20:30:00Z"),
    });

    await expect(
      toggle.execute({
        actor: actorOf(student),
        homeworkId: item.id,
        completed: true,
        spentMinutes: 1441,
      }),
    ).rejects.toMatchObject({ code: "invalid_input" });

    const stillPending = await fakes.homework.findById(item.id);
    expect(stillPending?.completedAt).toBeNull();
    expect(stillPending?.spentMinutes).toBeNull();
  });

  it("AC-24: homework spent minutes (untick clears completedAt and spentMinutes)", async () => {
    const users = makeUsers();
    await seedUser(users, student.id, "student");
    const fakes = createPlanningFakes();
    const create = new CreateHomeworkUseCase(fakes.homework);
    const toggle = new SetHomeworkCompletionUseCase(fakes.homework);

    const item = await create.execute({
      actor: actorOf(student),
      studentId: student.id,
      title: "تکلیف",
      subject: null,
      priority: 2,
      deadline: new Date("2026-11-25T20:30:00Z"),
    });

    await toggle.execute({
      actor: actorOf(student),
      homeworkId: item.id,
      completed: true,
      spentMinutes: 45,
    });

    const undone = await toggle.execute({
      actor: actorOf(student),
      homeworkId: item.id,
      completed: false,
    });
    expect(undone.completedAt).toBeNull();
    expect(undone.spentMinutes).toBeNull();
  });
});
