import { beforeEach, describe, expect, it } from "vitest";

import {
  LoginUserUseCase,
  LogoutUserUseCase,
  RegisterUserUseCase,
} from "@/modules/advising/application/auth";
import { ResolveSessionUseCase } from "@/modules/advising/application/session";
import { createAdvisingFakes, type AdvisingFakes } from "../../../../test/fakes/advising";

const PASSWORD = "a".repeat(8);

let fakes: AdvisingFakes;

beforeEach(() => {
  fakes = createAdvisingFakes();
});

function registerUser(
  overrides: Partial<Parameters<RegisterUserUseCase["execute"]>[0]> = {},
) {
  return new RegisterUserUseCase(
    fakes.users,
    fakes.sessions,
    fakes.crypto,
  ).execute({
    username: "student1",
    password: PASSWORD,
    role: "student",
    fullName: "دانش‌آموز یک",
    ...overrides,
  });
}

function login(username: string, password: string) {
  return new LoginUserUseCase(
    fakes.users,
    fakes.sessions,
    fakes.crypto,
  ).execute({ username, password });
}

describe("register", () => {
  it("register hashes password and never stores plaintext", async () => {
    await registerUser();

    const row = fakes.users.rowByUsername("student1");
    expect(row).not.toBeNull();
    expect(row?.passwordHash.startsWith("scrypt$")).toBe(true);
    expect(row?.passwordHash).not.toBe(PASSWORD);
    expect(row?.passwordHash.includes(PASSWORD)).toBe(false);
    expect(await fakes.crypto.verifyPassword(PASSWORD, row!.passwordHash)).toBe(true);
  });

  it("register normalizes username and email", async () => {
    await registerUser({ username: "  Student1 ", email: " Ali@Example.COM " });

    const row = fakes.users.rowByUsername("student1");
    expect(row).not.toBeNull();
    expect(row?.email).toBe("ali@example.com");
  });

  it("duplicate username is rejected with username_taken and writes one row", async () => {
    await registerUser();
    await expect(
      registerUser({ username: "student1", email: "other@example.com" }),
    ).rejects.toMatchObject({ code: "username_taken" });

    expect(fakes.users.count()).toBe(1);
  });

  it("duplicate email is rejected with email_taken and writes one row", async () => {
    await registerUser({ email: "shared@example.com" });
    await expect(
      registerUser({ username: "student2", email: "shared@example.com" }),
    ).rejects.toMatchObject({ code: "email_taken" });

    expect(fakes.users.count()).toBe(1);
  });

  it("session stores token hash, not the raw token", async () => {
    const { token } = await registerUser();
    const session = fakes.sessions.all()[0];

    expect(session).toBeDefined();
    expect(session.tokenHash).toBe(fakes.crypto.hashToken(token));
    expect(session.tokenHash).not.toBe(token);
  });
});

describe("login", () => {
  it("login creates one session after registration", async () => {
    await registerUser();
    expect(fakes.sessions.count()).toBe(1);

    const { token } = await login("student1", PASSWORD);

    expect(fakes.sessions.count()).toBe(2);
    const resolved = await new ResolveSessionUseCase(
      fakes.sessions,
      fakes.users,
      fakes.crypto,
    ).execute({ token });
    expect(resolved?.user.username).toBe("student1");
  });

  it("wrong password and unknown user return the same unauthorized with zero sessions", async () => {
    await fakes.users.create({
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

    const wrongPassword = await login("student1", "wrongpass1").catch(
      (error: unknown) => error,
    );
    const unknownUser = await login("nobody", PASSWORD).catch(
      (error: unknown) => error,
    );

    expect(wrongPassword).toMatchObject({ code: "unauthorized" });
    expect(unknownUser).toMatchObject({ code: "unauthorized" });
    expect((wrongPassword as Error).message).toBe((unknownUser as Error).message);
    expect(fakes.sessions.count()).toBe(0);
  });
});

describe("logout", () => {
  it("logout deletes the session so replay resolves null", async () => {
    const { user, token } = await registerUser();
    const resolveSession = new ResolveSessionUseCase(
      fakes.sessions,
      fakes.users,
      fakes.crypto,
    );

    expect((await resolveSession.execute({ token }))?.user.id).toBe(user.id);

    await new LogoutUserUseCase(fakes.sessions, fakes.crypto).execute({ token });

    expect(fakes.sessions.count()).toBe(0);
    expect(await resolveSession.execute({ token })).toBeNull();
  });
});
