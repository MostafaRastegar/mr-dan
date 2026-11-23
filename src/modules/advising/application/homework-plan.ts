/**
 * Per-date homework planning use cases.
 *
 * Write order: capability + ownership → homework row (404, 403, completed,
 * deadline) → repository capacity guard. `dayKey` is an Iran calendar date, so
 * a plain string compare with `iranDayKey(deadline)` is date-safe.
 */

import {
  ForbiddenError,
  HomeworkCompletedError,
  NotFoundError,
  PlanAfterDeadlineError,
  PlanOverCapacityError,
} from "@/modules/advising/domain/errors";
import {
  assertPlanWrite,
  type Actor,
} from "@/modules/advising/application/planning-access";
import { iranDayKey } from "@/modules/advising/domain/day-key";
import { dayCapacity, durationMessage, fitsCapacity } from "@/modules/advising/domain/free-time";
import type {
  HomeworkPlanRepositoryPort,
  HomeworkRepositoryPort,
} from "@/modules/advising/domain/ports";

export class PlanHomeworkTimeUseCase {
  constructor(
    private readonly homework: HomeworkRepositoryPort,
    private readonly plans: HomeworkPlanRepositoryPort,
  ) {}

  async execute(input: {
    actor: Actor;
    homeworkId: string;
    dayKey: string;
    plannedMinutes: number;
  }): Promise<{ homeworkId: string; dayKey: string; plannedMinutes: number }> {
    assertPlanWrite(input.actor, "homework:write", input.actor.id);

    const item = await this.homework.findById(input.homeworkId);
    if (!item) throw new NotFoundError("homework");
    if (item.studentId !== input.actor.id) throw new ForbiddenError();
    if (item.completedAt !== null) throw new HomeworkCompletedError();
    if (input.dayKey > iranDayKey(item.deadline)) throw new PlanAfterDeadlineError();

    const result = await this.plans.upsertWithinCapacity({
      studentId: input.actor.id,
      homeworkId: input.homeworkId,
      dayKey: input.dayKey,
      plannedMinutes: input.plannedMinutes,
      allows: ({ freeMinutes, usedMinutes }) =>
        fitsCapacity(dayCapacity(freeMinutes, usedMinutes), input.plannedMinutes),
    });
    if (!result.ok) {
      throw new PlanOverCapacityError(
        durationMessage(result.usedMinutes + input.plannedMinutes, result.freeMinutes ?? 0),
      );
    }
    return {
      homeworkId: result.entry.homeworkId,
      dayKey: result.entry.dayKey,
      plannedMinutes: result.entry.plannedMinutes,
    };
  }
}

export class DeleteHomeworkPlanUseCase {
  constructor(private readonly plans: HomeworkPlanRepositoryPort) {}

  async execute(input: { actor: Actor; id: string }): Promise<void> {
    assertPlanWrite(input.actor, "homework:write", input.actor.id);

    // The port is student-scoped, so a foreign id deletes nothing and 404s.
    await this.plans.delete({ id: input.id, studentId: input.actor.id });
  }
}
