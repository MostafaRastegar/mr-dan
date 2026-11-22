/**
 * Shared domain error kernel.
 *
 * Product modules (rag, advising) share one error shape so presentation can map
 * `code`/`status` identically. Module-specific subclasses live in each module's
 * `domain/errors.ts` and extend these.
 */

export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, cause?: unknown) {
    super("invalid_input", 400, message, cause);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, cause?: unknown) {
    super("not_found", 404, `${resource} not found`, cause);
  }
}
