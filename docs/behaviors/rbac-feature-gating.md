---
last_verified: 2026-11-27
source_files: src/modules/advising/domain/capabilities.ts, src/modules/advising/application/planning-access.ts, src/modules/advising/application/schedule.ts, src/modules/advising/application/weekly-goal.ts, src/modules/advising/application/school-program.ts, src/modules/advising/application/study-plan.ts, src/server/container.ts, src/modules/advising/presentation/schedule-schemas.ts, src/app/(advising)/schedule/schedule.actions.ts, src/app/(advising)/schedule/page.tsx, src/app/(advising)/counselor/students/[studentId]/counselor-student.view.tsx, src/app/(advising)/dashboard/page.tsx, src/app/(advising)/layout.tsx, test/architecture.test.ts, src/app/(advising)/counselor/students/[studentId]/_components/schedule-editor.vm.tsx, src/app/(advising)/counselor/students/[studentId]/_components/schedule-editor.view.tsx
---

# Behavior: role-based feature gating (rbac-feature-gating)

## What users can do now

Every advising feature has a well-defined, enforced state per role
(student / counselor / admin / operator). The capability map in
`src/modules/advising/domain/capabilities.ts` is the single source of truth;
use cases enforce it server-side, and the UI shows no control a role may not use.

- Students own the personal planning surface: weekly schedule (read-only),
  homework, free-time budget, nutrition, leisure, plus weekly goal and
  school-program writes. They cannot write the weekly schedule.
- Counselors see their own students in `/counselor/students`, author each
  student's weekly schedule (via the editor on the student detail page), and
  read/write that student's study plan (entries + test targets).
- Admins keep the counselor set (knowledge/RAG, user directory, catalog) and
  gained a read-only capability, `supervise:read`, so they can open any
  student's detail page from `/admin/users` without any write control.
- Operators view the user directory and support users, but cannot change roles
  or touch RAG.

Key rule: there is no `schedule:write` capability. Weekly schedule authoring
is expressed by `plan:write` + counselor-of-record (`assertCounselorOfStudent`),
so no student, admin, or foreign counselor can write a schedule.

## How it behaves

- When a student calls `create/update/delete` schedule entry, the use case
  throws `ForbiddenError`; when the counselor-of-record calls it, it succeeds;
  a foreign counselor or admin throws `ForbiddenError`; an unknown entry throws
  `NotFoundError`; an overlapping entry throws `ScheduleConflictError` (409)
  after authorization.
- When `test/architecture.test.ts` runs, every nav link's `roles` array equals
  the exact capability-holder set (the `/dashboard` link is the only exception),
  so a future mismatch between capability and UI fails CI.
- When a counselor or admin navigates directly to `/homework`, `/schedule`,
  `/nutrition`, `/budget` or `/leisure`, the browser lands on `/profile`.
- When an operator navigates to `/dashboard`, the browser lands on `/profile`.
- When an admin opens a student's detail view from `/admin/users`, it renders
  read-only (schedule, school program, study plan, homework, nutrition, budget;
  no write controls); when admin submits a study-plan write, the use case
  returns `ForbiddenError`; a counselor-of-record keeps `canWrite: true`.
- When a counselor or admin calls weekly-goal toggle, school-program write or
  homework create, the action returns `ForbiddenError`; a student succeeds.
- When a student opens `/schedule`, the weekly grid shows no add/edit control
  while the school-program editor stays usable.
- When the diff is inspected, `prisma/` is untouched and guard signatures
  (`requireSessionUser`, `requireCapability`, `requireApi*`) are unchanged.
- `assertPlanRead` has one extra branch: a `supervise:read` holder (admin) may
  read any student's plan read-only.

## Out of scope (recorded deferrals)

1. Counselor read-only monitoring views (student homework/nutrition) on the
   student detail page for counselors too — future feature.
2. Audit column `createdBy` on schedule rows would need a migration — excluded
   by constraints; the authoring actor is not persisted today.
3. Student cannot read their own study plan today (counselor surface only;
   admin reads it via supervision) — unchanged; separate product decision.
4. Physically splitting route trees per role (`/student/**`, `/counselor/**`)
   is future work; guards are designed so the split is easy (capability map
   + reusable role-guard pattern), but not done now.