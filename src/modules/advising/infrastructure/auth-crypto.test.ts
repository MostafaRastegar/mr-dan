import { describe, expect, it } from "vitest";

import { ScryptAuthCrypto } from "@/modules/advising/infrastructure/auth-crypto";

const PASSWORD = "a".repeat(8);
const OTHER_PASSWORD = "b".repeat(9);

const crypto = new ScryptAuthCrypto();

describe("scrypt auth crypto", () => {
  it("stores password hashes in scrypt$N$r$p$salt$hash format", async () => {
    const hash = await crypto.hashPassword(PASSWORD);

    expect(hash.startsWith("scrypt$16384$8$1$")).toBe(true);
    expect(hash.split("$")).toHaveLength(6);
  });

  it("verifies the correct password and rejects a wrong one", async () => {
    const hash = await crypto.hashPassword(PASSWORD);

    expect(await crypto.verifyPassword(PASSWORD, hash)).toBe(true);
    expect(await crypto.verifyPassword(OTHER_PASSWORD, hash)).toBe(false);
  });

  it("produces different hashes for the same password because of the salt", async () => {
    const first = await crypto.hashPassword(PASSWORD);
    const second = await crypto.hashPassword(PASSWORD);

    expect(first).not.toBe(second);
  });

  it("returns false for tampered or garbage hashes instead of throwing", async () => {
    expect(await crypto.verifyPassword("x", "not-a-hash")).toBe(false);
    expect(await crypto.verifyPassword("x", "scrypt$16384$8$1$bad$bad")).toBe(false);
  });

  it("generates a 43-character base64url token", () => {
    const token = crypto.generateToken();

    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("hashes tokens to stable 64-character hex", () => {
    const token = crypto.generateToken();
    const first = crypto.hashToken(token);
    const second = crypto.hashToken(token);

    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(first).toBe(second);
    expect(first).not.toBe(token);
  });
});
