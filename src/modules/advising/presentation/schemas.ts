/**
 * Server Action boundary for the advising module.
 *
 * Every action parses FormData with zod (Persian messages), delegates to a
 * use case through the container, and returns the shared ActionResult shape.
 * `redirect()` is always called outside `runAction` so `NEXT_REDIRECT` is not
 * swallowed, and cache revalidation is never invoked inside actions.
 */

import { z } from "zod";

import type { Role } from "../domain/models";
import { toAsciiDigits } from "@/shared/persian-digits";

const PASSWORD_MAX = 128;

export function requiredText(max: number, label: string) {
  return z
    .string()
    .trim()
    .min(1, `${label} الزامی است`)
    .max(max, `${label} نباید بیشتر از ${max} نویسه باشد`);
}

function optionalText(max: number, message: string) {
  return z
    .string()
    .optional()
    .transform((value) => {
      const trimmed = value?.trim() ?? "";
      return trimmed.length > 0 ? trimmed : undefined;
    })
    .refine((value) => value === undefined || value.length <= max, message);
}

function optionalChoice(allowed: readonly string[], message: string) {
  return z
    .string()
    .optional()
    .transform((value) => {
      const trimmed = value?.trim() ?? "";
      return trimmed.length > 0 ? trimmed : undefined;
    })
    .refine((value) => value === undefined || allowed.includes(value), message);
}

const usernameField = z
  .string()
  .trim()
  .min(3, "نام کاربری باید حداقل ۳ نویسه باشد")
  .max(32, "نام کاربری نباید بیشتر از ۳۲ نویسه باشد")
  .transform((value) => toAsciiDigits(value).toLowerCase());

const passwordField = z
  .string()
  .min(8, "رمز عبور باید حداقل ۸ نویسه باشد")
  .max(PASSWORD_MAX, `رمز عبور نباید بیشتر از ${PASSWORD_MAX} نویسه باشد`);

export const emailField = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = toAsciiDigits(value?.trim() ?? "").toLowerCase();
    return trimmed.length > 0 ? trimmed : undefined;
  })
  .refine(
    (value) => value === undefined || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    "ایمیل معتبر نیست",
  );

const roleField = z
  .string()
  .transform((value) => value.trim())
  .refine(
    (value) => value === "student" || value === "counselor",
    "نقش انتخاب‌شده معتبر نیست",
  )
  .pipe(z.enum(["student", "counselor"]));

const newPasswordField = z
  .string()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined))
  .refine(
    (value) =>
      value === undefined ||
      (value.length >= 8 && value.length <= PASSWORD_MAX),
    `رمز عبور باید بین ۸ تا ${PASSWORD_MAX} نویسه باشد`,
  );

function hhmmToMinutes(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

export interface IdentityOptions {
  fields: readonly string[];
  grades: readonly string[];
}

/** Identity schemas are built per request from the active catalog rows. */
export function makeRegisterSchemas(options: IdentityOptions) {
  const { fields, grades } = options;

  const registerSchema = z.object({
    username: usernameField,
    password: passwordField,
    role: roleField,
    fullName: requiredText(100, "نام و نام خانوادگی"),
    email: emailField,
    grade: optionalChoice(grades, "پایهٔ تحصیلی نامعتبر است"),
    fieldOfStudy: optionalChoice(fields, "رشتهٔ تحصیلی نامعتبر است"),
    schoolName: optionalText(100, "نام مدرسه نباید بیشتر از ۱۰۰ نویسه باشد"),
  });

  const updateProfileSchema = z
    .object({
      fullName: requiredText(100, "نام و نام خانوادگی"),
      email: emailField,
      grade: optionalChoice(grades, "پایهٔ تحصیلی نامعتبر است"),
      fieldOfStudy: optionalChoice(fields, "رشتهٔ تحصیلی نامعتبر است"),
      schoolName: optionalText(100, "نام مدرسه نباید بیشتر از ۱۰۰ نویسه باشد"),
      currentPassword: optionalText(PASSWORD_MAX, "رمز عبور فعلی بسیار بلند است"),
      newPassword: newPasswordField,
      sleepTime: z
        .string()
        .optional()
        .transform((value) => {
          const trimmed = value?.trim() ?? "";
          return trimmed.length > 0 ? trimmed : undefined;
        }),
      wakeTime: z
        .string()
        .optional()
        .transform((value) => {
          const trimmed = value?.trim() ?? "";
          return trimmed.length > 0 ? trimmed : undefined;
        }),
    })
    .refine(
      (value) => {
        const s = value.sleepTime;
        const w = value.wakeTime;
        if (s === undefined || w === undefined) return true;
        return hhmmToMinutes(s) !== hhmmToMinutes(w);
      },
      {
        path: ["sleepTime"],
        message: "ساعت خواب و بیداری نمی‌توانند برابر باشد",
      },
    )
    .refine((value) => !value.newPassword || !!value.currentPassword, {
      path: ["currentPassword"],
      message: "برای تغییر رمز، رمز عبور فعلی الزامی است",
    })
    .transform(({ sleepTime, wakeTime, ...rest }) => ({
      ...rest,
      sleepMinutes: hhmmToMinutes(sleepTime),
      wakeMinutes: hhmmToMinutes(wakeTime),
    }));

  const createGroupSchema = z.object({
    name: requiredText(100, "نام گروه"),
    description: optionalText(300, "توضیحات نباید بیشتر از ۳۰۰ نویسه باشد"),
    targetGrade: optionalChoice(grades, "پایهٔ هدف نامعتبر است"),
    targetField: optionalChoice(fields, "رشتهٔ هدف نامعتبر است"),
    color: z
      .string()
      .optional()
      .transform((value) => {
        const trimmed = value?.trim() ?? "";
        return trimmed.length > 0 ? trimmed : undefined;
      })
      .refine(
        (value) => value === undefined || /^#[0-9a-fA-F]{6}$/.test(value),
        "رنگ معتبر نیست",
      ),
  });

  return { registerSchema, updateProfileSchema, createGroupSchema };
}

export type IdentitySchemas = ReturnType<typeof makeRegisterSchemas>;
export type RegisterSchemaInput = z.infer<IdentitySchemas["registerSchema"]>;
export type UpdateProfileSchemaInput = z.infer<
  IdentitySchemas["updateProfileSchema"]
>;
export type CreateGroupSchemaInput = z.infer<
  IdentitySchemas["createGroupSchema"]
>;

export const loginSchema = z.object({
  username: usernameField,
  password: z.string().min(1, "رمز عبور الزامی است").max(PASSWORD_MAX, "رمز عبور بسیار بلند است"),
});

export const assignStudentSchema = z.object({
  studentId: z.string().trim().min(1, "انتخاب دانش‌آموز الزامی است"),
  groupId: z
    .string()
    .optional()
    .transform((value) => {
      const trimmed = value?.trim() ?? "";
      return trimmed.length > 0 ? trimmed : null;
    }),
});

/** Field name -> the first Persian message for that field. */
export function toFieldErrors(
  issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const field = String(issue.path[0] ?? "form");
    if (!Object.prototype.hasOwnProperty.call(errors, field)) {
      errors[field] = issue.message;
    }
  }
  return errors;
}

export type LoginSchemaInput = z.infer<typeof loginSchema>;
export type AssignStudentSchemaInput = z.infer<typeof assignStudentSchema>;

export const ROLES: readonly Role[] = ["student", "counselor"];
