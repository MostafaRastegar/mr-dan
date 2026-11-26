/**
 * Shared guard for every `/admin/catalog/**` Server Action.
 *
 * The page gate is UX; this is the boundary. Session first, then
 * `catalog:manage`, then zod parse and the use case, all inside `runAction`.
 */

import { hasCapability } from "@/modules/advising/domain/capabilities";
import { ForbiddenError } from "@/modules/advising/domain/errors";
import { requireSessionUser } from "@/server/advising-guards";
import type { ActionState } from "@/utils/app-error";
import { runAction } from "@/utils/server-action";

export type CatalogActionResult = ActionState<{ id: string }>;

export async function runCatalogAction<TInput>(
  formData: FormData,
  parse: (formData: FormData) => TInput,
  execute: (input: TInput) => Promise<{ id: string }>,
): Promise<CatalogActionResult> {
  const { user } = await requireSessionUser();

  return runAction(async () => {
    if (!hasCapability(user.role, "catalog:manage")) throw new ForbiddenError();
    return execute(parse(formData));
  });
}
