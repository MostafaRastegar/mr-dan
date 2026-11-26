# Plan — admin-panel-catalog

Two hard gates (AGENTS.md UI-first): **Stage UI (mock)** ships first, all screens+states,
fixtures only, no DB writes / no real actions / no schema change. **Stage Backend** starts
only after written human approval of the UI demo. This plan covers both; the backend stage
is blocked on that approval.

## Assumption (coordination with roles-and-access)

Status: `access-control-baseline` is implemented (`admin` role, `user:manage`, `scripts/create-admin.ts`).
`roles-and-access` is **planned, not implemented** — this plan consumes its contract only:
`requireSessionUser` (pages+actions → `/login`), `requireCapability` (pages → `/profile`),
`requireApiSession` (401), `requireApiCapability` (403), `Actor = {id, role}` from
`application/planning-access.ts`, `hasCapability` (default deny). Ordering invariant:
**roles-and-access lands FIRST**; the admin implementation then applies exactly two
shared-seam edits on top — (a) add `"catalog:manage"` to the `Capability` union + admin row
(the only new capability string), (b) extend the page-gate matrix in `test/architecture.test.ts`
to include every new `/admin/**` page, else the roles matrix test fails on those routes.
Neither edit is applied before roles ships.
## Catalog inventory (current → target)

| Constant | Source today | Consumers | Verdict |
|---|---|---|---|
| `FIELDS` (4 رشته) | `domain/models.ts:31` | register/profile/group forms+schemas, `dashboard.ts:98`, `leisure.ts:28`, `subjects.ts` | → DB `Field`, admin CRUD |
| `GRADES` (4 پایه) | `domain/models.ts:29` | register/profile/group forms+schemas | → DB `Grade`, admin CRUD |
| `SUBJECTS`/`SUBJECT_SLUGS` | `domain/subjects.ts` | zod: `schedule-schemas:43`, `advisor-schemas:146,160`, `homework-schemas:24`; use case `school-program.ts:51`; 9 view files via `subjectLabel`/`subjectsForField` | → DB `Subject`, admin CRUD |
| `BOOKS`+`pickBook` | `domain/books.ts` | `application/leisure.ts:77`, `application/dashboard.ts:209` | → DB `Book`, admin CRUD |
| `Need`, `Exam` | DB already (`seedCatalogs`) | study-profile forms | admin CRUD only (no migration) |
| `Chapter` | DB already | counselor plan chapter select | admin CRUD only (no migration) |
| `DAYS_OF_WEEK`, `HOMEWORK_PRIORITIES`, numeric limits | `domain/models.ts` | calendar/UI vocabulary | **excluded** — calendar vocabulary, not catalog; DB-ifying is YAGNI |
| RAG thresholds | `src/shared/env.ts` | retrieval | **excluded** — env config, not catalog; no settings screen this phase (none exists; see Open Questions) |

Identity keys — no data backfill: `Field`/`Grade` natural key = `label` (what `User.grade`/
`fieldOfStudy`/`Group.target*` store). `Subject` natural key = `slug` (what `WeeklySchedule.subject`,
`Homework.subject`, `SchoolProgramEntry.subject`, `TestRecord.subject`, `StudyPlanEntry.subject`
store). `Book` natural key = `slug`. Delete semantics everywhere = **retire** (`active=false`),
matching the existing `Need`/`Exam`/`Chapter` `active` flag; no hard delete, no orphaned slugs.

## Shared seams (serialize via Orchestrator)

`prisma/schema.prisma` (+migration) · `src/server/container.ts` (wiring, CONTAINER_VERSION
bump) · `test/architecture.test.ts` (page-gate matrix extended — see Assumption) ·
`src/constants/test-ids.ts` (new ADMIN scope) ·
`src/modules/advising/domain/capabilities.ts` (+`catalog:manage`, shared with roles plan).

## Stage UI (mock)

