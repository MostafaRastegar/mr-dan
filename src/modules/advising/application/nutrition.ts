/**
 * Nutrition use cases.
 *
 * Read renders an all-null profile and `energy: null` rather than guessing;
 * save rejects a partial profile with `ProfileIncompleteError` before any
 * write (D-3, D-9). A meal plan is generated from TDEE and upserted per
 * `(studentId, dayKey)` — never hand-edited (D-4).
 */

import {
  assertPlanRead,
  assertPlanWrite,
  type Actor,
} from "@/modules/advising/application/planning-access";
import { ProfileIncompleteError, ValidationError } from "@/modules/advising/domain/errors";
import {
  computeEnergy,
  isPhysicalProfileComplete,
  mealDistribution,
  type MealSlot,
  MEAL_SLOTS,
  type PhysicalProfile,
  type PhysicalProfilePatch,
} from "@/modules/advising/domain/energy";
import type { MealPlanRecord } from "@/modules/advising/domain/models";
import type {
  MealPlanRepositoryPort,
  UserRepositoryPort,
} from "@/modules/advising/domain/ports";
import { iranDayKey } from "@/modules/advising/domain/day-key";

const EMPTY_PROFILE: PhysicalProfile = {
  age: null,
  gender: null,
  heightCm: null,
  weightKg: null,
  activityLevel: null,
  dietGoal: null,
};

export type EnergyEstimate = {
  bmr: number;
  tdee: number;
  targetCalories: number;
};

export interface NutritionOverview {
  profile: PhysicalProfile;
  energy: EnergyEstimate | null;
  todayKey: string;
  todayPlan: MealPlanRecord | null;
}

function ownerIdOf(input: { studentId?: string; actor: Actor }): string {
  return input.studentId ?? input.actor.id;
}

export class GetNutritionOverviewUseCase {
  constructor(
    private readonly users: UserRepositoryPort,
    private readonly mealPlans: MealPlanRepositoryPort,
  ) {}

  async execute(input: {
    actor: Actor;
    studentId?: string;
    now?: Date;
  }): Promise<NutritionOverview> {
    const ownerId = ownerIdOf(input);
    await assertPlanRead(this.users, input.actor, ownerId);

    const stored = await this.users.findPhysicalProfile(ownerId);
    const profile = stored ?? EMPTY_PROFILE;
    const energy = isPhysicalProfileComplete(profile) ? computeEnergy(profile) : null;

    const todayKey = iranDayKey(input.now ?? new Date());
    const todayPlan = await this.mealPlans.findByDay(ownerId, todayKey);

    return { profile, energy, todayKey, todayPlan };
  }
}

export class UpdatePhysicalProfileUseCase {
  constructor(private readonly users: UserRepositoryPort) {}

  async execute(input: {
    actor: Actor;
    studentId?: string;
    patch: PhysicalProfilePatch;
  }): Promise<PhysicalProfile> {
    const ownerId = ownerIdOf(input);
    assertPlanWrite(input.actor, "nutrition:write", ownerId);
    return this.users.updatePhysicalProfile(ownerId, input.patch);
  }
}

export class SaveMealPlanUseCase {
  constructor(
    private readonly users: UserRepositoryPort,
    private readonly mealPlans: MealPlanRepositoryPort,
  ) {}

  async execute(input: {
    actor: Actor;
    studentId?: string;
    now?: Date;
  }): Promise<MealPlanRecord> {
    const ownerId = ownerIdOf(input);
    assertPlanWrite(input.actor, "nutrition:write", ownerId);

    const profile = await this.users.findPhysicalProfile(ownerId);
    if (!profile || !isPhysicalProfileComplete(profile)) {
      throw new ProfileIncompleteError();
    }

    const { targetCalories } = computeEnergy(profile);
    return this.mealPlans.upsert({
      studentId: ownerId,
      dayKey: iranDayKey(input.now ?? new Date()),
      targetCalories,
      meals: mealDistribution(targetCalories),
    });
  }
}

export class ToggleMealSlotUseCase {
  constructor(
    private readonly saveMealPlan: SaveMealPlanUseCase,
    private readonly mealPlans: MealPlanRepositoryPort,
  ) {}

  async execute(input: {
    actor: Actor;
    studentId?: string;
    now?: Date;
    slot: MealSlot;
    eaten: boolean;
  }): Promise<MealPlanRecord> {
    const ownerId = ownerIdOf(input);
    assertPlanWrite(input.actor, "nutrition:write", ownerId);

    if (!MEAL_SLOTS.includes(input.slot)) {
      throw new ValidationError("نوبت غذا معتبر نیست");
    }

    const todayKey = iranDayKey(input.now ?? new Date());
    let plan = await this.mealPlans.findByDay(ownerId, todayKey);
    if (!plan) {
      plan = await this.saveMealPlan.execute({
        actor: input.actor,
        studentId: ownerId,
        now: input.now,
      });
    }

    const eatenSlots = input.eaten
      ? [...new Set([...plan.eatenSlots, input.slot])]
      : plan.eatenSlots.filter((slot) => slot !== input.slot);

    return this.mealPlans.setEatenSlots(ownerId, todayKey, eatenSlots);
  }
}
