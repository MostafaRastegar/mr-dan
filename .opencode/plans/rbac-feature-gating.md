# Plan — rbac-feature-gating (systematic role×feature enforcement)

Builds on `roles-and-access.md`, `access-control-baseline.md`, `counselor-roster-separation.md`
(all done). **No schema change, no migration, no new dependency.**

## Goal

Every advising feature gets a well-defined, enforced state per role
(student/counselor/admin/operator): the capability map is the single source of
truth, use cases enforce it server-side, and the UI shows no control a role may
not use. The human's two examples (student writing weekly schedule; counselor
seeing homework) are symptoms — the fix is the matrix below, not point fixes.

## Verified current state (read from source)

- `CAPABILITIES` grants student/counselor/admin identical `schedule:*`,
  `homework:*`, `budget:*`, `nutrition:*`, `leisure:read`
  (`src/modules/advising/domain/capabilities.ts:36-93`).
- `assertPlanWrite` = capability **and** `ownerId === actor.id`
  (`planning-access.ts:24-35`): all plan writes are self-writes only.
- Schedule writes are therefore student-self today; a counselor cannot author a
  student's schedule even though the human says counselor-authored is the intent.
  `Update`/`DeleteScheduleEntryUseCase` hardcode `ownerId = actor.id`
  (`schedule.ts:104,143`); `Create` accepts optional `studentId` but the
  self-ownership check rejects any other owner (`schedule.ts:61-62`).
- Nav hides `/schedule`, `/nutrition`, `/homework` from counselor
  (`(advising)/layout.tsx:49,56,63`), but the pages only check
  `requireCapability(...)` which counselor passes → reachable-but-wrong
  surfaces (counselor can create self-homework on `/homework`).
- Weekly-goal writes are gated on `schedule:write` (`weekly-goal.ts:67,89`);
  school-program writes too (`school-program.ts:48,80`).
- Page-gate matrix + nav exist in `test/architecture.test.ts:286-320`; use-case
  tests with fakes exist for schedule, homework, weekly-goal, school-program.
- `/dashboard` redirects only counselor (`dashboard/page.tsx:10`); operator
  direct-nav yields a nonsense empty dashboard.

## UI gate decision

**Stage UI (mock) applies** — this feature introduces genuinely new UI: the
counselor schedule-authoring editor and the admin read-only supervision view
(both on the student-detail surface, reusing the same view component with a
`canWrite` prop), plus state changes in an existing screen (student `/schedule`
becomes read-only for the weekly schedule, school program stays editable).
Classified as *authorization hardening + one new editor/supervision surface*,
not a mock rebuild of existing screens: only the editor and the supervision
sections are built in Stage UI; everything else gates existing controls.

## Role×feature matrix (the deliverable — lives in `capabilities.ts` + this table)

| Feature | student | counselor | admin | operator |
|---|---|---|---|---|
| `/dashboard` | own data | redirect `/counselor/students` (unchanged) | own (empty; unchanged) | **redirect `/profile` (new)** |
| `/profile` + study profile | own rw | own rw | own rw | own rw |
| `/schedule` — weekly schedule | **read-only (change)** | **no self page (change); authors per-student via editor** | **denied self page; reads via supervision only (change)** | denied |
| `/schedule` — school program | rw own (`program:write` new — human-confirmed) | denied (reads via supervision) | **denied; reads via supervision only (change)** | denied |
| `/homework` + homework plan | rw own | **denied (change)** | **denied self page; reads via supervision only (change)** | denied |
| `/nutrition` | rw own | **denied (change)** | **denied self page; reads via supervision only (change)** | denied |
| `/budget` free-time budget | rw own | **denied (change)** | **denied self page; reads via supervision only (change)** | denied |
| Weekly goal (dashboard toggles) | write own (`goal:write` new) | denied | **denied self write; reads progress via supervision (change)** | denied |
| `/leisure` | read | **denied (change)** | **denied (change)** — no stored per-student data to supervise | denied |
| Study plan (student detail) | unchanged (counselor surface) | rw own students | **read via supervision, `canWrite:false` (change)** | denied |
| Supervision entry (`/admin/users`) | — | — | **new: row link → read-only student detail view** | — |
| `/counselor/students` | denied | rw | rw | denied |
| `/chat`, admin, RAG, api-docs | unchanged (capability-gated as today) | | | |

Admin supervision principle (human decision 1): admin sees **all** entered data,
read-only, inside the student's detail surface — never through self-serve demo
pages. Counselor-side supervision already exists as the users-directory filter
(`users-table.view.tsx` links `?counselor=<id>`); no new counselor detail page.

