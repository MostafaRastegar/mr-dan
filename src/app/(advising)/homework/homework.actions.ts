"use server";

import { makeHomeworkSchemas } from "@/modules/advising/presentation/homework-schemas";
import { runAction } from "@/utils/server-action";
import { formValues } from "@/utils/form-data";
import type { ActionState } from "@/utils/app-error";
import { requireSessionUser } from "@/server/advising-guards";
import { getContainer } from "@/server/container";

export async function createHomeworkAction(
  _previous: ActionState<{ id: string }> | null,
  formData: FormData,
): Promise<ActionState<{ id: string }>> {
  const { user } = await requireSessionUser();

  return runAction(async () => {
    const { subjects } =
      await getContainer().advising.catalogOptions.execute();
    const { homeworkSchema } = makeHomeworkSchemas(
      subjects.map((row) => row.slug),
    );
    const input = homeworkSchema.parse(formValues(formData));
    const item = await getContainer().advising.createHomework.execute({
      actor: { id: user.id, role: user.role },
      ...input,
    });
    return { id: item.id };
  });
}

export async function toggleHomeworkAction(
  _previous: ActionState<{ id: string }> | null,
  formData: FormData,
): Promise<ActionState<{ id: string }>> {
  const { user } = await requireSessionUser();

  return runAction(async () => {
    const id = String(formData.get("id") ?? "");
    const completed = formData.get("completed") === "true";
    await getContainer().advising.setHomeworkCompletion.execute({
      actor: { id: user.id, role: user.role },
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
  const { user } = await requireSessionUser();

  return runAction(async () => {
    const id = String(formData.get("id") ?? "");
    await getContainer().advising.deleteHomework.execute({
      actor: { id: user.id, role: user.role },
      homeworkId: id,
    });
    return { id };
  });
}
