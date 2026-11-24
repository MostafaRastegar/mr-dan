# Plan — lite-edition: integrated dashboard, computed free time, sidebar settings

Status: **re-approval required at the plan gate.** The 2026-11-23 approval (`review_level: full`)
covered round 1. Round 2 restructured the stages for the mandatory UI-first gate in `AGENTS.md`.
Round 3 (this revision) changes product behaviour in four places (no timer, subject on the plan,
derived goal, homework minutes, free-time formula), so the approval does **not** carry over. Round 4
(2026-11-24) applies the Orchestrator's OQ-AP-4 ruling: the free-time formula subtracts the school
program's hours **once, derived**, and the typed occupied field becomes `otherOccupiedMinutes`
(non-school only). The Orchestrator must put this revision back to the human before any Implementer
work. **Round 5 (2026-11-24)** amends only AC-1 and two `## Spec deltas` items: the sidebar is a
role matrix owned by `advisor-program` Decision 9, and a counselor's `/dashboard` redirects to
`/counselor/students`. The dashboard mock stage is otherwise unchanged.
Product spec (authoritative, Persian): `docs/plan/lite-edition.md`.
Target: `.opencode/plans/lite-edition.md`. Date: 2026-11-24.

Revision 3 (2026-11-24, round 3) **amends** this plan after the human reviewed the built UI and
rejected part of it. The companion plan `.opencode/plans/advisor-program.md` owns the new product
scope. Nothing here is silently rewritten: every changed decision is marked «amended» or
«REMOVED», the `## Spec deltas` section lists what now differs from `docs/plan/lite-edition.md`,
and the human's spec file is untouched. Superseded criteria stay in place as `[~]` so their numbers
keep working.

---

## Derived stack

`mro-project-stack` and `mro-data-model` are **still placeholders** (`unknown`, `<SCHEMA_PATH>`).
Both were loaded; every fact below was re-derived from the tree, not from the skills.

| Fact | Derived from |
|---|---|
| next 16.4.6, react 19.3.1, TS 7.0.2, tailwind 4.3.5, antd 6.7.1, prisma 7.10.1 (driver adapter `PrismaPg`), zod 4, pnpm, vitest, Playwright | `AGENTS.md`, `package.json` |
| Schema of record | `prisma/schema.prisma` (stage-0 deltas already applied) |
| Applied migration | `20261123155516_lite_dashboard_settings` (`prisma migrate status` exit 0) |
| `dayjs` is **not** a project dependency, so antd `TimePicker` cannot be seeded with a stored value (`src/app/(advising)/budget/budget-day.vm.tsx:25` states the same) | `package.json`; grep `dayjs src` → 1 comment |
| 13 `page.tsx` exist; 11 import a local vm/view (`test/architecture.test.ts:214,240`) | `test/architecture.test.ts` |
| `/study` does **not** exist; no `study`/`pomodoro` identifier anywhere under `src/` | `find src/app`; `grep -rn study src` → 0 matches (README lines 55, 78, 108, 142 are stale) |
| `domain/study-blocks.ts` landed **without** `study-blocks.test.ts` | `ls src/modules/advising/domain/*.test.ts` |
| `next dev` rewrites the AGENTS.md Next.js block; do not delete it from a diff | `AGENTS.md` footer |

**Skills loaded:** `mro-project-stack`, `mro-data-model`, `mr-dan-feature-workflow`,
`mr-dan-frontend`, `ponytail` (ultra); re-read in round 3: `mr-dan-architecture`,
`mr-dan-persistence`, `mr-dan-testing-parity`, `mro-behavior-docs`. No skill conflicts `AGENTS.md`;
the only conflict is the placeholder content of the two `mro-*` skills, resolved by derivation
above.

---

## Sequencing

Shared order with `.opencode/plans/advisor-program.md` (authoritative table lives there; this is the
lite half). S0 is done; the rest is sequential.

| # | Stage | Gate to leave it |
|---|---|---|
| S0 | Stage 0 settings data model | **DONE** |
| S1 | **Stage UI (amend v2)** — this plan | `pnpm typecheck && pnpm lint && pnpm build` + `pnpm test` |
| S2 | **HUMAN DEMO v2** | `approvals.ui` set |
| S3–S5 | advisor-program UI mock → demo → backend | see its plan |
| S6 | **B1** real dashboard wiring (reads the advisor-program tables) | full gate green |
| S7 | **B2** destructive removal | full gate green |
| S8 | **B3** docs + e2e | full gate + `E2E_ENABLED=true pnpm test:e2e` |

B1 cannot start before advisor-program's backend: the goal card needs `StudyPlan`, and free time
needs `User.otherOccupiedMinutes`/`homeworkAverageMinutes` and the school program. B2 cannot start
before B1, because the dashboard is still wired to the pre-drop schema.

## Spec deltas (what now differs from `docs/plan/lite-edition.md`)

The human's spec file is **not edited**. These are the differences a reader of the spec will hit:

1. **No timer anywhere.** Spec §۵.۱ («دکمه شروع مطالعه») and the ⏱️ focus panel (this plan's old
   Decision 4) are removed by advisor-program Decision 5 (the human: «تایمر لازم نیست و فشار
   روانی میسازد»). Study time comes only from ticking a block.
2. **«برنامه امروز» must show the subject.** Spec §۲ card 1 showed a clock range only; each block
   row now renders its subject label.
3. **Weekly goal is derived, not set.** Spec §۳ card 3 says «[تنظیم هدف هفته]»; the target now comes
   from the counselor's weekly program (advisor-program Decision 3). The student has no target
   input. `WeeklyGoal.studyMinutesTarget`/`testsTarget` are dropped.
4. **Free time subtracts derived school hours, non-school occupied hours and the homework average.**
   Spec §۳.۲ computed
   `۲۴ − (خواب + مدرسه + بلوکها)`. The human's 2026-11-24 decision replaced it with
   `wakingWindow − Σ schoolMinutes(day) − otherOccupiedMinutes[day] − homeworkAverageMinutes`
   (advisor-program Decision 2).
5. **Completing homework records its duration.** Spec §۴ says a tick is registered as a completed
   block; it now also stores `Homework.spentMinutes` (manual minutes, advisor-program Decision 4).
6. Still out of scope, as the spec already says: streak/🔥, notifications, meal macros.
7. **School hours are derived, non-school occupied hours are typed (round 4).** A day's school
   minutes are summed from `SchoolProgramEntry` and subtracted once; `User.occupiedMinutes` is
   renamed `User.otherOccupiedMinutes` and holds non-school time only, so school hours are never
   entered twice nor subtracted twice (advisor-program OQ-AP-4 ruling, AC-14/AC-32).
8. **The sidebar is role-based and a counselor does not land on the student dashboard (round 5).**
   The link set is a role matrix defined once in `src/app/(advising)/layout.tsx` (student: داشبورد،
   برنامه هفتگی، تغذیه، همهٔ تکالیف، پروفایل؛ counselor: دانش‌آموزان من، پروفایل), and
   `/dashboard` redirects a counselor server-side to `/counselor/students`
   (advisor-program Decisions 9, AC-33/AC-35/AC-43). The dashboard mock stage is otherwise unchanged.

---

## Goal

