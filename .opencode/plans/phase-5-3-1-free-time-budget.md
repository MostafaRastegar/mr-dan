# Plan — phase 5.3.1: free-time budget, homework planning cap, timer removal

Status: **proposed** (not approved). Human decides `review_level` at the plan gate.
Target: `.opencode/plans/phase-5-3-1-free-time-budget.md`
Date: 2026-11-23

---

## Derived stack

`mro-project-stack` and `mro-data-model` are **unfilled placeholders** (`unknown`, `<SCHEMA_PATH>`).
Facts below are derived from the working tree, not from those skills; the plan states each
derivation so a reviewer can re-run it.

| Fact | Derived from |
|---|---|
| Next 16.4.6, React 19.3.1, TS 7.0.2 (native `tsc --noEmit`), Tailwind 4.3.5, antd 6.7.1, Prisma 7.10.1, zod 4, vitest, Playwright, pnpm | `package.json`, `AGENTS.md` |
| antd 6.7.1 ships `DatePicker`/`TimePicker` backed by **its own** `dayjs@^1.11.11` | `node_modules/antd/package.json#dependencies.dayjs`; `antd/es/date-picker/index.d.ts` imports `type { Dayjs } from 'dayjs'` |
| `dayjs` does **not** resolve from app code: no root `node_modules/dayjs`, no `.npmrc` hoisting, not a declared dependency, and `package.json` must not change (B-8) | `node -e "require.resolve('dayjs')"` → `MODULE_NOT_FOUND`; `ls node_modules/dayjs` → absent; `.npmrc` absent |
| Consequence: app code can **receive** a picker value and call `.format(...)` on it (duck-typed), but can never **construct** one | derived from the two rows above; see D-2 |
| `toFormData` stringifies every non-`Date` value (`String(value)`) | `src/utils/use-form-action.ts:27-38` — a Dayjs object would become `"Mon Nov 23 2026 …"`, so conversion must happen in the vm before `submit` |
| Prisma uses a driver adapter (`PrismaPg`), `prisma.$transaction` with `isolationLevel` is available | `src/shared/prisma.ts`, `prisma/schema.prisma` |
| Migrations are hand-inspectable SQL; latest is `20261123123032_add_advising_nutrition_leisure` | `prisma/migrations/` |
| Architecture test pins `withLocalUi` at exactly **11** and `pages.length >= 13`; today the tree has **13** pages, **11** with a relative import | `test/architecture.test.ts:214,240`; `find src/app -name page.tsx`; `grep -ln 'from "\./' …/page.tsx` |
| Skill placeholders are a known repo condition (5.1/5.2/5.3 precedent) | `.opencode/AGENTS.md` Project Profile still holds `<...>`; per-area schema modules instead of one `schemas.ts` |

**Skills loaded for this plan:** `mro-project-stack`, `mro-data-model`, `mr-dan-feature-workflow`,
`mr-dan-architecture`, `mr-dan-persistence`, `mr-dan-api`, `mr-dan-frontend`,
`mr-dan-frontend-debugging`, `mr-dan-testing-parity`.
No `mro-*` skill conflicts with `AGENTS.md`; the only conflict is the placeholder content noted above.

---

## Scope

**In**
1. Per-date free time (`hh:mm`) with a per-weekday suggestion of `14h − that weekday's class minutes`.
2. Per-task, per-date planned time (`hh:mm`), hard-capped by the date's free time.
3. Leisure suggestion re-derived from budget data (no study minutes).
4. Complete removal of the study timer: route, nav, UI, domain/application/ports/repository,
   tests, docs, and the `StudySession` table (destructive migration, human-confirmed B-7).

**Out**
- Any change to `package.json` / `pnpm-lock.yaml` (B-8).
- Deleting a free-time row (see D-5 — an edit to `00:00` covers it).
- Recurring free-time templates, drag-and-drop planning, reminders/scheduler.
- Counselor UI for a student's budget (read-only counselor access stays in the use-case layer, phase 5.4 precedent).
- Changing `deadline` semantics on `/homework`.

---

## Binding decisions (human, do not revisit)

| # | Decision |
|---|---|
| B-1 | Day key is a real calendar date chosen with antd `DatePicker`, never a weekday name. |
| B-2 | Duration unit is `hh:mm` via antd `TimePicker`, for both daily free time and per-task planned time. |
| B-3 | Free time is entered manually per date; the suggested value is `14h − sum of that weekday's class durations`; the student may override. |
| B-4 | Per-task hours mean "planned hours for that task on that date"; one task may span several dates. |
| B-5 | Over-budget is a hard reject with a Persian field error showing used-of-capacity (e.g. «۳ ساعت از ۵ ساعت»); nothing is written. |
| B-6 | Lowering free time below already-planned time is rejected; free time is never negative. |
| B-7 | The study timer is removed completely, including its data: `/study`, nav link, timer component, study domain/application/ports/repository, and the tables/columns are DROPPED. |
| B-8 | `package.json` and `pnpm-lock.yaml` must not change. |

## Decisions (proposed, override at the gate)

| # | Decision | Trade-off |
|---|---|---|
| D-1 | **One new route `/budget`**, and `/study` is deleted → page count stays 13, `withLocalUi` stays 11, `test/architecture.test.ts` needs **no edit**. | Merging into `/homework` would drop counts to 12/10 and force weakening the architecture test. |
| D-2 | Pickers are **uncontrolled** inside `Form.Item`; the vm converts a received picker value with a duck-typed `format("HH:mm")` in `onFinish` before `submit`; an empty picker means "use the suggestion" (create) or "keep current" (edit); the date comes from `?date=` and the `DatePicker` `onChange` pushes the new `?date=`. | No `dayjs` import is possible (stack table), so a picker cannot be *seeded* with a stored `hh:mm`. Honest empty-means-default beats a hidden dependency. |
| D-3 | Planned/free minutes are **integers, never rounded**; `hh:mm` parses to whole minutes at the zod boundary; `00:00` planned is rejected. | TimePicker caps a single value at `23:59` (1439) — sufficient, a day has 1440 minutes. |
| D-4 | Capacity is enforced **inside a `Serializable` `prisma.$transaction`** whose decision is a pure callback the adapter receives from the use case; a serialization failure maps to `plan_concurrent_write`. | One transaction option + one error code, but the invariant survives concurrent writes; Prisma's typed API only, no raw SQL. |
| D-5 | No "delete free-time row" action: editing to `00:00` is the removal path. | Avoids a check-then-delete race and an extra action; a used day cannot be zeroed until its plans are deleted anyway. |
| D-6 | New capability pair `budget:read` / `budget:write` (student, counselor, admin), replacing `study:read`/`study:write`. `/budget` is gated by `budget:read`; writes by `budget:write` + row ownership. | One pair per route area is the existing convention; net capability count is unchanged. |
| D-7 | `HomeworkPlanEntry` holds `(studentId, dayKey)` and FK-references `FreeTimeBudget(studentId, dayKey)` with `onDelete: Cascade`. | The DB itself forbids a plan on a day without a budget row; user-delete still cascades cleanly. |
| D-8 | Day arithmetic moves from `application/study-metrics.ts` into a new dependency-free `domain/day-key.ts`; `study-metrics.ts` is deleted with its type (`StudySessionRecord`). | `studyDayKey` is used by `/homework`, `/leisure`, `/nutrition` — the helper must move, not die. |
| D-9 | Leisure thresholds become **utilization bands** over budget data (see Domain rules); the 5 codes, titles and book pick are unchanged. | Same UX surface, different trigger numbers; README + behavior doc must be rewritten. |
| D-10 | The `14h` base, the `0.9/0.75/0.4` bands and the `600/300` minute floors are **domain constants**, not env vars. | The `src/shared/env.ts` single-source-of-truth rule is RAG-specific; planning thresholds already live in `domain/leisure.ts` today. |

