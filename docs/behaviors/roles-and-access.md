---
last_verified: 2026-11-27
source_files: src/server/advising-guards.ts, src/modules/advising/domain/models.ts, src/modules/advising/domain/capabilities.ts, src/modules/advising/application/planning-access.ts, src/modules/advising/application/groups.ts, src/modules/advising/application/schedule.ts, src/modules/advising/application/study-plan.ts, src/modules/advising/application/free-time.ts, src/modules/advising/application/weekly-goal.ts, src/modules/advising/application/school-program.ts, src/modules/advising/application/homework.ts, src/modules/advising/application/nutrition.ts, src/app/(advising)/advising-nav.config.ts, src/app/(advising)/layout.tsx, src/app/(advising)/dashboard/page.tsx, src/app/(advising)/counselor/students/page.tsx, src/app/(advising)/counselor/students/[studentId]/page.tsx, src/app/(advising)/counselor/students/[studentId]/student-detail.read.ts, src/app/admin/users/page.tsx, src/modules/advising/presentation/schedule-schemas.ts, src/app/(advising)/schedule/schedule.actions.ts, src/app/(advising)/schedule/page.tsx, test/architecture.test.ts
---

# Behavior: roles and access

## What users can do now

Every account logs in as one of four roles: student, counselor, admin or
operator. Students own the personal planning surface: weekly schedule (read),
homework, free-time budget, nutrition, leisure, plus weekly goal and school
program writes. Counselors see their own students in `/counselor/students`,
author each student's weekly schedule, and read/write that student's study plan.
Admins keep the counselor set (knowledge and API panels, user directory, catalog)
and gained one read-only capability, `supervise:read`, so they can open any
student's detail page from `/admin/users` without any write control. Operators
view the user directory and support users, but cannot change roles or touch RAG.

## How it behaves

- When `test/architecture.test.ts` runs, every `src/app/**/page.tsx` is
  classified by an exact page-gate matrix (public / auth-redirect / session /
  capability:<x>); a new page missing from the matrix or a stale entry fails CI.
- When `test/architecture.test.ts` runs, every nav link in
  `advising-nav.config.ts` that carries a `capability` is checked against
  `CAPABILITIES`: its `roles` array must equal the exact capability-holder set
  (the `/dashboard` link has no capability and is skipped). A link whose
  capability and roles disagree fails CI.
- When a page is reached, it calls the guard its class demands, so an unguarded
  page fails CI instead of shipping.
- When any `*.actions.ts` under `src/app` is inspected, none calls
  `getSessionContext`; all resolve the session with `requireSessionUser()`.
- When `assertCounselorOfStudent` runs, the student's own counselor passes, an
  admin who is not the counselor-of-record throws `ForbiddenError`, an unknown
  student throws `ForbiddenError`, and a student or operator role throws
  `ForbiddenError`.
- When a weekly schedule create/update/delete runs, the actor must be the
  student's counselor-of-record; update/delete load the entry first
  (`NotFoundError` when missing) and authorize against the entry's real
  `studentId`; the overlap check runs only after authorization.
- When capabilities are inspected, `schedule:write` exists on no role,
  `goal:write` and `program:write` are student-only, `supervise:read` is
  admin-only, and counselor's row is exactly profile + `group:manage` +
  `student:assign` + `plan:write`.
- When `toRole` reads `"operator"` it returns operator; unknown strings still
  become student.
- When `registerSchema` receives `role:"operator"` or `role:"admin"`, parsing
  fails; registration mints only student and counselor.
- When a counselor or admin opens `/schedule`, `/homework`, `/nutrition`,
  `/budget` or `/leisure`, the guard redirects to `/profile`; only a student
  gets 200.
- When a logged-in student opens `/counselor/students` or
  `/counselor/students/<id>`, the browser lands on `/profile` and no roster
  markup renders.
- When an operator opens `/dashboard`, the page redirects to `/profile`; a
  counselor redirects to `/counselor/students`.
- When an admin opens a student's detail page, `GetStudentStudyPlanUseCase`
  returns `canWrite:false` and the supervision sections come from the read use
  cases; a counselor-of-record gets `canWrite:true`.
- When capability checks run for operator: `user:read` and `user:support` are
  true; `user:manage`, `rag:manage` and `supervise:read` are false.
- When `groups.ts` is inspected, it imports the single `Actor` type from
  `planning-access.ts`; no local copy exists.
- When the operator signs in, the `(advising)` nav shows `/profile`, `/chat` and
  `/admin`; their own profile is editable like every login role.
- Edge: unknown or expired session cookie behaves as anonymous (`/login` on
  pages, 401 on APIs). Edge: a corrupted `role` string degrades to student, never
  to counselor, admin or operator. Edge: an admin that is not the student's
  counselor-of-record gets a read-only page through `supervise:read`, never a
  write control.

## Capability table (explicit rows, no inheritance)

| Capability | student | counselor | admin | operator |
|---|:-:|:-:|:-:|:-:|
| `profile:read`, `profile:write` | yes | yes | yes | yes |
| `goal:write`, `program:write` | yes | no | no | no |
| `schedule:read`, `homework:*`, `budget:*`, `nutrition:*`, `leisure:read` | yes | no | no | no |
| `group:manage`, `student:assign`, `plan:write` | no | yes | yes | no |
| `supervise:read` | no | no | yes | no |
| `rag:manage` | no | no | yes | no |
| `user:read` | no | no | yes | yes |
| `user:support` | no | no | yes | yes |
| `user:manage` | no | no | yes | no |

