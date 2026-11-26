import { beforeEach, describe, expect, it } from "vitest";

import {
  ChangeUserRoleUseCase,
  ListUsersUseCase,
  SupportUserUseCase,
} from "@/modules/advising/application/admin-users";
import type { AdminUserRow, Role } from "@/modules/advising/domain/models";
import { FakeAdminUsersRepository } from "../../../../test/fakes/admin-users";
import { FakeAuthCrypto } from "../../../../test/fakes/advising";

let users: FakeAdminUsersRepository;

beforeEach(() => {
  users = new FakeAdminUsersRepository();
});

function row(
  id: string,
  role: Role,
  index = 0,
  counselorId: string | null = null,
  fullName = id,
): AdminUserRow {
  return {
    id,
    username: id,
    fullName,
    email: null,
    role,
    counselorId,
    counselorUsername: counselorId,
    createdAt: new Date(Date.UTC(2026, 0, 1 + index)).toISOString(),
  };
}

function seed(...rows: AdminUserRow[]): void {
  users.seed(rows);
}

function change(
  actor: { id: string; role: Role },
  userId: string,
  role: Role,
): Promise<void> {
  return new ChangeUserRoleUseCase(users).execute({ actor, userId, role });
}

describe("admin users", () => {
  it("an admin can change another user's role", async () => {
    seed(row("admin-1", "admin"), row("student-1", "student"));

    await change({ id: "admin-1", role: "admin" }, "student-1", "counselor");

    expect(users.roleById("student-1")).toBe("counselor");
  });

  it("a non-admin cannot change a role", async () => {
    seed(row("counselor-1", "counselor"), row("student-1", "student"));

    await expect(
      change({ id: "counselor-1", role: "counselor" }, "student-1", "admin"),
    ).rejects.toMatchObject({ code: "forbidden" });
    expect(users.roleById("student-1")).toBe("student");
  });

  it("an operator cannot change roles", async () => {
    seed(row("operator-1", "operator"), row("student-1", "student"));

    await expect(
      change({ id: "operator-1", role: "operator" }, "student-1", "admin"),
    ).rejects.toMatchObject({ code: "forbidden" });
    expect(users.roleById("student-1")).toBe("student");
  });

  it("changing your own role is rejected", async () => {
    seed(row("admin-1", "admin"));

    await expect(
      change({ id: "admin-1", role: "admin" }, "admin-1", "student"),
    ).rejects.toMatchObject({ code: "role_change_forbidden" });
    expect(users.roleById("admin-1")).toBe("admin");
  });

  it("demoting the last admin is rejected", async () => {
    seed(row("admin-1", "admin"));

    await expect(
      change({ id: "admin-2", role: "admin" }, "admin-1", "student"),
    ).rejects.toMatchObject({ code: "last_admin" });
    expect(users.roleById("admin-1")).toBe("admin");
  });

  it("a missing target returns not_found", async () => {
    seed(row("admin-1", "admin"));

    await expect(
      change({ id: "admin-1", role: "admin" }, "user-404", "student"),
    ).rejects.toMatchObject({ code: "not_found" });
  });

  it("pagination returns one slice and the real total", async () => {
    seed(
      ...Array.from({ length: 25 }, (_, index) =>
        row(`user-${index + 1}`, "student", index),
      ),
    );

    const page = await new ListUsersUseCase(users).execute({
      page: 2,
      pageSize: 10,
    });

    expect(page.page).toBe(2);
    expect(page.pageSize).toBe(10);
    expect(page.total).toBe(25);
    expect(page.items).toHaveLength(10);
    expect(users.lastQuery).toEqual({ page: 2, pageSize: 10 });
  });

  it("pagination clamps the page and max page size", async () => {
    seed(row("student-1", "student"));

    const page = await new ListUsersUseCase(users).execute({
      page: 0,
      pageSize: 1000,
    });

    expect(page.page).toBe(1);
    expect(page.pageSize).toBe(100);
    expect(users.lastQuery).toEqual({ page: 1, pageSize: 100 });
  });

  it("counselor filter returns only that counselor's students and the filtered total", async () => {
    seed(
      ...Array.from({ length: 3 }, (_, index) =>
        row(`a-${index + 1}`, "student", index, "counselor-1"),
      ),
      ...Array.from({ length: 2 }, (_, index) =>
        row(`b-${index + 1}`, "student", index + 3, "counselor-2"),
      ),
    );

    const page = await new ListUsersUseCase(users).execute({
      counselorId: "counselor-1",
    });

    expect(page.items.map((item) => item.id)).toEqual(["a-3", "a-2", "a-1"]);
    expect(page.total).toBe(3);
    expect(page.items.every((item) => item.counselorId === "counselor-1")).toBe(
      true,
    );
  });

  it("counselor filter composes with the page=2 slice", async () => {
    seed(
      ...Array.from({ length: 15 }, (_, index) =>
        row(`a-${index + 1}`, "student", index, "counselor-1"),
      ),
      ...Array.from({ length: 5 }, (_, index) =>
        row(`b-${index + 1}`, "student", index + 15, "counselor-2"),
      ),
    );

    const page = await new ListUsersUseCase(users).execute({
      page: 2,
      pageSize: 10,
      counselorId: "counselor-1",
    });

    expect(page.page).toBe(2);
    expect(page.total).toBe(15);
    expect(page.items).toHaveLength(5);
    expect(page.items.every((item) => item.counselorId === "counselor-1")).toBe(
      true,
    );
  });

  it("a student without a counselor reports a null counselor username", async () => {
    seed(row("student-1", "student"));

    const page = await new ListUsersUseCase(users).execute({});

    expect(page.items[0]?.counselorId).toBeNull();
    expect(page.items[0]?.counselorUsername).toBeNull();
  });
});

