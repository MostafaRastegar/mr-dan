"use server";

import { redirect } from "next/navigation";

import { homeworkSchema } from "@/modules/advising/presentation/homework-schemas";
import { runAction } from "@/utils/server-action";
import { formValues } from "@/utils/form-data";
import type { ActionState } from "@/utils/app-error";
import { getSessionContext } from "@/server/advising-guards";
import { getContainer } from "@/server/container";

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
  _previous: ActionState<{ id: string }> | null,
  formData: FormData,
): Promise<ActionState<{ id: string }>> {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  return runAction(async () => {
    const id = String(formData.get("id") ?? "");
    const completed = formData.get("completed") === "true";
    await getContainer().advising.setHomeworkCompletion.execute({
      actor: { id: session.user.id, role: session.user.role },
      homeworkId: id,
      completed,
    });
    return { id };
  });
}

export async function deleteHomeworkAction(
  _previous: ActionState<{ id: string }> | null,
  formData: FormData,
): Promise<ActionState<{ id: string }>> {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  return runAction(async () => {
    const id = String(formData.get("id") ?? "");
    await getContainer().advising.deleteHomework.execute({
      actor: { id: session.user.id, role: session.user.role },
      homeworkId: id,
    });
    return { id };
  });
}
