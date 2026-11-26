/**
 * Presentation-layer zod schemas for homework (D-2).
 *
 * Parses form inputs into domain-shaped values (priority rank number, Iran
 * midnight deadline) with Persian messages.
 */

import { z } from "zod";

import { HOMEWORK_PRIORITIES } from "../domain/models";

const DEADLINE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function optionalSubject(subjects: readonly string[], message: string) {
  return z
    .string()
    .optional()
    .transform((value) => {
      const trimmed = value?.trim() ?? "";
      return trimmed.length > 0 ? trimmed : undefined;
    })
    .refine(
      (value) => value === undefined || subjects.includes(value),
      message,
    );
}

/** Built per request from the active subject slugs. */
export function makeHomeworkSchemas(subjects: readonly string[]) {
  return {
    homeworkSchema: z.object({
  title: z
    .string()
    .trim()
    .min(1, "عنوان الزامی است")
    .max(120, "عنوان نباید بیشتر از ۱۲۰ نویسه باشد"),
  subject: optionalSubject(subjects, "درس انتخاب‌شده معتبر نیست"),
  priority: z
    .enum(["low", "medium", "high"])
    .transform((value) => HOMEWORK_PRIORITIES[value]),
  deadline: z
    .string()
    .regex(DEADLINE_RE, "تاریخ را به فرمتYYYY-MM-DD وارد کنید")
    .refine(
      (value) => {
        const [y, m, d] = value.split("-").map(Number);
        const date = new Date(`${value}T00:00:00+03:30`);
        return (
          date.getFullYear() === y &&
          date.getMonth() + 1 === m &&
          date.getDate() === d
        );
      },
      "تاریخ معتبر نیست",
    )
    .transform((value) => new Date(`${value}T00:00:00+03:30`)),
    }),
  };
}

export const homeworkToggleSchema = z.object({
  id: z.string().min(1, "شناسه الزامی است"),
  completed: z
    .enum(["true", "false"])
    .transform((value) => value === "true"),
});

export type HomeworkSchemas = ReturnType<typeof makeHomeworkSchemas>;
export type HomeworkInput = z.infer<HomeworkSchemas["homeworkSchema"]>;
export type HomeworkToggleInput = z.infer<typeof homeworkToggleSchema>;
