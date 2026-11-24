/**
 * Prisma implementation of CatalogRepositoryPort.
 *
 * Reads active catalog rows only (`Need`, `Exam`). Explicit `select`, rows
 * mapped to domain models.
 */

import type { PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/shared/prisma";
import type { Exam, Need } from "@/modules/advising/domain/models";
import type { CatalogRepositoryPort } from "@/modules/advising/domain/ports";

const NEED_SELECT = {
  id: true,
  code: true,
  label: true,
  active: true,
} as const;

type NeedRow = {
  id: string;
  code: string;
  label: string;
  active: boolean;
};

function mapNeed(row: NeedRow): Need {
  return {
    id: row.id,
    code: row.code,
    label: row.label,
    active: row.active,
  };
}

const EXAM_SELECT = {
  id: true,
  code: true,
  label: true,
  active: true,
} as const;

type ExamRow = {
  id: string;
  code: string;
  label: string;
  active: boolean;
};

function mapExam(row: ExamRow): Exam {
  return {
    id: row.id,
    code: row.code,
    label: row.label,
    active: row.active,
  };
}

export class PrismaCatalogRepository implements CatalogRepositoryPort {
  constructor(private readonly client: PrismaClient = prisma) {}

  async listNeeds(): Promise<Need[]> {
    const rows = await this.client.need.findMany({
      where: { active: true },
      select: NEED_SELECT,
      orderBy: { label: "asc" },
    });
    return rows.map(mapNeed);
  }

  async listExams(): Promise<Exam[]> {
    const rows = await this.client.exam.findMany({
      where: { active: true },
      select: EXAM_SELECT,
      orderBy: { label: "asc" },
    });
    return rows.map(mapExam);
  }

  async findNeed(id: string): Promise<Need | null> {
    const row = await this.client.need.findUnique({
      where: { id },
      select: NEED_SELECT,
    });
    if (!row || !row.active) return null;
    return mapNeed(row);
  }

  async findExam(id: string): Promise<Exam | null> {
    const row = await this.client.exam.findUnique({
      where: { id },
      select: EXAM_SELECT,
    });
    if (!row || !row.active) return null;
    return mapExam(row);
  }
}