One authenticated landing screen at `/dashboard` that answers "what do I do today" in one scroll:
today's + tomorrow's homework (each completion carrying its minutes), today's class blocks with
derived 50/10 blocks and their subjects, computed free time with its breakdown, a calorie widget with
one-tap meal ticking, and a **read-only** weekly goal derived from the counselor's program. The top
header nav is replaced by a sidebar whose "تنظیمات" group holds the deep pages. Manual free-time
entry disappears: free time is computed from the waking window minus the school program's hours,
non-school occupied hours and the average
daily homework time (both entered on `/profile` by `advisor-program`'s study card).

## Non-goals

- No timer of any kind — no countdown, no focus panel, no pomodoro UI (human decision 2026-11-24;
  Decision 4 REMOVED). Blocks are ticked, not timed.
- No scheduler, no notifications, no streak/🔥 gamification (spec §۳.۴, §۵ — deferred).
- No student-editable weekly targets: the goal comes from the counselor's `StudyPlan`.
- No RAG/chat/conversation/ingestion change (out of scope by instruction).
- No counselor live dashboard (spec §۵.۴); `/counselor/students` is unchanged apart from the sidebar
  and the «برنامه» link that `advisor-program` adds.
- No macro-level nutrition analysis page (spec §۳.۳ defers it).
- No new dependency, no new env var, no new config key, no design-system change.
- No Jalali calendar library; dates stay `YYYY-MM-DD` Iran day keys (`domain/day-key.ts`).

---

## Decision 1 — one routing shape (constraint #4)

| Question | Decision | Why |
|---|---|---|
| Where is the dashboard? | New `src/app/(advising)/dashboard/page.tsx` (+ `.vm.tsx`/`.view.tsx`) | Inside the group that already has the sidebar layout and the `requireSessionUser` guard (`src/app/(advising)/layout.tsx:12`, `src/server/advising-guards.ts:41`). |
| Public `/` for anonymous? | Stays the landing (`src/app/page.tsx`): login, register, chat, admin, api-docs links. | Anonymous marketing/doc entry must not require a session. |
| Public `/` for a student? | **Server-side** `redirect("/dashboard")` from `next/navigation` inside the `async` Server Component `src/app/page.tsx`, after a soft `getSessionContext()` (`advising-guards.ts:30`). `"use client"` and `useEffect` are forbidden here; the redirect is part of the response, not the browser. This is **Stage Backend B1**, not the mock stage. | "Dashboard on entry" without losing the anonymous landing. `/` cannot itself be the dashboard: it lives outside `(advising)`, and moving it into the group creates two `page.tsx` for the same `/` path (build error). |
| Does the sidebar replace header links? | Yes. `src/app/(advising)/layout.tsx` drops the `<header>` link row; an `<aside>` becomes the only nav. Dashboard greeting moves into card 0. | One nav, no duplication; the spec's "منوی بالا حذف میشود". |
| Mobile | Sidebar becomes a horizontal scroll strip under `md`; no drawer, no device store. | Ponytail: no JS for layout; Tailwind breakpoints only (`docs/plan/frontend-conventions.md` §Responsive). |
| Deep settings | Existing routes stay: `/schedule`, `/nutrition`, `/homework` (labelled «همهٔ تکالیف»), `/profile` grouped under «تنظیمات». | Zero route moves = zero redirect churn; the spec wants fewer *tabs*, not fewer URLs. |
| Capability gating | Capability filtering stays, **plus** a role matrix on the link itself (round 5, advisor-program Decision 9): a counselor sees only `nav-students` + `nav-profile`. Server guards remain the boundary. | `domain/capabilities.ts:79`; a counselor holds the schedule/nutrition/homework read capabilities, so capability filtering alone cannot hide those links. |
| `/budget`, `/leisure` | Nav entries removed in the UI stage; routes and their code **deleted in Stage Backend B2**. | Both are fully absorbed by the dashboard; the UI gate must not delete routes. |
| `/homework` | **Kept** as a settings page (full list + create form). Dashboard card 1 is read+tick and reuses `toggleHomeworkAction` (`src/app/(advising)/homework/homework.actions.ts:32`). | Moving the 4 homework form files into the dashboard buys nothing; creation needs a home. Flagged as OQ-2. |
| `/nutrition` | **Kept** as the physical-profile/energy settings page. | Spec §۳.۳: complex settings move to settings; the dashboard only shows a widget. No page move needed. |
| `/study` | Nothing to delete. README lines 55/78/108/142 are stale and get fixed. | Verified absent. |

Redirect points (B1): `src/app/(auth)/auth.actions.ts:29,45` (`/profile` → `/dashboard`), and
`requireCapability`'s fallback `redirect("/profile")` stays (profile is still a real page).

---

## Decision 2 — fate of `FreeTimeBudget` / `HomeworkPlanEntry` (constraint #3)

Context: `phase-5-3-1-free-time-budget` is at phase `implement`, **0/29 acceptance confirmed, no
approval** (`.opencode/plans/phase-5-3-1-free-time-budget.orchestrator.json`), and introduced
manual `FreeTimeBudget` (`dayKey`, `freeMinutes`) plus `HomeworkPlanEntry` (composite FK on
`[studentId, dayKey]`).

**Decision: drop both tables in Stage Backend B2, no backfill, no data migration.**

- The manual budget is the thing the lite spec deletes (spec §۳.۲, §۴ «FreeTime: حذف جدول دستی»).
- No truthful value can be backfilled: `freeMinutes` was a hand-typed number; the new value is
  derived from `User.wakeMinutes/sleepMinutes` + `WeeklySchedule`. Inventing sleep times would be
  fabricated data.
- The feature was never approved and has no production audience; anything in a dev database is
  disposable. Confirm in OQ-1.
- Cascade effects: `HomeworkPlanEntry` → `FreeTimeBudget` is the only FK between them; drop order
  is `HomeworkPlanEntry` first. `MealPlan` has **no** FK to either table (only `studentId` →
  `User`), so it is untouched by the drop. `Homework.planEntries` relation is removed.
- `tests/e2e/advising-planning.spec.ts` loses its 5 budget tests and keeps schedule/homework;
  `tests/e2e/advising-nutrition-leisure.spec.ts` loses the `/leisure` block.
  `tests/e2e/advising-auth.spec.ts` keeps every assertion except the post-login URL
  (`/profile` → `/dashboard`).

---

## Decision 3 — where "free time", "study progress" and "tests" come from (amended round 3)

- **Free time** =
  `max(0, wakingMinutes − Σ schoolMinutes(day) − otherOccupiedMinutes[dayOfWeek] − homeworkAverageMinutes)`,
  computed per request by `schoolMinutesForDay` + `freeMinutesForDay` in `domain/free-time.ts`.
  **Owned by
  `advisor-program` (its AP-2)**, because it needs the two new `User` columns and the school
  program; this plan does not write that function and B2 only deletes the manual-budget helpers
  around it. Superseded formula:
  `wakingWindow − classMinutesForDay(schedule, day)` (class minutes are no longer subtracted; school
  hours are derived from `SchoolProgramEntry`, not from the typed occupied array).
- `wakingMinutes = ((sleep − wake + 1440) % 1440) || 1440` — unchanged, still this plan's AC-39/40,
  defaults wake `06:30` / sleep `23:00` → 990. No stored budget.
- **Study progress** = sum of minutes of ticked 50/10 study blocks of the current Iran week. Blocks
  are derived from `WeeklySchedule` (`domain/study-blocks.ts`, landed); completion is a set of
  strings on the weekly row. Unchanged.
- **Tests progress** = a counter the student increments on the card (`+تست`). No question bank
  (out of scope since phase 5.3). Unchanged.
- **Weekly targets** (amended — the student no longer sets them): `studyMinutesTarget` =
  `Σ StudyPlanEntry.minutes` written by the counselor, `testsTarget` = `StudyPlan.testsTarget`;
  both owned by `advisor-program` Decision 3.
  **Who changes the code:** the columns, the `WeeklyGoal` type, `goalProgress(goal, targets)`,
  `WeeklyGoalRepositoryPort.upsertTargets`, `SetWeeklyGoalTargetsUseCase` and its container entry
  all change in **advisor-program AP-1/AP-2**, in the same stage that drops the columns — never
  before, or the build breaks on a column that no longer exists. **S1 only stops rendering the two
  inputs** and feeds the fixture plan-derived numbers; `setWeeklyGoalAction` is simply not written.
  After AP, `WeeklyGoal` keeps `testsDone` + `completedBlocks` per `(studentId, weekKey)` and the card
  reads `goalProgress(row, planTargets)`. When no plan exists the card shows
  «برنامهٔ مشاور ثبت نشده است» with percent `0`.

---

## Decision 4 — the study-block ⏱️ control (REMOVED, round 3)

**Status: removed.** The human rejected the timer at the 2026-11-24 review, so neither the ⏱️
control nor the focus panel is built. The section is kept, labelled, so the record shows why the
files below will never exist.

- `_components/study-block-focus.{vm,view}.tsx`, `activeBlockKey`,
  `TEST_IDS.DASHBOARD.BLOCK_FOCUS_OPEN` and `BLOCK_COMPLETE` are **not created**. If the built draft
  contains them, S1 deletes them (Files → delete list).
- Study time comes only from ticking a block. No countdown, no `setInterval`, no `useEffect` in the
  dashboard. Ticking is local state in the UI stage and `toggleStudyBlockAction` in B1.
- The human's remaining need from that control (knowing which subject a block belongs to) is served
  by Decision 6, not by a timer.
- AC-7, AC-8, AC-33 and AC-42 are `[~]` below with this decision as the reason. Re-adding a timer is
  a plan violation, not an implementation detail.

---

## Decision 5 — mock source for the UI stage (new, gate-mandated)

The gate forbids persistence in the UI stage, so the dashboard cannot call a use case yet.

- **One constant fixture**, `src/app/(advising)/dashboard/dashboard.fixture.ts`, typed with the real
  domain models (`HomeworkItem`, `StudyBlock`, `WeeklyGoal`, `MealPlanRecord`, `ProfileView`) and
  built from `domain/study-blocks.ts` + `domain/weekly-goal.ts` (both real). `page.tsx` returns it
  directly: no `getContainer()`, no action file, no env flag, no container edit.
- **All ticks are local `useState`** in `dashboard.vm.tsx`: homework ticked (with its minutes), block
  ticked, meal eaten, `+تست`. Nothing crosses the network in this stage.
- **Demo states** are one `searchParams.demo` switch (`success` default, `empty`, `loading`,
  `error`) rendered by the view; it exists only for the human demo and is deleted in B1.
- **Profile sleep/wake** ride the existing form as two `Form.Item`s using native
  `<Input type="time">`, not antd `TimePicker`: `dayjs` is not a dependency, so a stored value cannot
  be seeded into `TimePicker` (the old draft was wrong here). In the UI stage `profile-form.vm.tsx`
  intercepts `onFinish` and sets a local `savedAt` state instead of calling `updateProfileAction`;
  B3 deletes that branch and restores the real submit. Prefilling uses a 2-line `minutes → "HH:mm"`
  helper; the schema already accepts `"HH:mm"` (stage 0).
- **Schedule blocks** are a read-only projection of the existing `listWeeklySchedule` result; reads
  are allowed in the UI stage. No new data source.

Ponytail: fixture + local state is the smallest thing that demos the whole interface and is deleted
in one move at B1. No mock framework, no `UI_MOCK` env var, no new abstraction.

## Decision 6 — the subject on today's plan (replaces the timer)

- `StudyBlock` gains `subject: string | null` (domain type only, no column); `buildStudyBlocks`
  copies the schedule entry's subject. `studyBlockKey` is unchanged, so stage-0 `completedBlocks`
  keys stay valid (invariant 3).
- `study-plan.view.tsx` renders `subjectLabel(block.subject)` + `formatClock(start)…end` + duration +
  one tick control. A block with no subject renders the time range alone, no placeholder word.
- **Ownership:** the type change and the view live here (S1). `advisor-program` repeats the same
  observable in its AC-7 only because its UI fixture shape changes again; lite AC-45 is the
  authoritative check for the dashboard.

## Decision 7 — homework minutes capture (UI here, column there)

The human: a completed homework records how long it took; the profile holds the **average daily**
homework minutes that free time subtracts.

- **UI** (`dashboard/_components/homework-today.view.tsx`, S1): row becomes
  `[عنوان] [مهلت] [InputNumber دقیقه] [انجام شد]`. «انجام شد» is disabled until the field is a
  positive integer; ticking moves the row to done locally and shows the entered minutes. Unticking
  clears the field. No `Modal`/`Drawer` (the `mr-dan-frontend` bottom-sheet rule never activates).
- **Backend** is `advisor-program`'s: `Homework.spentMinutes Int?` lands in its migration C and
  `SetHomeworkCompletionUseCase` requires `spentMinutes 1..1440` when `completed === true`
  (advisor-program Decision 4 / AC-24). `toggleHomeworkAction(id, completed, spentMinutes?)` is the
  signature change; this plan only calls it from B1.
- **Why not a second column or a timer:** one nullable int on the row being completed is the
  smallest shape; a timer was rejected by the human, and a separate `HomeworkSession` table would
  add a join for one number.
- The profile's `homeworkAverageMinutes` field is `advisor-program`'s `/profile` card (S3), not a
  lite edit. This plan's dashboard only reads it for the free-time breakdown.
- **Owned once:** `Homework.spentMinutes` is created by advisor-program's migration C. Lite B2's
  destructive migration must not touch it; lite B1 verifies it round-trips (AC-49).

---

## Data model deltas

Migration A (**landed, Stage 0**) — `prisma/migrations/20261123155516_lite_dashboard_settings`:

```prisma
model WeeklyGoal {
  id                 String   @id @default(uuid())
  studentId          String
  student            User     @relation("StudentWeeklyGoals", fields: [studentId], references: [id], onDelete: Cascade)
  weekKey            String   // Saturday of the Iran week, "YYYY-MM-DD"
  studyMinutesTarget Int      @default(1500)
  testsTarget        Int      @default(300)
  testsDone          Int      @default(0)
  completedBlocks    String[] @default([]) // "<dayKey>:<startMinute>:<minutes>"
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  @@unique([studentId, weekKey])
}
```

- `User.sleepMinutes Int?` / `User.wakeMinutes Int?` (minutes from local midnight, 0..1439).
- `MealPlan.eatenSlots String[] @default([])` (`"breakfast" | "lunch" | "dinner" | "snack"`).

**Not this plan:** `WeeklyGoal.studyMinutesTarget`/`testsTarget` are dropped by
`advisor-program`'s migration C (its Decision 3), together with every column this feature needs
(`Homework.spentMinutes`, `User.otherOccupiedMinutes`, `User.homeworkAverageMinutes`, the catalogs, the
counselor program). This plan adds no column of its own beyond stage 0 and therefore never blocks
advisor-program's migration order. If the two migrations ever race, AP's runs first (see
`## Sequencing`).

Migration B (destructive, **Stage Backend B2**) —
`pnpm prisma migrate dev --name drop_manual_free_time`:

- drop `HomeworkPlanEntry`, drop `FreeTimeBudget`, drop `User.freeTimeBudgets`, drop
  `Homework.planEntries`.
- after B2, no `WeeklyGoal` target column may exist and `Homework.spentMinutes` must survive — a
  `prisma migrate diff` check catches an accidental drop.

No index is added beyond the two uniques: every read is `(studentId, weekKey)` or
`(studentId, dayKey)` on existing uniques.

---

## Contract

Written to **`docs/contracts/lite-edition.md`** (the review unit); this section is the summary.
`review_level: full` — a destructive migration, columns on `User` (auth-adjacent, holds
`passwordHash`), two deleted routes, four new action paths, one action signature change and two
removed paths. Automated-only review is not enough. Round 3 keeps the level at `full`.

### Routes

| Route | Guard | Behaviour | Stage |
|---|---|---|---|
| `GET /dashboard` | session | Cards: homework (today+tomorrow pending, tick with minutes), today's plan + 50/10 blocks (subject label, tick), free-time breakdown, calorie widget (meal tick), **read-only** weekly goal (target from the counselor plan + need label, `+تست`) | S1 (fixture) → B1 (real) |
| `GET /` | none | Anonymous: current landing. Valid session → `307 /dashboard` | B1 |
| `GET /budget`, `GET /leisure` | — | **deleted** (404) | B2 |
| `GET /schedule`, `/nutrition`, `/homework`, `/profile`, `/counselor/students` | unchanged | reached from the sidebar's «تنظیمات»; `/schedule` gains a read-only block preview; `/profile` gains sleep/wake. The school-program section of `/schedule`, the «مشخصات تحصیلی» card of `/profile` and `/counselor/students/[studentId]` belong to `advisor-program` (S3), not here | UI |

### Actions (`ActionState<T>`, `src/utils/app-error.ts`)

```ts
// existing, extended: two optional hh:mm fields; both-or-neither, sleep !== wake (landed stage 0)
updateProfileAction(prev, formData): ActionState<{ userId: string }>

// reused by the dashboard; signature gains the minutes (advisor-program owns the use case)
toggleHomeworkAction(id: string, completed: boolean, spentMinutes?: number): ActionState<{ id: string }>

// new in B1, dashboard.actions.ts
toggleStudyBlockAction(dayKey: string, startMinute: number, minutes: number, completed: boolean):
  ActionState<{ blockKey: string }>
addTestsDoneAction(prev, formData): ActionState<{ weekKey: string; testsDone: number }> // count 1..100, atomic `increment`
toggleMealSlotAction(slot: MealSlot, eaten: boolean): ActionState<{ dayKey: string; eatenSlots: string[] }>

// REMOVED in round 3: setWeeklyGoalAction — the target is derived from StudyPlan, never written here
```

All four re-resolve the session from the cookie (`getSessionContext`), never accept `studentId`, and
derive `weekKey`/`dayKey`/**today** server-side (`iranDayKey(new Date())`, `weekStartKey`).

Sleep/wake inputs are native `type="time"` strings `"HH:mm"` (ASCII, `dir="ltr"`), never a dayjs
object; the boundary conversion stays `durationToMinutes` (`presentation/time-value.ts`).

The homework minutes field is the only new control with a numeric client contract: an antd
`InputNumber` with `min={1} max={1440}`, submitted as a decimal string and re-validated by
`SetHomeworkCompletionUseCase` (advisor-program AP-2). The tick button is disabled while the value is
not a positive integer, so the invalid case never leaves the browser in practice and is still
rejected on the server.

### Ports (`domain/ports.ts`)

```ts
interface WeeklyGoalRepositoryPort {
  findByKey(studentId: string, weekKey: string): Promise<WeeklyGoal | null>;
  listInRange(studentId: string, fromWeekKey: string, toWeekKey: string): Promise<WeeklyGoal[]>;
  setCompletedBlocks(studentId: string, weekKey: string, blocks: readonly string[]): Promise<WeeklyGoal>;
  incrementTestsDone(studentId: string, weekKey: string, delta: number): Promise<WeeklyGoal>;
  // REMOVED in round 3: upsertTargets — StudyPlanRepositoryPort.findForStudent is the target source
}
interface MealPlanRepositoryPort { /* existing */ setEatenSlots(studentId, dayKey, slots: readonly string[]): Promise<MealPlanRecord>; }
```

Landed in stage 0. `upsertTargets` and `SetWeeklyGoalTargetsUseCase` are deleted by **advisor-program
AP-1/AP-2** together with the column drop (never in S1 — the columns still exist then); the adapter's
`WEEKLY_GOAL_SELECT` loses `studyMinutesTarget`/`testsTarget` in the same stage.
`StudyPlanRepositoryPort` is advisor-program's and is the single target source; B1 wires it into
`GetDashboardUseCase`.
Removed in B2: `FreeTimeBudgetRepositoryPort`, `HomeworkPlanRepositoryPort`,
`UpsertWithinUsedResult`, `UpsertWithinCapacityResult`. `ProfilePatch` already has `sleepMinutes:
number | null; wakeMinutes: number | null`; `UserAccount`/`ProfileView` already expose them.

### Invariants (one enforceable sentence each)

1. A day's free minutes equal `max(0, wakingMinutes − Σ schoolMinutes(day) − otherOccupiedMinutes[dayOfWeek] − homeworkAverageMinutes)`, are never negative or above 1440, and subtract school hours exactly once (derived from `SchoolProgramEntry`) and non-school occupied hours exactly once (typed in `otherOccupiedMinutes`). The function is advisor-program's `freeMinutesForDay`; this plan only calls it.
2. A `WeeklyGoal` row is unique per `(studentId, weekKey)`, and `weekKey` is always the Saturday of the Iran week derived on the server. Its `testsDone`/`completedBlocks` are the only writable fields; both targets come from `StudyPlan` and are never written by the student or by any lite code path.
3. A study block key is `"<dayKey>:<startMinute>:<minutes>"` of a block derivable from that day's schedule; toggling it twice leaves one entry, and the key does not include the subject.
4. Study/test progress is per-week and never mutated by the client-supplied week.
5. Every write path resolves the session from the cookie and refuses a non-owner with `ForbiddenError`.
6. No code, link or test references `FreeTimeBudget`, `HomeworkPlanEntry`, `/budget` or `/leisure` after **Stage Backend B2**.
7. `testsDone` changes only through one atomic statement — `PrismaWeeklyGoalRepository.incrementTestsDone` issues a single `upsert` whose update branch is `{ testsDone: { increment: delta } }` and whose create branch seeds `testsDone: delta`; no read-modify-write exists anywhere, so concurrent `+10` and `+5` always total `15`.
8. `/` must produce its redirect on the server: an authenticated request gets a `307 /dashboard` in the HTTP response itself, never a 200 page plus client-side navigation.
9. During the UI stage, no request from the dashboard, `/schedule` or `/profile` writes to Postgres: the dashboard reads a constant fixture and every tick is local state.
10. A homework rows' `spentMinutes` is written in the same statement as `completedAt` and is `1..1440`; unticking sets both to `null`. No code counts study time from it (it feeds free time only).
11. No timer exists: no `setInterval`, no countdown text, no `study-block-focus` component, no `TEST_IDS` entry for a focus panel in `src/app/(advising)/dashboard/**`.

### Edge cases (each with a `verify:` in the acceptance criteria)

| Case | Expected |
|---|---|
| `sleepMinutes === wakeMinutes` | zod rejects the form: `fieldErrors.sleepTime = "ساعت خواب و بیداری نمیتوانند برابر باشند"`; nothing written. A pre-existing stored equal pair reads as a 1440-minute window |
| sleep/wake unset | 990-minute window (23:00→06:30); dashboard shows free time, never blank |
| school + non-school occupied + homework ≥ waking window | free = `0`, rendered «۰ دقیقه» |
| no `StudyPlan` for the student | goal card shows «برنامهٔ مشاور ثبت نشده است», both bars at `0`, no `NaN`, no crash |
| schedule entry shorter than 50 min | exactly one study block of the entry's own length |
| entry exactly 60 min | one 50-min study + one 10-min break |
| block ticked twice | one key, studied minutes unchanged |
| week boundary (Sunday, `dayOfWeek=1`) | belongs to the previous Saturday's `weekKey` |
| no physical profile | calorie widget shows «اطلاعات فیزیکی را در تنظیمات تغذیه کامل کنید» + link, no number, no throw |
| meal tick with no plan for today | plan is generated (25/35/30/remainder) then the slot is marked eaten |
| `testsDone > testsTarget` | progress bar clamps at 100%, the numbers stay truthful |
| anonymous `/dashboard` | `307 /login` |
| authenticated `/` | `307 /dashboard` |
| broken/absent cookie | `/` still renders 200 (soft read, no throw) |
| `wakingMinutes` wrap yields `0` (sleep === wake, or both `00:00`) | domain reads `0` as `1440`; the profile schema still rejects the equal-pair form, so a stored equal pair can never yield a 0-minute day |
| sleep 02:00 / wake 10:00 | window `960` |
| sleep 23:00 / wake 06:30 | window `990` |
| two concurrent `+تست` increments | both applied by the atomic `increment`; total is the sum, never a lost update |
| homework tick with an empty or `0` minutes field | «انجام شد» stays disabled (client) and the action rejects it (server); `completedAt` stays `null` |
| homework tick with `1441` minutes | rejected by the use case; nothing written |
| untick a homework that had minutes | `completedAt` and `spentMinutes` both `null` |
| goal target edited by hand in DevTools / a stale client | no action accepts a target; the card is read-only and reverts to the derived numbers on refresh |
| UI stage: typing in the sleep/wake fields and pressing save | `savedAt` local state only; no HTTP request carries a write (Network tab shows no server-action POST) |

---

## Files

**Stage 0 — already created (done, do not redo)**

`prisma/schema.prisma`, `prisma/migrations/20261123155516_lite_dashboard_settings/`,
`src/modules/advising/domain/{weekly-goal,study-blocks}.ts` (+ `weekly-goal.test.ts`),
`src/modules/advising/application/weekly-goal.ts` (+ `.test.ts`),
`src/modules/advising/infrastructure/prisma-weekly-goal-repository.ts`,
`test/fakes/weekly-goal.ts`, `test/advising/weekly-goal-integration.test.ts`, plus the stage-0 edits
to `domain/{models,ports,day-key}.ts`, `application/{profile,nutrition}.ts`,
`infrastructure/prisma-{user,meal-plan}-repository.ts`, `presentation/schemas.ts` (+ `.test.ts`),
`server/container.ts` (v5).

**Stage UI (mock) — create**

- `src/app/(advising)/dashboard/page.tsx`, `dashboard.vm.tsx`, `dashboard.view.tsx`
- `src/app/(advising)/dashboard/dashboard.fixture.ts` (deleted in B1)
- `src/app/(advising)/dashboard/_components/`: `homework-today.view.tsx` (with the minutes field),
  `study-plan.view.tsx` (subject label, tick only), `nutrition-widget.view.tsx`,
  `weekly-goal.view.tsx` (read-only bars + `+تست`), `free-time-card.view.tsx` (breakdown line)
- `src/modules/advising/domain/study-blocks.test.ts` (closes the stage-0 gap; the module has no test)

**Stage UI (mock) — modify**

- `src/app/(advising)/layout.tsx` (header row → aside)
- `src/app/(advising)/schedule/schedule-week.view.tsx` (read-only block preview per row)
- `src/app/(advising)/profile/profile-form.{vm,view}.tsx` (sleep/wake native time inputs + mock save)
- `src/modules/advising/domain/study-blocks.ts` (+ `.test.ts`) — `subject` on `StudyBlock`
- **Not edited in S1, on purpose:** `domain/weekly-goal.ts`, `application/weekly-goal.ts`,
  `infrastructure/prisma-weekly-goal-repository.ts` and `server/container.ts`. Their target pieces
  die in advisor-program AP-1/AP-2 with the column drop; editing them here would leave the tree
  unable to compile between S1 and S5.
- `src/constants/test-ids.ts` (`NAV.DASHBOARD`, `DASHBOARD.*`, `DASHBOARD.HOMEWORK_MINUTES`)
- `test/architecture.test.ts` (`withLocalUi` 11 → **12**; `pages` threshold unchanged)

**Stage UI (mock) — delete**

- `src/app/(advising)/dashboard/_components/study-block-focus.vm.tsx` and `.view.tsx` if the built
  draft contains them (Decision 4); also drop `DASHBOARD.BLOCK_FOCUS_OPEN`/`BLOCK_COMPLETE` and
  `activeBlockKey`. No replacement component.

**Stage Backend B1 — create**

- `src/modules/advising/application/dashboard.ts` (+ `.test.ts`)
- `src/app/(advising)/dashboard/dashboard.actions.ts`
- `tests/e2e/advising-dashboard.spec.ts`

**Stage Backend B1 — modify**

- `src/app/(advising)/dashboard/page.tsx` (fixture → `GetDashboardUseCase`), delete
  `dashboard.fixture.ts`, drop the `?demo=` switch
- `src/app/page.tsx` (server redirect), `src/app/(auth)/auth.actions.ts`
- `src/app/(advising)/profile/profile-form.{vm,view}.tsx` (real submit restored)
- `src/server/container.ts` (`CONTAINER_VERSION` **6 → 7**; advisor-program's AP-3 already took 5 → 6. Wire `getDashboard`, `toggleMealSlot`)
- `src/modules/advising/application/leisure.ts` (deps: `weeklyGoal` replaces `budget`/`plans`)
- `src/constants/test-ids.ts` if a control appears only after real wiring
- `docs/contracts/lite-edition.md`

**Stage Backend B2 — modify**

- `prisma/schema.prisma` + `prisma/migrations/<ts>_drop_manual_free_time/`
- `src/modules/advising/domain/{free-time,models,ports,errors,capabilities}.ts` (+ tests)
- `src/modules/advising/application/leisure.ts` (+ test)
- `src/modules/advising/presentation/messages.ts`
- `src/server/container.ts` (**7 → 8**)
- `src/constants/test-ids.ts` (drop `NAV.BUDGET`, `NAV.LEISURE`, `BUDGET.*`)
- `test/architecture.test.ts` (`withLocalUi` 12 → **11**, `pages` `>= 13` → `>= 12`)
- `test/advising/planning-integration.test.ts`, `test/fakes/{advising,planning,nutrition-leisure}.ts`
- `tests/e2e/{advising-auth,advising-planning,advising-nutrition-leisure}.spec.ts`

**Stage Backend B3 — docs**

- `README.md`, `docs/behaviors/lite-edition.md`, `docs/behaviors/access-control-baseline.md`,
  `docs/plan/phases.md`, `docs/contracts/lite-edition.md`

**Stage Backend B2 — delete**

- `src/app/(advising)/budget/**` (9 files), `src/app/(advising)/leisure/page.tsx`
- `src/modules/advising/application/{free-time,homework-plan}.ts` + tests
- `src/modules/advising/infrastructure/prisma-{free-time-budget,homework-plan}-repository.ts`
- `src/modules/advising/presentation/free-time-schemas.ts` + test
- `test/advising/free-time-integration.test.ts`

---

## Ordered stages

Shared with `.opencode/plans/advisor-program.md` (its `## Sequencing` table is authoritative):

1. **S0 — Stage 0, settings data model (DONE)** — landed and green; see the next section.
2. **S1 — Stage UI (mock), amend v2** — this plan: sidebar, dashboard v2 (no timer, subject on the
   plan, read-only goal, homework minutes, free-time breakdown), sleep/wake fields. Fixtures and
   local state only; `typecheck && lint && build` and `pnpm test` green.
3. **S2 — HUMAN DEMO v2** — explicit written approval; `approvals.ui` set. **No backend starts
   before this.**
4. **S3–S5 — advisor-program** — its UI mock, its demo, its Stage Backend (migration C, catalogs,
   study profile, counselor program, `Homework.spentMinutes`, `freeMinutesForDay`). Not this plan.
5. **S6 — B1** — real dashboard wiring + server redirect, consuming the advisor-program tables.
6. **S7 — B2** — destructive removal of the manual free-time vertical.
7. **S8 — B3** — docs + e2e + full gate.

Each stage ends green on its own. No stage leaves a dangling reference, and no stage here is built
on a table that does not exist yet: S1 is pure fixtures, and B1's reads are all created in S5.

---

## Stage 0 — settings data model (DONE)

Landed and verified by the Orchestrator before this revision; **do not re-plan or redo it**:
`WeeklyGoal` model, `User.sleepMinutes`/`wakeMinutes`, `MealPlan.eatenSlots`, migration
`20261123155516_lite_dashboard_settings` (applied, `prisma migrate status` exit 0);
`domain/weekly-goal.ts`, `domain/study-blocks.ts`, `application/weekly-goal.ts`,
`infrastructure/prisma-weekly-goal-repository.ts` (atomic `incrementTestsDone`), `setEatenSlots` on
the meal-plan repo, sleep/wake on the profile schema + user repo, `container.ts` v5 wiring.
Tests: `domain/weekly-goal.test.ts`, `application/weekly-goal.test.ts`, `presentation/schemas.test.ts`,
`test/advising/weekly-goal-integration.test.ts`, `test/fakes/weekly-goal.ts`.
Evidence: `pnpm typecheck` exit 0, `pnpm test` exit 0 (286 passed), `prisma migrate status` exit 0.
Known gap this plan closes in the UI stage: `domain/study-blocks.ts` shipped without a test file.
`ToggleMealSlotUseCase` exists but is not yet wired in `container.ts` (B1).

---

## Stage UI (mock) — lite v2 amendment

**Scope:** the remaining lite user-facing surface **as amended by the human's 2026-11-24 review**.
No `prisma/schema.prisma` edit, no migration, no new `"use server"` file, no route deletion, no
`getContainer()` call from the dashboard. The school-program/study-profile/counselor surfaces are
`advisor-program`'s Stage UI (S3) and are not built here.

### What changed since the first UI draft

| First draft | v2 (this plan) |
|---|---|
| ⏱️ per block + focus panel with a countdown | **removed**; the row shows the **subject** + time range + one tick |
| card 3 had two editable target inputs | read-only bars; target = counselor plan total, tests target = plan header; `+تست` stays |
| homework tick = checkbox | checkbox + required minutes (`InputNumber`, 1..1440) |
| free time = one number | number + breakdown line «بیداری ۱۶:۳۰ − مدرسه ۴:۰۰ − اشغال ۳:۰۰ − تکلیف ۱:۰۰» (school term marked derived) |
| `?demo=` fixture only | unchanged; the fixture gains subject, need, derived targets, school rows, otherOccupied/homework |

### Files and what each does

- `layout.tsx`: `<header>` link row replaced by an `<aside>`. Groups: «داشبورد» (`/dashboard`,
  `TEST_IDS.NAV.DASHBOARD`), «تنظیمات» (`/schedule`, `/nutrition`, `/homework` labelled
  «همهٔ تکالیف», `/profile`), counselor-only `/counselor/students`; full name + logout form
  (`TEST_IDS.NAV.LOGOUT` unchanged). Budget/leisure links removed. Desktop: `md:grid
  md:grid-cols-[14rem_1fr]`; mobile: `overflow-x-auto` strip with `shrink-0` links, ≥44px targets,
  `focus-visible` kept. Same `hasCapability` conditions as `layout.tsx:27-81` minus budget/leisure.
- `dashboard/page.tsx` (server, ≤40 lines): `requireSessionUser()`, reads
  `searchParams.demo`, returns `<DashboardWrapper data={DASHBOARD_FIXTURE} demo={demo} />`.
  No container, no action.
- `dashboard.fixture.ts`: one constant `DashboardData` typed **locally** (greeting name, two pending
  homework items (today/tomorrow), today's schedule row → `buildStudyBlocks` with `subject`, free
  minutes, meal plan + no-physical-profile variant, book line, `needLabel`, a
  `goal: { studiedMinutes; studyMinutesTarget; testsTarget; testsDone } | null` plain read model,
  school-program rows and `otherOccupiedMinutes`/`homeworkAverageMinutes` constants). The goal is **not** typed as the domain
  `WeeklyGoal`: advisor-program AP-2 deletes its two target fields and would otherwise break this
  fixture mid-sequence. `B1` replaces `goal` with `goalProgress(row, planTargets)`.
- `dashboard.vm.tsx` (`"use client"`): all demo state — `tickedHomework: Map<string, number>`
  (id → minutes), `tickedBlocks: Set<string>`, `eatenSlots: Set<string>`, `testsDone`. **No**
  `targets` state and **no** `activeBlockKey`. No `useEffect`; passes handlers to
  `dashboard.view.tsx`. `dashboard.view.tsx` stays ≤80 lines per the architecture test, so the
  homework row with its minutes field lives in `_components/homework-today.view.tsx`.
- `dashboard.view.tsx`: card 0 greeting; card 1 homework (checkbox + required minutes);
  card 2 today's plan (`subjectLabel(block.subject)` + time range, tick only) + free time with the
  breakdown line + book line; card 3 weekly goal (two read-only bars showing the plan-derived
  target and the need label, `+۱۰ تست`); calorie widget card. Every interactive element carries a
  `TEST_IDS.DASHBOARD.*` id (`DASHBOARD.HOMEWORK_MINUTES(id)` added).
- `weekly-goal.view.tsx`: props become the fixture's local `DashboardGoal` shape, not the domain
  `WeeklyGoal` (so AP-2's field removal cannot break it); drops both `Input`s and
  `onSetStudyTarget`/`onSetTestsTarget`; keeps `percentOf` (clamped at 100 with truthful raw numbers)
  and the `+تست` control; renders the need label and, when `goal === null`,
  «برنامهٔ مشاور ثبت نشده است».
- `free-time-card.view.tsx`: shows `formatDuration(freeMinutes)` plus the breakdown sentence built
  from wake/sleep/school/otherOccupied/homework — computed by the real
  `schoolMinutesForDay` + `freeMinutesForDay`, so the demo shows
  the truth.
- `homework-today.view.tsx`: `[title] [deadline] [InputNumber دقیقه] [انجام شد]`; the button is
  disabled until the minutes value is a positive integer. Local state only.
- `schedule-week.view.tsx`: under each row, the derived blocks (`buildStudyBlocks` +
  `formatMinutes`) rendered read-only; existing form/table/delete flow and `SCHEDULE.*` ids untouched.
- `profile-form.{vm,view}.tsx`: two student-only `Form.Item`s `sleepTime`/`wakeTime` with
  `<Input type="time" dir="ltr" data-testid={TEST_IDS.FORM.INPUT("sleepTime"|"wakeTime")} />`,
  prefilled from `profile.sleepMinutes`/`wakeMinutes` via a 2-line `"HH:mm"` helper; `onFinish`
  is intercepted to set local `savedAt` and renders `role="status"` «ذخیره شد» (mock). Counsellors
  see neither field. The «مشخصات تحصیلی» card is advisor-program's and is **not** added here.

### Defects in the built draft that S1 fixes

- `dashboard.view.tsx:78` renders a garbled sentence (`چه چیز امروز به Reihe کارتان می‌آید؟`). Replace
  it with a plain Persian line about today's work. It is live text in the demo, not a placeholder.
- `layout.tsx:107,113` renders the whole `navLinks` fragment twice (desktop rail + mobile strip),
  group headings included. Extract the link list as a `.map` over `{ href, label, testId }` objects
  so the mobile strip contains links only; no duplicate ids in the DOM.

### States (all four, per card)

`?demo=success` (default), `?demo=empty` (no homework, no schedule, no physical profile, zero goal),
`?demo=loading` (`<Spin>` per card), `?demo=error` (Persian `role="alert"`, no raw message). RTL
inherited globally; no horizontal overflow at 360px; 200% zoom safe.

### Proves it

`pnpm typecheck && pnpm lint && pnpm build` → tsc 0, oxlint 0, `next build` succeeds with
`/dashboard` in the route table. Plus `pnpm test --run src/modules/advising/domain/study-blocks.test.ts`
and `--run src/modules/advising/domain/weekly-goal.test.ts` → green. Implementer then returns
**`UI READY FOR DEMO`** with the routes, the `?demo=` matrix and `pnpm dev`.

---

## HUMAN DEMO CHECKPOINT

**Stop here until the human approves in writing.** This is **demo v2**: the v1 demo was reviewed and
the human asked for the changes above, so v1 approval is not carried over. The Orchestrator presents:

- `pnpm dev`
- `/dashboard?demo=success`, `?demo=empty`, `?demo=loading`, `?demo=error` — plan rows with subjects,
  no timer, read-only goal with the need label, required homework minutes, free-time breakdown
- `/schedule` (block preview under a row), `/profile` (sleep/wake fields), 390px and 1280px wide
- the sidebar on every advising page

The human checks look and flow; approval is recorded as `approvals.ui` (ISO) in
`.opencode/plans/lite-edition.orchestrator.json` and the phase moves `ui-mock → ui-approved`.
Without it, S3 (advisor-program UI) and every backend stage do not start (reviewer raises CRITICAL
"UI gate not approved").

---

## Stage Backend

### B1 — real dashboard wiring + server redirect (non-destructive)

**Starts only after S5.** Every read below is a table/adapter created by `advisor-program`'s Stage
Backend; nothing here creates a column.

- `application/dashboard.ts`: `GetDashboardUseCase(users, schedule, homework, goals, studyPlan,
  nutrition: GetNutritionOverviewUseCase, leisure: GetLeisureSuggestionUseCase)` →
  `{ todayKey, greetingName, homework: {today, tomorrow}, blocks, freeMinutes, freeTimeBreakdown,
  nutrition, goal, needLabel, book }` in ≤45 lines; card 1 filters
  `completedAt === null && iranDayKey(deadline) <= tomorrow`; `goal` = `goalProgress(row, {
  studyMinutesTarget: planMinutesTotal(plan?.entries ?? []), testsTarget: plan?.testsTarget ?? 0 })`;
  `freeMinutes` = `freeMinutesForDay` with the day's `schoolMinutesForDay(schoolProgram, day)`,
  `otherOccupiedMinutes[day]` and `homeworkAverageMinutes`;
  `blocks` carry `subject`.
- `dashboard/page.tsx` calls the use case; delete `dashboard.fixture.ts` and the `?demo=` switch.
- `dashboard.actions.ts` (`"use server"`) with the three new actions; `toggleHomeworkAction`
  imported from `homework.actions.ts` (minutes argument); all re-resolve the session, never accept
  `studentId`. No `setWeeklyGoalAction` is written — the target has no write path left.
- Card ticks switch from local state to the actions + `router.refresh()` (same pattern as
  `homework-controls.vm.tsx:14-23`), including the minutes value on the homework tick. No
  `useEffect` for data, no store, no `revalidatePath`.
- `src/app/page.tsx` becomes `async`: `const session = await getSessionContext();` then
  `if (session) redirect("/dashboard");` — `redirect()` at top level, never inside `try/catch`
  (it throws `NEXT_REDIRECT`). Anonymous branch returns the existing landing JSX untouched.
  No `"use client"`, no `useEffect`; cookies make the route dynamic automatically.
- `auth.actions.ts` post-login/register redirect `/profile` → `/dashboard`.
- `profile-form.vm.tsx`: delete the mock branch, restore `submit`; sleep/wake now persist through
  the already-landed schema + `updateProfileAction` (no action edit).
- `container.ts` v7: `getDashboard`, `toggleMealSlot`; `leisure` deps unchanged until B2.
- `test/architecture.test.ts` unchanged (counts already 12 local after the UI stage).
- e2e: `tests/e2e/advising-dashboard.spec.ts` (auth, homework tick with minutes, block tick,
  calories, meal tick, derived weekly goal, `/` redirect). No focus-panel case exists.

Proves it: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`; `curl -i localhost:3000/`
with a session cookie shows `307` + `location: /dashboard`.

### B2 — remove the manual free-time vertical (destructive)

`freeMinutesForDay` and its formula are **advisor-program's** (AP-2) and are not rewritten here;
B2 only removes what the manual budget left behind.

- **Step 0 — dev DB backup (mandatory gate).** With `docker compose up -d postgres` running:
  `f=".opencode/backups/$(date +%Y-%m-%d-%H%M)-pre-lite-edition.sql"` then
  `docker compose exec -T postgres pg_dump -U mr_dan -d mr_dan > "$f"` then `test -s "$f" || exit 1`.
  Convention: `.opencode/backups/2026-11-23-studysession.sql`. An empty or missing dump **fails the
  stage** — do not apply migration B. A stale `2026-11-23-1913-pre-lite-edition.sql` already sits in
  that directory; the gate needs a dump written after the stage-0 migration, which AC-43's
  `find … -newer` enforces. If the shell scanner rejects `$(date …)`, run `date +%Y-%m-%d-%H%M`
  first and paste the literal.
- Migration B; deletes in the Delete list; `Homework.planEntries` relation removed. It must not
  touch `WeeklyGoal` (its target columns are already gone), `Homework.spentMinutes`,
  `User.otherOccupiedMinutes`/`homeworkAverageMinutes` or any advisor-program table; a
  `prisma migrate diff` review confirms it.
- `domain/free-time.ts`: keep `wakingMinutes`, `schoolMinutesForDay`,
  `otherOccupiedMinutesForDay`, `freeMinutesForDay`,
  `formatMinutes` (all landed by AP-2). Delete `classMinutesForDay` **only if** nothing outside the
  free-time tests still calls it — check `buildStudyBlocks` first; otherwise leave it and delete
  only the manual helpers. Delete `WEEKLY_FREE_BASE_MINUTES`, `suggestFreeMinutes`, `dayCapacity`,
  `fitsCapacity`, `durationMessage` and their tests unconditionally.
- `domain/free-time.test.ts`: keep the `wakingMinutes` boundary table (02:00/10:00 → 960,
  23:00/06:30 → 990, equal → 1440, `(0,0)` → 1440) and the formula tests that arrived with AP-2;
  delete the manual-budget cases.
- `application/leisure.ts` keeps `suggestLeisure`/`pickBook` and its public shape; deps become
  `(users, schedule, weeklyGoal, homework)`; `freeMinutes7d` = Σ computed free minutes over
  `[today-6, today]`, `plannedMinutes7d` = Σ completed-block minutes over the same window. The
  dashboard is its only caller.
- Delete `budget:read`/`budget:write` from `domain/capabilities.ts` and `capabilities.test.ts`;
  keep `leisure:read` (used by the leisure use case).
- `test/architecture.test.ts`: `withLocalUi` 12 → **11**, `pages >= 13` → `>= 12` (two `page.tsx`
  deleted, dashboard already counted).
- `test-ids.ts`: drop `NAV.BUDGET`, `NAV.LEISURE`, `BUDGET.*`; keep `NAV.HOMEWORK`.
- e2e: delete the five `/budget` tests and the `/leisure` block; rewrite `advising-auth.spec.ts`'s
  post-register/post-login URL to `/dashboard`; `registerStudent` helpers expect `/dashboard` and
  then `page.goto` the page under test.

Proves it: `pnpm exec prisma migrate dev --name drop_manual_free_time && pnpm prisma validate &&
pnpm typecheck && pnpm test` → applied, no drift, tsc 0, vitest 0. Plus
`! grep -rn "FreeTimeBudget\|HomeworkPlanEntry" src test`.

### B3 — docs + e2e + full gate

- `README.md` per Documentation impact; `docs/behaviors/lite-edition.md`;
  `docs/behaviors/access-control-baseline.md`; `docs/contracts/lite-edition.md`;
  `docs/plan/phases.md`.
- e2e assertions from the UI stage stay green; no `test.skip` beyond the `E2E_ENABLED` gate.

Proves it: `pnpm typecheck && pnpm lint && pnpm test && pnpm build` then
`E2E_ENABLED=true pnpm test:e2e` (services up) → all green, 0 skipped e2e in the dashboard spec.

---

## Test plan

**Stage UI (mock)**
- `domain/study-blocks.test.ts` (new): 120-min entry → 50/10/50 (break between only, not after);
  60-min entry → 50 + 10 break; 40-min entry → one 40-min block, no break; `subject` copied onto
  every block; key round-trip is unaffected by the subject.
- `domain/weekly-goal.test.ts`: untouched in S1; the `goalProgress(goal, targets)` cases belong to
  advisor-program AP-2, which changes the signature.
- Manual demo matrix: `/dashboard` four `?demo=` states (subject on plan rows, no ⏱️, read-only goal,
  homework minutes required, free-time breakdown), `/schedule` preview, `/profile` pickers,
  sidebar at 390px/1280px, keyboard: Tab through the sidebar, Enter/Space on a homework tick.

**Unit — domain** (`vitest`, no DB, no network)
- `domain/free-time.test.ts` (B2 edits only; the formula arrived with advisor-program AP-2):
  keep the `wakingMinutes` boundary table — 02:00/10:00 → 960, 23:00/06:30 → 990, equal sleep/wake →
  1440, both `00:00` → 1440 (`0` wrap read as a full day); keep `formatMinutes` Persian text; delete
  the manual-budget cases (`suggestFreeMinutes`, `dayCapacity`, `fitsCapacity`, `durationMessage`).
- `domain/weekly-goal.test.ts` (landed, amended): studied minutes sum from keys; percent clamped at
  100 while the raw numbers stay; **no default targets** — the two targets are an argument.
- `domain/day-key.test.ts` (landed): `weekStartKey` for a Saturday, Sunday (previous Saturday),
  Friday (same week), across a month boundary.
- `domain/capabilities.test.ts` (B2): budget capabilities gone from all three roles; `leisure:read`
  kept.

**Unit — application (fakes only)**
- `application/dashboard.test.ts` (B1): composes today+tomorrow homework only; today's blocks
  derived from `persianDayOf`; no profile → `energy: null`; no `StudyPlan` → goal targets `0/0` and
  no throw; `freeMinutes` comes from `freeMinutesForDay`, not from class minutes.
- `application/weekly-goal.test.ts` (landed, amended): toggle adds one key; toggle-back removes it;
  second identical toggle does not duplicate; tests accumulate; another student's row is
  `ForbiddenError`; **no targets-upsert case** (the use case is deleted by advisor-program AP-1).
- `application/nutrition.test.ts` (landed): toggle creates today's plan when missing, then flips one
  slot; unknown slot rejected by zod.
- `application/leisure.test.ts` (B2): recomputed inputs (free minutes 7d, studied minutes 7d,
  backlog) still produce the same five branches.

**Integration — real Postgres, graceful skip** (`test/advising/`)
- `weekly-goal-integration.test.ts` (landed): unique `(studentId, weekKey)`; `completedBlocks`
  persists as `text[]`; cascade delete with the user; `setEatenSlots` round-trip on `MealPlan`;
  **`incrementTestsDone` atomicity** — start at `0`, `delta 10` then `delta 5`, assert `15`; a
  second case fires both increments without awaiting in between and still asserts `15`.
- `planning-integration.test.ts` (B2): budget cases removed; schedule/homework cases untouched.
- `free-time-integration.test.ts`: **deleted** in B2.

**E2E — `tests/e2e/advising-dashboard.spec.ts`** (B1, gated by `E2E_ENABLED=true`)
- anonymous `/dashboard` → `/login`; authenticated `/` → `/dashboard`.
- register → lands on `/dashboard`; card 1 lists a homework created on `/homework`; ticking it with
  ۴۵ دقیقه removes it from the pending list and `/homework` shows the row done with `45`.
- today's schedule entry shows its 50/10 blocks **with their subject labels**; ticking the first
  block raises «ساعت مطالعه» on card 3 and survives reload; no `[data-testid*=focus]` element and no
  «⏱» text exists anywhere on the page.
- free time text equals `freeMinutesForDay` for the seeded sleep/wake + school program + non-school
  occupied hours + homework average, and the breakdown line names all three subtrahends (school,
  occupied, homework).
- sleep/wake: save 23:00 / 06:30 on `/profile`, reload, both inputs show the saved values.
- calorie widget: with no physical profile it shows the settings link; after saving one on
  `/nutrition`, the target appears; ticking صبحانه raises the progress.
- weekly goal: the counselor plan (saved on the counselor page) plus `+۱۰ تست` → the card shows the
  plan's hours total, the plan's tests target and `۱۰`; there is no target input and no POST carrying
  a target.
- sidebar: every link navigates; no `nav-budget`/`nav-leisure` testid exists; `/budget` and
  `/leisure` render the 404 page (B2).

**Architecture test** — `test/architecture.test.ts`: `withLocalUi` 11 → 12 in the UI stage;
12 → 11 and `pages >= 12` in B2. No other rule changes; the dashboard page stays ≤40 lines and its
client half is a `.vm.tsx`/`.view.tsx` pair.

---

## Acceptance Criteria

Status legend: `- [ ]` pending, `- [x]` confirmed with `evidence:`, `- [~]` deferred with `reason:`.
Labels: `[ui]` = Stage UI (mock); `[backend]` = Stage Backend (B1–B3).

### Stage UI (mock)

- [ ] AC-1: [ui] When any advising page renders, the top header link row is gone and a sidebar shell is the only nav, whose link set is a **role matrix defined once in `src/app/(advising)/layout.tsx`** (advisor-program Decision 9 owns the matrix; this criterion verifies it): a student sees `nav-dashboard`, `nav-schedule`, `nav-nutrition`, `nav-homework`, `nav-profile`; a counselor sees `nav-students` and `nav-profile` only and therefore has **no** `nav-dashboard`, `nav-schedule`, `nav-nutrition`, `nav-homework`; each link navigates on click and no `nav-budget`/`nav-leisure` element exists. — verify: manual: `pnpm dev`, open `/dashboard` as a student and as a counselor, click every sidebar entry and count the `data-testid`s; inspect that no header `<header>` nav row exists
- [ ] AC-2: [ui] When the sidebar is viewed at 390px, it becomes a horizontal scroll strip containing only links (no group headings) with no page horizontal overflow and ≥44px tap targets; at 1280px it is a fixed left/right rail with the same links. — verify: manual: DevTools responsive 390px and 1280px on `/dashboard`; check `document.documentElement.scrollWidth === clientWidth`
- [ ] AC-3: [ui] When `/dashboard` opens with the mock fixture, card 0 shows the greeting, card 1 the two pending homework rows each with a minutes field, card 2 today's plan with subject-labelled blocks + the free-time breakdown + book line, card 3 the read-only goal bars with the need label and `+۱۰ تست`, and the calorie widget is visible. — verify: manual: open `/dashboard` with `pnpm dev`
- [ ] AC-4: [ui] When `/dashboard?demo=empty`, `?demo=loading`, `?demo=error` and `?demo=success` are opened, each renders its Persian state (Empty texts, `Spin`, `role="alert"`, normal cards) with no raw error text and no layout break. — verify: manual: open all four URLs on `/dashboard`
- [ ] AC-5: [ui] When the dashboard homework tick is pressed with a minutes value, the row leaves the pending list showing that duration; pressing it with an empty field does nothing; the Network tab shows no write. — verify: manual: tick the first homework with an empty minutes field, then with ۴۵, on `/dashboard?demo=success`; watch the Network tab
- [ ] AC-6: [ui] When a 120-minute schedule entry is expanded, the blocks are 50 study / 10 break / 50 study; a 60-minute entry is one 50-min study plus a 10-min break; a 40-minute entry yields one 40-minute study block with no break. — verify: `pnpm test --run src/modules/advising/domain/study-blocks.test.ts`
- [~] AC-7: [ui] When ⏱️ is activated on a 50-minute block, an inline focus panel opens showing `50:00` and counting down with no navigation; Escape closes it and returns focus to the ⏱️ control. — verify: manual: open `/dashboard?demo=success`, Tab to ⏱️, press Enter, observe `50:00`, press Escape — reason: the timer/focus panel was removed by the human on 2026-11-24; replaced by AC-45; deferred at plan round 3 (2026-11-24)
- [~] AC-8: [ui] When «پایان و ثبت» is pressed in the mock focus panel, the panel closes, the block shows ticked, and card 3's studied minutes rise by that block's minutes (local state only). — verify: manual: complete a block on `/dashboard?demo=success` — reason: same removal; there is no focus panel to complete; deferred at plan round 3 (2026-11-24)
- [ ] AC-9: [ui] When صبحانه is ticked in the mock calorie widget, the slot shows eaten and the eaten-calorie progress rises (local state only). — verify: manual: tick صبحانه on `/dashboard?demo=success`
- [ ] AC-10: [ui] When the mock fixture has no physical profile, the calorie widget renders the Persian settings sentence and a link to `/nutrition`, with no calorie number and no throw. — verify: manual: open `/dashboard?demo=empty`
- [~] AC-11: [ui] When 20 hours / 200 tests are entered and `+۱۰ تست` is pressed on the mock card 3, the displayed numbers update and each bar clamps at 100% while the raw numbers stay truthful. — verify: manual: use the goal controls on `/dashboard?demo=success` — reason: the student no longer sets targets (advisor-program Decision 3); replaced by AC-47; deferred at plan round 3 (2026-11-24)
- [ ] AC-12: [ui] When a student opens `/profile`, two native time inputs labelled sleep/wake show the stored values (`23:00`/`06:30` from the fixture) with `dir="ltr"`, and pressing the form's save shows a Persian «ذخیره شد» status while the Network tab shows no write request; a counselor sees neither input. — verify: manual: open `/profile` as a student and as a counselor, press save, watch the Network tab
- [ ] AC-13: [ui] When the UI stage is inspected, no persistence code was added: the dashboard route contains no `"use server"` file, `dashboard/page.tsx` contains no `getContainer`, and `prisma/migrations` gained no directory other than the stage-0 `lite_dashboard_settings`. — verify: `! grep -rq "use server" src/app/*advising*/dashboard && ! grep -q "getContainer" src/app/*advising*/dashboard/page.tsx && ! git status --short -- prisma/migrations | grep -v lite_dashboard_settings | grep -q .`
- [ ] AC-14: [ui] When the UI gate build runs, `pnpm typecheck && pnpm lint && pnpm build` exits 0 and `next build` lists `/dashboard` in the route table. — verify: `pnpm typecheck && pnpm lint && pnpm build`

### Stage Backend

- [ ] AC-15: [backend] When `lite_dashboard_settings` is applied then `drop_manual_free_time`, `pnpm exec prisma migrate status` reports the database is up to date with no pending or failed migration. — verify: `pnpm exec prisma migrate status`
- [ ] AC-16: [backend] When the schema is validated, `WeeklyGoal` exists with `@@unique([studentId, weekKey])`, `User` has nullable `sleepMinutes`/`wakeMinutes`, `MealPlan` has `eatenSlots`, and `FreeTimeBudget`/`HomeworkPlanEntry` are absent. — verify: `pnpm prisma validate && grep -c "model FreeTimeBudget\|model HomeworkPlanEntry" prisma/schema.prisma | grep -qx 0`
- [~] AC-17: [backend] When wake is 06:30, sleep 23:00 and the day has 180 class minutes, free time is exactly 810 minutes rendered as «۱۳ ساعت و ۳۰ دقیقه». — verify: `pnpm test -t "waking window"` — reason: the free-time formula no longer subtracts class minutes; advisor-program AC-14..AC-16 own it; deferred at plan round 3 (2026-11-24)
- [~] AC-18: [backend] When class minutes exceed the waking window, free time is exactly 0 and never negative. — verify: `pnpm test -t "free minutes never negative"` — reason: same formula change; the occupied+homework clamp is advisor-program AC-15; deferred at plan round 3 (2026-11-24)
- [~] AC-19: [backend] When sleep and wake are unset, the window is 990 minutes (23:00→06:30) and the dashboard still renders free time. — verify: `pnpm test -t "default sleep window"` — reason: wakingMinutes/990 moved to advisor-program's suite; the lite slice is AC-39/AC-40; deferred at plan round 3 (2026-11-24)
- [ ] AC-20: [backend] When the same study block is ticked twice, `completedBlocks` holds one key and studied minutes are unchanged. — verify: `pnpm test -t "toggle block is idempotent"`
- [ ] AC-21: [backend] When the day key is a Sunday, `weekStartKey` returns the previous Saturday and an entry on Friday maps to the same week. — verify: `pnpm test -t "week starts on saturday"`
- [ ] AC-22: [backend] When `sleepTime === wakeTime` or a time is outside `00:00..23:59` is submitted, the profile action returns `ok: false` with a Persian `fieldErrors.sleepTime` and writes nothing. — verify: `pnpm test -t "sleep window"`
- [ ] AC-23: [backend] When a student saves sleep 23:00 / wake 06:30 on `/profile` and reloads, both inputs show the saved values. — verify: `E2E_ENABLED=true pnpm test:e2e -g "sleep and wake persist"`
- [ ] AC-24: [backend] When a student opens `/dashboard`, card 1 lists only pending homework due today or tomorrow and shows today's schedule blocks. — verify: `E2E_ENABLED=true pnpm test:e2e -g "dashboard shows today"`
- [ ] AC-25: [backend] When the student ticks a homework on the dashboard, it leaves the pending list and `/homework` shows it completed. — verify: `E2E_ENABLED=true pnpm test:e2e -g "tick homework"`
- [ ] AC-26: [backend] When the student ticks a study block, card 3 study hours increase by that block's minutes and the value survives a reload. — verify: `E2E_ENABLED=true pnpm test:e2e -g "block raises study progress"`
- [ ] AC-27: [backend] When no physical profile exists, the calorie widget renders a link to `/nutrition` and no calorie number; after saving a profile the target appears. — verify: `E2E_ENABLED=true pnpm test:e2e -g "calorie widget"`
- [ ] AC-28: [backend] When the student ticks صبحانه, `MealPlan.eatenSlots` contains `breakfast` and the eaten-calorie progress rises by that slot's calories. — verify: `pnpm test -t "toggle meal slot"`
- [~] AC-29: [backend] When the student sets 20 hours / 200 tests and adds 10 tests, the goal card shows the real numbers and each bar is capped at 100%. — verify: `E2E_ENABLED=true pnpm test:e2e -g "weekly goal"` — reason: manual targets removed; the derived goal replaces this check in AC-47 and AC-49; deferred at plan round 3 (2026-11-24)
- [ ] AC-30: [backend] When a logged-in user visits `/`, the server redirects to `/dashboard`; an anonymous visitor still gets the landing page with a 200. — verify: `E2E_ENABLED=true pnpm test:e2e -g "home redirects"`
- [ ] AC-31: [backend] When an anonymous visitor requests `/dashboard`, the response redirects to `/login`; an unauthenticated `/budget` or `/leisure` returns the 404 page. — verify: `E2E_ENABLED=true pnpm test:e2e -g "guards and legacy routes"`
- [ ] AC-32: [backend] When the tree is searched (excluding the regenerated Prisma client), no source, test or e2e file references `/budget`, `/leisure`, `FreeTimeBudget`, `HomeworkPlanEntry`, `getDayBudget`, `setFreeTimeBudget`, `planHomeworkTime` or `deleteHomeworkPlan`. — verify: `! grep -rn --exclude-dir=generated --exclude-dir=migrations "/budget\|/leisure\|FreeTimeBudget\|HomeworkPlanEntry\|getDayBudget\|setFreeTimeBudget\|planHomeworkTime\|deleteHomeworkPlan" src test tests`
- [~] AC-33: [backend] When every button and form control on `/dashboard` is activated in e2e — including the study-block ⏱️ «شروع» control, whose activation must open the focus panel, and the panel's «پایان و ثبت» action — each one either causes a persisted change or (for ⏱️) opens the focus panel whose completion persists; no control is inert and none is merely disabled. — verify: `E2E_ENABLED=true pnpm test:e2e -g "dashboard controls"` — reason: the ⏱️ control is gone; the surviving-controls check is AC-45 plus the e2e suite; deferred at plan round 3 (2026-11-24)
- [ ] AC-34: [backend] When the full gate runs, `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0 and the architecture test passes with the updated page counts. — verify: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
- [ ] AC-35: [backend] When the e2e suite runs against live services, `advising-dashboard`, `advising-auth`, `advising-planning` and `advising-nutrition-leisure` all pass with no `test.skip` other than the `E2E_ENABLED` gate. — verify: `E2E_ENABLED=true pnpm test:e2e`
- [ ] AC-36: [backend] When `README.md` is read, it documents `/dashboard`, does not list `/budget`, `/leisure` or `/study` as a page, and its access-control table includes `/dashboard`. — verify: `! grep -n "/budget\|/leisure\|/study" README.md`
- [ ] AC-37: [backend] When `docs/behaviors/lite-edition.md` is opened, it starts with `last_verified:` and `source_files:` and lists every file this feature touched. — verify: manual: `head -3 docs/behaviors/lite-edition.md` shows both fields and `grep -c "lite" docs/behaviors/lite-edition.md` is > 0
- [ ] AC-38: [backend] When `src/app/page.tsx` is inspected, it contains no `use client` and no `useEffect`, and its authenticated branch calls `redirect("/dashboard")`, so the redirect is issued by the server response and never by browser JavaScript. — verify: `! rg -n "useEffect|use client" src/app/page.tsx && grep -q 'redirect("/dashboard")' src/app/page.tsx`
- [ ] AC-39: [backend] When `wakingMinutes` receives sleep 02:00 / wake 10:00 it returns 960, sleep 23:00 / wake 06:30 returns 990, equal sleep and wake returns 1440, and a `00:00`/`00:00` pair returns 1440 (a computed `0` is read as a full day). — verify: `pnpm test --run src/modules/advising/domain/free-time.test.ts`
- [ ] AC-40: [backend] When sleep and wake are submitted equal at a boundary value (both `00:00` or both `23:59`), the profile schema rejects the pair with `fieldErrors.sleepTime` and persists nothing, while any stored equal pair still yields a 1440-minute domain window instead of a zero day. — verify: `pnpm test --run src/modules/advising/domain/free-time.test.ts src/modules/advising/presentation/schemas.test.ts`
- [ ] AC-41: [backend] When `PrismaWeeklyGoalRepository.incrementTestsDone` is called twice on the same `(studentId, weekKey)` with `+10` then `+5`, the stored `testsDone` is exactly 15 — one atomic `increment` write, no lost update. — verify: `docker compose up -d postgres && pnpm vitest run test/advising/weekly-goal-integration.test.ts -t "tests done increments atomically"`
- [~] AC-42: [backend] When the student presses «پایان و ثبت» in the real focus panel, the block becomes ticked, the panel closes, and card 3's study hours rise by that block's minutes. — verify: `E2E_ENABLED=true pnpm test:e2e -g "focus mode completes block"` — reason: the focus panel does not exist (Decision 4 REMOVED); deferred at plan round 3 (2026-11-24)
- [ ] AC-43: [backend] When B2 starts, a fresh `pg_dump` exists at `.opencode/backups/<timestamp>-pre-lite-edition.sql`, is larger than 1 KB, and is newer than the stage-0 migration directory; an empty or stale dump fails the stage before migration B runs. — verify: `find .opencode/backups -name '*-pre-lite-edition.sql' -size +1k -newer prisma/migrations/20261123155516_lite_dashboard_settings -print -quit | grep -q .`
- [ ] AC-44: [backend] When the sidebar renders for a **student** after B2, every deep page is reachable from it, `nav-dashboard` exists, and no `nav-budget`/`nav-leisure` element exists in the DOM; a counselor's sidebar is checked by advisor-program AC-35/AC-49. — verify: `E2E_ENABLED=true pnpm test:e2e -g "sidebar"`
- [ ] AC-45: [ui] When `/dashboard?demo=success` renders, every plan row shows its subject label next to the time range and duration, and the page contains no `[data-testid*=focus]` element and no «⏱» text. — verify: `! grep -rn "BLOCK_FOCUS_OPEN\|study-block-focus\|⏱" "src/app/(advising)/dashboard" src/constants/test-ids.ts`
- [ ] AC-46: [ui] When the mock homework tick is pressed with an empty minutes field it is inert, and with ۴۵ it moves the row to done showing ۴۵, with no server-action POST in the Network tab. — verify: manual: `/dashboard?demo=success`, press «انجام شد» empty then with ۴۵; Network tab shows no POST
- [ ] AC-47: [ui] When `/dashboard?demo=success` renders, card 3 shows the two bars filled from the fixture's plan-derived targets plus the need label, and contains zero editable target inputs. — verify: manual: open `/dashboard?demo=success`; count `[data-testid=dashboard-goal-study-input]` and `[data-testid=dashboard-goal-tests-input]` = 0
- [ ] AC-48: [ui] When `/dashboard?demo=empty` has no plan, card 3 shows «برنامهٔ مشاور ثبت نشده است» with both bars at 0 and no `NaN`; when `?demo=success` the free-time card shows the three-subtrahend breakdown «بیداری … − مدرسه … − اشغال … − تکلیف …», with the school term marked as derived. — verify: manual: open `/dashboard?demo=empty` and `?demo=success`
- [ ] AC-49: [backend] When the student ticks a homework with ۴۵ minutes on the real dashboard, `Homework.spentMinutes` is 45 and `completedAt` is set, and the same tick with an empty field is rejected; no code path writes a goal target. — verify: `pnpm test -t "homework spent minutes"` then `! grep -rn "setWeeklyGoalAction\|upsertTargets" src`
- [ ] AC-50: [backend] When B2 completes, the manual budget helpers are gone and the advisor-program columns survive. — verify: `! grep -rn "suggestFreeMinutes\|dayCapacity\|fitsCapacity\|durationMessage\|WEEKLY_FREE_BASE_MINUTES" src test && grep -q "spentMinutes" prisma/schema.prisma && grep -q "occupiedMinutes" prisma/schema.prisma`
- [ ] AC-51: [ui] When any advising page renders in the UI stage, the greeting line contains no garbled Latin word (`Reihe` no longer present). — verify: `! grep -rn "Reihe" "src/app/(advising)"`

