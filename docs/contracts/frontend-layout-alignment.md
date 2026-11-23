# Contract: frontend-layout-alignment

Source of truth for the frontend layout refactor (phase ۵.۱ implementation). Observable behavior is unchanged; only file placement and the `"use server"` boundary move.

## Interface signatures

```ts
export interface ActionError {
  code: string; // "invalid_input" | "unauthorized" | "forbidden" | "not_found"
                // | "username_taken" | "email_taken" | "internal_error"
  message: string; // Persian, safe to render
  fieldErrors?: Record<string, string>; // field name -> ONE Persian message
}

export type ActionState<T> =
  | { ok: true; data: T }
  | { ok: false; error: ActionError };
```

`src/utils/app-error.ts` is a type-only module: import with `import type`, nothing ships to the client.

```ts
export async function runAction<T>(fn: () => Promise<T>): Promise<ActionState<T>>;
```

`src/utils/server-action.ts` — `runAction(fn)` only, no revalidate parameter, and this file carries no `"use server"` (it is imported *by* a `"use server"` module).

```ts
export function useFormAction<T>(action: ServerFormAction<T>): {
  state: ActionState<T> | null;
  submit: (formData: FormData) => Promise<void>;
  pending: boolean;
};
export function useServerFormErrors<T>(state: ActionState<T> | null, form: any): string | null;
```

`src/utils/use-form-action.ts` — antd `Form onFinish` → `FormData` → `useActionState`; maps `fieldErrors` via `form.setFields`.

Action signatures:

```ts
// (previous: ActionState<T> | null, formData: FormData) => Promise<ActionState<T>>
registerAction, loginAction, updateProfileAction, createGroupAction, assignStudentAction;
// logoutAction(formData: FormData): Promise<void>;
```

`src/app/(auth)/auth.actions.ts` → `registerAction`, `loginAction`.
`src/app/(advising)/advising.actions.ts` → `logoutAction`, `updateProfileAction`.
`src/app/(advising)/counselor/students/students.actions.ts` → `createGroupAction`, `assignStudentAction`.

## Invariant (enforceable sentence)

no file under `src/app/**` marked `"use client"` may import `@/server/container`, a Prisma client or a use case; every mutation enters through a `"use server"` module under `src/app/**` whose body is wrapped in `runAction`.

## Edge cases

- `state === null` (initial) → no banner.
- Unknown thrown error → `{ ok: false, error: { code: "internal_error" } }`, no internals leaked.
- zod failure → `fieldErrors` keyed by field.
- `redirect()` stays outside `runAction` (NEXT_REDIRECT would otherwise be swallowed).
- Concurrent double submit → `pending` comes from `useActionState`; unchanged.
- `app-error.ts` ships no runtime code — `! grep -qE '^export (const|function|class)' src/utils/app-error.ts`.
- `src/utils/server-action.ts` carries no `"use server"` — `! grep -q "use server" src/utils/server-action.ts`.

## Review level

`review_level: reviewed`

A human should read the actions split (`src/app/**/*.actions.ts`) plus one complete page triad (`page.tsx` + `<x>.vm.tsx` + `<x>.view.tsx`) rather than trust a green suite; the risk lives in the import graph and the three `"use server"` boundaries.
