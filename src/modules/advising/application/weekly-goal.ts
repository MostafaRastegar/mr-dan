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
import {
  iranDayKey,
  isDayKey,
  persianDayOf,
  weekStartKey,
} from "@/modules/advising/domain/day-key";
import {
  parsePlanEntryBlockKey,
  planEntryBlockKey,
} from "@/modules/advising/domain/study-plan";

export type WeeklyGoalInput = {
  actor: Actor;
  studentId?: string;
  weekKey?: string;
};

export type ToggleStudyBlockInput = WeeklyGoalInput & {
  dayKey: string;
  startMinute: number;
  minutes: number;
  /** Whole counselor-authored plan row: tick key becomes `${dayKey}:${entryId}`. */
  entryId?: string;
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

/** A week key is the Saturday of an Iran week; future weeks clamp to now. */
export function resolveWeekKey(weekKey?: string): string {
  if (!weekKey) return currentWeekKey();
  if (!isDayKey(weekKey) || persianDayOf(weekKey) !== 0) {
    throw new ValidationError("هفته نامعتبر است");
  }
  const current = currentWeekKey();
  return weekKey <= current ? weekKey : current;
}

export type SetStudyMinutesInput = WeeklyGoalInput & {
  dayKey: string;
  entryId: string;
  minutes: number;
};

export class SetStudyMinutesUseCase {
  constructor(private readonly goals: WeeklyGoalRepositoryPort) {}

  async execute(input: SetStudyMinutesInput): Promise<WeeklyGoal> {
    const ownerId = ownerIdOf(input, input.actor);
    assertPlanWrite(input.actor, "goal:write", ownerId);
    if (!isDayKey(input.dayKey)) throw new ValidationError("روز نامعتبر است");
    if (
      !Number.isInteger(input.minutes) ||
      input.minutes < 0 ||
      input.minutes > 1440
    ) {
      throw new ValidationError("دقیقهٔ مطالعه باید بین ۰ تا ۱۴۴۰ باشد");
    }

    const weekKey = resolveWeekKey(input.weekKey);
    const current = await this.goals.findByKey(ownerId, weekKey);
    const kept = (current?.completedBlocks ?? []).filter(
      (key) => parsePlanEntryBlockKey(key)?.entryId !== input.entryId,
    );
    const next =
      input.minutes > 0
        ? [...kept, planEntryBlockKey(input.dayKey, input.entryId, input.minutes)]
        : kept;
    return this.goals.setCompletedBlocks(ownerId, weekKey, next);
  }
}

export type SetSubjectTestsInput = WeeklyGoalInput & {
  subject: string;
  count: number;
};

export class SetSubjectTestsUseCase {
  constructor(private readonly goals: WeeklyGoalRepositoryPort) {}

  async execute(input: SetSubjectTestsInput): Promise<WeeklyGoal> {
    const ownerId = ownerIdOf(input, input.actor);
    assertPlanWrite(input.actor, "goal:write", ownerId);
    if (input.subject.trim().length === 0) {
      throw new ValidationError("درس را انتخاب کنید");
    }
    if (!Number.isInteger(input.count) || input.count < 0 || input.count > 2000) {
      throw new ValidationError("تعداد تست باید بین ۰ تا ۲۰۰۰ باشد");
    }

    const weekKey = resolveWeekKey(input.weekKey);
    await this.goals.setSubjectTests({
      studentId: ownerId,
      weekKey,
      subject: input.subject,
      count: input.count,
    });
    const goal = await this.goals.findByKey(ownerId, weekKey);
    if (!goal) throw new NotFoundError("weekly goal");
    return goal;
  }
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
    const key = input.entryId
      ? `${input.dayKey}:${input.entryId}`
      : `${input.dayKey}:${input.startMinute}:${input.minutes}`;
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
