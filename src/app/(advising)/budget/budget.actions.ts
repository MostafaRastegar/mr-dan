"use server";

import { redirect } from "next/navigation";

import {
  freeTimeSchema,
  hhmmToMinutes,
  planTimeSchema,
} from "@/modules/advising/presentation/free-time-schemas";
import { runAction } from "@/utils/server-action";
import type { ActionState } from "@/utils/app-error";
import { getSessionContext } from "@/server/advising-guards";
import { getContainer } from "@/server/container";

function formValues(formData: FormData): Record<string, FormDataEntryValue> {
  return Object.fromEntries(formData);
}

export async function setFreeTimeAction(
  _previous: ActionState<{ dayKey: string; freeMinutes: number }> | null,
  formData: FormData,
): Promise<ActionState<{ dayKey: string; freeMinutes: number }>> {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  return runAction(async () => {
    const input = freeTimeSchema.parse(formValues(formData));
    const advising = getContainer().advising;
    // Only the actor's own row: the use case accepts `studentId` for tests, the
    // action never reads one from the client.
    const actor = { id: session.user.id, role: session.user.role };
    const freeMinutes =
      input.freeTime === null
        ? (await advising.getDayBudget.execute({ actor, dayKey: input.date }))
            .suggestedMinutes
        : hhmmToMinutes(input.freeTime);
    return advising.setFreeTimeBudget.execute({
      actor,
      dayKey: input.date,
      freeMinutes,
    });
  });
}

export async function planHomeworkAction(
  _previous: ActionState<{
    homeworkId: string;
    dayKey: string;
    plannedMinutes: number;
  }> | null,
  formData: FormData,
): Promise<
  ActionState<{ homeworkId: string; dayKey: string; plannedMinutes: number }>
> {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  return runAction(async () => {
    const input = planTimeSchema.parse(formValues(formData));
    return getContainer().advising.planHomeworkTime.execute({
      actor: { id: session.user.id, role: session.user.role },
      homeworkId: input.homeworkId,
      dayKey: input.date,
      plannedMinutes: hhmmToMinutes(input.plannedTime),
    });
  });
}

export async function deletePlanAction(
  _previous: ActionState<{ deleted: true }> | null,
  formData: FormData,
): Promise<ActionState<{ deleted: true }>> {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  return runAction<{ deleted: true }>(async () => {
    await getContainer().advising.deleteHomeworkPlan.execute({
      actor: { id: session.user.id, role: session.user.role },
      id: String(formData.get("id") ?? ""),
    });
    return { deleted: true };
  });
}
