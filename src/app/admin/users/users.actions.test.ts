import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireSessionUser } = vi.hoisted(() => ({
  requireSessionUser: vi.fn(),
}));

vi.mock("@/server/advising-guards", () => ({ requireSessionUser }));

import { changeUserRoleAction } from "./users.actions";

function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
}

beforeEach(() => {
  requireSessionUser.mockReset();
});

describe("users actions", () => {
  it("returns forbidden for an operator changing a role", async () => {
    requireSessionUser.mockResolvedValue({
      user: { id: "operator-1", role: "operator" },
      token: "token",
    });

    const state = await changeUserRoleAction(
      null,
      form({ userId: "student-1", role: "admin" }),
    );

    expect(state).toMatchObject({ ok: false, error: { code: "forbidden" } });
  });
});
