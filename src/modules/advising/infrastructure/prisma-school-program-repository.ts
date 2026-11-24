/**
 * Prisma implementation of SchoolProgramRepositoryPort.
 *
 * `create` on the unique `(studentId, dayOfWeek, subject)` maps `P2002` to
 * `ConflictError`. `delete` is scoped to the owning student and maps `P2025`
 * to `NotFoundError`. Explicit `select`, rows mapped to domain models.
 */

import type { PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/shared/prisma";
import { ConflictError, NotFoundError } from "@/modules/advising/domain/errors";
import type {
  NewSchoolProgramEntry,
  SchoolProgramEntry,
} from "@/modules/advising/domain/models";
import type { SchoolProgramRepositoryPort } from "@/modules/advising/domain/ports";

const SCHOOL_PROGRAM_SELECT = {
  id: true,
  studentId: true,
  dayOfWeek: true,
  subject: true,
  minutes: true,
  createdAt: true,
  updatedAt: true,
} as const;

type SchoolProgramRow = {
  id: string;
  studentId: string;
  dayOfWeek: number;
  subject: string;
  minutes: number;
  createdAt: Date;
  updatedAt: Date;
};

function mapSchoolProgramEntry(row: SchoolProgramRow): SchoolProgramEntry {
  return {
    id: row.id,
    studentId: row.studentId,
    dayOfWeek: row.dayOfWeek,
    subject: row.subject,
    minutes: row.minutes,
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

export class PrismaSchoolProgramRepository
  implements SchoolProgramRepositoryPort
{
  constructor(private readonly client: PrismaClient = prisma) {}

  async listByStudent(studentId: string): Promise<SchoolProgramEntry[]> {
    const rows = await this.client.schoolProgramEntry.findMany({
      where: { studentId },
      select: SCHOOL_PROGRAM_SELECT,
      orderBy: [{ dayOfWeek: "asc" }, { subject: "asc" }],
    });
    return rows.map(mapSchoolProgramEntry);
  }

  async create(input: NewSchoolProgramEntry): Promise<SchoolProgramEntry> {
    try {
      const row = await this.client.schoolProgramEntry.create({
        data: {
          studentId: input.studentId,
          dayOfWeek: input.dayOfWeek,
          subject: input.subject,
          minutes: input.minutes,
        },
        select: SCHOOL_PROGRAM_SELECT,
      });
      return mapSchoolProgramEntry(row);
    } catch (error) {
      if (isP2002(error)) {
        throw new ConflictError(
          "این ردیف قبلاً برای همین روز و درس ثبت شده است",
          error,
        );
      }
      throw error;
    }
  }

  async delete(input: { id: string; studentId: string }): Promise<void> {
    try {
      await this.client.schoolProgramEntry.delete({
        where: { id: input.id, studentId: input.studentId },
        select: { id: true },
      });
    } catch (error) {
      if (isP2025(error)) {
        throw new NotFoundError("school program entry", error);
      }
      throw error;
    }
  }
}