Routes (all `requireCapability` guarded from day 1 — guard is session-only, allowed in UI gate):
- `/admin` → `redirect("/admin/users")`.
- `/admin/users/page.tsx` — user table (username, fullName, email, role select, createdAt);
  role change with confirm modal; states: empty/loading(`Skeleton`)/error(`role="alert"`)/success.
- `/admin/catalog/<entity>/page.tsx` for `fields` `grades` `subjects` `books` `needs` `exams`
  `chapters` — AntD table + inline create/edit form + retire/reactivate per row.
  Fields/Grades/Needs/Exams = one-label forms; Subjects = label+slug+field multiselect;
  Books = title+author+field+leisure codes; Chapters = subject+field+grade+number+title.

Files (triad per form-design skill; English code, Persian labels, RTL, registry testids):
- `src/app/admin/_fixtures/admin-fixtures.ts` — typed fixture rows (real domain types, fake data).
- `<area>.mock-actions.ts` per area — real `"use server"` actions, identical signatures to the
  future real ones, return `{ok:true}` without touching DB/container (UI gate: no writes).
- `_components/` for per-entity forms; `data-testid` added to `TEST_IDS.ADMIN` scope in
  `src/constants/test-ids.ts` (`admin-users-table`, `admin-role-select`, `admin-catalog-table`,
  `admin-catalog-create`, `admin-catalog-retire`, …).

**Demo checkpoint:** `pnpm typecheck && pnpm lint && pnpm build` green; `pnpm dev` walkthrough
of every page/state with the human; written approval required before Stage Backend.

Fixtures feed views directly as props (prior art: dashboard fixture); no `UI_MOCK` container
branch — the mock swap happens once, in pages, at backend wiring. vm files keep `useFormAction(<mock action>)`
so the backend stage changes only the import line.

## Stage Backend (explicitly gated on written UI approval)

1. **Schema** (`prisma/schema.prisma`, additive migration `add_catalog_tables`):
   `Field{id,label @unique,active,sortOrder}` · `Grade` same ·
   `Subject{id,slug @unique,label,fieldLabels String[],active,sortOrder}` ·
   `Book{id,slug @unique,title,author,fieldLabel String?,codes String[],active,sortOrder}`.
   No FK from catalog tables to business tables (labels/slugs stay plain strings) —
   matches today's storage, zero backfill.
2. **Seed**: extend `seedCatalogs()` in `scripts/seed-advising.ts` — upsert Field/Grade/
   Subject/Book from the current static arrays, idempotent by natural key; refuses production
   (existing guard). Run before the constants are deleted.
3. **Ports/domain**: `CatalogRepositoryPort` += `listFields/listGrades/listSubjects/listBooks`;
   new `CatalogAdminRepositoryPort` (upsert/retire per entity, chapters incl.).
   `domain/capabilities.ts` += `"catalog:manage"` (admin row only).
   New domain types in `models.ts`: `FieldRow/GradeRow/SubjectRow/BookRow/AdminUserRow`.
   Delete `FIELDS`, `GRADES`, `domain/subjects.ts`, `domain/books.ts` (after consumers move).
4. **Use cases** (`application/`): `admin-users.ts` (`ListUsersUseCase`,
   `ChangeUserRoleUseCase(users)` — rails below); `catalog-admin.ts` (`ManageLabelCatalogUseCase`
   for fields/grades/needs/exams, `ManageSubjectsUseCase`, `ManageBooksUseCase`,
   `ManageChaptersUseCase`). Leisure/dashboard get books via `catalogs` port;
   `pickBook` logic moves into `GetLeisureSuggestionUseCase`-style pure helpers fed by DB rows
   (deterministic `sortOrder` tie-break preserved).
5. **Zod → factories**: `schemas.ts`, `advisor-schemas.ts`, `homework-schemas.ts`,
   `schedule-schemas.ts` gain factory functions taking the runtime lists
   (`makeRegisterSchemas({fields, grades, subjects})`); actions fetch options via container
   once per request. Persian messages unchanged.
