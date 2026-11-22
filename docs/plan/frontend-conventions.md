# mr-dan — Frontend conventions (derived from the read-only `an-front` reference)

This document is the durable artifact for phases ۵.۲–۵.۴. It records what mr-dan takes
from `~/project/yaftar/an-front` (package `ipam-front-new`, Next 16 App Router + AntD 6
Persian/RTL product front end), what it rejects, and the exact contracts the advising
module follows.

Reference status: **read-only**, identical in status to `example/`.

- No import from `an-front` in this repo (no `@/`, no relative path outside the repo).
- No dependency, submodule, tree copy, or symlink from `an-front`.
- Its own source of truth is `an-front/docs/ARCHITECTURE.md` (545 lines) +
  `an-front/.agents/skills/*`; this repo's source of truth stays `AGENTS.md` +
  `.opencode/skills/mr-dan-*`. Every conflict resolves in favour of mr-dan's rules.
- Commit inspected: `an-front@d8cc2be` (2026-11-18).

## Correction record (2026-11-22)

The first draft of this document was derived from `~/project/yaftar/aip-next`, which was
the **wrong reference**: that repo is a LiteLLM gateway admin UI with a copy of the same
skill names. The human corrected the reference to `an-front`. Consequences, all applied
below and in `.opencode/skills/`:

1. Provenance of the adapted skills is `an-front/.agents/skills/`, not `aip-next`.
2. an-front has a **complete canonical architecture doc with three named choke points**
   (`app-error.ts`, `server-action.ts`, `use-form-action.ts`) plus a page/vm/view triad
   and a module triad — the earlier draft had none of these names.
3. an-front ships two skills the earlier draft missed entirely: **responsive** and
   **UI access control**; both matter for ۵.۲–۵.۴.
4. The earlier draft said server actions live in `presentation/actions.ts`. They cannot
   (`test/architecture.test.ts` forbids `presentation → server`); they live in
   `src/server/advising-actions.ts`.
5. `aip-next` findings that were factual about `aip-next` only (its `next-auth`,
   Keycloak proxy, `litellm` endpoints) are dropped; the equivalents below are an-front's
   Django/DRF + JWT pair.

## Stack deltas (why verbatim copies are not allowed)

| | `an-front` | mr-dan (pinned) | Consequence |
|---|---|---|---|
| next | `^16.3.0` | `16.4.6` | API drift possible; each pattern re-checked against `node_modules/next/dist/docs/` |
| react | `19.2.4` | `19.3.1` | hook signatures re-checked |
| antd | `^6.6.0` | `6.7.1` | kit props may differ |
| typescript | `^5` | `7.0.2` | their loose spots are rejected by our strict config |
| tailwind | `^4` | `4.3.5` | same major, same `dark:` variant syntax |
| lint/format | eslint 9 + prettier + `prettier-plugin-sort-imports` | oxlint | no config, script or plugin is ported |
| package manager | npm (`package-lock.json`) | pnpm | lockfile never copied |
| tests | **none installed** (`tsc` + eslint + build only) | vitest 5 + Playwright 1.65 | verification bar is ours, not theirs |
| backend | Django/DRF over HTTP, `NEXT_PUBLIC_HOST_URL/api` | Prisma 7 in-process | no HTTP layer, no `endpoints.ts`, no service handler |
| auth | JWT pair (`access_token`, `refresh_token`) + single-flight refresh queue | scrypt + Prisma `Session` + one opaque cookie | their refresh/middleware machinery is irrelevant |
| i18n | `next-intl@4` with `fa`/`en` | Persian only, RTL | no locale routing, no `messages/` |
| dates | `dayjs` + `jalali-plugin-dayjs` | none yet | first Jalali date is ۵.۲; dependency needs approval |
| charts | `echarts@6` + `@ant-design/plots` | deferred | ۵.۴ |
| client state | `react-constore` stores | local `useState` / server state in RSC | no store library |
| codegen | `plop` templates (`npm run cli`) | none | no generator |
| design system | vendored `src/papak/` (theme, kits, middleware chain) | own `src/components/` | never vendor a kit from an unlicensed repo |

## Licensing finding

