/**
 * The only Server Action result shape in this repo.
 *
 * Success is detected with `ok === true`; `fieldErrors` maps one field to one
 * Persian message. See `docs/plan/frontend-conventions.md`.
 */

export interface ActionError {
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
}

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ActionError };
