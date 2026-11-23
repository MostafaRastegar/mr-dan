# frontend-layout-alignment

Skills loaded: `mro-project-stack` (placeholder — stack derived from the repo below),
`mr-dan-frontend`, `mr-dan-architecture` (read), `mr-dan-feature-workflow` (read),
`mro-data-model` **not** loaded (no query, mutation or schema change: the action bodies are
moved verbatim, their use cases and Prisma calls are untouched).
Reference read directly: `an-front/.agents/skills/an-front-architecture/SKILL.md`,
`an-front/src/utils/ARCHITECTURE.md`, `an-front/src/utils/{app-error,server-action,require-admin}.ts`,
`an-front/src/app/dashboard/tag/**`, `an-front/src/modules/tag/tag.actions.ts`.

Derived stack (from `package.json` / `tsconfig.json` / `AGENTS.md`, agrees with the profile):

```text
next 16.4.6 · react 19.3.1 · typescript 7.0.2 (strict) · antd 6.7.1 · tailwind 4.3.5
prisma 7.10.1 · zod 4 · oxlint · vitest 5.1.1 (28 files / 150 tests green today) · pnpm · @/* → ./src/*
```

Conflicts found: none. Where a reference pattern and `AGENTS.md` disagree, `AGENTS.md` wins
(two such divergences are recorded as D1 and D4 below).

## Goal

- Put every route's client half next to its page: `page.tsx` + `<x>.vm.tsx` + `<x>.view.tsx`
  inside `src/app/**`, private route components in `_components/`.
- Replace `src/server/advising-actions.ts` with three colocated `*.actions.ts` (`"use server"`)
  files that wrap the existing use cases unchanged.
- Move the three action choke points to `src/utils/{app-error,server-action,use-form-action}.ts`
  and make `test/architecture.test.ts` enforce the new layout non-vacuously.

## Non-goals

- The hexagonal backend (`src/modules/<domain>/{domain,application,infrastructure,presentation}`)
  does not move, does not get new files, and keeps its layer rules byte-identical. Option **B**
  (`types/service/actions` flattening) is explicitly rejected.
- No RAG behavior change: `src/modules/rag/**`, `src/shared/env.ts`, chunk/top_k/rerank/cache
  numbers and prompts are untouched.
- No new dependency, no Prisma schema/migration, no new env var, no new route handler, no guard
  moved into `proxy.ts`/middleware.
- No copy change: every Persian label, error message and `data-testid` stays byte-identical.
- No `CHANGELOG.md` write (only a draft line in "Documentation impact").
- `src/components/ui/**` and `src/components/providers.tsx` stay even though `ui/**` is
  currently unreferenced (see O1 — deleting it is a separate decision).

## Target tree

### Before

```text
src/
├─ app/
│  ├─ layout.tsx                       root layout → @/components/providers
│  ├─ page.tsx                         home, no client child
│  ├─ api-docs/page.tsx                → @/components/api-docs/api-docs-panel
│  ├─ chat/page.tsx                    → @/components/chat/chat-page.vm
│  ├─ admin/knowledge/page.tsx         → @/components/admin/knowledge-page.vm
│  ├─ (auth)/login/page.tsx            → @/components/auth/login-form          (not split)
│  ├─ (auth)/register/page.tsx         → @/components/auth/register-form.vm
│  └─ (advising)/
│     ├─ layout.tsx                    → @/server/advising-actions (logoutAction)
│     ├─ profile/page.tsx              → @/components/advising/profile-form.vm + getContainer()
│     └─ counselor/students/page.tsx   → @/components/advising/counselor-roster.vm + getContainer()
├─ components/
│  ├─ providers.tsx
│  ├─ ui/{empty-state,error-boundary,loading-skeleton}.tsx
│  ├─ admin/knowledge-page.{vm,view}.tsx
│  ├─ advising/{profile-form,counselor-roster,group-create-form,assign-student-form}.{vm,view}.tsx
│  ├─ api-docs/api-docs-panel.tsx
│  ├─ auth/{login-form.tsx, register-form.{vm,view}.tsx}
│  └─ chat/chat-page.{vm,view}.tsx
├─ lib/form/use-form-action.ts         ("use client")
├─ shared/action-result.ts             (ActionError, ActionResult)
├─ modules/advising/presentation/run-action.ts (+ run-action.test.ts)
└─ server/advising-actions.ts          (6 actions, "use server")
```

### After

