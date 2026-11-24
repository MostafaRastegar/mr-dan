/**
 * Prisma implementation of StudyPlanRepositoryPort.
 *
 * `findForStudent` returns the header plus entries ordered by weekday then
 * subject. `upsertEntry` runs inside `$transaction` so the entry write is
 * atomic against the plan header (the header row must already exist — the
 * relation targets `StudyPlan.studentId`). `deleteEntry` is scoped to the
 * owning student and maps `P2025` to `NotFoundError`. Explicit `select`,
 * rows mapped to domain models.
 */

import type { PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/shared/prisma";
import { NotFoundError } from "@/modules/advising/domain/errors";
import type {
  NewStudyPlanEntry,
  StudyPlan,
  StudyPlanEntry,
} from "@/modules/advising/domain/models";
import type { StudyPlanRepositoryPort } from "@/modules/advising/domain/ports";

const ENTRY_SELECT = {
  id: true,
  studentId: true,
  dayOfWeek: true,
  subject: true,
  minutes: true,
  chapterIds: true,
  note: true,
  createdAt: true,
  updatedAt: true,
} as const;

type StudyPlanEntryRow = {
  id: string;
  studentId: string;
  dayOfWeek: number;
  subject: string;
  minutes: number;
  chapterIds: string[];
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type StudyPlanRow = {
  id: string;
  studentId: string;
  counselorId: string;
  testsTarget: number;
  createdAt: Date;
  updatedAt: Date;
  entries: StudyPlanEntryRow[];
};

function sortEntries(entries: StudyPlanEntryRow[]): StudyPlanEntryRow[] {
  return entries.slice().sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.subject.localeCompare(b.subject));
}

function mapStudyPlanEntry(row: StudyPlanEntryRow): StudyPlanEntry {
  return {
    id: row.id,
    studentId: row.studentId,
    dayOfWeek: row.dayOfWeek,
    subject: row.subject,
    minutes: row.minutes,
    chapterIds: row.chapterIds,
    note: row.note,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapStudyPlan(row: StudyPlanRow): StudyPlan {
  return {
    id: row.id,
    studentId: row.studentId,
    counselorId: row.counselorId,
    testsTarget: row.testsTarget,
    entries: sortEntries(row.entries).map(mapStudyPlanEntry),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function isP2025(error: unknown): error is { code: "P2025" } {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "P2025"
  );
}

export class PrismaStudyPlanRepository implements StudyPlanRepositoryPort {
  constructor(private readonly client: PrismaClient = prisma) {}

  async findForStudent(studentId: string): Promise<StudyPlan | null> {
    const row = await this.client.studyPlan.findUnique({
      where: { studentId },
      select: {
        id: true,
        studentId: true,
        counselorId: true,
        testsTarget: true,
        createdAt: true,
        updatedAt: true,
        entries: {
          select: {
            id: true,
            studentId: true,
            dayOfWeek: true,
            subject: true,
            minutes: true,
            chapterIds: true,
            note: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
    return row ? mapStudyPlan(row) : null;
  }

  async upsertHeader(input: {
    studentId: string;
    counselorId: string;
    testsTarget: number;
  }): Promise<StudyPlan> {
    const row = await this.client.studyPlan.upsert({
      where: { studentId: input.studentId },
      create: {
        studentId: input.studentId,
        counselorId: input.counselorId,
        testsTarget: input.testsTarget,
      },
      update: {
        counselorId: input.counselorId,
        testsTarget: input.testsTarget,
      },
      select: {
        id: true,
        studentId: true,
        counselorId: true,
        testsTarget: true,
        createdAt: true,
        updatedAt: true,
        entries: {
          select: {
            id: true,
            studentId: true,
            dayOfWeek: true,
            subject: true,
            minutes: true,
            chapterIds: true,
            note: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
    return mapStudyPlan(row);
  }

  async upsertEntry(input: NewStudyPlanEntry): Promise<StudyPlanEntry> {
    return this.client.$transaction(async (tx) => {
      const row = await tx.studyPlanEntry.upsert({
        where: {
          studentId_dayOfWeek_subject: {
            studentId: input.studentId,
            dayOfWeek: input.dayOfWeek,
            subject: input.subject,
          },
        },
        create: {
          studentId: input.studentId,
          dayOfWeek: input.dayOfWeek,
          subject: input.subject,
          minutes: input.minutes,
          chapterIds: input.chapterIds,
          note: input.note,
        },
        update: {
          minutes: input.minutes,
          chapterIds: input.chapterIds,
          note: input.note,
        },
        select: ENTRY_SELECT,
      });
      return mapStudyPlanEntry(row);
    });
  }

  async deleteEntry(input: {
    studentId: string;
    entryId: string;
  }): Promise<void> {
    try {
      await this.client.studyPlanEntry.delete({
        where: { id: input.entryId, studentId: input.studentId },
        select: { id: true },
      });
    } catch (error) {
      if (isP2025(error)) throw new NotFoundError("study plan entry", error);
      throw error;
    }
  }
}
