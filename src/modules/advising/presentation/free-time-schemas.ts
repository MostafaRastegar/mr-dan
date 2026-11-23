/**
 * Presentation-layer schemas for the daily free-time budget and homework
 * planning (D-3).
 *
 * `hh:mm` is split only here (`hhmmToMinutes`); the domain receives integer
 * minutes. An empty or null free time is valid and means "use the weekday
 * suggestion".
 */

import { z } from "zod";

import { isDayKey } from "../domain/day-key";

const CLOCK_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const CLOCK_MESSAGE = "فرمت زمان معتبر نیست (مثلاً ۰۸:۳۰)";

export function hhmmToMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

const dayField = z.string().refine(isDayKey, "تاریخ معتبر نیست");

const freeTimeField = z
  .string()
  .nullable()
  .transform((value) => value?.trim() ?? "")
  .refine((value) => value === "" || CLOCK_RE.test(value), CLOCK_MESSAGE)
  .transform((value) => (value === "" ? null : value));

const plannedTimeField = z
  .string()
  .trim()
  .regex(CLOCK_RE, CLOCK_MESSAGE)
  .refine(
    (value) => hhmmToMinutes(value) >= 1,
    "زمان برنامه‌ریزی‌شده باید بیشتر از صفر باشد",
  );

export const freeTimeSchema = z.object({
  date: dayField,
  freeTime: freeTimeField,
});

export const planTimeSchema = z.object({
  date: dayField,
  homeworkId: z.uuid("شناسهٔ تکلیف معتبر نیست"),
  plannedTime: plannedTimeField,
});

export type FreeTimeInput = z.infer<typeof freeTimeSchema>;
export type PlanTimeInput = z.infer<typeof planTimeSchema>;