---

## Documentation impact

**UI stage: no README, behavior or changelog change.** Nothing is user-visible in production yet;
the fixture and mock flows are gate scaffolding, deleted in B1. Write the docs in B3, when behaviour
is real. (The orchestrator must not treat the missing README in the UI stage as a gap.)

**`README.md`** (B3; all mandatory):

1. `## صفحات` — add `/dashboard` (integrated cards), remove `/budget`, `/leisure`, `/study`; relabel
   `/homework` as «همهٔ تکالیف (تنظیمات)» and `/nutrition` as the physical-profile settings page.
2. New section `## داشبورد یکپارچه و تنظیمات` right after `## ساختار کد` — cards 1/2/3, the sidebar
   (a **role matrix**: student = داشبورد/برنامه هفتگی/تغذیه/همهٔ تکالیف/پروفایل; counselor =
   دانش‌آموزان من/پروفایل only; advisor-program Decision 9 owns the matrix), the free-time formula `wakingMinutes − Σ school − otherOccupiedMinutes[day] −
   homeworkAverageMinutes` (school hours derived from the school program, non-school occupied hours
   typed once) with the 23:00/06:30 default and a pointer to `## مشخصات تحصیلی و برنامهٔ مشاور`
   (advisor-program) for where the school program, the non-school occupied hours and the homework
   average are entered, the calorie widget, that the
   weekly goal is **derived** (study minutes = Σ counselor plan minutes, tests target = plan header,
   never student-editable), that study progress comes from ticking 50/10 blocks, that each plan row
   shows its subject, that sleep/wake use native time inputs (`HH:mm`), and that **there is no
   timer/countdown anywhere**.
