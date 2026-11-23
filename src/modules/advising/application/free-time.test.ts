import { describe, expect, it } from "vitest";

import { createPlanningFakes } from "../../../../test/fakes/planning";
import {
  GetDayBudgetUseCase,
  SetFreeTimeBudgetUseCase,
} from "@/modules/advising/application/free-time";
import type { Actor } from "@/modules/advising/application/planning-access";

const student: Actor = { id: "s1", role: "student" };
const counselor: Actor = { id: "c1", role: "counselor" };
const DAY = "2026-11-25"; // Wednesday → Persian weekday 4 (چهارشنبه)
const WEDNESDAY = 4;

function dayBudgetOf(fakes: ReturnType<typeof createPlanningFakes>) {
  return new GetDayBudgetUseCase(
    fakes.schedule,
    fakes.homework,
    fakes.budget,
    fakes.plans,
  );
}

describe("free-time budget use cases", () => {
  it("set free time stores minutes", async () => {
    const fakes = createPlanningFakes();
    const set = new SetFreeTimeBudgetUseCase(fakes.budget);

    const result = await set.execute({ actor: student, dayKey: DAY, freeMinutes: 120 });

    expect(result).toEqual({ dayKey: DAY, freeMinutes: 120 });
    expect((await fakes.budget.findByDay(student.id, DAY))?.freeMinutes).toBe(120);
  });

  it("set free time falls back to the weekly suggestion", async () => {
    const fakes = createPlanningFakes();
    await fakes.schedule.create({
      studentId: student.id,
      dayOfWeek: WEDNESDAY,
      startMinute: 480,
      endMinute: 780,
      subject: "riazi",
    });
    const get = dayBudgetOf(fakes);
    const set = new SetFreeTimeBudgetUseCase(fakes.budget);

    const day = await get.execute({ actor: student, dayKey: DAY });
    expect(day.suggestedMinutes).toBe(540); // 14h − 5h classes

    await set.execute({ actor: student, dayKey: DAY, freeMinutes: day.suggestedMinutes });
    expect((await fakes.budget.findByDay(student.id, DAY))?.freeMinutes).toBe(540);
  });

  it("set free time below planned is rejected", async () => {
    const fakes = createPlanningFakes();
    fakes.budget.seed(student.id, DAY, 300);
    fakes.plans.seed(student.id, DAY, "homework-1", 180);
    const set = new SetFreeTimeBudgetUseCase(fakes.budget);

    await expect(
      set.execute({ actor: student, dayKey: DAY, freeMinutes: 120 }),
    ).rejects.toMatchObject({ code: "free_time_below_planned", status: 409 });

    expect(fakes.budget.writes).toBe(0);
    expect((await fakes.budget.findByDay(student.id, DAY))?.freeMinutes).toBe(300);
  });

  it("set free time allows an exact match", async () => {
    const fakes = createPlanningFakes();
    fakes.budget.seed(student.id, DAY, 300);
    fakes.plans.seed(student.id, DAY, "homework-1", 300);
    const set = new SetFreeTimeBudgetUseCase(fakes.budget);

    const result = await set.execute({ actor: student, dayKey: DAY, freeMinutes: 300 });

    expect(result.freeMinutes).toBe(300);
    expect(fakes.budget.writes).toBe(1);
  });

  it("day budget reports used and remaining", async () => {
    const fakes = createPlanningFakes();
    fakes.budget.seed(student.id, DAY, 300);
    const task = await fakes.homework.create({
      studentId: student.id,
      title: "ریاضی",
      priority: 2,
      deadline: new Date("2026-11-25T12:00:00Z"),
    });
    fakes.plans.seed(student.id, DAY, task.id, 120);
    fakes.plans.seed(student.id, DAY, "homework-other", 60);

    const day = await dayBudgetOf(fakes).execute({ actor: student, dayKey: DAY });

    expect(day).toMatchObject({
      dayKey: DAY,
      freeMinutes: 300,
      suggestedMinutes: 840,
      usedMinutes: 180,
      remainingMinutes: 120,
    });
    expect(day.plans).toHaveLength(2);
    expect(day.plans[0].title).toBe("ریاضی");
  });

  it("day budget lists pending candidates only", async () => {
    const fakes = createPlanningFakes();
    const soon = await fakes.homework.create({
      studentId: student.id,
      title: "ریاضی",
      priority: 2,
      deadline: new Date("2026-11-26T12:00:00Z"),
    });
    const later = await fakes.homework.create({
      studentId: student.id,
      title: "فیزیک",
      priority: 2,
      deadline: new Date("2026-11-27T12:00:00Z"),
    });
    await fakes.homework.create({
      studentId: student.id,
      title: "گذشته",
      priority: 2,
      deadline: new Date("2026-11-24T12:00:00Z"),
    });
    const done = await fakes.homework.create({
      studentId: student.id,
      title: "تمام‌شده",
      priority: 2,
      deadline: new Date("2026-11-28T12:00:00Z"),
    });
    await fakes.homework.setCompletedAt(done.id, new Date());

    const day = await dayBudgetOf(fakes).execute({ actor: student, dayKey: DAY });

    expect(day.candidates.map((candidate) => candidate.id).sort()).toEqual(
      [soon.id, later.id].sort(),
    );
  });

  it("counselor cannot write a student budget", async () => {
    const fakes = createPlanningFakes();
    fakes.budget.seed(student.id, DAY, 300);
    const set = new SetFreeTimeBudgetUseCase(fakes.budget);

    await expect(
      set.execute({
        actor: counselor,
        studentId: student.id,
        dayKey: DAY,
        freeMinutes: 120,
      }),
    ).rejects.toMatchObject({ code: "forbidden", status: 403 });

    expect(fakes.budget.writes).toBe(0);
    expect((await fakes.budget.findByDay(student.id, DAY))?.freeMinutes).toBe(300);
  });
});