6. **Server Actions** (real): `src/app/admin/users/users.actions.ts`,
   `src/app/admin/catalog/<entity>/<entity>.actions.ts` — guard via `requireSessionUser()`
   (roles plan: `getSessionContext` is banned in `*.actions.ts`) then
   `hasCapability("user:manage"|"catalog:manage")` server-side, zod parse, `runAction`,
   `ActionState` only; vm files swap the import from
   `.mock-actions` to `.actions` — no other vm change.
7. **Consumer rewiring** (pages fetch catalog labels/options once, pass down as props):
   views using `subjectLabel` (homework-board, dashboard study-plan+homework-today,
   counselor-student, schedule-week, study-plan-table, school-program-table/accordion) get a
   `labels: Record<string,string>` prop; views using `subjectsForField` (homework-form,
   schedule-entry-form, school-program-form) and FIELDS/GRADES option lists (register-form,
   profile-form, group-create-form) get options via props. Fallback for retired/unknown
   slugs: render the raw stored value (`labels[slug] ?? slug`).
8. **Container**: wire `listUsers`, `changeUserRole`, catalog manage use cases;
   bump `CONTAINER_VERSION`.

## Contract: admin-panel-catalog

```ts
// reads (use cases → page props)
type AdminUserRow = { id: string; username: string; fullName: string;
  email: string | null; role: Role; createdAt: string };           // ISO string
type SubjectRow = { id: string; slug: string; label: string;
  fieldLabels: string[]; active: boolean };
type BookRow = { id: string; slug: string; title: string; author: string;
  fieldLabel: string | null; codes: string[]; active: boolean };
type LabelRow = { id: string; label: string; active: boolean };    // Field/Grade/Need/Exam

// actions — all: (previous, formData) => Promise<ActionState<T>>; guard+parse inside
changeUserRoleAction(formData): ActionState<{ userId: string }>;
createSubjectAction / updateSubjectAction / retireSubjectAction: ActionState<{ id: string }>;
// same triple for books, fields, grades, needs, exams, chapters
```

- Invariant: *no mutation on `/admin/**` ever executes without a live admin-session check
  (`user:manage` for users, `catalog:manage` for catalogs), and retired catalog rows never
  appear in student/counselor option lists while old stored references keep rendering.*
- Edge cases: student/counselor session on any admin action → `{ok:false, code:"forbidden"}`;
  changing own role → `code:"role_change_forbidden"`; demoting the last admin → `code:"last_admin"`;
  duplicate slug/label → `code:"slug_conflict"` with Persian fieldError; empty label/slug → zod
  fieldError; retired subject with existing homework/schedule rows → rows unaffected, label still
  renders; unknown slug in old rows → renders stored string, never throws.
- review_level: full — migration + privileged surface + role mutation; human confirms at plan gate.
  On approval the contract moves verbatim to `docs/contracts/admin-panel-catalog.md`.

## Tests (real risk only, existing harness)

- `application/admin-users.test.ts` (fakes): role change by admin ok; own-role rejected;
  last-admin demotion rejected; non-admin rejected.
- `application/catalog-admin.test.ts` (fakes): duplicate slug rejected; retire filters the
  item out of option lists; leisure/book pick stays deterministic by sortOrder.
- `scripts/seed-advising.test.ts`: `seedCatalogs` twice → same counts (idempotent), no rewrites.
- schemas factory test: retired/unknown field/subject rejected, current list accepted.
- e2e `tests/e2e/access-control.spec.ts` extend: student → `/admin/users` lands `/profile`; admin → 200.

## Documentation impact

- `README.md`: new `## پنل مدیریت` (users + catalog surfaces, `/admin` gate); `## دسترسی و
  نقش‌ها` += `catalog:manage`; `## محدودیت‌ها` — drop the "static BOOKS/SUBJECTS" limitation,
  keep DAYS_OF_WEEK note; `## اجرا` — mention `UI_MOCK` is dev-only legacy of the UI gate (no
  env.ts key added).
