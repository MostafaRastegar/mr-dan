---
last_verified: 2026-11-26
source_files: prisma/schema.prisma, scripts/seed-advising.ts, scripts/create-user.ts, src/modules/advising/domain/catalog.ts, src/modules/advising/domain/catalog.test.ts, src/modules/advising/domain/models.ts, src/modules/advising/domain/ports.ts, src/modules/advising/domain/capabilities.ts, src/modules/advising/application/catalog-admin.ts, src/modules/advising/application/catalog-options.ts, src/modules/advising/application/admin-users.ts, src/modules/advising/presentation/schemas.ts, src/modules/advising/presentation/advisor-schemas.ts, src/modules/advising/presentation/homework-schemas.ts, src/modules/advising/presentation/schedule-schemas.ts, src/modules/advising/infrastructure/prisma-catalog-admin-repository.ts, src/modules/advising/infrastructure/prisma-admin-users-repository.ts, src/modules/advising/infrastructure/prisma-catalog-repository.ts, src/server/container.ts, src/app/admin/page.tsx, src/app/admin/users/page.tsx, src/app/admin/users/users.actions.ts, src/app/admin/_components/users-table.view.tsx, src/app/admin/_components/users-table.vm.tsx, src/app/admin/_components/catalog-configs.ts, src/app/admin/_components/catalog-manager.view.tsx, src/app/admin/_components/catalog-manager.vm.tsx, src/app/admin/catalog/fields/page.tsx, src/app/admin/catalog/grades/page.tsx, src/app/admin/catalog/subjects/page.tsx, src/app/admin/catalog/books/page.tsx, src/app/admin/catalog/needs/page.tsx, src/app/admin/catalog/exams/page.tsx, src/app/admin/catalog/chapters/page.tsx, src/app/(advising)/advising.actions.ts, src/app/(advising)/homework/homework.actions.ts, src/app/(advising)/schedule/schedule.actions.ts, src/app/(advising)/schedule/school-program.actions.ts, src/app/(auth)/auth.actions.ts, test/architecture.test.ts, tests/e2e/access-control.spec.ts
---

# Behavior — admin panel and catalog

## What users can do now

An administrator gets a panel with a paginated user directory and seven
catalog editors (fields, grades, subjects, books, needs, exams, chapters).
They can create rows, edit them, and retire or reactivate them; nothing is ever
hard-deleted. Subjects, fields, grades and books that students and counselors
pick in forms now come from the database, so retiring a row removes it from
those option lists while rows already saved keep showing their stored label.
Operators get read-only access to the user directory plus support actions, but
cannot change roles or touch the catalog.

## How it behaves

- When an admin opens `/admin`, they are redirected to `/admin/users`.
- When any role opens a panel page, the page gate decides: anonymous → `/login`;
  student/counselor → `/profile`; operator → `/admin/users` renders, every
  `/admin/catalog/*` page redirects to `/profile`; admin → 200.
- When an admin creates, edits, retires or reactivates a catalog row, the change
  is persisted and the table refetches; retiring sets `active=false` and never
  deletes the row.
- When a retired subject/book/field/grade exists, it is absent from every
  student-facing option list, but a previously saved row that references it
  still renders its label (`labels[slug] ?? slug`, never an error).
- When a form value is not in the active DB catalog, validation rejects it at
  the zod boundary with the existing Persian field message; the use cases no
  longer carry their own slug allow-list.
- When a subject declares no `fieldLabels`, it is offered for every field; no
  `gradeLabels` means every grade. Membership lists narrow the options.
- When a learner has no field, only `fieldLabels: []` (عمومی) subjects are
  offered. Grade-based narrowing only applies to a declared grade.
- When an admin changes a role, their own role changes are rejected
  (`role_change_forbidden`) and demoting the last admin is rejected
  (`last_admin`); no `User.role` write happens in either case.
- When an operator opens `/admin/users`, the table renders (`user:read`) and
  support edit/reset works (`user:support`), but the role control is not
  rendered and `changeUserRoleAction` returns `{ok:false, code:"forbidden"}`.
- When any list page is requested beyond its last page, the table is empty and
  the pager still shows the accurate total; it is never an error.
- When an admin opens `/admin/users`, each row shows the student's counselor
  username in the «مشاور» column; a student with no counselor shows `—`. The
  counselor name links to `/admin/users?counselor=<id>`, which returns only that
  counselor's students as a normal `Page<T>` slice (filter applied to the query
  and the count, so pagination and `total` are correct); the filter bar shows the
  active values, «پاک کردن» returns to the unfiltered page, and paging keeps the
  filter.
- When an admin uses the filter bar above the table, نقش / مشاور / جستجو are
  sent as `role`, `counselor` and `q` query params and applied server-side to
  both the count and the `skip/take` slice. `q` matches username OR full name
  case-insensitively; an unknown `role` is ignored; applying resets `page` to 1
  and keeps `pageSize`; «پاک کردن» returns to `/admin/users` with no params; the
  مشاور dropdown lists only users who actually have students.
- When a new subject is created in `/admin/catalog/subjects`, it becomes
  selectable on `/schedule`; after retiring it, the select omits it while old
  rows keep the label.
- When `seedCatalogs` runs twice, counts are identical and no row is duplicated
  (natural-key upserts, never rewriting an existing row).
- When provisioning an account, `scripts/create-user.ts <username>` defaults to
  `admin`, `--role` accepts `student|counselor|admin|operator`, an existing user
  is promoted by role only (password hash untouched), and a new user's generated
  password is printed once. It refuses `NODE_ENV=production`.

### Edge cases

- Empty catalog list: the table renders the empty state; create still works.
- Counselor filter with no students: empty table with `total: 0`, not an error.
- Out-of-range page: empty items with correct `total`.
- Forbidden action: `{ok:false, code:"forbidden"}` with no write.
- Unknown stored slug: falls back to the raw slug instead of throwing.

## What it does NOT do

- No hard delete; no bulk actions; no audit trail of catalog edits.
- No system-settings screen; RAG knobs stay in env.
- Role change is the only user mutation besides support contact edit and
  credential reset.
- `DAYS_OF_WEEK` and homework priorities remain code vocabulary, not catalog
  rows.
- No per-user RAG ownership.

## Files touched

See `source_files` above.

## Verification

- `pnpm exec prisma migrate status` — schema in sync.
- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` — all exit 0.

## Notes

- `test/architecture.test.ts` narrowed the page-triad check to pages that import
  a local `./*.vm` module, because the shared `_components/catalog-manager.tsx`
  is widgetized outside the route directory. The rule stays strict for every
  non-admin route: all 13 local-UI pages must still import a sibling `.vm` with
  a matching `.view`, and the page-gate matrix still lists every `/admin/**`
  route with its capability.
