/**
 * Weekly study/test goal use cases.
 *
 * Every write is self-service: the actor may only touch their own row, and
 * `testsDone` moves only through the repository's atomic `increment`.
 */

import { assertPlanWrite, type Actor } from "@/modules/advising/application/planning-access";
import { ForbiddenError, NotFoundError, ValidationError } from "@/modules/advising/domain/errors";
import type { WeeklyGoal } from "@/modules/advising/domain/models";
import type { WeeklyGoalRepositoryPort } from "@/modules/advising/domain/ports";
import { iranDayKey, weekStartKey } from "@/modules/advising/domain/day-key";

export type WeeklyGoalInput = {
  actor: Actor;
  studentId?: string;
  weekKey?: string;
};

export type ToggleStudyBlockInput = WeeklyGoalInput & {
  dayKey: string;
  startMinute: number;
  minutes: number;
  completed: boolean;
};

export type AddTestsDoneInput = WeeklyGoalInput & {
  delta: number;
  /** Subject slug the test belongs to. Optional: when absent (for example the
   * dashboard has no subject picker in this stage) the existing un-scoped
   * `incrementTestsDone` path is retained as the default. */
  subject?: string;
};

function ownerIdOf(input: WeeklyGoalInput, actor: Actor): string {
  return input.studentId ?? actor.id;
}

function requireOwner(actor: Actor, ownerId: string): void {
  if (ownerId !== actor.id) throw new ForbiddenError();
}

export function currentWeekKey(): string {
  return weekStartKey(iranDayKey(new Date()));
}

export class GetWeeklyGoalUseCase {
  constructor(private readonly goals: WeeklyGoalRepositoryPort) {}

  async execute(input: {
    actor: Actor;
    studentId?: string;
    weekKey?: string;
  }): Promise<WeeklyGoal | null> {
    const ownerId = ownerIdOf(input, input.actor);
    requireOwner(input.actor, ownerId);
    const weekKey = input.weekKey ?? currentWeekKey();
    return this.goals.findByKey(ownerId, weekKey);
  }
}

export class ToggleStudyBlockUseCase {
  constructor(private readonly goals: WeeklyGoalRepositoryPort) {}

  async execute(input: ToggleStudyBlockInput): Promise<WeeklyGoal> {
    const ownerId = ownerIdOf(input, input.actor);
    assertPlanWrite(input.actor, "goal:write", ownerId);

    const weekKey = input.weekKey ?? currentWeekKey();
    const key = `${input.dayKey}:${input.startMinute}:${input.minutes}`;
    const current = await this.goals.findByKey(ownerId, weekKey);
    const blocks = current?.completedBlocks ?? [];

    const next: string[] = input.completed
      ? blocks.includes(key)
        ? blocks
        : [...blocks, key]
      : blocks.filter((block) => block !== key);

    return this.goals.setCompletedBlocks(ownerId, weekKey, next);
  }
}

export class AddTestsDoneUseCase {
  constructor(private readonly goals: WeeklyGoalRepositoryPort) {}

  async execute(input: AddTestsDoneInput): Promise<WeeklyGoal> {
    const ownerId = ownerIdOf(input, input.actor);
    assertPlanWrite(input.actor, "goal:write", ownerId);

    const delta = input.delta;
    if (delta < 1 || delta > 100) {
      throw new ValidationError("تعداد تست باید بین ۱ تا ۱۰۰ باشد");
    }

    const weekKey = input.weekKey ?? currentWeekKey();
    const ownerIdStr = ownerId;

    // `incrementSubjectTests` already performs the atomic `testsDone` increment
    // (plus the per-subject `TestRecord`), so it is used instead of — not in
    // addition to — `incrementTestsDone` to avoid double counting.
    if (input.subject) {
      await this.goals.incrementSubjectTests({
        studentId: ownerIdStr,
        weekKey,
        subject: input.subject,
        count: delta,
      });
      const goal = await this.goals.findByKey(ownerIdStr, weekKey);
      if (!goal) throw new NotFoundError("weekly goal");
      return goal;
    }

    // Default (no subject picker): the existing un-scoped increment path.
    return this.goals.incrementTestsDone(ownerIdStr, weekKey, delta);
  }
}
