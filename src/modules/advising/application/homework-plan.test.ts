import { describe, expect, it } from "vitest";

import { createPlanningFakes, type PlanningFakes } from "../../../../test/fakes/planning";
import {
  DeleteHomeworkPlanUseCase,
  PlanHomeworkTimeUseCase,
} from "@/modules/advising/application/homework-plan";
import type { Actor } from "@/modules/advising/application/planning-access";

const student: Actor = { id: "s1", role: "student" };
const counselor: Actor = { id: "c1", role: "counselor" };
const DAY = "2026-11-25"; // deadline day friendly date

function seedHomework(
  fakes: PlanningFakes,
  deadline = "2026-11-25T12:00:00Z", // Iran day 2026-11-25
) {
  return fakes.homework.create({
    studentId: student.id,
    title: "ریاضی",
    priority: 2,
    deadline: new Date(deadline),
  });
}

describe("homework plan use cases", () => {
  it("plan minutes within capacity is stored", async () => {
    const fakes = createPlanningFakes();
    fakes.budget.seed(student.id, DAY, 300);
    const task = await seedHomework(fakes);
    const plan = new PlanHomeworkTimeUseCase(fakes.homework, fakes.plans);

    const result = await plan.execute({
      actor: student,
      homeworkId: task.id,
      dayKey: DAY,
      plannedMinutes: 120,
    });

    expect(result).toEqual({ homeworkId: task.id, dayKey: DAY, plannedMinutes: 120 });
    const rows = await fakes.plans.listByDay(student.id, DAY);
    expect(rows).toHaveLength(1);
    expect(rows[0].plannedMinutes).toBe(120);
    expect(fakes.plans.writes).toBe(1);
  });

  it("plan minutes over capacity is rejected", async () => {
    const fakes = createPlanningFakes();
    fakes.budget.seed(student.id, DAY, 120);
    const task = await seedHomework(fakes);
    const plan = new PlanHomeworkTimeUseCase(fakes.homework, fakes.plans);

    const rejection = plan.execute({
      actor: student,
      homeworkId: task.id,
      dayKey: DAY,
      plannedMinutes: 180,
    });

    await expect(rejection).rejects.toMatchObject({
      code: "plan_over_capacity",
      status: 409,
      message: "۳ ساعت از ۲ ساعت",
    });
    expect(fakes.plans.writes).toBe(0);
    expect(await fakes.plans.listByDay(student.id, DAY)).toHaveLength(0);
  });

  it("plan upsert replaces the same task day", async () => {
    const fakes = createPlanningFakes();
    fakes.budget.seed(student.id, DAY, 300);
    const task = await seedHomework(fakes);
    const plan = new PlanHomeworkTimeUseCase(fakes.homework, fakes.plans);

    await plan.execute({ actor: student, homeworkId: task.id, dayKey: DAY, plannedMinutes: 60 });
    await plan.execute({ actor: student, homeworkId: task.id, dayKey: DAY, plannedMinutes: 90 });

    const rows = await fakes.plans.listByDay(student.id, DAY);
    expect(rows).toHaveLength(1);
    expect(rows[0].plannedMinutes).toBe(90);
  });

  it("plan after the homework deadline is rejected", async () => {
    const fakes = createPlanningFakes();
    fakes.budget.seed(student.id, "2026-11-26", 300);
    const task = await seedHomework(fakes);
    const plan = new PlanHomeworkTimeUseCase(fakes.homework, fakes.plans);

    await expect(
      plan.execute({
        actor: student,
        homeworkId: task.id,
        dayKey: "2026-11-26",
        plannedMinutes: 60,
      }),
    ).rejects.toMatchObject({ code: "plan_after_deadline", status: 400 });
    expect(fakes.plans.writes).toBe(0);
  });

  it("plan on the deadline day is accepted", async () => {
    const fakes = createPlanningFakes();
    fakes.budget.seed(student.id, DAY, 120);
    const task = await seedHomework(fakes);
    const plan = new PlanHomeworkTimeUseCase(fakes.homework, fakes.plans);

    const result = await plan.execute({
      actor: student,
      homeworkId: task.id,
      dayKey: DAY,
      plannedMinutes: 60,
    });

    expect(result.dayKey).toBe(DAY);
    expect(fakes.plans.writes).toBe(1);
  });

  it("plan for a completed homework is rejected", async () => {
    const fakes = createPlanningFakes();
    fakes.budget.seed(student.id, DAY, 300);
    const task = await seedHomework(fakes);
    await fakes.homework.setCompletion(task.id, { completedAt: new Date(), spentMinutes: null });
    const plan = new PlanHomeworkTimeUseCase(fakes.homework, fakes.plans);

    await expect(
      plan.execute({ actor: student, homeworkId: task.id, dayKey: DAY, plannedMinutes: 60 }),
    ).rejects.toMatchObject({ code: "homework_completed", status: 409 });
    expect(fakes.plans.writes).toBe(0);
  });

  it("plan on a day without budget is rejected", async () => {
    const fakes = createPlanningFakes();
    const task = await seedHomework(fakes);
    const plan = new PlanHomeworkTimeUseCase(fakes.homework, fakes.plans);

    await expect(
      plan.execute({ actor: student, homeworkId: task.id, dayKey: DAY, plannedMinutes: 60 }),
    ).rejects.toMatchObject({ code: "plan_over_capacity", status: 409 });
    expect(fakes.plans.writes).toBe(0);
  });

  it("two tasks share one day capacity", async () => {
    const fakes = createPlanningFakes();
    fakes.budget.seed(student.id, DAY, 180);
    const first = await seedHomework(fakes);
    const second = await fakes.homework.create({
      studentId: student.id,
      title: "فیزیک",
      priority: 2,
      deadline: new Date("2026-11-25T12:00:00Z"),
    });
    const plan = new PlanHomeworkTimeUseCase(fakes.homework, fakes.plans);

    await plan.execute({ actor: student, homeworkId: first.id, dayKey: DAY, plannedMinutes: 120 });

    await expect(
      plan.execute({
        actor: student,
        homeworkId: second.id,
        dayKey: DAY,
        plannedMinutes: 120,
      }),
    ).rejects.toMatchObject({ code: "plan_over_capacity", message: "۴ ساعت از ۳ ساعت" });

    const rows = await fakes.plans.listByDay(student.id, DAY);
    expect(rows).toHaveLength(1);
    expect(rows[0].plannedMinutes).toBe(120);
  });

  it("counselor cannot plan a student homework", async () => {
    const fakes = createPlanningFakes();
    fakes.budget.seed(student.id, DAY, 300);
    const task = await seedHomework(fakes);
    const plan = new PlanHomeworkTimeUseCase(fakes.homework, fakes.plans);

    await expect(
      plan.execute({
        actor: counselor,
        homeworkId: task.id,
        dayKey: DAY,
        plannedMinutes: 60,
      }),
    ).rejects.toMatchObject({ code: "forbidden", status: 403 });
    expect(fakes.plans.writes).toBe(0);
  });

  it("delete plan entry clears the row", async () => {
    const fakes = createPlanningFakes();
    fakes.budget.seed(student.id, DAY, 300);
    const task = await seedHomework(fakes);
    const plan = new PlanHomeworkTimeUseCase(fakes.homework, fakes.plans);
    const remove = new DeleteHomeworkPlanUseCase(fakes.plans);

    await plan.execute({ actor: student, homeworkId: task.id, dayKey: DAY, plannedMinutes: 60 });
    const [row] = await fakes.plans.listByDay(student.id, DAY);

    // A row owned by another student is untouched and the call 404s (IDOR closed).
    fakes.budget.seed("s2", DAY, 300);
    const foreign = fakes.plans.seed("s2", DAY, "hw-foreign", 30);
    await expect(
      remove.execute({ actor: student, id: foreign.id }),
    ).rejects.toMatchObject({ code: "not_found" });
    expect(await fakes.plans.listByDay("s2", DAY)).toHaveLength(1);

    await remove.execute({ actor: student, id: row.id });

    expect(await fakes.plans.listByDay(student.id, DAY)).toHaveLength(0);
  });
});
