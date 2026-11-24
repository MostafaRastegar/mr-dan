# Plan — advisor-program: school program, student study profile, counselor weekly program

Status: **draft, round 5 (2026-11-24)** — round 5 encodes the human's four findings from the
combined UI demo: (1) a counselor must not land on the student dashboard, (2) the counselor page
must show every study-profile fact the student entered, (3) the plan row gains a DB-backed chapter
catalog plus a free-text note, (4) the sidebar splits by role. **The S3 artefacts on disk are built
but not approved**: the `## HUMAN DEMO CHECKPOINT` must be re-run (demo 3) before any backend
stage. Round 4's OQ-AP-4 ruling (school hours derived once, `User.otherOccupiedMinutes`) stands
unchanged. Amends `.opencode/plans/lite-edition.md` in two places only (its AC-1 and one
`## Spec deltas` item). Target: `.opencode/plans/advisor-program.md`.
Contract: `docs/contracts/advisor-program.md` (`review_level: full`).
Product source: the human's verbatim requirements, quoted in Decision 0 below
(there is no Persian spec document for this feature; `docs/plan/lite-edition.md`
is the *older* spec and stays untouched).

---

## Derived stack

`mro-project-stack` and `mro-data-model` are **still placeholders** (`unknown`,
`<SCHEMA_PATH>`). Both were loaded; every fact below was re-derived from the tree.

| Fact | Derived from |
|---|---|
| next 16.4.6, react 19.3.1, TS 7.0.2, tailwind 4.3.5, antd 6.7.1, prisma 7.10.1 (`PrismaPg`), zod 4, pnpm, vitest, Playwright, tsx | `AGENTS.md`, `package.json` |
| Schema of record | `prisma/schema.prisma` (228 lines, stage-0 lite deltas already applied) |
| Applied migrations | `…142653_phase_5_3_1_free_time_budget`, `…155516_lite_dashboard_settings` |
| Idempotent seed already exists and is documented | `scripts/seed-advising.ts` (upsert by `username`, dev-only guard, `pnpm tsx scripts/seed-advising.ts` in README line 23) |
| `dayjs` is not a dependency → no antd `TimePicker`; native `<Input type="time">` is the established pattern | `package.json`, `profile-form.view.tsx:124` |
| `test/architecture.test.ts` pins `withLocalUi` to exactly **12** and `page.tsx` count to `>= 13` | `test/architecture.test.ts:214,240` |
| The lite UI stage is already built (dashboard, sidebar, sleep/wake, block preview) and `pnpm typecheck/lint/build` are green | `git status`, `.opencode/plans/lite-edition.orchestrator.json` |
| `hw-board.view.tsx:97` links to `/budget`, which lite B2 deletes | `src/app/(advising)/homework/homework-board.view.tsx:97` |
| A counselor may currently **read** a student's rows but never write them (`assertPlanWrite` demands `ownerId === actor.id`) | `src/modules/advising/application/planning-access.ts:31` |
| `domain/free-time.ts` still holds the manual-budget helpers (`suggestFreeMinutes`, `dayCapacity`, `fitsCapacity`, `durationMessage`) | `src/modules/advising/domain/free-time.ts` |
| The sidebar is one flat `navGroups` array filtered **only** by capability, and a counselor holds `schedule/nutrition/homework/profile:read` — so hiding those links needs a role, not a capability | `src/app/(advising)/layout.tsx:20-74`, `domain/capabilities.ts:40-52` |
| `requireCapability` already redirects an unauthorized session to `/profile`, so a student on `/counselor/**` leaves by an existing path; no new guard is needed | `src/server/advising-guards.ts:48-53` |
| `User.grade` and `User.fieldOfStudy` already hold `GRADES`/`FIELDS` labels, and the subject catalog is static and field-scoped | `domain/models.ts:27-48`, `domain/subjects.ts` |
| `dashboard/page.tsx` is a 14-line server component on a fixture, so a role redirect costs 2 lines | `src/app/(advising)/dashboard/page.tsx` |
| `src/app/page.tsx` is still the static landing (lite B1 adds `/` → `/dashboard`), so a counselor gets `/dashboard` → `/counselor/students` as a second server hop | `src/app/page.tsx` |
| No new route in round 5, so `test/architecture.test.ts` stays at `withLocalUi = 13`, `pages >= 14` | `test/architecture.test.ts:214,240` |

**Skills loaded:** `mro-project-stack`, `mro-data-model` (both placeholders,
superseded by derivation), `mr-dan-architecture`, `mr-dan-frontend`, `ponytail` (ultra) in round 5;
also loaded in earlier rounds and still governing: `mr-dan-feature-workflow`, `mr-dan-persistence`,
`mr-dan-testing-parity`, `mro-behavior-docs`. Not loaded: `mr-dan-api` (no route
handler, no SSE), `mr-dan-devops` (no env/docker change), `mr-dan-rag`,
`mr-dan-ingestion` (out of scope). **No skill conflicts `AGENTS.md`.** The only
conflict is the placeholder content of the two `mro-*` skills, resolved by the
derivation table above.

---

## Sequencing

The exact order across both features. Every stage ends green on its own; nothing
is built on a table that does not exist yet; each feature has its own demo gate.

