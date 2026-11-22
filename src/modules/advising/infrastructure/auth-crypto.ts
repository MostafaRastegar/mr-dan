/**
 * scrypt-based auth crypto.
 *
 * Passwords: scrypt N=16384, r=8, p=1, 64-byte key, 16-byte salt, stored as
 * `scrypt$N$r$p$<saltB64url>$<hashB64url>` so parameters can evolve.
 * Session tokens: 32 random bytes (base64url, 43 chars); the DB stores sha256.
 */

import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import type { ScryptOptions } from "node:crypto";

import type { AuthCryptoPort } from "@/modules/advising/domain/ports";

const KEY_LENGTH = 64;
const SALT_BYTES = 16;
const TOKEN_BYTES = 32;

const DEFAULT_PARAMS = { N: 16384, r: 8, p: 1 } as const;

function scryptAsync(
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keylen, options, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export class ScryptAuthCrypto implements AuthCryptoPort {
  async hashPassword(plain: string): Promise<string> {
    const salt = randomBytes(SALT_BYTES);
    const key = await scryptAsync(plain, salt, KEY_LENGTH, DEFAULT_PARAMS);
    return [
      "scrypt",
      DEFAULT_PARAMS.N,
      DEFAULT_PARAMS.r,
      DEFAULT_PARAMS.p,
      salt.toString("base64url"),
      key.toString("base64url"),
    ].join("$");
  }

  async verifyPassword(plain: string, stored: string): Promise<boolean> {
    try {
      const parts = stored.split("$");
      if (parts.length !== 6 || parts[0] !== "scrypt") return false;

      const [, n, r, p, saltPart, hashPart] = parts;
      const expected = Buffer.from(hashPart, "base64url");
      if (expected.length === 0) return false;

      const actual = await scryptAsync(
        plain,
        Buffer.from(saltPart, "base64url"),
        expected.length,
        { N: Number(n), r: Number(r), p: Number(p) },
      );
      return actual.length === expected.length && timingSafeEqual(actual, expected);
    } catch {
      return false;
    }
  }

  generateToken(): string {
    return randomBytes(TOKEN_BYTES).toString("base64url");
  }

  hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
