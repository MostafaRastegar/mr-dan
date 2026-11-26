/**
 * domain error code -> safe Persian message.
 *
 * Internal details (stack, SQL, provider errors) never reach the client: an
 * unknown error always becomes `internal_error`.
 */

import type { ActionError } from "@/utils/app-error";
import { AppError } from "@/shared/errors";

const MESSAGES: Record<string, string> = {
  invalid_input: "اطلاعات وارد شده معتبر نیست",
  unauthorized: "نام کاربری یا رمز عبور اشتباه است",
  forbidden: "دسترسی به این عملیات مجاز نیست",
  not_found: "موردی یافت نشد",
  username_taken: "این نام کاربری قبلاً ثبت شده است",
  email_taken: "این ایمیل قبلاً ثبت شده است",
  slug_conflict: "این شناسه یا برچسب قبلاً ثبت شده است",
  role_change_forbidden: "نقش خود را نمی‌توانید تغییر دهید",
  last_admin: "آخرین مدیر را نمی‌توان تنزل داد",
  schedule_conflict: "این بازه با یک درس دیگر همان روز تداخل دارد",
  profile_incomplete: "برای محاسبهٔ کالری، ابتدا اطلاعات فیزیکی خود را کامل کنید",
  plan_concurrent_write: "برنامه هم‌زمان تغییر کرد؛ دوباره تلاش کنید",
  plan_after_deadline: "این برنامه بعد از مهلت تکلیف است",
  homework_completed: "این تکلیف قبلاً انجام شده است",
  chapters: "فصل‌های انتخاب‌شده معتبر نیستند",
  note: "یادداشت نباید بیشتر از ۲۰۰ نویسه باشد",
  internal_error: "خطای داخلی رخ داد. لطفاً دوباره تلاش کنید.",
};

/** Contains only formatted integers and fixed Persian words: safe to pass through. */
const PASSTHROUGH_CODES = new Set(["plan_over_capacity", "free_time_below_planned"]);

const FIELD_FOR_CODE: Record<string, string> = {
  username_taken: "username",
  email_taken: "email",
  slug_conflict: "slug",
  schedule_conflict: "startTime",
  profile_incomplete: "age",
  plan_over_capacity: "plannedTime",
  free_time_below_planned: "freeTime",
  plan_concurrent_write: "plannedTime",
  plan_after_deadline: "date",
  homework_completed: "homeworkId",
  chapters: "chapters",
  note: "note",
};

export function toActionError(error: unknown): ActionError {
  if (error instanceof AppError) {
    const message = PASSTHROUGH_CODES.has(error.code)
      ? error.message
      : MESSAGES[error.code] ?? MESSAGES.internal_error;
    const field = FIELD_FOR_CODE[error.code];
    return field
      ? { code: error.code, message, fieldErrors: { [field]: message } }
      : { code: error.code, message };
  }

  return { code: "internal_error", message: MESSAGES.internal_error };
}
