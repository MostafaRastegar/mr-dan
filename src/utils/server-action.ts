/**
 * The single server-action wrapper: one try/catch for all six actions.
 *
 * `redirect` is intentionally not handled here; callers must call it outside
 * `runAction` so Next's `NEXT_REDIRECT` is not swallowed.
 */

import { ZodError } from "zod";

import type { ActionState } from "@/utils/app-error";
import { toActionError } from "@/modules/advising/presentation/messages";
import { toFieldErrors } from "@/modules/advising/presentation/schemas";

export async function runAction<T>(
  fn: () => Promise<T>,
): Promise<ActionState<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        ok: false,
        error: {
          code: "invalid_input",
          message: "اطلاعات وارد شده معتبر نیست",
          fieldErrors: toFieldErrors(error.issues),
        },
      };
    }

    return { ok: false, error: toActionError(error) };
  }
}
