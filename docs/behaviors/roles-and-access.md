---
last_verified: 2026-11-26
source_files: src/server/advising-guards.ts, src/modules/advising/domain/models.ts, src/modules/advising/domain/capabilities.ts, src/modules/advising/application/planning-access.ts, src/modules/advising/application/groups.ts, src/app/(advising)/layout.tsx, src/app/(advising)/dashboard/page.tsx, src/app/(advising)/counselor/students/page.tsx, src/app/(advising)/counselor/students/[studentId]/page.tsx, src/modules/advising/presentation/schemas.ts, src/app/(advising)/advising.actions.ts, src/app/(advising)/budget/budget.actions.ts, src/app/(advising)/counselor/students/[studentId]/study-plan.actions.ts, src/app/(advising)/counselor/students/students.actions.ts, src/app/(advising)/dashboard/dashboard.actions.ts, src/app/(advising)/homework/homework.actions.ts, src/app/(advising)/nutrition/nutrition.actions.ts, src/app/(advising)/profile/study-profile.actions.ts, src/app/(advising)/schedule/schedule.actions.ts, src/app/(advising)/schedule/school-program.actions.ts, test/architecture.test.ts
---

# Behavior: roles and access

## What users can do now

Every account logs in as one of four roles: student, counselor, admin or
operator. Students and counselors use the planning, nutrition and leisure pages
they already had. Admins keep the knowledge and API panels. A new operator
account can view the user directory and support users, but cannot change roles
or touch RAG. No page exists for the directory or support actions yet; the
capabilities are published for the admin panel that will use them.

## How it behaves

- When `test/architecture.test.ts` runs, every `src/app/**/page.tsx` is
  classified by an exact page-gate matrix (public / auth-redirect / session /
  capability:<x>); a new page missing from the matrix or a stale entry fails CI.
- When a page is reached, it calls the guard its class demands, so an unguarded
  page fails CI instead of shipping.
- When any `*.actions.ts` under `src/app` is inspected, none calls
  `getSessionContext`; all resolve the session with `requireSessionUser()`.
- When `assertCounselorOfStudent` runs, the student's own counselor passes, an
  admin who is not the counselor-of-record throws `ForbiddenError`, an unknown
  student throws `ForbiddenError`, and a student or operator role throws
  `ForbiddenError`.
- When capabilities are inspected, `plan:write` is held only by counselor and
  admin.
- When `toRole` reads `"operator"` it returns operator; unknown strings still
  become student.
- When `registerSchema` receives `role:"operator"` or `role:"admin"`, parsing
  fails; registration mints only student and counselor.
- When a logged-in student opens `/counselor/students` or
  `/counselor/students/<id>`, the browser lands on `/profile` and no roster
  markup renders.
- When capability checks run for operator: `user:read` and `user:support` are
  true; `user:manage` and `rag:manage` are false.
- When `groups.ts` is inspected, it imports the single `Actor` type from
  `planning-access.ts`; no local copy exists.
- When the operator signs in, the `(advising)` nav shows only `/profile`; their
  own profile is editable like every login role.
- Edge: unknown or expired session cookie behaves as anonymous (`/login` on
  pages, 401 on APIs). Edge: a corrupted `role` string degrades to student, never
  to counselor, admin or operator. Edge: an admin that is not the student's
  counselor-of-record lands on `/profile`, not an error screen.
- Not verified yet: AC-7 manual smoke of the admin/foreign-student and
  own-counselor navigations (requires human approval on a live server).

## Capability table (explicit rows, no inheritance)

| Capability | student | counselor | admin | operator |
|---|:-:|:-:|:-:|:-:|
| `profile:read`, `profile:write` | yes | yes | yes | yes |
| `schedule:*`, `homework:*`, `budget:*`, `nutrition:*`, `leisure:read` | yes | yes | yes | no |
| `group:manage`, `student:assign`, `plan:write` | no | yes | yes | no |
| `rag:manage` | no | no | yes | no |
| `user:read` | no | no | yes | yes |
| `user:support` | no | no | yes | yes |
| `user:manage` | no | no | yes | no |

Canonical rule: capabilities gate the verb; ownership gates the row. Admin
carries every counselor capability but not counselor-of-record
relationships, so `assertCounselorOfStudent`, `assertPlanRead` and
`assertPlanWrite` still require `student.counselorId === actor.id` or
`actor.id === ownerId`. `user:read` lists and views users, `user:support` edits
profile/contact fields and resets credentials, `user:manage` changes a role and
stays admin-only.

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
| `/admin/knowledge`, `/api-docs` | `capability:rag:manage` |

The only access-gating check of the session user's role in `src/app/**` is
`dashboard/page.tsx` redirecting counselor (not admin, not operator) to
`/counselor/students`. Non-gating `role ===` comparisons (for example the
profile form deciding which fields a student sees) are presentation only.

Future operator-support pages classify under `capability:user:read` in the
matrix; the admin panel extends the matrix with those entries.

## What it does NOT do

- No `catalog:manage` capability and no `/admin/**` page; that is the admin
  panel feature.
- Operator provisioning now lives in `scripts/create-user.ts --role operator`
  (added by the admin panel feature); the baseline itself has no operator UI.
- No schema change and no migration: `role` stays `String`.
- No admin oversight read of arbitrary students' plans (open question, default
  no).
- No user directory UI and no support-edit UI yet; the capabilities are
  declared and deny-tested only.
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

## README

The root `README.md` §«احراز هویت و پروفایل» lists the four roles, and
§«دسترسی و نقش‌ها» states the canonical rule, carries the operator column in
the access matrix, and links this document.
