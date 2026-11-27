/**
 * Weekly schedule use cases.
 *
 * Authoring is counselor-of-record only (`assertCounselorOfStudent`): never a
 * student self-write, never an admin write. Update/Delete load the row first so
 * authorization checks the entry's real owner; the overlap conflict is checked
 * after authorization.
 */

import {
  NotFoundError,
  ScheduleConflictError,
} from "@/modules/advising/domain/errors";
import { overlaps } from "@/modules/advising/domain/schedule";
import {
  assertCounselorOfStudent,
  assertPlanRead,
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

function assertNoOverlap(
  entries: WeeklyScheduleEntry[],
  input: {
    dayOfWeek: DayOfWeek;
    startMinute: number;
    endMinute: number;
    exceptId?: string;
  },
): void {
  const sameDay = entries.filter(
    (entry) =>
      entry.dayOfWeek === input.dayOfWeek && entry.id !== input.exceptId,
  );
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
  constructor(
    private readonly users: UserRepositoryPort,
    private readonly schedule: ScheduleRepositoryPort,
  ) {}

  async execute(input: {
    actor: Actor;
    studentId: string;
    dayOfWeek: DayOfWeek;
    startMinute: number;
    endMinute: number;
    subject: string;
    teacher?: string | null;
    room?: string | null;
  }): Promise<WeeklyScheduleEntry> {
    await assertCounselorOfStudent(this.users, input.actor, input.studentId);

    const entries = await this.schedule.listByStudent(input.studentId);
    assertNoOverlap(entries, input);

    return this.schedule.create({
      studentId: input.studentId,
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
  constructor(
    private readonly users: UserRepositoryPort,
    private readonly schedule: ScheduleRepositoryPort,
  ) {}

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
    const existing = await this.schedule.findById(input.entryId);
    if (!existing) throw new NotFoundError("schedule entry");
    await assertCounselorOfStudent(
      this.users,
      input.actor,
      existing.studentId,
    );

    const entries = await this.schedule.listByStudent(existing.studentId);
    assertNoOverlap(entries, { ...input, exceptId: input.entryId });

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
  constructor(
    private readonly users: UserRepositoryPort,
    private readonly schedule: ScheduleRepositoryPort,
  ) {}

  async execute(input: { actor: Actor; entryId: string }): Promise<void> {
    const existing = await this.schedule.findById(input.entryId);
    if (!existing) throw new NotFoundError("schedule entry");
    await assertCounselorOfStudent(
      this.users,
      input.actor,
      existing.studentId,
    );

    await this.schedule.delete(input.entryId);
  }
}
