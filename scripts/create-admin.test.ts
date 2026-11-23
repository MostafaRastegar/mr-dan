import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

import { ensureAdmin } from "./create-admin";

const baseUsername = `ca-${Date.now()}`;

function makeDeps() {
  const users = new Map<string, { role: string; passwordHash: string }>();
  let promoteCalls = 0;
  let createCalls = 0;

  const deps = {
    env: { NODE_ENV: "test" },
    findUser: vi.fn(async (username: string) => {
      const row = users.get(username);
      return row ? { id: "u-1", role: row.role, passwordHash: row.passwordHash } : null;
    }),
    createUser: vi.fn(async (input: { username: string; passwordHash: string; role: string }) => {
      createCalls += 1;
      users.set(input.username, { role: input.role, passwordHash: input.passwordHash });
    }),
    promote: vi.fn(async (username: string) => {
      promoteCalls += 1;
      const row = users.get(username);
      if (row) row.role = "admin";
    }),
  };

  return { deps, users, createCalls: () => createCalls, promoteCalls: () => promoteCalls };
}

describe("ensureAdmin", () => {
  it("refuses production", async () => {
    const { deps } = makeDeps();
    deps.env.NODE_ENV = "production";

    await expect(ensureAdmin("x", deps)).rejects.toThrow(
      "create-admin refuses to run when NODE_ENV=production",
    );
    expect(deps.findUser).not.toHaveBeenCalled();
  });

  it("creates a new admin and returns a generated password once", async () => {
    const { deps, createCalls, users } = makeDeps();

    const password = await ensureAdmin(baseUsername, deps);

    expect(password).toBeDefined();
    expect(typeof password).toBe("string");
    expect(password!.length).toBeGreaterThan(0);
    expect(deps.createUser).toHaveBeenCalledTimes(1);
    expect(createCalls()).toBe(1);
    const created = users.get(baseUsername);
    expect(created?.role).toBe("admin");
  });

  it("is idempotent: second run promotes only role and never rewrites hash", async () => {
    const { deps, createCalls, promoteCalls, users } = makeDeps();

    await ensureAdmin(baseUsername, deps);
    const firstHash = users.get(baseUsername)!.passwordHash;
    const firstCreates = createCalls();

    const second = await ensureAdmin(baseUsername, deps);

    expect(second).toBeUndefined();
    expect(createCalls()).toBe(firstCreates);
    expect(promoteCalls()).toBe(0);
    expect(users.get(baseUsername)!.passwordHash).toBe(firstHash);
  });

  it("promotes an existing non-admin user to admin", async () => {
    const { deps, users } = makeDeps();
    const stored = "stored-hash";
    users.set("promote-me", { role: "student", passwordHash: stored });

    const password = await ensureAdmin("promote-me", deps);

    expect(password).toBeUndefined();
    expect(users.get("promote-me")!.role).toBe("admin");
    expect(users.get("promote-me")!.passwordHash).toBe(stored);
  });
});

describe("create-admin source has no credential literal", () => {
  it("contains no inline password assignment", () => {
    const source = readFileSync(
      new URL(import.meta.url, "file://").pathname.replace(/\.test\.ts$/, ".ts"),
      "utf8",
    );
    expect(/password\s*[:=]\s*["'][^"']+["']/.test(source)).toBe(false);
  });
});
