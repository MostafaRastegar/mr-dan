/**
 * Prisma implementation of ScheduleRepositoryPort.
 *
 * Explicit `select`, rows mapped to domain models. The weekly-slot unique
 * constraint (P2002 on studentId, dayOfWeek, startMinute) becomes
 * ScheduleConflictError; a missing record on update/delete (P2025) becomes
 * NotFoundError("schedule entry"), both keeping `cause`.
 */

import type { PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/shared/prisma";
import type {
  NewScheduleEntry,
  ScheduleEntryPatch,
  WeeklyScheduleEntry,
} from "@/modules/advising/domain/models";
import {
  NotFoundError,
  ScheduleConflictError,
} from "@/modules/advising/domain/errors";
import type { ScheduleRepositoryPort } from "@/modules/advising/domain/ports";

const SCHEDULE_SELECT = {
  id: true,
  studentId: true,
  dayOfWeek: true,
  startMinute: true,
  endMinute: true,
  subject: true,
  teacher: true,
  room: true,
  createdAt: true,
  updatedAt: true,
} as const;

type ScheduleRow = {
  id: string;
  studentId: string;
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
  subject: string;
  teacher: string | null;
  room: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function mapSchedule(row: ScheduleRow): WeeklyScheduleEntry {
  return {
    id: row.id,
    studentId: row.studentId,
    dayOfWeek: row.dayOfWeek,
    startMinute: row.startMinute,
    endMinute: row.endMinute,
    subject: row.subject,
    teacher: row.teacher,
    room: row.room,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function isP2002(error: unknown): error is { code: "P2002" } {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "P2002"
  );
}

function isP2025(error: unknown): error is { code: "P2025" } {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "P2025"
  );
}

export class PrismaScheduleRepository implements ScheduleRepositoryPort {
  constructor(private readonly client: PrismaClient = prisma) {}

  async listByStudent(studentId: string): Promise<WeeklyScheduleEntry[]> {
    const rows = await this.client.weeklySchedule.findMany({
      where: { studentId },
      select: SCHEDULE_SELECT,
      orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }],
    });
    return rows.map(mapSchedule);
  }

  async findById(id: string): Promise<WeeklyScheduleEntry | null> {
    const row = await this.client.weeklySchedule.findUnique({
      where: { id },
      select: SCHEDULE_SELECT,
    });
    return row ? mapSchedule(row) : null;
  }

  async create(input: NewScheduleEntry): Promise<WeeklyScheduleEntry> {
    try {
      const row = await this.client.weeklySchedule.create({
        data: {
          studentId: input.studentId,
          dayOfWeek: input.dayOfWeek,
          startMinute: input.startMinute,
          endMinute: input.endMinute,
          subject: input.subject,
          ...(input.teacher !== undefined ? { teacher: input.teacher } : {}),
          ...(input.room !== undefined ? { room: input.room } : {}),
        },
        select: SCHEDULE_SELECT,
      });
      return mapSchedule(row);
    } catch (error) {
      if (isP2002(error)) throw new ScheduleConflictError(error);
      throw error;
    }
  }

  async update(
    id: string,
    patch: ScheduleEntryPatch,
  ): Promise<WeeklyScheduleEntry> {
    try {
      const row = await this.client.weeklySchedule.update({
        where: { id },
        data: {
          ...(patch.dayOfWeek !== undefined ? { dayOfWeek: patch.dayOfWeek } : {}),
          ...(patch.startMinute !== undefined ? { startMinute: patch.startMinute } : {}),
          ...(patch.endMinute !== undefined ? { endMinute: patch.endMinute } : {}),
          ...(patch.subject !== undefined ? { subject: patch.subject } : {}),
          ...(patch.teacher !== undefined ? { teacher: patch.teacher } : {}),
          ...(patch.room !== undefined ? { room: patch.room } : {}),
        },
        select: SCHEDULE_SELECT,
      });
      return mapSchedule(row);
    } catch (error) {
      if (isP2025(error)) throw new NotFoundError("schedule entry", error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.client.weeklySchedule.delete({
        where: { id },
        select: { id: true },
      });
    } catch (error) {
      if (isP2025(error)) throw new NotFoundError("schedule entry", error);
      throw error;
    }
  }
}
