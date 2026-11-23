"use server";

import { redirect } from "next/navigation";

import { homeworkSchema } from "@/modules/advising/presentation/homework-schemas";
import { runAction } from "@/utils/server-action";
import type { ActionState } from "@/utils/app-error";
import { getSessionContext } from "@/server/advising-guards";
import { getContainer } from "@/server/container";

function formValues(formData: FormData): Record<string, FormDataEntryValue> {
  return Object.fromEntries(formData);
}

export async function createHomeworkAction(
  _previous: ActionState<{ id: string }> | null,
  formData: FormData,
): Promise<ActionState<{ id: string }>> {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  return runAction(async () => {
    const input = homeworkSchema.parse(formValues(formData));
    const item = await getContainer().advising.createHomework.execute({
      actor: { id: session.user.id, role: session.user.role },
      ...input,
    });
    return { id: item.id };
  });
}

export async function toggleHomeworkAction(
  id: string,
  completed: boolean,
): Promise<ActionState<{ id: string }>> {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  return runAction(async () => {
    await getContainer().advising.setHomeworkCompletion.execute({
      actor: { id: session.user.id, role: session.user.role },
      homeworkId: id,
      completed,
    });
    return { id };
  });
}

export async function deleteHomeworkAction(
  id: string,
): Promise<ActionState<{ id: string }>> {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  return runAction(async () => {
    await getContainer().advising.deleteHomework.execute({
      actor: { id: session.user.id, role: session.user.role },
      homeworkId: id,
    });
    return { id };
  });
}