Read paths stay relationship-gated (`assertPlanRead`: self or
counselor-of-student) with one supervision override: a `supervise:read` holder
(admin) may read any user's planning rows, read-only. Only *feature membership*
(page gate + self-write capability) changes.

## Design decisions

1. **Delete `schedule:write` from the capability union entirely.** Schedule
   authoring is expressed by `plan:write` + counselor-of-record
   (`assertCounselorOfStudent`); a dangling capability nobody may hold is a lie.
   Weekly-goal and school-program get their own honest capabilities
   (`goal:write`, `program:write` — plain data rows, student-only per human
   decision 1) instead of silently reusing a neighbour's capability.
2. **Enforcement moves, not adds:** schedule Create/Update/Delete switch from
   `assertPlanWrite` (self) to `assertCounselorOfStudent` (counselor-of-student);
   `ownerId` for Update/Delete becomes `existing.studentId` (entry is the truth).
3. **Nav/capability sync test:** each nav link's `roles` array must equal the
   exact capability-holder set — locks the matrix to the UI so a dead link or a
   reachable-but-rejected page fails CI. The dashboard link (no capability) is
   the only exception, alongside the sanctioned `role ===` redirect.
4. **`src/proxy.ts` stays cookie-presence-only** (no DB in proxy — boundary
   holds). Recommendation recorded for the future route split: a role check at
   the edge needs an edge-safe role source (signed role claim in the cookie);
   until then the `(advising)` layout + use cases are the enforcement points.
