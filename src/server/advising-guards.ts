/**
 * Session guards for the advising route group.
 *
 * Next 16 renames `middleware.ts` to `proxy.ts` and the guide forbids DB access
 * in it, so the authoritative guard is a real session lookup in the
 * `(advising)` layout. Pages call these helpers too: the layout guard is UX,
 * every mutation re-checks the session server-side.
 */

import { redirect } from "next/navigation";

import type { UserAccount } from "@/modules/advising/domain/models";
import { readSessionToken } from "@/modules/advising/presentation/session-cookie";
import { getContainer } from "./container";

export interface SessionContext {
  user: UserAccount;
  token: string;
}

/** Resolve the cookie session without redirecting (safe for actions). */
export async function getSessionContext(): Promise<SessionContext | null> {
  const token = await readSessionToken();
  if (!token) return null;

  const resolved = await getContainer().advising.resolveSession.execute({
    token,
  });
  return resolved ? { user: resolved.user, token } : null;
}

/** Layout/page guard: no session means /login, never a redirect loop. */
export async function requireSessionUser(): Promise<SessionContext> {
  const session = await getSessionContext();
  if (!session) redirect("/login");
  return session;
}

/** Role gate for counselor-only pages. */
export async function requireCounselor(): Promise<SessionContext> {
  const session = await requireSessionUser();
  if (session.user.role !== "counselor") redirect("/profile");
  return session;
}