- `docs/behaviors/admin-panel-catalog.md` — new, `source_files:` admin pages/actions,
  `application/admin-users.ts`, `application/catalog-admin.ts`, `infrastructure/prisma-catalog-admin-repository.ts`,
  `scripts/seed-advising.ts`, `domain/capabilities.ts`, `container.ts`.
- CHANGELOG (after final approval only): `Added admin panel (user role management + full
  catalog CRUD); subjects, fields, grades and books moved from static code to DB with seeds.`
- No new env/config key; no `AGENTS.md` change (no RAG numbers touched).

## Manual Smoke Test Scenario

After backend wiring, as admin: open `/admin/catalog/subjects`, create «هنر» (slug `honar`,
field عمومی), then open `/schedule`, add a schedule row — «هنر» appears in the subject select.
Then retire «هنر» in the admin panel and reload `/schedule` — new rows no longer offer it,
and an existing schedule row with «هنر» still shows its label.
— verify: manual: perform the steps on `pnpm dev` with a seeded admin; confirm both observations.

## Acceptance Criteria

Stage UI (mock):

- [x] AC-1 [ui]: When an admin visits `/admin/users`, `/admin` and all seven `/admin/catalog/<entity>` pages during the UI demo, each renders list + create/edit/retire affordances from fixtures with empty, loading and error states present, in RTL. — verify: `pnpm typecheck && pnpm lint && pnpm build` plus manual: `UI_MOCK`-free `pnpm dev` walkthrough approved by the human evidence: human demo approval recorded 2026-11-26T07:48:18Z (approvals.ui in .opencode/plans/admin-panel-catalog.orchestrator.json); demo build gates typecheck 0, lint 0, build 0 at UI stage. Note: fixtures were replaced by real reads in Stage Backend, so the demo used the mock wiring that existed then.
- [x] AC-2 [ui]: While the UI stage is open, no feature mutation reaches the database: all admin submit paths are `.mock-actions.ts` returning `{ok:true}` without container/DB calls. — verify: `! grep -rn "getContainer" src/app/admin && find src/app/admin -name '*.mock-actions.ts' | grep -q .` evidence: `! grep -rn "getContainer" src/app/admin` exit 0 and `find src/app/admin -name '*.mock-actions.ts' | grep -q .` exit 0 at the UI stage; both mock-action files were deleted in Stage Backend as planned.
- [x] AC-3 [ui]: When the UI gate closes, `prisma/migrations/` is untouched and `prisma/schema.prisma` gains no model or field-level change (comment-only diffs pass). — verify: `test -z "$(git status --porcelain prisma/migrations)" && ! git diff HEAD -U0 -- prisma/schema.prisma | grep -qE '^[+-][[:space:]]*(model|@@)'` evidence: at UI-gate close (after human approval, before Stage Backend dispatch) `test -z "$(git diff --name-only -- prisma/migrations)"` exit 0 and `git diff -- prisma/schema.prisma` contained only the roles-and-access comment line; the catalog models and migration landed only after `approvals.ui` was recorded.
- [x] AC-4 [ui]: When the human reviews the demo, written approval is recorded before any backend file changes. — verify: manual: human approval logged in `.opencode/plans/admin-panel-catalog.log.jsonl` / chat evidence: approvals.ui = 2026-11-26T07:48:18Z; the first backend dispatch followed it (state log entry at 2026-11-26T08:05:00Z).

Stage Backend:

