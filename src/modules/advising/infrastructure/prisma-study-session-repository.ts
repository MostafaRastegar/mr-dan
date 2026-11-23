/**
 * Prisma implementation of StudySessionRepositoryPort.
 *
 * Explicit `select`, rows mapped to domain models. Range uses `gte`/`lt` on
 * `startedAt` so a session starting exactly at `from` is included.
 */

import type { PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/shared/prisma";
import type {
  NewStudySession,
  StudyCategory,
  StudySessionRecord,
} from "@/modules/advising/domain/models";
import type { StudySessionRepositoryPort } from "@/modules/advising/domain/ports";

const STUDY_SESSION_SELECT = {
  id: true,
  studentId: true,
  category: true,
  subject: true,
  durationMinutes: true,
  focusLevel: true,
  startedAt: true,
  createdAt: true,
} as const;

type StudySessionRow = {
  id: string;
  studentId: string;
  category: string;
  subject: string | null;
  durationMinutes: number;
  focusLevel: number | null;
  startedAt: Date;
  createdAt: Date;
};

function toStudyCategory(value: string): StudyCategory {
  if (value === "study") return "study";
  if (value === "break") return "break";
  return "waste";
}

function mapStudySession(row: StudySessionRow): StudySessionRecord {
  return {
    id: row.id,
    studentId: row.studentId,
    category: toStudyCategory(row.category),
    subject: row.subject,
    durationMinutes: row.durationMinutes,
    focusLevel: row.focusLevel,
    startedAt: row.startedAt,
    createdAt: row.createdAt,
  };
}

export class PrismaStudySessionRepository implements StudySessionRepositoryPort {
  constructor(private readonly client: PrismaClient = prisma) {}

  async create(input: NewStudySession): Promise<StudySessionRecord> {
    const row = await this.client.studySession.create({
      data: {
        studentId: input.studentId,
        category: input.category,
        ...(input.subject !== undefined ? { subject: input.subject } : {}),
        durationMinutes: input.durationMinutes,
        ...(input.focusLevel !== undefined ? { focusLevel: input.focusLevel } : {}),
        startedAt: input.startedAt,
      },
      select: STUDY_SESSION_SELECT,
    });
    return mapStudySession(row);
  }

  async listByStudentInRange(
    studentId: string,
    from: Date,
    to: Date,
  ): Promise<StudySessionRecord[]> {
    const rows = await this.client.studySession.findMany({
      where: {
        studentId,
        startedAt: { gte: from, lt: to },
      },
      select: STUDY_SESSION_SELECT,
      orderBy: { startedAt: "asc" },
    });
    return rows.map(mapStudySession);
  }
}
