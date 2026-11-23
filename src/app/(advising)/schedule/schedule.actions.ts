"use server";

import { redirect } from "next/navigation";

import { scheduleEntrySchema } from "@/modules/advising/presentation/schedule-schemas";
import { runAction } from "@/utils/server-action";
import type { ActionState } from "@/utils/app-error";
import { getSessionContext } from "@/server/advising-guards";
import { getContainer } from "@/server/container";

function formValues(formData: FormData): Record<string, FormDataEntryValue> {
  return Object.fromEntries(formData);
}

export async function createScheduleEntryAction(
  _previous: ActionState<{ id: string }> | null,
  formData: FormData,
): Promise<ActionState<{ id: string }>> {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  return runAction(async () => {
    const input = scheduleEntrySchema.parse(formValues(formData));
    const entry = await getContainer().advising.createScheduleEntry.execute({
      actor: { id: session.user.id, role: session.user.role },
      ...input,
    });
    return { id: entry.id };
  });
}

export async function updateScheduleEntryAction(
  _previous: ActionState<{ id: string }> | null,
  formData: FormData,
): Promise<ActionState<{ id: string }>> {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  return runAction(async () => {
    const input = scheduleEntrySchema.parse(formValues(formData));
    const entryId = String(formData.get("id") ?? "");
    const entry = await getContainer().advising.updateScheduleEntry.execute({
      actor: { id: session.user.id, role: session.user.role },
      entryId,
      ...input,
    });
    return { id: entry.id };
  });
}

export async function deleteScheduleEntryAction(
  id: string,
): Promise<ActionState<{ id: string }>> {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  return runAction(async () => {
    await getContainer().advising.deleteScheduleEntry.execute({
      actor: { id: session.user.id, role: session.user.role },
      entryId: id,
    });
    return { id };
  });
}