---

## Open questions

1. **Picker seeding vs. no dependency.** Prefilled pickers need `dayjs`, which B-8 forbids.
   Recommended default: D-2 (empty means suggestion/keep; the current value is rendered as text).
2. **Route name.** `/budget` with nav label «وقت آزاد».
   Recommended default: D-1.
3. **Removing a free-time row.** Recommended default: D-5 (edit to `00:00`, no delete action).
4. **Capability naming.** `budget:*` vs. reusing `homework:*`.
   Recommended default: `budget:*` (D-6).
5. **Leisure thresholds.** Utilization bands (D-9) vs. keeping the old minute thresholds fed by planned minutes.
   Recommended default: utilization bands — the old numbers were calibrated on *study* minutes and cannot be carried over honestly.

---

## Data model

### Prisma diff (`prisma/schema.prisma`)

`User`: delete `studySessions  StudySession[]   @relation("StudentStudySessions")`, add
`freeTimeBudgets FreeTimeBudget[] @relation("StudentFreeTimeBudgets")`.
`Homework`: add `planEntries HomeworkPlanEntry[]`.
Delete `model StudySession { … }` (current lines 139–151).
Add:

```prisma
model FreeTimeBudget {
  id          String   @id @default(uuid())
  studentId   String
  student     User     @relation("StudentFreeTimeBudgets", fields: [studentId], references: [id], onDelete: Cascade)
  dayKey      String   // "YYYY-MM-DD" Iran day (UTC+03:30)
  freeMinutes Int      // 0..1439, validated at the boundary; never negative
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  planEntries HomeworkPlanEntry[]

  @@unique([studentId, dayKey])
}

model HomeworkPlanEntry {
  id             String         @id @default(uuid())
  studentId      String         // part of the composite FK to FreeTimeBudget
  dayKey         String
  budget         FreeTimeBudget @relation(fields: [studentId, dayKey], references: [studentId, dayKey], onDelete: Cascade, onUpdate: Cascade)
  homeworkId     String
  homework       Homework       @relation(fields: [homeworkId], references: [id], onDelete: Cascade)
  plannedMinutes Int            // 1..1439
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  @@unique([homeworkId, dayKey])
  @@index([studentId, dayKey])
}
```

No `HomeWork.status` change, no `StudySession` replacement: study data is deleted, not migrated.

### Exact destructive SQL (what the migration must contain)

`pnpm prisma migrate dev --name phase_5_3_1_free_time_budget` generates additive DDL first and one
drop; the committed file must match this shape (order may vary, the drop is child-side and safe anywhere):

```sql
-- CreateTable
CREATE TABLE "FreeTimeBudget" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "freeMinutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FreeTimeBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeworkPlanEntry" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "homeworkId" TEXT NOT NULL,
    "plannedMinutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HomeworkPlanEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FreeTimeBudget_studentId_dayKey_key" ON "FreeTimeBudget"("studentId", "dayKey");
CREATE UNIQUE INDEX "HomeworkPlanEntry_homeworkId_dayKey_key" ON "HomeworkPlanEntry"("homeworkId", "dayKey");
CREATE INDEX "HomeworkPlanEntry_studentId_dayKey_idx" ON "HomeworkPlanEntry"("studentId", "dayKey");

-- AddForeignKey
ALTER TABLE "FreeTimeBudget" ADD CONSTRAINT "FreeTimeBudget_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HomeworkPlanEntry" ADD CONSTRAINT "HomeworkPlanEntry_studentId_dayKey_fkey"
  FOREIGN KEY ("studentId", "dayKey") REFERENCES "FreeTimeBudget"("studentId", "dayKey")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HomeworkPlanEntry" ADD CONSTRAINT "HomeworkPlanEntry_homeworkId_fkey"
  FOREIGN KEY ("homeworkId") REFERENCES "Homework"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropTable
DROP TABLE "StudySession";
```

### Destructive-migration procedure (mandatory, in this order)

