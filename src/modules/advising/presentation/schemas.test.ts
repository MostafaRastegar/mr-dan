import { describe, expect, it } from "vitest";

import {
  assignStudentSchema,
  createGroupSchema,
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from "./schemas";

const PASSWORD = "a".repeat(8);
const NEW_PASSWORD = "b".repeat(9);

const validRegister = {
  username: "student1",
  password: PASSWORD,
  role: "student",
  fullName: "دانش‌آموز یک",
};

describe("register schema", () => {
  it("password minimum is 8 characters", () => {
    const seven = registerSchema.safeParse({
      ...validRegister,
      password: "a".repeat(7),
    });
    const eight = registerSchema.safeParse({
      ...validRegister,
      password: "a".repeat(8),
    });

    expect(seven.success).toBe(false);
    expect(eight.success).toBe(true);
  });

  it("rejects an empty username", () => {
    expect(
      registerSchema.safeParse({ ...validRegister, username: "   " }).success,
    ).toBe(false);
  });

  it("rejects an invalid role", () => {
    expect(
      registerSchema.safeParse({ ...validRegister, role: "admin" }).success,
    ).toBe(false);
  });

  it("rejects unknown grade and field values", () => {
    expect(
      registerSchema.safeParse({ ...validRegister, grade: "سیزدهم" }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({ ...validRegister, fieldOfStudy: "هنر" }).success,
    ).toBe(false);
  });

  it("treats an empty email as absent", () => {
    const parsed = registerSchema.parse({ ...validRegister, email: "" });

    expect(parsed.email).toBeUndefined();
  });

  it("rejects overly long input", () => {
    expect(
      registerSchema.safeParse({ ...validRegister, username: "a".repeat(40) })
        .success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({ ...validRegister, password: "a".repeat(129) })
        .success,
    ).toBe(false);
  });

  it("normalizes Persian digits in username and email", () => {
    const parsed = registerSchema.parse({
      ...validRegister,
      username: "دانش۱۲۳",
      email: "USER۱۲۳@EXAMPLE.COM",
    });

    expect(parsed.username).toBe("دانش123");
    expect(parsed.email).toBe("user123@example.com");
  });

  it("leaves Persian digits in the password untouched", () => {
    const password = "رمز۱۲۳۴۵۶۷۸";
    const parsed = registerSchema.parse({ ...validRegister, password });

    expect(parsed.password).toBe(password);
  });
});

describe("login schema", () => {
  it("normalizes the username before lookup", () => {
    const parsed = loginSchema.parse({
      username: "  دانش۱۲۳ ",
      password: "whatever1",
    });

    expect(parsed.username).toBe("دانش123");
  });
});

describe("update profile schema", () => {
  it("allows an absent new password", () => {
    const parsed = updateProfileSchema.parse({
      fullName: "نام",
    });

    expect(parsed.newPassword).toBeUndefined();
    expect(parsed.email).toBeUndefined();
  });

  it("requires the current password when a new password is present", () => {
    const parsed = updateProfileSchema.safeParse({
      fullName: "نام",
      newPassword: NEW_PASSWORD,
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0].path).toEqual(["currentPassword"]);
    }
  });
});

describe("group schemas", () => {
  it("rejects an empty group name", () => {
    expect(createGroupSchema.safeParse({ name: "  " }).success).toBe(false);
  });

  it("treats an empty groupId as no group", () => {
    const parsed = assignStudentSchema.parse({
      studentId: "student-1",
      groupId: "",
    });

    expect(parsed.groupId).toBeNull();
  });
});
