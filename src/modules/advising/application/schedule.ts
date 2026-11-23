/**
 * Weekly schedule use cases.
 *
 * Write path: assertPlanWrite (capability + ownership) → findById → ownership
 * re-check → repository. Overlap check uses pure overlaps() from domain/schedule.
 */

import {
  ForbiddenError,
  NotFoundError,
  ScheduleConflictError,
} from "@/modules/advising/domain/errors";
import { overlaps } from "@/modules/advising/domain/schedule";
import {
  assertPlanRead,
  assertPlanWrite,
  type Actor,
} from "@/modules/advising/application/planning-access";
import type {
  DayOfWeek,
  WeeklyScheduleEntry,
} from "@/modules/advising/domain/models";
import type {
  ScheduleRepositoryPort,
  UserRepositoryPort,
} from "@/modules/advising/domain/ports";

function ownerIdOf(input: { studentId?: string; actor: Actor }): string {
  return input.studentId ?? input.actor.id;
}

export class ListWeeklyScheduleUseCase {
  constructor(
    private readonly users: UserRepositoryPort,
    private readonly schedule: ScheduleRepositoryPort,
  ) {}

  async execute(input: {
    actor: Actor;
    studentId?: string;
  }): Promise<WeeklyScheduleEntry[]> {
    const ownerId = ownerIdOf(input);
    await assertPlanRead(this.users, input.actor, ownerId);
    return this.schedule.listByStudent(ownerId);
  }
}

export class CreateScheduleEntryUseCase {
  constructor(private readonly schedule: ScheduleRepositoryPort) {}

  async execute(input: {
    actor: Actor;
    studentId?: string;
    dayOfWeek: DayOfWeek;
    startMinute: number;
    endMinute: number;
    subject: string;
    teacher?: string | null;
    room?: string | null;
  }): Promise<WeeklyScheduleEntry> {
    const ownerId = ownerIdOf(input);
    assertPlanWrite(input.actor, "schedule:write", ownerId);

    const entries = await this.schedule.listByStudent(ownerId);
    const sameDay = entries.filter((e) => e.dayOfWeek === input.dayOfWeek);
    for (const existing of sameDay) {
      if (
        overlaps(
          input.startMinute,
          input.endMinute,
          existing.startMinute,
          existing.endMinute,
        )
      ) {
        throw new ScheduleConflictError();
      }
    }

    return this.schedule.create({
      studentId: ownerId,
      dayOfWeek: input.dayOfWeek,
      startMinute: input.startMinute,
      endMinute: input.endMinute,
      subject: input.subject,
      teacher: input.teacher ?? null,
      room: input.room ?? null,
    });
  }
}

export class UpdateScheduleEntryUseCase {
  constructor(private readonly schedule: ScheduleRepositoryPort) {}

  async execute(input: {
    actor: Actor;
    entryId: string;
    dayOfWeek: DayOfWeek;
    startMinute: number;
    endMinute: number;
    subject: string;
    teacher?: string | null;
    room?: string | null;
  }): Promise<WeeklyScheduleEntry> {
    const ownerId = input.actor.id; // entry ownership is the actor
    assertPlanWrite(input.actor, "schedule:write", ownerId);

    const existing = await this.schedule.findById(input.entryId);
    if (!existing) throw new NotFoundError("schedule entry");
    if (existing.studentId !== ownerId) throw new ForbiddenError();

    const entries = await this.schedule.listByStudent(ownerId);
    const sameDay = entries.filter(
      (e) => e.dayOfWeek === input.dayOfWeek && e.id !== input.entryId,
    );
    for (const other of sameDay) {
      if (
        overlaps(
          input.startMinute,
          input.endMinute,
          other.startMinute,
          other.endMinute,
        )
      ) {
        throw new ScheduleConflictError();
      }
    }

    return this.schedule.update(input.entryId, {
      dayOfWeek: input.dayOfWeek,
      startMinute: input.startMinute,
      endMinute: input.endMinute,
      subject: input.subject,
      teacher: input.teacher ?? null,
      room: input.room ?? null,
    });
  }
}

export class DeleteScheduleEntryUseCase {
  constructor(private readonly schedule: ScheduleRepositoryPort) {}

  async execute(input: { actor: Actor; entryId: string }): Promise<void> {
    assertPlanWrite(input.actor, "schedule:write", input.actor.id);

    const existing = await this.schedule.findById(input.entryId);
    if (!existing) throw new NotFoundError("schedule entry");
    if (existing.studentId !== input.actor.id) throw new ForbiddenError();

    await this.schedule.delete(input.entryId);
  }
}