**`an-front` ships no LICENSE** (and `~/project/yaftar/LICENSE` does not exist; the
earlier `aip-next` reference also shipped none).

Plain statement, kept verbatim because the phase-۵.۱ acceptance check greps for it:
aip-next ships no LICENSE and ~/project/yaftar/LICENSE does not exist.

Attribution is therefore undefined, so nothing is copied verbatim. ADOPT/ADAPT means
"take the idea and re-implement it in our own layout", never "paste the file". A verbatim
copy requires explicit human permission and an `Origin:` header; if an implementer thinks
one is needed, they stop and ask.

## Verdicts

Rule: an item is ADOPT only if the current sub-phase consumes it right now; everything
else is DEFER with its consuming phase, or REJECT with a one-line reason. ADOPT = take the
contract and re-implement it in our layout. ADAPT = take the idea and reshape it for our
stack.

| # | Item in `an-front` | Verdict | Decision |
|---|---|---|---|
| 1 | `.agents/skills/an-front-architecture` | ADAPT | its layer map + "success = `state.ok`" rule feed `mr-dan-architecture` append; the Django/JWT half is dropped |
| 2 | `.agents/skills/an-front-feature` | ADAPT | rewritten as the draft `mr-dan-feature-workflow` (schema → domain → use case → adapter → action → RSC → client form → tests) |
| 3 | `.agents/skills/an-front-debugging` | ADAPT | rewritten as the draft `mr-dan-frontend-debugging`; only failure modes are kept, mapped to our session cookie |
| 4 | `.agents/skills/an-front-responsive` | DEFER | whole rule set applies from ۵.۲ (schedule/roster are the first mobile-heavy screens); the baseline below is binding now |
| 5 | `.agents/skills/an-front-theming` (light/dark) | DEFER | ۵.۴ decision; dark mode is a product choice, not a porting task. Requires `--app-*` vars + server-read theme cookie if adopted |
| 6 | `.agents/skills/ui-access-control` | ADOPT | capability map + server guard + "hide, never disable" + the 6-identity verification matrix. ۵.۱ has the server guard; the capability module lands with ۵.۴'s counselor panel |
| 7 | `utils/app-error.ts` (`ActionState`, `OK()`, `FAIL()`) | ADOPT | already ours: `ActionResult` in `src/shared/action-result.ts`; `ok` is the only success signal |
| 8 | `utils/server-action.ts` (`runAction`) | ADOPT | already ours: `src/modules/advising/presentation/run-action.ts`; no revalidation argument at all |
| 9 | `utils/use-form-action.ts` (`useFormAction`, `useServerFormErrors`) | ADAPT | we keep native `<form>` + `useActionState`; take only the `fieldErrors` mapping rule and the success-message precedence. No AntD `FormInstance` hook, no automatic toast yet |
| 10 | page / `.vm` / `.view` triad | ADAPT | `page.tsx` = async server fetch; one `"use client"` component owns state + markup until the markup passes ~۸۰ خط, then it splits into `*.vm.tsx` + `*.view.tsx`. `page.tsx` never becomes a client component |
| 11 | module triad `<x>.types.ts` / `.service.ts` / `.actions.ts` | ADAPT | mapped onto domain models+ports (types), `application/*` (service), `src/server/*-actions.ts` (actions). Uses cases replace HTTP services |
| 12 | `constants/endpoints.ts` (one endpoint registry) | REJECT | no outbound HTTP client; RAG route paths are route-handler-local and the OpenAPI spec is `src/lib/openapi.ts` |
| 13 | `ssr-service-handler` + `queuedAuthFetch` + `RefreshQueue` | REJECT | in-process Prisma; nothing to queue, no bearer token, no 401 refresh |
| 14 | `lib/auth/cookies.ts` flag set | ADOPT | `httpOnly`, `sameSite=lax`, `path=/`, `secure` only in production — already what `presentation/cookie.ts` writes |
| 15 | `proxy.ts` middleware guard (`withRefreshToken` → `withAuthentication`) | REJECT | Next 16 proxy must not hit the DB and there is no refresh token; the guard lives in `(advising)/layout.tsx` + every action |
| 16 | `src/papak/` vendored design system | REJECT | unlicensed vendor dump with a middleware chain we do not need; our `src/components/` is the only source |
| 17 | `CustomModal` / `ModalFooter` (reset-on-open, shared `form` instance) | DEFER | ۵.۲ first real modal; then port only the "close on success, never navigate in submit handler" rule |
| 18 | `BottomSheet` + `MobileHeader` / `MobileSideBarMenu` / `MobileFooter` shell | DEFER | ۵.۴; until then no full app shell exists and `(advising)/layout.tsx` stays a one-line nav |
| 19 | `PageFilterForm` / `PageFilterInlineSearch` / URL-driven filters | DEFER | ۵.۴; ۵.۱ and ۵.۲ have no filterable list |
| 20 | `Pagination` kit (DRF page-number aware) | DEFER | ۵.۴; our lists are bounded |
| 21 | `ContentEditableTable`, `Stepper`, `ShowMoreText`, `QuickFilter`, `TrashButton`, `FilterDatePicker` | DEFER | ۵.۲–۵.۴, one item at a time, only when a screen needs it |
| 22 | `Charts` wrapper (echarts, theme-aware, resize cleanup) | DEFER | ۵.۴ (`echarts@6`); its theme/resize contract is reviewed then, dependency added then |
| 23 | `useKpiChart` | DEFER | ۵.۴, same reason |
| 24 | `dayjs` + `jalali-plugin-dayjs` | DEFER | ۵.۲ weekly schedule/deadline; new dependency needs human approval |
| 25 | `next-intl` | REJECT | single-language Persian/RTL product; no locale routing, no `messages/` |
| 26 | `axios` | REJECT | no client HTTP at all; a raw `fetch` in a component is also banned |
| 27 | `@tanstack/react-query` | REJECT | they ship it as legacy papak plumbing and document it as *not* the data path; we have no use for it |
| 28 | `react-constore` | REJECT | local state + RSC |
| 29 | `universal-cookie` | REJECT | our session cookie is `httpOnly`; the client must not read it |
| 30 | `jsonwebtoken` | REJECT | custom opaque session token, hashed in DB |
| 31 | `plop` generators | REJECT | pnpm + oxlint; no scaffold tool |
| 32 | `qs` | REJECT | `URLSearchParams` is stdlib |
| 33 | `clsx` | DEFER | adopt only if ad-hoc class merging grows past two template literals |
| 34 | `constants/test-ids.ts` + `data-testid` discipline | ADOPT | our Playwright specs currently use `input[name=…]`/text selectors; new interactive elements get a stable `data-testid`. Central file lands with ۵.۲'s first new spec |
| 35 | `convertToEnglishNumbers` | ADOPT | already ours: `src/shared/persian-digits.ts`; `username`/`email` only, never passwords |
| 36 | `useDebounce` / `useLogout` / `useDeviceDetection` + detect store | DEFER | search debounce ۵.۴; device detection is replaced by Tailwind breakpoints (no store, no effect, no SSR branch) |
| 37 | `useServerFormErrors` 422 → antd field errors | ADAPT | same idea, our shape: zod issues → `fieldErrors` → text under the input with `role="alert"` |
| 38 | `dashboard/error.tsx` route-segment boundary | DEFER | ۵.۲ adds the first page where a fetch can throw; then add `error.tsx` per segment |
| 39 | "no test runner; build+lint is the gate" | REJECT | we have vitest + Playwright and a phase gate that requires them |
| 40 | Hard rules: no `revalidatePath`, no `console.log`, no client fetch, success `= state.ok`, no native form POST | ADOPT | all four are already in the contract below and enforced by `test/architecture.test.ts` / AC greps |