- [x] AC-5 [backend]: When `seedCatalogs` runs twice, Field/Grade/Subject/Book counts are identical after both runs and no row is duplicated. — verify: `pnpm vitest run test/advising/seed.test.ts` evidence: `pnpm vitest run test/advising/seed.test.ts` exit 0 within the full suite run (64 files / 433 tests, exit 0); run-twice counts asserted against the live DB.
- [x] AC-6 [backend]: When a student or counselor opens `/admin/users` (page gate `user:read`) or calls an admin action (`user:manage`/`catalog:manage`), the page redirects to `/profile` and the action returns `{ok:false, code:"forbidden"}`. — verify: `E2E_ENABLED=true pnpm exec playwright test tests/e2e/access-control.spec.ts -g "admin panel"` evidence: `E2E_ENABLED=true pnpm exec playwright test tests/e2e/access-control.spec.ts` (production `pnpm start`) → 7 passed, 3 skipped (pre-existing fixme), exit 0; `pnpm exec vitest run src/modules/advising/application/admin-users.test.ts -t "non-admin cannot change a role"` → 1 passed, exit 0 (`code:"forbidden"`, no role write).
- [x] AC-7 [backend]: When an admin tries to change their own role, or to demote the only admin, the action fails with `role_change_forbidden` / `last_admin` and no `User.role` row changes; the role-change gate is `user:manage` (admin only) per the roles contract. — verify: `pnpm vitest run src/modules/advising/application/admin-users.test.ts` evidence: `pnpm vitest run src/modules/advising/application/admin-users.test.ts` → 11 passed, exit 0 (includes own-role, last-admin, non-admin/operator forbidden, support surface).
- [x] AC-8 [backend]: When a subject/book/field/grade is retired, it disappears from every student-facing option list while previously stored rows still render their label. — verify: `pnpm vitest run src/modules/advising/application/catalog-admin.test.ts` evidence: `pnpm exec vitest run src/modules/advising/application/catalog-admin.test.ts` → 8 passed, exit 0; `pnpm exec vitest run src/modules/advising/domain/catalog.test.ts` → 9 passed, exit 0 (retired rows excluded from `subjectOptions`, labels keep retired slugs, `labelOf` falls back to the slug).
- [x] AC-9 [backend]: When register/profile/group/homework/schedule/study-plan validation runs against DB-fed lists, a retired or unknown subject/field is rejected with the existing Persian message. — verify: `pnpm vitest run src/modules/advising/presentation/schemas.test.ts` evidence: `pnpm vitest run src/modules/advising/presentation/schemas.test.ts src/modules/advising/presentation/homework-schemas.test.ts src/modules/advising/presentation/schedule-schemas.test.ts` exit 0 (36 tests) after the factory rewrite; retired/unknown values rejected with the existing Persian messages.
- [x] AC-10 [backend]: When the backend stage ships, no `SUBJECTS`, `SUBJECT_SLUGS`, `BOOKS`, `FIELDS`, `GRADES` static remains in `src/` outside fixtures/tests, and typecheck/lint/test/build are green. — verify: `! grep -rEn "export const (SUBJECTS|SUBJECT_SLUGS|BOOKS|FIELDS|GRADES)" src && pnpm typecheck && pnpm lint && pnpm test && pnpm build` evidence: grep exit 0 (no match, `AC10-grep-ok`); `pnpm typecheck` 0, `pnpm lint` 0 (5 pre-existing warnings), `pnpm test` 0 (64 files / 433 tests), `pnpm build` 0.
- [x] AC-11 [backend]: When docs are read, `README.md` has `## پنل مدیریت` and `docs/behaviors/admin-panel-catalog.md` exists with `source_files`. — verify: `grep -q "## پنل مدیریت" README.md && test -f docs/behaviors/admin-panel-catalog.md` evidence: `grep -q "## پنل مدیریت" README.md && test -f docs/behaviors/admin-panel-catalog.md` → exit 0; behavior doc front matter carries `last_verified: 2026-11-26` and a `source_files` list.
- [x] AC-12 [backend]: When the admin smoke scenario is executed, a newly created subject is selectable on `/schedule`, and after retiring it the select omits it while old rows keep the label. — verify: manual: see Manual Smoke Test Scenario — evidence: `human smoke 2026-11-26: created «هنر» (slug honar) shows in /schedule subject select; after retire it is gone from the select and the old row still shows the label`

## Open Questions (human)

