---
last_verified: 2026-11-26
source_files: src/modules/advising/application/groups.ts, src/modules/advising/domain/models.ts, src/modules/advising/infrastructure/prisma-user-repository.ts, src/app/(advising)/counselor/students/page.tsx, src/app/(advising)/counselor/students/counselor-roster.vm.tsx, src/app/(advising)/counselor/students/counselor-roster.view.tsx, src/app/(advising)/counselor/students/[studentId]/page.tsx, src/constants/test-ids.ts, test/fakes/advising.ts, src/modules/advising/application/groups.test.ts, src/modules/advising/infrastructure/prisma-user-repository.test.ts, tests/e2e/access-control.spec.ts, README.md
---

# Roster separation

## What users can do now

A counselor opens «دانش‌آموزان من» and sees two separate groups of students: those
nobody has claimed yet («بدون گروه») and those the counselor already owns
(«دانش‌آموزان من»). A student owned by another counselor never appears in either
list, and the counselor cannot take that student over.

## How it behaves

- When a counselor opens `/counselor/students`, unassigned and owned students render in two separate sections, never in one table. The owned section's shipped title is «دانش‌آموزان من»; the plan's AC text calls it «گروه‌های من» — same section.
- When counselor B lists students after counselor A claimed a student, B's roster and assign pool exclude that student (the port query keeps `counselorId = B` or `counselorId = null`).
- When the roster use case runs, `myStudents` and `unassigned` are disjoint and their union equals the assignable query result.
- When a counselor assigns a student owned by another counselor, the action fails with `code:"forbidden"` and no `User.counselorId` or `User.groupId` changes.
- When the counselor has no students of either kind, each section shows its own empty state.
- Unassigning from a group keeps `counselorId`: ownership is permanent through the UI, so the student stays in «دانش‌آموزان من».

## What it does NOT do

- No transfer of a student between counselors; a foreign student is rejected, not moved.
- No admin visibility of which counselor owns which student (separate delta).
- No new database column, port method, migration, or second query.

## Files touched

- `src/modules/advising/domain/models.ts` — `StudentSummary.counselorId`.
- `src/modules/advising/infrastructure/prisma-user-repository.ts` — select + map `counselorId`; empty-id guard on `findById` / `findProfileById`.
- `src/modules/advising/application/groups.ts` — roster returns `{ groups, myStudents, unassigned }`.
- `src/app/(advising)/counselor/students/page.tsx`, `counselor-roster.vm.tsx`, `counselor-roster.view.tsx` — two sections plus assign pool.
- `src/app/(advising)/counselor/students/[studentId]/page.tsx` — `notFound()` on an empty id.
- `src/constants/test-ids.ts` — `ROSTER.UNASSIGNED_SECTION`.
- `test/fakes/advising.ts` — fake mirrors `counselorId`.
- `src/modules/advising/application/groups.test.ts`, `src/modules/advising/infrastructure/prisma-user-repository.test.ts`, `tests/e2e/access-control.spec.ts`.
- `README.md`.

## Verification

- `pnpm typecheck` — exit 0.
- `pnpm lint` — exit 0.
- `pnpm test` — 65 files / 442 tests, exit 0.
- `pnpm build` — exit 0.
- Manual screenshot of the two sections on `/counselor/students` is still pending human approval.
