"use client";

/**
 * The single client bridge between antd `Form` and a Server Action.
 *
 * Mirrors the an-front pattern: success is `state?.ok`, field errors from the
 * server are pushed into the antd form instance, and submission runs inside a
 * transition so `pending` is accurate.
 */

import {
  startTransition,
  useActionState,
  useEffect,
  useState,
  useTransition,
} from "react";
import type { FormInstance } from "antd";

import type { ActionState } from "./app-error";

export type FormValues = Record<string, unknown>;

export type ServerFormAction<T> = (
  previous: ActionState<T> | null,
  formData: FormData,
) => Promise<ActionState<T>>;

/**
 * antd gives a values object; actions keep parsing `FormData` (zod + native
 * coercion). Empty strings are kept so "optional and empty" stays explicit.
 */
export function toFormData(values: FormValues): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const item of value) formData.append(key, String(item));
      continue;
    }
    formData.set(key, value instanceof Date ? value.toISOString() : String(value));
  }
  return formData;
}

export function useFormAction<T>(action: ServerFormAction<T>) {
  const [state, dispatch, pending] = useActionState(action, null);

  const submit = (values: FormValues) => {
    const formData = toFormData(values);
    startTransition(() => dispatch(formData));
  };

  return { state, submit, pending };
}

/**
 * Bridge for fieldless mutations (row delete, toggle, one-click action).
 * Same `(previous, formData)` contract as `useFormAction`, without an antd form.
 */
export function useActionMutation<T>(action: ServerFormAction<T>) {
  const [state, setState] = useState<ActionState<T> | null>(null);
  const [pending, startMutation] = useTransition();

  const run = (values: FormValues = {}) => {
    const formData = toFormData(values);
    startMutation(async () => {
      setState(await action(null, formData));
    });
  };

  return { state, run, pending };
}

/**
 * Pushes `error.fieldErrors` onto antd fields and returns the global message.
 * Call it unconditionally, next to `Form.useForm()`.
 */
export function useServerFormErrors<T>(
  state: ActionState<T> | null,
  form: FormInstance,
): string | null {
  const formError = state && !state.ok ? state.error.message : null;

  useEffect(() => {
    if (!state || state.ok) return;
    const fieldErrors = state.error.fieldErrors;
    if (!fieldErrors) return;
    form.setFields(
      Object.entries(fieldErrors).map(([name, message]) => ({
        name,
        errors: [message],
      })),
    );
  }, [state, form]);

  return formError;
}
