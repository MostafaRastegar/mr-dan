# Review: counselor-roster-separation

Round: 1 | Diff scope: `src/modules/advising/domain/models.ts`, `application/groups.ts(+test)`, `infrastructure/prisma-user-repository.ts(+new test)`, `src/app/(advising)/counselor/students/{page,[studentId]/page,counselor-roster.vm,counselor-roster.view}`, `src/constants/test-ids.ts`, `test/fakes/advising.ts`, `tests/e2e/access-control.spec.ts`, `README.md` (roster lines), `docs/behaviors/counselor-roster-separation.md` (new)

Skills loaded: `mro-code-review-checklist`, `mro-project-stack`, `mr-dan-architecture`, `mr-dan-persistence`, `mr-dan-frontend`, `mr-dan-testing-parity`, `mro-behavior-docs`, `mro-data-model`. Not loaded: `mr-dan-feature-workflow` (new-feature pipeline; this diff modifies existing seams, no schema/action/form), `mr-dan-api`/`mr-dan-devops`/`mr-dan-ingestion`/`mr-dan-rag` (no route/env/ingestion/RAG surface touched).

## Verdict

FAIL — gate CRITICAL below; code-level checklist has no CRITICAL/HIGH.

## Two-gate rule

- `approvals.manual_smoke: null`, change touches backend logic (`prisma-user-repository.ts`, `groups.ts`), `review_level: "reviewed"` → **CRITICAL: Manual smoke test not approved.** Blocks approval regardless of code quality; remediation is the human demo, not a code change.
- Plan has no `Stage UI (mock)` stage, so the UI-gate CRITICAL trigger does not literally fire; however the plan's own `## UI gate` section requires a human `pnpm dev` screenshot before merge → tracked as HIGH (AC-1 pending), consistent with the orchestrator's recorded blocker.
- `approvals.ui` is also null; same remediation path.

## Checklist

| # | Item | Verdict | Evidence |
| --- | --- | --- | --- |
| 1 | Correctness | PASS | Partition `groups.ts:113-118`: `counselorId === actor.id` → myStudents, `=== null` → unassigned, third-counselor id → absent from both. Assign pool built from partitioned arrays (`counselor-roster.view.tsx:53`), not raw port result → no foreign student can leak into the Select even under a repository regression. Empty id: `notFound()` before use case (`[studentId]/page.tsx:12`) + repo guard. Removal keeps ownership (`groups.ts:85`: `counselorId: input.groupId ? input.actor.id : undefined`). |
| 2 | Acceptance evidence | PASS | All four `[x]` criteria carry command + result (see table below). AC-1 honestly unticked, pending. |
| 3 | Security | PASS | No secrets; Prisma parameterized; authorization re-checked server-side (`groups.ts:76-77` ForbiddenError + capability assert). Foreign `counselorId` values never reach the client: partition drops them before props; only `me|null` ships. Unauthorized view link removed (not disabled) for unassigned rows. |
| 4 | Type safety | PASS | No `any` in diff; no suppressions. One test-only cast `as unknown as PrismaClient` in the exploding-client double (`prisma-user-repository.test.ts:17`) — conventional test fake, self-documenting factory. |
| 5 | Test coverage | PASS | Partition/foreign/reassign unit tests against fake whose `listAssignableStudents` mirrors the repo OR clause exactly (`test/fakes/advising.ts:211-230`); guard test uses an exploding client, so it fails without the guard; pre-existing live-DB OR regression test still present (`test/advising/integration.test.ts:163`); e2e asserts both section testids + «بدون گروه» heading. Tests prove criteria (partition compared to a fresh port call), not implementation. |
| 6 | Project rules (AGENTS.md) | PASS | Layer directions intact (domain field, application partition, infra select/map, view markup); pages ≤40 lines (39 / 27); view hook-free; new testid registered in `src/constants/test-ids.ts`; `CHANGELOG.md` untouched by this feature (its working-tree diff belongs to the concurrent roles-and-access feature). |
| 7 | Documentation (README) | PASS | Roster route line + new bullet match shipped behavior (two sections, foreign students invisible, `forbidden` on takeover). See LOW/INFO notes on non-feature hunks. |
| 8 | Behavior doc freshness | PASS | `docs/behaviors/counselor-roster-separation.md` exists; `last_verified: 2026-11-26` (current); `source_files` paths are real; "How it behaves" matches the diff incl. the keep-ownership-on-unassign rule. LOW on front-matter completeness below. |
| 9 | Skills applied | PASS | See loaded list; checklist followed; conflicts with AGENTS.md: none found. |
| 10 | Do-NOT-check items | N/A | No syntax/style/type findings raised; those belong to lint/tsc/vitest. |