Totals: **ADOPT 7 · ADAPT 7 · DEFER 13 · REJECT 13**.

Exactly one icon set: `@tabler/icons-react`. No AntD icon-package import is allowed
under `src/**`. (an-front pins `^3.44.0`; we pin exact `3.52.0`.)

## Action result contract (the only one in this repo)

```ts
export interface ActionError {
  code: string; // "invalid_input" | "unauthorized" | "forbidden" | "not_found"
                // | "username_taken" | "email_taken" | "internal_error"
  message: string; // Persian, safe to render
  fieldErrors?: Record<string, string>; // field name -> ONE Persian message
}
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ActionError };
```

- `useActionState(action, null)`: `null` is idle. **Success is `state?.ok === true`**,
  never `data !== null`, never `state.ok` on a `null` state.
- The `{ status: "idle" | "success" }` form-state shape does **not** exist here.
- `fieldErrors` maps a field to exactly one message (first zod issue per field).
- an-front's `ActionState` carries `error: AppError | null`; ours narrows on `ok`, so the
  success branch has no `error` key at all. Do not reintroduce a nullable `error`.

## zod → `fieldErrors` mapping rule

`toFieldErrors(issue)` groups zod issues by the first path segment and keeps the first
Persian message per field. A field with no issue is absent (not `undefined` in a rendered
form). Server actions parse `FormData` with zod; a `ZodError` becomes
`{ ok: false, error: { code: "invalid_input", message, fieldErrors } }`.

