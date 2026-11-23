"use server";

import { redirect } from "next/navigation";

import { physicalProfileSchema } from "@/modules/advising/presentation/nutrition-schemas";
import { runAction } from "@/utils/server-action";
import type { ActionState } from "@/utils/app-error";
import { getSessionContext } from "@/server/advising-guards";
import { getContainer } from "@/server/container";

function formValues(formData: FormData): Record<string, FormDataEntryValue> {
  return Object.fromEntries(formData);
}

export async function updatePhysicalProfileAction(
  _previous: ActionState<{ saved: true }> | null,
  formData: FormData,
): Promise<ActionState<{ saved: true }>> {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  return runAction(async () => {
    const patch = physicalProfileSchema.parse(formValues(formData));
    await getContainer().advising.updatePhysicalProfile.execute({
      actor: { id: session.user.id, role: session.user.role },
      patch,
    });
    return { saved: true };
  });
}

export async function saveMealPlanAction(): Promise<ActionState<{ dayKey: string }>> {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  return runAction(async () => {
    const plan = await getContainer().advising.saveMealPlan.execute({
      actor: { id: session.user.id, role: session.user.role },
    });
    return { dayKey: plan.dayKey };
  });
}
