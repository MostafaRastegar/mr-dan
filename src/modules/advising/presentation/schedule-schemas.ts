/**
 * Presentation-layer zod schemas for the weekly schedule (D-2).
 *
 * Parses form inputs into domain-shaped values (minutes from midnight) with
 * Persian messages. `toFieldErrors` from `schemas` handles issue paths.
 */

import { z } from "zod";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
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

/** Built per request from the active subject slugs. */
export function makeScheduleSchemas(subjects: readonly string[]) {
  const scheduleEntrySchema = z
    .object({
      dayOfWeek: z
        .coerce.number()
        .int()
        .min(0, "روز هفته باید بین ۰ و ۶ باشد")
        .max(6, "روز هفته باید بین ۰ و ۶ باشد"),
      startTime: z
        .string()
        .regex(TIME_RE, "فرمت زمان معتبر نیست (مثلاً ۰۸:۳۰)"),
      endTime: z
        .string()
        .regex(TIME_RE, "فرمت زمان معتبر نیست (مثلاً ۰۸:۳۰)"),
      subject: z
        .string()
        .refine((value) => subjects.includes(value), "درس انتخاب‌شده معتبر نیست"),
      teacher: optionalText(60, "استاد نباید بیشتر از ۶۰ نویسه باشد"),
      room: optionalText(30, "اتاق نباید بیشتر از ۳۰ نویسه باشد"),
    })
    .transform((data) => ({
      dayOfWeek: data.dayOfWeek,
      startMinute: timeToMinutes(data.startTime),
      endMinute: timeToMinutes(data.endTime),
      subject: data.subject,
      teacher: data.teacher,
      room: data.room,
    }))
    .refine(
      (data) => data.endMinute > data.startMinute,
      { path: ["endTime"], message: "پایان باید بعد از شروع باشد" },
    );

  return { scheduleEntrySchema };
}

export type ScheduleSchemas = ReturnType<typeof makeScheduleSchemas>;

export const deleteByIdSchema = z.object({
  id: z.string().min(1, "شناسه الزامی است"),
});

export type ScheduleEntryInput = z.infer<
  ScheduleSchemas["scheduleEntrySchema"]
>;
export type DeleteByIdInput = z.infer<typeof deleteByIdSchema>;