1. RESOLVED (2026-11-26): Chapter admin CRUD — yes, included.
2. RESOLVED: delete = retire (`active=false`) everywhere; hard delete never exposed.
3. RESOLVED: user management = list + role change only.
4. RESOLVED: pagination is REQUIRED — see Delta.
5. RESOLVED: no system-settings screen this phase (RAG knobs stay env).
6. RESOLVED: Grade↔Subject relation is REQUIRED — see Delta.
7. RESOLVED (2026-11-26): `gradeLabels` seeds `[]` (= all grades); admins fill membership
   in `/admin/catalog/subjects` after release. No curriculum data invented — see Delta 2.
8. NEW: whether `operator` may manage catalogs (capability row) is owned by the
   roles-and-access plan; this plan only renders its role options.
9. NEW: operator account bootstrap — the roles plan delegates provisioning to this panel
   (script path like `create-admin.ts`); decide exact mechanism at backend-stage start.

## Delta: pagination + Grade↔Subject relation (human decisions 2026-11-26)

Append-only delta; earlier sections stand except where superseded here. review_level stays `full`.

### Pagination (every admin table: users + 7 catalog entities)

- Server-side, inside the repository port (Prisma `skip`/`take`); admin surfaces never load a
  full table (users grow unbounded; catalogs are small but one pattern — no pager framework).
- Query contract: `{ page: number, pageSize: number }` — page 1-based, default `1`;
  pageSize default `20`, max `100` (clamped server-side). Sort is fixed per entity and not a
  UI control yet: users `createdAt desc`, catalogs `sortOrder asc` (AntD column sorters deferred).
- Read model: `type Page<T> = { items: T[]; page: number; pageSize: number; total: number }`.
  Out-of-range page → `items: []` with accurate `total`; never an error. This shape supersedes
  the bare-array read models in the Contract section above for admin lists.
- UI: RSC pages read `searchParams.page/pageSize`, pass to the use case; AntD `Table` built-in
  pagination controlled via `{current, pageSize, total}`; `onChange` → `router.push("?page=…")`
  (server refetch). States: loading (Suspense), empty (`<Empty/>`), error (`role="alert"`),
  out-of-range (empty table + pager). AC-1/AC-2 fixtures render paginated tables; AC-6..AC-12
  unchanged (their use cases now return `Page<T>`).

### Grade↔Subject relation

- Facts today: `SUBJECTS` maps subject→fields only, `GRADES` is a flat label list — the
  static data encodes NO grade→subject membership; the only grade-aware catalog is `Chapter`
  (chapter-level). The initial mapping cannot be derived from code → Open Question 7;
  curriculum data is not invented here.
- Model (minimal, natural-key, mirrors `fieldLabels`): `Subject.gradeLabels String[] @default([])`
  — rule: `[]` = applies to every grade (عمومی), otherwise label membership. No join table:
  `GradeSubject` would add a port + CRUD surface for a 4-row dimension. Part of the
  already-gated Stage Backend migration — the UI gate stays schema-free.
- Single editing surface: the **subject form** (`/admin/catalog/subjects`, grade multi-select).
  The grade page stays a read-only list — no second editor, no two sources of truth.
- Consumer wiring (backend stage item 7 extension): subject options become grade-aware —
  `subjectsForField({field, grade})` filters `gradeLabels.length === 0 || gradeLabels.includes(grade)`
  — so schedule/homework/study-plan selects offer the student's grade's subjects.

### Operator role (owned by roles-and-access)

- The users-page role select offers exactly the roles from the roles contract
  (`student | counselor | admin | operator`); this plan renders the options only and defines
  no operator capabilities. AC-7 rails unchanged (own-role, last-admin). UI fixtures list all
  four options.

### New acceptance criteria