## Acceptance evidence

| Criterion | Verify command | Evidence present? | Verdict |
| --- | --- | --- | --- |
| AC-1 (two sections, never one table) | `E2E_ENABLED=true pnpm exec playwright test … -g "roster sections"` + manual screenshot | **No** — e2e blocked (port 3000 wedged), screenshot pending human | FAIL (pending, honestly unticked) |
| AC-2 (B excludes A's student) | `vitest run groups.test.ts -t "foreign"` | Yes — 2 passed, exit 0; live-DB integration test also green | PASS |
| AC-3 (disjoint partition, union = query result) | `vitest run groups.test.ts -t "partition"` | Yes — 1 passed, exit 0 | PASS |
| AC-4 (foreign assign → `forbidden`, zero writes) | `vitest run groups.test.ts -t "reassign"` | Yes — 1 passed, exit 0; `counselorId`/`groupId` asserted unchanged | PASS |
| AC-5 (README + behavior doc) | `grep -q "بدون گروه" README.md && test -f docs/behaviors/…` | Yes — exit 0; verified in diff/read | PASS |

## Findings

### CRITICAL

- orchestrator state (`approvals.manual_smoke: null`) — Manual smoke test not approved; per the two-gate rule this blocks approval while the change touches backend logic at `review_level: "reviewed"`. Smallest fix: run the human demo (`pnpm dev`), record `approvals.manual_smoke` and the AC-1 screenshot; no code change implied.

### HIGH

- AC-1 — no verification evidence exists (e2e could not run: port 3000 held by wedged next-server pid 593060; screenshot pending). Smallest fix: after the wedged server is cleared, run `E2E_ENABLED=true pnpm exec playwright test tests/e2e/access-control.spec.ts -g "roster sections"` and attach the human screenshot approval.

### MEDIUM

- (none)

### LOW

- `src/modules/advising/infrastructure/prisma-user-repository.ts:199-200` — guard comment claims `where: { id: "" }` throws `PrismaClientValidationError`; `prisma/schema.prisma:70` declares `id String @id @default(uuid())` (no `@db.Uuid`), so the query type-checks and returns null rather than throwing. The guard itself is correct defense-in-depth and its test is real; only the stated "why" is wrong. Smallest fix: reword comment to "fail fast on empty route params instead of a guaranteed-empty DB lookup".
- `docs/behaviors/counselor-roster-separation.md:3` — front-matter `source_files` lists 6 of the touched files; `[studentId]/page.tsx`, `src/constants/test-ids.ts`, `test/fakes/advising.ts`, tests, and README appear only in the body list. Smallest fix: append them to the front matter (same pattern was deferred LOW in roles-and-access).
- AC-1 wording vs shipped labels — AC-1 names the second section «گروه‌های من», but the grouped-students section is labeled «دانش‌آموزان من» (`counselor-roster.view.tsx:133`); «گروه‌های من» names the groups panel (line 94). README and behavior doc consistently use the shipped labels. Smallest fix: none in code — the human should approve the actual labels at the pending screenshot gate (or the plan's parenthetical is amended).
- `counselor-roster.view.tsx:57` vs `:133` — page `h1` and roster section `h2` are now both «دانش‌آموزان من» (h2 renamed in this diff). Duplicate heading text; cosmetic copy redundancy.

### INFO (no action required from implementer)

- Assign-pool ordering changed (unassigned first, then mine); membership identical to the previous pool (own + unassigned). Intentional-looking, harmless.
- README working-tree diff also contains `/study` removals that are outside this feature's declared two-line scope; they belong to concurrent uncommitted work in the shared tree. Orchestrator should separate commits; not charged to this feature.
- Attribution note: `CHANGELOG.md`, `prisma/schema.prisma`, `test/architecture.test.ts` working-tree changes belong to the concurrent roles-and-access feature and were excluded from this review per diff scope.
- Behavior doc "Verification" says 65 files / 439 tests; the shared tree now measures 442 (concurrent features adding tests). Doc number was true at write time; refresh both files when the serialization order (`models.ts`, `test/fakes/advising.ts` shared seams) settles.

## Deferrals

- AC-1 — human screenshot approval pending (e2e blocked by wedged server). Accepted by human? unknown (this is the pending gate itself).

## Command results (reviewer, single run)

| Command | Exit |
| --- | --- |
| `pnpm typecheck` | 0 |
| `pnpm lint` | 0 (5 pre-existing warnings, all in files untouched by this diff: `study-profile.test.ts`, `text-normalizer.ts`, `advisor-program-integration.test.ts`) |
| `pnpm test` | 0 — 65 files / 442 tests passed |
| `pnpm build` | 0 |

`pnpm dev` and Playwright not run (port 3000 held by a wedged server), per handoff. `secret-audit`: no findings.

`pnpm dev` and Playwright not run (port 3000 held by a wedged server), per handoff.

## Round 2 — confirmation round (2026-11-26)

Scope: only the three deltas since round 1; feature not re-audited. Concurrent `src/app/admin/**`, `admin-users.ts`, `users-table.*`, `models.ts` admin additions (AC-17 filter bar) ignored per handoff.

### Deltas checked

1. **Human smoke** — `approvals.manual_smoke: "2026-11-26T10:29:40Z"` present in `.opencode/plans/counselor-roster-separation.orchestrator.json:82`. Round-1 CRITICAL (manual smoke not approved) resolved. `approvals.ui` stays null; round 1 established the plan has no `Stage UI (mock)` stage — the plan's `## UI gate` screenshot requirement is what `manual_smoke` records.
2. **LOW fixes** — all verified in source:
   - Guard comment rewritten (`prisma-user-repository.ts:199-202`); see residual below.
   - Behavior doc `source_files` now lists 13 paths, all real, incl. `[studentId]/page.tsx`, `test-ids.ts`, fakes, tests, README; deviation note added (`docs/behaviors/counselor-roster-separation.md:17`: shipped «دانش‌آموزان من» vs plan AC wording «گروه‌های من»). Resolves the source_files and label-mismatch LOWs.
   - `counselor-roster.view.tsx:57` — page h1 now «پنل مشاور»; duplicate h1/h2 resolved.
3. **AC-1 tick** — still `[ ]` at plan line 91. Reported as an **acceptance gap, not a feature failure**: human evidence exists (manual_smoke timestamp, human confirmed the two sections render separately, unmixed). The Orchestrator owns the tick.

### Command exits (reviewer, single run)

| Command | Exit |
| --- | --- |
| `pnpm typecheck` | 0 |
| `pnpm lint` | 0 (same 5 pre-existing warnings, untouched files) |
| `pnpm test` | 0 — 65 files / 442 tests |
| `pnpm build` | 0 |

`pnpm dev` / Playwright not run (port 3000 wedged), per handoff.

### Residual findings

- LOW (residual) — `src/modules/advising/infrastructure/prisma-user-repository.ts:199-202`: the rewritten comment still claims building the `where` "throws PrismaClientValidationError"; `User.id` is a plain `String @id` (`prisma/schema.prisma:70`, no `@db.Uuid`), so `findUnique({ where: { id: "" } })` is type-valid and returns null. The comment's first clause now states the true reason (empty id can never match a row) — the fix landed in substance; the throw clause remains factually off. Cosmetic; no code behavior implied.
- Acceptance gap — AC-1 box unticked in the plan despite recorded human approval.

### Final counts

CRITICAL 0 · HIGH 0 · MEDIUM 0 · LOW 1 (residual, cosmetic) · INFO unchanged.

## Verdict (final)

**PASS.** No CRITICAL or HIGH remains. Round-1 CRITICAL (manual smoke) and HIGH (AC-1 evidence) are resolved by the recorded human approval; 3 of 4 LOWs fixed, 1 residual cosmetic LOW open. Remaining items for the Orchestrator, not the implementer: tick AC-1 in the plan (evidence: `approvals.manual_smoke` + human confirmation) and record `approvals.final`.
