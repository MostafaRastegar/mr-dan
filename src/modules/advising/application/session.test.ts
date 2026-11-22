import { beforeEach, describe, expect, it } from "vitest";

import { ResolveSessionUseCase } from "@/modules/advising/application/session";
import { createAdvisingFakes, type AdvisingFakes } from "../../../../test/fakes/advising";

const PASSWORD = "a".repeat(8);

let fakes: AdvisingFakes;
let resolveSession: ResolveSessionUseCase;

beforeEach(() => {
  fakes = createAdvisingFakes();
  resolveSession = new ResolveSessionUseCase(
    fakes.sessions,
    fakes.users,
    fakes.crypto,
  );
});

async function createUser() {
  return fakes.users.create({
    username: "student1",
    email: null,
    role: "student",
    fullName: "دانش‌آموز یک",
    grade: null,
    fieldOfStudy: null,
    schoolName: null,
    groupId: null,
    counselorId: null,
    passwordHash: await fakes.crypto.hashPassword(PASSWORD),
  });
}

describe("resolve session", () => {
  it("valid token resolves the user", async () => {
    const user = await createUser();
    const token = "token-valid";
    await fakes.sessions.create({
      userId: user.id,
      tokenHash: fakes.crypto.hashToken(token),
      expiresAt: new Date(Date.now() + 60_000),
    });

    expect((await resolveSession.execute({ token }))?.user.id).toBe(user.id);
  });

  it("unknown token resolves null and attaches no user", async () => {
    await createUser();

    expect(await resolveSession.execute({ token: "not-a-real-token" })).toBeNull();
  });

  it("expired token resolves null and deletes the row", async () => {
    const user = await createUser();
    const token = "token-expired";
    await fakes.sessions.create({
      userId: user.id,
      tokenHash: fakes.crypto.hashToken(token),
      expiresAt: new Date(Date.now() - 1000),
    });

    expect(await resolveSession.execute({ token })).toBeNull();
    expect(fakes.sessions.count()).toBe(0);
  });
});
