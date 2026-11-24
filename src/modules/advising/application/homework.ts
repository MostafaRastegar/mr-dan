/**
 * Homework use cases.
 *
 * Read: assertPlanRead (self or own students). Write: assertPlanWrite (capability
 * + ownership) + row ownership after findById.
 */

import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/modules/advising/domain/errors";
import {
  assertPlanRead,
  assertPlanWrite,
  type Actor,
} from "@/modules/advising/application/planning-access";
import type {
  HomeworkFilter,
  HomeworkItem,
} from "@/modules/advising/domain/models";
import type {
  HomeworkRepositoryPort,
  UserRepositoryPort,
} from "@/modules/advising/domain/ports";

function ownerIdOf(input: { studentId?: string; actor: Actor }): string {
  return input.studentId ?? input.actor.id;
}

export class ListHomeworkUseCase {
  constructor(
    private readonly users: UserRepositoryPort,
    private readonly homework: HomeworkRepositoryPort,
  ) {}

  async execute(input: {
    actor: Actor;
    studentId?: string;
    filter?: HomeworkFilter;
  }): Promise<HomeworkItem[]> {
    const ownerId = ownerIdOf(input);
    await assertPlanRead(this.users, input.actor, ownerId);
    return this.homework.listByStudent(ownerId, input.filter ?? "all");
  }
}

export class CreateHomeworkUseCase {
  constructor(private readonly homework: HomeworkRepositoryPort) {}

  async execute(input: {
    actor: Actor;
    studentId?: string;
    title: string;
    subject?: string | null;
    priority: number;
    deadline: Date;
  }): Promise<HomeworkItem> {
    const ownerId = ownerIdOf(input);
    assertPlanWrite(input.actor, "homework:write", ownerId);

    return this.homework.create({
      studentId: ownerId,
      title: input.title,
      subject: input.subject ?? null,
      priority: input.priority,
      deadline: input.deadline,
    });
  }
}

const SPENT_MINUTES_MIN = 1;
const SPENT_MINUTES_MAX = 1440;

export class SetHomeworkCompletionUseCase {
  constructor(private readonly homework: HomeworkRepositoryPort) {}

  async execute(input: {
    actor: Actor;
    homeworkId: string;
    completed: boolean;
    spentMinutes?: number;
    now?: Date;
  }): Promise<HomeworkItem> {
    const ownerId = input.actor.id;
    assertPlanWrite(input.actor, "homework:write", ownerId);

    const existing = await this.homework.findById(input.homeworkId);
    if (!existing) throw new NotFoundError("homework");
    if (existing.studentId !== ownerId) throw new ForbiddenError();

    if (input.completed) {
      const spent = input.spentMinutes ?? null;
      if (spent === null || spent < SPENT_MINUTES_MIN || spent > SPENT_MINUTES_MAX) {
        throw new ValidationError("دقیقهٔ صرف‌شده باید بین ۱ تا ۱۴۴۰ باشد");
      }
      return this.homework.setCompletion(input.homeworkId, {
        completedAt: input.now ?? new Date(),
        spentMinutes: spent,
      });
    }

    return this.homework.setCompletion(input.homeworkId, {
      completedAt: null,
      spentMinutes: null,
    });
  }
}

export class DeleteHomeworkUseCase {
  constructor(private readonly homework: HomeworkRepositoryPort) {}

  async execute(input: { actor: Actor; homeworkId: string }): Promise<void> {
    assertPlanWrite(input.actor, "homework:write", input.actor.id);

    const existing = await this.homework.findById(input.homeworkId);
    if (!existing) throw new NotFoundError("homework");
    if (existing.studentId !== input.actor.id) throw new ForbiddenError();

    await this.homework.delete(input.homeworkId);
  }
}