There is no `schedule:write` capability. Weekly schedule authoring is
`plan:write` plus counselor-of-record: every create/update/delete calls
`assertCounselorOfStudent` on the student id (create) or on the loaded entry's
`studentId` (update/delete). So a student, an admin who is not that student's
counselor, and any other counselor are all rejected with `ForbiddenError` and
zero writes. The overlap conflict is checked after authorization, so an
unauthorized caller never learns whether the slot is taken.

Canonical rule: capabilities gate the verb; ownership gates the row. Admin
carries every counselor capability but not counselor-of-record relationships,
so `assertCounselorOfStudent`, `assertPlanRead` and `assertPlanWrite` still
require `student.counselorId === actor.id` or `actor.id === ownerId`.
`assertPlanRead` has one extra branch: a `supervise:read` holder (admin) may read
any student's planning rows, and every write guard stays ownership-bound, so
supervision can never mutate. `user:read` lists and views users, `user:support`
edits profile/contact fields and resets credentials, `user:manage` changes a role
and stays admin-only.

## Page-gate matrix (enforced exact list)

| Page | Gate |
|---|---|
| `/` | public |
| `/login`, `/register` | redirect a live session to `/profile` |
| `/chat`, `/dashboard`, `/profile` | session |
| `/schedule` | `capability:schedule:read` |
| `/homework` | `capability:homework:read` |
| `/budget` | `capability:budget:read` |
| `/nutrition` | `capability:nutrition:read` |
| `/leisure` | `capability:leisure:read` |
| `/counselor/students`, `/counselor/students/[studentId]` | `capability:group:manage` |
| `/admin`, `/admin/users` | `capability:user:read` |
| `/admin/catalog/*` | `capability:catalog:manage` |
| `/admin/knowledge`, `/api-docs` | `capability:rag:manage` |

Two page-level role checks live inside `src/app/**`: `dashboard/page.tsx`
redirects counselor to `/counselor/students` and operator to `/profile`.
Non-gating `role ===` comparisons (for example the profile form deciding which
fields a student sees) are presentation only; the student self-pages are gated
by capability in the page matrix, not by a role string.

## What it does NOT do

- No counselor monitoring view of a student's homework/nutrition (future
  feature); counselors reach planning rows only through the study-plan use case.
- No persisted schedule author (`createdBy` would need a migration).
- Students cannot read their own study plan; it stays a counselor/admin-read
  surface.
- No schema change and no migration: `role` stays `String`.
- No per-user RAG ownership; any session still sees all RAG data.

## Files touched

- `src/modules/advising/domain/models.ts`
- `src/modules/advising/domain/capabilities.ts`
- `src/modules/advising/application/planning-access.ts`
- `src/modules/advising/application/groups.ts`
- `src/app/(advising)/advising.actions.ts`
- `src/app/(advising)/budget/budget.actions.ts`
- `src/app/(advising)/counselor/students/[studentId]/study-plan.actions.ts`
- `src/app/(advising)/counselor/students/students.actions.ts`
- `src/app/(advising)/dashboard/dashboard.actions.ts`
- `src/app/(advising)/homework/homework.actions.ts`
- `src/app/(advising)/nutrition/nutrition.actions.ts`
- `src/app/(advising)/profile/study-profile.actions.ts`
- `src/app/(advising)/schedule/schedule.actions.ts`
- `src/app/(advising)/schedule/school-program.actions.ts`
- `src/app/(advising)/layout.tsx`
- `src/modules/advising/application/planning-access.test.ts` (new)
- `src/modules/advising/domain/capabilities.test.ts`
- `src/modules/advising/domain/models.test.ts`
- `src/modules/advising/presentation/schemas.test.ts`
- `test/architecture.test.ts`
- `tests/e2e/access-control.spec.ts`
- `docs/behaviors/roles-and-access.md` (new)
- `docs/behaviors/access-control-baseline.md`
- `README.md`

## Verification

Baseline feature (2026-11-26):
```text
pnpm typecheck                                              exit 0
pnpm lint                                                   exit 0 (warnings only, pre-existing)
pnpm test                                                   exit 0 (61 files, 400 tests)
pnpm build                                                  exit 0
pnpm vitest run test/architecture.test.ts                   exit 0 (12 tests)
pnpm vitest run src/modules/advising/application/planning-access.test.ts  exit 0 (11 tests)
pnpm vitest run src/modules/advising/domain/capabilities.test.ts          exit 0
pnpm vitest run src/modules/advising/domain/models.test.ts                exit 0
pnpm vitest run src/modules/advising/presentation/schemas.test.ts         exit 0
E2E_ENABLED=true pnpm exec playwright test tests/e2e/access-control.spec.ts -g "student counselor pages"  exit 0 (1 passed)
```

`check-file` on the new test file reported no diagnostics. AC-7 is manual and
still pending human confirmation; the underlying rule is covered by the unit
test above.

The role×feature matrix change (no `schedule:write`, student-only `goal:write`
and `program:write`, admin `supervise:read`) is recorded with its own evidence in
`docs/behaviors/rbac-feature-gating.md`.

## README

The root `README.md` §«احراز هویت و پروفایل» lists the four roles, and
§«دسترسی و نقش‌ها» states the canonical rule, carries the operator column in
the access matrix, and links this document.