3. `## برنامه هفتگی، تکالیف و تایمر مطالعه` — delete the two `/study` paragraphs and the stale
   «تایمر مطالعه» wording; state that blocks are a read-only derivation of a schedule row, that
   completion is what counts as study time, and that ticking a homework records the minutes it took
   (the number feeds the free-time subtraction, not study progress).
4. `## تغذیه و اوقات فراغت` — `/leisure` route paragraph becomes "book suggestion is a line on the
   dashboard"; keep the energy/meal-split/multiplier paragraphs unchanged; add the meal-tick rule.
5. `## دسترسی و نقشها` table — replace `/schedule, /homework, /study` and `/nutrition, /leisure`
   rows with `/dashboard, /schedule, /homework` and `/nutrition, /profile`; keep `/` as 200 for
   anonymous, add "logged-in `/` → `/dashboard`" and "a counselor requesting `/dashboard` is
   redirected server-side to `/counselor/students`". The counselor's new study-plan write path is
   documented by advisor-program's README change, not repeated here.
6. `## محدودیتها` — add: no streak/gamification; study time only via block ticks (no timer); meals
   only for today; the weekly goal only for the current week; **free time does not model class
   intervals outside the waking window, and school hours come only from the school program
   (`SchoolProgramEntry`) while the typed occupied hours exclude school**; **homework minutes are
   self-reported**.
