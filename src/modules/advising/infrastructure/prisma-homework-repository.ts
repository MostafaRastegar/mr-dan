/**
 * Prisma implementation of HomeworkRepositoryPort.
 *
 * Explicit `select`, rows mapped to domain models. `priority` is stored as a
 * rank number and exposed as a label via HOMEWORK_PRIORITY_LABEL.
 */

import type { PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/shared/prisma";
import type {
  HomeworkFilter,
  HomeworkItem,
  NewHomework,
} from "@/modules/advising/domain/models";
import { HOMEWORK_PRIORITY_LABEL } from "@/modules/advising/domain/models";
import {
  NotFoundError,
} from "@/modules/advising/domain/errors";
import type { HomeworkRepositoryPort } from "@/modules/advising/domain/ports";
import type { Page } from "@/modules/advising/domain/models";

const HOMEWORK_SELECT = {
  id: true,
  studentId: true,
  title: true,
  subject: true,
  priority: true,
  deadline: true,
  completedAt: true,
  spentMinutes: true,
  createdAt: true,
  updatedAt: true,
} as const;

type HomeworkRow = {
  id: string;
  studentId: string;
  title: string;
  subject: string | null;
  priority: number;
  deadline: Date;
  completedAt: Date | null;
  spentMinutes: number | null;
  createdAt: Date;
  updatedAt: Date;
};

function mapHomework(row: HomeworkRow): HomeworkItem {
  return {
    id: row.id,
    studentId: row.studentId,
    title: row.title,
    subject: row.subject,
    priority: HOMEWORK_PRIORITY_LABEL[row.priority] ?? "low",
    deadline: row.deadline,
    completedAt: row.completedAt,
    spentMinutes: row.spentMinutes,
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

export class PrismaHomeworkRepository implements HomeworkRepositoryPort {
  constructor(private readonly client: PrismaClient = prisma) {}

  private whereOf(studentId: string, filter: HomeworkFilter) {
    return {
      studentId,
      ...(filter === "pending" ? { completedAt: null } : {}),
      ...(filter === "done" ? { completedAt: { not: null } } : {}),
    };
  }

  async listByStudent(
    studentId: string,
    filter: HomeworkFilter,
  ): Promise<HomeworkItem[]> {
    const rows = await this.client.homework.findMany({
      where: this.whereOf(studentId, filter),
      select: HOMEWORK_SELECT,
      orderBy: [{ completedAt: "asc" }, { priority: "desc" }, { deadline: "asc" }],
    });
    return rows.map(mapHomework);
  }

  async listByStudentPaged(
    studentId: string,
    filter: HomeworkFilter,
    page: number,
    pageSize: number,
  ): Promise<Page<HomeworkItem>> {
    const where = this.whereOf(studentId, filter);
    const orderBy = [
      { completedAt: "asc" as const },
      { priority: "desc" as const },
      { deadline: "asc" as const },
    ];
    const [rows, total] = await Promise.all([
      this.client.homework.findMany({
        where,
        select: HOMEWORK_SELECT,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.client.homework.count({ where }),
    ]);
    return {
      items: rows.map(mapHomework),
      page,
      pageSize,
      total,
    };
  }

  async findById(id: string): Promise<HomeworkItem | null> {
    const row = await this.client.homework.findUnique({
      where: { id },
      select: HOMEWORK_SELECT,
    });
    return row ? mapHomework(row) : null;
  }

  async create(input: NewHomework): Promise<HomeworkItem> {
    const row = await this.client.homework.create({
      data: {
        studentId: input.studentId,
        title: input.title,
        ...(input.subject !== undefined ? { subject: input.subject } : {}),
        priority: input.priority,
        deadline: input.deadline,
      },
      select: HOMEWORK_SELECT,
    });
    return mapHomework(row);
  }

  async setCompletion(
    id: string,
    input: { completedAt: Date | null; spentMinutes: number | null },
  ): Promise<HomeworkItem> {
    try {
      const row = await this.client.homework.update({
        where: { id },
        data: { completedAt: input.completedAt, spentMinutes: input.spentMinutes },
        select: HOMEWORK_SELECT,
      });
      return mapHomework(row);
    } catch (error) {
      if (isP2025(error)) throw new NotFoundError("homework", error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.client.homework.delete({
        where: { id },
        select: { id: true },
      });
    } catch (error) {
      if (isP2025(error)) throw new NotFoundError("homework", error);
      throw error;
    }
  }
}
