# Review — rbac-feature-gating (round 1)

**Verdict: PASS** — 0 critical, 0 high, 0 medium, 0 low.

**Scope reviewed:** 42 modified + 9 untracked files (Stage UI mock + Stage Backend), against
`.opencode/plans/rbac-feature-gating.md` (Contract + role×feature matrix) and AGENTS.md rules.

## Focus-area findings

1. **Authorization bypass (security) — none found.**
   - `schedule:write` removed from capability union and every `CAPABILITIES` row.
   - Counselor row = `profile` + `group:manage` + `student:assign` + `plan:write` only.
   - Admin holds `supervise:read` only; operator unchanged.
   - `assertPlanRead` final branch = `supervise:read` (admin read-only).
   - `GetStudentStudyPlanUseCase`: `canWrite` = counselor-of-record; admin → `false`; admin write → `ForbiddenError`.
   - Schedule Create/Update/Delete: load-first → `NotFoundError` → authorize against `existing.studentId` → mutate with `ownerId = existing.studentId`; conflict check after authorization.
   - `weekly-goal.ts`/`school-program.ts` → `goal:write`/`program:write`, remain self-writes via `assertPlanWrite`.
   - No `role ===` checks in use cases except sanctioned `dashboard/page.tsx` redirect.
   - `src/proxy.ts` untouched (cookie-presence only).

2. **Capability ↔ nav sync — PASS.** `test/architecture.test.ts` nav↔capability sync test present and green; `advising-nav.config.ts` rows match the matrix.

3. **Temporary seam removal — PASS.** `student-detail.read.ts` no longer branches on `actor.role === "admin"`; `supervise:read` capability path is the only seam; `supervision.fixture.ts` removed.

4. **Route handler thinness — PASS.** `schedule.actions.ts` and `dashboard/page.tsx` are thin (parse → use case → serialize).

5. **Types — PASS.** No `any`; new capabilities are union members; `UserRepositoryPort` injected into schedule use cases.

6. **Tests — PASS.** Deny assertions are `ForbiddenError`; conflict 409 after authorization; admin supervision `canWrite: false`; e2e direct-nav denials for counselor + admin on five student pages; nav sync test present.

7. **Docs — PASS.** README §«دسترسی و نقش‌ها» states both rules (counselor-authored schedule, admin read-only supervision); `docs/behaviors/roles-and-access.md` capability table updated; `docs/behaviors/rbac-feature-gating.md` exists with `last_verified` and `source_files`.

8. **Scope creep / leftovers — PASS.** `prisma/` untouched; no new dependency; no CHANGELOG write; no stray files beyond plan's Create list; `secret-audit` clean.

## Acceptance criteria status (AC-1 … AC-13)

| AC | Status | Evidence |
|---|---|---|
| AC-1 [ui] | confirmed (manual) | Stage UI demo approved by human 2026-11-27T05:10:00Z |
| AC-2 [backend] | confirmed | `pnpm test` — schedule.test.ts (student ×3 deny, counselor-of-record pass) |
| AC-3 [backend] | confirmed | schedule.test.ts (foreign counselor/admin deny, NotFound, conflict 409) |
| AC-4 [backend] | confirmed | capabilities.test.ts |
| AC-5 [backend] | confirmed | e2e `student pages denied` — 2 passed (counselor + admin, 5 pages) |
| AC-6 [backend] | confirmed | e2e `student schedule readonly` — 1 passed |
| AC-7 [backend] | confirmed | weekly-goal/school-program/homework tests |
| AC-8 [backend] | confirmed | study-plan.test.ts + e2e `admin supervision of a student is read-only` — 1 passed (after clearing stale session cookie in provisionAndLogin) |
| AC-9 [backend] | confirmed | e2e operator smoke (login → /profile, /dashboard → /profile) exit 0 |
| AC-10 [backend] | confirmed | architecture.test.ts nav↔capability sync |
| AC-11 [backend] | confirmed | `prisma/` and advising-guards.ts untouched (git status) |
| AC-12 [backend] | confirmed | behavior doc + README grep |
| AC-13 [backend] | confirmed | typecheck 0, lint 0, test 454/454, build 0 |

## Informational notes (non-blocking)

1. AC-8's e2e initially failed due to a stale student session cookie in `provisionAndLogin`; fixed by adding `page.context().clearCookies()` before login. Product code was correct.
2. Operator leg of AC-9 verified by code inspection (dashboard/page.tsx redirect) plus operator smoke.

## Recommendation

Ship. No blocking issues. All 13 acceptance criteria confirmed with evidence.