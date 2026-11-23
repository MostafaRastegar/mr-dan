---
name: mr-dan-feature-workflow
description: Step-by-step product feature workflow (schema → use case → port/adapter → server action → RSC page → client form → tests) for mr-dan. Use for every new advising/platform feature.
---

# mr-dan-feature-workflow

## Pinned stack (do not change without human approval)

```text
next 16.4.6 · react 19.3.1 · typescript 7.0.2 · tailwindcss 4.3.5
antd 6.7.1 · @ant-design/nextjs-registry 1.3.0
prisma 7.10.1 (@prisma/adapter-pg) · zod 4 · oxlint · pnpm
vitest · @playwright/test
@tabler/icons-react — the only icon set in the project (exact pin, no `^`)
```

## Order of work (mandatory)

1. **Schema** — additive Prisma model; `pnpm prisma migrate dev --name <verb_noun>` then `pnpm prisma generate`. Never edit an applied migration.
2. **Domain** — `src/modules/<name>/domain/{models,ports,errors}.ts`. `domain` imports nothing external (no zod, no next, no prisma). The capability map lives here too: `domain/capabilities.ts`.
3. **Use case** — `application/`; depends only on ports and models. A mutation always authorizes (`actor`, ownership) via `hasCapability`, not just the UI.
4. **Port + adapter** — interface in `domain/ports.ts`, implementation in `infrastructure/prisma-*.ts` with an explicit `select` and row → domain mapping. Fake in `test/fakes/`.
5. **Server Action** — `src/app/**/<area>.actions.ts` with `"use server"` next to the pages that
   call it (`(auth)/auth.actions.ts`, `(advising)/advising.actions.ts`,
   `counselor/students/students.actions.ts`); body `runAction(...)` from `@/utils/server-action`;
   signature `(previous, formData)`; result is `ActionState` only. The module exports async
   functions only.
6. **RSC page** — `app/**/page.tsx` async server: guard (`requireSessionUser`/`requireCapability`)
   + data from a use case + serialized props. Never `"use client"`, ≤40 lines. Next to it create
   `<x>.vm.tsx` (hooks, exports `<Thing>Wrapper`) + `<x>.view.tsx` (markup, exports `<Thing>View`);
   route-private components go in `_components/`.
7. **Client form** — `<x>.vm.tsx` (`"use client"`): antd `Form.useForm()` + `useFormAction(action)`
   + `useServerFormErrors(state, form)` from `@/utils/use-form-action`; renders `<Thing>View`.
   `<x>.view.tsx`: the `<Form>` markup, submit via `onFinish={submit}` and `htmlType="submit"`,
   `data-testid` from `src/constants/test-ids.ts`. Details: the `mr-dan-frontend` skill.
8. **Tests** — unit for the use case with a fake, unit for schema/crypto/cookie, integration for real queries (graceful skip), e2e behind `E2E_ENABLED=true`. Then `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.

## Action result contract

```ts
type ActionState<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; fieldErrors?: Record<string, string> } };
```

- Success is **only** `state.ok` — write `state?.ok === true` because the initial state is `null`; never `data !== null`.
- The type lives in `src/utils/app-error.ts`; `ActionResult` no longer exists.
- No `{ status: "idle" | "success" }` shape exists.
- `fieldErrors` holds exactly one Persian message per field, keyed by the field `name`.

## Hard rule: `revalidatePath`

Never call `revalidatePath`/`revalidateTag` inside a Server Action. Next re-renders the page
inside the action response, the Suspense boundary remounts, and `useActionState` resets
(vercel/next.js#66426); the success state never reaches the client. Data refreshes on RSC
navigation, and `router.refresh()` after success is enough.

`redirect()` is called outside `try/catch`, otherwise `NEXT_REDIRECT` is swallowed.

## Persian / RTL

- `dir="rtl"` + `ConfigProvider direction="rtl"` + `locale={faIR}` are global; a new page overrides none of them.
- All labels and error messages are Persian; an error message never leaks internal text/stack/SQL.
- Persian/Arabic digits are converted to ASCII only for `username`/`email` (`toAsciiDigits`); passwords stay untouched.

## Anti-patterns

- Domain logic in a `route.ts` or a React component.
- A new route handler for an in-app form; mutations are Server Actions.
- Native `<form action>` or `onClick` submit next to antd `Form`.
- `any`, a cast that silences typecheck, or skipping a test assertion to go green.
- `disabled` instead of removing a control for an unauthorized user.
- Importing from the project's read-only reference folders (`mr-rag`, `example/`).
