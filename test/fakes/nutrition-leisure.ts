/**
 * In-memory nutrition/leisure fakes for use-case unit tests.
 *
 * `FakeNutritionUserRepository` extends the shared advising fake with a
 * physical-profile seed hook and a write counter, so denial tests can assert
 * `physicalWrites === 0`. `FakeMealPlanRepository` keys rows by
 * `${studentId}:${dayKey}`, mirroring the composite unique constraint.
 */

import { FakeUserRepository } from "./advising";
import {
  createPlanningStore,
  FakeFreeTimeBudgetRepository,
  FakeHomeworkPlanRepository,
  FakeHomeworkRepository,
} from "./planning";
import type {
  MealPlanRecord,
  NewMealPlan,
  PhysicalProfile,
  PhysicalProfilePatch,
} from "@/modules/advising/domain/models";
import type { MealPlanRepositoryPort } from "@/modules/advising/domain/ports";

export class FakeNutritionUserRepository extends FakeUserRepository {
  physicalWrites = 0;
  private readonly seededProfiles = new Map<string, PhysicalProfile>();

  constructor() {
    super({ groupNames: new Map(), groupCounts: new Map() });
  }

  /** Seeds a partial or complete profile without going through the write path. */
  seedPhysicalProfile(id: string, profile: PhysicalProfile): void {
    this.seededProfiles.set(id, profile);
  }

  override async findPhysicalProfile(id: string): Promise<PhysicalProfile | null> {
    return this.seededProfiles.get(id) ?? super.findPhysicalProfile(id);
  }

  override async updatePhysicalProfile(
    id: string,
    patch: PhysicalProfilePatch,
  ): Promise<PhysicalProfile> {
    const profile = await super.updatePhysicalProfile(id, patch);
    this.seededProfiles.set(id, profile);
    this.physicalWrites += 1;
    return profile;
  }
}

export class FakeMealPlanRepository implements MealPlanRepositoryPort {
  private readonly rows = new Map<string, MealPlanRecord>();
  private sequence = 0;
  writes = 0;

  all(): MealPlanRecord[] {
    return [...this.rows.values()];
  }

  count(): number {
    return this.rows.size;
  }

  async findByDay(studentId: string, dayKey: string): Promise<MealPlanRecord | null> {
    return this.rows.get(`${studentId}:${dayKey}`) ?? null;
  }

  async upsert(input: NewMealPlan): Promise<MealPlanRecord> {
    this.writes += 1;
    const key = `${input.studentId}:${input.dayKey}`;
    const existing = this.rows.get(key);
    const stamp = new Date(2026, 10, 23);

    if (existing) {
      const next: MealPlanRecord = {
        ...existing,
        targetCalories: input.targetCalories,
        meals: input.meals,
        updatedAt: stamp,
      };
      this.rows.set(key, next);
      return next;
    }

    this.sequence += 1;
    const row: MealPlanRecord = {
      id: `meal-plan-${this.sequence}`,
      studentId: input.studentId,
      dayKey: input.dayKey,
      targetCalories: input.targetCalories,
      meals: input.meals,
      eatenSlots: [],
      createdAt: stamp,
      updatedAt: stamp,
    };
    this.rows.set(key, row);
    return row;
  }

  async setEatenSlots(
    studentId: string,
    dayKey: string,
    slots: readonly string[],
  ): Promise<MealPlanRecord> {
    const key = `${studentId}:${dayKey}`;
    const existing = this.rows.get(key);
    if (!existing) throw new Error("meal plan not found");
    const next: MealPlanRecord = {
      ...existing,
      eatenSlots: [...slots],
      updatedAt: new Date(2026, 10, 23),
    };
    this.rows.set(key, next);
    return next;
  }
}

export interface NutritionLeisureFakes {
  users: FakeNutritionUserRepository;
  mealPlans: FakeMealPlanRepository;
  homework: FakeHomeworkRepository;
  budget: FakeFreeTimeBudgetRepository;
  plans: FakeHomeworkPlanRepository;
}

export function createNutritionLeisureFakes(): NutritionLeisureFakes {
  const store = createPlanningStore();
  return {
    users: new FakeNutritionUserRepository(),
    mealPlans: new FakeMealPlanRepository(),
    homework: new FakeHomeworkRepository(),
    budget: new FakeFreeTimeBudgetRepository(store),
    plans: new FakeHomeworkPlanRepository(store),
  };
}