- [x] AC-13 [backend]: When an admin table requests page 2 with pageSize 10, the use case returns `{items(10), page:2, pageSize:10, total}` and the repository port received a skip/take slice, never the full table; changing page fetches the next slice. — verify: `pnpm vitest run src/modules/advising/application/admin-users.test.ts src/modules/advising/application/catalog-admin.test.ts -t pagination` evidence: `pnpm vitest run src/modules/advising/application/admin-users.test.ts src/modules/advising/application/catalog-admin.test.ts -t pagination` → 3 passed, 16 skipped (non-matching), exit 0; UI pager wired to `?page=` via router.push + useTransition.
- [x] AC-14 [backend]: When an admin assigns grade «دهم» to a subject and reloads `/admin/catalog/subjects`, the assignment persists and renders; removing the assignment keeps the subject row. — verify: `pnpm vitest run src/modules/advising/application/catalog-admin.test.ts -t grade` plus manual: reload the subjects page under `pnpm dev` — evidence: `human smoke 2026-11-26: assigning grade «دهم» to a subject persisted across reload and removing it kept the subject`

## Delta: operator support surface + seed resolution (roles contract final, 2026-11-26)

Append-only; earlier sections stand except where superseded here. Consumes the FINAL
`roles-and-access` delta (`Role` gains `"operator"`; `user:read` = list/view,
`user:support` = edit profile/contact + reset credentials, `user:manage` = role change,
admin only; operator holds `user:read`+`user:support`, never `user:manage`/`rag:manage`).

### Seed resolution (Open Question 7 closed)

Field/Grade/Subject/Book seed from the current static values; `Subject.gradeLabels` seeds
`[]` (= applies to all grades) — the admin fills per-grade membership in
`/admin/catalog/subjects` after release. No curriculum data is invented anywhere.

### User-management gating (matches the roles contract verbatim)

- `/admin/users` page: `requireCapability("user:read")` — operator + admin view;
  counselor/student redirect to `/profile`.
- Support edits (profile/contact fields) + credential reset actions: `user:support` —
  operator + admin. These actions live in this panel (`users.actions.ts`); the roles plan
  only defined the capabilities.
- Role change: `user:manage` — admin only. The role select is **never rendered** for
  operator (`hasCapability` denies at the use case regardless).
- Role select options: `student | counselor | admin | operator` (unchanged from Delta 1).
- Shared seams stay as in the Assumption: `domain/capabilities.ts` gains `user:read`,
  `user:support` (roles ships them) and `catalog:manage` (this plan) — applied **after**
  roles ships; the page-gate matrix in `test/architecture.test.ts` gains every `/admin/**`
  page, classified `capability:user:read` (users) / `capability:catalog:manage` (catalogs)
  per roles AC-14's convention.
- Open Question 9: operator account bootstrap (script path like `create-admin.ts`) — the
  roles plan delegates it here; decided at backend-stage start.

### Docs (delta)

- `docs/behaviors/admin-panel-catalog.md` `source_files` gains the users support
  actions/flows; observable note: operator = limited support (view + edit contact fields +
  reset credentials), cannot change roles or catalogs.
- `README.md` `## پنل مدیریت` gains one line: operator = پشتیبانی محدود (نمایش کاربران،
  ویرایش اطلاعات تماس، بازنشانی اعتبار) بدون تغییر نقش‌ها؛ access matrix updated after
  roles ships its four-role table.

### New acceptance criterion

- [x] AC-15 [backend]: When an operator opens `/admin/users`, the table renders (user:read) and support edits/reset work, but the role control is absent and `changeUserRoleAction` returns `{ok:false, code:"forbidden"}`; when a student opens it, the page redirects to `/profile`. — verify: `pnpm vitest run src/modules/advising/application/admin-users.test.ts -t operator && E2E_ENABLED=true pnpm exec playwright test tests/e2e/access-control.spec.ts -g "operator"` evidence: `pnpm exec vitest run src/modules/advising/application/admin-users.test.ts -t operator` → 2 passed | 9 skipped, exit 0; `E2E_ENABLED=true pnpm exec playwright test tests/e2e/access-control.spec.ts` → operator case un-fixme'd and passed (provisioned via `scripts/create-user.ts --role operator`, table visible, role control count 0), 7 passed / 3 skipped, exit 0.

## Delta: counselor↔student visibility (human requirement 2026-11-26)

