/**
 * School program use cases (student-owned fixed weekly schedule).
 */

import { ValidationError } from "@/modules/advising/domain/errors";
import {
  assertPlanRead,
  assertPlanWrite,
  type Actor,
} from "@/modules/advising/application/planning-access";
import type { SchoolProgramEntry } from "@/modules/advising/domain/models";
import type {
  SchoolProgramRepositoryPort,
  UserRepositoryPort,
} from "@/modules/advising/domain/ports";

const ENTRY_MINUTES_MIN = 15;
const ENTRY_MINUTES_MAX = 720;

export class ListSchoolProgramUseCase {
  constructor(
    private readonly users: UserRepositoryPort,
    private readonly program: SchoolProgramRepositoryPort,
  ) {}

  async execute(input: { actor: Actor; studentId?: string }): Promise<SchoolProgramEntry[]> {
    const ownerId = input.studentId ?? input.actor.id;
    await assertPlanRead(this.users, input.actor, ownerId);
    return this.program.listByStudent(ownerId);
  }
}

export type AddSchoolProgramEntryInput = {
  actor: Actor;
  dayOfWeek: number;
  subject: string;
  hours: number;
};

export class AddSchoolProgramEntryUseCase {
  constructor(
    private readonly users: UserRepositoryPort,
    private readonly program: SchoolProgramRepositoryPort,
  ) {}

  async execute(input: AddSchoolProgramEntryInput): Promise<SchoolProgramEntry> {
    const ownerId = input.actor.id;
    await assertPlanWrite(input.actor, "schedule:write", ownerId);

    const minutes = Math.round(input.hours * 60);
    if (minutes < ENTRY_MINUTES_MIN || minutes > ENTRY_MINUTES_MAX) {
      throw new ValidationError("ساعت‌ها باید بین ۰٫۲۵ تا ۱۲ باشد");
    }
    if (input.dayOfWeek < 0 || input.dayOfWeek > 6) {
      throw new ValidationError("روز هفته نامعتبر است");
    }

    return this.program.create({
      studentId: ownerId,
      dayOfWeek: input.dayOfWeek,
      subject: input.subject,
      minutes,
    });
  }
}

export type DeleteSchoolProgramEntryInput = {
  actor: Actor;
  entryId: string;
};

export class DeleteSchoolProgramEntryUseCase {
  constructor(
    private readonly users: UserRepositoryPort,
    private readonly program: SchoolProgramRepositoryPort,
  ) {}

  async execute(input: DeleteSchoolProgramEntryInput): Promise<void> {
    const ownerId = input.actor.id;
    await assertPlanWrite(input.actor, "schedule:write", ownerId);
    await this.program.delete({ id: input.entryId, studentId: ownerId });
  }
}
