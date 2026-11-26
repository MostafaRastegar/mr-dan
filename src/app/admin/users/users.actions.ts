"use server";

/**
 * Real `/admin/users` mutations. Session + capability are checked here; the
 * role use case re-checks `user:manage` and the support use case re-checks
 * `user:support`. The temp password is returned once, never logged.
 */

import {
  adminRoleChangeSchema,
  adminSupportEditSchema,
  adminSupportResetSchema,
} from "@/modules/advising/presentation/admin-schemas";
import { hasCapability } from "@/modules/advising/domain/capabilities";
import { ForbiddenError } from "@/modules/advising/domain/errors";
import { requireSessionUser } from "@/server/advising-guards";
import { getContainer } from "@/server/container";
import type { ActionState } from "@/utils/app-error";
import { formValues } from "@/utils/form-data";
import { runAction } from "@/utils/server-action";

type UserResult = ActionState<{ userId: string }>;
type ResetResult = ActionState<{
  userId: string;
  temporaryPassword: string;
}>;

export async function changeUserRoleAction(
  _previous: UserResult | null,
  formData: FormData,
): Promise<UserResult> {
  const { user } = await requireSessionUser();

  return runAction(async () => {
    if (!hasCapability(user.role, "user:manage")) throw new ForbiddenError();
    const input = adminRoleChangeSchema.parse(formValues(formData));

    await getContainer().advising.admin.changeUserRole.execute({
      actor: { id: user.id, role: user.role },
      userId: input.userId,
      role: input.role,
    });

    return { userId: input.userId };
  });
}

export async function updateUserContactAction(
  _previous: UserResult | null,
  formData: FormData,
): Promise<UserResult> {
  const { user } = await requireSessionUser();

  return runAction(async () => {
    if (!hasCapability(user.role, "user:support")) throw new ForbiddenError();
    const input = adminSupportEditSchema.parse(formValues(formData));

    await getContainer().advising.admin.support.updateContact({
      actor: { id: user.id, role: user.role },
      userId: input.userId,
      fullName: input.fullName,
      email: input.email ?? null,
    });

    return { userId: input.userId };
  });
}

export async function resetUserCredentialsAction(
  _previous: ResetResult | null,
  formData: FormData,
): Promise<ResetResult> {
  const { user } = await requireSessionUser();

  return runAction(async () => {
    if (!hasCapability(user.role, "user:support")) throw new ForbiddenError();
    const input = adminSupportResetSchema.parse(formValues(formData));

    const { temporaryPassword } =
      await getContainer().advising.admin.support.resetCredentials({
        actor: { id: user.id, role: user.role },
        userId: input.userId,
      });

    return { userId: input.userId, temporaryPassword };
  });
}
