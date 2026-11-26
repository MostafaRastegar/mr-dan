# Review: roles-and-access

Round: 0 | Diff scope: src/modules/advising/{domain,application}, 10 `src/app/(advising)/**/*.actions.ts`, `(advising)/layout.tsx`, `test/architecture.test.ts`, domain/presentation tests, `tests/e2e/access-control.spec.ts`, `docs/behaviors/{roles-and-access,access-control-baseline}.md`, `README.md`

Skills loaded: `mro-code-review-checklist`, `mr-dan-architecture`, `mro-project-stack`, `mr-dan-persistence`, `mro-behavior-docs`, `mr-dan-feature-workflow`, `mr-dan-api`, `mr-dan-testing-parity`.

## Verdict

FAIL — one HIGH (README instruction that cannot be performed); code and tests pass every mechanically checkable criterion.

## Two-gate check

`approvals.manual_smoke` is `null` in `.opencode/plans/roles-and-access.orchestrator.json` and the change touches backend authorization logic with `review_level: null` (not `minimal`) → per the two-gate rule this is CRITICAL-1 below. The caller pre-declared AC-7 as pending human smoke and instructed not to treat it as a code failure; recorded here so it cannot be lost. `approvals.ui` is `null` but no UI-stage deliverable is under review (layout nav change is part of the backend stage).

## Checklist

| # | Item | Verdict | Evidence |
|---|------|---------|----------|
| 1 | Correctness | PASS | All 15 `page.tsx` files accounted for and each classification verified true against the file contents (see below); guard swap is semantically identical; `plan:write` gate fully replaces the deleted role check |
| 2 | Acceptance evidence | PASS | 13/14 confirmed with command + exit code (check-acceptance); AC-7 unticked and honestly marked pending |
| 3 | Security | PASS | `assertCounselorOfStudent` gates on `plan:write` (counselor/admin only) + `counselorId === actor.id`; `updateProfileSchema` has no `role` field (schemas.ts:113-125) so no escalation via profile edit; register `roleField` refines to `student\|counselor` only (schemas.ts:71-78); operator denied on all 10 action areas via use-case `assertCapability`/`assertPlanWrite` |
| 4 | Type safety | PASS | No `any`, no casts, no suppressions in diff; `import type { Actor }` re-export; `Record<Role, …>` exhaustive after operator row added |
| 5 | Test coverage | PASS | New `planning-access.test.ts` (10 tests) covers every branch incl. admin-not-counselor and unknown student; capability operator row deny-tested; matrix is bidirectional (new page AND stale entry both fail); e2e covers AC-5 live |
| 6 | Project rules | PASS | Layer direction intact incl. new `infrastructure → application` ban and relative-import resolution; no schema change, no migration, no dependency; redirect outside `runAction` in every action |
| 7 | Documentation | FAIL | `README.md:143` names a provisioning route that does not exist — see HIGH-1 |
| 8 | Behavior doc freshness | PASS | `docs/behaviors/roles-and-access.md` exists, `last_verified: 2026-11-26` (today), Files touched lists all 24 diff files; baseline doc refreshed and `/study` ghosts removed. Two accuracy nits → MEDIUM-1/2 |
| 9 | Skills | PASS | Choke-point swap uses `runAction` + `requireSessionUser` per `mr-dan-architecture`; capability table in domain per `mr-dan-feature-workflow`; doc format per `mro-behavior-docs` |
| 10 | Do-NOT-check items | N/A | No syntax/style/type/unit findings reported |

Secret audit: clean (no patterns found).

## Acceptance evidence

| Criterion | Verify command | Evidence present? | Verdict |
|-----------|----------------|-------------------|---------|
| AC-1 | `pnpm vitest run test/architecture.test.ts` | Yes — exit 0, 12 tests | PASS |
| AC-2 | `! grep -rl "getSessionContext" src/app --include=*.actions.ts` | Yes — exit 0; independently re-grepped: 0 matches across all 11 actions files (named, default, and aliased forms all caught by substring test; architecture test asserts the same) | PASS |
| AC-3 | `pnpm vitest run …/planning-access.test.ts` | Yes — exit 0, 10 tests; tests prove admin-not-counselor-of-record rejects, student rejects, own counselor passes | PASS |
| AC-4 | `pnpm vitest run …/capabilities.test.ts` | Yes — filters all 4 roles, expects exactly `[counselor, admin]` | PASS |
| AC-5 | `E2E_ENABLED=true pnpm exec playwright test … -g "student counselor pages"` | Yes — exit 0, 1 passed against live dev+Postgres | PASS |
| AC-6 | `! grep -q "type Actor" src/modules/advising/application/groups.ts` | Yes — independently re-grepped: 0 matches; single `Actor` imported from `planning-access.ts`, no cycle | PASS |
| AC-7 | manual — admin → foreign student plan → `/profile`; own counselor sees plan | Not run (correctly unticked) — mechanism verified in code: `[studentId]/page.tsx:15-23` catches `ForbiddenError` from `getStudentStudyPlan` → `redirect("/profile")`; `assertPlanRead` rejects admin non-counselor (tested) | PENDING human smoke |
| AC-8 | `test -f …roles-and-access.md && ! grep -q "دو نقش" README.md && ! grep -q "advising/study" …baseline.md` | Yes — independently re-grepped: doc exists, both greps 0 | PASS |
| AC-9 | `! git status --porcelain prisma/migrations …` + `role *String` | Yes — migrations dir clean; `prisma/schema.prisma:74` `role String` (comment staleness → LOW-2) | PASS |
| AC-10 | `pnpm typecheck && pnpm lint && pnpm test && pnpm build` | Yes — 4× exit 0 in orchestrator state (399 tests / 61 files) | PASS |
| AC-11 | `pnpm vitest run …/capabilities.test.ts` | Yes — operator: `user:read`/`user:support` true, `user:manage`/`rag:manage` false | PASS |
| AC-12 | `pnpm vitest run …/models.test.ts` | Yes — `toRole("operator")==="operator"`; fallthrough returns `"student"` (models.ts:23-28) | PASS |
| AC-13 | `pnpm vitest run …/schemas.test.ts` | Yes — rejects `admin`, `operator`, `owner`; schema refines to `student\|counselor` | PASS |
| AC-14 | `pnpm vitest run test/architecture.test.ts` | Yes — 15/15 pages classified, zero operator pages; the "future operator pages under `user:read`" half is guidance only (LOW-4) | PASS |

