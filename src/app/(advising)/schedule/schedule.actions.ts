"use server";

import { makeScheduleSchemas } from "@/modules/advising/presentation/schedule-schemas";
import { runAction } from "@/utils/server-action";
import { formValues } from "@/utils/form-data";
import type { ActionState } from "@/utils/app-error";
import { requireSessionUser } from "@/server/advising-guards";
import { getContainer } from "@/server/container";

export async function createScheduleEntryAction(
  _previous: ActionState<{ id: string }> | null,
  formData: FormData,
): Promise<ActionState<{ id: string }>> {
  const { user } = await requireSessionUser();

  return runAction(async () => {
    const { subjects } =
      await getContainer().advising.catalogOptions.execute();
    const { createScheduleEntrySchema } = makeScheduleSchemas(
      subjects.map((row) => row.slug),
    );
    const input = createScheduleEntrySchema.parse(formValues(formData));
    const entry = await getContainer().advising.createScheduleEntry.execute({
      actor: { id: user.id, role: user.role },
      ...input,
    });
    return { id: entry.id };
  });
}

export async function updateScheduleEntryAction(
  _previous: ActionState<{ id: string }> | null,
  formData: FormData,
): Promise<ActionState<{ id: string }>> {
  const { user } = await requireSessionUser();

  return runAction(async () => {
    const { subjects } =
      await getContainer().advising.catalogOptions.execute();
    const { scheduleEntrySchema } = makeScheduleSchemas(
      subjects.map((row) => row.slug),
    );
    const input = scheduleEntrySchema.parse(formValues(formData));
    const entryId = String(formData.get("id") ?? "");
    const entry = await getContainer().advising.updateScheduleEntry.execute({
      actor: { id: user.id, role: user.role },
      entryId,
      ...input,
    });
    return { id: entry.id };
  });
}

export async function deleteScheduleEntryAction(
  _previous: ActionState<{ id: string }> | null,
  formData: FormData,
): Promise<ActionState<{ id: string }>> {
  const { user } = await requireSessionUser();

  return runAction(async () => {
    const id = String(formData.get("id") ?? "");
    await getContainer().advising.deleteScheduleEntry.execute({
      actor: { id: user.id, role: user.role },
      entryId: id,
    });
    return { id };
  });
}