5. **Admin supervision, not admin demo (human decision 1):** admin loses every
   student-feature self-page and self-write (`schedule:read`, `homework:*`,
   `budget:*`, `nutrition:*`, `leisure:read`, `goal:write`, `program:write`
   leave the admin row) and gains `supervise:read` (admin-only): a capability,
   not a scattered `role ===` check, consumed by `assertPlanRead` and the
   student-detail read. Admin supervises inside the student's detail surface
   (read-only), entering from `/admin/users`. Admin keeps `group:manage`,
   `student:assign`, `plan:write`, `profile:*` and the admin-only set;
   `plan:write` stays declared but counselor-of-record checks still deny admin
   writes (published contract rule 1 stands). Admin `/dashboard` stays (own
   empty data, not in the human's lose-list).

## Contract: rbac-feature-gating

```ts
// src/modules/advising/domain/capabilities.ts
export type Capability =
  | "profile:read" | "profile:write" | "goal:write" | "program:write"
  | "group:manage" | "student:assign" | "plan:write"
  | "schedule:read" | "homework:read" | "homework:write"
  | "budget:read" | "budget:write" | "nutrition:read" | "nutrition:write"
  | "leisure:read" | "supervise:read" | "rag:manage"
  | "user:read" | "user:support" | "user:manage" | "catalog:manage";
// "schedule:write" is DELETED. rows: student −schedule:write +goal:write
// +program:write; counselor = profile:*, group:manage, student:assign,
// plan:write only; admin = counselor-set writes stay but student-feature SELF
// pages/writes are removed (−schedule:read, −homework:*, −budget:*,
// −nutrition:*, −leisure:read, −goal:write, −program:write) and admin gains
// "supervise:read" (admin-only). operator unchanged.

// src/modules/advising/application/planning-access.ts
export type PlanCapability = "profile:write" | "goal:write" | "program:write"
  | "homework:write" | "budget:write" | "nutrition:write";
// assertPlanRead(users, actor, ownerId) gains a final branch:
//   else if (hasCapability(actor.role, "supervise:read")) return;  // admin, read-only

// src/modules/advising/application/study-plan.ts
GetStudentStudyPlanUseCase.execute({actor, studentId})
  → read authorization: counselor-of-record (canWrite: true) OR supervise:read
    holder (canWrite: false) OR ForbiddenError. assertCounselorOfStudent remains
    the guard of every study-plan WRITE use case (admin denied writes).
// src/modules/advising/application/schedule.ts — authoring is counselor-of-student, never self:
CreateScheduleEntryUseCase.execute(input: { actor: Actor; studentId: string; … })
  → studentId now REQUIRED; authorize assertCounselorOfStudent(users, actor, studentId)
UpdateScheduleEntryUseCase / DeleteScheduleEntryUseCase.execute({actor, entryId, …})
  → findById → assertCounselorOfStudent(users, actor, existing.studentId) → mutate
```

- **Invariant:** *a weekly schedule row is written only by the student's
  counselor-of-record; homework, nutrition, budget, school program and weekly
  goal are student self-features; and admin reads any student's data only
  through the read-only supervision view, never a self-serve write surface.*
- Edge cases: student calls any schedule write → `ForbiddenError`; foreign
  counselor → `ForbiddenError`; admin → `ForbiddenError`; counselor passes
  `studentId = self` → `ForbiddenError` (not counselor-of-record of self);
  unknown `entryId` → `NotFoundError`; schedule overlap conflict still
  `ScheduleConflictError` (409), checked after authorization. Admin opens a
  foreign student's detail → renders read-only (no redirect); admin submits any
  student-detail action → `{ok:false, code:"forbidden"}` from the use case;
  operator/student on the student-detail page → `/profile` (no `group:manage`,
  no `supervise:read`).
- review_level: reviewed — authorization semantics change (deny-tighter), no
  auth-infrastructure, session, or migration change; supervision read needs no
  schema change (reads existing repositories). Human confirmed the matrix at
  the plan gate.

## Stage UI (mock) — first dispatch

1. New `schedule-editor.vm.tsx` + `schedule-editor.view.tsx` under
   `src/app/(advising)/counselor/students/[studentId]/_components/`: weekly
   grid + create/edit/delete entry modal reusing existing schedule-week form
   patterns, `data-testid` entries added to `src/constants/test-ids.ts`.
2. Admin supervision view reuses the counselor student-detail view component
   with a `canWrite` prop: same `counselor-student.view.tsx` renders read-only
   for admin (no study-plan forms, no schedule editor controls) plus three new
   read-only sections — homework list, nutrition overview, budget summary —
   fed by the existing read use cases through the same ports. Entry point: a
   view link on `/admin/users` student rows (`users-table.view.tsx`).
3. `counselor-student.view.tsx`: embed the editor section under the existing
   weekly-schedule read-only table (that table becomes the editor's data view).
4. `schedule-week.vm.tsx`/`view.tsx` on `/schedule`: split `canWrite` into
   `canWriteSchedule` (always false after Stage Backend) and `canWriteProgram`;
   mock stage drives both from props/fixture.
5. Mock source: fixture entries typed as `WeeklyScheduleEntry[]` via
   `test/fakes/*` behind `UI_MOCK=1` (types real, data fake). No DB write, no
   real Server Action, no schema/prisma change.
6. **Human demo checkpoint:** `pnpm dev` screenshots of (a) counselor editor on
   a student detail page, (b) student `/schedule` read-only, (c) admin
   supervision view of a student, read-only. Written approval before Stage
   Backend starts.

## Stage Backend

1. `capabilities.ts`: rows per matrix; delete `schedule:write`; add
   `goal:write`, `program:write`, `supervise:read`; strip the student-feature
   self-capabilities from the admin row; `planning-access.ts` PlanCapability
   union + `supervise:read` branch in `assertPlanRead`.
2. `study-plan.ts`: `GetStudentStudyPlanUseCase` read → counselor-of-record
   (`canWrite: true`) or `supervise:read` holder (`canWrite: false`); every
   study-plan write keeps `assertCounselorOfStudent`. Page passes `canWrite`
   through to the view (forms/editor render only when true).
3. `schedule.ts`: three use cases per Contract (inject `UserRepositoryPort` —
   container wiring in `src/server/container.ts`).
4. `weekly-goal.ts` → `goal:write`; `school-program.ts` → `program:write`
   (both remain self-writes via `assertPlanWrite`).
5. `presentation/schedule-schemas.ts`: optional→required `studentId` for the
   counselor create schema; `schedule.actions.ts` passes it through; editor VM
   calls these actions with the student's id. Student `/schedule` page drops
   its write-affordance wiring (dead code after the map change).
6. `dashboard/page.tsx`: `counselor → /counselor/students`,
   `operator → /profile` (student/admin proceed) — extends the sanctioned
   `role ===` exception, comment updated.
7. Supervision sections data: student-detail page calls the existing read use
   cases (`listHomework`, `getNutritionOverview`, `getDayBudget`) with the
   viewed `studentId` — admin passes via the `supervise:read` branch; read-only
   markup only. If a read use case lacks an `assertPlanRead` call today, add
   one (enforcement belongs in the use case).
8. `test/architecture.test.ts`: nav↔capability sync test (link `roles` ===
   capability holders, dashboard link excepted).

## Files

Create: `schedule-editor.{vm,view}.tsx`, supervision read-only sections
(`_components/supervision-*.view.tsx`), `docs/behaviors/rbac-feature-gating.md`.
Modify: `capabilities.ts`, `planning-access.ts`, `schedule.ts`, `study-plan.ts`,
`weekly-goal.ts`, `school-program.ts`, `container.ts`, `schedule-schemas.ts`,
`schedule.actions.ts`, `schedule/page.tsx`, `schedule-week.{vm,view}.tsx`,
`counselor-student.view.tsx`, `counselor/students/[studentId]/page.tsx`
(`canWrite` pass-through + supervision reads), `admin/_components/users-table.view.tsx`
(student-row supervision link), `(advising)/layout.tsx` (nav roles arrays:
`/schedule`, `/homework`, `/nutrition` become student-only), `dashboard/page.tsx`,
`test-ids.ts`, `test/fakes/advising.ts`, tests below, `README.md`,
`docs/behaviors/roles-and-access.md`.
Unchanged: `prisma/schema.prisma`, `src/proxy.ts`, guards signatures,
`homework.ts` writes (page capability change suffices); the nav↔capability sync
test locks the updated roles arrays.

## Tests

- `capabilities.test.ts`: matrix assertions — `schedule:write` gone;
  `homework:read/write` ∉ counselor; `goal:write`/`program:write` ∈ student
  only; admin holds none of schedule:read/homework/budget/nutrition/leisure/
  goal/program but holds `supervise:read`; counselor row = profile+group+
  assign+plan only; `hasCapability("operator","supervise:read")` false.
- `schedule.test.ts`: student write ×3 → `ForbiddenError`; counselor-of-student
  create/update/delete passes; foreign counselor → `ForbiddenError`; admin →
  `ForbiddenError`; conflict still 409 after authorization.
- `study-plan.test.ts`: admin reads a student's plan view (`canWrite:false`)
  via `supervise:read`; admin study-plan write → `ForbiddenError`;
  counselor-of-record read keeps `canWrite:true`; student/operator read →
  `ForbiddenError`.
- `weekly-goal.test.ts` / `school-program.test.ts`: student toggle/entry OK;
  counselor and admin self-write → `ForbiddenError`.
- `homework.test.ts`: counselor and admin self-create → `ForbiddenError`
  (capability rows); admin reads own student's homework via `assertPlanRead`
  supervision branch.
- `test/architecture.test.ts`: nav sync (matrix = UI).
- `tests/e2e/access-control.spec.ts`: counselor and admin direct-nav `/homework`,
  `/schedule`, `/nutrition`, `/budget`, `/leisure` → `/profile`; student
  `/schedule` renders no write control; admin opens a student detail from
  `/admin/users` → read-only view renders, no write controls.

## Manual Smoke Test Scenario

[manual] On `pnpm dev`: log in as a counselor, open own student's detail page,
add a schedule entry (e.g. Saturday 16:00–17:30) → it appears in the grid;
log in as that student, open `/schedule` → the entry renders with no add/edit
controls; log in as admin, open `/admin/users`, follow the student's
supervision link → the same data renders read-only (no editor, no action
forms); as the student, submit `createScheduleEntryAction` directly → nothing
is written. — verify: manual: perform the three logins and compare the pages;
student view shows the entry read-only, admin view shows it read-only.

## Documentation impact

- `README.md` §«دسترسی و نقش‌ها»: matrix summary sentence — weekly schedule is
  authored by the counselor for their student; homework/nutrition/budget/leisure
  are student features; admin has read-only supervision inside the student
  detail view (entry from `/admin/users`), no student self-pages.
- `docs/behaviors/rbac-feature-gating.md` (new): `last_verified` at ship;
  `source_files:` capabilities.ts, planning-access.ts, schedule.ts, study-plan.ts,
  weekly-goal.ts, school-program.ts, container.ts, schedule-schemas.ts,
  schedule.actions.ts, schedule/page.tsx, counselor-student.view.tsx,
  counselor/students/[studentId]/page.tsx, admin/_components/users-table.view.tsx,
  dashboard/page.tsx, layout.tsx, test/architecture.test.ts, schedule-editor,
  supervision sections.
- `docs/behaviors/roles-and-access.md`: capability table row updated
  (`schedule:write` removed; `goal:write`/`program:write`/`supervise:read`
  added; admin row stripped to supervision).
- No new env/config key. No `docs/contracts/` file (review_level reviewed — the
  Contract section above is the review unit).
- CHANGELOG draft (after approval only): `Enforced the role×feature matrix:
  weekly schedule is counselor-authored per student, homework/nutrition/budget/
  leisure/weekly-goal/school-program are student features, counselor lost
  self-plan capabilities, admin supervises read-only inside the student detail
  view, operator dashboard redirects to profile.`

## Acceptance Criteria

- [ ] AC-1 [ui]: When the human demos Stage UI (mock), the counselor student-detail page renders the schedule editor with mock entries, the student `/schedule` renders the weekly grid read-only, and the admin supervision view of a student renders read-only. — verify: manual: Stage UI demo screenshots approved by the human
- [ ] AC-2 [backend]: When a student calls create/update/delete schedule entry, the use case throws `ForbiddenError`; when their counselor-of-record calls the same, it succeeds. — verify: `pnpm vitest run src/modules/advising/application/schedule.test.ts`
- [ ] AC-3 [backend]: When a counselor who is not the student's counselor-of-record (or an admin) calls a schedule write, it throws `ForbiddenError`; unknown entry → `NotFoundError`; overlapping entry → `ScheduleConflictError`. — verify: `pnpm vitest run src/modules/advising/application/schedule.test.ts`
- [ ] AC-4 [backend]: When capabilities are inspected, `schedule:write` no longer exists, counselor holds only profile/group/assign/plan capabilities, `goal:write`+`program:write` are student-only, and admin holds `supervise:read` but none of schedule:read/homework/budget/nutrition/leisure/goal/program. — verify: `pnpm vitest run src/modules/advising/domain/capabilities.test.ts`
- [ ] AC-5 [backend]: When a counselor or admin navigates directly to `/homework`, `/schedule`, `/nutrition`, `/budget` or `/leisure`, the browser lands on `/profile`. — verify: `E2E_ENABLED=true pnpm exec playwright test tests/e2e/access-control.spec.ts -g "student pages denied"`
- [ ] AC-6 [backend]: When a student opens `/schedule`, the weekly grid shows no add/edit control while the school-program editor stays usable. — verify: `E2E_ENABLED=true pnpm exec playwright test tests/e2e/access-control.spec.ts -g "student schedule readonly"`
- [ ] AC-7 [backend]: When a counselor or admin calls weekly-goal toggle, school-program write or homework create, the action returns `ForbiddenError`/`{ok:false, code:"forbidden"}`; a student succeeds at all three. — verify: `pnpm vitest run src/modules/advising/application/weekly-goal.test.ts src/modules/advising/application/school-program.test.ts src/modules/advising/application/homework.test.ts`
- [ ] AC-8 [backend]: When an admin opens a student's detail view from `/admin/users`, it renders read-only (schedule, school program, study plan, homework, nutrition, budget; no write controls); when admin submits a study-plan write, the use case returns `ForbiddenError`; a counselor-of-record keeps `canWrite:true`. — verify: `pnpm vitest run src/modules/advising/application/study-plan.test.ts && E2E_ENABLED=true pnpm exec playwright test tests/e2e/access-control.spec.ts -g "admin supervision"`
- [ ] AC-9 [backend]: When an operator navigates to `/dashboard`, the browser lands on `/profile`. — verify: manual: log in as the provisioned operator and open `/dashboard`
- [ ] AC-10 [backend]: When the nav is inspected, every link's `roles` array equals the exact capability-holder set (dashboard link excepted), so a future mismatch fails CI. — verify: `pnpm vitest run test/architecture.test.ts`
- [ ] AC-11: When the diff is inspected, `prisma/` is untouched and guard signatures (`requireSessionUser`, `requireCapability`, `requireApi*`) are unchanged. — verify: `! git status --porcelain prisma | grep -q . && ! git diff --stat -- src/server/advising-guards.ts | grep -q .`
- [ ] AC-12: When docs are read, `docs/behaviors/rbac-feature-gating.md` exists with `source_files`, and README states the counselor-authored schedule rule and the admin supervision rule. — verify: `test -f docs/behaviors/rbac-feature-gating.md && grep -q "counselor" README.md && grep -q "supervision" README.md`
- [ ] AC-13 [backend]: When the full gate runs, typecheck, lint, test and build are green. — verify: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`

## Open questions (returned to the caller)

Resolved at the plan gate: admin supervision model (Decision 1) and
student-authored school program (Decision 2). Remaining recorded deferrals:

1. Counselor read-only monitoring views (student homework/nutrition) on the
   student-detail page for counselors too — future feature, not here.
2. Audit column `createdBy` on schedule rows would need a migration — excluded
   by constraints; the authoring actor is not persisted today.
3. Student cannot read their own study plan today (counselor surface only;
   admin reads it via supervision) — unchanged; separate product decision.
