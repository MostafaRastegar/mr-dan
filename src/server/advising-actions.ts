"use server";

/**
 * The six advising Server Actions: the only mutation surface of phase 5.1.
 *
 * Rules (see `docs/plan/frontend-conventions.md`):
 * - success is `ok === true`; failures carry `{ code, message, fieldErrors }`;
 * - cookies are written here and nowhere else;
 * - `redirect()` runs outside `runAction` so `NEXT_REDIRECT` is not swallowed;
 * - `revalidatePath` is never called.
 */

import { redirect } from "next/navigation";

import { sessionExpiry } from "@/modules/advising/application/session";
import {
  assignStudentSchema,
  createGroupSchema,
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from "@/modules/advising/presentation/schemas";
import {
  clearSessionCookie,
  readSessionToken,
  writeSessionCookie,
} from "@/modules/advising/presentation/session-cookie";
import { runAction } from "@/modules/advising/presentation/run-action";
import type { ActionResult } from "@/shared/action-result";
import { getSessionContext } from "./advising-guards";
import { getContainer } from "./container";

function formValues(formData: FormData): Record<string, FormDataEntryValue> {
  return Object.fromEntries(formData);
}

export async function registerAction(
  _previous: ActionResult<{ userId: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ userId: string }>> {
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
  _previous: ActionResult<{ userId: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ userId: string }>> {
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

export async function logoutAction(_formData: FormData): Promise<void> {
  const token = await readSessionToken();
  if (token) {
    await getContainer().advising.logoutUser.execute({ token });
  }
  await clearSessionCookie();
  redirect("/login");
}

export async function updateProfileAction(
  _previous: ActionResult<{ userId: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ userId: string }>> {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  return runAction(async () => {
    const input = updateProfileSchema.parse(formValues(formData));
    await getContainer().advising.updateProfile.execute({
      userId: session.user.id,
      token: session.token,
      ...input,
    });
    return { userId: session.user.id };
  });
}

export async function createGroupAction(
  _previous: ActionResult<{ groupId: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ groupId: string }>> {
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
  _previous: ActionResult<{ studentId: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ studentId: string }>> {
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
