---
name: mr-dan-frontend
description: Ant Design 6 + Tailwind 4 RTL conventions for mr-dan pages, forms, tables and chat panels (RSC/client split, Server Action forms, field errors)
---

# mr-dan-frontend

## Usage

Use when building a page, form, table, counselor/admin panel, or chat component.

## Pinned stack (do not change without human approval)

```text
next 16.4.6 · react 19.3.1 · typescript 7.0.2 · tailwindcss 4.3.5
antd 6.7.1 · @ant-design/nextjs-registry 1.3.0 · zod 4
@tabler/icons-react 3.52.0 (exact pin — the only icon set in the project)
```

## Stack split

- **AntD**: every ready-made interactive component — `Form`, `Input`, `Select`, `Button`, `Table`, `Empty`, `Modal`, `Drawer`, `Spin`.
- **Tailwind**: layout, spacing, typography, breakpoints.
- Tailwind does not restyle an AntD component; when the look must change, change `theme`/`ConfigProvider` first.

## RSC / client split

- `app/**/page.tsx` is an async Server Component: guard + data from a use case + serialized props. It never becomes `"use client"` and never imports Prisma or a repository.
- A `"use client"` component exists only for an interactive form/table/chat. It receives data as props, never fetches, and has no `useEffect` for initial data.
- A protected page reads fresh data on every navigation; there is nothing to invalidate on the client.
- The client half of a route lives next to its page: `<x>.vm.tsx` (state, exports `<Thing>Wrapper`)
  + `<x>.view.tsx` (markup, exports `<Thing>View`). Components private to the route go in
  `<route>/_components/`.
- Any `"use client"` file over 80 lines must be a `.vm.tsx` with a sibling `.view.tsx`, and the
  view owns no hooks. `test/architecture.test.ts` enforces this for `src/app/**` and `src/components/**`.

## Action result contract (the only shape)

```ts
type ActionState<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        fieldErrors?: Record<string, string>;
      };
    };
```

