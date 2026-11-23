"use server";

import { redirect } from "next/navigation";

import { studySessionSchemaAt } from "@/modules/advising/presentation/study-schemas";
import { runAction } from "@/utils/server-action";
import type { ActionState } from "@/utils/app-error";
import { getSessionContext } from "@/server/advising-guards";
import { getContainer } from "@/server/container";

function formValues(formData: FormData): Record<string, FormDataEntryValue> {
  return Object.fromEntries(formData);
}

export async function recordStudySessionAction(
  _previous: ActionState<{ id: string }> | null,
  formData: FormData,
): Promise<ActionState<{ id: string }>> {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  const now = new Date();

  return runAction(async () => {
    const input = studySessionSchemaAt(now).parse(formValues(formData));
    const record = await getContainer().advising.recordStudySession.execute({
      actor: { id: session.user.id, role: session.user.role },
      now,
      ...input,
    });
    return { id: record.id };
  });
}
