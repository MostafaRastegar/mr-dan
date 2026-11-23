/**
 * Pure display helpers for the nutrition page.
 *
 * No React, no antd, no I/O: the view formats a number and a slot label here.
 */

import type { MealSlot } from "../domain/energy";

const CALORIE_FORMAT = new Intl.NumberFormat("fa-IR");

const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: "صبحانه",
  lunch: "ناهار",
  dinner: "شام",
  snack: "میان‌وعده",
};

export function formatCalories(value: number): string {
  return CALORIE_FORMAT.format(value);
}

export function formatMealSlot(slot: MealSlot): string {
  return MEAL_SLOT_LABELS[slot];
}
