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
  schedule_conflict: "این بازه با یک درس دیگر همان روز تداخل دارد",
  internal_error: "خطای داخلی رخ داد. لطفاً دوباره تلاش کنید.",
};

const FIELD_FOR_CODE: Record<string, string> = {
  username_taken: "username",
  email_taken: "email",
  schedule_conflict: "startTime",
};

export function toActionError(error: unknown): ActionError {
  if (error instanceof AppError) {
    const message = MESSAGES[error.code] ?? MESSAGES.internal_error;
    const field = FIELD_FOR_CODE[error.code];
    return field
      ? { code: error.code, message, fieldErrors: { [field]: message } }
      : { code: error.code, message };
  }

  return { code: "internal_error", message: MESSAGES.internal_error };
}