7. `## وضعیت` — add a `فاز ۵.۳.۲ (lite dashboard v2)` line linking this plan; fix the `/study`
   mentions in the status and limitation lists.

**Config / env:** **none.** No new `src/shared/env.ts` key, no `.env.example` change, no dependency
(no `dayjs`), no Docker/port change. The needs/exams catalogs are seeded rows from the
already-documented `pnpm tsx scripts/seed-advising.ts` command (advisor-program Decision 5) — no new
command and no new config key. State this explicitly in the README section added above.

**Behavior doc:** `docs/behaviors/lite-edition.md` is **required** (B3). Front matter
`last_verified: 2026-11-24` and `source_files:` must list at least:
`prisma/schema.prisma`, the `lite_dashboard_settings` and `drop_manual_free_time` migration dirs,
`src/modules/advising/domain/{free-time,study-blocks,weekly-goal,day-key,models,ports,capabilities}.ts`,
`src/modules/advising/application/{dashboard,weekly-goal,profile,nutrition,leisure}.ts`,
`src/modules/advising/infrastructure/prisma-weekly-goal-repository.ts`,
`src/modules/advising/presentation/{schemas,messages}.ts`, `src/server/container.ts`,
`src/constants/test-ids.ts`, `src/app/(advising)/layout.tsx`, `src/app/(advising)/dashboard/**`
(including `_components/{homework-today,study-plan,weekly-goal,free-time-card}.view.tsx`),
`src/app/(advising)/profile/profile-form.*`, `src/app/(advising)/schedule/schedule-week.*`,
`src/app/(auth)/auth.actions.ts`, `src/app/page.tsx`, `test/architecture.test.ts`,
`tests/e2e/advising-dashboard.spec.ts`. Cross-link `docs/behaviors/advisor-program.md` for the
free-time inputs, the derived goal and the homework-minutes column; do not duplicate them.
Also refresh `docs/behaviors/access-control-baseline.md` (`/` now redirects when authenticated;
`/budget` and `/leisure` gone).

