/**
 * Prisma implementation of FreeTimeBudgetRepositoryPort.
 *
 * The capacity invariant is decided inside a Serializable transaction: read the
 * day's planned total, ask the caller's `allows` callback, then write. A
 * serialization failure (P2034) becomes PlanConcurrencyError with `cause`.
 * Explicit `select`, rows mapped to domain models.
 */

import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/shared/prisma";
import { PlanConcurrencyError } from "@/modules/advising/domain/errors";
import type { FreeTimeBudget } from "@/modules/advising/domain/models";
import type {
  FreeTimeBudgetRepositoryPort,
  UpsertWithinUsedResult,
} from "@/modules/advising/domain/ports";

const BUDGET_SELECT = {
  id: true,
  studentId: true,
  dayKey: true,
  freeMinutes: true,
} as const;

type BudgetRow = {
  id: string;
  studentId: string;
  dayKey: string;
  freeMinutes: number;
};

function mapBudget(row: BudgetRow): FreeTimeBudget {
  return {
    id: row.id,
    studentId: row.studentId,
    dayKey: row.dayKey,
    freeMinutes: row.freeMinutes,
  };
}

function isP2034(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034"
  );
}

export class PrismaFreeTimeBudgetRepository implements FreeTimeBudgetRepositoryPort {
  constructor(private readonly client: PrismaClient = prisma) {}

  async findByDay(studentId: string, dayKey: string): Promise<FreeTimeBudget | null> {
    const row = await this.client.freeTimeBudget.findUnique({
      where: { studentId_dayKey: { studentId, dayKey } },
      select: BUDGET_SELECT,
    });
    return row ? mapBudget(row) : null;
  }

  async listInRange(
    studentId: string,
    fromKey: string,
    toKey: string,
  ): Promise<FreeTimeBudget[]> {
    const rows = await this.client.freeTimeBudget.findMany({
      where: { studentId, dayKey: { gte: fromKey, lte: toKey } },
      select: BUDGET_SELECT,
      orderBy: { dayKey: "asc" },
    });
    return rows.map(mapBudget);
  }

  async upsertWithinUsed(input: {
    studentId: string;
    dayKey: string;
    freeMinutes: number;
    allows: (usedMinutes: number) => boolean;
  }): Promise<UpsertWithinUsedResult> {
    try {
      return await this.client.$transaction(
        async (tx) => {
          const agg = await tx.homeworkPlanEntry.aggregate({
            _sum: { plannedMinutes: true },
            where: { studentId: input.studentId, dayKey: input.dayKey },
          });
          const usedMinutes = agg._sum.plannedMinutes ?? 0;
          if (!input.allows(usedMinutes)) return { ok: false, usedMinutes } as const;
          const row = await tx.freeTimeBudget.upsert({
            where: {
              studentId_dayKey: { studentId: input.studentId, dayKey: input.dayKey },
            },
            create: {
              studentId: input.studentId,
              dayKey: input.dayKey,
              freeMinutes: input.freeMinutes,
            },
            update: { freeMinutes: input.freeMinutes },
            select: BUDGET_SELECT,
          });
          return { ok: true, budget: mapBudget(row) } as const;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (isP2034(error)) throw new PlanConcurrencyError(error);
      throw error;
    }
  }
}
