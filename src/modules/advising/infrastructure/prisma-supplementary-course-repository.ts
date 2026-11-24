/**
 * Prisma implementation of SupplementaryCourseRepositoryPort.
 *
 * `delete` is scoped to the owning student and maps `P2025` to
 * `NotFoundError`. Explicit `select`, rows mapped to domain models.
 */

import type { PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/shared/prisma";
import { NotFoundError } from "@/modules/advising/domain/errors";
import type {
  NewSupplementaryCourse,
  SupplementaryCourse,
} from "@/modules/advising/domain/models";
import type { SupplementaryCourseRepositoryPort } from "@/modules/advising/domain/ports";

const COURSE_SELECT = {
  id: true,
  studentId: true,
  title: true,
  mode: true,
  weeklyMinutes: true,
  createdAt: true,
} as const;

type CourseRow = {
  id: string;
  studentId: string;
  title: string;
  mode: string;
  weeklyMinutes: number | null;
  createdAt: Date;
};

function mapCourse(row: CourseRow): SupplementaryCourse {
  return {
    id: row.id,
    studentId: row.studentId,
    title: row.title,
    mode: row.mode,
    weeklyMinutes: row.weeklyMinutes,
    createdAt: row.createdAt,
  };
}

function isP2025(error: unknown): error is { code: "P2025" } {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "P2025"
  );
}

export class PrismaSupplementaryCourseRepository
  implements SupplementaryCourseRepositoryPort
{
  constructor(private readonly client: PrismaClient = prisma) {}

  async listByStudent(studentId: string): Promise<SupplementaryCourse[]> {
    const rows = await this.client.supplementaryCourse.findMany({
      where: { studentId },
      select: COURSE_SELECT,
      orderBy: { createdAt: "asc" },
    });
    return rows.map(mapCourse);
  }

  async create(input: NewSupplementaryCourse): Promise<SupplementaryCourse> {
    const row = await this.client.supplementaryCourse.create({
      data: {
        studentId: input.studentId,
        title: input.title,
        mode: input.mode,
        weeklyMinutes: input.weeklyMinutes,
      },
      select: COURSE_SELECT,
    });
    return mapCourse(row);
  }

  async delete(input: { id: string; studentId: string }): Promise<void> {
    try {
      await this.client.supplementaryCourse.delete({
        where: { id: input.id, studentId: input.studentId },
        select: { id: true },
      });
    } catch (error) {
      if (isP2025(error)) throw new NotFoundError("supplementary course", error);
      throw error;
    }
  }
}