**Contract doc:** `docs/contracts/lite-edition.md` (same content as the Contract section; created in
B1, updated in B2).

**Changelog draft (do not write now):**
`## 2026-11-24 — lite-edition` — «`/dashboard` replaces five tabs; اوقات فراغت از پنجرهٔ بیداری منهای
ساعت مدرسه (از برنامهٔ ثابت مدرسه)، ساعت‌های اشغال غیرمدرسه و میانگین تکلیف محاسبه می‌شود؛ هدف هفته از برنامهٔ مشاور می‌آید و قابل ویرایش نیست؛
هر تکلیف هنگام تیک، دقیقه‌های انجامش ثبت می‌شود؛ تایمر مطالعه حذف شد؛ `/budget` و `/leisure` حذف
شدند.»

**`docs/plan/phases.md`:** add §۵.۳.۲ with this plan link and the stage gate
(`pnpm typecheck && pnpm lint && pnpm test && pnpm build`, e2e green).

---

## Resolved decisions (human-confirmed 2026-11-23)

OQ-1..OQ-5 were confirmed at the plan gate alongside `review_level: full`. Each is closed; the
Implementer does not re-ask.

1. **OQ-1 — the unapproved 5.3.1 migrations.** `20261123142653_phase_5_3_1_free_time_budget` is
   applied in some dev databases; B2 drops both tables and their rows.
   **Answer:** proceed — drop `FreeTimeBudget` and `HomeworkPlanEntry` with no backfill and no data
   migration. B2 is still gated by the mandatory dev-DB dump (B2 step 0, AC-43): the dump is the
   escape hatch if a real dataset turns up.
