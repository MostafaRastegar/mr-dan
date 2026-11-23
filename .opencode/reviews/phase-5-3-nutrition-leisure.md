# Review — phase-5-3-nutrition-leisure

## Findings

CRITICAL 0 · HIGH 0 · MEDIUM 1 · LOW 4  (round 1) · after round-2 fixes: CRITICAL 0 · HIGH 0 · MEDIUM 0 · LOW 1 deferred

## Verdict

Pass with 0 CRITICAL, 0 HIGH. Round 1 found 1 MEDIUM and 4 LOW; the MEDIUM and 3 LOW were fixed and re-proven in round 2, 1 LOW is accepted as deferred (see below).

## A. Domain, authorization and persistence

CRITICAL 0 · HIGH 0 · MEDIUM 0 · LOW 2

Skills loaded: mro-code-review-checklist.

Hand-checked: m17/180/70/moderate/maintain → 1745 / 2705 / 2705; lose 1362; gain 2418; floor case → 1200; `mealDistribution(2705)` = 676/947/812/270 summing 2705; second save under lose → 2299. All agree with code and tests.

### [LOW] Dead export `isPlanningOwner`
src/modules/advising/application/planning-access.ts:53 — exported but referenced nowhere in `src/` or `test/` — delete the function.

### [LOW] Sole uniqueness proof can silently no-op
test/advising/nutrition-leisure-integration.test.ts:73 — `if (!live) return;` makes the only DB-level test of `@@unique([studentId, dayKey])` pass without running when Postgres is absent — verify the review/CI environment sets the live flag and record that output as evidence; otherwise the tick is unbacked.

## B. UI, boundary validation and documentation

CRITICAL 0 · HIGH 0 · MEDIUM 1 · LOW 2

### [MEDIUM, FIXED in round 2] Profile form emptied itself after a successful save
src/app/(advising)/nutrition/_components/physical-form.vm.tsx:25 — `form.resetFields()` ran beside `router.refresh()`, resetting to the pre-save `initialValues` (all null on a first save); rc-field-form applies `initialValues` only at mount, so the refreshed profile never re-seeded the fields and the six inputs went blank under a success banner. Fix: the call was removed and `router.refresh()` kept. Proof: `tests/e2e/advising-nutrition-leisure.spec.ts` now asserts `input#age` `17`, `input#heightCm` `180`, `input#weightKg` `70` after the save; 3/3 e2e pass on a fresh dev server.

### [LOW, FIXED in round 2] View duplicated domain constants
src/app/(advising)/nutrition/_components/physical-form.view.tsx — hardcoded `10/100`, `100/250`, `30/300`, `["male","female"]`, `["lose","maintain","gain"]`. Fix: now imports `AGE_RANGE`, `HEIGHT_RANGE`, `WEIGHT_RANGE`, `GENDERS`, `DIET_GOALS`.

### [LOW, DEFERRED] Contract evidence is aggregate-only
docs/behaviors/phase-5-3-nutrition-leisure.md — the contract's `verify:` commands are per-filter `pnpm test -t "<title>"`, while the recorded evidence is the whole-suite run (47 files / 233 tests) plus the per-route e2e. Accepted: the suite is a strict superset of every filtered run, and `.opencode/reviews/phase-5-3-nutrition-leisure.tests.log` records each command with its exit code.

### [LOW, RESOLVED by executed evidence] Sole uniqueness proof could silently no-op
test/advising/nutrition-leisure-integration.test.ts:73 — the DB-level test of `@@unique([studentId, dayKey])` returns early when Postgres is unreachable. Resolved: it was executed against live Postgres (2 tests, real durations, recorded in the gate log), so the criterion is backed by a real run rather than a skip.

### Checks that passed
Forms: `router.refresh()` on success, no `revalidatePath`/`revalidateTag` in either route, all `data-testid` from `TEST_IDS`, no dead controls. Actions: actor from the session, `redirect` outside `runAction`, zod issues mapped to Persian field errors, `AppError` messages incl. `profile_incomplete`. Schema: bounds and enum tuples imported from `domain/energy.ts`, inclusive min/max. E2E: gated skip, structure/visibility only, no Persian numerals, fails if a section disappears. Docs: README multipliers `1.2/1.375/1.55/1.725/1.9`, diet `0.85/1/1.1`, floor `1200`, split `25/35/30`, thresholds `900·2100 / 3·8 / 1500 / 600` all equal the domain constants; `docs/plan/phases.md` §۵.۳ has no exam residue; behavior doc `last_verified: 2026-11-23` with real `source_files`. No new dependency: `package.json` and `pnpm-lock.yaml` unchanged.

### [LOW, FIXED in round 2] Dead export `isPlanningOwner`
src/modules/advising/application/planning-access.ts:53 — exported and referenced nowhere. Fix: deleted.
