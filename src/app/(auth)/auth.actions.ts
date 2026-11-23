"use server";

import { redirect } from "next/navigation";

import { sessionExpiry } from "@/modules/advising/application/session";
import { loginSchema, registerSchema } from "@/modules/advising/presentation/schemas";
import { writeSessionCookie } from "@/modules/advising/presentation/session-cookie";
import { runAction } from "@/utils/server-action";
import type { ActionState } from "@/utils/app-error";
import { getContainer } from "@/server/container";

function formValues(formData: FormData): Record<string, FormDataEntryValue> {
  return Object.fromEntries(formData);
}

export async function registerAction(
  _previous: ActionState<{ userId: string }> | null,
  formData: FormData,
): Promise<ActionState<{ userId: string }>> {
  const result = await runAction(async () => {
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
