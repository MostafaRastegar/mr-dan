# Review: admin-panel-catalog

Round: 1 | Diff scope: prisma/schema.prisma + migration 20261126075452, scripts/seed-advising.ts, scripts/create-user.ts (renamed), src/modules/advising/{domain,application,infrastructure,presentation}, src/app/admin/**, src/app/(advising)/**, src/app/(auth)/**, src/server/container.ts, src/constants/test-ids.ts, test/**, tests/e2e/access-control.spec.ts, README.md, docs/behaviors/*
Review baseline: `8dafffd..dabfda9` (work committed mid-review; all reviewed files re-checked at HEAD).

Skills loaded: mro-code-review-checklist, mro-project-stack, mr-dan-architecture, mr-dan-persistence, mr-dan-api, mr-dan-frontend, mr-dan-form-design, mro-data-model, mr-dan-testing-parity, mro-behavior-docs, mr-dan-feature-workflow.

## Verdict

**FAIL** — blocked solely on the manual-smoke gate (AC-12/AC-14 pending human). **No code CRITICAL or HIGH.**
*(Round-2 correction: the smoke was performed after this round-1 text was written — see below; the gate CRITICAL is withdrawn.)*

## Two-gate check

- `approvals.ui` = 2026-11-26T07:48:18Z — approved before any backend file changed (migration timestamp 07:54:52 postdates it; schema diff is additive-only). AC-4 holds.
- `approvals.manual_smoke` = **2026-11-26T10:29:40Z** (orchestrator state line 108; round 1 read a stale snapshot where it was null). Log records the human passing AC-12 (subject create → visible on `/schedule` → retire → gone from the select, old row keeps its label) and AC-14 (grade «دهم» assignment persisted across reload, removal kept the subject). Gate CRITICAL withdrawn; AC-12/AC-14 verified.

## Checklist

| # | Item | Verdict | Evidence |
| --- | --- | --- | --- |
| 1 | Correctness / data parity | PASS | Seed vs deleted statics: FIELDS/GRADES identical order+labels (`scripts/seed-advising.ts:44-51`); SUBJECTS_SEED 28/28 slugs, labels, field lists, order == old `domain/subjects.ts`; BOOKS_SEED 8/8 identical to old `domain/books.ts`. Zero slug/label/sortOrder drift |
| 2 | Acceptance evidence | PASS | Every `[x]` criterion maps to a named test (table below); suite 433/433 green |
| 3 | Security / authz | PASS | All 30 catalog actions via `runCatalogAction` (`src/app/admin/catalog/_action-kit.ts:16-27`: session → `catalog:manage` → parse, guard before parse). `users.actions.ts:32-77` guards all three. `ChangeUserRoleUseCase` re-checks `user:manage`, blocks self-change + last admin (`application/admin-users.ts:43-56`); support path has no role parameter; temp password hashed via `AuthCryptoPort`, returned once, never logged/persisted |
| 4 | Type safety | PASS | No `any` in reviewed files; schema factories typed via `ReturnType`; `pnpm typecheck` exit 0 |
| 5 | Test coverage | PASS | `admin-users.test.ts` (role rails, pagination, operator support, hash-only reset), `catalog-admin.test.ts` (slug_conflict, retire/reactivate, pagination, AC-14 persist/remove), `test/advising/seed.test.ts:68` (catalog seed idempotent), `users.actions.test.ts:22` (forbidden), page-gate matrix test |
| 6 | Project rules (AGENTS.md) | PASS | Layer rules hold: `domain/catalog.ts` type-only imports; application imports ports only; container is the only wiring; admin pages ≤40 lines; no Prisma under `src/app/admin/**` |
| 7 | Documentation truthfulness | PASS | README admin matrix (`README.md:134-141`) verified against `capabilities.ts` and guards; `catalog:manage` documented; behavior doc front matter `last_verified: 2026-11-26` + real `source_files`. One stale pre-existing README row → MEDIUM-2 |
| 8 | Behavior doc freshness | PASS | `docs/behaviors/admin-panel-catalog.md` exists, `last_verified` 2026-11-26 (== diff date), `source_files` lists real touched paths; baseline/roles doc edits match the allowed rename + operator-provisioning facts |
| 9 | Skills applied | PASS | Capability map, page/action triads, choke points, testid registry, spacing scale all followed |
| 10 | Not-checked (syntax/style/unit) | N/A | Owned by typecheck/lint/test — all re-run once below, exit 0 |

## Acceptance evidence

| Criterion | Verify command / test | Evidence present? | Verdict |
| --------- | --------------------- | ----------------- | ------- |
| AC-1 | UI inspection (8 pages) | empty/loading/error + RTL present in both table views | PASS |
| AC-2/AC-3/AC-4 | orchestrator state + timestamps | UI gate 07:48:18Z < migration 07:54:52; mock-only stage recorded | PASS |
| AC-5 | `test/advising/seed.test.ts:68` "catalog seed is idempotent" | yes | PASS |
| AC-6 | `requireCapability` → `/profile` (`advising-guards.ts:52`); `users.actions.test.ts:22`; e2e exit 0 (recorded, not re-run) | yes | PASS |
| AC-7 | `admin-users.test.ts:68,77` (self-change, last admin) | yes | PASS |
| AC-8 | `catalog-admin.test.ts:86` retire hidden from options, kept in admin list; `labelOf` slug fallback | yes | PASS |
| AC-9 | `makeRegisterSchemas`/`makeScheduleSchemas` fed by `catalogOptions.execute()` in actions; Persian messages unchanged | yes | PASS |
| AC-10 | grep: no static catalog exports in `src/` | yes | PASS |
| AC-11 | README admin section + behavior doc front matter | yes | PASS |
| AC-12 | human smoke | not performed | **PENDING human** |
| AC-13 | pagination slice/clamp tests (`admin-users.test.ts:94,113`, `catalog-admin.test.ts:120`); repos always skip/take | yes | PASS |
| AC-14 | `catalog-admin.test.ts:169` (labels persist on update, removal keeps subject); panel reload = manual | yes (logic) | **PENDING human (manual part)** |
| AC-15 | `capabilities.ts:87-93` operator caps; `users-table.view.tsx:117-128` role control replaced by Tag; `users.actions.test.ts:22` | yes | PASS |

## Commands re-run (once, this review)

| Command | Exit |
| --- | --- |
| `pnpm typecheck` | 0 |
| `pnpm lint` | 0 |
| `pnpm test` | 0 (64 files, 433 tests) |
| `pnpm build` | 0 |

## Findings

### CRITICAL

- (gate, not code) ~~`.opencode/plans/admin-panel-catalog.orchestrator.json` — `approvals.manual_smoke = null`~~ **WITHDRAWN in round 2**: the smoke is recorded at 2026-11-26T10:29:40Z (state line 108) and the log records AC-12/AC-14 passed by the human. CRITICAL count: 0.

### HIGH

- (none — no code HIGH)

### MEDIUM

- `test/architecture.test.ts:221-248` — triad detection narrowed to relative `.vm` imports; admin pages import their vm via `@/app/...` alias (`users-table.vm`, `catalog-manager.vm`) and escape triad enforcement. Pair safety survives only indirectly via the >80-line client-split test. Fix: normalize `@/app/` aliases in `resolveInternal` (or count alias `.vm` imports) so admin pages are inside the rule.
- `README.md:65,89,91` — still documents a `/study` pomodoro page that does not exist (`ls src/app/(advising)/` has no `study/`; already absent at base 8dafffd, so pre-existing). The same diff fixed the stale `/study` rows in `docs/behaviors/access-control-baseline.md` but left README inconsistent. Fix: delete the three `/study` mentions from README.

### LOW

- `prisma/schema.prisma` (WeeklySchedule.subject, Homework.subject comments) — comments cite the deleted `domain/subjects.ts` as the slug source.
- `users-table.view.tsx:118-125` — role `Select` outside a `Form.Item` (letter of the form-design rule; value is controlled from row data and only opens a confirm modal, so no form-state risk).

## Deferrals

- AC-12 — manual smoke passed by human 2026-11-26T10:29:40Z — accepted by human? yes
- AC-14 — manual smoke passed by human 2026-11-26T10:29:40Z — accepted by human? yes
- LOW-2 (role Select outside Form.Item) — deferred, no form-state risk — accepted by human? yes (per orchestrator state note)

## Round 2

Scope: AC-16/AC-17 delta only (`AdminUserRow.counselor*`, `AdminUserListQuery`/`listCounselors`, filter bar UI, repo `where`, fakes/tests, README پنل مدیریت lines, behavior doc). Baseline `dabfda9` + worktree delta; the parallel `counselor-roster-separation` files are excluded per handoff.

### Checklist (round-2 items)

| Focus item | Verdict | Evidence |
| --- | --- | --- |
| One `where` for findMany + count | PASS | `prisma-admin-users-repository.ts:79-99`: single `where` const feeds both `findMany` and `count({ where })`; totals always filtered |
| Role whitelist | PASS | `admin-users.ts:30-37`: `ROLE_FILTERS` is the total 4-role list; `roleFilter` = `find`, returns `Role \| undefined`; no cast, unknown `?role=` ignored (test `ignores an unknown role filter`, admin-users.test.ts:289) |
| `q` semantics | PASS | use case trims → `undefined` when empty (`admin-users.ts:41`), so no empty `OR`; repo applies `OR:[username,fullName] contains mode:"insensitive"` only when non-empty; tests for username + case-insensitive fullName (:222,:231) |
| Pagination composition | PASS | `clampPage` untouched; apply → `filterUrl()` omits `page` (resets to 1) and re-sets `pageSize` (`users-table.vm.tsx` filterUrl); row link keeps page/pageSize; out-of-range → empty items + true filtered total (tests :134,:155,:262) |
| Counselor dropdown error swallow | MEDIUM | `page.tsx:26` `.catch(() => [])` — a failed `listCounselors` silently renders an empty dropdown, indistinguishable from "no counselors"; the table read uses the `readFailed` path. Degradation is read-only and observable, so MEDIUM not HIGH; fix: reuse `readAdminPage`-style failure flag or render a retry hint |
| Removal regression | PASS | No `CLEAR_COUNSELOR_FILTER` reference anywhere (never in registry at `dabfda9`); per-row counselor link `users-table.view.tsx:155-166` sets `?counselor=<id>&page&pageSize`; `FILTER_*` ids all registered in `test-ids.ts` |
| UI (RTL/44px/focus/empty) | PASS | label+control `space-y-1.5`, `min-h-11` (44px) controls, `sm:flex-row` wrap, `scroll={{x:880}}` inside table, empty state «کاربری یافت نشد», اعمال/پاک کردن both live (apply → push filtered URL; clear → `href={basePath}`) |
| Layer/doc | PASS | `page.tsx` 38 lines, guard + data only; behavior doc `last_verified: 2026-11-26`, `source_files` now includes `prisma-admin-users-repository.ts`, filter semantics described truthfully |

### Commands re-run (once)

| Command | Exit |
| --- | --- |
| `pnpm typecheck` | 0 |
| `pnpm lint` | 0 |
| `pnpm test` | 0 (65 files, 449 tests) |
| `pnpm build` | 0 |

### Findings (round 2)

### HIGH
- (none)

### MEDIUM
- `src/app/admin/users/page.tsx:26` — `.catch(() => [])` on the counselor dropdown read: silent degradation, inconsistent with the table's `readFailed` path. Smallest fix: surface a boolean (or reuse the readFailed pattern) and hint "دریافت مشاوران ناموفق بود".
- `README.md` («برنامه هفتگی» section) — still claims subjects are chosen only from the static catalog `src/modules/advising/domain/subjects.ts` with "مقدار خارج از کاتالوگ … رد می‌شود"; that file is deleted and validation is DB-fed (`catalogOptions` → schema factories). Fix: rewrite the paragraph to point at the `Subject` table / admin panel. (The `## پنل مدیریت` lines themselves are accurate.)

### LOW
- `users-table.view.tsx:225-262` — filter Select/Input are controlled bare controls outside a `Form.Item` (same letter-of-rule note as round 1; values are explicit props, no submit path).
- Per-row counselor link preserves the current `page` (`users-table.view.tsx:160`), which can land out of range for a small counselor subset; defined behavior (empty items + true total) makes this cosmetic.

### Round-2 verdict

PASS for code. `approvals.manual_smoke` is recorded (2026-11-26T10:29:40Z, state line 108) and the log records the human passing AC-12/AC-14 — the round-2 CRITICAL is withdrawn, CRITICAL = 0. The AC-17 filter-bar delta was human-requested after the AC-16 demo, so AC-16/AC-17 still need one final on-screen confirmation with the MEDIUM fixes in place. Two MEDIUMs are pending fix by the implementer (silent `.catch(() => [])` on the counselor dropdown read, `page.tsx:26`; stale static-catalog README paragraph) — status recorded, not re-audited. Final counts: CRITICAL 0 · HIGH 0 · MEDIUM 2 · LOW 2.
