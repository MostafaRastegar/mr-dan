/**
 * Prisma implementation of MealPlanRepositoryPort.
 *
 * One row per `(studentId, dayKey)`; `upsert` targets the compound unique so a
 * second save replaces the first. The `meals` column is `Json`, so reads go
 * through a structural guard instead of a cast. Prisma errors are wrapped with
 * the original kept as `cause`.
 */

import type { PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/shared/prisma";
import { AppError } from "@/modules/advising/domain/errors";
import {
  MEAL_SLOTS,
  type MealSlot,
} from "@/modules/advising/domain/energy";
import type {
  MealPlanItem,
  MealPlanRecord,
  NewMealPlan,
} from "@/modules/advising/domain/models";
import type { MealPlanRepositoryPort } from "@/modules/advising/domain/ports";

const MEAL_PLAN_SELECT = {
  id: true,
  studentId: true,
  dayKey: true,
  targetCalories: true,
  meals: true,
  createdAt: true,
  updatedAt: true,
} as const;

type MealPlanRow = {
  id: string;
  studentId: string;
  dayKey: string;
  targetCalories: number;
  meals: unknown;
  createdAt: Date;
  updatedAt: Date;
};

function corruptPlan(cause?: unknown): AppError {
  return new AppError("invalid_stored_meal_plan", 500, "Stored meal plan is malformed", cause);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isMealSlot(value: unknown): value is MealSlot {
  return MEAL_SLOTS.some((slot) => slot === value);
}

function parseMealItem(value: unknown): MealPlanItem {
  if (!isRecord(value)) throw corruptPlan(value);
  const { slot, label, calories } = value;
  if (
    !isMealSlot(slot) ||
    typeof label !== "string" ||
    typeof calories !== "number" ||
    !Number.isFinite(calories)
  ) {
    throw corruptPlan(value);
  }
  return { slot, label, calories };
}

function parseMeals(value: unknown): MealPlanItem[] {
  if (!Array.isArray(value)) throw corruptPlan(value);
  return value.map(parseMealItem);
}

function mapMealPlan(row: MealPlanRow): MealPlanRecord {
  return {
    id: row.id,
    studentId: row.studentId,
    dayKey: row.dayKey,
    targetCalories: row.targetCalories,
    meals: parseMeals(row.meals),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaMealPlanRepository implements MealPlanRepositoryPort {
  constructor(private readonly client: PrismaClient = prisma) {}

  async findByDay(studentId: string, dayKey: string): Promise<MealPlanRecord | null> {
    const row = await this.client.mealPlan.findUnique({
      where: { studentId_dayKey: { studentId, dayKey } },
      select: MEAL_PLAN_SELECT,
    });
    return row ? mapMealPlan(row) : null;
  }

  async upsert(input: NewMealPlan): Promise<MealPlanRecord> {
    let row: MealPlanRow;
    try {
      row = await this.client.mealPlan.upsert({
        where: {
          studentId_dayKey: { studentId: input.studentId, dayKey: input.dayKey },
        },
        create: {
          studentId: input.studentId,
          dayKey: input.dayKey,
          targetCalories: input.targetCalories,
          meals: input.meals.map((meal) => ({
            slot: meal.slot,
            label: meal.label,
            calories: meal.calories,
          })),
        },
        update: {
          targetCalories: input.targetCalories,
          meals: input.meals.map((meal) => ({
            slot: meal.slot,
            label: meal.label,
            calories: meal.calories,
          })),
        },
        select: MEAL_PLAN_SELECT,
      });
    } catch (error) {
      throw new AppError("meal_plan_write_failed", 500, "Failed to persist meal plan", error);
    }
    return mapMealPlan(row);
  }
}
