"use server";

import { z } from "zod";

import { runAction } from "@/utils/server-action";
import type { ActionState } from "@/utils/app-error";
import { requireSessionUser } from "@/server/advising-guards";
import { getContainer } from "@/server/container";

const logSchema = z.object({
  weekKey: z.string().optional(),
  dayKey: z.string(),
  entryId: z.string().uuid(),
  minutes: z.number().int().min(0).max(1440),
});

export async function setStudyMinutesAction(input: {
  weekKey?: string;
  dayKey: string;
  entryId: string;
  minutes: number;
}): Promise<ActionState<{ loggedMinutes: number }>> {
  const { user } = await requireSessionUser();

  return runAction(async () => {
    const parsed = logSchema.parse(input);
    await getContainer().advising.setStudyMinutes.execute({
      actor: { id: user.id, role: user.role },
      ...parsed,
    });
    return { loggedMinutes: parsed.minutes };
  });
}

const testsSchema = z.object({
  weekKey: z.string().optional(),
  subject: z.string().min(1).max(100),
  count: z.number().int().min(0).max(2000),
});

export async function setSubjectTestsAction(input: {
  weekKey?: string;
  subject: string;
  count: number;
}): Promise<ActionState<{ testsDone: number }>> {
  const { user } = await requireSessionUser();

  return runAction(async () => {
    const parsed = testsSchema.parse(input);
    const goal = await getContainer().advising.setSubjectTests.execute({
      actor: { id: user.id, role: user.role },
      ...parsed,
    });
    return { testsDone: goal.testsDone };
  });
}