describe("admin user filters", () => {
  const list = (input: Parameters<ListUsersUseCase["execute"]>[0]) =>
    new ListUsersUseCase(users).execute(input);

  it("filters by role alone", async () => {
    seed(
      row("student-1", "student", 0),
      row("student-2", "student", 1),
      row("counselor-1", "counselor", 2),
    );

    const page = await list({ role: "counselor" });

    expect(page.items.map((item) => item.id)).toEqual(["counselor-1"]);
    expect(page.total).toBe(1);
    expect(users.lastQuery).toEqual({ page: 1, pageSize: 20, role: "counselor" });
  });

  it("filters by counselor alone", async () => {
    seed(
      row("a-1", "student", 0, "counselor-1"),
      row("a-2", "student", 1, "counselor-1"),
      row("b-1", "student", 2, "counselor-2"),
    );

    const page = await list({ counselorId: "counselor-1" });

    expect(page.total).toBe(2);
    expect(page.items.every((item) => item.counselorId === "counselor-1")).toBe(
      true,
    );
  });

  it("q filter matches username", async () => {
    seed(row("zahra", "student", 0), row("ali", "student", 1));

    const page = await list({ q: "  ZAHRA " });

    expect(page.items.map((item) => item.id)).toEqual(["zahra"]);
    expect(users.lastQuery).toEqual({ page: 1, pageSize: 20, q: "ZAHRA" });
  });

  it("q filter matches fullName case-insensitively", async () => {
    seed(
      row("user-1", "student", 0, null, "Zahra Ahmadi"),
      row("user-2", "student", 1, null, "Ali Rezaei"),
    );

    const page = await list({ q: "ahmadi" });

    expect(page.items.map((item) => item.id)).toEqual(["user-1"]);
    expect(page.total).toBe(1);
  });

  it("combines role and counselor filters", async () => {
    seed(
      row("s-1", "student", 0, "counselor-1"),
      row("c-1", "counselor", 1, "counselor-1"),
      row("s-2", "student", 2, "counselor-2"),
    );

    const page = await list({ role: "student", counselorId: "counselor-1" });

    expect(page.items.map((item) => item.id)).toEqual(["s-1"]);
    expect(page.total).toBe(1);
    expect(users.lastQuery).toEqual({
      page: 1,
      pageSize: 20,
      counselorId: "counselor-1",
      role: "student",
    });
  });

  it("keeps combined filters on the page 2 slice", async () => {
    seed(
      ...Array.from({ length: 15 }, (_, index) =>
        row(`a-${index + 1}`, "student", index, "counselor-1"),
      ),
      ...Array.from({ length: 5 }, (_, index) =>
        row(`b-${index + 1}`, "counselor", index + 15, "counselor-1"),
      ),
    );

    const page = await list({
      page: 2,
      pageSize: 10,
      role: "student",
      counselorId: "counselor-1",
    });

    expect(page.page).toBe(2);
    expect(page.total).toBe(15);
    expect(page.items).toHaveLength(5);
    expect(
      page.items.every(
        (item) => item.role === "student" && item.counselorId === "counselor-1",
      ),
    ).toBe(true);
  });

  it("ignores an unknown role filter", async () => {
    seed(row("student-1", "student"));

    const page = await list({ role: "hacker" });

    expect(page.total).toBe(1);
    expect(users.lastQuery).toEqual({ page: 1, pageSize: 20 });
  });
});

describe("support user surface", () => {
  it("an operator can edit contact fields without changing the role", async () => {
    seed(row("operator-1", "operator"), row("student-1", "student"));
    const support = new SupportUserUseCase(users, new FakeAuthCrypto());

    await support.updateContact({
      actor: { id: "operator-1", role: "operator" },
      userId: "student-1",
      fullName: "  نام تازه  ",
      email: "new@example.com",
    });

    const updated = users.rowById("student-1");
    expect(updated?.fullName).toBe("نام تازه");
    expect(updated?.email).toBe("new@example.com");
    expect(updated?.role).toBe("student");
  });

  it("a student or counselor cannot use support actions", async () => {
    seed(row("student-1", "student"), row("student-2", "student"));
    const support = new SupportUserUseCase(users, new FakeAuthCrypto());

    for (const role of ["student", "counselor"] as const) {
      await expect(
        support.updateContact({
          actor: { id: "actor", role },
          userId: "student-1",
          fullName: "x",
          email: null,
        }),
      ).rejects.toMatchObject({ code: "forbidden" });
      await expect(
        support.resetCredentials({ actor: { id: "actor", role }, userId: "student-2" }),
      ).rejects.toMatchObject({ code: "forbidden" });
    }
  });

  it("reset returns the plaintext once and stores only a different hash", async () => {
    seed(row("operator-1", "operator"), row("student-1", "student"));
    const crypto = new FakeAuthCrypto();
    const support = new SupportUserUseCase(users, crypto);

    const { temporaryPassword } = await support.resetCredentials({
      actor: { id: "operator-1", role: "operator" },
      userId: "student-1",
    });

    const stored = users.passwordHashOf("student-1");
    expect(temporaryPassword).toBeTruthy();
    expect(stored).toBeTruthy();
    expect(stored).not.toBe(temporaryPassword);
    await expect(
      crypto.verifyPassword(temporaryPassword, stored ?? ""),
    ).resolves.toBe(true);
  });
});