- Success is **only** `state?.ok === true`; never `data !== null`, never treat `null` as success.
- `fieldErrors` holds exactly one Persian message per field; the key is the `Form.Item` `name`.
- No `{ status: "idle" | "success" }` shape exists in forms.
- The type lives in `src/utils/app-error.ts`; `ActionResult` no longer exists.
- `redirect()` is called outside `try/catch` (otherwise `NEXT_REDIRECT` is swallowed).
- Never call `revalidatePath`/`revalidateTag` inside a Server Action — the page remounts inside the action response and the form state resets (vercel/next.js#66426). Refresh with `router.refresh()` after success instead.

## Forms: antd `Form` + Server Action

The single client bridge is `src/utils/use-form-action.ts` (`useFormAction`, `useServerFormErrors`, `toFormData`).

```tsx
"use client";
const [form] = Form.useForm();
const { state, submit, pending } = useFormAction(updateProfileAction);
const formError = useServerFormErrors(state, form); // unconditional, next to useForm

<Form form={form} layout="vertical" requiredMark={false} onFinish={submit}>
  <Form.Item
    name="fullName"
    label="Full name"
    rules={[{ required: true, message: "Enter your full name" }]}
  >
    <Input autoComplete="name" data-testid={TEST_IDS.FORM.INPUT("fullName")} />
  </Form.Item>
  {formError ? <p role="alert">{formError}</p> : null}
  <Button type="primary" htmlType="submit" loading={pending}>
    Save
  </Button>
</Form>;
```

Hard rules:

1. Submit only through `onFinish={submit}` and a `htmlType="submit"` button. Never `onClick` to submit, never a hand-written `<form action>` next to `Form`.
2. `useFormAction` turns the `onFinish` values into `FormData` and dispatches it to `useActionState` inside `startTransition`. A Server Action always has the `(previous, formData)` signature and parses with zod itself; the component never passes values to a use case.
3. Call `useServerFormErrors` **unconditionally** (always, next to `Form.useForm`). It pushes `error.fieldErrors` onto the fields with `form.setFields` and returns the global message. Do not write manual mapping in the component.
4. `Select` inside `Form.Item` works because the value comes from form state; no `<input type="hidden">` is needed. A bare `Select` outside `Form.Item` is forbidden.
5. `allowClear` yields `undefined`, and `toFormData` drops it; that is the correct behavior for an optional field.
6. After success: `form.resetFields()` (or only sensitive fields such as passwords) and `router.refresh()` when a list/table must update. Do this in a `useEffect` on `state?.ok`, not in `onFinish`.
7. No manual toast/`message.success` inside a submit handler; the success message comes from a server redirect or from `state?.ok` in the markup.
8. Client `rules` are UX only; real validation and the final message come from the server-side zod schema. Client rules must not diverge semantically from the server schema.
9. The global form error uses `role="alert"`, the success message uses `role="status"`. Both are Persian and free of internal detail.

## Errors and states

- Mapping a domain error to `{ code, message, fieldErrors }` happens only in `src/modules/<name>/presentation/messages.ts`; the component never builds messages and never renders a raw server `error.message`.
- Every list/table has an empty state (`<Empty description="…">` or Persian text), a pending state (`loading`), and an error state. Missing empty/loading/error means the work is not done.
- `Table` always has `rowKey` and `scroll={{ x: … }}` so it scrolls inside itself on mobile, not the whole page.

## Icons and data-testid

- Only `@tabler/icons-react`; importing `@ant-design/icons` is forbidden.
- Every interactive element gets a stable `data-testid` from `src/constants/test-ids.ts`: `form-input-<name>`, `form-select-<name>`, `form-submit-<action>`, `form-item-<name>`, `modal-<title>`. A new name is added to that registry, never as a scattered string.
- Playwright specs use `data-testid` from `src/constants/test-ids.ts` (`TEST_IDS` registry). `input[name=…]` is not used — `Form.Item name` does not map to an HTML `name` under the antd `useFormAction` bridge; `data-testid` covers elements without a `name` and adds stability.

## Responsive

- No horizontal page overflow at 360px.
- Layout with Tailwind breakpoints: `grid gap-3 sm:grid-cols-3`, `flex flex-col gap-4 lg:flex-row`. No device store and no `window` branch in render.
- Tap targets ≥ 44px, 200% zoom safe, `focus-visible` never removed.
- A modal becomes a bottom sheet below `lg`; until a page has a modal, do not implement the rule.

## Access control

- The server guard is the security boundary (`requireSessionUser` / `requireCapability` in `src/server/*-guards.ts` plus the server layout); hiding UI is UX only, and every action authorizes again.
- One capability map per module in `src/modules/<name>/domain/capabilities.ts`; never scatter `role === "…"` checks in components — use `hasCapability(user.role, "group:manage")`.
- An unauthorized control is **removed**, never rendered `disabled`.
- Row-level rules (a counselor owns only their group/student) are enforced in the use case, not only in the page.
- Verification matrix per surface: no session → `/login`; session without capability → 403/redirect; owner → allowed; another counselor → 403; admin → allowed.

## Persian / RTL

- `dir="rtl"` on `<html>` + `ConfigProvider direction="rtl"` + `locale={faIR}` are global; a new page must not override them.
- Persian font via `next/font/local` (Vazirmatn) with a system fallback.
- All labels, errors and success messages are Persian; Persian digits are normalized to ASCII with `toAsciiDigits` only for `username`/`email`, never for passwords.
- Latin inputs (`username`, `email`, passwords) carry `dir="ltr"`.

## Chat and RAG (existing product area)

- Data in RSC; the client is interaction only. Thin HTTP client: `src/lib/api.ts`.
- Streaming with `fetch` + `ReadableStream` and a line-by-line SSE parser; `EventSource` is unsuitable for POST.
- `AbortController` for stop; unmount → abort. Chat state via `useReducer`, not ten `useState`s.
- Send order: append user → open stream → token → sources → done. Error = assistant message with `status: "error"` and a retry button; stop = abort + keep the partial text labeled "stopped".
- Clickable citation: filename + page/section → drawer with the chunk text.
- Answer Markdown with `react-markdown` + `remark-gfm`; `dangerouslySetInnerHTML` is banned.
- `aria-live` on the answer area; Enter sends, Shift+Enter inserts a newline.

## Component layout

```text
src/app/**/<route>/
├─ page.tsx              async server: guard + data + props (≤40 lines)
├─ <x>.vm.tsx            "use client": hooks only, exports <Thing>Wrapper
├─ <x>.view.tsx          markup only, exports <Thing>View
├─ <area>.actions.ts     'use server': mutations for this area
└─ _components/          route-private forms/modals, each a vm/view pair
src/components/
└─ providers.tsx         global ConfigProvider (root layout only)
src/utils/
├─ app-error.ts          ActionError + ActionState (type-only)
├─ server-action.ts      runAction
└─ use-form-action.ts    useFormAction + useServerFormErrors
```

- Explicit props; no global context for local state; no store library.

## Checklist

- [ ] `state?.ok` is the only success signal.
- [ ] `fieldErrors` land on the fields via `useServerFormErrors`, and the global message has `role="alert"`.
- [ ] `pending` is visible on the submit button.
- [ ] Empty/loading/error exists for every list.
- [ ] RTL and digits are correct; Latin inputs carry `dir="ltr"`.
- [ ] Stable `data-testid` from the registry.
- [ ] No `revalidatePath`, no manual toast, no `fetch` in a component.
- [ ] No hard-coded color/spacing outside theme/Tailwind.

## Anti-patterns

- A native `<form action={…}>` next to antd `Form` (two submit paths, undefined behavior).
- Submitting with `onClick` or `router.push` inside `onFinish`.
- Manual `fieldErrors` mapping with a duplicated `useEffect` in every form instead of the bridge.
- `useEffect` for initial data; server state in the client; a store library.
- `disabled` instead of removing an unauthorized control; scattered role checks in components.
- Rendering Markdown with `dangerouslySetInnerHTML`; storing chats in IndexedDB while Postgres is the source of truth.
- Heavy animation on every token; mixing two design systems.
