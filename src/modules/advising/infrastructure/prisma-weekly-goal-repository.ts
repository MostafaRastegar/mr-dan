/**
 * Prisma implementation of WeeklyGoalRepositoryPort.
 *
 * One row per `(studentId, weekKey)` (compound unique). `incrementTestsDone`
 * issues a single atomic `upsert` whose update branch uses `{ increment }` and
 * whose create branch seeds `testsDone: delta` — a read-modify-write never
 * happens, so concurrent increments never lose an update. A create-side
 * `P2002` race is retried once as an `update({ increment })`.
 */

import type { PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/shared/prisma";
import { AppError } from "@/modules/advising/domain/errors";
import type { WeeklyGoal } from "@/modules/advising/domain/models";
import type { WeeklyGoalRepositoryPort } from "@/modules/advising/domain/ports";

const WEEKLY_GOAL_SELECT = {
  id: true,
  studentId: true,
  weekKey: true,
  testsDone: true,
  completedBlocks: true,
  createdAt: true,
  updatedAt: true,
} as const;

type WeeklyGoalRow = {
  id: string;
  studentId: string;
  weekKey: string;
  testsDone: number;
  completedBlocks: string[];
  createdAt: Date;
  updatedAt: Date;
};

function mapWeeklyGoal(row: WeeklyGoalRow): WeeklyGoal {
  return {
    id: row.id,
    studentId: row.studentId,
    weekKey: row.weekKey,
    testsDone: row.testsDone,
    completedBlocks: row.completedBlocks,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function isUniqueViolation(error: unknown): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "P2002"
  );
}

function writeFailed(cause?: unknown): AppError {
  return new AppError("weekly_goal_write_failed", 500, "Failed to persist weekly goal", cause);
}

export class PrismaWeeklyGoalRepository implements WeeklyGoalRepositoryPort {
  constructor(private readonly client: PrismaClient = prisma) {}

  async findByKey(
    studentId: string,
    weekKey: string,
  ): Promise<WeeklyGoal | null> {
    const row = await this.client.weeklyGoal.findUnique({
      where: { studentId_weekKey: { studentId, weekKey } },
      select: WEEKLY_GOAL_SELECT,
    });
    return row ? mapWeeklyGoal(row) : null;
  }

  async listInRange(
    studentId: string,
    fromWeekKey: string,
    toWeekKey: string,
  ): Promise<WeeklyGoal[]> {
    const rows = await this.client.weeklyGoal.findMany({
      where: {
        studentId,
        weekKey: { gte: fromWeekKey, lte: toWeekKey },
      },
      select: WEEKLY_GOAL_SELECT,
      orderBy: { weekKey: "asc" },
    });
    return rows.map(mapWeeklyGoal);
  }

  async setCompletedBlocks(
    studentId: string,
    weekKey: string,
    blocks: readonly string[],
  ): Promise<WeeklyGoal> {
    let row: WeeklyGoalRow;
    try {
      row = await this.client.weeklyGoal.upsert({
        where: { studentId_weekKey: { studentId, weekKey } },
        create: {
          studentId,
          weekKey,
          testsDone: 0,
          completedBlocks: [...blocks],
        },
        update: { completedBlocks: [...blocks] },
        select: WEEKLY_GOAL_SELECT,
      });
    } catch (error) {
      throw writeFailed(error);
    }
    return mapWeeklyGoal(row);
  }

  async incrementTestsDone(
    studentId: string,
    weekKey: string,
    delta: number,
  ): Promise<WeeklyGoal> {
    try {
      const row = await this.client.weeklyGoal.upsert({
        where: { studentId_weekKey: { studentId, weekKey } },
        create: {
          studentId,
          weekKey,
          testsDone: delta,
          completedBlocks: [],
        },
        update: { testsDone: { increment: delta } },
        select: WEEKLY_GOAL_SELECT,
      });
      return mapWeeklyGoal(row);
    } catch (error) {
      if (isUniqueViolation(error)) {
        // Create-side race: another transaction won the unique index. Retry
        // once as a plain atomic increment update.
        const row = await this.client.weeklyGoal.update({
          where: { studentId_weekKey: { studentId, weekKey } },
          data: { testsDone: { increment: delta } },
          select: WEEKLY_GOAL_SELECT,
        });
        return mapWeeklyGoal(row);
      }
      throw writeFailed(error);
    }
  }

  async incrementSubjectTests(input: {
    studentId: string;
    weekKey: string;
    subject: string;
    count: number;
  }): Promise<void> {
    await this.client.$transaction(async (tx) => {
      await tx.weeklyGoal.upsert({
        where: { studentId_weekKey: { studentId: input.studentId, weekKey: input.weekKey } },
        create: {
          studentId: input.studentId,
          weekKey: input.weekKey,
          testsDone: input.count,
          completedBlocks: [],
        },
        update: { testsDone: { increment: input.count } },
        select: { id: true },
      });
      await tx.testRecord.upsert({
        where: {
          studentId_subject_weekKey: {
            studentId: input.studentId,
            subject: input.subject,
            weekKey: input.weekKey,
          },
        },
        create: {
          studentId: input.studentId,
          subject: input.subject,
          weekKey: input.weekKey,
          count: input.count,
        },
        update: { count: { increment: input.count } },
        select: { id: true },
      });
    });
  }
}
