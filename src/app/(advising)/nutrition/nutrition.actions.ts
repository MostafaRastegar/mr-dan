"use server";

import { redirect } from "next/navigation";

import { physicalProfileSchema } from "@/modules/advising/presentation/nutrition-schemas";
import { runAction } from "@/utils/server-action";
import { formValues } from "@/utils/form-data";
import type { ActionState } from "@/utils/app-error";
import { getSessionContext } from "@/server/advising-guards";
import { getContainer } from "@/server/container";

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

export async function saveMealPlanAction(
  _previous: ActionState<{ dayKey: string }> | null,
  _formData: FormData,
): Promise<ActionState<{ dayKey: string }>> {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  return runAction(async () => {
    const plan = await getContainer().advising.saveMealPlan.execute({
      actor: { id: session.user.id, role: session.user.role },
    });
    return { dayKey: plan.dayKey };
  });
}
