# architecture-alignment

Skills loaded: `mro-project-stack`, `mr-dan-architecture`, `mr-dan-frontend`, `mr-dan-feature-workflow`.
Conflicts found: none. Where `AGENTS.md` and a skill disagree, `AGENTS.md` wins (see Decision D1).

## Goal

Adopt the placement rules in `.opencode/skills/mr-dan-architecture/SKILL.md` where the code
actually deviates, and lock each move with an assertion in `test/architecture.test.ts`.
No behavior change: same routes, same Persian text, same `data-testid`, same server actions.

## Non-goals

- No new guards for `rag` / `admin` surfaces (would add auth = new behavior; see D3).
- No `presentation/messages.ts` / `run-action.ts` in the `rag` module (rag is HTTP-only; D4).
- No changes to `src/app/(advising)/*page.tsx` container usage (sanctioned by `AGENTS.md`; D1).
- No dependency, version, schema, migration, or route-handler change.
- No edits to `AGENTS.md` or `.opencode/skills/**` (locked; human-only).

## Design decisions

- **D1 — pages keep `getContainer()`: not a deviation.** `AGENTS.md` states the dependency
  direction as `app → server/container → infrastructure`, and the layer map in the skill allows
  `app` → `server/container`; `container.ts`'s own header comment tells pages to
  `call getContainer() and delegate to use cases`. Both pages only guard + delegate, stay ≤45
  lines, and hold no wiring. Introducing a `server/<name>-queries.ts` shim would add a file and
  an indirection with zero behavioral or architectural gain → **skipped**.
- **D2 — vm/view split for the four >80-line client components.** The skill's threshold is
  "~80 lines"; the split separates state from markup, it does not shrink markup (the `.view.tsx`
  files stay ~110-160 lines of JSX). That is the intent of the rule. All four are split so the
  new assertion needs no exception list — an allowlist is drift by another name.
- **D3 — guards stay scoped to `advising`.** `rag`/`admin` HTTP routes have no session and the
  admin page is unauthenticated today; adding a `requireCapability` gate to them is a behavior +
  security change, belongs to its own plan with `review_level: full`. The skill also bans dead
  abstractions. **Skipped here, raised as Open Question O1.**
- **D4 — `rag` has no `presentation/messages.ts`.** Accepted exception: the rag surface is
  HTTP-only (`app/api/**` + `fetch`), so there is no `ActionResult` to map and no Server Action
  to wrap. Recorded in `docs/plan/architecture.md` so a reviewer does not re-open it.
- **D5 — one test-fake root: `test/fakes/`.** `src/test/health-probe.ts` is a `HealthProbe` fake
  (feature-workflow step 4: "Fake in `test/fakes/`"); move it and delete `src/test/`.

## Steps

1. **Split the two large client components (real win).**
   - Create `src/components/admin/knowledge-page.vm.tsx` (`"use client"`: state, refs, handlers,
     `columns`) and `src/components/admin/knowledge-page.view.tsx` (props only, markup).
   - Create `src/components/chat/chat-page.vm.tsx` (`"use client"`: `messages`, `streaming`, abort,
     stream loop) and `src/components/chat/chat-page.view.tsx` (props only, markup).
   - Delete `src/components/admin/knowledge-page.tsx`, `src/components/chat/chat-page.tsx`.
   - Edit importers: `src/app/admin/knowledge/page.tsx`, `src/app/chat/page.tsx` → `.vm` path.
   - Rationale: 350/239-line files mixing transport, state, and markup.
2. **Split the two forms (same rule, small state).**
   - Create `src/components/advising/profile-form.vm.tsx` + `.view.tsx`; delete `profile-form.tsx`.
   - Create `src/components/auth/register-form.vm.tsx` + `.view.tsx`; delete `register-form.tsx`.
   - Edit importers: `src/app/(advising)/profile/page.tsx`, `src/app/(auth)/register/page.tsx`.
   - Rules: hooks (`Form.useForm`, `useFormAction`, `useServerFormErrors`, `useEffect`,
     `Form.useWatch`) live only in the vm; the vm renders the view; `initialValues` stay in the
     view but are passed as props. Keep every `data-testid`, label, `dir="ltr"` byte-identical.
3. **Consolidate test fakes.** `git mv src/test/health-probe.ts test/fakes/health-probe.ts`;
   change the one importer in `src/modules/rag/domain/ports.test.ts` from `@/test/health-probe` to
   the relative `../../test/fakes/health-probe` (`@` is aliased to `src/` only); delete `src/test/`.
4. **Add two assertions to `test/architecture.test.ts`.**
   - `"splits client components past 80 lines"`: for every `src/components/**/*.tsx` whose source
     starts with `"use client"` and has >80 lines, the filename must end `.vm.tsx` and a sibling
     `<base>.view.tsx` must exist.
   - `"test doubles live under test/"`: no collected `src/` path starts with `test/`.
