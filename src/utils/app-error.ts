/**
 * The only Server Action result shape in this repo.
 *
 * Success is detected with `ok === true`; `fieldErrors` maps one field to one
 * Persian message. See `docs/plan/frontend-conventions.md`.
 *
 * Type-only module: import with `import type` so no runtime reaches the client.
 */

export interface ActionError {
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
}

export type ActionState<T> =
  | { ok: true; data: T }
  | { ok: false; error: ActionError };
