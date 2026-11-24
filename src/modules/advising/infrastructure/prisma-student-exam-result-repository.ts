/**
 * Prisma implementation of StudentExamResultRepositoryPort.
 *
 * `listRecent` returns the most recent results first. `upsert` writes on the
 * unique `(studentId, examId)` so re-saving an exam updates its تراز instead
 * of duplicating the row. Explicit `select`, rows mapped to domain models.
 */

import type { PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/shared/prisma";
import type { StudentExamResult } from "@/modules/advising/domain/models";
import type { StudentExamResultRepositoryPort } from "@/modules/advising/domain/ports";

const RESULT_SELECT = {
  id: true,
  studentId: true,
  examId: true,
  taraz: true,
  createdAt: true,
  updatedAt: true,
} as const;

type ResultRow = {
  id: string;
  studentId: string;
  examId: string;
  taraz: number;
  createdAt: Date;
  updatedAt: Date;
};

function mapResult(row: ResultRow): StudentExamResult {
  return {
    id: row.id,
    studentId: row.studentId,
    examId: row.examId,
    taraz: row.taraz,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaStudentExamResultRepository
  implements StudentExamResultRepositoryPort
{
  constructor(private readonly client: PrismaClient = prisma) {}

  async listRecent(
    studentId: string,
    take: number,
  ): Promise<StudentExamResult[]> {
    const rows = await this.client.studentExamResult.findMany({
      where: { studentId },
      select: RESULT_SELECT,
      orderBy: { updatedAt: "desc" },
      take,
    });
    return rows.map(mapResult);
  }

  async upsert(input: {
    studentId: string;
    examId: string;
    taraz: number;
  }): Promise<StudentExamResult> {
    const row = await this.client.studentExamResult.upsert({
      where: {
        studentId_examId: { studentId: input.studentId, examId: input.examId },
      },
      create: {
        studentId: input.studentId,
        examId: input.examId,
        taraz: input.taraz,
      },
      update: { taraz: input.taraz },
      select: RESULT_SELECT,
    });
    return mapResult(row);
  }
}
