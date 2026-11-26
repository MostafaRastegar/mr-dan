# Plan — counselor-roster-separation

Human requirement: «کاربران بدون گروه و با گروه باید از هم جدا شوند و در هم نمایش داده
نشوند… وقتی یک دانش‌آموز توسط مشاور انتخاب شد، به سایر مشاوران نباید نمایش داده شود. هر
مشاور باید به دانش‌آموز ریلیشن داشته باشد. و ادمین باید بداند هر مشاور چه دانش‌آموزهایی را
پشتیبانی می‌کند.» (Admin visibility is a separate delta on `admin-panel-catalog.md` — not here.)

## Verified current state (read from source, not assumed)

1. **Already-assigned students already disappear from other counselors' assignable lists.**
   `prisma-user-repository.ts:284-289` — `listAssignableStudents` queries
   `where: { role: "student", OR: [{ counselorId }, { counselorId: null }] }`; a student
   owned by another counselor matches neither branch. **Rule holds → regression test, no new code.**
2. **Assigned and unassigned students are mixed in one list today.** The use case returns one
   array (`groups.ts:103`) and the view renders it in a single «دانش‌آموزان» table
   (`counselor-roster.view.tsx:100-112`, `dataSource={students}`); the assign form receives the
   same mixed array (`view.tsx:96`). This is the defect this plan fixes.
3. **A student can belong to at most one counselor.** `counselorId` is a scalar on `User`
   (`schema.prisma:99`). Assigning a student owned by another counselor throws `ForbiddenError`
   (`groups.ts:76-78`) → surfaces as `{ok:false, code:"forbidden"}`; **no transfer feature**.
   Note: unassigning from a group never clears `counselorId` (`groups.ts:83-85`,
   `assignToGroup:323-325` spreads it only when defined) — ownership is permanent via the UI.
   `StudentSummary` does **not** carry `counselorId` today, so the view cannot split correctly
   by `groupId` alone (a counselor-owned student with `groupId = null` exists).

## Design (deletion bias — smallest correct diff)

- **Query split, not a new port method.** `listAssignableStudents` stays the only data call;
  the use case still makes one call. Add `counselorId: string | null` to `StudentSummary`
  (models.ts + the repository `select`/mapping, 2 lines). The view splits the same array:
  `counselorId === null` → section «بدون گروه», `counselorId === me`… the view doesn't know
  "me" — the use case splits instead: `CounselorRosterUseCase` returns
  `{ groups, myStudents, unassigned }` (one `partition` over the existing array — 3 lines).
  Read-model change only; no second query, no N+1.
- **View re-layout** (`counselor-roster.view.tsx`): «گروه‌های من» section unchanged; new
  «بدون گروه» section lists `unassigned` with the assign affordance; the students table shows
  `myStudents` only. Never mixed. Assign-form pool = `unassigned` + own students (matches the
  `groups.ts:76` guard exactly); the form keeps working for moving own students between own groups.
- **Reassignment:** assigning a foreign-counselor student keeps failing with
  `{ok:false, code:"forbidden"}` — documented, no transfer UI unless the human asks.
- No schema change, no migration, no new dependency, no new use case class.

## UI gate

The UI-first mock gate formally applies (layout change), but in demo-only form: the page's
data source and actions are unchanged and real, so there is nothing to mock — human approves
a `pnpm dev` screenshot of the two sections before merge; no backend work exists to gate.

## Files

Modify: `src/modules/advising/domain/models.ts` (StudentSummary + `counselorId`),
`src/modules/advising/infrastructure/prisma-user-repository.ts` (select + map, 2 lines),
`src/modules/advising/application/groups.ts` (partition into `myStudents`/`unassigned`),
`src/app/(advising)/counselor/students/counselor-roster.view.tsx` (three sections),
`src/app/(advising)/counselor/students/page.tsx` (pass-through if the prop shape changes),
`test/fakes/advising.ts` (fake mirrors the OR semantics + partition input),
`test/fakes/` roster fixtures, `src/constants/test-ids.ts` (`ROSTER.UNASSIGNED_SECTION`).

