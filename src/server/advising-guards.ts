/**
 * Session guards for the advising route group.
 *
 * `src/proxy.ts` (Next 16 renamed middleware to proxy) may only check cookie
 * presence — DB access is forbidden there — so the authoritative guard is a
 * real session lookup in the `(advising)` layout. Pages call these helpers
 * too: the layout guard is UX, every mutation re-checks the session
 * server-side.
 */

import { redirect } from "next/navigation";

import {
  UnauthorizedError,
  ForbiddenError,
} from "@/modules/advising/domain/errors";
import {
  hasCapability,
  type Capability,
} from "@/modules/advising/domain/capabilities";
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

/** Capability gate for a route segment. Unauthorized users never see the page. */
export async function requireCapability(
  capability: Capability,
): Promise<SessionContext> {
  const session = await requireSessionUser();
  if (!hasCapability(session.user.role, capability)) redirect("/profile");
  return session;
}

/** API guard: throw 401 Unauthorized when there is no live session. */
export async function requireApiSession(): Promise<SessionContext> {
  const session = await getSessionContext();
  if (!session) throw new UnauthorizedError();
  return session;
}

/** API gate: session then capability, else 403 Forbidden. */
export async function requireApiCapability(
  capability: Capability,
): Promise<SessionContext> {
  const session = await requireApiSession();
  if (!hasCapability(session.user.role, capability)) {
    throw new ForbiddenError();
  }
  return session;
}
