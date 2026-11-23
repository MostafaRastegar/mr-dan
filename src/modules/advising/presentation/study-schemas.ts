/**
 * Presentation-layer zod schemas for study sessions (D-2).
 *
 * Parses form inputs into domain-shaped values (category, duration, ISO
 * datetime) with Persian messages. `studySessionSchemaAt(now)` injects the
 * reference clock for the future-session boundary check.
 */

import { z } from "zod";

import { STUDY_CATEGORIES } from "../domain/models";
import { isSubjectSlug } from "../domain/subjects";

function optionalSubject(message: string) {
  return z
    .string()
    .optional()
    .transform((value) => {
      const trimmed = value?.trim() ?? "";
      return trimmed.length > 0 ? trimmed : undefined;
    })
    .refine(
      (value) => value === undefined || isSubjectSlug(value),
      message,
    );
}

export function studySessionSchemaAt(now: Date) {
  return z.object({
    category: z.enum(STUDY_CATEGORIES),
    durationMinutes: z
      .coerce.number()
      .int()
      .min(1, "مدت حداقل ۱ دقیقه باشد")
      .max(1440, "مدت حداکثر ۱۴۴۰ دقیقه باشد"),
    focusLevel: z
      .coerce.number()
      .int()
      .min(1, "سطح تمرکز باید بین ۱ و ۵ باشد")
      .max(5, "سطح تمرکز باید بین ۱ و ۵ باشد")
      .optional(),
    subject: optionalSubject("درس انتخاب‌شده معتبر نیست"),
    startedAt: z
      .string()
      .datetime({ message: "تاریخ و زمان شروع معتبر نیست" })
      .transform((value) => new Date(value))
      .refine(
        (date) => date.getTime() <= now.getTime() + 5 * 60 * 1000,
        "تاریخ شروع نمی‌تواند بیش از ۵ دقیقه در آینده باشد",
      ),
  });
}

export type StudySessionInput = z.infer<
  ReturnType<typeof studySessionSchemaAt>
>;