5. **Docs.** Update `docs/behaviors/phase-5-1-identity-profile.md` `source_files`
   (`register-form`/`profile-form` → their `.vm/.view` paths); update `docs/plan/architecture.md`
   §۹ ("what we deliberately do not have") with D3/D4 and the `test/fakes/` root; write
   `docs/contracts/architecture-alignment.md`; one README line under `## وضعیت`.

## Files

Created: `src/components/admin/knowledge-page.vm.tsx`, `src/components/admin/knowledge-page.view.tsx`,
`src/components/chat/chat-page.vm.tsx`, `src/components/chat/chat-page.view.tsx`,
`src/components/advising/profile-form.vm.tsx`, `src/components/advising/profile-form.view.tsx`,
`src/components/auth/register-form.vm.tsx`, `src/components/auth/register-form.view.tsx`,
`test/fakes/health-probe.ts` (moved), `docs/contracts/architecture-alignment.md`.

Deleted: `src/components/admin/knowledge-page.tsx`, `src/components/chat/chat-page.tsx`,
`src/components/advising/profile-form.tsx`, `src/components/auth/register-form.tsx`,
`src/test/` (after the move).

Edited: `test/architecture.test.ts`, `src/modules/rag/domain/ports.test.ts`,
`src/app/admin/knowledge/page.tsx`, `src/app/chat/page.tsx`, `src/app/(advising)/profile/page.tsx`,
`src/app/(auth)/register/page.tsx`, `docs/behaviors/phase-5-1-identity-profile.md`,
`docs/plan/architecture.md`, `README.md`, `CHANGELOG.md` (after approval only).

## Contract (summary — full text in `docs/contracts/architecture-alignment.md`)

- **Interface signature:** vm components keep today's exact public props/type —
  `KnowledgePage()`, `ChatPage()`, `ProfileForm({ profile }: { profile: ProfileView })`,
  `RegisterForm()`. No export rename; only the module path gains `.vm`.
- **Invariant:** a `"use client"` file under `src/components/` that exceeds 80 lines must be a
  `*.vm.tsx` with a sibling `*.view.tsx`; the `*.vm.tsx` is the only one calling hooks.
- **Edge cases:** view with zero results → same empty text as today; `state === null` initial →
  no success banner, no error banner; aborted stream → partial text kept, "stopped" path unchanged.
  — verify: `E2E_ENABLED=true pnpm exec playwright test tests/e2e/advising-auth.spec.ts 2>&1 | grep -E '^\s*2 passed'`
- **review_level: reviewed** — no auth/payments/migration/infra, no contract change; but it is a
  multi-file move of UI internals behind e2e-only coverage, so a human must look at the four
  splits rather than trust the suite alone.

## Tests to write

- `test/architecture.test.ts`: the two assertions from step 4 (negative case exercised by
  temporarily... no — assert against the real tree; the assertion fails today for the four files).
- `src/modules/rag/domain/ports.test.ts`: unchanged behavior, import path only.
- No new unit tests: no logic is added; every moved handler keeps its body verbatim.

## Acceptance Criteria

