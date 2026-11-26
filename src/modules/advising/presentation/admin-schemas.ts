/**
 * Admin panel boundary schemas (Server Actions only).
 *
 * Same conventions as `schemas.ts`: trim, Persian messages, optional fields are
 * `.optional()` so the antd bridge can drop empty values. Arrays arrive via
 * `formData.getAll(...)` because `Object.fromEntries` keeps only the last entry.
 */

import { z } from "zod";

import type { Role } from "../domain/models";
import { emailField, requiredText } from "./schemas";

const ADMIN_ROLES = ["student", "counselor", "admin", "operator"] as const;

const roleField = z
  .string()
  .trim()
  .refine(
    (value): value is Role => (ADMIN_ROLES as readonly string[]).includes(value),
    "نقش انتخاب‌شده معتبر نیست",
  );

const idField = requiredText(64, "شناسه");
const labelList = z.array(z.string().trim().min(1)).default([]);

export const adminIdSchema = z.object({ id: idField });

export const adminLabelCreateSchema = z.object({
  label: requiredText(100, "برچسب"),
});
export const adminLabelUpdateSchema = adminLabelCreateSchema.extend({
  id: idField,
});

export const adminSubjectCreateSchema = z.object({
  label: requiredText(100, "برچسب"),
  slug: requiredText(80, "نامک"),
  fieldLabels: labelList,
  gradeLabels: labelList,
});
export const adminSubjectUpdateSchema = adminSubjectCreateSchema.extend({
  id: idField,
});

export const adminBookCreateSchema = z.object({
  slug: requiredText(80, "نامک"),
  title: requiredText(200, "عنوان"),
  author: requiredText(120, "نویسنده"),
  fieldLabel: z
    .string()
    .optional()
    .transform((value) => value?.trim() || null),
  codes: labelList,
});
export const adminBookUpdateSchema = adminBookCreateSchema.extend({
  id: idField,
});

export const adminChapterCreateSchema = z.object({
  subject: requiredText(80, "درس"),
  field: requiredText(80, "رشته"),
  grade: requiredText(40, "پایه"),
  number: z.coerce
    .number()
    .refine(
      (value) => Number.isInteger(value) && value >= 1,
      "شماره فصل باید عددی مثبت باشد",
    ),
  title: requiredText(200, "عنوان"),
});
export const adminChapterUpdateSchema = adminChapterCreateSchema.extend({
  id: idField,
});

export const adminRoleChangeSchema = z.object({
  userId: requiredText(64, "کاربر"),
  role: roleField,
});

export const adminSupportEditSchema = z.object({
  userId: requiredText(64, "کاربر"),
  fullName: requiredText(100, "نام کامل"),
  email: emailField,
});

export const adminSupportResetSchema = z.object({
  userId: requiredText(64, "کاربر"),
});