Shared seams (serialize): `domain/models.ts` (also touched by admin-panel delta's read models),
`test/fakes/advising.ts`, `test/architecture.test.ts` (no rule change expected).

## Tests (real risk only)

- `groups.test.ts`: foreign-owned student absent from another counselor's roster
  (regression for fact 1); roster partition = exactly `mine` + `unassigned`, no overlap;
  foreign reassignment → `ForbiddenError`.
- `test/advising/` integration: two counselors; assign to A; B's assignable list lacks the
  student; A's roster lists them.
- e2e (optional, existing spec file): two sections render separately on `/counselor/students`.

## Contract: roster-separation

- `CounselorRosterUseCase.execute({actor})` → `{ groups: GroupSummary[]; myStudents: StudentSummary[]; unassigned: StudentSummary[] }`.
- Invariant: *a student with `counselorId = X` never appears in counselor Y's roster or
  assignable pool (Y ≠ X), and the two sections are disjoint by construction.*
- Edge cases: student with `counselorId = me, groupId = null` → in `myStudents`, not
  «بدون گروه»; empty both → two empty states, not one mixed table; assigning foreign
  student → `code:"forbidden"`, zero writes.
- review_level: reviewed (read-model + view re-layout; no authz change, no migration).

## Documentation impact

- `README.md` counselor-roster sentence: two sections (بدون گروه / گروه‌های من), foreign
  students invisible, no transfer.
- `docs/behaviors/counselor-roster-separation.md` (new): `source_files:` groups.ts,
  prisma-user-repository.ts, counselor-roster.view.tsx, models.ts; `last_verified` at ship.
- CHANGELOG after approval: roster sections separated; unassigned pool isolated per counselor.

## Acceptance Criteria

- [x] AC-1: When a counselor opens `/counselor/students`, unassigned and grouped students render in two separate sections («بدون گروه» / «گروه‌های من») and never in one table. — verify: `E2E_ENABLED=true pnpm exec playwright test tests/e2e -g "roster sections"` plus manual: `pnpm dev` screenshot approval — evidence: human verification 2026-11-26T10:29:40Z (approvals.manual_smoke in .opencode/plans/counselor-roster-separation.orchestrator.json): after a clean dev restart the human opened /counselor/students and confirmed the two sections «بدون گروه» and «دانش‌آموزان من» render separately with no mixed table. Playwright case "roster sections render separately" exists in tests/e2e/access-control.spec.ts but was not executed (port 3000 was held by a stale next-server).
- [x] AC-2: When counselor B lists assignable students after counselor A assigned a student, B's roster and assign pool exclude that student (repository OR-semantics regression). — verify: `pnpm vitest run src/modules/advising/application/groups.test.ts -t "foreign"` evidence: `pnpm exec vitest run src/modules/advising/application/groups.test.ts -t "foreign"` → 2 passed | 10 skipped, exit 0; the live-DB integration test `listAssignableStudents returns own and unassigned students only` also passes inside `pnpm test`.
- [x] AC-3: When the roster use case runs, `myStudents` and `unassigned` are disjoint and their union equals the assignable query result. — verify: `pnpm vitest run src/modules/advising/application/groups.test.ts -t "partition"` evidence: `pnpm exec vitest run src/modules/advising/application/groups.test.ts -t "partition"` → 1 passed | 11 skipped, exit 0.
- [x] AC-4: When a counselor tries to assign a student owned by another counselor, the action fails with `code:"forbidden"` and no `User.counselorId`/`groupId` row changes. — verify: `pnpm vitest run src/modules/advising/application/groups.test.ts -t "reassign"` evidence: `pnpm exec vitest run src/modules/advising/application/groups.test.ts -t "reassign"` → 1 passed | 11 skipped, exit 0 (`counselorId` and `groupId` unchanged after the rejected assignment).
- [x] AC-5: When the feature ships, README documents the two sections and `docs/behaviors/counselor-roster-separation.md` exists with `source_files`. — verify: `grep -q "بدون گروه" README.md && test -f docs/behaviors/counselor-roster-separation.md` evidence: command exit 0; README documents «بدون گروه» / «دانش‌آموزان من» and the doc has `last_verified: 2026-11-26` + `source_files`.