- [x] AC-1: When the architecture suite runs, the "splits client components past 80 lines" case passes with zero violations (no `-t` filter: an unmatched name would exit 0 vacuously). — verify: `pnpm vitest run test/architecture.test.ts` — evidence: exit 0 (135 tests total)
- [x] AC-2: When the architecture suite runs, the "test doubles live under test/" case passes. — verify: `pnpm vitest run test/architecture.test.ts` — evidence: exit 0
- [x] AC-3: While both `knowledge-page` split files exist, the old `knowledge-page.tsx` is gone. — verify: `test ! -e src/components/admin/knowledge-page.tsx && test -e src/components/admin/knowledge-page.vm.tsx && test -e src/components/admin/knowledge-page.view.tsx` — evidence: exit 0
- [x] AC-4: While both `chat-page` split files exist, the old `chat-page.tsx` is gone. — verify: `test ! -e src/components/chat/chat-page.tsx && test -e src/components/chat/chat-page.vm.tsx && test -e src/components/chat/chat-page.view.tsx` — evidence: exit 0
- [x] AC-5: While the two form splits exist, all four new files are present and **both** originals are gone. — verify: `ls src/components/advising/profile-form.{vm,view}.tsx src/components/auth/register-form.{vm,view}.tsx && test ! -e src/components/advising/profile-form.tsx && test ! -e src/components/auth/register-form.tsx` — evidence: exit 0
- [x] AC-6: When the architecture suite runs, no `"use client"` file under `src/components/` over 80 lines lacks a `*.vm.tsx` + `*.view.tsx` pair. — verify: `pnpm vitest run test/architecture.test.ts` — evidence: exit 0
- [x] AC-7: When `src/test` is checked, the directory and its old fake are gone and `test/fakes/health-probe.ts` exists. — verify: `test ! -d src/test && test ! -e src/test/health-probe.ts && test -e test/fakes/health-probe.ts` — evidence: exit 0
- [x] AC-8: When the rag ports test runs, the moved `FakeHealthProbe` resolves and all cases pass (a missing file makes vitest exit 1, so exit 0 is real evidence). — verify: `pnpm vitest run src/modules/rag/domain/ports.test.ts` — evidence: exit 0
- [x] AC-9: When the advising e2e spec runs with e2e enabled, register→login→profile→logout yields **2 passed, 0 skipped** (both specs `test.skip` without `E2E_ENABLED=true`, so the replay above is required). — verify: `E2E_ENABLED=true pnpm exec playwright test tests/e2e/advising-auth.spec.ts 2>&1 | grep -E '^\s*2 passed'` — evidence: exit 0, 2 passed, 0 skipped
- [~] AC-10: When `/admin/knowledge` is opened, upload, stats, document table, and search render with the same Persian labels as before. — verify: manual: open http://localhost:3000/admin/knowledge and compare with the label list in the behavior doc — reason: needs OPENROUTER_API_KEY which this environment does not provide; human deferred 2026-11-23
- [~] AC-11: When `/chat` is opened and a question is sent, tokens stream in and the answer completes. — verify: manual: open http://localhost:3000/chat, send a seeded question, observe a completing stream — reason: needs OPENROUTER_API_KEY which this environment does not provide; human deferred 2026-11-23
- [x] AC-12: When the behavior doc is read, `source_files` names both new register-form stems and the profile-form view, and no longer names either deleted original. — verify: `grep -q 'register-form.vm' docs/behaviors/phase-5-1-identity-profile.md && grep -q 'profile-form.view' docs/behaviors/phase-5-1-identity-profile.md && ! grep -qE 'components/(auth/register-form|advising/profile-form)\.tsx' docs/behaviors/phase-5-1-identity-profile.md` — evidence: exit 0
- [x] AC-13: When the full gate runs, typecheck, lint and build exit 0 and the unit/integration suite reports **at least 133 passed** (a silently skipped suite also exits 0, so the count is asserted). — verify: `pnpm typecheck && pnpm lint && pnpm build && n=$(pnpm test 2>&1 | sed -n 's/.*Tests  *\([0-9][0-9]*\) passed.*/\1/p'); [ "${n:-0}" -ge 133 ]` — evidence: exit 0, 135 passed
- [x] AC-14: When `docs/plan/architecture.md` §۹ is read, it records the rag HTTP-only exception, the absent rag/admin guards, and `test/fakes/` as the single fake root. — verify: `grep -q 'test/fakes' docs/plan/architecture.md` — evidence: exit 0

## Documentation impact

- `README.md`: one line under `## وضعیت` — client components are split vm/view past 80 lines and
  test fakes live in `test/fakes/`. No install/run/config/env/API change, so no other section moves.
- New config keys or env vars: **none**.
- `docs/behaviors/phase-5-1-identity-profile.md`: `source_files` must list
  `src/components/auth/{register-form.vm,register-form.view}.tsx` and
  `src/components/advising/{profile-form.vm,profile-form.view}.tsx`. No new behavior doc: no user-
  visible behavior changes; the rag/admin surfaces are documented in `docs/plan/architecture.md`.
- `docs/plan/architecture.md`: §۹ additions (D3, D4, test-fake root).
- `docs/contracts/architecture-alignment.md`: created by the Implementer from the Contract section.
- `CHANGELOG.md` (after approval only): `## 2026-11-23 — architecture-alignment: client components split into vm/view, test fakes consolidated under test/fakes/, architecture test now enforces both.`

## Risks

- JSX moved between files loses a `data-testid` or a `dir="ltr"` → e2e + visual diff; AC-5/AC-9.
- The view accidentally calls a hook (`useFormAction`) → duplicate action state; caught by
  typecheck only if it is a hook-free server component — enforce by review, and AC-6.
- Form `initialValues` moved to the vm and re-created per render → resets on typing; AC-9 e2e
  exercises the profile form save.
- Assertion written so that it passes vacuously (no matches) → assert the matched file count > 0.

## Open Questions

- **O1 (recommended: separate plan).** `rag`/`admin` HTTP routes and `/admin/knowledge` have no
  session guard at all. Out of scope here (behavior + security change, needs `review_level: full`).
  Do you want a follow-up plan `admin-auth-guards`?
- **O2 (recommended: split all four).** Is splitting the two forms (145/129 lines, of which the
  state is ~6 lines) worth 4 new files? Alternative: keep forms whole and scope the new assertion
  to files >200 lines — but that needs an exception list, which I advise against.
- **O3 (recommended: no).** Should the `.vm.tsx`/`.view.tsx` naming be applied retroactively to
  `counselor-roster.tsx`, `login-form.tsx`, `group-create-form.tsx`, `assign-student-form.tsx`?
  They are all <80 lines today; the skill says splitting earlier is a useless abstraction.
- **O4 (human action).** Phase 5.1 AC-28 still needs a bullet in `AGENTS.md`, which only the human
  can add. Not absorbed here; it overlaps only in that both touch the architecture narrative.