## Persian digit normalization

`toAsciiDigits(value)` maps `۰-۹` (U+06F0–U+06F9) and `٠-٩` (U+0660–U+0669) to `0-9`.
Applied only to `username` and `email`, inside the zod schema via `.transform(toAsciiDigits)`.
**Never** applied to passwords: Persian digits are legitimate password characters.

## Server action rules (Next 16)

1. **Never call `revalidatePath` inside a Server Action.** Next re-renders the page inside
   the action response, the Suspense boundary remounts, and `useActionState` resets to its
   initial value, so the success state never reaches the client (vercel/next.js#66426).
   an-front hit this exact bug and documents it in `docs/ARCHITECTURE.md` §12.1. Data is
   read fresh by the RSC on navigation.
2. `redirect()` is called **outside** any `try/catch`; otherwise `NEXT_REDIRECT` is
   swallowed.
3. Mutations are Server Actions. No new route handler is added for an in-app form.
4. Authorization is checked on the server from the session cookie; never trust a hidden
   `userId` field.
5. Actions live in `src/server/*-actions.ts` (`"use server"`), not in `presentation/` —
   the architecture test forbids `presentation → server`. `presentation/` keeps the pure
   pieces (`schemas`, `cookie`, `run-action`).

## Page composition (binding from ۵.۲)

```text
app/**/page.tsx            async server: guard + fetch via use case, pass serialized props
components/**/*-form.tsx   "use client": useActionState, fieldErrors, pending state
components/**/*-view.tsx   split out only when the client component passes ~۸۰ lines
```

- `page.tsx` never becomes `"use client"` and never imports Prisma or a repository.
- The client component never fetches: it receives data as props and returns an action.
- Success UX is driven by `state?.ok`; no `message.success` and no `router.push` inside a
  submit handler unless the server redirected.

## Responsive baseline (binding now)

- No horizontal page overflow at 360 px; tables scroll inside their own container.
- Stack with Tailwind breakpoints, not a JS device store: `grid-cols-1 lg:grid-cols-2`,
  `flex flex-col gap-4 lg:flex-row`.
- Tap targets ≥ 44 px, 200 % zoom safe, `focus-visible` never removed.
- Modals become bottom sheets below `lg` **only** once ۵.۴ introduces modals at all.

## Access control (binding from ۵.۲)

- Server-side guard is the security boundary; UI hiding is only UX.
- One capability map per module, no scattered `role === "counselor"` checks in components.
- Hide the control, never render a `disabled` button as a substitute for authorization.
- Row-level rule (counselor owns the group/student) is enforced in the use case, not only
  in the page.
- Verification matrix per guarded surface: unauthenticated → `/login`; authenticated
  without capability → `403`; owner → allowed; other counselor → `403`; admin (۵.۴) → allowed.

## Persian / RTL notes

- `ConfigProvider direction="rtl"` + `locale={faIR}` and `dir="rtl"` on `<html>` stay
  global; every new page inherits them (an-front reaches this through `next-intl`; we do
  not, so nothing may depend on a locale provider).
- Native `<form>` + AntD `Input`/`Button` for Server Action forms. AntD `Select` does not
  submit a native value, so plain `<select>` is used in these forms. antd v6
  `rc-field-form` calls `preventDefault()` on submit, so a native POST is never attempted.
- All user-facing labels, validation messages and error messages are Persian.
