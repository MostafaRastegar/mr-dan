import { beforeEach, describe, expect, it } from "vitest";

import {
  GetProfileUseCase,
  UpdateProfileUseCase,
} from "@/modules/advising/application/profile";
import { LoginUserUseCase, RegisterUserUseCase } from "@/modules/advising/application/auth";
import { createAdvisingFakes, type AdvisingFakes } from "../../../../test/fakes/advising";

const PASSWORD = "a".repeat(8);
const NEW_PASSWORD = "b".repeat(12);

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

describe("profile", () => {
  it("profile includes group and counselor names", async () => {
    const counselor = await fakes.users.create({
      username: "counselor1",
      email: null,
      role: "counselor",
      fullName: "مشاور یک",
      grade: null,
      fieldOfStudy: null,
      schoolName: null,
      groupId: null,
      counselorId: null,
      passwordHash: await fakes.crypto.hashPassword(PASSWORD),
    });
    const group = await fakes.groups.create({
      counselorId: counselor.id,
      name: "کلاس دوازدهم تجربی",
      description: null,
      targetGrade: "دوازدهم",
      targetField: "علوم تجربی",
    });
    const { user } = await registerUser();
    await fakes.users.assignToGroup({
      studentId: user.id,
      groupId: group.id,
      counselorId: counselor.id,
    });

    const profile = await new GetProfileUseCase(fakes.users).execute({
      userId: user.id,
    });

    expect(profile?.groupName).toBe("کلاس دوازدهم تجربی");
    expect(profile?.counselorName).toBe("مشاور یک");
  });

  it("update persists profile fields", async () => {
    const { user, token } = await registerUser();

    const updated = await new UpdateProfileUseCase(
      fakes.users,
      fakes.sessions,
      fakes.crypto,
    ).execute({
      userId: user.id,
      token,
      fullName: "نام تازه",
      email: "new@example.com",
      grade: "دهم",
      fieldOfStudy: "ریاضی فیزیک",
      schoolName: "دبیرستان نمونه",
    });

    expect(updated.fullName).toBe("نام تازه");
    expect(updated.email).toBe("new@example.com");
    expect(updated.grade).toBe("دهم");
    expect(updated.fieldOfStudy).toBe("ریاضی فیزیک");
    expect(updated.schoolName).toBe("دبیرستان نمونه");
  });

  it("password change without old password fails with invalid_input", async () => {
    const { user, token } = await registerUser();

    await expect(
      new UpdateProfileUseCase(fakes.users, fakes.sessions, fakes.crypto).execute({
        userId: user.id,
        token,
        fullName: "دانش‌آموز یک",
        newPassword: NEW_PASSWORD,
      }),
    ).rejects.toMatchObject({ code: "invalid_input" });
  });

  it("wrong current password fails with unauthorized and keeps the hash", async () => {
    const { user, token } = await registerUser();
    const before = fakes.users.rowByUsername("student1")?.passwordHash;

    await expect(
      new UpdateProfileUseCase(fakes.users, fakes.sessions, fakes.crypto).execute({
        userId: user.id,
        token,
        fullName: "دانش‌آموز یک",
        currentPassword: "wrongpass1",
        newPassword: NEW_PASSWORD,
      }),
    ).rejects.toMatchObject({ code: "unauthorized" });

    expect(fakes.users.rowByUsername("student1")?.passwordHash).toBe(before);
  });

  it("correct password change revokes other sessions but keeps the current", async () => {
    const first = await registerUser();
    const second = await new LoginUserUseCase(
      fakes.users,
      fakes.sessions,
      fakes.crypto,
    ).execute({ username: "student1", password: PASSWORD });

    expect(fakes.sessions.count()).toBe(2);

    await new UpdateProfileUseCase(fakes.users, fakes.sessions, fakes.crypto).execute({
      userId: first.user.id,
      token: second.token,
      fullName: "دانش‌آموز یک",
      currentPassword: PASSWORD,
      newPassword: NEW_PASSWORD,
    });

    const sessions = fakes.sessions.all();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].tokenHash).toBe(fakes.crypto.hashToken(second.token));

    const row = fakes.users.rowByUsername("student1");
    expect(await fakes.crypto.verifyPassword(NEW_PASSWORD, row!.passwordHash)).toBe(true);
  });
});
