"use server";

import { redirect } from "next/navigation";

import { schoolProgramSchema } from "@/modules/advising/presentation/advisor-schemas";
import { runAction } from "@/utils/server-action";
import { formValues } from "@/utils/form-data";
import type { ActionState } from "@/utils/app-error";
import { getSessionContext } from "@/server/advising-guards";
import { getContainer } from "@/server/container";

export async function addSchoolProgramEntryAction(
  _previous: ActionState<{ id: string }> | null,
  formData: FormData,
): Promise<ActionState<{ id: string }>> {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  return runAction(async () => {
    const input = schoolProgramSchema.parse(formValues(formData));
    const entry = await getContainer().advising.addSchoolProgramEntry.execute({
      actor: { id: session.user.id, role: session.user.role },
      dayOfWeek: input.dayOfWeek,
      subject: input.subject,
      hours: input.hours,
    });
    return { id: entry.id };
  });
}

export async function deleteSchoolProgramEntryAction(
  _previous: ActionState<{ id: string }> | null,
  formData: FormData,
): Promise<ActionState<{ id: string }>> {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  return runAction(async () => {
    const id = String(formData.get("id") ?? "");
    await getContainer().advising.deleteSchoolProgramEntry.execute({
      actor: { id: session.user.id, role: session.user.role },
      entryId: id,
    });
    return { id };
  });
}
