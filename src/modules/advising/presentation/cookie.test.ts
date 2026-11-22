import { describe, expect, it } from "vitest";

import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
  sessionCookieOptions,
} from "./cookie";

describe("session cookie", () => {
  it("uses the mrdan_session name and a seven day ttl", () => {
    expect(SESSION_COOKIE_NAME).toBe("mrdan_session");
    expect(SESSION_TTL_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("is httpOnly, sameSite=lax, path=/ and not secure outside production", () => {
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    const options = sessionCookieOptions(expiresAt, false);

    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
    expect(options.secure).toBe(false);
    expect(options.expires).toBe(expiresAt);
    expect(options.maxAge).toBe(7 * 24 * 60 * 60);
  });

  it("sets secure only in production", () => {
    const options = sessionCookieOptions(new Date(Date.now() + 1000), true);

    expect(options.secure).toBe(true);
  });
});