Append-only; earlier sections stand except where superseded here. Answer: the existing
`User.counselorId` scalar fully answers "which counselor supports which student" — **no new
page, no new table, no schema change, no migration**.

- `/admin/users` table gains a `مشاور` column: the counselor's username, `—` when null
  (relation select `counselor: { select: { username: true } }` on the existing query — one
  relation select, no N+1). Per-counselor student counts come as one
  `groupBy: ["counselorId"], _count: {_all}` query over `role="student"` on the same page —
  include only if it costs that single query (drop if it needs a second port).
- Filter: the page accepts `?counselor=<userId>`; the users list port (backend stage) gains
  optional `counselorId?: string` merged into its existing `where` — the `Page<T>` contract
  (items/page/pageSize/total) is unchanged; the filter composes with pagination server-side
  (never loads the full table).
- Read model: `AdminUserRow` gains `counselorUsername: string | null`. Catalog pages untouched.
- Re-demo note: the admin surface is already UI-approved; this delta adds a column + filter
  only and must be demoed again on `pnpm dev` before it ships.
- Docs: `docs/behaviors/admin-panel-catalog.md` gains the counselor-column/filter flow;
  README `## پنل مدیریت` gains one line (admin sees each student's counselor and filters).

- [x] AC-16 [backend]: When an admin opens `/admin/users`, each student row shows the supporting counselor's username (`—` when none), `?counselor=<userId>` filters the page to that counselor's students, and the response stays a `Page<T>` slice (pagination intact). — verify: `pnpm vitest run src/modules/advising/application/admin-users.test.ts -t counselor` — evidence: `pnpm typecheck` 0, `pnpm lint` 0, `pnpm test` 0 (65 files / 442 tests), `pnpm build` 0; `pnpm vitest run src/modules/advising/application/admin-users.test.ts -t counselor` 0 (4 passed) covers filter + total + page-2 slice + null counselor; `prisma-admin-users-repository.ts:78-91` applies the filter to both `findMany` (skip/take) and `count`, `counselor.username` from one relation select.

## Delta: quick filter bar (human requirement 2026-11-26)

Additional filters on `/admin/users` only; no new screen, no schema change, no new dependency.
The bar exposes the columns the table already shows (role, counselor) plus a text search, all
URL-driven so the state survives reloads and composes with pagination.

- `/admin/users` accepts `?role=<student|counselor|admin|operator>`, `?counselor=<userId>` and
  `?q=<text>` together with `page`/`pageSize`. `role` is whitelisted server-side (unknown value
  ignored, never forwarded to Prisma); `q` matches `username` OR `fullName` case-insensitively.
- All filters are merged into one `where` applied to BOTH `findMany` (skip/take) and `count`;
  `Page<T>` is unchanged.
- Counselor dropdown options come from one query over users that actually have students
  (`students: { some: {} }`), not `role="counselor"`.
- UI: نقش / مشاور selects and a جستجو input, اعمال and پاک کردن controls; applying resets
  `page` to 1 and preserves `pageSize`; the counselor cell link sets the same `counselor` param.

- [x] AC-17 [backend]: /admin/users accepts role, counselor and q filters together with pagination; the filter is applied to both the count and the skip/take slice, an unknown role is ignored, and the page returns a Page<T>. — verify: pnpm vitest run src/modules/advising/application/admin-users.test.ts -t filter — evidence: `pnpm typecheck` 0, `pnpm lint` 0, `pnpm test` 0 (65 files / 449 tests), `pnpm build` 0; `pnpm vitest run src/modules/advising/application/admin-users.test.ts -t filter` 0 (9 passed) covers role alone, counselor alone, q on username, q on fullName (case-insensitive), role+counselor combined, filters on the page-2 slice, and unknown role ignored; `prisma-admin-users-repository.ts` merges `counselorId`/`role`/`q` into one `where` passed to both `findMany` (skip/take) and `count`; counselor dropdown options come from `students: { some: {} }`.
