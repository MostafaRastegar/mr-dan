/**
 * Dev-only account bootstrap for every role. Mirrors `scripts/seed-advising.ts`.
 *
 * Idempotent: promotes an existing user (role only — never touches
 * `passwordHash`) or creates a new user with a generated scrypt-hashed password
 * printed exactly once to stdout. Refuses to run when NODE_ENV is "production".
 *
 * Usage: `pnpm tsx scripts/create-user.ts <username> [--role student|counselor|admin|operator]`
 *   or:  `USER_USERNAME=<username> USER_ROLE=operator pnpm tsx scripts/create-user.ts`
 *
 * No `--role` keeps the original admin behaviour.
 */

import { randomBytes } from "node:crypto";

import { prisma } from "@/shared/prisma";
import { ScryptAuthCrypto } from "@/modules/advising/infrastructure/auth-crypto";
import type { Role } from "@/modules/advising/domain/models";

const crypto = new ScryptAuthCrypto();

export const PROVISION_ROLES = [
  "student",
  "counselor",
  "admin",
  "operator",
] as const satisfies readonly Role[];

export interface CreateUserDeps {
  env: {
    NODE_ENV?: string;
    USER_USERNAME?: string;
    ADMIN_USERNAME?: string;
    USER_ROLE?: string;
  };
  findUser: (username: string) => Promise<{ id: string; role: string; passwordHash: string } | null>;
  createUser: (input: { username: string; passwordHash: string; role: Role }) => Promise<void>;
  promote: (username: string, role: Role) => Promise<void>;
}

export function parseRole(value: string | undefined): Role {
  const role = value ?? "admin";
  if (!(PROVISION_ROLES as readonly string[]).includes(role)) {
    throw new Error(`invalid role "${role}"; expected ${PROVISION_ROLES.join("|")}`);
  }
  return role as Role;
}

/** Bootstrap a user. Returns the generated password only when the user was
 *  created (printed once by the direct runner). Promoting an existing user
 *  returns undefined and never rewrites its hash. */
export async function ensureUser(
  username: string,
  role: Role,
  deps: CreateUserDeps,
): Promise<string | undefined> {
  if (deps.env.NODE_ENV === "production") {
    throw new Error("create-user refuses to run when NODE_ENV=production");
  }

  const existing = await deps.findUser(username);
  if (existing) {
    if (existing.role !== role) {
      await deps.promote(username, role);
    }
    return undefined;
  }

  const password = randomBytes(24).toString("base64url");
  const passwordHash = await crypto.hashPassword(password);
  await deps.createUser({ username, passwordHash, role });
  return password;
}

function parseArgs(argv: readonly string[]): {
  username: string | undefined;
  role: string | undefined;
} {
  let username: string | undefined;
  let role: string | undefined;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--role") {
      role = argv[i + 1];
      i += 1;
    } else if (arg.startsWith("--role=")) {
      role = arg.slice("--role=".length);
    } else if (!arg.startsWith("--")) {
      username ??= arg;
    }
  }
  return { username, role };
}

const isDirectRun = process.argv[1]?.endsWith("create-user.ts") ?? false;

if (isDirectRun) {
  const args = parseArgs(process.argv.slice(2));
  const username =
    args.username ?? process.env.USER_USERNAME ?? process.env.ADMIN_USERNAME;
  const roleInput = args.role ?? process.env.USER_ROLE;

  try {
    const role = parseRole(roleInput);
    if (!username) {
      console.error(
        "Usage: pnpm tsx scripts/create-user.ts <username> [--role student|counselor|admin|operator]",
      );
      process.exitCode = 1;
    } else {
      const password = await ensureUser(username, role, {
        env: process.env,
        findUser: async (u) => {
          const row = await prisma.user.findUnique({
            where: { username: u },
            select: { id: true, role: true, passwordHash: true },
          });
          return row ? { id: row.id, role: row.role, passwordHash: row.passwordHash } : null;
        },
        createUser: async ({ username: u, passwordHash, role: newRole }) => {
          await prisma.user.create({
            data: { username: u, email: null, passwordHash, role: newRole, fullName: u, grade: null, fieldOfStudy: null, schoolName: null },
          });
        },
        promote: async (u, newRole) => {
          await prisma.user.updateMany({
            where: { username: u },
            data: { role: newRole },
          });
        },
      });
      if (password) {
        console.log(password);
      }
    }
  } catch (error: unknown) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}
