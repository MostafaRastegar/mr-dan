/**
 * Prisma implementation of HomeworkPlanRepositoryPort.
 *
 * The capacity invariant is decided inside a Serializable transaction: read the
 * day's budget, sum the day's planned minutes excluding the row being replaced,
 * ask the caller's `allows` callback, then upsert. A serialization failure
 * (P2034) is retried a bounded number of times, then becomes
 * PlanConcurrencyError with `cause`. Explicit `select`, rows
 * mapped to domain models.
 */

import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/shared/prisma";
import { NotFoundError, PlanConcurrencyError } from "@/modules/advising/domain/errors";
import type { HomeworkPlanEntry } from "@/modules/advising/domain/models";
import type {
  HomeworkPlanRepositoryPort,
  UpsertWithinCapacityResult,
} from "@/modules/advising/domain/ports";

const PLAN_SELECT = {
  id: true,
  studentId: true,
  dayKey: true,
  homeworkId: true,
  plannedMinutes: true,
} as const;

type PlanRow = {
  id: string;
  studentId: string;
  dayKey: string;
  homeworkId: string;
  plannedMinutes: number;
};

function mapPlan(row: PlanRow): HomeworkPlanEntry {
  return {
    id: row.id,
    studentId: row.studentId,
    dayKey: row.dayKey,
    homeworkId: row.homeworkId,
    plannedMinutes: row.plannedMinutes,
  };
}

// Under SERIALIZABLE the Aggregate below takes a predicate lock on the whole
// HomeworkPlanEntry relation, so unrelated writers get P2034. That is a
// transient conflict, not a business rejection: retry a few times, then give up
// with PlanConcurrencyError. Domain rejections return `ok: false` instead of
// throwing, so they are never retried.
const MAX_ATTEMPTS = 3;

function isP2034(error: unknown): boolean {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  ) {
    return true;
  }
  // Prisma 7 wraps adapter errors; the code then lives on `cause`.
  return (
    error instanceof Error &&
    error.cause instanceof Prisma.PrismaClientKnownRequestError &&
    error.cause.code === "P2034"
  );
}

function backoffMs(attempt: number): number {
  return 5 * attempt + Math.random() * 5;
}

async function retryOnSerializationFailure<T>(run: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      if (!isP2034(error)) throw error;
      if (attempt >= MAX_ATTEMPTS) throw new PlanConcurrencyError(error);
      await new Promise((resolve) => setTimeout(resolve, backoffMs(attempt)));
    }
  }
}

export class PrismaHomeworkPlanRepository implements HomeworkPlanRepositoryPort {
  constructor(private readonly client: PrismaClient = prisma) {}

  async listByDay(studentId: string, dayKey: string): Promise<HomeworkPlanEntry[]> {
    const rows = await this.client.homeworkPlanEntry.findMany({
      where: { studentId, dayKey },
      select: PLAN_SELECT,
      orderBy: { createdAt: "asc" },
    });
    return rows.map(mapPlan);
  }

  async listByStudentInRange(
    studentId: string,
    fromKey: string,
    toKey: string,
  ): Promise<HomeworkPlanEntry[]> {
    const rows = await this.client.homeworkPlanEntry.findMany({
      where: { studentId, dayKey: { gte: fromKey, lte: toKey } },
      select: PLAN_SELECT,
      orderBy: [{ dayKey: "asc" }, { createdAt: "asc" }],
    });
    return rows.map(mapPlan);
  }

  async findByHomeworkAndDay(
    homeworkId: string,
    dayKey: string,
  ): Promise<HomeworkPlanEntry | null> {
    const row = await this.client.homeworkPlanEntry.findUnique({
      where: { homeworkId_dayKey: { homeworkId, dayKey } },
      select: PLAN_SELECT,
    });
    return row ? mapPlan(row) : null;
  }

  async upsertWithinCapacity(input: {
    studentId: string;
    homeworkId: string;
    dayKey: string;
    plannedMinutes: number;
    allows: (current: { freeMinutes: number | null; usedMinutes: number }) => boolean;
  }): Promise<UpsertWithinCapacityResult> {
    return await retryOnSerializationFailure(() =>
      this.client.$transaction(
        async (tx) => {
          const budget = await tx.freeTimeBudget.findUnique({
            where: {
              studentId_dayKey: { studentId: input.studentId, dayKey: input.dayKey },
            },
            select: { freeMinutes: true },
          });
          if (!budget) return { ok: false, freeMinutes: null, usedMinutes: 0 } as const;
          const agg = await tx.homeworkPlanEntry.aggregate({
            _sum: { plannedMinutes: true },
            where: {
              studentId: input.studentId,
              dayKey: input.dayKey,
              homeworkId: { not: input.homeworkId },
            },
          });
          const usedMinutes = agg._sum.plannedMinutes ?? 0;
          if (!input.allows({ freeMinutes: budget.freeMinutes, usedMinutes })) {
            return {
              ok: false,
              freeMinutes: budget.freeMinutes,
              usedMinutes,
            } as const;
          }
          const row = await tx.homeworkPlanEntry.upsert({
            where: {
              homeworkId_dayKey: { homeworkId: input.homeworkId, dayKey: input.dayKey },
            },
            create: {
              studentId: input.studentId,
              dayKey: input.dayKey,
              homeworkId: input.homeworkId,
              plannedMinutes: input.plannedMinutes,
            },
            update: { plannedMinutes: input.plannedMinutes },
            select: PLAN_SELECT,
          });
          return { ok: true, entry: mapPlan(row) } as const;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    );
  }

  async delete(input: { id: string; studentId: string }): Promise<void> {
    const { count } = await this.client.homeworkPlanEntry.deleteMany({
      where: { id: input.id, studentId: input.studentId },
    });
    if (count === 0) throw new NotFoundError("plan");
  }
}
