/**
 * Dev-only admin bootstrap. Mirrors `scripts/seed-advising.ts`.
 *
 * Idempotent: promotes an existing user (role only — never touches
 * `passwordHash`) or creates a new admin with a generated scrypt-hashed
 * password printed exactly once to stdout. Refuses to run when NODE_ENV is
 * "production".
 *
 * Usage: `pnpm tsx scripts/create-admin.ts <username>`
 *   or:  `ADMIN_USERNAME=<username> pnpm tsx scripts/create-admin.ts
 */

import { randomBytes } from "node:crypto";

import { prisma } from "@/shared/prisma";
import { ScryptAuthCrypto } from "@/modules/advising/infrastructure/auth-crypto";

const crypto = new ScryptAuthCrypto();

export interface CreateAdminDeps {
  env: { NODE_ENV?: string; ADMIN_USERNAME?: string };
  findUser: (username: string) => Promise<{ id: string; role: string; passwordHash: string } | null>;
  createUser: (input: { username: string; passwordHash: string; role: string }) => Promise<void>;
  promote: (username: string) => Promise<void>;
}

/** Bootstrap an admin user. Returns the generated password only when the user
 *  was created (printed once by the direct runner). Promoting an existing user
 *  returns undefined and never rewrites its hash. */
export async function ensureAdmin(username: string, deps: CreateAdminDeps): Promise<string | undefined> {
  if (deps.env.NODE_ENV === "production") {
    throw new Error("create-admin refuses to run when NODE_ENV=production");
  }

  const existing = await deps.findUser(username);
  if (existing) {
    if (existing.role !== "admin") {
      await deps.promote(username);
    }
    return undefined;
  }

  const password = randomBytes(24).toString("base64url");
  const passwordHash = await crypto.hashPassword(password);
  await deps.createUser({ username, passwordHash, role: "admin" });
  return password;
}

const isDirectRun = process.argv[1]?.endsWith("create-admin.ts") ?? false;

if (isDirectRun) {
  const username = process.argv[2] ?? process.env.ADMIN_USERNAME;
  if (!username) {
    console.error("Usage: pnpm tsx scripts/create-admin.ts <username>");
    await prisma.$disconnect();
    process.exitCode = 1;
  } else {
    ensureAdmin(username, {
      env: process.env,
      findUser: async (u) => {
        const row = await prisma.user.findUnique({
          where: { username: u },
          select: { id: true, role: true, passwordHash: true },
        });
        return row ? { id: row.id, role: row.role, passwordHash: row.passwordHash } : null;
      },
      createUser: async ({ username: u, passwordHash, role }) => {
        await prisma.user.create({
          data: { username: u, email: null, passwordHash, role, fullName: u, grade: null, fieldOfStudy: null, schoolName: null },
        });
      },
      promote: async (u) => {
        await prisma.user.updateMany({
          where: { username: u },
          data: { role: "admin" },
        });
      },
    })
      .then(async (password) => {
        if (password) {
          console.log(password);
        }
        await prisma.$disconnect();
      })
      .catch(async (error: unknown) => {
        console.error(error);
        await prisma.$disconnect();
        process.exitCode = 1;
      });
  }
}
