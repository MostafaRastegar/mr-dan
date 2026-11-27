"use server";

import { z } from "zod";

import { runAction } from "@/utils/server-action";
import type { ActionState } from "@/utils/app-error";
import { requireSessionUser } from "@/server/advising-guards";
import { getContainer } from "@/server/container";
import type { MealSlot } from "@/modules/advising/domain/energy";

export async function setHomeworkDoneAction(input: {
  homeworkId: string;
  minutes: number;
}): Promise<ActionState<{ id: string }>> {
  const { user } = await requireSessionUser();

  return runAction(async () => {
    const parsed = z
      .object({
        homeworkId: z.string().uuid(),
        minutes: z.number().int().min(1).max(1440),
      })
      .parse(input);
    await getContainer().advising.setHomeworkCompletion.execute({
      actor: { id: user.id, role: user.role },
      homeworkId: parsed.homeworkId,
      completed: true,
      spentMinutes: parsed.minutes,
    });
    return { id: parsed.homeworkId };
  });
}

export async function toggleStudyBlockAction(input: {
  dayKey: string;
  startMinute: number;
  minutes: number;
  subject: string | null;
  entryId?: string;
  completed: boolean;
}): Promise<ActionState<{ completedBlocks: string[] }>> {
  const { user } = await requireSessionUser();

  return runAction(async () => {
    const parsed = z
      .object({
        dayKey: z.string(),
        startMinute: z.number().int().nonnegative().max(1439),
        minutes: z.number().int().positive().max(1440),
        subject: z.string().nullable(),
        entryId: z.string().uuid().optional(),
        completed: z.boolean(),
      })
      .parse(input);
    const goal = await getContainer().advising.toggleStudyBlock.execute({
      actor: { id: user.id, role: user.role },
      dayKey: parsed.dayKey,
      startMinute: parsed.startMinute,
      minutes: parsed.minutes,
      entryId: parsed.entryId,
      completed: parsed.completed,
    });
    return { completedBlocks: goal.completedBlocks };
  });
}

export async function addTestsAction(input: {
  delta: number;
  subject: string;
}): Promise<ActionState<{ testsDone: number }>> {
  const { user } = await requireSessionUser();

  return runAction(async () => {
    const parsed = z
      .object({
        delta: z.number().int().min(1).max(100),
        subject: z.string().min(1).max(100),
      })
      .parse(input);
    const goal = await getContainer().advising.addTestsDone.execute({
      actor: { id: user.id, role: user.role },
      delta: parsed.delta,
      subject: parsed.subject,
    });
    return { testsDone: goal.testsDone };
  });
}

export async function toggleMealSlotAction(input: {
  slot: MealSlot;
  eaten: boolean;
}): Promise<ActionState<{ eatenSlots: string[] }>> {
  const { user } = await requireSessionUser();

  return runAction(async () => {
    const parsed = z
      .object({
        slot: z.string(),
        eaten: z.boolean(),
      })
      .parse(input);
    const plan = await getContainer().advising.toggleMealSlot.execute({
      actor: { id: user.id, role: user.role },
      slot: parsed.slot as MealSlot,
      eaten: parsed.eaten,
    });
    return { eatenSlots: plan.eatenSlots };
  });
}
