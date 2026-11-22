/**
 * Cookie transport via `next/headers`.
 *
 * The raw token only exists in the httpOnly cookie; the DB stores its sha256.
 */

import { cookies } from "next/headers";

import {
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "./cookie";

export async function readSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function writeSessionCookie(
  token: string,
  expiresAt: Date,
): Promise<void> {
  const store = await cookies();
  store.set(
    SESSION_COOKIE_NAME,
    token,
    sessionCookieOptions(expiresAt, process.env.NODE_ENV === "production"),
  );
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}
