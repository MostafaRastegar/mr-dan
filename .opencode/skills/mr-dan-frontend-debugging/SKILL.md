---
name: mr-dan-frontend-debugging
description: Known form/action/state and auth failure modes in mr-dan (Next 16.4.6 + AntD 6.7.1 RTL). Read this before debugging any submit/state/session bug.
---

# mr-dan-frontend-debugging

## Pinned stack (do not change without human approval)

```text
next 16.4.6 · react 19.3.1 · typescript 7.0.2 · antd 6.7.1 · prisma 7.10.1
zod 4 · oxlint · vitest · pnpm · @tabler/icons-react (exact pin)
```

## Diagnosis order (any submit/state bug)

1. Does the action go through `runAction`? Does it return the `ActionResult` shape?
2. Does the form use `useFormAction` + antd `Form onFinish`, or a hand-rolled submit path?
3. `grep -rn "revalidatePath\|revalidateTag" src` — suspect number two.
4. Network: look at the actual action payload and response (not a guess).
5. Restart the dev server before trusting a repro.

## 1. `state.ok` is always false / the form resets after submit

- **Cause:** `revalidatePath` or `revalidateTag` inside the Server Action. Next re-renders the page inside the action response, the Suspense boundary remounts, and `useActionState` resets (vercel/next.js#66426).
- **Fix:** remove it. Data refreshes on navigation; use `router.refresh()` after `state?.ok` for lists.
- **Check:** `grep -rn "revalidatePath" src/modules` must be empty.

## 2. Success is checked with `data !== null`

- **Cause:** a different result shape is assumed.
- **Fix:** `state.ok` is the only success signal; write `if (state?.ok) …` because the initial state is `null`.

## 3. Form does not submit / submits twice

- **Cause:** the button lacks `htmlType="submit"`, is outside `Form`, an extra `onClick` also submits, or a native `<form action>` wraps `Form`.
- **Fix:** one path only — `Form onFinish={submit}` + `<Button htmlType="submit">` inside that same `Form`. No `onClick`, no hand-written `<form action>`.

## 4. `Select` value never reaches the action

- **Cause:** `Select` is outside `Form.Item`, or uses manual `value/onChange` instead of `name`.
- **Fix:** put `Select` inside `Form.Item name="…"`; the value travels from form state to `onFinish` and `toFormData` sends it. `allowClear` yields `undefined`, which `toFormData` drops — correct for an optional field.

## 5. `fieldErrors` do not appear on the form

- **Check:** is `useServerFormErrors(state, form)` called unconditionally? Does each `fieldErrors` key match a `Form.Item` `name`? Does the zod path match the field name? Is the same `form` instance passed to both `useServerFormErrors` and `Form`?
- **Fix:** align the names; keep mapping only in the bridge, not in a duplicated `useEffect` per form. Persian messages come from `toFieldErrors`/`messages.ts`.

## 6. The global form error is invisible

- **Cause:** `formError` is not rendered, or is out of view.
- **Fix:** `{formError ? <p role="alert">{formError}</p> : null}` above the button; the success message is separate, with `role="status"`, and only when `state?.ok`.

## 7. 401/403 inside a Server Action

- **Cause:** the action trusts a hidden field or client input.
- **Fix:** `requireSessionUser()` / `requireCapability()` inside the action; check role and ownership on the server. Hiding a button is not enough (IDOR).

## 8. Redirect to `/login` for no reason

- **Check:** cookie name is `mrdan_session`; it is `httpOnly`, so the client cannot read it (expected); `secure` only in production; an expired session row is lazily deleted.
- **Fix:** test `ResolveSessionUseCase` directly with the cookie token; a replayed cookie after logout must return `null`.

## 9. `redirect()` does nothing

- **Cause:** it was called inside `try/catch`, so `NEXT_REDIRECT` was swallowed.
- **Fix:** call `redirect()` outside `runAction` and outside any `try/catch`.

## 10. The success message is empty or a generic default

- **Cause:** the server message was empty and the component substituted a default — or nothing renders at all.
- **Rule:** the success message comes from `state?.ok` or a server redirect; if you see a generic default, the bug is in the server action / `messages.ts`, not the component.

## 11. A bug "disappears" after an unrelated change

- **Cause:** a stale dev-server bundle after editing server/shared files.
- **Fix:** restart `pnpm dev`, reproduce again, then conclude.

## Persian / RTL

- `dir="rtl"` + `ConfigProvider direction="rtl"` + `locale={faIR}` are global; if form layout breaks, check theme/layout first, not hard-coded styles.
- Error messages are Persian and short; no stack/SQL/token ever goes into `ActionError.message` or `fieldErrors`.
- Persian digits are normalized only for `username`/`email`; never for passwords.
