"use server";

import { redirect } from "next/navigation";

import { sessionExpiry } from "@/modules/advising/application/session";
import { loginSchema, makeRegisterSchemas } from "@/modules/advising/presentation/schemas";
import { writeSessionCookie } from "@/modules/advising/presentation/session-cookie";
import { runAction } from "@/utils/server-action";
import { formValues } from "@/utils/form-data";
import type { ActionState } from "@/utils/app-error";
import { getContainer } from "@/server/container";

export async function registerAction(
  _previous: ActionState<{ userId: string }> | null,
  formData: FormData,
): Promise<ActionState<{ userId: string }>> {
  const result = await runAction(async () => {
    const { fields, grades } =
      await getContainer().advising.catalogOptions.execute();
    const { registerSchema } = makeRegisterSchemas({
      fields: fields.map((row) => row.label),
      grades: grades.map((row) => row.label),
    });
    const input = registerSchema.parse(formValues(formData));
    const { user, token } =
      await getContainer().advising.registerUser.execute(input);
    await writeSessionCookie(token, sessionExpiry());
    return { userId: user.id };
  });

  if (!result.ok) return result;
  redirect("/profile");
}

export async function loginAction(
  _previous: ActionState<{ userId: string }> | null,
  formData: FormData,
): Promise<ActionState<{ userId: string }>> {
  const result = await runAction(async () => {
    const input = loginSchema.parse(formValues(formData));
    const { user, token } =
      await getContainer().advising.loginUser.execute(input);
    await writeSessionCookie(token, sessionExpiry());
    return { userId: user.id };
  });

  if (!result.ok) return result;
  redirect("/profile");
}
