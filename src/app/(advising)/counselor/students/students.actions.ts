"use server";

import { redirect } from "next/navigation";

import { createGroupSchema, assignStudentSchema } from "@/modules/advising/presentation/schemas";
import { runAction } from "@/utils/server-action";
import type { ActionState } from "@/utils/app-error";
import { getSessionContext } from "@/server/advising-guards";
import { getContainer } from "@/server/container";

function formValues(formData: FormData): Record<string, FormDataEntryValue> {
  return Object.fromEntries(formData);
}

export async function createGroupAction(
  _previous: ActionState<{ groupId: string }> | null,
  formData: FormData,
): Promise<ActionState<{ groupId: string }>> {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  return runAction(async () => {
    const input = createGroupSchema.parse(formValues(formData));
    const group = await getContainer().advising.createGroup.execute({
      actor: { id: session.user.id, role: session.user.role },
      ...input,
    });
    return { groupId: group.id };
  });
}

export async function assignStudentAction(
  _previous: ActionState<{ studentId: string }> | null,
  formData: FormData,
): Promise<ActionState<{ studentId: string }>> {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  return runAction(async () => {
    const input = assignStudentSchema.parse(formValues(formData));
    await getContainer().advising.assignStudent.execute({
      actor: { id: session.user.id, role: session.user.role },
      ...input,
    });
    return { studentId: input.studentId };
  });
}
