import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

import { ensureUser, parseRole } from "./create-user";

const baseUsername = `cu-${Date.now()}`;

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
    createUser: vi.fn(
      async (input: { username: string; passwordHash: string; role: string }) => {
        createCalls += 1;
        users.set(input.username, { role: input.role, passwordHash: input.passwordHash });
      },
    ),
    promote: vi.fn(async (username: string, role: string) => {
      promoteCalls += 1;
      const row = users.get(username);
      if (row) row.role = role;
    }),
  };

  return { deps, users, createCalls: () => createCalls, promoteCalls: () => promoteCalls };
}

describe("ensureUser", () => {
  it("refuses production", async () => {
    const { deps } = makeDeps();
    deps.env.NODE_ENV = "production";

    await expect(ensureUser("x", "admin", deps)).rejects.toThrow(
      "create-user refuses to run when NODE_ENV=production",
    );
    expect(deps.findUser).not.toHaveBeenCalled();
  });

  it("creates a new admin and returns a generated password once", async () => {
    const { deps, createCalls, users } = makeDeps();

    const password = await ensureUser(baseUsername, "admin", deps);

    expect(password).toBeDefined();
    expect(typeof password).toBe("string");
    expect(password!.length).toBeGreaterThan(0);
    expect(deps.createUser).toHaveBeenCalledTimes(1);
    expect(createCalls()).toBe(1);
    expect(users.get(baseUsername)?.role).toBe("admin");
  });

  it("creates an operator when that role is requested", async () => {
    const { deps, users } = makeDeps();
    const username = `${baseUsername}-op`;

    const password = await ensureUser(username, "operator", deps);

    expect(password).toBeDefined();
    expect(users.get(username)?.role).toBe("operator");
  });

  it("is idempotent: second run promotes only role and never rewrites hash", async () => {
    const { deps, createCalls, promoteCalls, users } = makeDeps();

    await ensureUser(baseUsername, "admin", deps);
    const firstHash = users.get(baseUsername)!.passwordHash;
    const firstCreates = createCalls();

    const second = await ensureUser(baseUsername, "admin", deps);

    expect(second).toBeUndefined();
    expect(createCalls()).toBe(firstCreates);
    expect(promoteCalls()).toBe(0);
    expect(users.get(baseUsername)!.passwordHash).toBe(firstHash);
  });

  it("promotes an existing user to the requested role, keeping the hash", async () => {
    const { deps, users } = makeDeps();
    const stored = "stored-hash";
    users.set("promote-me", { role: "student", passwordHash: stored });

    const password = await ensureUser("promote-me", "operator", deps);

    expect(password).toBeUndefined();
    expect(users.get("promote-me")!.role).toBe("operator");
    expect(users.get("promote-me")!.passwordHash).toBe(stored);
  });
});

describe("parseRole", () => {
  it("defaults to admin when no flag is given", () => {
    expect(parseRole(undefined)).toBe("admin");
  });

  it("accepts the four provisionable roles", () => {
    for (const role of ["student", "counselor", "admin", "operator"]) {
      expect(parseRole(role)).toBe(role);
    }
  });

  it("rejects an unknown role", () => {
    expect(() => parseRole("owner")).toThrow(/owner/);
  });
});

describe("create-user source has no credential literal", () => {
  it("contains no inline password assignment", () => {
    const source = readFileSync(
      new URL(import.meta.url, "file://").pathname.replace(/\.test\.ts$/, ".ts"),
      "utf8",
    );
    expect(/password\s*[:=]\s*["'][^"']+["']/.test(source)).toBe(false);
  });
});