2. **OQ-2 — keep `/homework`?** The spec says the homework tab is removed; the dashboard covers the
   daily view, but creating homework needs a form.
   **Answer:** keep `/homework` as a settings page («همهٔ تکالیف»); dashboard card 1 stays read+tick
   only. Deleting it would move 4 form files for no product gain.
3. **OQ-3 — study progress source.** No timer exists (`/study` never existed).
   **Answer:** progress = minutes of ticked 50/10 blocks derived from the weekly schedule; no timer,
   no duration entry. **Round 3:** the ⏱️ focus panel is also removed (Decision 4), so the answer is
   now literally true — no presentation-only timer survives either.
4. **OQ-4 — mobile sidebar.**
   **Answer:** horizontal scroll strip under `md`; no drawer, no JS. A drawer becomes its own feature
   if the human wants one.
5. **OQ-5 — weekly goal scope.**
   **Answer:** one row per `(studentId, weekKey)` that resets naturally each Saturday; no history
   page. `testsDone` moves only by atomic `increment` (Invariant 7).
   **Round 3 amendment:** the two target columns and the defaults (25h / 300 tests) are removed —
   targets are derived from the counselor's `StudyPlan` (advisor-program Decision 3), and the student
   never writes them. The row now stores progress only.

## Deferred / out of scope

- Streak / 🔥 gamification and weekly rewards (spec §۳.۴).
- Macro/micro nutrient analysis, meal history, per-day meal pages.
- Counselor-facing daily overview (spec §۵.۴) and any admin surface for goals.
- **A timer, pomodoro or countdown of any kind** (human decision 2026-11-24).
- **Student-editable weekly targets** (replaced by the derived goal).
- The school program, study profile, counselor program and their catalogs — those are
  `advisor-program`'s scope, not this plan's.
- Notifications/reminders/scheduler; Jalali calendar rendering.
- Deleting `/homework` or `/nutrition` as routes.
- Any change to `src/modules/rag/**`, `src/app/api/**`, conversation storage, ingestion.
- Reusing `dayCapacity`/`fitsCapacity`: they die with the manual budget.