Page-gate matrix audit (caller's focus): matrix has 15 entries, filesystem has 15 `page.tsx` files, sets match exactly in both directions. Every classification spot-verified: `/` public (no guards import, verified); `(auth)` login+register call `getSessionContext()` + `redirect("/profile")` inline (verified); chat/dashboard/profile `requireSessionUser()` (verified); 5 area pages capability-gated with matching capability strings (verified); counselor pages `group:manage` (student/operator → `/profile`, satisfies AC-5); `/admin/knowledge` and `/api-docs` `rag:manage` (admin-only; operator cannot reach). False-positive risk of the new rules on legitimate imports: none found — `resolveInternal` exempts same-directory relative imports, which are same-layer by construction; the `public` marker only fails if `/` ever imports `advising-guards`, which would genuinely change its class.

## Findings

### CRITICAL

- `.opencode/plans/roles-and-access.orchestrator.json:40` — Manual smoke test not approved: `approvals.manual_smoke` is `null` while the diff changes backend authorization (`planning-access.ts`, guards) and `review_level` is not `minimal`. Per caller instruction AC-7 stays "pending human smoke", not a code failure; the smallest fix is the human running the AC-7 navigation on `pnpm dev` and setting `approvals.manual_smoke`.

### HIGH

- `README.md:143` — "نقش `operator` هم مانند ادمین از مسیر اسکریپت dev ساخته می‌شود" is unperformable: `scripts/create-admin.ts` hard-codes `role: "admin"` in both `createUser` and `promote` (no role argument), `scripts/seed-advising.ts` has zero operator support, and the behavior doc itself states "No operator provisioning script". A reader following the README cannot create an operator account. Smallest fix: replace the clause with "اسکریپت provisioning برای operator هنوز وجود ندارد و به فیچر پنل ادمین موکول شده (فعلاً فقط با ویرایش مستقیم DB در dev)" — matching `docs/behaviors/roles-and-access.md` "What it does NOT do".

### MEDIUM

- `docs/behaviors/roles-and-access.md:86` — "The only permitted `role ===` check in `src/app/**` is `dashboard/page.tsx`" is false as written: `profile-form.vm.tsx:33`, `profile-form.view.tsx:53` (`profile.role === "student"`) and `chat-page.view.tsx:54-61` / `chat-page.vm.tsx:129,134` (`m.role === "user"`, message role). None of these are access-gating, but the sentence claims uniqueness. Fix: scope it — "the only access-gating check of the session user's role".
- `docs/behaviors/roles-and-access.md:3` — `source_files` omits files the document describes: `groups.ts`, the 10 `*.actions.ts`, `presentation/schemas.ts`. The doc asserts their behavior ("none calls getSessionContext"), so `mro-doctor --docs` cannot flag staleness when they change. Fix: append the paths.

### LOW

- `src/modules/advising/application/planning-access.test.ts` — no direct operator actor for `assertCounselorOfStudent`; denial currently holds via composition (operator lacks `plan:write`, tested in `capabilities.test.ts`). A 2-line case with `role: "operator"` would pin it.
- `prisma/schema.prisma:74` — comment still reads `"student" | "counselor" | "admin"`; `operator` is now a legal value. Comment-only edit, no migration.
- `README.md` access matrix — operator gets 200 on the 9 RAG data routes and `/chat` because those are session-gated by pre-existing design. Documented honestly; when real operator accounts exist, the admin-panel feature should decide whether RAG data routes need a capability.
- `docs/behaviors/roles-and-access.md` — AC-14's "future operator pages classify under `capability:user:read`" appears nowhere in the doc's matrix table; nothing mechanical pins the capability choice for pages that don't exist yet. One sentence in the doc would carry the contract.
- Out of scope (bootstrap, informational): `.opencode/plans/roles-and-access.orchestrator.json:12-13` declares the `acceptance` key twice (last-wins, `confirmed: 13`).

## Deferrals

- AC-7 — admin opens foreign student's plan → `/profile`; own counselor sees plan — manual smoke not yet run; caller pre-declared it pending and not a failure. Accepted by human? unknown (awaiting the human smoke that CRITICAL-1 requires).

---

# Round 2

Round: 2 of 2 | Diff scope: round-1 scope + `prisma/schema.prisma` (comment only) | 23 files, +276/−157

## Verdict

PASS — no CRITICAL or HIGH remains in the code, docs, or tests. The only open CRITICAL is the manual smoke gate (`approvals.manual_smoke: null`), which is with the human and is not a code finding; it stays tracked below.

## Per-fix verification (all independently checked, none trusted)

| # | Round-1 finding | Verdict | Evidence |
|---|-----------------|---------|----------|
| 1 | HIGH-1 `README.md:143` operator provisioning claim | FIXED | New text: "اسکریپت ساخت حساب operator هنوز وجود ندارد و به فیچر پنل ادمین موکول شده است (تعمیم `create-admin.ts` به `--role`)". States the script does not exist; `--role` is framed as the future generalization (تعمیم), not an existing flag. Matches the behavior doc's "No operator provisioning script". |
| 2 | MEDIUM-1 `docs/behaviors/roles-and-access.md:86` overbroad "only" claim | FIXED | Now "The only access-gating check of the session user's role … is `dashboard/page.tsx`" and explicitly exempts non-gating comparisons (profile form field branching). True as written: `dashboard/page.tsx:10` is the only session-user role gate in `src/app/**` (re-grepped). |
| 3 | MEDIUM-2 `source_files` gaps | FIXED | Front matter now carries 21 paths incl. `groups.ts`, `presentation/schemas.ts`, and all 10 `*.actions.ts`. |
| 4 | LOW-1 missing operator case in `planning-access.test.ts` | FIXED | `planning-access.test.ts:74` "rejects an operator role" with a real `ForbiddenError` assertion; 11 `it(` blocks; doc Verification and full-suite count refreshed (11 tests; 400 total, was 399). Satisfies the updated AC-3 wording (operator denied). |
| 5 | LOW-2 stale schema comment | FIXED | `git diff` on `prisma/schema.prisma` is a single-line comment change (`"student" \| "counselor" \| "admin" \| "operator"`); no structural edit, `prisma/migrations` still clean (AC-9 intact). |
| 6 | LOW-4 future operator pages ungoverned | FIXED | Doc lines 90-91: "Future operator-support pages classify under `capability:user:read` in the matrix; the admin panel extends the matrix with those entries." |

## Regression sweep of the whole scoped diff

- Cheap ban-greps re-run, all clean: `getSessionContext` in actions = 0; `type Actor` in `groups.ts` = 0; "دو نقش" in README = 0; "advising/study" in baseline doc = 0; `prisma/migrations` untouched = 0; `role *String` present (schema.prisma:74).
- Scope delta vs round 1: exactly one new file (`prisma/schema.prisma`, comment-only) and +1 line — no unrelated edits entered the scope. Domain/application/actions/layout/architecture-test/e2e hunks are byte-identical to what round 1 verified.
- Recorded gate evidence (orchestrator + doc Verification): `pnpm typecheck` 0, `pnpm lint` 0, `pnpm test` 0 (61 files / 400 tests), `pnpm build` 0, architecture matrix 12 tests, planning-access 11 tests, e2e 1 passed. Page-gate matrix audit from round 1 (15/15 pages, both-direction exact match) unchanged and still valid.

## Findings (current tree)

### CRITICAL

- (tracked, with the human — not a code failure) `.opencode/plans/roles-and-access.orchestrator.json:45` — Manual smoke test not approved: `approvals.manual_smoke` still `null` and AC-7 is pending the human navigation check on a live server. Re-confirmed once per caller instruction; the only blocker between this PASS and `approvals.final`.

### HIGH

- none

### MEDIUM

- none

### LOW

- `docs/behaviors/roles-and-access.md` §Files touched — does not list `prisma/schema.prisma`, which this round modified (comment). Per `mro-behavior-docs` the section should list every created/modified file. One-line fix; may ride along with any later doc touch or the admin-panel round.
- Informational, carried unchanged (no action this round): operator accounts get 200 on the 9 session-gated RAG data routes and `/chat` (pre-existing session-only design, documented in the README matrix) — the admin-panel feature should decide whether those routes need a capability once real operator accounts exist.
- Out of scope (bootstrap, informational): duplicate `acceptance` key in the orchestrator state JSON (last-wins).

## AC summary (round 2)

AC-1…AC-6, AC-8…AC-14: PASS on recorded evidence, spot-re-verified read-only. AC-7: pending human smoke (CRITICAL-1, tracked). No remaining code, doc, or test findings above LOW.

