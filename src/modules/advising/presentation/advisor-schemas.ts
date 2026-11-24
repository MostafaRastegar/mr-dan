/**
 * Server Action boundary schemas for advisor-program (AP-2).
 *
 * Parses FormData with zod and Persian messages. Zod issues are mapped to
 * field errors by `toFieldErrors` in `schemas.ts`; the action layer delegates
 * to use cases through the container.
 */

import { z } from "zod";

import { isSubjectSlug } from "../domain/subjects";
import { dedupeChapterIds } from "../domain/chapters";
import {
  CHAPTERS_MAX_PER_ENTRY,
  COURSE_WEEKLY_HOURS_MAX,
  HOMEWORK_AVERAGE_MAX,
  NOTE_MAX,
  OTHER_OCCUPIED_MAX,
  TARAZ_MAX,
  TARAZ_MIN,
} from "../domain/models";

const SCHOOL_MODES = ["in_person", "virtual"] as const;

export const schoolModeSchema = z.enum(SCHOOL_MODES);

/** One non-school occupied hour field (0..12), optional. */
function occupiedHourField() {
  return z
    .string()
    .optional()
    .transform((value) => {
      const n = Number(value);
      return Number.isFinite(n) ? n : undefined;
    })
    .refine(
      (value) =>
        value === undefined || (value >= 0 && value <= OTHER_OCCUPIED_MAX / 60),
      "ساعت اشغال روزانه باید ۰ تا ۱۲ باشد",
    );
}

/** Hours entered as a decimal string (0.25..12). */
function hoursField() {
  return z
    .coerce.number()
    .refine(
      (value) => value >= 0.25 && value <= OTHER_OCCUPIED_MAX / 60,
      "ساعت‌ها باید بین ۰٫۲۵ تا ۱۲ باشد",
    );
}

/** JSON array string of chapter ids → deduped string[]. */
function chapterIdsField() {
  return z
    .string()
    .optional()
    .transform((value) => {
      if (!value) return [] as string[];
      try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((v): v is string => typeof v === "string");
      } catch {
        return [];
      }
    })
    .transform((ids) => dedupeChapterIds(ids))
    .refine(
      (ids) => ids.length <= CHAPTERS_MAX_PER_ENTRY,
      "فصل‌های بیشتر از ۱۰ قابل ثبت نیست",
    );
}

/** Optional trimmed note, empty → undefined. */
function noteField() {
  return z
    .string()
    .optional()
    .transform((value) => {
      const trimmed = (value ?? "").trim();
      return trimmed.length > 0 ? trimmed : undefined;
    })
    .refine(
      (value) => value === undefined || value.length <= NOTE_MAX,
      "یادداشت نباید بیشتر از ۲۰۰ نویسه باشد",
    );
}

export const studyProfileSchema = z.object({
  schoolMode: schoolModeSchema.optional(),
  needId: z.string().trim().optional(),
  takesMockExams: z
    .string()
    .optional()
    .transform(
      (value) => (value === undefined ? undefined : value === "true"),
    ),
  otherOccupied0: occupiedHourField(),
  otherOccupied1: occupiedHourField(),
  otherOccupied2: occupiedHourField(),
  otherOccupied3: occupiedHourField(),
  otherOccupied4: occupiedHourField(),
  otherOccupied5: occupiedHourField(),
  otherOccupied6: occupiedHourField(),
  homeworkAverageHours: z
    .coerce.number()
    .optional()
    .refine(
      (value) =>
        value === undefined ||
        (value >= 0 && value <= HOMEWORK_AVERAGE_MAX / 60),
      "میانگین روزانه تکلیف باید ۰ تا ۱۲ ساعت باشد",
    ),
});

export const examResultSchema = z.object({
  examId: z.string().trim().min(1, "انتخاب آزمون الزامی است"),
  taraz: z
    .coerce.number()
    .int("تراز باید عدد صحیح باشد")
    .min(TARAZ_MIN, "تراز باید بین ۰ تا ۱۰۰۰۰ باشد")
    .max(TARAZ_MAX, "تراز باید بین ۰ تا ۱۰۰۰۰ باشد"),
});

export const courseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "عنوان الزامی است")
    .max(100, "عنوان نباید بیشتر از ۱۰۰ نویسه باشد"),
  mode: schoolModeSchema,
  weeklyHours: z
    .coerce.number()
    .optional()
    .refine(
      (value) =>
        value === undefined ||
        (value >= 0.25 && value <= COURSE_WEEKLY_HOURS_MAX),
      "ساعت هفتگی باید بین ۰٫۲۵ تا ۳۰ باشد",
    ),
});

export const schoolProgramSchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6, "روز هفته نامعتبر است"),
  subject: z.string().refine(isSubjectSlug, "درس نامعتبر است"),
  hours: hoursField(),
});

export const studyPlanHeaderSchema = z.object({
  testsTarget: z
    .coerce.number()
    .int()
    .min(0, "تعداد تست باید بین ۰ تا ۲۰۰۰ باشد")
    .max(2000, "تعداد تست باید بین ۰ تا ۲۰۰۰ باشد"),
});

export const studyPlanEntrySchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6, "روز هفته نامعتبر است"),
  subject: z.string().refine(isSubjectSlug, "درس نامعتبر است"),
  hours: hoursField(),
  chapterIds: chapterIdsField(),
  note: noteField(),
});

export type StudyProfileSchemaInput = z.infer<typeof studyProfileSchema>;
export type ExamResultSchemaInput = z.infer<typeof examResultSchema>;
export type CourseSchemaInput = z.infer<typeof courseSchema>;
export type SchoolProgramSchemaInput = z.infer<typeof schoolProgramSchema>;
export type StudyPlanHeaderSchemaInput = z.infer<
  typeof studyPlanHeaderSchema
>;
export type StudyPlanEntrySchemaInput = z.infer<typeof studyPlanEntrySchema>;