| # | Stage | Owner plan | Gate to leave it |
|---|---|---|---|
| S0 | settings data model (`WeeklyGoal`, sleep/wake, `eatenSlots`) | lite-edition | **DONE** |
| S1 | lite UI **amend v2** (mock): remove timer, subject on today's plan, homework minutes capture, read-only goal card, free-time breakdown — the dashboard half of this feature's UI | lite-edition | **DONE** (`approvals.ui` set; `typecheck`/`lint`/`build` 0, `pnpm test` 294 passed) |
| S2 | **HUMAN DEMO 1** — lite UI v2 | lite-edition | **DONE** (`approvals.ui` set for lite-edition) |
| S3 | advisor-program **Stage UI (mock), iteration 2** — round-5 findings: `/profile` study card, `/schedule` school-program section, `/counselor/students/[studentId]` with the full study profile, chapter rows + note, role-based sidebar, counselor `/dashboard` redirect | advisor-program | `pnpm typecheck && pnpm lint && pnpm build` |
| S4 | **HUMAN DEMO 3 (re-run)** — advisor-program UI v2; the S3 build on disk was never approved | advisor-program | `approvals.ui` set for advisor-program |
| S5 | advisor-program **Stage Backend**: migration C, catalog seed, ports/adapters, use cases, actions, domain changes, tests | advisor-program | full gate green |
| S6 | lite **B1**: real dashboard wiring (consumes S5's data), server redirect, real profile save | lite-edition | full gate green |
| S7 | lite **B2**: dump, drop `FreeTimeBudget`/`HomeworkPlanEntry`, delete `/budget` + `/leisure` + their verticals, drop the `/budget` link | lite-edition | full gate green |
| S8 | lite **B3** + advisor-program docs: README, behavior docs, contracts, phases, e2e | both | full gate + e2e green |

S1 cannot be skipped even though the lite UI already exists: the human reviewed
v1 and asked for changes, so the demo in S2 must show v2. S5 must precede S6
because B1's dashboard reads the study plan, the school program and the non-school
occupied minutes; S7 must
follow S6 because B1 is still wired to the pre-drop schema.

Round 5 adds **no new stage**: it adds work inside S3 (still UI-only, still no
schema/migration/action) and moves S4 to a re-run. The chapter catalog arrives in
S3 only as a fixture constant; the real `Chapter` table and its seed are S5 work
(AP-1), so no UI stage reads a table that does not exist.

Round 6 is the same shape: **S3 iteration 3 — the per-subject progress card
(AC-50) and the per-day school-program accordion (AC-3/AC-26) — precedes HUMAN
DEMO 4**; fixtures only, no schema, migration or action.

---

## Decision 0 — the human's requirements, encoded (not re-asked)

1. The student records the school's fixed weekly program: day + subject + hours,
   **no time range** (`یکشنبه ریاضی ۳ ساعت، فیزیک ۲ ساعت`), similar in shape to
   `/schedule`.
2. Student attributes: mock exams (catalog from the DB) + the تراز of the last two
   exams; non-school occupied hours per weekday (club, commuting, courses); virtual
   vs in-person school; supplementary tutoring courses (in-person/virtual) + their
   info; the school program from (1).
3. The counselor's weekly program is built from the school program + the student's
   need (کنکور / افزایش معدل / ترمیم معدل, catalog from the DB). The need is
   visible wherever goals are shown.
4. A completed homework records how long it took; the profile holds the student's
   average **daily** homework minutes, subtracted from free time.
5. Today's plan shows the subject; the timer is unnecessary and is removed; the
   weekly goal is derived from the counselor's program, not student targets.
6. **Round-5 findings (2026-11-24 UI demo), encoded in Decisions 9–10:** a counselor
   must not land on the student dashboard (`/counselor/students` is the counselor
   home); the counselor page must show every study-profile fact the student filled;
   a plan row carries DB-backed chapters and a note; the sidebar varies by role.

Non-negotiable human decisions already made: **free time = waking window −
school hours (derived from the school program) − non-school occupied hours per
weekday − average daily homework minutes** (no direct "free hours" input, and no
school time typed twice); **homework time = the manual minutes entered when
ticking complete** (no timer); **weekly goal = sum of the counselor's program**
(manual targets and ⏱️ removed).

## Non-goals

- No optimizer, no AI/proposal engine, no scheduler, no notifications. The
  counselor page is a hand-edited form, nothing more.
- No admin UI for the catalogs (needs, exams, chapters): they are seeded rows.
- No time-of-day on the counselor's program or on the school program (Decision 1).
- No pomodoro/timer anywhere; no streak/🔥; no Jalali calendar library.
- No new dependency, no new env var, no new config key.
- No change to `src/modules/rag/**`, `src/app/api/**`, ingestion or chat.
- No edit to `docs/plan/lite-edition.md` (the human's spec); the delta lives in the
  implementation plan.

---

## Decision 1 — three schedule-shaped concepts, and why only two are new

The tree already has `WeeklySchedule` (day + `startMinute`/`endMinute` + subject +
teacher + room). It is the **timed** weekly plan that `buildStudyBlocks` turns into
today's 50/10 blocks. The human asks for two shapes it cannot express:

| Concept | Owner | Shape | Why not `WeeklySchedule` |
|---|---|---|---|
| **School program** (`SchoolProgramEntry`) | student | `dayOfWeek`, `subject`, `minutes` — no clock | The human says the time range does not matter. Inventing a start time to satisfy `startMinute NOT NULL` + `@@unique([studentId, dayOfWeek, startMinute])` would store fabricated data and make two subjects on one day collide on the same minute. Own table. |
| **Counselor program** (`StudyPlan` + `StudyPlanEntry`) | counselor | header (`testsTarget`) + rows (`dayOfWeek`, `subject`, `minutes`) | A counselor cannot write `WeeklySchedule` (`assertPlanWrite` demands the owner, `planning-access.ts:31`) and should not: the student's timed plan is theirs. Separating "how much per subject per day" (counselor) from "when" (student) keeps each write path single-owner. |
| **Timed plan** (`WeeklySchedule`) | student | existing | Unchanged; it stays the only source of today's clock times and study blocks. |

**Invariant that prevents confusion:** the school program and the counselor
program never produce study blocks; the school program's minutes are the single
source of school hours and are derived into free time exactly once (Decision 2),
never typed a second time into the non-school occupied hours.

Trade-off accepted: three tables that all mention a weekday. The alternative
(one polymorphic table with a `kind` column) hides three different owners and
three different rules behind one nullable shape — rejected under `ponytail`
("no speculative abstraction"): each table is 6 columns and one unique index.

## Decision 2 — free time: school derived once, non-school occupied typed once

```
schoolMinutes(day) = Σ SchoolProgramEntry.minutes where dayOfWeek = day
freeMinutes(day)   = max(0, wakingMinutes − schoolMinutes(day)
                             − otherOccupiedMinutes[day] − homeworkAverageMinutes)
```

```ts
freeMinutesForDay({ wakeMinutes, sleepMinutes, schoolMinutes, otherOccupiedMinutes, homeworkAverageMinutes }): number
```

- **School hours are derived, never typed twice.** `SchoolProgramEntry` is the
  single source of school time and stays visible to the counselor; the day's
  school minutes are summed from it by `schoolMinutesForDay`.
- **`User.occupiedMinutes` is renamed to `User.otherOccupiedMinutes`** and holds
  **non-school occupied time only** (club, commuting, supplementary courses,
  other). The rename is part of migration C and carried into AC-12. Reviewers
  should read the old name as "everything including school" and the new one as
  "everything except school".
- `homeworkAverageMinutes` is one number for all days (the human said "average
  daily hours"), not seven.
- `wakingMinutes` keeps the lite definition: `((sleep − wake + 1440) % 1440) || 1440`
  with defaults 06:30/23:00 → 990.
- Legacy rows: a read of `otherOccupiedMinutes` shorter than 7 entries treats
  missing days as `0` (domain helper, not an adapter special case).
- `classMinutesForDay` survives untouched (lite B2 still needs it for nothing but
  its own tests; it is not part of the free-time formula any more).

## Decision 3 — the weekly goal becomes derived; two `WeeklyGoal` columns die

- `WeeklyGoal.studyMinutesTarget` and `WeeklyGoal.testsTarget` are **dropped** in
  this feature's migration. They exist only as the manual targets the human
  removed, the feature was never approved, and there is no production data; lite
  B2's dev-dump gate covers the same dev databases.
- Study target = `Σ StudyPlanEntry.minutes` of that student's plan.
- Tests target = `StudyPlan.testsTarget` (set by the counselor, default 300).
- `WeeklyGoal` keeps `testsDone` (atomic increment) and `completedBlocks` (tick
  keys). `goalProgress(goal, targets)` takes the two targets as an argument; a
  missing plan yields `{ studyMinutesTarget: 0, testsTarget: 0 }` and percent `0`
  (never `NaN`).
- `SetWeeklyGoalTargetsUseCase`, `WeeklyGoalRepositoryPort.upsertTargets` and the
  dashboard's two target inputs are deleted (lite amendment).

## Decision 4 — homework minutes without a modal

`Homework.spentMinutes Int?`.

- The dashboard row is `[عنوان] [مهلت] [InputNumber دقیقه] [انجام شد]`; «انجام شد»
  is enabled only when the minutes field is a positive integer (client) and the
  action rejects otherwise (server).
- One action, one signature change: `toggleHomeworkAction(id, completed, spentMinutes?)`
  → `SetHomeworkCompletionUseCase` requires `spentMinutes` 1..1440 when
  `completed === true` and writes `completedAt` + `spentMinutes` in a single
  `update`; unticking clears both.
- No `Drawer`/`Modal`: the `mr-dan-frontend` bottom-sheet rule never activates and
  the demo stays one tap shorter.

## Decision 5 — catalogs are seeded rows in the existing dev seed

- `Need` (3 rows: کنکور / افزایش معدل / ترمیم معدل — given verbatim by the human),
  `Exam` (product assumption, see OQ-AP-1) and, from round 5, `Chapter` (the human:
  «مثلاً فصل‌های ۱، ۲، ۳» must come from the DB) are ordinary tables with an
  `active` flag; `Need`/`Exam` also carry a unique `code`.
- Seeding extends the **existing** `scripts/seed-advising.ts` with
  `export async function seedCatalogs(): Promise<{ needs: number; exams: number; chapters: number }>`
  and one idempotent upsert per row: `upsert({ where: { code } })` for needs/exams,
  `upsert({ where: { subject_field_grade_number: … } })` for chapters (the compound
  unique is the key, so re-running never duplicates). No new file, no
  `prisma.config.ts` change, no `package.json` script (README line 23 already
  documents the command).
- Idempotency: `upsert` on the unique key; re-running keeps every row count and
  never deletes user data. The dev-only `NODE_ENV=production` guard already exists.
- Students never write catalogs; they only `select` active rows. Chapters are
  selected by the counselor, never by the student.
- The seed ships a small representative chapter set (ریاضی دهم فصل ۱..۳, فیزیک
  دوازدهم فصل ۱..۳, …) — a product assumption like OQ-AP-1, editable in the seed
  without a migration.

## Decision 6 — where the student attributes live

- **`/profile`, second card** (`profile/_components/study-profile-form.{vm,view}.tsx`):
  school mode, need, mock-exams switch, exam + تراز (last two), seven weekday hour
  inputs, average homework hours, supplementary courses list. No new route: the
  page already guards the session, already reads the profile, and `ProfileView` is
  already passed in.
- **`/schedule`, second section** (`schedule/_components/school-program-form.*`,
  `school-program-table.view.tsx`): the hours-only school program. No new route,
  matching the human's "similar in shape to `/schedule`".
- **`/counselor/students/[studentId]`** (new route, 1 new page): a read-only
  «مشخصات تحصیلی» block (school mode, mock-exams flag, last two exam results with
  name + تراز, the seven weekday non-school occupied hours, the average daily
  homework hours, the supplementary courses), the school program, the student's
  current timed `WeeklySchedule`, the weekly-goal progress against the plan, and
  the program editor. A `Drawer` on the roster
  page was rejected: a client component may not fetch (RSC data rule), so the
  drawer would need either an N+1 roster payload or a read Server Action; a page
  is the shape the architecture already supports.

## Decision 7 — mock source for the UI stage

- `/profile`: real read (`getProfile`) **merged** with one constant
  `study-profile.fixture.ts` holding the new fields + the need/exam options, because
  the columns do not exist before Stage Backend. Save is intercepted:
  `setSavedAt(true)`, no network write (same trick as `profile-form.vm.tsx:36`).
- `/schedule`: the school-program section receives an empty fixture list; "add"
  pushes into local `useState`, "delete" removes locally.
- `/counselor/students/[studentId]`: `counselor-student.fixture.ts` (school program,
  need, two taraz, plan rows) + `searchParams.demo` = `success|empty|loading|error`.
- `/dashboard` fixture gains `need`, plan-derived targets, school-program rows and
  otherOccupied/homework constants, blocks with `subject`. Free minutes are computed
  by the real `schoolMinutesForDay` + `freeMinutesForDay` so the demo shows the truth.
- All fixtures are deleted in Stage Backend. `test/fakes/*` is untouched.

## Decision 8 — today's plan shows the subject; the timer is gone

- `StudyBlock` gains `subject: string | null`; `buildStudyBlocks({ …, subject })`
  copies it. `studyBlockKey` stays `dayKey:startMinute:minutes`, so the lite
  stage-0 `completedBlocks` rows and invariant 3 are unaffected.
- The study-plan row renders `subjectLabel(block.subject)` + the time range +
  duration + one «تیک» control.
- `study-block-focus.{vm,view}.tsx`, `activeBlockKey`, `BLOCK_FOCUS_OPEN`,
  `BLOCK_COMPLETE` and lite Decision 4 are deleted (lite amendment S1).

## Decision 9 — role separation: one redirect and one nav matrix (round 5)

Human findings 1 and 4, encoded as decisions (not re-asked):

1. **A counselor never lands on the student dashboard.** `dashboard/page.tsx` keeps
   `await requireSessionUser()` and immediately
   `if (user.role === "counselor") redirect("/counselor/students");` before the
   fixture/use-case branch. Two lines, server-side, no new page. `redirect()` sits
   outside any `try/catch` (it throws `NEXT_REDIRECT`). No client `useEffect`: the
   rule is lite Invariant 8 / AC-38 restated for this route.
   - lite B1 later makes `/` → `/dashboard`; a counselor then takes two server hops
     (`/` → `/dashboard` → `/counselor/students`). Accepted: one more 307 costs
     nothing and keeps the role decision in a single file.
   - Admin keeps the dashboard: no human finding covers admin, and touching it is
     scope creep. Recorded as a non-goal, not an oversight.
2. **The sidebar is a role matrix, not a capability filter.** The layout currently
   filters links by capability, and a counselor holds `schedule:read`,
   `nutrition:read`, `homework:read` — so capability filtering cannot produce the
   human's counselor set. Add one optional `roles?: Role[]` field per `NavLink` and
   filter `(!link.roles || link.roles.includes(user.role))` in addition to the
   existing capability filter. The matrix, defined once in
   `src/app/(advising)/layout.tsx`:

   | Link | student | counselor | admin |
   |---|---|---|---|
   | داشبورد `/dashboard` (`nav-dashboard`) | ✓ | — | ✓ |
   | برنامه هفتگی `/schedule` (`nav-schedule`) | ✓ | — | ✓ |
   | تغذیه `/nutrition` (`nav-nutrition`) | ✓ | — | ✓ |
   | همهٔ تکالیف `/homework` (`nav-homework`) | ✓ | — | ✓ |
   | پروفایل `/profile` (`nav-profile`) | ✓ | ✓ | ✓ |
   | دانش‌آموزان من `/counselor/students` (`nav-students`) | — | ✓ | ✓ |

   The data-testid names come from the existing `TEST_IDS.NAV` registry; no new id.
   - **Ownership:** this file is lite AC-1's. The matrix is written **once**, by
     whichever plan reaches it first — round 5 puts it in S3 (the lite sidebar is
     already built and green), and lite AC-1 is amended to reference the matrix
     instead of listing a flat set. Lite's `## Stage UI (mock)` is otherwise
     unchanged.
   - Routes stay reachable by direct URL for a counselor (`/schedule` is guarded by
     `schedule:read`, which a counselor has). Hiding a link is UX; changing guards
     would be an access-control change the human did not ask for. Explicitly out of
     scope, recorded in `## Deferred / out of scope`.
3. **A student on `/counselor/**` already leaves through the existing
   not-authorized path**: `requireCapability("group:manage")` → `redirect("/profile")`
   (`advising-guards.ts:48-53`). No code change; one AC locks the behaviour in.

## Decision 10 — chapters: one catalog table, an id array per plan row (round 5)

Human finding 3: the counselor picks which chapters, they come from the database,
several per row, plus a note, and both must appear in the plan table.

- **Catalog shape:** `Chapter(id, subject, field, grade, number, title, active)`.
  `subject` is an existing `SubjectSlug`; `grade` is one of `GRADES`; `field` is one
  of `FIELDS` **or** the empty string meaning «applies to every field» (عمومی
  subjects such as ریاضی). Empty string, not `null`, because Postgres `UNIQUE`
  treats `NULL`s as distinct and the seed's idempotent upsert needs a real key.
  Why store `field` at all when `SUBJECTS[slug].fields` already encodes it: the
  general subjects are shared across fields, and their chapter lists differ per
  field (ریاضی دهم تجربی ≠ ریاضی دهم ریاضی). Storing it is the human's decision and
  keeps the invariant checkable in one place.
- **Row storage — decided: `StudyPlanEntry.chapterIds String[]` + `note String?`.**
  Trade-off in one line: an array is one column and resolves against the catalog the
  page already loads, but carries no foreign key; a join table would give FK
  integrity at the cost of a third table and delete+insert nested writes for
  reference data that is seed-only, never editable, and never deleted (`active`
  toggles instead).
  - Dangling ids are prevented by **one** check in `AddStudyPlanEntryUseCase`
    (every id must be an existing chapter whose `subject` equals the row's and
    whose `grade` matches the student and whose `field` is `""` or the student's
    field). The seed never deletes; the only delete path for chapters does not
    exist (catalog admin UI is a documented non-goal).
  - Reads resolve ids **without** an `active` filter, so deactivating a chapter
    later never blanks a saved plan row; a truly missing id renders
    «فصل نامشخص» instead of throwing.
  - Ponytail check: this mirrors the project's existing `String[]`-of-keys pattern
    (`WeeklyGoal.completedBlocks`, `MealPlan.eatenSlots`) and avoids a third
    write path; the join table can be introduced later behind the same port
    without touching the page.
- **Row edit model stays add/delete** (no update action): a counselor fixes a row
  by deleting and re-adding it, exactly as today. The unique key
  `[studentId, dayOfWeek, subject]` still holds, so two rows cannot differ only by
  chapters.
- **UI:** the add-row form gains a `Select mode="multiple"` whose options are
  filtered by the chosen subject plus the student's grade/field (options depend on
  the subject, read with `Form.useWatch("planSubject", form)` — no extra state), and
  an optional `Input.TextArea` note (trimmed, ≤ 200 chars). The table gains two
  columns: فصل‌ها («فصل ۱، ۲، ۳» via `formatChapterList`) and یادداشت.
  Chapters and the note are optional; with none selected the cell shows «—».
  Empty state per card names the missing part (finding 2), never a blank card.
- **Catalog source by stage:** S3 uses a `CHAPTERS: ChapterOption[]` constant inside
  the existing `counselor-student.fixture.ts` (deleted in S5, no new file); S5 adds
  the `Chapter` table, `seedChapters()` inside `seedCatalogs()` and
  `ChapterRepositoryPort`. So S3 reads no table that does not exist and S5 changes
  no UI contract.
- **Reuse over new presentation:** the counselor page renders read-only lines and
  its own compact tables, because the existing `/schedule` `school-program-table`
  view is route-private and requires delete handlers. It reuses
  `formatDuration`, `subjectLabel`, `DAYS_OF_WEEK`, `subjectsForField` and a new
  `formatChapterList` in `presentation/planning-format.ts` — no second formatter,
  no shared-kit extraction.
- **Out of scope:** chapter-level progress or per-chapter study time for the
  student; the dashboard keeps showing the subject only (Decision 8).

---

## Data model deltas

Migration C — `pnpm prisma migrate dev --name advisor_program` (one migration,
additive except the two `WeeklyGoal` drops):

```prisma
model Need {
  id     String @id @default(uuid())
  code   String @unique          // "konkur" | "afzayesh-moadel" | "tarmim-moadel"
  label  String                  // کنکور | افزایش معدل | ترمیم معدل
  active Boolean @default(true)
  users  User[]
}

model Exam {
  id      String @id @default(uuid())
  code    String @unique
  label   String
  active  Boolean @default(true)
  results StudentExamResult[]
}

model StudentExamResult {
  id        String   @id @default(uuid())
  studentId String
  student   User     @relation("StudentExamResults", fields: [studentId], references: [id], onDelete: Cascade)
  examId    String
  exam      Exam     @relation(fields: [examId], references: [id], onDelete: Cascade)
  taraz     Int      // 0..10000
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@unique([studentId, examId])   // re-saving an exam updates its تراز
  @@index([studentId, updatedAt])
}

model SchoolProgramEntry {
  id        String @id @default(uuid())
  studentId String
  student   User   @relation("StudentSchoolProgram", fields: [studentId], references: [id], onDelete: Cascade)
  dayOfWeek Int    // 0 = شنبه … 6 = جمعه (same convention as WeeklySchedule)
  subject   String // slug from domain/subjects.ts
  minutes   Int    // 15..720 — the single source of school hours (derived into free time)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@unique([studentId, dayOfWeek, subject])
}

model StudyPlan {
  id          String   @id @default(uuid())
  studentId   String   @unique
  student     User     @relation("StudentStudyPlan", fields: [studentId], references: [id], onDelete: Cascade)
  counselorId String   // who wrote it (audit only; no relation, matches Group.counselorId style)
  testsTarget Int      @default(300) // 0..2000
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  entries     StudyPlanEntry[]
}

model StudyPlanEntry {
  id         String @id @default(uuid())
  studentId  String
  plan       StudyPlan @relation(fields: [studentId], references: [studentId], onDelete: Cascade)
  dayOfWeek  Int
  subject    String
  minutes    Int    // 15..720
  chapterIds String[] @default([]) // Chapter.id list — validated in the use case, no FK (Decision 10)
  note       String?               // trimmed, ≤ NOTE_MAX
  @@unique([studentId, dayOfWeek, subject])
}

model Chapter {
  id      String  @id @default(uuid())
  subject String  // SubjectSlug from domain/subjects.ts
  field   String  // "" = applies to every field, else one FIELDS label
  grade   String  // one of GRADES
  number  Int     // 1..N
  title   String
  active  Boolean @default(true)
  @@unique([subject, field, grade, number])   // the idempotent seed's upsert key
}

model TestRecord {
  id        String   @id @default(uuid())
  studentId String
  student   User     @relation("StudentTestRecords", fields: [studentId], references: [id], onDelete: Cascade)
  subject   String   // SubjectSlug from domain/subjects.ts
  weekKey   String   // Saturday of the Iran week, "YYYY-MM-DD" (same key as WeeklyGoal)
  count     Int      @default(0)
  updatedAt DateTime @updatedAt
  @@unique([studentId, subject, weekKey])   // one counter per subject per week
}

model SupplementaryCourse {
  id            String @id @default(uuid())
  studentId     String
  student       User   @relation("StudentCourses", fields: [studentId], references: [id], onDelete: Cascade)
  title         String // 1..100
  mode          String // "in_person" | "virtual" (zod-validated, not a PG enum)
  weeklyMinutes Int?   // 15..1800
  createdAt     DateTime @default(now())
  @@index([studentId])
}
```

`User` gains:

```prisma
needId               String?
need                 Need?            @relation(fields: [needId], references: [id], onDelete: SetNull)
schoolMode           String?          // "in_person" | "virtual"
takesMockExams       Boolean?
otherOccupiedMinutes Int[]  @default([0, 0, 0, 0, 0, 0, 0]) // NON-school only, index = dayOfWeek
homeworkAverageMinutes Int?            // average DAILY school homework, 0..720
examResults          StudentExamResult[] @relation("StudentExamResults")
schoolProgram        SchoolProgramEntry[] @relation("StudentSchoolProgram")
studyPlan            StudyPlan?       @relation("StudentStudyPlan")
courses              SupplementaryCourse[] @relation("StudentCourses")
testRecords          TestRecord[]     @relation("StudentTestRecords")
```

`Homework.spentMinutes Int?`.
`WeeklyGoal` loses `studyMinutesTarget` and `testsTarget`.

Domain constants (no PG enums, matching `role`/`gender`/`dietGoal`):

```ts
export const SCHOOL_MODES = ["in_person", "virtual"] as const;   // labels حضوری / مجازی
export const TARAZ_MIN = 0; export const TARAZ_MAX = 10000;       // OQ-AP-2
export const OTHER_OCCUPIED_MAX = 720;  // 12h NON-school per weekday
export const HOMEWORK_AVERAGE_MAX = 720;
export const ENTRY_MINUTES_MIN = 15; export const ENTRY_MINUTES_MAX = 720;
export const SPENT_MINUTES_MAX = 1440;
export const NOTE_MAX = 200;                 // StudyPlanEntry.note
export const CHAPTERS_MAX_PER_ENTRY = 10;    // StudyPlanEntry.chapterIds.length
```

No index beyond the uniques: every read is by `studentId` (unique) or
`[studentId, …]` composite, plus the two `@@index` rows above for lists.

---

## Contract

Written to **`docs/contracts/advisor-program.md`** (the review unit); this section
is the summary. `review_level: full` — a migration touching `User` (auth-adjacent:
`passwordHash` lives there), two column drops, a new `Chapter` catalog table, a new
counselor-write path that crosses the existing ownership model, a route whose
behaviour now depends on the actor's role, and five new action paths.

### Routes

| Route | Guard | Behaviour | Stage |
|---|---|---|---|
| `GET /dashboard` | session | **A counselor is redirected server-side to `/counselor/students`** before any card renders; a student sees the existing mock dashboard | UI (redirect is real code) |
| `GET /profile` | session | Existing form unchanged; **second card** «مشخصات تحصیلی»: school mode, need, mock-exams switch, exam+تراز (last two), 7 weekday non-school occupied hours, average homework hours, supplementary courses (add/remove) | UI (fixture) → AP backend |
| `GET /schedule` | session | Existing timed table unchanged; **second section** «برنامهٔ ثابت مدرسه»: add/delete `(day, subject, hours)` rows, table shows hours only | UI (fixture) → AP backend |
| `GET /counselor/students/[studentId]` | `group:manage` + `student.counselorId === actor.id` | Read-only study profile (school mode, mock-exams flag, last two exam results with name + تراز, 7 weekday non-school occupied hours, average homework hours, supplementary courses), school program (hours only), the student's timed `WeeklySchedule`, weekly-goal progress against the plan; then the plan editor (header tests target + rows of day/subject/minutes/chapterIds/note + running weekly total) | UI (fixture) → AP backend |
| `GET /counselor/students` | unchanged | Roster gains a «برنامه» link per student row to the new page | UI |
| Sidebar (`layout.tsx`) | session | Link set is the role matrix in Decision 9 (one definition, filtered by `roles` **and** capability) | UI |

### Actions (`ActionState<T>`, `src/utils/app-error.ts`)

All actions re-resolve the session from the cookie, never accept `studentId` for
self-service writes, and derive Iran day/week keys server-side.

```ts
// src/app/(advising)/profile/profile.actions.ts   (new file)
updateStudyProfileAction(prev, formData): ActionState<{ userId: string }>
  // formData: schoolMode?, needId?, takesMockExams ("true"|"false"), otherOccupied0..otherOccupied6 (hours, 0..12), homeworkAverageHours?
saveExamResultAction(prev, formData): ActionState<{ examId: string; taraz: number }>
  // formData: examId (catalog id), taraz (0..10000) — upsert by (studentId, examId)
addCourseAction(prev, formData): ActionState<{ id: string }>
  // formData: title (1..100), mode ("in_person"|"virtual"), weeklyHours?
deleteCourseAction(id: string): ActionState<{ id: string }>          // scoped to the owner

// src/app/(advising)/schedule/schedule.actions.ts  (extend)
addSchoolProgramEntryAction(prev, formData): ActionState<{ id: string }>
  // formData: dayOfWeek (0..6), subject (slug), hours (0.25..12)
deleteSchoolProgramEntryAction(id: string): ActionState<{ id: string }>

// src/app/(advising)/counselor/students/[studentId]/study-plan.actions.ts  (new file)
saveStudyPlanHeaderAction(prev, formData): ActionState<{ studentId: string; testsTarget: number }>
  // formData: studentId (the page's student), testsHoursOrCount → testsTarget 0..2000
addStudyPlanEntryAction(prev, formData): ActionState<{ id: string; weeklyMinutes: number }>
  // formData: studentId, dayOfWeek, subject, hours, chapterIds[] (0..10, repeated field), note? (≤200)
  // chapterIds are sent as a JSON array string (same bridge as every other antd multi-select);
  // the use case validates every id against the student's subject/grade/field (Decision 10)
deleteStudyPlanEntryAction(prev, formData): ActionState<{ weeklyMinutes: number }>
  // formData: studentId, entryId

// src/app/(advising)/homework/homework.actions.ts  (signature change)
toggleHomeworkAction(id: string, completed: boolean, spentMinutes?: number): ActionState<{ id: string }>
```

`hours` fields are decimal strings (`"1.5"`), converted with one
`hoursToMinutes` helper in `presentation/time-value.ts` (already the boundary
converter home); ASCII `<Input type="number">`, `dir="ltr"`, step 0.25.

### Ports (`domain/ports.ts`)

```ts
interface CatalogRepositoryPort {
  listNeeds(): Promise<NeedOption[]>;
  listExams(): Promise<ExamOption[]>;
  findNeed(id: string): Promise<NeedOption | null>;   // active only
  findExam(id: string): Promise<ExamOption | null>;   // active only
}
interface ChapterRepositoryPort {
  /** Picker options: active chapters for one subject, narrowed to the student's grade/field when present. */
  listForSubject(input: { subject: string; grade: string | null; field: string | null }): Promise<Chapter[]>;
  /** Validation: every id that exists (active flag ignored) — the write path rejects any gap. */
  findByIds(ids: readonly string[]): Promise<Chapter[]>;
}
interface SchoolProgramRepositoryPort {
  listByStudent(studentId: string): Promise<SchoolProgramEntry[]>;
  create(input: NewSchoolProgramEntry): Promise<SchoolProgramEntry>;
  delete(input: { id: string; studentId: string }): Promise<void>;
}
interface StudyPlanRepositoryPort {
  findForStudent(studentId: string): Promise<StudyPlan | null>;   // with entries
  upsertHeader(input: { studentId; counselorId; testsTarget }): Promise<StudyPlan>;
  upsertEntry(input: NewStudyPlanEntry): Promise<StudyPlanEntry>;
  deleteEntry(input: { studentId: string; entryId: string }): Promise<void>;
}
interface StudentExamResultRepositoryPort {
  listRecent(studentId: string, take: number): Promise<StudentExamResult[]>;
  upsert(input: { studentId; examId; taraz }): Promise<StudentExamResult>;
}
interface SupplementaryCourseRepositoryPort {
  listByStudent(studentId: string): Promise<SupplementaryCourse[]>;
  create(input: NewSupplementaryCourse): Promise<SupplementaryCourse>;
  delete(input: { id: string; studentId: string }): Promise<void>;
}
// changed
interface HomeworkRepositoryPort {
  setCompletion(id: string, input: { completedAt: Date | null; spentMinutes: number | null }): Promise<HomeworkItem>;
}
// removed (Decision 3)
WeeklyGoalRepositoryPort.upsertTargets
// changed (round 6)
WeeklyGoalRepositoryPort.incrementTestsDone(input: { studentId; weekKey; subject; delta }): Promise<WeeklyGoal>
WeeklyGoalRepositoryPort.listTestCounts(studentId: string, weekKey: string): Promise<{ subject: string; count: number }[]>
// AddTestsDoneUseCase input gains `subject: string` (slug; unknown → fieldErrors.subject)
```

`assertPlanWrite` stays as-is. A new helper next to it:

```ts
async function assertCounselorOfStudent(users: UserRepositoryPort, actor: Actor, studentId: string): Promise<void>
// hasCapability(actor.role, "plan:write") AND owner.role === "student" AND owner.counselorId === actor.id, else ForbiddenError
```

`capabilities.ts` gains `"plan:write"` on **counselor** and **admin** only; the
student's own study profile reuses `"profile:write"` + `ownerId === actor.id`, and
the school program reuses `"schedule:write"` + `ownerId === actor.id`.

### Domain

```ts
// domain/free-time.ts (extend)
wakingMinutes({ wakeMinutes, sleepMinutes }): number            // ((sleep-wake+1440)%1440) || 1440
schoolMinutesForDay(school: readonly { dayOfWeek: number; minutes: number }[], dayOfWeek: number): number // Σ school-program minutes for that day
otherOccupiedMinutesForDay(otherOccupiedMinutes: readonly number[], dayOfWeek: number): number  // missing index → 0
freeMinutesForDay({ wakeMinutes, sleepMinutes, schoolMinutes, otherOccupiedMinutes, homeworkAverageMinutes }): number
//   = max(0, wakingMinutes − schoolMinutes − otherOccupiedMinutes − homeworkAverageMinutes)
// domain/study-plan.ts (new)
planMinutesTotal(entries: readonly { minutes: number }[]): number
suggestPlanFromSchool(school: readonly SchoolProgramEntry[]): { dayOfWeek; subject; minutes }[] // same day+subject, same minutes, deduped
// domain/chapters.ts (new)
chapterAppliesTo(chapter: Chapter, target: { subject: string; grade: string | null; field: string | null }): boolean
//   = chapter.active && subject equal && grade equal (or student grade null → false) && (field === "" || field === student field)
chapterIdsAreValid(ids: readonly string[], catalog: readonly Chapter[], target: { subject; grade; field }): boolean
dedupeChapterIds(ids: readonly string[]): string[]        // order-preserving
// domain/models.ts
StudyBlock gains `subject: string | null`
Chapter { id; subject; field; grade; number; title; active }
StudyPlanEntry gains `chapterIds: string[]`, `note: string | null`
goalProgress(goal: WeeklyGoal | null, targets: { studyMinutesTarget: number; testsTarget: number }): GoalProgress
// presentation/planning-format.ts (extend)
formatChapterList(chapters: readonly { number: number; title: string }[]): string  // «فصل ۱، ۲، ۳»; empty → «—»
// domain/study-plan.ts (round 6)
studiedMinutesBySubject(
  completedBlocks: readonly string[],
  schedule: readonly { dayOfWeek: number; startMinute: number; endMinute: number; subject: string }[],
): Map<string, number>  // subject slug → ticked minutes; a tick with no covering row is omitted
planProgress(input: {
  entries: readonly { subject: string; minutes: number }[];
  studiedBySubject: ReadonlyMap<string, number>;
  testsBySubject: ReadonlyMap<string, number>;
}): { rows: SubjectProgress[]; plannedMinutes: number }
// SubjectProgress = { subject; plannedMinutes; studiedMinutes; shortfallMinutes = max(0, planned - studied); testsDone }
// the use case adds totals: global studied/tests from goalProgress, shortfall = Σ rows.shortfallMinutes
```

### Invariants (one enforceable sentence each)

1. `User.otherOccupiedMinutes` always has exactly 7 entries, index `0..6` = شنبه..جمعه, each `0..720`, and holds no school time.
2. A day's free time subtracts school hours exactly once (derived from that day's `SchoolProgramEntry.minutes`) and non-school occupied hours exactly once (typed in `otherOccupiedMinutes[day]`), then the homework average: `max(0, wakingMinutes − Σ school − otherOccupiedMinutes[day] − homeworkAverageMinutes)`, never negative and never above 1440.
3. The weekly study target equals `Σ StudyPlanEntry.minutes` and the tests target equals `StudyPlan.testsTarget`; neither is writable by the student.
4. A student has at most one `StudyPlan` and at most one `StudentExamResult` per `Exam`; re-saving updates instead of inserting.
5. A counselor may read or write a student's study plan only when that student's `counselorId` equals the actor's id; every other actor gets `ForbiddenError`.
6. Catalog rows are inserted by an idempotent `upsert` keyed on `code`; re-running the seed never duplicates a row and never deletes user data.
7. `Homework.spentMinutes` is `1..1440` and is written by the same statement that sets `completedAt`; unticking sets both back to `null`.
8. A school-program row is unique per `(studentId, dayOfWeek, subject)` and a second insert returns the Persian conflict message rather than a second row.
9. During the UI stage no request from `/profile`, `/schedule`, `/counselor/students/[studentId]` or `/dashboard` writes to Postgres.
10. A `StudyPlanEntry.chapterIds` list contains only ids of chapters that exist, are active at write time, share the row's `subject`, and match the student's `grade` and (where the chapter's `field` is non-empty) `field`; any other id rejects the whole submission and nothing is written.
11. A counselor's request to `/dashboard` is answered with a server-side redirect to `/counselor/students`; the student dashboard markup is never produced for a counselor, and the redirect is never a client `useEffect`.
12. The sidebar link set is the role matrix defined once in `layout.tsx`: a counselor's rendered DOM contains no `nav-dashboard`, `nav-nutrition`, `nav-homework` or `nav-schedule` link.
13. Per-subject studied minutes are derived from `WeeklyGoal.completedBlocks` against the student's `WeeklySchedule`; no stored per-subject studied counter exists.
14. A `TestRecord` row is unique per `(studentId, subject, weekKey)` and its `count` moves only by an atomic increment inside the same transaction that moves `WeeklyGoal.testsDone`.

### Edge cases

| Case | Expected |
|---|---|
| no `StudyPlan` for the student | goal card shows «برنامهٔ مشاور ثبت نشده است», percent `0`, no `NaN`, no crash |
| school program + non-school occupied + homework ≥ waking window | free = `0`, rendered «۰ دقیقه» |
| `SchoolProgramEntry` added for a day | that day's free minutes drop by exactly the entry's minutes; `otherOccupiedMinutes` is unchanged |
| `otherOccupiedMinutes` row shorter than 7 (pre-migration data) | missing days read as `0` |
| unknown or inactive `needId`/`examId` submitted | `ok:false`, Persian `fieldErrors.need`/`fieldErrors.exam`, nothing written |
| counselor opens another counselor's student | page redirects to `/profile`; the use case throws `ForbiddenError` |
| student calls `addStudyPlanEntryAction` directly | `forbidden`, nothing written |
| duplicate school-program row (same day+subject) | Persian conflict message, still one row |
| same exam saved twice with a new تراز | one row, `taraz` updated, the list shows it once |
| `taraz` `0` / `10000` | accepted |
| `taraz` `-1` / `10001` | rejected with `fieldErrors.taraz` |
| homework ticked with `0` or `1441` minutes / no minutes | rejected, `completedAt` stays `null` |
| catalog seed not run | selects show a Persian "فهرست خالی است" placeholder, page does not throw |
| school mode `virtual`, no courses | empty state with Persian copy and an add control |
| deleting another student's course/entry id | `not_found`/`forbidden`, nothing deleted |
| two adds of the same school-program row concurrently | unique constraint → one row + friendly message |
| counselor opens `/dashboard` | server 307 to `/counselor/students`; no dashboard markup is rendered |
| student opens `/counselor/students/[id]` | the existing `requireCapability` path redirects to `/profile` |
| student has no `grade`/`fieldOfStudy` | chapter picker shows «پایه و رشتهٔ دانش‌آموز ثبت نشده است»; the plan row still saves with zero chapters |
| unknown or inactive chapter id submitted | `ok:false`, Persian `fieldErrors.chapters`, nothing written |
| chapter of another subject, grade or field | same rejection, nothing written |
| duplicate chapter ids in one submission | deduped before the write; one stored id per chapter |
| note whitespace-only / longer than 200 chars | stored as `null` / rejected with `fieldErrors.note` |
| chapter deactivated after a row was saved | the row still renders its title; the picker no longer offers it |
| chapter id absent from the catalog (dev DB) | the row renders «فصل نامشخص», no throw |
| tick key with no covering `WeeklySchedule` row (row deleted) | counted in `totals.studiedMinutes`, in no `rows` entry |
| studied minutes exceed planned minutes for a subject | `shortfallMinutes` is `0`, never negative |
| tests recorded for a subject absent from the plan | only in `totals.testsDone`; `rows` unchanged |
| unknown subject submitted to the tests action | `ok:false`, Persian `fieldErrors.subject`, nothing written |

Each row below in Section «Edge cases» carries the `verify:` in the Acceptance
Criteria list.

---

## Files

**Stage UI (mock) — create** (genuinely new this round)

- `src/app/(advising)/profile/_components/study-profile-form.vm.tsx` / `.view.tsx`
- `src/app/(advising)/profile/study-profile.fixture.ts` (deleted in Stage Backend)
- `src/app/(advising)/schedule/_components/school-program-form.vm.tsx` / `.view.tsx`,
  `school-program-table.view.tsx`

**Stage UI (mock) — modify**

S3 v1 already put a first version of the counselor page on disk; round 5 amends it
in place (no new file there):
`page.tsx` + `counselor-student.vm.tsx` + `counselor-student.view.tsx` gain the
study-profile, weekly-schedule and goal-progress sections **inline in the existing
view** (the view has no length cap in `test/architecture.test.ts`; splitting it buys
nothing for a mock), and `counselor-student.fixture.ts` gains the study-profile
fields, the `CHAPTERS` constant, the weekly schedule and the goal progress.

- `src/app/(advising)/layout.tsx` (role matrix per Decision 9; this is lite AC-1's
  file — the matrix is written here **once**, and lite AC-1 references it)
- `src/app/(advising)/dashboard/page.tsx` (counselor → `redirect("/counselor/students")`,
  2 lines before the fixture branch)
- `src/app/(advising)/profile/page.tsx` (pass the fixture alongside the real profile)
- `src/app/(advising)/profile/profile-form.view.tsx` (render the study card below the existing form)
- `src/app/(advising)/schedule/schedule-week.view.tsx` (render the school-program section)
- `src/app/(advising)/counselor/students/counselor-roster.view.tsx` («برنامه» link per student)
- `src/modules/advising/domain/study-blocks.ts` (+ `.test.ts`) — `subject`
- `src/app/(advising)/dashboard/dashboard.fixture.ts` (need, derived targets, school rows, otherOccupied/homework, block subject)
- `src/app/(advising)/dashboard/_components/study-plan.view.tsx` (subject instead of ⏱️)
- `src/app/(advising)/dashboard/_components/{weekly-goal.view.tsx,homework-today.view.tsx,free-time-card.view.tsx}`
- `src/constants/test-ids.ts` (`STUDY_PROFILE.*`, `SCHOOL_PROGRAM.*`, `COUNSELOR_PLAN.*`, `DASHBOARD.HOMEWORK_MINUTES`)
- ~~`test/architecture.test.ts`~~ — **no change in round 5**: S3 already moved it to
  `withLocalUi = 13` / `pages >= 14` and round 5 adds no route

**Stage UI (mock) — delete**

- `src/app/(advising)/dashboard/_components/study-block-focus.vm.tsx` / `.view.tsx`

**Stage Backend — create**

- `prisma/migrations/<ts>_advisor_program/`
- `src/modules/advising/domain/study-plan.ts` (+ `.test.ts`), `domain/catalogs.ts` (+ `.test.ts`), `domain/chapters.ts` (+ `.test.ts`), `domain/study-profile.ts` (+ `.test.ts`, normalization/validation helpers)
- `src/modules/advising/application/study-profile.ts` (+ `.test.ts`),
  `application/school-program.ts` (+ `.test.ts`), `application/study-plan.ts` (+ `.test.ts`)
- `src/modules/advising/infrastructure/prisma-{catalog,chapter,school-program,study-plan,supplementary-course,student-exam-result}-repository.ts`
- `src/modules/advising/presentation/advisor-schemas.ts` (+ `.test.ts`)
- `src/app/(advising)/profile/profile.actions.ts`
- `src/app/(advising)/counselor/students/[studentId]/study-plan.actions.ts`
- `test/fakes/{advisor-program,catalogs}.ts`
- `test/advising/advisor-program-integration.test.ts`
- `tests/e2e/advising-advisor-program.spec.ts`
- `docs/contracts/advisor-program.md`, `docs/behaviors/advisor-program.md`

**Stage Backend — modify**

- `prisma/schema.prisma`
- `scripts/seed-advising.ts` (`seedCatalogs`, exported + run from the direct-run branch)
- `src/modules/advising/domain/{models,ports,capabilities,free-time,weekly-goal}.ts` (+ tests)
- `src/modules/advising/application/{profile,homework,weekly-goal,planning-access}.ts` (+ tests)
- `src/modules/advising/infrastructure/{prisma-user,prisma-homework,prisma-weekly-goal}-repository.ts`
- `src/modules/advising/presentation/{schemas,messages}.ts` (+ `schemas.test.ts`)
- `src/server/container.ts` (`CONTAINER_VERSION` 5 → 6)
- `src/app/(advising)/profile/page.tsx`, `schedule/page.tsx`, `schedule/schedule.actions.ts`,
  `homework/homework.actions.ts`, `dashboard/page.tsx`
- `src/app/(advising)/counselor/students/[studentId]/page.tsx` (fixture → use case)
- `test/advising/{weekly-goal,planning}-integration.test.ts`, `test/fakes/{advising,weekly-goal}.ts`
- `test/architecture.test.ts` (only if a page appears/disappears)

**Stage Backend — delete**

- every `*.fixture.ts` created in the UI stage

---

## Stage UI (mock)

**Scope:** the whole new surface, against fixtures/local state. No
`prisma/schema.prisma` edit, no migration, no new `"use server"` file, no
`getContainer()` in the new pages, no write request.

### Screens

1. **`/profile` — «مشخصات تحصیلی» card** (student only; counsellors see nothing
   new). Sections: «مدرسه» (school mode `Select`, need `Select`), «آزمونهای
   آزمایشی» (`Switch` + exam `Select` + تراز `InputNumber` + the last two results
   as a small table), «ساعتهای اشغال هفته» (7 `InputNumber` in hours, labelled
   شنبه..جمعه, `dir="ltr"`), «تکلیف مدرسه» (average daily hours), «کلاسهای
   تکمیلی» (list + add form + delete). One «ذخیره» per card section is too many
   actions — the card uses one `<Form>` with all fields and one submit; courses are
   added/removed inside the card through local state in the UI stage.
2. **`/schedule` — «برنامهٔ ثابت مدرسه» section**: form (`Select` day, `Select`
   subject from `subjectsForField`, `InputNumber` hours) + a table with day /
   subject / hours (`formatDuration`) + a delete control per row + a per-day total.
   A note explains this is the fixed school week and hours are used for planning.
3. **`/counselor/students/[studentId]`** — everything the counselor needs to decide:
   - header: student name, username, group, «نیاز» badge (`Badge`).
   - «مشخصات تحصیلی» card, five read-only blocks, each with its own named empty
     state: (a) school mode (حضوری/مجازی) + «آزمون آزمایشی می‌دهد/نمی‌دهد»;
     (b) the last two exam results (exam name + تراز, most recent first);
     (c) the seven weekday non-school occupied hours, labelled شنبه..جمعه, in hours;
     (d) the average daily homework hours; (e) the supplementary courses
     (title + mode label + weekly hours). Missing block copy, e.g.
     «دانش‌آموز هنوز ساعت‌های اشغال هفته را ثبت نکرده است».
   - «برنامهٔ مدرسه» summary table (day / subject / hours, no clock).
   - «برنامهٔ هفتگی دانش‌آموز»: rows of day + time range + subject from the student's
     own timed `WeeklySchedule`.
   - «پیشرفت هفته»: studied minutes vs the plan total and tests done vs
     `testsTarget`; no plan → «برنامهٔ مشاور ثبت نشده است» with `0`.
   - «برنامهٔ هفتگی مشاور»: tests-target input, an add-row form (`Select` day,
     `Select` subject from `subjectsForField(student.field)`, hours,
     **`Select mode="multiple"` chapters filtered by that subject + the student's
     grade/field**, optional note `Input.TextArea`), the entry table with columns
     روز / درس / ساعت / **فصل‌ها («فصل ۱، ۲، ۳»)** / **یادداشت** / عملیات,
     a running «جمع هفتگی» and a per-subject total.
4. **`/dashboard`**: a counselor is redirected to `/counselor/students` by the server
   before any card renders (the student dashboard is unchanged: goal card derived,
   subject on plan rows, free-time breakdown delivered in S1).
5. **Sidebar** (`layout.tsx`): the role matrix of Decision 9 — a counselor sees
   «دانش‌آموزان من» and «پروفایل» only; a student keeps the five links.

### States (all four where a list exists)

`/counselor/students/[studentId]?demo=success|empty|loading|error` (empty = no
study profile facts, no school program, no weekly schedule, no plan, no exams, zero
goal progress). `/profile` and `/schedule` show their empty
states naturally (no courses, no exam results, no school rows) and their Persian
`role="status"` save message from local state. RTL inherited; no horizontal
overflow at 360px; tap targets ≥44px; `data-testid` from the registry.

### Mock source

`study-profile.fixture.ts`, `counselor-student.fixture.ts` (now also holds the
study-profile fields, a `CHAPTERS: ChapterOption[]` constant, the student's timed
weekly schedule and the goal progress), extended `dashboard.fixture.ts`. Real types
only: `NeedOption`, `ExamOption`, `Chapter`, `SchoolProgramEntry`, `StudyPlan`,
`StudentExamResult`, `SupplementaryCourse`, `WeeklyScheduleEntry`. The chapter
constant is deleted in Stage Backend and replaced by the seeded table + port; the
UI contract (option shape, filter, columns) does not change.

### Proves it

`pnpm typecheck && pnpm lint && pnpm build` → 0, `/counselor/students/[studentId]`
in the route table; `pnpm test` green (architecture counts unchanged: `withLocalUi`
13, `pages >= 14`). Report **`UI READY FOR DEMO`** with the routes, the role matrix,
the `?demo=` matrix and `pnpm dev`.

---

## HUMAN DEMO CHECKPOINT

**Stop. This is demo 3 — the round-5 re-run.** The S3 build already on disk was
reviewed once and the human rejected four things; nothing below is approved yet.
The Orchestrator presents:

- `pnpm dev`; `/profile` (student), `/schedule`, `/counselor/students/<demo id>`
  with all four `?demo=` states
- **the counselor flow**: log in as a counselor, open `/dashboard` and show the
  server redirect to `/counselor/students`; the sidebar (دانش‌آموزان من + پروفایل
  only); then the student page with the full study profile, the student's own weekly
  schedule, the goal progress, and a plan row carrying chapters ۱،۲،۳ + a note
- **the student flow**: `/dashboard` unchanged, the five-link sidebar
- 390px and 1280px widths; the goal card's derived numbers and the need badge
- the school-program table showing hours only (no clock times)

Approval is recorded as `approvals.ui` (ISO) in the Orchestrator state file and the
phase moves `ui-mock → ui-approved`. Without it the Stage Backend does not start.

---

## Stage Backend

### Step 0 — dev dump (mandatory before the two column drops)

Same gate as lite B2: with postgres up,
`f=".opencode/backups/$(date +%Y-%m-%d-%H%M)-pre-advisor-program.sql"` then
`docker compose exec -T postgres pg_dump -U mr_dan -d mr_dan > "$f"` then
`test -s "$f" || exit 1`. If the shell scanner rejects `$(date …)`, run
`date +%Y-%m-%d-%H%M` first and paste the literal.

### AP-1 — schema + seed

- Migration C as written above (`Chapter`, `StudyPlanEntry.chapterIds/note`);
  `pnpm prisma generate`.
- `scripts/seed-advising.ts`: `seedCatalogs()` with `upsert({ where: { code } })`
  for the 3 needs and the exam list **and** one
  `upsert({ where: { subject_field_grade_number: … } })` per chapter (a small
  representative set with `field: ""` for عمومی subjects); called from the
  direct-run branch after `seedAdvising()`. Running twice changes no count.
- `presentation/advisor-schemas.ts`: `studyProfileSchema` (7 non-school occupied hour fields
  `.refine` ≤ 12, need optional id, schoolMode enum, takesMockExams boolean,
  homeworkAverageHours ≤ 12), `examResultSchema` (examId uuid-ish string, taraz
  0..10000), `courseSchema` (title 1..100, mode, weeklyHours ≤ 30),
  `schoolProgramSchema` (dayOfWeek 0..6, subject slug, hours 0.25..12),
  `studyPlanHeaderSchema` (testsTarget 0..2000),
  `studyPlanEntrySchema` (school-program fields **+ `chapterIds`**: a JSON array
  string preprocessed to `string[]`, max `CHAPTERS_MAX_PER_ENTRY`, ids deduped, and
  **+ `note`**: trimmed, `NOTE_MAX` max, empty → `undefined`). Persian messages only.

### AP-2 — domain + application

- `domain/free-time.ts`: `wakingMinutes`, `schoolMinutesForDay`,
  `otherOccupiedMinutesForDay`, `freeMinutesForDay` (three subtrahends, school
  derived); keep `classMinutesForDay`, delete nothing (lite B2 deletes the manual
  helpers).
- `domain/study-plan.ts`: `planMinutesTotal`, `suggestPlanFromSchool`.
- `domain/chapters.ts`: `chapterAppliesTo`, `chapterIdsAreValid`,
  `dedupeChapterIds` (Decision 10); `presentation/planning-format.ts` gains
  `formatChapterList`.
- `application/weekly-goal.test.ts`: drop the targets-upsert case; `domain/weekly-goal.test.ts`
  gains the explicit-targets cases (no plan → `0/0`, percent `0`).
- `domain/weekly-goal.ts`: `goalProgress(goal, targets)`; remove
  `DEFAULT_TARGETS` and the `studyMinutesTarget`/`testsTarget` reads.
- **Do not stop between AP-1 and AP-2:** the migration drops the columns and the generated client
  stops exposing them, so the repository and use cases do not compile until AP-2 lands. Both are one
  stage; the green checkpoint is after AP-4.
- **Column-drop cleanup, same stage (this plan owns it, not lite):** delete
  `SetWeeklyGoalTargetsUseCase` + `SetWeeklyGoalTargetsInput`
  (`application/weekly-goal.ts`), `WeeklyGoalRepositoryPort.upsertTargets` and its
  Prisma implementation, the `studyMinutesTarget`/`testsTarget` fields from
  `WEEKLY_GOAL_SELECT` and the domain `WeeklyGoal` type, the container entry, and
  the `test/fakes/weekly-goal.ts` method. The dashboard's old `targets` state is
  already gone (removed in lite S1), so nothing else references them.
- `application/study-profile.ts`: `GetStudyProfileUseCase` (profile + catalogs +
  exam results + courses), `UpdateStudyProfileUseCase` (validates need/exam
  active, normalizes 7 hours → minutes, writes `User`), `SaveExamResultUseCase`
  (upsert last two), `Add/DeleteSupplementaryCourseUseCase`.
- `application/school-program.ts`: `ListSchoolProgramUseCase`,
  `AddSchoolProgramEntryUseCase` (owner + slug + unique conflict →
  `ConflictError` mapped to Persian), `DeleteSchoolProgramEntryUseCase`.
- `application/study-plan.ts`: `GetStudentStudyPlanUseCase` (counselor only:
  `assertCounselorOfStudent`; composes the **existing** AP-2 read pieces —
  `GetStudyProfileUseCase`, `ListSchoolProgramUseCase`,
  `ScheduleRepositoryPort.listByStudent`, `WeeklyGoalRepositoryPort.findByKey` +
  `goalProgress` — so the counselor page has no second read model),
  `SaveStudyPlanHeaderUseCase`,
  `AddStudyPlanEntryUseCase` (resolves the student's grade/field, loads the
  candidate chapters through `ChapterRepositoryPort.findByIds`, rejects any id that
  fails `chapterIdsAreValid` with a Persian `fieldErrors.chapters`, dedupes, trims
  the note), `DeleteStudyPlanEntryUseCase`.
- `application/homework.ts`: `SetHomeworkCompletionUseCase` gains
  `spentMinutes`; `ValidationError` when completing without a valid number.
- `application/planning-access.ts`: `assertCounselorOfStudent`.

### AP-3 — adapters + container

Six Prisma repositories with explicit `select`, row → domain mapping, `$transaction`
where a header + entry must be consistent (`prisma-chapter-repository.ts` does plain
reads: `listForSubject` filters `active` + subject + `grade`/`field` with the
`field = "" OR field = student.field` rule; `findByIds` ignores `active`).
`container.ts` v6 wires every new use
case; `test/fakes/*` gains the six ports.

### AP-4 — wiring

Replace the three fixtures; the pages call the use cases; actions call the
container. `dashboard/page.tsx` stays on the lite fixture until lite B1 (S6) — do
not wire the real dashboard here.

Proves it: `pnpm exec prisma migrate dev --name advisor_program && pnpm prisma
validate && pnpm typecheck && pnpm lint && pnpm test && pnpm build`, plus
`pnpm tsx scripts/seed-advising.ts` twice with stable counts.

---

## Test plan

**Unit — domain** (`vitest`, no DB)
- `free-time.test.ts`: `wakingMinutes` boundary table (02:00/10:00 → 960,
  23:00/06:30 → 990, equal → 1440, `00:00`/`00:00` → 1440); free = window −
  school − otherOccupied − homework (990/240/180/60 → 510, AC-14); clamp at 0;
  missing index → 0; school 240 + otherOccupied 600 + homework 400 with a 990
  window → 0; adding a school entry lowers the day by exactly its minutes and
  raising `otherOccupiedMinutes[day]` by the same amount lowers it by the same
  (AC-32, no double subtraction).
- `study-plan.test.ts`: `planMinutesTotal` on empty/3 rows; `suggestPlanFromSchool`
  copies day+subject+minutes, dedupes, ignores 0-minute rows.
- `weekly-goal.test.ts`: progress with explicit targets; no plan → 0/0 and percent 0;
  percent clamps at 100 with the raw numbers intact.
- `study-blocks.test.ts`: `subject` is copied onto every block; `studyBlockKey` is
  unchanged when the subject differs.
- `chapters.test.ts`: `chapterAppliesTo` true for the same subject+grade with
  `field: ""`, false for another subject, another grade, another non-empty field and
  an inactive chapter; `chapterIdsAreValid` false when one id is missing;
  `dedupeChapterIds` keeps first-seen order and collapses repeats.
- `capabilities.test.ts`: `plan:write` present for counselor and admin, absent for
  student; `schedule:write` still present.

**Unit — application (fakes only)**
- `study-profile`: unknown/inactive need → `ValidationError`; 6 non-school occupied values →
  rejected; 7 values normalise to minutes; another user's write → `ForbiddenError`.
- `school-program`: bad slug rejected; duplicate day+subject → conflict;
  delete scoped to the owner.
- `study-plan`: a counselor reading a non-owned student → `ForbiddenError`; a
  student calling any write → `ForbiddenError`; entry minutes bounds; header
  `testsTarget` bounds; an unknown chapter id → `ValidationError` with
  `fieldErrors.chapters` and nothing written; a chapter of another subject/grade/
  field → same; duplicate ids collapse; a 201-char note → `fieldErrors.note`; an
  empty chapter list is accepted.
- `homework`: complete with 45 → `spentMinutes: 45`; complete without → error;
  untick clears both.

**Integration — real Postgres, graceful skip** (`test/advising/advisor-program-integration.test.ts`)
- `seedCatalogs()` twice → identical counts, 3 needs by code.
- `StudyPlan` header upsert keeps one row per student; entries cascade with the user.
- `StudentExamResult` upsert by `(studentId, examId)` → one row, `taraz` updated.
- `User.otherOccupiedMinutes` round-trips 7 ints; `Homework.spentMinutes` round-trips.
- school-program unique violation surfaces (Prisma 7:
  `meta.driverAdapterError.cause.constraint.index`).
- `seedCatalogs()` twice → `Chapter` counts unchanged and the compound unique holds;
  `StudyPlanEntry.chapterIds` round-trips as `text[]`; a chapter deactivated after
  the write still resolves by id.

**E2E — `tests/e2e/advising-advisor-program.spec.ts`** (`E2E_ENABLED=true`)
- student adds «یکشنبه / ریاضی / ۳ ساعت» on `/schedule`, reloads, sees it once.
- student sets need «کنکور», school mode «حضوری», a school-program row of ۴ ساعت on
  one day, non-school occupied 3h on that day, homework average 1h → `/dashboard`
  free time equals 990 − 240 − 180 − 60 and the breakdown names school, occupied
  and homework separately.
- counselor opens the student page, adds two plan rows + tests target → the weekly
  total updates; the trims are visible to the student on `/dashboard` after B1
  (asserted in the dashboard spec, not here).
- homework: tick with ۴۵ دقیقه → `/homework` shows 45 minutes.
- dashboard: today's plan row shows the subject; no `[data-testid*=focus]` element
  and no ⏱️ text exists.
- counselor: a counselor session requesting `/dashboard` ends on
  `/counselor/students` and never sees a `dashboard-card-*` element; the sidebar shows exactly
  `nav-students` + `nav-profile`; the student page lists the study-profile blocks,
  the student's weekly schedule and the goal progress.
- counselor plan row: add «یکشنبه / ریاضی / ۲ ساعت» with chapters ۱ و ۲ and a note →
  the row shows «فصل ۱، ۲» and the note; reload keeps both.

**Architecture test** — unchanged: round 5 adds no route, so `withLocalUi` stays
`13` and `pages >= 14`. The new page is `page.tsx` + `.vm.tsx` + `.view.tsx` and
stays ≤40 lines; the added sections live in the existing view.

---

## Acceptance Criteria

Legend: `- [ ]` pending, `- [x]` confirmed with `evidence:`, `- [~]` deferred with
`reason:`. Labels: `[ui]` = Stage UI (mock), `[backend]` = Stage Backend.

### Stage UI (mock)

- [ ] AC-1: [ui] When a student opens `/profile`, a «مشخصات تحصیلی» card shows a school-mode select, a need select, a mock-exams switch, the two latest exam تراز values, seven weekday hour inputs labelled شنبه..جمعه, the average daily homework hours, and a supplementary-courses list with add and remove controls. — verify: manual: `pnpm dev`, open `/profile` as `student`
- [ ] AC-2: [ui] When the study-profile card is submitted in the UI stage, the Persian «ذخیره شد» status appears and the Network tab shows no server-action POST. — verify: manual: fill the card on `/profile`, press ذخیره, inspect the Network tab
- [ ] AC-3: [ui] When the student opens `/schedule` in the UI stage, a «برنامهٔ ثابت مدرسه» section offers day/subject/hours (no time-of-day input) and renders the rows as one collapsible panel per weekday — header = day + that day's total hours, body = that day's subject rows with hours — so adding `یکشنبه / ریاضی / ۳` produces a `یکشنبه` panel whose header reads «۳ ساعت»; the counselor page's «برنامهٔ مدرسه» uses the same panels. — verify: manual: add a school-program row on `/schedule`, then open `/counselor/students/s-1?demo=success`
- [ ] AC-4: [ui] When `/counselor/students/[studentId]?demo=success` is opened as the owning counselor, the page shows the school program in hours only, the need label, the last two تراز, and a plan editor whose added row raises «جمع هفتگی» locally, plus the remaining study-profile blocks, the student's own weekly schedule and the goal progress (AC-36..AC-41). — verify: manual: open the page with the fixture student id, add one plan row, watch the total change; no POST in the Network tab
- [ ] AC-5: [ui] When `/counselor/students/[studentId]?demo=empty`, `?demo=loading` and `?demo=error` are opened, each renders its Persian state (Empty copy, `Spin`, `role="alert"`) with no raw error text and no layout break. — verify: manual: open all four demo URLs
- [ ] AC-6: [ui] When `/dashboard?demo=success` renders, the goal card shows a target derived from the mock plan plus the need label and contains no editable target input. — verify: manual: open `/dashboard?demo=success`; count zero `[data-testid=dashboard-goal-study-input]` elements (cross-verified by lite-edition AC-47/45/46; counted once in the lite gate)
- [ ] AC-7: [ui] When `/dashboard?demo=success` renders, today's plan rows show the subject label next to the time range, and no ⏱️ or timer control exists in the DOM. — verify: manual: inspect a plan row on `/dashboard?demo=success`; `! grep -rn "⏱" src/app/\(advising\)/dashboard` (cross-verified by lite-edition AC-47/45/46; counted once in the lite gate)
- [ ] AC-8: [ui] When a homework is ticked on the mock dashboard, a minutes input must hold a positive value before the row leaves the pending list, and the tick produces no network write. — verify: manual: press «انجام شد» with an empty minutes field, then with ۴۵, on `/dashboard?demo=success` (cross-verified by lite-edition AC-47/45/46; counted once in the lite gate)
- [ ] AC-9: [ui] When the UI stage is inspected, it added no persistence: `prisma/schema.prisma` gained no advisor-program model, no migration directory was added, and no `"use server"` file exists under the new routes. — verify: `! grep -q "model StudyPlan\|model SchoolProgramEntry\|model Need\b" prisma/schema.prisma && ! git status --short -- prisma/migrations | grep -q . && ! grep -rl "use server" "src/app/(advising)/profile" "src/app/(advising)/counselor/students" | grep -q .`
- [ ] AC-10: [ui] When the UI gate build runs, `pnpm typecheck && pnpm lint && pnpm build` exits 0 and `next build` lists `/counselor/students/[studentId]` in the route table. — verify: `pnpm typecheck && pnpm lint && pnpm build`

### Stage Backend

- [ ] AC-11: [backend] When the `advisor_program` migration is applied, `pnpm exec prisma migrate status` reports no pending or failed migration and `pnpm prisma validate` exits 0. — verify: `pnpm exec prisma migrate status && pnpm prisma validate`
- [ ] AC-12: [backend] When the schema is inspected, `Need`, `Exam`, `StudentExamResult`, `SchoolProgramEntry`, `StudyPlan`, `StudyPlanEntry`, `SupplementaryCourse` and `Chapter` exist (`Chapter` unique on `[subject, field, grade, number]`), `StudyPlanEntry` has `chapterIds String[]` and `note String?`, `User` has `needId`/`schoolMode`/`takesMockExams`/`otherOccupiedMinutes` (the renamed non-school field; no `occupiedMinutes` column remains)/`homeworkAverageMinutes`, `Homework` has `spentMinutes`, and the `WeeklyGoal` model has neither `studyMinutesTarget` nor `testsTarget` while `StudyPlan` still has `testsTarget`. — verify: `pnpm prisma validate && ! grep -q "studyMinutesTarget" prisma/schema.prisma && ! sed -n "/^model WeeklyGoal/,/^}/p" prisma/schema.prisma | grep -q "testsTarget" && sed -n "/^model StudyPlan /,/^}/p" prisma/schema.prisma | grep -q "testsTarget" && grep -q "otherOccupiedMinutes" prisma/schema.prisma && ! grep -qE "^[[:space:]]*occupiedMinutes" prisma/schema.prisma && sed -n "/^model Chapter/,/^}/p" prisma/schema.prisma | grep -q "@@unique(\[subject, field, grade, number\])" && sed -n "/^model StudyPlanEntry/,/^}/p" prisma/schema.prisma | grep -q "chapterIds String\[\]" && sed -n "/^model StudyPlanEntry/,/^}/p" prisma/schema.prisma | grep -q "note "`
- [ ] AC-13: [backend] When `pnpm tsx scripts/seed-advising.ts` runs twice, the second run leaves the `Need`, `Exam` and `Chapter` row counts unchanged and the three needs keep their codes. — verify: `docker compose up -d postgres && pnpm tsx scripts/seed-advising.ts && pnpm vitest run test/advising/advisor-program-integration.test.ts -t "catalog and chapter seed is idempotent"`
- [ ] AC-14: [backend] When wake is 06:30 and sleep 23:00 (990 minutes), that day's school program totals 240 minutes, non-school occupied is 180 minutes and the average homework minutes are 60, free time is exactly 510 minutes; the breakdown copy that names the 240 school minutes as derived is verified by lite-edition AC-48. — verify: `pnpm test -t "free time derives school hours once"`
- [ ] AC-15: [backend] When school minutes plus non-school occupied plus homework equal or exceed the waking window, free time is exactly 0 and never negative. — verify: `pnpm test -t "free minutes never negative with occupied"`
- [ ] AC-16: [backend] When the stored `otherOccupiedMinutes` array has fewer than seven entries, missing weekdays contribute 0 minutes instead of throwing. — verify: `pnpm test -t "short occupied array reads zero"`
- [ ] AC-17: [backend] When a study-profile save submits an unknown or inactive need id, the action returns `ok:false` with a Persian `fieldErrors.need` and writes nothing. — verify: `pnpm test -t "unknown need is rejected"`
- [ ] AC-18: [backend] When the same school-program day+subject is added twice, one row exists afterwards and the second call returns the Persian conflict message. — verify: `pnpm test -t "school program duplicate"`
- [ ] AC-19: [backend] When a counselor opens a student who is not theirs, the use case throws `ForbiddenError` and the page redirects to `/profile`. — verify: `pnpm test -t "counselor may not read another students plan"`
- [ ] AC-20: [backend] When a student calls a study-plan write action directly, it returns `forbidden` and no row is written. — verify: `pnpm test -t "student may not write the study plan"`
- [ ] AC-21: [backend] When the counselor saves a header with `testsTarget = 200` and three entries totalling 900 minutes, the read model returns `studyMinutesTarget: 900` and `testsTarget: 200`. — verify: `pnpm test -t "study plan totals"`
- [ ] AC-22: [backend] When the same exam is saved twice on `/profile`, one `StudentExamResult` row exists with the new تراز and the page shows the two most recently updated results. — verify: `pnpm test -t "exam result upserts by student and exam"`
- [ ] AC-23: [backend] When تراز is submitted as `-1` or `10001`, the action returns `ok:false` with `fieldErrors.taraz`; `0` and `10000` are accepted. — verify: `pnpm test -t "taraz bounds"`
- [ ] AC-24: [backend] When a homework is ticked with 45 minutes, `spentMinutes` is 45 and `completedAt` is set; a tick with no minutes or `1441` is rejected and `completedAt` stays `null`; unticking clears both. — verify: `pnpm test -t "homework spent minutes"`
- [ ] AC-25: [backend] When the counselor's plan and the student's need are saved, the dashboard goal card shows the plan's minutes total and the need label, and no target input exists on the page. — verify: `E2E_ENABLED=true pnpm test:e2e -g "goal derives from the counselor plan"`
- [ ] AC-26: [backend] When the student saves the school program on `/schedule` and reloads, exactly one row per day+subject remains, and both `/schedule` and the counselor page show those rows as one collapsible panel per weekday whose header is the day plus that day's total hours and whose body is that day's subject rows with hours, without clock times. — verify: `E2E_ENABLED=true pnpm test:e2e -g "school program round-trip"`
- [ ] AC-27: [backend] When the full gate runs, `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0 and the architecture test passes with `withLocalUi = 13`. — verify: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
- [ ] AC-28: [backend] When the e2e suite runs against live services, `advising-advisor-program`, `advising-dashboard`, `advising-auth` and `advising-planning` pass with no extra `test.skip`. — verify: `E2E_ENABLED=true pnpm test:e2e`
- [ ] AC-29: [backend] When the tree is searched, the fixtures this feature's UI stage created are gone (`study-profile.fixture.ts`, `counselor-student.fixture.ts`) and `domain/**` still imports nothing external; `dashboard.fixture.ts` is lite-edition's and survives until its B1. — verify: `test -z "$(find src \( -name 'study-profile.fixture.ts' -o -name 'counselor-student.fixture.ts' \) -print -quit)" && ! grep -rn '^import .* from "zod"\|^import .* from "next\|^import .* from "@prisma' src/modules/advising/domain`
- [ ] AC-30: [backend] When `README.md` is read, it documents the school program, the study profile fields, the free-time formula with derived school hours and non-school occupied hours, the counselor page and the seed command covering the catalogs, and no longer claims there is no counselor UI. — verify: `grep -q "برنامهٔ ثابت مدرسه" README.md && grep -q "occupied\|اشغال" README.md && ! grep -q "بدون صفحهٔ UI تا فاز ۵.۴" README.md`
- [ ] AC-31: [backend] When `docs/behaviors/advisor-program.md` is opened, it starts with `last_verified:` and `source_files:` and its `source_files` lists every file this feature touched. — verify: `head -3 docs/behaviors/advisor-program.md | grep -q last_verified && head -3 docs/behaviors/advisor-program.md | grep -q source_files`
- [ ] AC-32: [backend] When a `SchoolProgramEntry` of N minutes is added for a day, that day's free minutes fall by exactly N while `otherOccupiedMinutes` is unchanged; when instead `otherOccupiedMinutes[day]` is raised by the same N, free minutes fall by exactly the same N — so school time is never subtracted twice and never zero times. — verify: `pnpm test -t "school and non-school each subtract once"`

### Round 5 — added criteria (2026-11-24)

Numbering is append-only: AC-1..AC-32 keep their ids; only AC-12 and AC-13 were
extended for the `Chapter` table. This block adds AC-33..AC-49 and its own
`[ui]`/`[backend]` labels. No route is added, so AC-27's `withLocalUi = 13` and the
`pages >= 14` threshold are untouched.

- [ ] AC-33: [ui] When a counselor opens `/dashboard`, the browser lands on `/counselor/students` and no `dashboard-card-*` element is ever rendered. — verify: manual: `pnpm dev`, log in as the seeded `counselor`, open `/dashboard`
- [ ] AC-34: [ui] When a student opens `/counselor/students/<any id>`, the existing guard sends them to `/profile` and the counselor page never renders. — verify: manual: log in as `student`, open `/counselor/students/s-1`
- [ ] AC-35: [ui] When the sidebar renders for a counselor, it contains `nav-students` and `nav-profile` and no `nav-dashboard`, `nav-schedule`, `nav-nutrition` or `nav-homework`; for a student it contains `nav-dashboard`, `nav-schedule`, `nav-nutrition`, `nav-homework`, `nav-profile` and no `nav-students`. — verify: manual: two browser sessions (student, counselor), count the `data-testid` attributes in the sidebar
- [ ] AC-36: [ui] When `/counselor/students/<id>` renders, «مشخصات تحصیلی» shows the student's school mode (حضوری/مجازی) and the mock-exams state, and when unset shows a Persian sentence naming that part instead of a blank card. — verify: manual: open the page with `?demo=success` and `?demo=empty`
- [ ] AC-37: [ui] When the student has exam results, the counselor page lists the two most recent with the exam name and the تراز value, most recent first. — verify: manual: open `/counselor/students/s-1?demo=success`
- [ ] AC-38: [ui] When the student has entered non-school occupied hours, the counselor page shows seven rows labelled شنبه..جمعه in hours plus the average daily homework hours; when unset it says so. — verify: manual: open `?demo=success` and `?demo=empty`
- [ ] AC-39: [ui] When the student has supplementary courses, each row shows title, mode (حضوری/مجازی) and weekly hours; with no courses a Persian empty line names them. — verify: manual: open `?demo=success` and `?demo=empty`
- [ ] AC-40: [ui] When the student has a timed weekly schedule, the counselor page lists its rows as day + time range + subject; with no rows a Persian empty line names it. — verify: manual: open `?demo=success` and `?demo=empty`
- [ ] AC-41: [ui] When a plan exists, the counselor page shows studied minutes against the plan total and tests done against the tests target; with no plan it shows «برنامهٔ مشاور ثبت نشده است» with `0` and no `NaN`. — verify: manual: open `?demo=success` and `?demo=empty`
- [ ] AC-42: [ui] When the counselor picks a subject in the add-row form, the chapter `Select` offers only that subject's chapters matching the student's grade and field, several can be selected, and adding «یکشنبه / ریاضی / ۲ ساعت» with chapters ۱،۲،۳ plus a note renders «فصل ۱، ۲، ۳» and the note in the table row; an empty note and an empty chapter list are accepted and the Network tab shows no POST. — verify: manual: use the plan editor on `/counselor/students/s-1?demo=success`
- [ ] AC-43: [backend] When `dashboard/page.tsx` is inspected, it contains no `use client` and no `useEffect`, and it redirects only a counselor via `redirect("/counselor/students")`, so the role decision is part of the server response. — verify: `! rg -n "use client|useEffect" "src/app/(advising)/dashboard/page.tsx" && rg -q 'role === "counselor"' "src/app/(advising)/dashboard/page.tsx" && rg -q 'redirect\("/counselor/students"\)' "src/app/(advising)/dashboard/page.tsx"`
- [ ] AC-44: [backend] When an unknown or inactive chapter id is submitted with a plan row, the action returns `ok:false` with a Persian `fieldErrors.chapters` and no `StudyPlanEntry` is written. — verify: `pnpm test -t "unknown chapter is rejected"`
- [ ] AC-45: [backend] When a chapter of another subject, another grade or another non-empty field is submitted, the write is rejected with `fieldErrors.chapters` and nothing is written, while a `field: ""` chapter of the same subject and grade is accepted. — verify: `pnpm test -t "chapter must match the student subject grade and field"`
- [ ] AC-46: [backend] When the submission repeats a chapter id it is stored once, a whitespace-only note is stored as `null`, surrounding whitespace is trimmed, and a 201-character note is rejected with `fieldErrors.note`. — verify: `pnpm test -t "chapter ids dedupe and note trims"`
- [ ] AC-47: [backend] When the counselor adds a row with two chapters and a note and reloads the page, the table shows the same chapters and note and the stored `chapterIds` has exactly two ids. — verify: `E2E_ENABLED=true pnpm test:e2e -g "plan row keeps its chapters"`
- [ ] AC-48: [backend] When the counselor opens a student who filled the study profile, the page shows the school mode, the two latest exam results, the seven occupied hours, the homework average, the courses, the student's weekly schedule and the goal progress read from Postgres. — verify: `E2E_ENABLED=true pnpm test:e2e -g "counselor sees the full study profile"`
- [ ] AC-49: [backend] When e2e runs with a counselor session, `/dashboard` ends on `/counselor/students`, the sidebar offers only `nav-students` + `nav-profile`, and a student session still sees the five student links. — verify: `E2E_ENABLED=true pnpm test:e2e -g "role separated navigation"`

### Round 6 — two UI improvements (2026-11-24, S3 iteration 3)

Append-only. AC-50..AC-52 are new; AC-3 and AC-26 gained the per-day accordion in
place; no id is renumbered. The new `[ui]` criteria belong to `Stage UI (mock)`
iteration 3 and read only fixtures (`counselor-student.fixture.ts`) and local
state — no schema, migration, action or write request there. Item 1 takes option
(a): studied minutes already exist as ticked blocks resolved through the student's
weekly schedule (zero new columns), and tests need only one subject-attributed
counter per week, whereas (b) would create a second studied-minutes source and a
student write path onto counselor-owned rows. Build: the
«پیشرفت هفته» section of `counselor-student.view.tsx` gains the per-subject rows;
`school-program-table.view.tsx` and the counselor view's «برنامهٔ مدرسه» replace
their per-day blocks with antd `Collapse` items (header = day + that day's total
via `formatDuration`). No new file, no new dependency, no new route.

Tests: `studiedMinutesBySubject` and `planProgress` cases in
`domain/study-plan.test.ts`, the read-model case in `application/study-plan.test.ts`,
the `TestRecord` upsert case in `test/advising/advisor-program-integration.test.ts`,
and the extended `school program round-trip` e2e.

- [ ] AC-50: [ui] When `/counselor/students/<id>?demo=success` renders, the «پیشرفت هفته» card lists one row per subject of the plan with the planned minutes, the studied minutes, the shortfall rendered in hours (`max(0, planned − studied)`) and that subject's test count, next to the existing studied/tests totals; with `?demo=empty` (no plan) it shows «برنامهٔ مشاور ثبت نشده است» and `۰`, never `NaN`. — verify: manual: `pnpm dev`, open `/counselor/students/s-1?demo=success` and `?demo=empty`; the Network tab shows no write request
- [ ] AC-51: [backend] When the counselor read use case runs, `GetStudentStudyPlanUseCase` returns `{ rows: [{ subject, plannedMinutes, studiedMinutes, shortfallMinutes, testsDone }], totals: { plannedMinutes, studiedMinutes, shortfallMinutes, testsDone, testsTarget } }`, where studied minutes are derived per subject from `WeeklyGoal.completedBlocks` resolved to the covering `WeeklySchedule` row by `persianDayOf(dayKey)` and `startMinute`, per-subject tests come from the current week's `TestRecord` rows, `totals.studiedMinutes`/`totals.testsDone` keep the existing `GoalProgress` values (a tick or test outside the plan's subjects is counted only there), and no per-subject studied counter is stored. — verify: `pnpm test -t "subject progress read model"`
- [ ] AC-52: [backend] When `AddTestsDoneUseCase` receives a subject slug, one `$transaction` increments both `WeeklyGoal.testsDone` and the `TestRecord` row unique on `(studentId, subject, weekKey)`, so the same subject twice in a week keeps one row with the summed count and a new week adds its own row; an unknown subject returns a Persian `fieldErrors.subject` and writes nothing, and a non-owner still gets `forbidden`. — verify: `pnpm test -t "subject test record"`

---

## Documentation impact

**UI stage: no README, behavior or changelog change.** Nothing is user-visible in
production yet; fixtures are gate scaffolding, deleted in Stage Backend. Write the
docs when behaviour is real (Stage Backend AP-4 / lite B3).

**`README.md`** (Stage Backend):

1. `## صفحات` — add `/counselor/students/[studentId]`; note «برنامهٔ ثابت مدرسه» as a
   section of `/schedule` and «مشخصات تحصیلی» as a card of `/profile` (not new
   routes).
2. New section `## مشخصات تحصیلی و برنامهٔ مشاور` after `## برنامه هفتگی…`:
   the school program (day/subject/hours, no clock), the student fields (school
   mode, need, mock exams + last two تراز, **non-school** occupied hours per weekday,
   average homework hours, supplementary courses), the counselor page (which shows
   all of those plus the student's own weekly schedule and the goal progress), the
   plan row's **chapters and note** (the chapter catalog is seeded, not an admin
   screen) and the derived
   weekly goal (study minutes = plan total, tests target = plan header). State the
   free-time formula with school hours **derived from the school program** and the
   non-school occupied hours typed once: `wakingMinutes − Σ school − otherOccupied −
   homeworkAverage`.
3. `## برنامه هفتگی، تکالیف و تایمر مطالعه` — replace the timer paragraph: a
   homework tick records the minutes it took; there is no countdown anywhere.
4. `## ساختار کد` / `## دستورها` — `pnpm tsx scripts/seed-advising.ts` now also
   seeds the needs and exams catalogs (idempotent); no new command, no new file.
5. `## دسترسی و نقشها` — the counselor row gains write access to a student's
   study plan (`plan:write`, owner = their own students only); add the new page.
   Add the **role-based sidebar matrix** (student: داشبورد/برنامه هفتگی/تغذیه/همهٔ
   تکالیف/پروفایل; counselor: دانش‌آموزان من/پروفایل) and state that a counselor's
   `/dashboard` request is redirected server-side to `/counselor/students`.
6. `## محدودیتها` — delete the line «خواندن سطرهای برنامهریزی دانشآموزان توسط
   مشاور فقط در لایه استفاده است، بدون صفحهٔ UI تا فاز ۵.۴» and the stale
   «حالت تایمر پومودورو» line; add: no catalog admin UI, no optimizer, the
   counselor program carries no time-of-day, an admin (not a counselor) cannot
   open a student page, and homework minutes are self-reported.
7. `## وضعیت` — add a `فاز ۵.۳.۳ (برنامهٔ مشاور)` line linking this plan.
8. Round 6: item 2 also states the per-subject progress card (planned, studied and
   shortfall hours plus tests per subject) on the counselor page and the per-day
   accordion the school program uses on `/schedule` and the counselor page.

**Config / env:** **none.** No `src/shared/env.ts` key, no `.env.example` change,
no `prisma.config.ts` change, no dependency, no Docker/port change. The only
"config" is seed data (needs, exams, chapters), produced by the
already-documented command.

**Contract doc:** `docs/contracts/advisor-program.md` (`review_level: full`; a
`User` migration plus a counselor cross-tenant write path).

**Behavior doc:** `docs/behaviors/advisor-program.md` — required. Front matter
`last_verified: 2026-11-24` and `source_files` listing at least:
`prisma/schema.prisma`, `prisma/migrations/<ts>_advisor_program/migration.sql`,
`scripts/seed-advising.ts`,
`src/modules/advising/domain/{models,ports,capabilities,free-time,study-plan,chapters,study-blocks,weekly-goal}.ts`,
`src/modules/advising/application/{study-profile,school-program,study-plan,homework,planning-access,weekly-goal}.ts`,
`src/modules/advising/infrastructure/prisma-{catalog,chapter,school-program,study-plan,supplementary-course,student-exam-result,user,homework,weekly-goal}-repository.ts`,
`src/modules/advising/presentation/{advisor-schemas,schemas,messages,planning-format}.ts`,
`src/server/container.ts`, `src/constants/test-ids.ts`,
`src/app/(advising)/layout.tsx`, `src/app/(advising)/profile/**`, `src/app/(advising)/schedule/**`,
`src/app/(advising)/counselor/students/**`, `src/app/(advising)/dashboard/**`,
`test/architecture.test.ts`, `tests/e2e/advising-advisor-program.spec.ts`.
Also refresh `docs/behaviors/access-control-baseline.md` (`plan:write`, the new
route, the counselor read/write rules).

**`docs/plan/phases.md`:** add §۵.۳.۳ with this plan link and the gate
(`pnpm typecheck && pnpm lint && pnpm test && pnpm build`, e2e green).

**Round 5 additions to fold into the changelog sentence:** the plan-row chapters
(idempotently seeded catalog) and note, the role-based sidebar matrix, and the
counselor `/dashboard` → `/counselor/students` redirect.

**Changelog draft (do not write now):**
`## 2026-11-24 — advisor-program` — «ثبت برنامهٔ ثابت مدرسه، مشخصات تحصیلی دانش‌آموز (آزمون/تراز، ساعات اشغال غیرمدرسه، مدرسهٔ مجازی، کلاس تکمیلی)، صفحهٔ کامل دانش‌آموز برای مشاور با فصل‌های انتخابی (فصل ۱، ۲، ۳) و یادداشت هر ردیف برنامه؛ هدف هفته از برنامهٔ مشاور محاسبه می‌شود، دقیقه‌های انجام تکلیف ثبت می‌شود، منوی کنار بر اساس نقش تغییر می‌کند و مشاور به داشبورد دانش‌آموز نمی‌رسد؛ پیشرفت هر درس (ساعت برنامه/مطالعه/کسری و تعداد تست هر درس) و نمایش آکاردئونی برنامهٔ مدرسه به تفکیک روز افزوده می‌شود.»

---

## Resolved decisions (human, 2026-11-24 — do not re-ask)

1. Free time = waking window − school hours (derived from the school program) −
   non-school occupied hours per weekday (club/courses/other) − average daily
   homework minutes. No direct free-hours input; school hours are never typed twice.
2. Homework time = manual minutes entered when ticking complete. No timer.
3. Weekly goal = the counselor's program. Student-entered targets are removed.
4. Sequence: new plan for the new scope; amend `lite-edition` where invalidated;
   UI-first for both.
5. Requirements must be ordered so each stage ships and no stage depends on a
   missing table (→ `## Sequencing`).

## Open questions returned to the Orchestrator

- **OQ-AP-1 (product):** the exam seed list. This plan seeds four common Iranian
  mock-exam providers (قلمچی، گزینه دو، گاج، سنجش) as a placeholder. The human said
  "the list comes from the database" but did not name the rows; the seed is
  editable in `scripts/seed-advising.ts` without a migration.
- **OQ-AP-2 (domain):** the تراز range. This plan validates `0..10000`. If the
  product uses a different scale, only `TARAZ_MAX` and one zod message change.
- **OQ-AP-3 (product, largest):** the school program carries no clock, so today's
  plan still derives its times from the student's own `WeeklySchedule`. A student
  who fills only the school program sees an empty «برنامه امروز». If the human
  wants the counselor's plan to schedule hours of the day, that is a follow-up that
  reuses `WeeklySchedule` with a counselor write path — deliberately out of scope.
- **OQ-AP-4 — RESOLVED (Orchestrator, 2026-11-24), the round-3 answer is overruled:**
  occupied hours no longer include school. School hours are derived from
  `SchoolProgramEntry` and subtracted exactly once; `User.occupiedMinutes` is
  renamed `User.otherOccupiedMinutes` and holds non-school time only (Decision 2,
  invariants 1–2, AC-14, AC-32).
- **OQ-AP-5 (product, round 5):** the chapter seed contents. The human gave the shape
  («مثلاً فصل‌های ۱، ۲، ۳») and said the list must come from the DB, but not the
  rows. This plan seeds a small representative set (ریاضی/فیزیک chapters per grade
  with `field: ""` for عمومی subjects). The rows are editable in
  `scripts/seed-advising.ts` with no migration; if the human wants the real textbook
  table of contents, only the seed changes.
- **OQ-AP-6 (product, round 5):** a counselor still *can* open `/schedule`,
  `/nutrition` and `/homework` by direct URL (they hold those read capabilities);
  round 5 only changes the sidebar. Closing those routes for a counselor is an
  access-control change the human did not ask for — confirm or defer.

## Deferred / out of scope

- Admin CRUD for the `Need` / `Exam` / `Chapter` catalogs (seed + `active` flag only).
- Chapter-level study progress, per-chapter minutes or a chapter picker on the
  student side (round 5 keeps chapters on the counselor's plan row only).
- Hiding `/schedule`, `/nutrition`, `/homework` from a counselor by URL: the sidebar
  matrix is UX, the capability guards are unchanged (OQ-AP-6).
- A separate counselor home/dashboard page: `/counselor/students` is the home, the
  `/dashboard` request just redirects (human decision, round 5).
- An optimizer or AI proposal for the counselor program; `suggestPlanFromSchool`
  is a deterministic copy and the counselor edits every row.
- Time-of-day on the school program or the counselor program (OQ-AP-3).
- Bulk grid editing of program rows (add/delete one row per action).
- Exam history beyond the last two results; تراز trend charts.
- Counselor read of homework minutes and study progress beyond the plan page.
- Any change to `src/modules/rag/**`, `src/app/api/**`, ingestion, chat.
