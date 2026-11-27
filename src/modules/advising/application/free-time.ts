/**
 * Daily free-time budget use cases.
 *
 * Write: assertPlanWrite (capability + ownership) → repository guard, so the
 * used-minutes check and the write share one transaction. Read: assertPlanRead
 * on the target student (self, counselor-of-record or read-only supervisor).
 * The pure math lives in `domain/free-time.ts`.
 */

import { FreeTimeBelowPlannedError } from "@/modules/advising/domain/errors";
import {
  assertPlanRead,
  assertPlanWrite,
  type Actor,
} from "@/modules/advising/application/planning-access";
import { iranDayKey, persianDayOf } from "@/modules/advising/domain/day-key";
import {
  dayCapacity,
  durationMessage,
  suggestFreeMinutes,
} from "@/modules/advising/domain/free-time";
import type {
  FreeTimeBudgetRepositoryPort,
  HomeworkPlanRepositoryPort,
  HomeworkRepositoryPort,
  ScheduleRepositoryPort,
  UserRepositoryPort,
} from "@/modules/advising/domain/ports";

/** An incomplete homework still eligible for planning on the requested day. */
export interface PlanCandidate {
  id: string;
  title: string;
  deadline: Date;
}

export interface DayPlan {
  id: string;
  homeworkId: string;
  title: string;
  plannedMinutes: number;
}

export interface DayBudget {
  dayKey: string;
  freeMinutes: number | null;
  suggestedMinutes: number;
  usedMinutes: number;
  remainingMinutes: number;
  plans: DayPlan[];
  candidates: PlanCandidate[];
}

export class SetFreeTimeBudgetUseCase {
  constructor(private readonly budget: FreeTimeBudgetRepositoryPort) {}

  async execute(input: {
    actor: Actor;
    /** Ownership target; defaults to the actor. A counselor may only pass their own id. */
    studentId?: string;
    dayKey: string;
    freeMinutes: number;
  }): Promise<{ dayKey: string; freeMinutes: number }> {
    const ownerId = input.studentId ?? input.actor.id;
    assertPlanWrite(input.actor, "budget:write", ownerId);

    const result = await this.budget.upsertWithinUsed({
      studentId: ownerId,
      dayKey: input.dayKey,
      freeMinutes: input.freeMinutes,
      allows: (usedMinutes) => usedMinutes <= input.freeMinutes,
    });
    if (!result.ok) {
      throw new FreeTimeBelowPlannedError(
        durationMessage(result.usedMinutes, input.freeMinutes),
      );
    }
    return { dayKey: result.budget.dayKey, freeMinutes: result.budget.freeMinutes };
  }
}

export class GetDayBudgetUseCase {
  constructor(
    private readonly users: UserRepositoryPort,
    private readonly schedule: ScheduleRepositoryPort,
    private readonly homework: HomeworkRepositoryPort,
    private readonly budget: FreeTimeBudgetRepositoryPort,
    private readonly plans: HomeworkPlanRepositoryPort,
  ) {}

  /** `today` lets a caller pass a stable clock; nothing here depends on the current time. */
  async execute(input: {
    actor: Actor;
    studentId?: string;
    dayKey: string;
    today?: Date;
  }): Promise<DayBudget> {
    const studentId = input.studentId ?? input.actor.id;
    await assertPlanRead(this.users, input.actor, studentId);

    const entries = await this.schedule.listByStudent(studentId);
    const suggestedMinutes = suggestFreeMinutes(entries, persianDayOf(input.dayKey));

    const [budgetRow, planRows, homeworkRows] = await Promise.all([
      this.budget.findByDay(studentId, input.dayKey),
      this.plans.listByDay(studentId, input.dayKey),
      // One "all" read yields both plan titles (completed tasks keep their rows)
      // and the candidate set, with no per-row query.
      this.homework.listByStudent(studentId, "all"),
    ]);

    const titles = new Map(homeworkRows.map((item) => [item.id, item.title]));
    const usedMinutes = planRows.reduce((sum, row) => sum + row.plannedMinutes, 0);
    const capacity = dayCapacity(budgetRow?.freeMinutes ?? null, usedMinutes);

    return {
      dayKey: input.dayKey,
      freeMinutes: budgetRow?.freeMinutes ?? null,
      suggestedMinutes,
      usedMinutes,
      remainingMinutes: capacity.remainingMinutes,
      plans: planRows.map((row) => ({
        id: row.id,
        homeworkId: row.homeworkId,
        title: titles.get(row.homeworkId) ?? "", // FK cascade keeps the title; "" is the type fallback
        plannedMinutes: row.plannedMinutes,
      })),
      candidates: homeworkRows
        .filter(
          (item) =>
            item.completedAt === null && iranDayKey(item.deadline) >= input.dayKey,
        )
        .map((item) => ({ id: item.id, title: item.title, deadline: item.deadline })),
    };
  }
}
