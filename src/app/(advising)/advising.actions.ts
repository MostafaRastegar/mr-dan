"use server";

import { redirect } from "next/navigation";

import { makeRegisterSchemas } from "@/modules/advising/presentation/schemas";
import {
  clearSessionCookie,
  readSessionToken,
} from "@/modules/advising/presentation/session-cookie";
import { runAction } from "@/utils/server-action";
import { formValues } from "@/utils/form-data";
import type { ActionState } from "@/utils/app-error";
import { requireSessionUser } from "@/server/advising-guards";
import { getContainer } from "@/server/container";

export async function logoutAction(_formData: FormData): Promise<void> {
  const token = await readSessionToken();
  if (token) {
    await getContainer().advising.logoutUser.execute({ token });
  }
  await clearSessionCookie();
  redirect("/login");
}

export async function updateProfileAction(
  _previous: ActionState<{ userId: string }> | null,
  formData: FormData,
): Promise<ActionState<{ userId: string }>> {
  const { user, token } = await requireSessionUser();

  return runAction(async () => {
    const { fields, grades } =
      await getContainer().advising.catalogOptions.execute();
    const { updateProfileSchema } = makeRegisterSchemas({
      fields: fields.map((row) => row.label),
      grades: grades.map((row) => row.label),
    });
    const input = updateProfileSchema.parse(formValues(formData));
    await getContainer().advising.updateProfile.execute({
      userId: user.id,
      token,
      ...input,
    });
    return { userId: user.id };
  });
}
