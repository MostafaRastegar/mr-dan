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

export class ProfileIncompleteError extends AppError {
  constructor(cause?: unknown) {
    super("profile_incomplete", 422, "Physical profile is incomplete", cause);
  }
}
