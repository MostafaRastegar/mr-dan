/**
 * Prisma implementation of ChapterRepositoryPort.
 *
 * `listForSubject` returns active chapters for one subject, narrowed to the
 * student's grade and to `field === ""` or the student's field. `findByIds`
 * ignores `active` so the write path can validate ids that exist but were
 * later deactivated. Explicit `select`, rows mapped to domain models.
 */

import type { PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/shared/prisma";
import type { Chapter } from "@/modules/advising/domain/models";
import type { ChapterRepositoryPort } from "@/modules/advising/domain/ports";

const CHAPTER_SELECT = {
  id: true,
  subject: true,
  field: true,
  grade: true,
  number: true,
  title: true,
  active: true,
} as const;

type ChapterRow = {
  id: string;
  subject: string;
  field: string;
  grade: string;
  number: number;
  title: string;
  active: boolean;
};

function mapChapter(row: ChapterRow): Chapter {
  return {
    id: row.id,
    subject: row.subject,
    field: row.field,
    grade: row.grade,
    number: row.number,
    title: row.title,
    active: row.active,
  };
}

export class PrismaChapterRepository implements ChapterRepositoryPort {
  constructor(private readonly client: PrismaClient = prisma) {}

  async listForSubject(input: {
    subject: string;
    grade: string | null;
    field: string | null;
  }): Promise<Chapter[]> {
    if (input.grade === null) return [];
    const fieldValues: string[] =
      input.field === null ? [""] : ["", input.field];
    const rows = await this.client.chapter.findMany({
      where: {
        active: true,
        subject: input.subject,
        grade: input.grade,
        field: { in: fieldValues },
      },
      select: CHAPTER_SELECT,
      orderBy: [{ number: "asc" }],
    });
    return rows.map(mapChapter);
  }

  async findByIds(ids: readonly string[]): Promise<Chapter[]> {
    if (ids.length === 0) return [];
    const rows = await this.client.chapter.findMany({
      where: { id: { in: [...ids] } },
      select: CHAPTER_SELECT,
    });
    return rows.map(mapChapter);
  }

  /** All active chapters, for resolving titles and populating the picker. */
  async listAll(): Promise<Chapter[]> {
    const rows = await this.client.chapter.findMany({
      where: { active: true },
      select: CHAPTER_SELECT,
      orderBy: [{ number: "asc" }],
    });
    return rows.map(mapChapter);
  }
}