```text
src/
├─ app/
│  ├─ layout.tsx                       unchanged (→ @/components/providers)
│  ├─ page.tsx                         unchanged (home, 29 lines, no client child)
│  ├─ api-docs/
│  │  ├─ page.tsx                      7 lines: guard + <ApiDocsPanelWrapper/>
│  │  ├─ api-docs-panel.vm.tsx         NEW (split of api-docs-panel.tsx)   ApiDocsPanelWrapper
│  │  └─ api-docs-panel.view.tsx       NEW                                 ApiDocsPanelView
│  ├─ chat/
│  │  ├─ page.tsx                      7 lines
│  │  ├─ chat-page.vm.tsx              moved                               ChatPageWrapper
│  │  └─ chat-page.view.tsx            moved                               ChatPageView
│  ├─ admin/knowledge/
│  │  ├─ page.tsx                      7 lines
│  │  ├─ knowledge-page.vm.tsx         moved                               KnowledgePageWrapper
│  │  └─ knowledge-page.view.tsx       moved                               KnowledgePageView
│  ├─ (auth)/
│  │  ├─ auth.actions.ts               NEW: registerAction, loginAction    "use server"
│  │  ├─ login/
│  │  │  ├─ page.tsx                   ~12 lines
│  │  │  ├─ login-form.vm.tsx          NEW (split of login-form.tsx)       LoginFormWrapper
│  │  │  └─ login-form.view.tsx        NEW                                 LoginFormView
│  │  └─ register/
│  │     ├─ page.tsx                   ~12 lines
│  │     ├─ register-form.vm.tsx       moved                               RegisterFormWrapper
│  │     └─ register-form.view.tsx     moved                               RegisterFormView
│  └─ (advising)/
│     ├─ layout.tsx                    → ./advising.actions (logoutAction), still 59 lines
│     ├─ advising.actions.ts           NEW: logoutAction, updateProfileAction  "use server"
│     ├─ profile/
│     │  ├─ page.tsx                   ~14 lines
│     │  ├─ profile-form.vm.tsx        moved                               ProfileFormWrapper
│     │  └─ profile-form.view.tsx      moved + absorbs the page body shell
│     └─ counselor/students/
│        ├─ page.tsx                   ~14 lines
│        ├─ students.actions.ts        NEW: createGroupAction, assignStudentAction  "use server"
│        ├─ counselor-roster.vm.tsx    moved + absorbs the h1 shell        CounselorRosterWrapper
│        ├─ counselor-roster.view.tsx  moved                               CounselorRosterView
│        └─ _components/
│           ├─ assign-student-form.vm.tsx    moved    AssignStudentFormWrapper
│           ├─ assign-student-form.view.tsx  moved    AssignStudentFormView
│           ├─ group-create-form.vm.tsx      moved    GroupCreateFormWrapper
│           └─ group-create-form.view.tsx    moved    GroupCreateFormView
├─ components/
│  ├─ providers.tsx                    unchanged
│  └─ ui/{empty-state,error-boundary,loading-skeleton}.tsx   unchanged
├─ utils/                              NEW directory
│  ├─ app-error.ts                     moved from shared/action-result.ts    ActionError, ActionState
│  ├─ server-action.ts                 moved from presentation/run-action.ts runAction
│  ├─ server-action.test.ts            moved from presentation/run-action.test.ts
│  └─ use-form-action.ts               moved from lib/form/use-form-action.ts ("use client")
├─ lib/{api.ts,openapi.ts}             unchanged; lib/form/ is gone
├─ modules/**                          unchanged except: presentation/run-action.{ts,test.ts} deleted
└─ server/{container.ts,advising-guards.ts}   unchanged; advising-actions.ts deleted
```

Disappears entirely: `src/components/{admin,advising,api-docs,auth,chat}/`, `src/lib/form/`,
`src/shared/action-result.ts`, `src/modules/advising/presentation/run-action.{ts,test.ts}`,
`src/server/advising-actions.ts`.

New docs: `docs/contracts/frontend-layout-alignment.md`.

## Design decisions and trade-offs

- **D1 — choke-point names adopt the reference; the *shape* does not.**
  `src/utils/app-error.ts` exports `ActionError` + `ActionState<T>` where `ActionState<T>` is the
  existing discriminated union `{ok:true,data} | {ok:false,error}`. The reference's flat
  `{ok:boolean, data:T|null, error:AppError|null}` is rejected: `docs/plan/frontend-conventions.md`
  (lines 144-145) and the `mr-dan-frontend` skill ban reintroducing a nullable `error`, and a
  nullable shape forces a cast before `state.error.fieldErrors` in every view. `ActionResult` is
  renamed (not aliased) to `ActionState` because one concept must have one name and the
  hook-facing variable is already called `state`; the rename is mechanical and `pnpm typecheck`
  proves it. `AppError` (the class) stays in `src/shared/errors.ts` — the action contract must not
  drag the domain error kernel into `domain/`, so the file name is reference-parity only.
