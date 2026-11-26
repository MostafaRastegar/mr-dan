/**
 * Advising domain errors.
 *
 * Extend the shared AppError kernel so presentation maps `code`/`status`
 * exactly like the rag module.
 */

import { AppError } from "@/shared/errors";

export { AppError, NotFoundError, ValidationError } from "@/shared/errors";

export class UsernameTakenError extends AppError {
  constructor(cause?: unknown) {
    super("username_taken", 409, "Username already taken", cause);
  }
}

export class EmailTakenError extends AppError {
  constructor(cause?: unknown) {
    super("email_taken", 409, "Email already taken", cause);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", cause?: unknown) {
    super("unauthorized", 401, message, cause);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", cause?: unknown) {
    super("forbidden", 403, message, cause);
  }
}

export class ScheduleConflictError extends AppError {
  constructor(cause?: unknown) {
    super("schedule_conflict", 409, "این بازه با یک درس دیگر همان روز تداخل دارد", cause);
  }
}

export class PlanOverCapacityError extends AppError {
  constructor(message: string, cause?: unknown) {
    super("plan_over_capacity", 409, message, cause);
  }
}

export class FreeTimeBelowPlannedError extends AppError {
  constructor(message: string, cause?: unknown) {
    super("free_time_below_planned", 409, message, cause);
  }
}

export class PlanConcurrencyError extends AppError {
  constructor(cause?: unknown) {
    super("plan_concurrent_write", 409, "برنامه هم‌زمان تغییر کرد؛ دوباره تلاش کنید", cause);
  }
}

export class ConflictError extends AppError {
  constructor(message = "تداخل در داده‌ها", cause?: unknown) {
    super("conflict", 409, message, cause);
  }
}

export class HomeworkCompletedError extends AppError {
  constructor(cause?: unknown) {
    super("homework_completed", 409, "این تکلیف قبلاً تکمیل شده است", cause);
  }
}

export class PlanAfterDeadlineError extends AppError {
  constructor(cause?: unknown) {
    super("plan_after_deadline", 400, "تاریخ برنامه‌ریزی بعد از مهلت تکلیف است", cause);
  }
}

export class ProfileIncompleteError extends AppError {
  constructor(cause?: unknown) {
    super("profile_incomplete", 422, "Physical profile is incomplete", cause);
  }
}

export class SlugConflictError extends AppError {
  constructor(cause?: unknown) {
    super("slug_conflict", 409, "این شناسه یا برچسب قبلاً ثبت شده است", cause);
  }
}

export class RoleChangeForbiddenError extends AppError {
  constructor(cause?: unknown) {
    super("role_change_forbidden", 403, "نقش خود را نمی‌توانید تغییر دهید", cause);
  }
}

export class LastAdminError extends AppError {
  constructor(cause?: unknown) {
    super("last_admin", 409, "آخرین مدیر را نمی‌توان تنزل داد", cause);
  }
}
