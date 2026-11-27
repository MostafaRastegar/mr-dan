import { describe, expect, it } from "vitest";

import {
  AddTestsDoneUseCase,
  GetWeeklyGoalUseCase,
  ToggleStudyBlockUseCase,
} from "@/modules/advising/application/weekly-goal";
import { FakeWeeklyGoalRepository } from "../../../../test/fakes/weekly-goal";
import type { Actor } from "@/modules/advising/application/planning-access";

const actor: Actor = { id: "s1", role: "student" };

function repoWith(goal: any = {}) {
  const repo = new FakeWeeklyGoalRepository();
  if (goal.studentId) {
    repo.seed({
      id: "g1",
      studentId: goal.studentId,
      weekKey: goal.weekKey,
      testsDone: 0,
      completedBlocks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...goal,
    });
  }
  return repo;
}
describe("weekly goal use cases", () => {
  it("no plan → GetWeeklyGoalUseCase returns null (0/0, percent 0)", async () => {
    const repo = new FakeWeeklyGoalRepository();
    const get = new GetWeeklyGoalUseCase(repo);

    const goal = await get.execute({ actor, weekKey: "2026-11-21" });
    expect(goal).toBeNull();
  });
  it("toggle adds one block key", async () => {
    const repo = repoWith({
      studentId: "s1",
      weekKey: "2026-11-21",
      completedBlocks: [],
    });
    const toggled = await new ToggleStudyBlockUseCase(repo).execute({
      actor,
      dayKey: "2026-11-21",
      startMinute: 480,
      minutes: 50,
      completed: true,
    });
    expect(toggled.completedBlocks).toEqual(["2026-11-21:480:50"]);
  });

  it("toggling the same block twice keeps one key", async () => {
    const repo = repoWith({
      studentId: "s1",
      weekKey: "2026-11-21",
      completedBlocks: [],
    });
    const useCase = new ToggleStudyBlockUseCase(repo);
    await useCase.execute({
      actor,
      dayKey: "2026-11-21",
      startMinute: 480,
      minutes: 50,
      completed: true,
    });
    await useCase.execute({
      actor,
      dayKey: "2026-11-21",
      startMinute: 480,
      minutes: 50,
      completed: true,
    });
    const final = await repo.findByKey("s1", "2026-11-21");
    expect(final?.completedBlocks).toEqual(["2026-11-21:480:50"]);
  });

  it("toggle off removes the key", async () => {
    const repo = repoWith({
      studentId: "s1",
      weekKey: "2026-11-21",
      completedBlocks: ["2026-11-21:480:50"],
    });
    await new ToggleStudyBlockUseCase(repo).execute({
      actor,
      dayKey: "2026-11-21",
      startMinute: 480,
      minutes: 50,
      completed: false,
    });
    const final = await repo.findByKey("s1", "2026-11-21");
    expect(final?.completedBlocks).toEqual([]);
  });

  it("testsDone accumulates across calls", async () => {
    const repo = repoWith({
      studentId: "s1",
      weekKey: "2026-11-21",
      testsDone: 0,
    });
    const useCase = new AddTestsDoneUseCase(repo);

    const first = await useCase.execute({ actor, studentId: "s1", delta: 10 });
    expect(first.testsDone).toBe(10);

    const second = await useCase.execute({ actor, studentId: "s1", delta: 5 });
    expect(second.testsDone).toBe(15);
  });

  it("rejects another student's row as forbidden", async () => {
    const repo = repoWith({
      studentId: "s1",
      weekKey: "2026-11-21",
    });
    await expect(
      new AddTestsDoneUseCase(repo).execute({
        actor: { id: "s2", role: "student" },
        studentId: "s1",
        delta: 5,
      }),
    ).rejects.toMatchObject({ code: "forbidden" });
  });
});

describe("weekly goal is a student self-feature", () => {
  it("AC-7: counselor and admin toggles are forbidden", async () => {
    const repo = repoWith({
      studentId: "s1",
      weekKey: "2026-11-21",
      completedBlocks: [],
    });
    const useCase = new ToggleStudyBlockUseCase(repo);

    for (const actor of [
      { id: "c1", role: "counselor" as const },
      { id: "a1", role: "admin" as const },
    ]) {
      await expect(
        useCase.execute({
          actor,
          studentId: "s1",
          dayKey: "2026-11-21",
          startMinute: 480,
          minutes: 50,
          completed: true,
        }),
      ).rejects.toMatchObject({ code: "forbidden" });
    }
  });

  it("AC-7: counselor and admin test increments are forbidden", async () => {
    const repo = repoWith({ studentId: "s1", weekKey: "2026-11-21" });
    const useCase = new AddTestsDoneUseCase(repo);

    for (const actor of [
      { id: "c1", role: "counselor" as const },
      { id: "a1", role: "admin" as const },
    ]) {
      await expect(
        useCase.execute({ actor, studentId: "s1", delta: 5 }),
      ).rejects.toMatchObject({ code: "forbidden" });
    }
  });
});