1. `docker compose up -d postgres`
2. **Dump first** (the project's first destructive migration):
   `mkdir -p .opencode/backups && docker compose exec -T postgres pg_dump -U mr_dan -d mr_dan -t '"StudySession"' > .opencode/backups/2026-11-23-studysession.sql`
   and record the pre-drop row count:
   `docker compose exec -T postgres psql -U mr_dan -d mr_dan -tAc 'SELECT count(*) FROM "StudySession"'`.
3. `pnpm prisma migrate dev --name phase_5_3_1_free_time_budget`
4. **Prove the drop:**
   - `pnpm exec prisma migrate status` → exit 0, no pending migrations.
   - `docker compose exec -T postgres psql -U mr_dan -d mr_dan -tAc 'SELECT to_regclass($$public."StudySession"$$)'` → empty line.
   - `grep -c StudySession prisma/schema.prisma` → 0.
   - `pnpm exec prisma validate` → exit 0.
5. Rollback story (documented in the contract, not executed): restore the dump, then
   `pnpm prisma migrate resolve --rolled-back phase_5_3_1_free_time_budget`.

---

## Domain rules

### `src/modules/advising/domain/day-key.ts` (new, no imports)

```ts
export const IRAN_UTC_OFFSET_MINUTES = 210;           // UTC+03:30, no DST since 2022
export function iranDayKey(instant: Date): string;     // "YYYY-MM-DD"
export function startOfIranDay(instant: Date): Date;   // Iran midnight of that day
export function shiftDayKey(dayKey: string, days: number): string;
export function isDayKey(value: string): boolean;      // shape + real calendar date
```

Arithmetic: `shifted = t + 210*60_000`; key = `new Date(shifted).toISOString().slice(0,10)`;
`startOfIranDay(t) = floor(shifted / 86_400_000) * 86_400_000 − 210*60_000`.
`shiftDayKey` converts `YYYY-MM-DD` through `Date.UTC(y, m-1, d) + days*86_400_000` — no local timezone,
no `Date` mutation. Names are re-homed from `studyDayKey`/`startOfStudyDay` (D-8).

### `src/modules/advising/domain/free-time.ts` (new, pure)

```ts
export const WEEKLY_FREE_BASE_MINUTES = 840; // 14h

export interface ClassInterval { dayOfWeek: number; startMinute: number; endMinute: number }
export interface DayCapacity { freeMinutes: number; usedMinutes: number; remainingMinutes: number }

export function classMinutesForDay(entries: readonly ClassInterval[], dayOfWeek: number): number;
export function suggestFreeMinutes(entries: readonly ClassInterval[], dayOfWeek: number): number;
export function dayCapacity(freeMinutes: number | null, usedMinutes: number): DayCapacity;
export function fitsCapacity(capacity: DayCapacity, additionalMinutes: number): boolean;
export function durationMessage(usedMinutes: number, freeMinutes: number): string; // «۳ ساعت از ۵ ساعت»
```

- `classMinutesForDay`: filter by `dayOfWeek`, sort by `startMinute`, **merge overlapping/touching-inclusive
  intervals** defensively, sum `end − start`. The write path already forbids overlaps
  (`application/schedule.ts` → `overlaps()`), so merging normally changes nothing; it exists so the
  suggestion cannot double-subtract a malformed row.
- `suggestFreeMinutes = Math.max(0, 840 − classMinutesForDay(...))`. `14h` is the stated waking-day
  planning base, so a class day suggests less and a free day suggests 14h; a day with more than 14h of
  classes suggests `0` (the student may still type any value).
- `dayCapacity(null, used)` → `{ freeMinutes: 0, usedMinutes: used, remainingMinutes: 0 }`: a missing row
  is **zero capacity**, never infinite, never negative.
- `remainingMinutes = Math.max(0, freeMinutes − usedMinutes)` (defensive clamp; the invariant makes it positive).
- `fitsCapacity(c, add)` → `add > 0 && c.usedMinutes + add <= c.freeMinutes`. Exact fit is allowed.
- `durationMessage`: whole hours → «۳ ساعت», otherwise «۲ ساعت و ۳۰ دقیقه», zero → «۰ دقیقه»;
  digits via `new Intl.NumberFormat("fa-IR")`. Persian prose in a pure domain module matches
  `domain/leisure.ts` precedent.

Rounding: **none**. Minutes are integers end to end; the only conversion is `hh:mm → h*60+m` at the zod boundary.

### `src/modules/advising/domain/leisure.ts` (rewrite inputs + thresholds, keep codes/titles)

```ts
export interface LeisureInputs {
  plannedMinutes7d: number;  // Σ plan rows with dayKey in [today-6, today]
  freeMinutes7d: number;     // Σ freeMinutes of budget rows in the same window
  pendingHomework: number;
  overdueHomework: number;
}
```

`util7 = freeMinutes7d > 0 ? plannedMinutes7d / freeMinutes7d : 0` (division by zero → 0).
First match wins, in this order:

| # | Code | Condition | Worked example → result |
|---|---|---|---|
| 1 | `critical_fatigue` | `util7 >= 0.9 && plannedMinutes7d >= 600` | planned 1080, free 1200 → util 0.9, 1080 ≥ 600 → **critical** |
| 2 | `heavy_workload` | `overdueHomework >= 3 \|\| pendingHomework >= 8` | planned 1080, free 1200, overdue 3 → **heavy** (fires *before* branch 1 only if #1 is false; with both true, #1 wins and that ordering is tested) |
| 3 | `overloaded_week` | `util7 >= 0.75 && plannedMinutes7d >= 600` | planned 900, free 1100 → util 0.818 → **overloaded** |
| 4 | `balanced` | `overdueHomework === 0 && util7 >= 0.4 && plannedMinutes7d >= 300` | planned 300, free 600 → util 0.5 → **balanced** |
| 5 | `low_activity` | otherwise | planned 120, free 840 → util 0.143 → **low**; planned 0, free 0 → util 0 → **low** |

`reason` strings name the numbers that fired (percent + minutes) and stay Persian; `actions` stay 2–4 items;
`pickBook({ field, code })` is unchanged.

### Free-time application rules (`application/free-time.ts`, `application/homework-plan.ts`)

- `SetFreeTimeBudgetUseCase`: `freeMinutes` comes from `hh:mm` (or the suggestion when empty);
  write via `budget.upsertWithinUsed({ studentId, dayKey, freeMinutes, allows: used => used <= freeMinutes })`.
  `allows === false` → `FreeTimeBelowPlannedError` carrying `{ usedMinutes, freeMinutes }`
  (message `durationMessage(usedMinutes, freeMinutes)`), nothing written.
- `PlanHomeworkTimeUseCase`: read the homework (404), ownership (403), reject a completed homework
  (`homework_completed`), reject `dayKey > iranDayKey(homework.deadline)` (`plan_after_deadline`), then
  `plans.upsertWithinCapacity({ …, allows: ({ freeMinutes, usedMinutes }) => fitsCapacity(dayCapacity(freeMinutes, usedMinutes), plannedMinutes) })`.
  `ok: false` → `PlanOverCapacityError(durationMessage(usedMinutes + plannedMinutes, freeMinutes))`.
- `GetDayBudgetUseCase` returns the page aggregate (see API contracts); it never writes.
- `DeleteHomeworkPlanUseCase`: find row → ownership → delete.
- Ownership: `assertPlanWrite(actor, "budget:write", actor.id)` for every write (`ScheduleEntry*` precedent:
  a counselor plans only for themselves); reads use `actor.id` with no `UserRepositoryPort` dependency.

### Weekly-schedule suggestion math (feeds `suggestFreeMinutes`)

`Date` → Persian weekday: `persianDay = (jsDay + 1) % 7` (`jsDay` 6 = Saturday = `0` = شنبه).
Class minutes per day are summed from `WeeklySchedule` rows of that `dayOfWeek` only; overlapping rows are
merged (see above); the base is `840`; the result is clamped at `0`; a day with `> 14h` of classes suggests `0`.

### Homework `deadline` vs. per-date plan ("overdue" driver)

`deadline` stays the single due date (`Iran midnight`, unchanged). A plan row's `dayKey` must be
`<= iranDayKey(deadline)`; planning *after* the deadline is rejected with a Persian field error on `date`.
`overdue` keeps its current meaning (`pending && iranDayKey(deadline) < todayKey`) and is the only driver of
leisure branch 2. There is no plan-after-completion state: a completed homework accepts no new plan row, and
existing rows stay readable until the homework or the day's budget is removed.

---

## Capability and access matrix

| Surface | anon | student | counselor | admin | Gate |
|---|---|---|---|---|---|
| `/budget` (page) | → `/login` | 200 | 200 | 200 | `budget:read` |
| `/budget` actions | `redirect("/login")` | ok (own rows) | ok (own rows) | ok (own rows) | session + `budget:write` + `ownerId === actor.id` |
| `/study` | — | — | — | — | **route does not exist** |
| `/homework` | → `/login` | 200 | 200 | 200 | `homework:read` (unchanged) |

Capability table after this phase (12 capabilities; `study:*` gone, `budget:*` added):
`profile|group|student|schedule|homework|budget|nutrition` × `read|write` as today, plus `leisure:read`,
`rag:manage`, `user:manage`. `application/planning-access.ts` `PlanCapability` becomes
`"schedule:write" | "homework:write" | "budget:write" | "nutrition:write"`.

---

## Contract

File: `docs/contracts/phase-5-3-1-free-time-budget.md`. `review_level: full`
(destructive migration, capability change, new business rule, new route).

### Interface signatures

```ts
// domain (pure)
suggestFreeMinutes(entries: readonly ClassInterval[], dayOfWeek: number): number
classMinutesForDay(entries: readonly ClassInterval[], dayOfWeek: number): number
dayCapacity(freeMinutes: number | null, usedMinutes: number): DayCapacity
fitsCapacity(capacity: DayCapacity, additionalMinutes: number): boolean
durationMessage(usedMinutes: number, freeMinutes: number): string
iranDayKey(instant: Date): string
startOfIranDay(instant: Date): Date
shiftDayKey(dayKey: string, days: number): string
isDayKey(value: string): boolean

// ports
FreeTimeBudgetRepositoryPort.findByDay(studentId, dayKey): Promise<FreeTimeBudget | null>
FreeTimeBudgetRepositoryPort.listInRange(studentId, fromKey, toKey): Promise<FreeTimeBudget[]>
FreeTimeBudgetRepositoryPort.upsertWithinUsed({ studentId, dayKey, freeMinutes, allows })
  : Promise<{ ok: true; budget: FreeTimeBudget } | { ok: false; usedMinutes: number }>
HomeworkPlanRepositoryPort.listByDay(studentId, dayKey): Promise<HomeworkPlanEntry[]>
HomeworkPlanRepositoryPort.listByStudentInRange(studentId, fromKey, toKey): Promise<HomeworkPlanEntry[]>
HomeworkPlanRepositoryPort.findByHomeworkAndDay(homeworkId, dayKey): Promise<HomeworkPlanEntry | null>
HomeworkPlanRepositoryPort.upsertWithinCapacity({ studentId, homeworkId, dayKey, plannedMinutes, allows })
  : Promise<{ ok: true; entry: HomeworkPlanEntry } | { ok: false; freeMinutes: number | null; usedMinutes: number }>
HomeworkPlanRepositoryPort.delete(id): Promise<void>

// server actions (all in src/app/(advising)/budget/budget.actions.ts)
setFreeTimeAction(prev: ActionState<{ dayKey: string; freeMinutes: number }> | null, formData: FormData)
  : Promise<ActionState<{ dayKey: string; freeMinutes: number }>>
planHomeworkAction(prev: ActionState<{ homeworkId: string; dayKey: string; plannedMinutes: number }> | null, formData: FormData)
  : Promise<ActionState<{ homeworkId: string; dayKey: string; plannedMinutes: number }>>
deletePlanAction(id: string): Promise<ActionState<{ id: string }>>
```

### Invariants (each a single enforceable sentence)

- **I-1** For every `FreeTimeBudget(student, day)` row, the sum of `HomeworkPlanEntry.plannedMinutes` for
  that `(student, day)` is less than or equal to `freeMinutes`, and no plan row exists without its budget row.
- **I-2** `FreeTimeBudget.freeMinutes` and `HomeworkPlanEntry.plannedMinutes` are integers in `0..1439` and
  `1..1439`; neither is ever negative or fractional.
- **I-3** `(studentId, dayKey)` is unique on the budget; `(homeworkId, dayKey)` is unique on the plan
  (a re-plan of the same task on the same date replaces, never duplicates).
- **I-4** No study surface remains: no `/study` route, no `StudySession` table/model/port/repository,
  no `study:*` capability, no timer component or test.
- **I-5** A plan row's `dayKey` is not after `iranDayKey(homework.deadline)`, and a completed homework
  accepts no new plan row.

### Edge cases (each with a machine-readable check)

| Edge case | Expected behaviour | verify |
|---|---|---|
| Date with no budget row | capacity 0; any `plannedMinutes >= 1` rejected with `plan_over_capacity`; nothing written | `pnpm test -t "plan on a day without budget is rejected"` |
| Two tasks competing on one day | the sum is what is capped: 2h + 2h in a 3h day rejects the second with «۴ ساعت از ۳ ساعت» | `pnpm test -t "two tasks share one day capacity"` |
| Exact fit | 5h planned into 5h free accepted; 5h01m rejected | `pnpm test -t "fitsCapacity accepts exactly the free minutes"` |
| Empty free time on create | the weekday suggestion is stored (14h − class minutes) | `pnpm test -t "set free time falls back to the weekly suggestion"` |
| Lowering free time below planned | rejected with `free_time_below_planned` on field `freeTime`; stored value unchanged | `pnpm test -t "set free time below planned is rejected"` |
| `00:00` free time | accepted, stores `0`; only zero-plan days can reach it | `pnpm test -t "free time parses hh:mm"` |
| `00:00` planned time / 24h+ | rejected at the boundary with a Persian message | `pnpm test -t "plan minutes reject zero"` |
| Plan on/after the deadline | accepted on the deadline day, rejected the day after | `pnpm test -t "plan after the homework deadline is rejected"` |
| Completed homework | new plan rejected with `homework_completed` | `pnpm test -t "plan for a completed homework is rejected"` |
| Concurrent writes to one day | exactly one succeeds; the loser gets `plan_concurrent_write` (409) and I-1 still holds | `docker compose up -d postgres && pnpm test --run test/advising/free-time-integration.test.ts -t "concurrent plan writes keep the invariant"` |
| Budget row deleted by user cascade | budget rows and plan rows disappear, `StudySession` never reappears | `pnpm test -t "cascades planning rows"` |
| Class day > 14h | suggestion clamps to `0`, manual entry still accepted | `pnpm test -t "suggestFreeMinutes never goes below zero"` |
| No budget data at all | leisure returns `low_activity` (or `heavy_workload` when backlogged), never `NaN` | `pnpm test -t "leisure zero budget means low activity"` |
| Deleted `/study` URL | 404, no redirect to a timer | `bash -c '! test -e "src/app/(advising)/study"'` |

---

## API contracts

### Server action: `setFreeTimeAction`

Request (`FormData`):

| field | type | rule |
|---|---|---|
| `date` | `YYYY-MM-DD` | shape + real calendar date; required |
| `freeTime` | `hh:mm` | `^([01]\d|2[0-3]):[0-5]\d$`; empty ⇒ use the weekday suggestion |

`ActionState` success: `{ ok: true, data: { dayKey, freeMinutes } }`.
Errors: `invalid_input` (400, field `date`/`freeTime`, Persian), `free_time_below_planned` (409, field
`freeTime`, message «۴ ساعت از ۳ ساعت» style: planned-of-new-capacity — precisely
`durationMessage(usedMinutes, newFreeMinutes)`), `forbidden` (403), `internal_error` (500).

### Server action: `planHomeworkAction`

Request: `date` (`YYYY-MM-DD`), `homeworkId` (uuid), `plannedTime` (`hh:mm`, non-empty).
Success: `{ ok: true, data: { homeworkId, dayKey, plannedMinutes } }`.
Errors: `plan_over_capacity` (409, field `plannedTime`, `durationMessage(used + new, free)`),
`plan_after_deadline` (400, field `date`), `homework_completed` (409, field `homeworkId`),
`not_found` (404), `forbidden` (403), `plan_concurrent_write` (409, field `plannedTime`,
«برنامه هم‌زمان تغییر کرد؛ دوباره تلاش کنید»).

### Page data (`GetDayBudgetUseCase` result — server-only, not serialized to JSON)

```ts
interface DayBudget {
  dayKey: string;
  freeMinutes: number | null;        // null = no row
  suggestedMinutes: number;          // 14h − class minutes for that weekday
  usedMinutes: number;
  remainingMinutes: number;          // 0 when no row
  plans: { id: string; homeworkId: string; title: string; plannedMinutes: number }[];
  candidates: { id: string; title: string; deadline: Date }[]; // pending, plan-day <= deadline
}
```

### Error codes added

`domain/errors.ts`: `PlanOverCapacityError` (`plan_over_capacity`, 409),
`FreeTimeBelowPlannedError` (`free_time_below_planned`, 409), `PlanConcurrencyError`
(`plan_concurrent_write`, 409, keeps `cause`).
`presentation/messages.ts`: static entry for `plan_concurrent_write`; a
`PASSTHROUGH_CODES = new Set(["plan_over_capacity", "free_time_below_planned"])` branch that uses
`error.message` (built only from formatted integers + fixed Persian words — no user or internal data),
plus `FIELD_FOR_CODE`: `plan_over_capacity → plannedTime`, `free_time_below_planned → freeTime`,
`plan_concurrent_write → plannedTime`.
`presentation/schedule-schemas.ts`: no change. `presentation/planning-format.ts`: replace the private
`toIranDayKey` + `IRAN_OFFSET_MINUTES` with `iranDayKey` from `domain/day-key` (identical arithmetic).

---

## Files to create or modify

### Create

| File | Budget | Purpose |
|---|---|---|
| `src/modules/advising/domain/day-key.ts` | ~35 | Iran day key/midnight/shift/validate, no imports |
| `src/modules/advising/domain/free-time.ts` | ~90 | suggestion, capacity, fit, Persian duration message |
| `src/modules/advising/application/free-time.ts` | ~110 | `GetDayBudgetUseCase`, `SetFreeTimeBudgetUseCase` |
| `src/modules/advising/application/homework-plan.ts` | ~110 | `PlanHomeworkTimeUseCase`, `DeleteHomeworkPlanUseCase` |
| `src/modules/advising/infrastructure/prisma-free-time-budget-repository.ts` | ~80 | upsert/guard inside a Serializable transaction; `P2034` → `PlanConcurrencyError` |
| `src/modules/advising/infrastructure/prisma-homework-plan-repository.ts` | ~90 | day sums, guarded upsert, delete |
| `src/modules/advising/presentation/free-time-schemas.ts` | ~70 | `date`, `freeTime`, `plannedTime`, `homeworkId` |
| `src/modules/advising/presentation/time-value.ts` | ~20 | duck-typed picker → `"HH:mm"` / `"YYYY-MM-DD"` |
| `src/app/(advising)/budget/page.tsx` | ≤40 | `requireCapability("budget:read")` → `GetDayBudgetUseCase` → vm |
| `src/app/(advising)/budget/budget-day.vm.tsx` | ~60 | `DatePicker` → `router.push`, form divs |
| `src/app/(advising)/budget/budget-day.view.tsx` | ~110 | capacity card, plan table, forms |
| `src/app/(advising)/budget/budget.actions.ts` | ~90 | the three actions |
| `src/app/(advising)/budget/_components/free-time-form.vm.tsx` | ~45 | `useFormAction` + `useServerFormErrors`, `onFinish` converts the picker |
| `src/app/(advising)/budget/_components/free-time-form.view.tsx` | ~70 | `TimePicker` + suggestion hint |
| `src/app/(advising)/budget/_components/plan-form.vm.tsx` | ~45 | same pattern for the plan form |
| `src/app/(advising)/budget/_components/plan-form.view.tsx` | ~80 | `Select`(candidates) + `TimePicker` |
| `src/app/(advising)/budget/_components/plan-list.view.tsx` | ~60 | static list + delete button (no hooks → no vm) |
| Tests | see Test plan | 6 unit files + 1 integration file |
| `docs/contracts/phase-5-3-1-free-time-budget.md` | — | this plan's Contract |
| `docs/behaviors/phase-5-3-1-free-time-budget.md` | — | observable behaviour + `source_files` |

### Modify

| File | Change |
|---|---|
| `prisma/schema.prisma` | remove `StudySession` + `User.studySessions`; add 2 models, 2 relation fields |
| `prisma/migrations/<new>/migration.sql` | the DDL above (generated, then inspected) |
| `src/modules/advising/domain/models.ts` | delete `STUDY_CATEGORIES`, `StudyCategory`, `StudySessionRecord`, `NewStudySession`; add `FreeTimeBudget`, `HomeworkPlanEntry`, `NewHomeworkPlanEntry` |
| `src/modules/advising/domain/ports.ts` | delete `StudySessionRepositoryPort`; add `FreeTimeBudgetRepositoryPort`, `HomeworkPlanRepositoryPort` |
| `src/modules/advising/domain/capabilities.ts` | `study:read/write` → `budget:read/write` in the union and all three role rows |
| `src/modules/advising/domain/capabilities.test.ts` | swap `study:write` → `budget:write`; drop `study:*` from the counselor list |
| `src/modules/advising/domain/errors.ts` | +3 error classes |
| `src/modules/advising/domain/leisure.ts` | new inputs + utilization branches |
| `src/modules/advising/domain/leisure.test.ts` | rewrite cases (see Test plan) |
| `src/modules/advising/application/planning-access.ts` | `PlanCapability` union: `study:write` → `budget:write` |
| `src/modules/advising/application/leisure.ts` | read budget + plan rows in `[today-6, today]`; drop study repo; build new inputs |
| `src/modules/advising/application/leisure.test.ts` | rewrite against the budget/plan fakes |
| `src/modules/advising/application/nutrition.ts` | `studyDayKey` → `iranDayKey` from `domain/day-key` |
| `src/modules/advising/presentation/messages.ts` | +1 static message, passthrough set, 3 field mappings |
| `src/modules/advising/presentation/planning-format.ts` | use `iranDayKey`; delete the local offset constant |
| `src/modules/advising/presentation/planning-format.test.ts` | unchanged assertions (only the import path moves) |
| `src/server/container.ts` | drop study use cases + repo; add 4 use cases + 2 repos; `CONTAINER_VERSION` `3 → 4` |
| `src/constants/test-ids.ts` | delete `NAV.STUDY` + the `STUDY` block; add `NAV.BUDGET` + `BUDGET` block |
| `src/app/(advising)/layout.tsx` | replace the `/study` nav item with `/budget` («وقت آزاد», gated by `budget:read`) |
| `src/app/(advising)/homework/page.tsx` | `studyDayKey` → `iranDayKey` (import path only) |
| `src/app/(advising)/homework/homework-board.view.tsx` | one static `Link` «برنامه‌ریزی وقت» → `/budget?date=<todayKey>` (no prop change) |
| `src/app/(advising)/leisure/page.tsx` | render the new reason/actions; add a `Link` to `/budget`; keep both test ids |
| `test/fakes/planning.ts` | drop `FakeStudySessionRepository`; add `FakeFreeTimeBudgetRepository`, `FakeHomeworkPlanRepository` (guarded upserts honour the callbacks); factory returns `{ schedule, homework, budget, plans }` |
| `test/fakes/nutrition-leisure.ts` | swap the study fake for the budget/plan fakes |
| `test/advising/planning-integration.test.ts` | replace the study round-trip; re-point the cascade case |
| `test/architecture.test.ts` | **no change** — counts stay 13 / 11 (D-1) |
| `tests/e2e/advising-planning.spec.ts` | drop the study case; add the budget cases; redirect case uses `/budget` |
| `README.md`, `docs/plan/phases.md`, `docs/behaviors/phase-5-2-…md`, `docs/behaviors/access-control-baseline.md`, `CHANGELOG.md` | see Documentation impact |

### Delete

| Path | Note |
|---|---|
| `src/app/(advising)/study/` (7 files) | `page.tsx`, `study-timer.vm.tsx`, `study-timer.view.tsx`, `study.actions.ts`, `_components/study-session-form.{vm,view}.tsx`, `_components/study-analysis.view.tsx` |
| `src/modules/advising/application/study.ts`, `study.test.ts` | use cases gone with the timer |
| `src/modules/advising/application/study-metrics.ts`, `study-metrics.test.ts` | day-key helpers re-homed to `domain/day-key.ts`; analysis helpers die |
| `src/modules/advising/presentation/study-schemas.ts`, `study-schemas.test.ts` | no study form remains |
| `src/modules/advising/presentation/pomodoro-timer.ts`, `pomodoro-timer.test.ts` | client timer reducer |
| `src/modules/advising/infrastructure/prisma-study-session-repository.ts` | table is dropped |

Ordering constraint: the `/study` deletion and the `/budget` addition must land in the **same change**,
otherwise `withLocalUi === 11` fails in between.

---

## Test plan

Vitest, one file per concern. Every `it(...)` title below is new and appears in exactly one file
(checked against the current registry; e.g. `duplicate weekly slot` already lives in two files and is not reused).

### `src/modules/advising/domain/day-key.test.ts` (new)

- `iranDayKey shifts UTC+03:30`
- `iranDayKey at 20:45Z rolls to the next Iran day`
- `startOfIranDay returns Iran midnight`
- `shiftDayKey crosses a month boundary`
- `isDayKey rejects an impossible calendar date`

### `src/modules/advising/domain/free-time.test.ts` (new)

- `suggestFreeMinutes subtracts class minutes`
- `suggestFreeMinutes merges overlapping classes`
- `suggestFreeMinutes never goes below zero`
- `dayCapacity treats a missing budget row as zero`
- `dayCapacity clamps remaining at zero`
- `fitsCapacity accepts exactly the free minutes`
- `fitsCapacity rejects one minute over`
- `fitsCapacity rejects a non-positive addition`
- `durationMessage renders used of free in Persian`

### `src/modules/advising/domain/leisure.test.ts` (rewrite)

- `leisure critical fatigue at ninety percent`
- `leisure heavy workload beats utilization`
- `leisure overloaded week at seventy-five percent`
- `leisure balanced week in the middle band`
- `leisure zero budget means low activity`

### `src/modules/advising/application/free-time.test.ts` (new)

- `set free time stores minutes`
- `set free time falls back to the weekly suggestion`
- `set free time below planned is rejected`
- `set free time allows an exact match`
- `day budget reports used and remaining`
- `day budget lists pending candidates only`
- `counselor cannot write a student budget`

### `src/modules/advising/application/homework-plan.test.ts` (new)

- `plan minutes within capacity is stored`
- `plan minutes over capacity is rejected`
- `plan upsert replaces the same task day`
- `plan after the homework deadline is rejected`
- `plan on the deadline day is accepted`
- `plan for a completed homework is rejected`
- `plan on a day without budget is rejected`
- `two tasks share one day capacity`
- `counselor cannot plan a student homework`
- `delete plan entry clears the row`

### `src/modules/advising/application/leisure.test.ts` (rewrite)

- `leisure reads budget rows in the last seven days`
- `leisure ignores missing budget days`
- `leisure counts overdue homework by Iran day`

### `src/modules/advising/presentation/free-time-schemas.test.ts` (new)

- `free time parses hh:mm`
- `free time rejects a malformed clock`
- `free time empty means the suggestion`
- `plan date must be a real calendar day`
- `plan minutes reject zero`
- `plan date rejects a past-format year`

### `src/modules/advising/presentation/time-value.test.ts` (new)

- `picker value becomes hh:mm`
- `picker value becomes a day key`
- `picker value rejects a non formatter`

### `test/advising/planning-integration.test.ts` (modify — real Postgres, skips without docker)

- keep `duplicate weekly slot`, `cascades planning rows`, `unknown entry`, `schedule round-trip`, `homework round-trip`
- delete `study session round-trip`
- add `free time budget round-trip`
- add `homework plan round-trip`
- add `plan row cascades with its homework`

### `test/advising/free-time-integration.test.ts` (new — real Postgres)

- `plan over capacity writes nothing`
- `concurrent plan writes keep the invariant`
- `budget shrink below planned writes nothing`

### `tests/e2e/advising-planning.spec.ts` (modify — `E2E_ENABLED=true`)

- `logged-out visitor is redirected to /login on planning pages` (edit: `/budget`, not `/study`)
- keep `student creates and deletes a schedule entry`
- delete `student records a study session and sees analysis update`
- add `student sets free time and plans homework`
- add `plan over capacity shows a Persian field error`
- add `no study nav entry remains`

### Deleted test files

`study.test.ts`, `study-metrics.test.ts`, `study-schemas.test.ts`, `pomodoro-timer.test.ts` (the day-key
boundary cases move to `domain/day-key.test.ts` with new titles).

---

## Acceptance Criteria

- [ ] AC-1: When `src/app/(advising)/study` is inspected, no study route, nav entry, timer component or study capability remains. — verify: `bash -c '! test -e "src/app/(advising)/study" && ! grep -rq "study:read\|study:write\|StudySessionRepositoryPort\|pomodoro" src prisma/schema.prisma && ! grep -q "NAV.STUDY" src/constants/test-ids.ts'`
- [ ] AC-2: When the migration is applied, the `StudySession` table no longer exists in Postgres. — verify: `docker compose exec -T postgres psql -U mr_dan -d mr_dan -tAc 'SELECT to_regclass($$public."StudySession"$$)'` prints one empty line and exits 0
- [ ] AC-3: When `prisma/schema.prisma` is searched, `StudySession` has zero occurrences. — verify: `bash -c '! grep -q "StudySession" prisma/schema.prisma && pnpm exec prisma validate'`
- [ ] AC-4: When the migration is re-checked, the database is in sync and no migration is pending. — verify: `pnpm exec prisma migrate status`
- [ ] AC-5: When the page-triad and 40-line architecture rules run, both still hold with the new `/budget` page. — verify: `pnpm test -t "keeps the page triad" && pnpm test -t "keeps pages under 40 lines"`
- [ ] AC-6: When a student submits `02:00` as free time, the stored value is `120` minutes and the form reports `ok: true`. — verify: `pnpm test -t "set free time stores minutes"`
- [ ] AC-7: When the free-time field is submitted empty, the weekday suggestion (`14h − class minutes`) is stored. — verify: `pnpm test -t "set free time falls back to the weekly suggestion"`
- [ ] AC-8: When a weekday has `05:00` of classes, the suggestion is `09:00` (`540` minutes). — verify: `pnpm test -t "suggestFreeMinutes subtracts class minutes"`
- [ ] AC-9: When a weekday has more than 14 hours of classes, the suggestion is `00:00` and a manual value is still accepted. — verify: `pnpm test -t "suggestFreeMinutes never goes below zero"`
- [ ] AC-10: When planned minutes exceed the day's free minutes, the action returns `plan_over_capacity` on `plannedTime` with a message shaped «۳ ساعت از ۵ ساعت» and no row is written. — verify: `pnpm test -t "plan minutes over capacity is rejected"`
- [ ] AC-11: When planned minutes equal the free minutes exactly, the write succeeds. — verify: `pnpm test -t "fitsCapacity accepts exactly the free minutes"`
- [ ] AC-12: When no free-time row exists for the target date, any plan is rejected as over capacity. — verify: `pnpm test -t "plan on a day without budget is rejected"`
- [ ] AC-13: When two tasks are planned on one date, the second is rejected once the sum exceeds the cap. — verify: `pnpm test -t "two tasks share one day capacity"`
- [ ] AC-14: When free time is lowered below the minutes already planned for that date, the action returns `free_time_below_planned` on `freeTime` and stores nothing. — verify: `pnpm test -t "set free time below planned is rejected"`
- [ ] AC-15: When a plan date is after the homework deadline, the action returns `plan_after_deadline` on `date`. — verify: `pnpm test -t "plan after the homework deadline is rejected"`
- [ ] AC-16: When a completed homework is planned, the action returns `homework_completed`. — verify: `pnpm test -t "plan for a completed homework is rejected"`
- [ ] AC-17: While two writes target the same student-day concurrently, exactly one succeeds and the invariant `planned <= free` holds. — verify: `docker compose up -d postgres && pnpm test --run test/advising/free-time-integration.test.ts -t "concurrent plan writes keep the invariant"`
- [ ] AC-18: When `/leisure` is rendered from budget data, each of the five branches fires from the documented numbers. — verify: `pnpm test --run src/modules/advising/domain/leisure.test.ts`
- [ ] AC-19: When the leisure use case aggregates, it reads budget and plan rows for the last seven Iran days and never a study row. — verify: `pnpm test -t "leisure reads budget rows in the last seven days"`
- [ ] AC-20: When `/budget?date=YYYY-MM-DD` is opened, the page shows the day's free time (or the suggestion), used-of-capacity, the plan list, and the `DatePicker` navigates to another `?date=`. — verify: `E2E_ENABLED=true pnpm test:e2e tests/e2e/advising-planning.spec.ts -g "student sets free time and plans homework"`
- [ ] AC-21: When an over-capacity plan is submitted in the browser, a Persian field error appears under the planned-time field and the list is unchanged. — verify: `E2E_ENABLED=true pnpm test:e2e tests/e2e/advising-planning.spec.ts -g "plan over capacity shows a Persian field error"`
- [ ] AC-22: When a logged-out visitor opens `/budget`, they land on `/login`. — verify: `E2E_ENABLED=true pnpm test:e2e tests/e2e/advising-planning.spec.ts -g "logged-out visitor is redirected to /login on planning pages"`
- [ ] AC-23: When the capability table is inspected, `budget:read`/`budget:write` exist for student, counselor and admin, and `study:*` do not exist. — verify: `pnpm test -t "student has all planning write capabilities" && pnpm test -t "counselor has planning read and write capabilities"`
- [ ] AC-24: When the dependency manifests are checked, `package.json` and `pnpm-lock.yaml` are untouched. — verify: `bash -c 'test -z "$(git status --porcelain package.json pnpm-lock.yaml)"'`
- [ ] AC-25: When the project gates run, typecheck, lint, test and build are green. — verify: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
- [ ] AC-26: When `README.md` is searched, it contains `/budget` and no `/study` or timer description. — verify: `bash -c '! grep -q "/study" README.md && grep -q "/budget" README.md && ! grep -q "پومودورو" README.md'`
- [ ] AC-27: When the new behaviour doc is inspected, it lists its `source_files` and has a `last_verified` date. — verify: `bash -c 'grep -q "^last_verified:" docs/behaviors/phase-5-3-1-free-time-budget.md && grep -q "^source_files:" docs/behaviors/phase-5-3-1-free-time-budget.md'`
- [ ] AC-28: When phase 5.2's behaviour doc is read, it no longer promises a Pomodoro timer and its `source_files` name no study file. — verify: `bash -c '! grep -q "پومودورو\|/study" docs/behaviors/phase-5-2-schedule-homework-study.md && ! grep -q "study" docs/behaviors/phase-5-2-schedule-homework-study.md'` — manual: read the doc body to confirm the timer section is gone rather than renamed
- [ ] AC-29: When `docs/plan/phases.md` is read, §۵.۳.۱ exists with its gate and §۵.۲ no longer promises a live timer. — verify: manual: open `docs/plan/phases.md` §۵.۲/§۵.۳.۱

E2E-backed criteria skip when `E2E_ENABLED` is unset; the Implementer must report whether each E2E AC
actually executed or skipped, and a skip is not evidence.

---

## Documentation impact

### `README.md` (must change — user-facing behaviour changed)

| Section | Change |
|---|---|
| `## صفحات` | `/study` row → `/budget` — «وقت آزاد روزانه و برنامه‌ریزی تکالیف روی همان روز» |
| `## برنامه هفتگی، تکالیف و تایمر مطالعه` → retitle `## برنامه هفتگی، تکالیف و وقت آزاد` | remove the two timer/analysis bullets; add: free time per date via `DatePicker`, `hh:mm` via `TimePicker`, suggestion `۱۴ ساعت منهای کلاس‌های همان روز هفته`, hard cap with the «۳ ساعت از ۵ ساعت» message, lowering below planned rejected, plan rows per task-per-date, plan-after-deadline and completed-task rejections |
| `## تغذیه و اوقات فراغت` | rewrite the leisure paragraph: inputs are planned minutes and free minutes of the last seven Iran days, the five utilisation bands with their numbers, and that study rows are gone |
| `## دسترسی و نقش‌ها` | matrix row `/schedule`, `/homework`, `/study` → `/schedule`, `/homework`, `/budget`; capability list `budget:read/write` replaces `study:*` |
| `## محدودیت‌ها` | delete the Pomodoro-persistence bullet; add: «وقت آزاد روزانه است و الگوی تکرارشونده ندارد؛ برای حذف یک روز، وقت آزاد را صفر کنید (تا وقتی برنامه‌ای روی آن روز هست مجاز نیست)»; add the concurrency note (one writer per day; a concurrent conflict asks for a retry) |
| `## وضعیت` | 5.3.1 line: timer removed, budget added |

No new configuration key and no new environment variable: the `14h` base and the leisure bands are domain
constants (`domain/free-time.ts`, `domain/leisure.ts`), documented in README + behaviour doc, not in
`src/shared/env.ts`. State this explicitly in the README paragraph so the "why isn't this in env" question is answered.

### `docs/behaviors/phase-5-3-1-free-time-budget.md` (new)

Front matter `last_verified: 2026-11-23`, `source_files:` must list exactly:
`prisma/schema.prisma`, `prisma/migrations/<new>/`, `src/modules/advising/domain/{day-key,free-time,leisure,models,ports,capabilities,errors}.ts`,
`src/modules/advising/application/{free-time,homework-plan,leisure,planning-access}.ts`,
`src/modules/advising/infrastructure/{prisma-free-time-budget-repository,prisma-homework-plan-repository}.ts`,
`src/modules/advising/presentation/{free-time-schemas,time-value,messages,planning-format}.ts`,
`src/server/container.ts`, `src/constants/test-ids.ts`, `src/app/(advising)/budget/**`,
`src/app/(advising)/leisure/page.tsx`, `src/app/(advising)/layout.tsx`,
`test/fakes/planning.ts`, `test/advising/{planning-integration,free-time-integration}.test.ts`, `tests/e2e/advising-planning.spec.ts`.
Sections: «کاربر فعلاً چه می‌کند»، «چگونه رفتار می‌کند» (one bullet per AC-5…AC-17), «Edge cases»,
«چه کاری نمی‌کند» (no timer, no recurring template, no counselor UI, no drag-and-drop).

### Other docs

- `docs/behaviors/phase-5-2-schedule-homework-study.md`: drop the timer bullets and study files from
  `source_files`, retitle to «برنامه هفتگی و تکالیف», keep the schedule/homework content and its edge cases.
- `docs/behaviors/access-control-baseline.md`: `/study` → `/budget` in the matrix and the `source_files` line;
  capability sentence updated to `budget:*`.
- `docs/plan/phases.md`: add `### فاز ۵.۳.۱ — وقت آزاد و سقف برنامه‌ریزی تکالیف` with its goal, ticked items and gate;
  amend the §۵.۲ timer bullet to note it was removed in ۵.۳.۱ (history stays honest).
- `docs/contracts/phase-5-3-1-free-time-budget.md`: the Contract above, `review_level: full`.

### `CHANGELOG.md` (after final approval only — do not write during planning)

One-line draft:
`## 2026-11-23 — phase-5-3-1-free-time-budget` — *Removed the study timer and dropped `StudySession`; free time is now entered per date (`hh:mm`, suggested `14h − weekly classes`) and caps per-date homework planning with a Persian over-capacity field error.*

---

## Implementation order

1. `domain/day-key.ts` + `domain/free-time.ts` + tests (pure, no DB, no UI).
2. Rewrite `domain/leisure.ts` + its tests against the new inputs.
3. `prisma/schema.prisma` diff → **dump `StudySession`** → `pnpm prisma migrate dev` → inspect SQL → prove the drop.
4. `models.ts`, `ports.ts`, `errors.ts`, `capabilities.ts` (+test), `planning-access.ts`.
5. Infrastructure repos + fakes (`test/fakes/planning.ts`, `nutrition-leisure.ts`).
6. Application use cases + tests; re-point `application/nutrition.ts` and `application/leisure.ts` to `domain/day-key`.
7. Presentation: `time-value.ts`, `free-time-schemas.ts`, `messages.ts`, `planning-format.ts` (+tests).
8. Container wiring + `CONTAINER_VERSION` 3 → 4.
9. `/budget` page triad + actions + `test-ids` + layout nav + homework link + leisure page.
10. Delete the whole study surface in the same step as step 9 (arch-test counts), then delete its tests.
11. Integration + e2e updates.
12. Docs (README, behaviour docs, phases, contract), then run the full gate and the destructive-proof commands.

---

## Risks

| Risk | Mitigation |
|---|---|
| **First destructive migration**: `DROP TABLE "StudySession"` loses rows irreversibly | mandatory `pg_dump` + pre-drop count before `migrate dev`; committed dump path in the plan; documented `migrate resolve --rolled-back` story |
| **`withLocalUi === 11` / `pages >= 13`** are exact assertions | `/budget` replaces `/study` one-for-one and must be added in the same change as the deletion; `/budget` must keep the `page.tsx` + `.vm.tsx` + `.view.tsx` shape (page imports the vm relatively) |
| **No `dayjs` import possible** → pickers cannot be seeded | D-2's empty-means-default contract, documented in README and behaviour doc; `timeValueToHhmm` unit-tested with a fake formatter, e2e covers the real picker |
| `Serializable` transactions surface `P2034` under concurrent dev writes | mapped to `plan_concurrent_write` with a retry message; one integration test asserts exactly one winner |
| Composite FK `(studentId, dayKey)` → budget | order the migration so `FreeTimeBudget`'s unique index is created before the FK; `prisma validate` + `migrate status` prove it |
| New leisure thresholds change user-facing advice text | README + behaviour doc rewritten in the same change; the five codes and the book pick stay stable so `domain/books.test.ts` is untouched |
| `planning-format` day-key unification could shift a boundary | identical arithmetic (`+210min`, UTC slice); existing `planning-format.test.ts` assertions run unchanged |
| Capability rename touches the access-control baseline | `docs/behaviors/access-control-baseline.md` and the README matrix are edited in the same step; `capabilities.test.ts` swaps `study:*` → `budget:*` |

---

## Review level

`review_level: full` — this change drops a table (irreversible data loss), alters the capability table and
the access-control baseline, and introduces new business arithmetic (capacity bands, utilisation thresholds);
`full` is the only level that matches the repo's own precedent for auth/migration/contract changes.
