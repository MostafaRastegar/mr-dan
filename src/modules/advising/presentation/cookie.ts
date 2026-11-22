/**
 * Session cookie contract (pure, no `next` import so it is unit-testable).
 *
 * The 7-day TTL lives in the application layer; it is re-exported here so the
 * DB row and the cookie share one constant.
 */

import { SESSION_TTL_MS } from "../application/session";

export { SESSION_TTL_MS };

export const SESSION_COOKIE_NAME = "mrdan_session";

export interface SessionCookieOptions {
  httpOnly: true;
  sameSite: "lax";
  path: "/";
  secure: boolean;
  expires: Date;
  maxAge: number;
}

export function sessionCookieOptions(
  expiresAt: Date,
  isProduction: boolean,
): SessionCookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isProduction,
    expires: expiresAt,
    maxAge: Math.round((expiresAt.getTime() - Date.now()) / 1000),
  };
}
