"use server";

import { z } from "zod";

import { redirect } from "next/navigation";

import { runAction } from "@/utils/server-action";
import type { ActionState } from "@/utils/app-error";
import { getSessionContext } from "@/server/advising-guards";
import { getContainer } from "@/server/container";
import type { MealSlot } from "@/modules/advising/domain/energy";

export async function setHomeworkDoneAction(input: {
  homeworkId: string;
  minutes: number;
}): Promise<ActionState<{ id: string }>> {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  return runAction(async () => {
    const parsed = z
      .object({
        homeworkId: z.string().uuid(),
        minutes: z.number().int().min(1).max(1440),
      })
      .parse(input);
    await getContainer().advising.setHomeworkCompletion.execute({
      actor: { id: session.user.id, role: session.user.role },
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
  completed: boolean;
}): Promise<ActionState<{ completedBlocks: string[] }>> {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  return runAction(async () => {
    const parsed = z
      .object({
        dayKey: z.string(),
        startMinute: z.number().int().nonnegative().max(1439),
        minutes: z.number().int().positive().max(1440),
        subject: z.string().nullable(),
        completed: z.boolean(),
      })
      .parse(input);
    const goal = await getContainer().advising.toggleStudyBlock.execute({
      actor: { id: session.user.id, role: session.user.role },
      dayKey: parsed.dayKey,
      startMinute: parsed.startMinute,
      minutes: parsed.minutes,
      completed: parsed.completed,
    });
    return { completedBlocks: goal.completedBlocks };
  });
}

export async function addTestsAction(input: {
  delta: number;
}): Promise<ActionState<{ testsDone: number }>> {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  return runAction(async () => {
    const parsed = z
      .object({
        delta: z.number().int().min(1).max(100),
      })
      .parse(input);
    const goal = await getContainer().advising.addTestsDone.execute({
      actor: { id: session.user.id, role: session.user.role },
      delta: parsed.delta,
    });
    return { testsDone: goal.testsDone };
  });
}

export async function toggleMealSlotAction(input: {
  slot: MealSlot;
  eaten: boolean;
}): Promise<ActionState<{ eatenSlots: string[] }>> {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  return runAction(async () => {
    const parsed = z
      .object({
        slot: z.string(),
        eaten: z.boolean(),
      })
      .parse(input);
    const plan = await getContainer().advising.toggleMealSlot.execute({
      actor: { id: session.user.id, role: session.user.role },
      slot: parsed.slot as MealSlot,
      eaten: parsed.eaten,
    });
    return { eatenSlots: plan.eatenSlots };
  });
}