- **D2 — reference `runAction(fn, ..._revalidate)` is rejected.** No revalidate parameter, not
  even an inert one: this repo bans `revalidatePath` in actions (vercel/next.js#66426) and an
  ignored parameter is a footgun waiting to be "fixed". `runAction(fn)` stays.
- **D3 — `runAction` must NOT carry `"use server"`.** The reference's file does; here `runAction`
  is a helper *called from inside* an action and takes a callback, which a `'use server'` export
  may not. It stays directive-free; only the `*.actions.ts` files carry `"use server"`.
- **D4 — `src/utils/server-action.ts` imports advising-presentation mappings**
  (`toActionError` / `toFieldErrors`). The alternative — moving the domain-error → Persian catalog
  into `utils` — violates `mr-dan-frontend` ("mapping happens only in
  `modules/<name>/presentation/messages.ts`"). A per-module wrapper factory would be ceremony for
  one module. Accepted coupling, no cycle (`utils → presentation → utils/app-error`), and `utils`
  has no layer rule in the architecture test. Revisit only when a second module gets actions.
- **D5 — export names: `<Thing>Wrapper` / `<Thing>View` (reference names), `<Thing>` = the existing
  component base.** So `profile-form.vm.tsx` exports `ProfileFormWrapper` and
  `profile-form.view.tsx` exports `ProfileFormView`. Rejected: renaming the base to the route name
  (`ProfileView`/`StudentsView`) — `ProfileView` is already a domain type in
  `modules/advising/domain/models.ts`, and `<folder>.view.tsx` would then collide with it and hide
  which component lives inside. All vm/view exports become **named** (today `ChatPage`,
  `KnowledgePage` are named while the rest are default; one form removes the ambiguity). Props and
  prop types are unchanged from `docs/contracts/architecture-alignment.md` — the only prop added
  is `profile` on `ProfileFormView` (it now draws the page header).
- **D6 — the page body lives in the view; `page.tsx` = guard + data + one wrapper.** Uniform for
  all 7 routes. Forced by fact: `(advising)/profile/page.tsx` is 45 lines today (over the 40-line
  route cap) with 30 lines of static JSX. Uniform beats "sometimes the shell stays": one rule, one
  assertion. Trade-off: the static headings/links for profile, students, login and register are now
  rendered by a client component (a few hundred bytes of JS, no behavior change).
- **D7 — login and api-docs are split, not deferred.** Both are 77/79 lines, i.e. under the 80-line
  trigger, so splitting them is *not* required by the line rule. They are split anyway because the
  rule this change installs is "every page folder that renders a client component holds a
  vm/view pair"; an exception would need a permanent written justification and would leave the
  page importing across folders (`_components/`) for its primary client entry. Both splits are
  mechanical (hooks vs. JSX) and behavior-free.
- **D8 — `_components/` exists only under `counselor/students/`** for the two sub-forms that the
  roster view renders (`assign-student-form`, `group-create-form`). A page's primary client entry
  always sits in the page folder, never in `_components/`.
- **D9 — actions are three area files, not six page files.** One actions file per route area, so a
  second page in the same area reuses it instead of duplicating; `logoutAction` has no page of its
  own (the `(advising)` layout calls it), which is exactly why a per-page split fails.
- **D10 — pages keep `getContainer()`** (sanctioned by `AGENTS.md`'s `app → server/container` arrow
  and by the previous plan's D1). No query shim is introduced.

## Step-by-step migration

Each step must end green (`pnpm typecheck && pnpm lint && pnpm test`). Steps 1-3 are pure moves.

1. **`src/utils/app-error.ts`.**
   `git mv src/shared/action-result.ts src/utils/app-error.ts`; inside, rename the type
   `ActionResult` → `ActionState`, keep `ActionError`, keep the doc comment and add one line:
   "Type-only module: import with `import type` so no runtime reaches the client."
   Update the 11 importers (exact list in "Import-graph impact").
2. **`src/utils/server-action.ts` (+ test).**
   `git mv src/modules/advising/presentation/run-action.ts src/utils/server-action.ts`;
   change its imports to `./app-error`, `@/modules/advising/presentation/messages`,
   `@/modules/advising/presentation/schemas`.
   `git mv src/modules/advising/presentation/run-action.test.ts src/utils/server-action.test.ts`;
   inside, `./run-action` → `./server-action` and `./schemas` → `@/modules/advising/presentation/schemas`.
   Update the importer `src/server/advising-actions.ts`. **No `"use server"` directive in this file.**
3. **`src/utils/use-form-action.ts`.**
   `git mv src/lib/form/use-form-action.ts src/utils/use-form-action.ts`; inside,
   `@/shared/action-result` → `./app-error` (type import) and rename `ActionResult` → `ActionState`.
   Update the 7 importers. `src/lib/form/` is now empty and disappears.
4. **Split the actions.**
   - Create `src/app/(auth)/auth.actions.ts` with `registerAction`, `loginAction` (verbatim bodies
     from `src/server/advising-actions.ts`, `runAction` from `@/utils/server-action`).
   - Create `src/app/(advising)/advising.actions.ts` with `logoutAction`, `updateProfileAction`.
   - Create `src/app/(advising)/counselor/students/students.actions.ts` with `createGroupAction`,
     `assignStudentAction`.
   - Delete `src/server/advising-actions.ts`; update `src/app/(advising)/layout.tsx`
     (`@/server/advising-actions` → `./advising.actions`) and the three action imports in the vms
     (`@/server/advising-actions` → `../advising.actions` / `../auth.actions` /
     `../students.actions`). `formValues()` is duplicated only where it is used
     (`auth.actions.ts`, `advising.actions.ts`, `students.actions.ts` — a local 3-line helper, not a
     shared module: `'use server'` files must export async functions only).
5. **Profile page.** `git mv` both files to `src/app/(advising)/profile/`; rename exports to
   `ProfileFormWrapper` / `ProfileFormView`; move the page's JSX body (header, `dl`, card) into the
   view and add `profile` to its props; `page.tsx` keeps guard + `getProfile` + `redirect("/login")`
   + `<ProfileFormWrapper profile={profile} />` (~14 lines). Fix specifiers:
   `./profile-form.view` (unchanged), `@/utils/use-form-action`, `@/utils/app-error`, `../advising.actions`.
   **Same step:** in `test/architecture.test.ts`, widen the 80-line client-component assertion from
   `file.path.startsWith("components/")` to `(components/ | app/)` — from this step on the moved
   pair lives outside the old scope and the guarantee would silently go vacuous.
6. **Counselor students.** `git mv` the roster pair into `counselor/students/` and the two form
   pairs into `counselor/students/_components/`; rename the 6 exports; roster view imports
   `../_components/...` and renders `<AssignStudentFormWrapper/>` / `<GroupCreateFormWrapper/>`;
   move the page's `<h1>` into the roster view; `page.tsx` keeps `requireCapability("group:manage")`
   + `counselorRoster.execute` + `<CounselorRosterWrapper groups students />` (~14 lines).
7. **Register page.** `git mv` the pair into `src/app/(auth)/register/`; rename exports; move the
   page's `<main>` + `<h1>` + back link into `register-form.view.tsx`; page keeps
   `getSessionContext()` + redirect (~12 lines). Specifiers → `@/utils/*`, `../auth.actions`.
8. **Login page (split).** `git mv src/components/auth/login-form.tsx` →
   `src/app/(auth)/login/login-form.vm.tsx`; keep only `Form.useForm` + `useFormAction` +
   `useServerFormErrors` and render `LoginFormView`; create `login-form.view.tsx` holding today's
   `<Form>` markup **plus** the page's `<main>`/`<h1>`/back link; page keeps the session redirect
   (~12 lines). Every `data-testid` (`TEST_IDS.AUTH.LOGIN_FORM`, `TEST_IDS.FORM.INPUT("username"|"password")`,
   `TEST_IDS.FORM.SUBMIT("login")`, `TEST_IDS.AUTH.REGISTER_LINK`) and both `dir="ltr"` stay identical.
9. **Chat page.** `git mv` the pair into `src/app/chat/`; rename `ChatPage` → `ChatPageWrapper`;
   page already delegates (`requireSessionUser()` + wrapper).
10. **Knowledge page.** `git mv` the pair into `src/app/admin/knowledge/`; rename `KnowledgePage` →
    `KnowledgePageWrapper`; page unchanged apart from the specifier and the export name.
11. **API docs (split).** `git mv src/components/api-docs/api-docs-panel.tsx` →
    `src/app/api-docs/api-docs-panel.vm.tsx` (refs, `error` state, the Swagger `useEffect`);
    create `api-docs-panel.view.tsx` with the two return branches (error `Card`, Swagger container)
    taking `{ containerRef, error }`; rename exports; page keeps `requireCapability("rag:manage")`.
    **Same step:** add the two new architecture assertions (page triad + pages ≤40 lines) — the
    seventh and last page now qualifies, so the non-vacuity floor is truthful from the moment it
    exists.
12. **Docs.** `docs/contracts/frontend-layout-alignment.md`, `README.md`,
    `docs/plan/architecture.md`, `docs/plan/frontend-conventions.md`,
    `docs/behaviors/phase-5-1-identity-profile.md` (see "Documentation impact").
13. **Human-manual (blocking):** `.opencode/skills/{mr-dan-architecture,mr-dan-frontend,mr-dan-feature-workflow}/SKILL.md`
    and `AGENTS.md` (see "Skill updates" and "AGENTS.md update"). If the Implementer's `edit` is
    rejected on those paths, the human applies the listed text verbatim; the work is not done until
    `grep` finds the new paths in all four files.

## Import-graph impact (verified by grep, not guessed)

| Specifier | Importers (count) | New specifier |
|---|---|---|
| `@/shared/action-result` (12) | `modules/advising/presentation/{messages,run-action}.ts`, `lib/form/use-form-action.ts`, `server/advising-actions.ts`, `components/advising/{profile-form,assign-student-form,group-create-form}.{vm,view}.tsx` (5), `components/auth/register-form.{vm,view}.tsx` (2) | `@/utils/app-error` (from `utils/*`: `./app-error`) |
| `@/modules/advising/presentation/run-action` (2) | `server/advising-actions.ts`, `modules/advising/presentation/run-action.test.ts` | `@/utils/server-action` (test: `./server-action`) |
| `@/lib/form/use-form-action` (7) | `components/advising/{profile-form.vm,profile-form.view,group-create-form.vm,assign-student-form.vm}.tsx`, `components/auth/{register-form.vm,register-form.view}.tsx`, `components/auth/login-form.tsx` | `@/utils/use-form-action` |
| `@/server/advising-actions` (7) | `app/(advising)/layout.tsx`, `components/advising/{profile-form.vm,group-create-form.vm,assign-student-form.vm}.tsx`, `components/auth/{register-form.vm,login-form}.tsx` | `app/(advising)/advising.actions.ts` (`./` from layout, `../` from pages) · `app/(auth)/auth.actions.ts` (`../` from login/register) · `students/students.actions.ts` (`../` from `_components/`) |
| `@/components/{admin/knowledge-page.vm, chat/chat-page.vm, advising/counselor-roster.vm, advising/profile-form.vm, auth/register-form.vm, auth/login-form, api-docs/api-docs-panel}` (7 pages) | see "Current structure" in the brief | relative sibling: `./knowledge-page.vm`, `./chat-page.vm`, `./counselor-roster.vm`, `./profile-form.vm`, `./register-form.vm`, `./login-form.vm`, `./api-docs-panel.vm` |
| relative vm↔view imports (10) | each pair imports its twin (`./x.view` from the vm, `./x.vm` from the view for types) | unchanged inside the moved folder; `counselor-roster.view.tsx` gains `./_components/` |
| `@/components/{providers,ui/*}` | `app/layout.tsx` only (`providers`); `ui/*` has **no** importer today | unchanged |

Nothing outside `src/app/**`, `src/components/**`, `src/lib/form/`, `src/shared/action-result.ts`,
`src/modules/advising/presentation/run-action*.ts`, `src/server/advising-actions.ts` and
`test/architecture.test.ts` is touched.

## Actions split design

| New file | Exports | Dependencies | `runAction` body |
|---|---|---|---|
| `src/app/(auth)/auth.actions.ts` | `registerAction`, `loginAction` | `registerSchema`/`loginSchema`, `writeSessionCookie`, `sessionExpiry`, `getContainer` | `parse → use case → writeSessionCookie`; `redirect("/profile")` **outside** `runAction` |
| `src/app/(advising)/advising.actions.ts` | `logoutAction`, `updateProfileAction` | `readSessionToken`, `clearSessionCookie`, `getSessionContext`, `getContainer`, `updateProfileSchema` | `logoutAction` is `void` (native `<form action>` in the layout), no `runAction`; `updateProfileAction` wraps `runAction` and `redirect("/login")` when the session is gone |
| `src/app/(advising)/counselor/students/students.actions.ts` | `createGroupAction`, `assignStudentAction` | `createGroupSchema`/`assignStudentSchema`, `getSessionContext`, `getContainer` | guard → `runAction(parse → use case)` |

- Signature is unchanged: `(previous: ActionState<T> | null, formData: FormData) => Promise<ActionState<T>>`.
- `'use server'` boundary: each file exports **only** async functions (Next rejects anything else).
  Because the file is `'use server'`, the client vm imports a *reference*, so `getContainer`, Prisma
  and `next/headers` never enter a client bundle. `formValues()` stays a non-exported local helper.
- Guards stay server-side in the action (`getSessionContext`) and in the page
  (`requireSessionUser`/`requireCapability`) — nothing moves to `proxy.ts`.
- Nothing is shared between the three files except `runAction` and `ActionState`; no `index.ts`,
  no barrel, no action registry.

## Architecture test changes (`test/architecture.test.ts`)

Existing assertions kept verbatim: `finds source files`, `domain depends on nothing external`,
`respects layer direction`, `keeps route handlers thin` (≤40, `app/api/**`),
`test doubles live under test/fakes/`, `every data route is session- or admin-gated` (9 + 6 lists
untouched, both still counted exactly).

1. **Edited — "splits client components past 80 lines".** Scope widened:
   `(file.path.startsWith("components/") || file.path.startsWith("app/")) && file.path.endsWith(".tsx")`,
   everything else identical (`code.startsWith('"use client"')`, >80 lines, must be a `.vm.tsx`
   with an existing sibling `.view.tsx`, violation text unchanged so the negative probe is greppable).
   Rationale: after step 5 the client half of every route lives in `app/`, so a `components/`-only
   walk would make the assertion vacuous.
2. **Added — "keeps the page triad next to every page".**

   ```ts
   it("keeps the page triad next to every page", () => {
     const pages = files.filter((f) => /^app\/(.+\/)?page\.tsx$/.test(f.path));
     const withLocalUi = pages.filter((p) =>
       p.imports.some((i) => i.startsWith("./") || i.startsWith("../")),
     );
     // non-vacuous positive: every route page that renders a client component is counted
     expect(withLocalUi).toHaveLength(7);
     const violations = withLocalUi.flatMap((page) => {
       const dir = page.path.slice(0, page.path.lastIndexOf("/"));
       const siblings = files.filter(
         (f) => f.path.startsWith(`${dir}/`) && f.path.split("/").length === page.path.split("/").length,
       );
       const vms = siblings.filter((f) => f.path.endsWith(".vm.tsx"));
       const out: string[] = [];
       if (vms.length === 0) out.push(`${page.path} has no sibling .vm.tsx`);
       for (const vm of vms) {
         const base = vm.path.replace(/\.vm\.tsx$/, "");
         if (!files.some((f) => f.path === `${base}.view.tsx`)) out.push(`${vm.path} lacks sibling .view.tsx`);
         const spec = `./${vm.path.slice(vm.path.lastIndexOf("/") + 1).replace(/\.tsx$/, "")}`;
         if (!page.imports.includes(spec)) out.push(`${page.path} does not import ${spec}`);
       }
       return out;
     });
     expect(violations).toEqual([]);
   });
   ```

   The depth filter (`f.path.split("/").length === page.path.split("/").length`) is what excludes
   `counselor/students/_components/**` from the sibling set without naming it.
3. **Added — "keeps pages under 40 lines".**

   ```ts
   it("keeps pages under 40 lines", () => {
     const pages = files.filter((f) => /(^|\/)page\.tsx$/.test(f.path));
     expect(pages.length).toBeGreaterThanOrEqual(8); // 7 routes + the home page
     const fat = pages
       .map((p) => ({ path: p.path, lines: readFileSync(join(SRC, p.path), "utf8").split("\n").length }))
       .filter(({ lines }) => lines > 40);
     expect(fat).toEqual([]);
   });
   ```

   Layouts are deliberately out of scope (`(advising)/layout.tsx` is 59 lines and is not a page).
4. No change to `layerOf` is required: `utils/` falls through to `"other"`, which is in no
   `FORBIDDEN` list. `presentation → utils/app-error` therefore stays legal, and
   `utils/server-action → presentation/{messages,schemas}` is legal because `utils` has no rule
   (D4 — if someone later adds `utils` to `FORBIDDEN`, D4 must be revisited).

Non-vacuity: assertion 2 has an exact positive count of 7 pages *and* per-page checks;
assertion 3 has an exact floor of 8 pages; assertion 1's scope now matches where the files actually
live. The negative probe in AC-9 proves assertion 1 still bites.

## Contract

Written to `docs/contracts/frontend-layout-alignment.md`; summary:

- **Interface signatures**
  - `export interface ActionError { code: string; message: string; fieldErrors?: Record<string,string> }`
  - `export type ActionState<T> = { ok: true; data: T } | { ok: false; error: ActionError }` (type-only module)
  - `export async function runAction<T>(fn: () => Promise<T>): Promise<ActionState<T>>`
  - `export function useFormAction<T>(action: ServerFormAction<T>): { state; submit; pending }`,
    `export function useServerFormErrors<T>(state, form): string | null`
  - `registerAction`, `loginAction`, `updateProfileAction`, `createGroupAction`,
    `assignStudentAction`: `(previous: ActionState<T> | null, formData: FormData) => Promise<ActionState<T>>`;
    `logoutAction(formData: FormData): Promise<void>`.
- **Invariant (one enforceable sentence):** no file under `src/app/**` marked `"use client"` may
  import `@/server/container`, a Prisma client or a use case; every mutation enters through a
  `"use server"` module under `src/app/**` whose body is wrapped in `runAction`.
- **Edge cases**
  - `state === null` (initial) → no banner. — verify: `pnpm test` (existing form tests) + manual.
  - Unknown thrown error → `{ok:false, error:{code:"internal_error"}}`, no internals. — verify:
    `pnpm vitest run src/utils/server-action.test.ts -t "unknown thrown"`
  - zod failure → `fieldErrors` keyed by field. — verify: `pnpm vitest run src/utils/server-action.test.ts -t "zod failure"`
  - `redirect()` must stay outside `runAction` (NEXT_REDIRECT). — verify: manual: inspect
    `src/app/(auth)/auth.actions.ts`, `redirect(` appears after the `runAction(...)` call, never inside.
  - Concurrent double submit → `pending` comes from `useActionState`; unchanged. — verify: manual: submit
    `/register` twice quickly, the button stays in `loading` until the first response lands.
  - `app-error.ts` ships no runtime code. — verify: `! grep -qE '^export (const|function|class)' src/utils/app-error.ts`
  - `src/utils/server-action.ts` carries no `"use server"`. — verify: `! grep -q "use server" src/utils/server-action.ts`
- `review_level: reviewed` — ~25 file moves plus 2 new assertions; no auth/payment/migration/infra
  logic change (guards are moved-only), but the import graph and the `'use server'` boundaries are
  risky enough that a human must read the action split and one page triad rather than trust the suite.

## Skill updates (permission-locked → human-manual if `edit` is rejected)

All text is English, matching the existing tone. Exact sections to replace:

### `.opencode/skills/mr-dan-architecture/SKILL.md`

1. Replace the whole `## The three choke points` table with:

```md
## The three choke points

| Choke point | Our file | Rule |
|---|---|---|
| Action result | `src/utils/app-error.ts` — `ActionError` + `ActionState<T>` (`{ok:true,data} \| {ok:false,error}`) | Success is `ok` only; never `data !== null`. Type-only module: import with `import type`, nothing ships to the client |
| Action execution | `src/utils/server-action.ts` — `runAction(fn)` | The only way to write an action; no revalidate parameter, and this file carries no `'use server'` (it is imported *by* a `'use server'` module) |
| Form bridge | `src/utils/use-form-action.ts` — `useFormAction` + `useServerFormErrors` | antd `Form onFinish` → `FormData` → `useActionState`; maps `fieldErrors` via `form.setFields` |
```

2. Replace the `## Module triad` Server Action row with
   `| Server Action (`'use server'`) | `src/app/**/<area>.actions.ts`, colocated with the area; wraps the use case through `runAction` |`.

3. Replace the whole `## Page triad` section with:

```md
## Page triad

Every route folder that renders an interactive client component holds these files side by side
under `src/app/**`:

- `page.tsx` — async server component: guard + data from a use case + props. Never `"use client"`,
  ≤40 lines.
- `<x>.vm.tsx` — `'use client'`: hooks only (`Form.useForm`, `useFormAction`,
  `useServerFormErrors`, `useState`/`useEffect`). Exports `<Thing>Wrapper`.
- `<x>.view.tsx` — markup only, props in, no hooks, no fetching. Exports `<Thing>View`.
- `_components/` — components private to the route (sub-forms, modals), each keeping its own
  `.vm.tsx`/`.view.tsx` pair.
- `<area>.actions.ts` — `'use server'` mutations for the area.

The page body markup lives in the view; `page.tsx` stays guard + data + one wrapper. Success is
driven by `state?.ok`; never `router.push` inside a submit handler.

## Actions

- `src/app/(auth)/auth.actions.ts` — `registerAction`, `loginAction`.
- `src/app/(advising)/advising.actions.ts` — `logoutAction`, `updateProfileAction`.
- `src/app/(advising)/counselor/students/students.actions.ts` — `createGroupAction`, `assignStudentAction`.
- Signature `(previous: ActionState<T> | null, formData: FormData) => Promise<ActionState<T>>`,
  body `runAction(async () => …)`. `redirect()` outside `runAction`. A `'use server'` module exports
  async functions only.
```

4. Update the `## Where each piece lives` rows to: `src/app/**/<area>.actions.ts`;
   `src/utils/server-action.ts` + `src/modules/<name>/presentation/messages.ts`;
   `src/utils/app-error.ts`; `src/utils/use-form-action.ts`;
   `src/app/**/_components/` for route-private components; `src/components/` = providers + shared
   `ui/` kit only.
5. Append to the `## Layer map` table:

```md
| `app/**/page.tsx`, `app/**/*.vm.tsx`, `app/**/*.view.tsx`, `app/**/_components/**` | RSC shell, client state, route-private kit | presentation, server/container, utils, domain models |
| `app/**/*.actions.ts` | Server Actions | application (via server/container), presentation/schemas, utils |
| `utils` | the three choke points | react/antd types, presentation error mapping |
```

6. In `## Flow`, `→ Server Action ('use server', src/server/<name>-actions.ts)` becomes
   `→ Server Action ('use server', src/app/**/<area>.actions.ts)`.

### `.opencode/skills/mr-dan-frontend/SKILL.md`

1. Replace the two `## RSC / client split` bullets that mention the 80-line split with:

```md
- The client half of a route lives next to its page: `<x>.vm.tsx` (state, exports `<Thing>Wrapper`)
  + `<x>.view.tsx` (markup, exports `<Thing>View`). Components private to the route go in
  `<route>/_components/`.
- Any `"use client"` file over 80 lines must be a `.vm.tsx` with a sibling `.view.tsx`, and the
  view owns no hooks. `test/architecture.test.ts` enforces this for `src/app/**` and `src/components/**`.
```

2. In `## Forms: antd Form + Server Action`, `src/lib/form/use-form-action.ts` →
   `src/utils/use-form-action.ts`.
3. Replace the whole `## Component layout` tree with:

```text
src/app/**/<route>/
├─ page.tsx              async server: guard + data + props (≤40 lines)
├─ <x>.vm.tsx            "use client": hooks only, exports <Thing>Wrapper
├─ <x>.view.tsx          markup only, exports <Thing>View
├─ <area>.actions.ts     'use server': mutations for this area
└─ _components/          route-private forms/modals, each a vm/view pair
src/components/
├─ providers.tsx         global ConfigProvider (root layout only)
└─ ui/                   small AntD wrappers, never a fork
src/utils/
├─ app-error.ts          ActionError + ActionState (type-only)
├─ server-action.ts      runAction
└─ use-form-action.ts    useFormAction + useServerFormErrors
```

### `.opencode/skills/mr-dan-feature-workflow/SKILL.md`

1. Replace order-of-work step 5 with:

```md
5. **Server Action** — `src/app/**/<area>.actions.ts` with `"use server"` next to the pages that
   call it (`(auth)/auth.actions.ts`, `(advising)/advising.actions.ts`,
   `counselor/students/students.actions.ts`); body `runAction(...)` from `@/utils/server-action`;
   signature `(previous, formData)`; result is `ActionState` only. The module exports async
   functions only.
```

2. Replace step 6 with:

```md
6. **RSC page** — `app/**/page.tsx` async server: guard (`requireSessionUser`/`requireCapability`)
   + data from a use case + serialized props. Never `"use client"`, ≤40 lines. Next to it create
   `<x>.vm.tsx` (hooks, exports `<Thing>Wrapper`) + `<x>.view.tsx` (markup, exports `<Thing>View`);
   route-private components go in `_components/`.
```

3. Replace step 7 with:

```md
7. **Client form** — `<x>.vm.tsx` (`"use client"`): antd `Form.useForm()` + `useFormAction(action)`
   + `useServerFormErrors(state, form)` from `@/utils/use-form-action`; renders `<Thing>View`.
   `<x>.view.tsx`: the `<Form>` markup, submit via `onFinish={submit}` and `htmlType="submit"`,
   `data-testid` from `src/constants/test-ids.ts`. Details: the `mr-dan-frontend` skill.
```

4. In `## Action result contract`, rename `ActionResult` → `ActionState` and add
   "lives in `src/utils/app-error.ts`".

## AGENTS.md update (human-manual, blocking)

`AGENTS.md` is permission-locked. Insert these two bullets in `## معماری`, immediately after the
fenced dependency-arrow block and before the `route handler نازک` bullet:

```md
- فرانت: تریاد `page.tsx` + `<x>.vm.tsx` + `<x>.view.tsx` کنار هم داخل `src/app/**`؛ کامپوننت‌های خصوصی روت در `_components/`؛ Server Action هر ناحیه در `src/app/**/<area>.actions.ts` با `'use server'`.
- چوک‌پوینت‌های action: `src/utils/app-error.ts`، `src/utils/server-action.ts`، `src/utils/use-form-action.ts` — تنها مسیر mutation و تنها پل فرم.
```

Why blocking: today `AGENTS.md` survives the refactor without contradicting it (it never names
`src/components` or the actions path), but the Definition of Done requires the skill to agree with
the code, and the skill now points at `AGENTS.md` as the source of truth. Leaving the layout
undocumented makes the two documents disagree in emphasis and lets the next implementer rebuild
`src/server/*-actions.ts`. If the human rejects any part of this, the plan is not done: escalate
rather than dropping the step silently.

## Documentation impact

- **`README.md`**
  - replace the last line of `## وضعیت`
    ("Client components در بیش از ۸۰ خط به vm/view تقسیم‌شده و test fakes در `test/fakes/` هستند.")
    with: «هر روت فرانت‌اند تریاد `page.tsx` + `<x>.vm.tsx` + `<x>.view.tsx` را کنار هم در `src/app/**` دارد؛ کامپوننت‌های خصوصی روت در `_components/` و Server Actionها در `src/app/**/*.actions.ts` هستند؛ چوک‌پوینت‌های action در `src/utils/` قرار دارند. test fakes در `test/fakes/` هستند.»
  - add a `## ساختار کد` section after `## اجرا` with the 10-line `src/` tree from the target tree
    (RSC page, triad, `_components/`, `*.actions.ts`, `src/utils/`, `src/modules/`, `src/server/`)
    and one sentence: «لایه‌های دامنه در `src/modules/<domain>/{domain,application,infrastructure,presentation}` دست‌نخورده‌اند؛ این تغییر فقط لایهٔ فرانت است.»
  - no change to install/run/config/API sections: no command, env var, endpoint or dependency changed.
- **No new configuration key or environment variable.** `src/shared/env.ts` is untouched; nothing
  to document in the env section.
- **`docs/plan/architecture.md`**: §۱ tree — replace the `presentation/ # schemas, cookie, messages, run-action`
  line with `presentation/ # schemas, cookie, messages`; delete the `server/advising-actions.ts` line;
  add `utils/ (app-error, server-action, use-form-action)` and a `app/**/<route>/{page,x.vm,x.view,_components,<area>.actions}` line.
  §۲.۱-۲ the paragraph naming `src/server/advising-actions.ts` must state the new split and that
  guards stay in `src/server/advising-guards.ts`.
- **`docs/plan/frontend-conventions.md`**: append a `## Correction record (2026-11-23)` section (the
  file's own idiom) recording the three new paths, the page-triad location, the `ActionState` rename
  and that `ActionResult` is gone; update the two normative blocks (`## Action result contract` →
  `src/utils/app-error.ts` + `ActionState`; `## Page composition` → the `src/app/**` triad tree).
  Do **not** rewrite the 2026-11-22 verdict table (it is a dated record).
- **`docs/behaviors/phase-5-1-identity-profile.md`** (required, not optional): it lists every moved
  file in `source_files` and in three bullets (lines 63/68/72) — update all paths
  (`src/utils/{app-error,server-action,use-form-action}.ts`, `src/app/**/*.{vm,view}.tsx`,
  `src/app/**/*.actions.ts`) and set `last_verified` to the date the suite is actually re-run.
  This is the only behavior doc in `source_files` scope; `access-control-baseline.md` is unaffected
  (its files do not move).
- **No new `docs/behaviors/` file**: observable behavior is unchanged (same URLs, guards, messages,
  `data-testid`s), so a new behavior doc would describe nothing new. The layout itself is a
  structural contract, not a behavior, and it is recorded in `docs/contracts/frontend-layout-alignment.md`.
- **`docs/contracts/phase-5-1-identity-profile.md`** is a historical record and is **not** rewritten;
  its `run-action.test.ts` verify commands point at the pre-move path. Say so in the behavior doc so
  a reader does not treat it as a regression.
- **CHANGELOG draft (write only after final approval):**
  `- refactor(frontend): colocate page/vm/view triads under src/app, move the three action choke points to src/utils, split server actions per route area.`

## Test cases to write

1. `src/utils/server-action.test.ts` — moved verbatim (5 cases: ok/data, `ValidationError` →
   `invalid_input` Persian, unknown throw → `internal_error` with no leak, thrown string, zod →
   `fieldErrors`). Only the imports change.
2. `test/architecture.test.ts` — 1 edited + 2 new assertions described above.
3. No new unit tests for `app-error.ts` (type-only) or `use-form-action.ts` (unchanged body,
   no test today).
4. e2e specs are **not** edited: they select by `data-testid`, which is preserved. They must still
   pass when services are up (`E2E_ENABLED=true pnpm test:e2e`).

## Acceptance Criteria

- [ ] AC-1: When the refactor is complete, no vm/view, form or page client component remains under `src/components/`. — verify: `test "$(find src/components -type f | sort | tr '\n' ' ')" = "src/components/providers.tsx src/components/ui/empty-state.tsx src/components/ui/error-boundary.tsx src/components/ui/loading-skeleton.tsx "`
- [ ] AC-2: When the refactor is complete, `src/app/**` holds 9 `*.vm.tsx` files and every one has a sibling `*.view.tsx`. — verify: `test "$(find src/app -name '*.vm.tsx' | wc -l)" = 9 && for v in $(find src/app -name '*.vm.tsx'); do test -f "${v%.vm.tsx}.view.tsx" || exit 1; done`
- [ ] AC-3: When the refactor is complete, each of the 7 route pages imports its own sibling vm and no page imports from `@/components/`. — verify: `pnpm vitest run test/architecture.test.ts -t "page triad"`
- [ ] AC-4: When the refactor is complete, `src/utils/{app-error,server-action,use-form-action}.ts` exist and `src/shared/action-result.ts`, `src/lib/form/use-form-action.ts`, `src/modules/advising/presentation/run-action.ts` no longer exist. — verify: `test -f src/utils/app-error.ts -a -f src/utils/server-action.ts -a -f src/utils/use-form-action.ts -a ! -e src/shared/action-result.ts -a ! -e src/lib/form/use-form-action.ts -a ! -e src/modules/advising/presentation/run-action.ts`
- [ ] AC-5: When the refactor is complete, `src/utils/server-action.ts` has no `"use server"` directive and each of the three `*.actions.ts` files starts with `"use server"`. — verify: `! grep -q "use server" src/utils/server-action.ts && head -1 'src/app/(auth)/auth.actions.ts' | grep -q "use server" && head -1 'src/app/(advising)/advising.actions.ts' | grep -q "use server" && head -1 'src/app/(advising)/counselor/students/students.actions.ts' | grep -q "use server"`
- [ ] AC-6: When any `"use client"` file under `src/app/**` is inspected, it imports no `@/server/container`, no Prisma client and no use case. — verify: `! (grep -rl '^"use client"' src/app --include=*.tsx | xargs -r grep -l 'getContainer\|@/generated/prisma\|/application/')`
- [ ] AC-7: When `pnpm typecheck && pnpm lint && pnpm test && pnpm build` runs on the final tree, every command exits 0. — verify: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
- [ ] AC-8: When `pnpm test` runs, it reports at least 152 passing tests in 28 files (150 baseline + 2 new architecture assertions). — verify: `pnpm test 2>&1 | grep -qE 'Tests +1(5[2-9]|[6-9][0-9]) passed'`
- [ ] AC-9: When an 81-line `"use client"` file is temporarily placed in `src/app/chat/`, the architecture test fails naming that file, and after removing it the suite is green and the file is gone. — verify: `node -e 'require("fs").writeFileSync("src/app/chat/probe-bad.tsx","\"use client\";\n"+"// pad\n".repeat(80))' && (pnpm vitest run test/architecture.test.ts >/tmp/probe.log 2>&1; test $? -ne 0) && grep -q probe-bad /tmp/probe.log && rm src/app/chat/probe-bad.tsx && test ! -e src/app/chat/probe-bad.tsx && pnpm vitest run test/architecture.test.ts`
- [ ] AC-10: When every `page.tsx` under `src/app/**` is measured, none exceeds 40 lines. — verify: `pnpm vitest run test/architecture.test.ts -t "pages under 40 lines"`
- [ ] AC-11: When the architecture suite runs, the 9 session-gated and 6 admin-gated route lists still verify. — verify: `pnpm vitest run test/architecture.test.ts -t "gated"`
- [ ] AC-12: When the three skills are read, each names `src/app/**/<area>.actions.ts`, the `src/utils/` choke points and the `<Thing>Wrapper`/`<Thing>View` convention. — verify: `grep -q "src/app/\*\*/<area>.actions.ts" .opencode/skills/mr-dan-architecture/SKILL.md && grep -q "src/utils/server-action.ts" .opencode/skills/mr-dan-architecture/SKILL.md && grep -q "src/utils/use-form-action.ts" .opencode/skills/mr-dan-frontend/SKILL.md && grep -q "<Thing>Wrapper" .opencode/skills/mr-dan-frontend/SKILL.md && grep -q "src/app/\*\*/<area>.actions.ts" .opencode/skills/mr-dan-feature-workflow/SKILL.md`
- [ ] AC-13: When `AGENTS.md` is read, the `## معماری` section states the triad location and the three `src/utils/` choke points. — verify: `grep -q "src/app/\*\*/<area>.actions.ts" AGENTS.md && grep -q "src/utils/server-action.ts" AGENTS.md`
- [ ] AC-14: When `README.md` is read, `## وضعیت` and `## ساختار کد` describe the new layout. — verify: `grep -q "ساختار کد" README.md && grep -q "src/utils/" README.md`
- [ ] AC-15: When `docs/behaviors/phase-5-1-identity-profile.md` is read, `source_files` lists `src/utils/server-action.ts` and no stale `src/shared/action-result.ts` or `src/lib/form/use-form-action.ts`, and `docs/contracts/frontend-layout-alignment.md` exists with a `review_level:`. — verify: `grep -q "src/utils/server-action.ts" docs/behaviors/phase-5-1-identity-profile.md && ! grep -q "src/shared/action-result.ts" docs/behaviors/phase-5-1-identity-profile.md && ! grep -q "src/lib/form/use-form-action.ts" docs/behaviors/phase-5-1-identity-profile.md && grep -q "review_level: reviewed" docs/contracts/frontend-layout-alignment.md`
- [ ] AC-16: When the refactor is complete, no dependency, lockfile entry, Prisma migration, RAG source or env schema changed. — verify: `git diff --exit-code package.json pnpm-lock.yaml prisma/ src/modules/rag src/shared/env.ts`
- [ ] AC-17: When the refactor is complete, the e2e specs are untouched. — verify: `git diff --exit-code tests/e2e`
- [ ] AC-18: When the services are up, a validation failure on `/register` still lands the Persian message on the offending inputs. — verify: manual: `E2E_ENABLED=true pnpm test:e2e tests/e2e/advising-auth.spec.ts`, or open `/register`, submit `username=ab`, confirm the message under the username input.

## Open questions

- **O1:** The three files in `src/components/ui/` (`empty-state.tsx`, `error-boundary.tsx`,
  `loading-skeleton.tsx`) have no importer anywhere in `src/`, `test/` or `tests/`. This plan keeps
  them (out of scope for a layout alignment). Delete them in a separate micro-change, or keep them
  for phase ۵.۲?

## review_level

`reviewed` — ~25 files move and two new test assertions, but no auth/payment/migration/infra logic
change (the guards and use cases are moved-only); the risk lives in the import graph and the three
`'use server'` boundaries, so a human should read the actions split plus one complete triad rather
than trust a green suite.
