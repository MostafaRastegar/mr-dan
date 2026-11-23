# Phase 5.2 — Weekly schedule, homework, study timer

Plan for `docs/plan/phases.md` §فاز ۵.۲ (lines 191-194). Feature slug:
`phase-5-2-schedule-homework-study`. Revision 3 (2026-11-23): verification pass over revision 2.
Decisions D-1…D-5 are unchanged; this pass fixed four internal inconsistencies that would have
made an AC unverifiable — `studyDayKey` provenance (D-4), the `UserRepositoryPort` name in the
access contract, AC-15's test placement, and the stale-doc line count. No scope changed.

## Derived stack (mro-project-stack is still a placeholder)

`.opencode/skills/mro-project-stack/SKILL.md` still says `unknown` for every fact. Derived
from `package.json`, `prisma/schema.prisma`, `vitest.config.ts` and `AGENTS.md` (profile wins
for commands):

- Framework: Next 16.4.6 (App Router, RSC + Server Actions), React 19.3.1, TS 7.0.2 strict.
- DB/ORM: Postgres + Prisma 7.10.1 (exact) with `@prisma/adapter-pg`; client generated to
  `src/generated/prisma`.
- UI: antd 6.7.1 (RTL, `faIR`), Tailwind 4.3.5, `@tabler/icons-react` 3.52.0 (exact).
- Tests: Vitest 5.1.1 (`src/**/*.test.ts`, `test/**/*.test.ts`), Playwright 1.65.1 gated by
  `E2E_ENABLED=true`; architecture test in `test/architecture.test.ts`.
- Package manager: pnpm; commands `pnpm typecheck|lint|test|build|test:e2e`,
  `pnpm prisma migrate dev`.

Skills loaded for this revision: `mro-project-stack`, `mro-data-model`, `mro-behavior-docs`,
`mr-dan-architecture`, `mr-dan-persistence`, `mr-dan-api`, `mr-dan-frontend`,
`mr-dan-feature-workflow`, `mr-dan-testing-parity`. No HTTP route is touched, so `mr-dan-api`
contributes only the error-mapping table, which the actions reuse through `toActionError` /
`toFieldErrors`; its OpenAPI rule has no subject.

Conflicts noted, `AGENTS.md` wins:

1. `.opencode/AGENTS.md` Project Profile still contains `<...>` placeholders (B7 in
   `REVIEW_POLICY.md`). Commands above were derived from root `AGENTS.md`; the Orchestrator
   should run `node .opencode/scripts/mro-doctor.mjs --init` before implementation.
2. `docs/plan/frontend-conventions.md` §"Server action rules" item 5 says actions live in
   `src/server/*-actions.ts`. Shipped code and `AGENTS.md` put them in
   `src/app/**/<area>.actions.ts`. Plan follows `AGENTS.md`; the stale line is corrected as a
   doc change (see Documentation impact).
3. `mr-dan-persistence` rule 3 says queries live in `infrastructure/prisma/`; shipped adapters are
   flat (`infrastructure/prisma-*-repository.ts`). Plan follows the shipped layout and `AGENTS.md`
   ("no premature abstraction"); the skill path is stale.
4. `mr-dan-architecture` step 6 says input schemas belong in `presentation/schemas.ts`; `AGENTS.md`
   requires one file = one responsibility. The three areas get `schedule-schemas.ts`,
   `homework-schemas.ts`, `study-schemas.ts` rather than growing the existing 300-line
   `schemas.ts` that belongs to identity/profile. `AGENTS.md` wins; no behavioural difference
   (`runAction`/`toFieldErrors` are unchanged).
5. `mr-dan-persistence` rule 9 (`take`/`skip` pagination) is deliberately not applied to
   `listByStudentInRange`: truncating the aggregate feed would falsify the productivity numbers.
   The range is bounded to ≤30 days instead. Accepted deviation, stated in the table below.

## Goal

A student can keep a weekly class schedule, a homework list with priority/deadline/completion,
and a client-side Pomodoro timer; completed intervals are persisted as `StudySession` rows and
the app shows time analysis and a productivity rate. A counselor keeps their **own** schedule,
homework and study log through the same pages and still reads (never writes) their students'
planning data.

### Non-goals (deliberate, do not implement)

- No scheduler, no cron, no Telegram reminder/bot (phases.md "خارج از فاز ۵").
- No real-time sync, no websockets, no offline/localStorage sync of timer state.
- No `echarts` and no charts — that dependency exists in 5.4 only. Analysis is numbers + antd
  `Statistic`/`Progress`/`Table`.
- No new npm dependency of any kind (`package.json` and `pnpm-lock.yaml` must be unchanged).
- No counselor-side UI for students' planning data (5.4). Counselor **read** access to students,
  and counselor **write** access to self, are enforced and tested at use-case level only.
- No admin planning surfaces; "admin gated routes unchanged".
- No `Subject` DB table and no join — the catalog is a typed domain constant (see Decisions D-2).
- No homework edit (only create / toggle completion / delete). Correcting a mistake = delete +
  recreate; this keeps the surface minimal.
- No seed changes (`scripts/seed-advising.ts` untouched).
- No RAG/`Document` changes.

## Decisions (confirmed by the human 2026-11-23)

These replace the five open questions of revision 1. Each is a decision, not a preference.

**D-1 — Counselor writes rows they own.** The capability map gains `schedule:write`,
`homework:write`, `study:write` for `counselor` (and therefore for `admin`, which keeps the
existing "admin ⊇ counselor" invariant by plain table rows). A write is still gated twice: the
`<area>:write` capability **and** `row.studentId === actor.id`. Consequence: a counselor can keep
their own plan; a counselor mutating any other row — another user's, or one of their **own
students**' — gets `ForbiddenError` and nothing is written. Read-own-students is unchanged.
Reason: a counselor is also a user of the planner, and the ownership gate is the row-level
security boundary, so no second write path or role branch is needed.

**D-2 — Subject is a slug from a static, typed domain catalog.** New file
`src/modules/advising/domain/subjects.ts`: no I/O, no external import, no migration, no
`Subject` table. `subject` stores a stable slug (`String`); the UI renders the Persian label from
the catalog. Zod validates the slug at the boundary; an unknown slug → `invalid_input` with a
Persian field error on `subject`. Reason: 5.4's "مقایسهٔ دروس" chart groups by slug, so a stable
key is what is needed; a table + FK would add a migration, a seed, and a join for a list that
changes once a year. Per-field grouping does **not** force a schema change: the catalog carries
the grouping, the column stays a single string.

**D-3 — Timezone is fixed at UTC+03:30.** `IRAN_UTC_OFFSET_MINUTES = 210` stays a constant, no
env key, no per-user setting. Reason: single-region product; Iran has had no DST since 2022, so
the offset is stable and a constant cannot drift. A later phase that supports users outside Iran
adds a stored per-user timezone; nothing in this plan blocks that.

**D-4 — Homework deadline is a calendar due day.** No reminder/notification, no per-hour UI.
The column stays `DateTime` holding Iran midnight of the due day, so a later phase can add a
time without a migration. Derived display states, computed server-side from one `todayKey`:

- `done` — `completedAt !== null`.
- `overdue` — pending and `studyDayKey(deadline) < todayKey`.
- `today` — pending and `studyDayKey(deadline) === todayKey`.
- `upcoming` — anything else.

`studyDayKey` is the day-key helper defined in `application/study-metrics.ts` (new in this
phase; it applies D-3's fixed offset), so the comparison is plain string comparison and
day-granular — never a time-of-day check.

**D-5 — `phases.md` is ticked in the same change as the implementation.** Documentation-impact
step 5 stays as written (three bullets `- [x]` plus plan/skill lines). Reason: the phase gate and
the doc cannot disagree.

## Data model (one migration)

Migration: `pnpm prisma migrate dev --name add_advising_schedule_homework_study` (exactly one
migration folder for this sub-phase).

```prisma
model User {
  // … existing fields unchanged …
  weeklySchedule WeeklySchedule[] @relation("StudentSchedule")
  homework       Homework[]       @relation("StudentHomework")
  studySessions  StudySession[]   @relation("StudentStudySessions")
}

model WeeklySchedule {
  id          String   @id @default(uuid())
  studentId   String
  student     User     @relation("StudentSchedule", fields: [studentId], references: [id], onDelete: Cascade)
  dayOfWeek   Int      // 0 = شنبه … 6 = جمعه (Persian week; zod-validated 0..6)
  startMinute Int      // minutes from local midnight, 0..1439
  endMinute   Int      // > startMinute, <= 1439
  subject     String   // slug from domain/subjects.ts, validated at the boundary
  teacher     String?
  room        String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([studentId, dayOfWeek, startMinute])
}

model Homework {
  id          String    @id @default(uuid())
  studentId   String
  student     User      @relation("StudentHomework", fields: [studentId], references: [id], onDelete: Cascade)
  title       String
  subject     String?   // slug from domain/subjects.ts; null = «بدون درس»
  priority    Int       // 3 = high, 2 = medium, 1 = low (domain exposes labels)
  deadline    DateTime  // Iran midnight (UTC+03:30) of the due calendar day
  completedAt DateTime? // null = pending
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([studentId, completedAt, priority])
}

model StudySession {
  id              String   @id @default(uuid())
  studentId       String
  student         User     @relation("StudentStudySessions", fields: [studentId], references: [id], onDelete: Cascade)
  category        String   // study | break | waste — zod-validated, not a PG enum (matches User.role)
  subject         String?  // slug from domain/subjects.ts; null = «بدون درس»
  durationMinutes Int
  focusLevel      Int?     // 1..5; only meaningful for category = study
  startedAt       DateTime
  createdAt       DateTime @default(now())

  @@index([studentId, startedAt])
}
```

Design decisions and trade-offs:

- **No PG enums.** `User.role` is `String` "validated by zod, not a PG enum" (schema comment).
  Follow it for `category`/`priority`/`subject`; migrations stay additive and cheap.
- **`subject` is a slug string, not an FK (D-2).** No `Subject` table, no join, no seed. The
  catalog lives in the domain layer and the boundary validates the slug.
- **`priority` is `Int`, not `String`.** PostgreSQL orders text alphabetically, which would
  need in-memory sorting in the app. The domain exposes `HomeworkPriority` (`low|medium|high`)
  and the repository maps `HOMEWORK_PRIORITY_RANK`. Trade-off: the DB column needs the rank map
  documented in one place (`domain/models.ts`).
- **Times as minutes, not `String` "HH:mm".** Overlap detection and ordering become integer math
  with no parsing in the use case; the boundary (`presentation`) converts once. `Int` also keeps
  lexicographic traps out of the DB. UI input stays `HH:mm` text (`Input`, not `TimePicker` —
  antd `TimePicker`/`DatePicker` need a direct `dayjs` dependency, which is forbidden here).
- **`@@unique([studentId, dayOfWeek, startMinute])` and nothing else on `WeeklySchedule`.**
  Serves `listByStudent` (`WHERE studentId`, ordered `dayOfWeek, startMinute` — the unique index
  is exactly that key order, so the ordered scan is free) and the duplicate-slot guard. A second
  `@@index([studentId, dayOfWeek])` would be redundant (leftmost prefix) and is deliberately not
  added.
- **`Homework @@index([studentId, completedAt, priority])`.** Serves the only list query's
  predicates: `WHERE studentId` plus the optional `completedAt IS NULL` filter, and the
  `priority` ordering prefix. The query needs pending rows first
  (`orderBy: [{ completedAt: { sort: "asc", nulls: "first" } }, { priority: "desc" }, { deadline: "asc" }]`);
  Postgres stores ASC indexes as `NULLS LAST`, so that final ordering costs a small in-memory
  sort over one student's bounded rows. Accepted and stated, not hidden — a mixed
  `DESC/ASC/NULLS FIRST` ordering cannot be satisfied by a single index.
- **`StudySession @@index([studentId, startedAt])`.** Serves every aggregate query: 1-day and
  7/30-day range scans plus `GROUP BY` in the application layer. No per-subject index: subjects
  are grouped from the already-range-filtered rows (bounded, ≤ hundreds).
- **Cascade:** deleting a user deletes their schedule/homework/study rows (`onDelete: Cascade`).
  There is no document-style two-store consistency problem here — Postgres is the only store.
- **No DB `CHECK` constraints.** Prisma-generated migrations do not emit them; bounds are
  enforced by zod at the boundary plus the use case (defense in depth). Stated as an accepted
  limitation.

## Subject catalog — `src/modules/advising/domain/subjects.ts` (new, D-2)

Zero imports except `type { FieldOfStudy }` from `./models` (same folder, no external module).
Groups reuse the existing `FIELDS` vocabulary; there is no second taxonomy.

```ts
export const SUBJECT_SLUGS = [
  // عمومی — all fields (متوسطه اول + دروس عمومی متوسطه دوم)
  "quran", "dini", "farsi", "arabic", "english", "riazi", "olum",
  "ejtemaei", "farhang-honar",
  // ریاضی فیزیک
  "hesaban", "hindese", "gosaste", "amar", "fizik", "shimi",
  // علوم تجربی
  "zist",
  // علوم انسانی
  "adabiat", "tarikh", "joghrafia", "eghtesad", "falsafe",
  "ravanshenasi", "ejtemaei-ensani", "riazi-ensani",
  // فنی حرفه‌ای
  "hesabdari", "bargh", "mekanik", "rayane",
] as const;

export type SubjectSlug = (typeof SUBJECT_SLUGS)[number];

export interface SubjectDefinition {
  readonly label: string;
  readonly fields: readonly FieldOfStudy[]; // empty = every field (عمومی)
}

/** Exhaustive: a missing or extra key fails `pnpm typecheck`. */
export const SUBJECTS: Readonly<Record<SubjectSlug, SubjectDefinition>> = { /* … */ };

export function isSubjectSlug(value: string): value is SubjectSlug;
/** Label for a known slug; an unknown string is returned unchanged (render never throws). */
export function subjectLabel(slug: string): string;
/** Ordered options for the form Select: عمومی first, then the given field's own subjects. */
export function subjectsForField(field: FieldOfStudy | null): { slug: SubjectSlug; label: string }[];
```

Labels (grouped; `fields` empty = عمومی):

| group | slug | label |
|---|---|---|
| عمومی | `quran` / `dini` / `farsi` / `arabic` / `english` / `riazi` / `olum` / `ejtemaei` / `farhang-honar` | قرآن / دین و زندگی / فارسی / عربی / زبان انگلیسی / ریاضی / علوم تجربی / مطالعات اجتماعی / فرهنگ و هنر |
| ریاضی فیزیک | `hesaban` / `hindese` / `gosaste` / `amar` | حسابان / هندسه / ریاضی گسسته / آمار و احتمال |
| ریاضی فیزیک + علوم تجربی | `fizik` / `shimi` | فیزیک / شیمی |
| علوم تجربی | `zist` | زیست‌شناسی |
| علوم انسانی | `adabiat` / `tarikh` / `joghrafia` / `eghtesad` / `falsafe` / `ravanshenasi` / `ejtemaei-ensani` / `riazi-ensani` | ادبیات اختصاصی / تاریخ / جغرافیا / اقتصاد / فلسفه و منطق / روان‌شناسی / جامعه‌شناسی / ریاضی و آمار |
| فنی حرفه‌ای | `hesabdari` / `bargh` / `mekanik` / `rayane` | حسابداری / برق / مکانیک / شبکه و نرم‌افزار رایانه |

- `"dini"` carries the high-school label «دین و زندگی» and also stands for متوسطه اول «پیام‌های
  آسمان»; `olum`/`ejtemaei`/`farhang-honar` cover the متوسطه اول set. One label per slug; the
  alternative would duplicate slugs per level for no query benefit.
- The catalog follows `FIELDS` exactly, which has no «هنر»; هنر students are not representable in
  the profile model today, so the catalog does not invent a fifth field. Stated limitation, not
  a silent gap: extending it is a one-line change plus a profile change, out of scope here.
- Adding a subject later = one line in `SUBJECT_SLUGS` + one `SUBJECTS` entry; the exhaustive
  `Record` makes a forgotten label a typecheck failure. No migration, no seed.

## Layer-by-layer files

### Domain — `src/modules/advising/domain/` (zero external imports)

| File | Change |
|---|---|
| `models.ts` | add `STUDY_CATEGORIES`/`StudyCategory`, `HOMEWORK_PRIORITIES`/`HomeworkPriority`, `HOMEWORK_PRIORITY_RANK`, `DAYS_OF_WEEK`, types `WeeklyScheduleEntry`, `NewScheduleEntry`, `ScheduleEntryPatch`, `HomeworkItem`, `NewHomework`, `HomeworkFilter`, `StudySessionRecord`, `NewStudySession` (`subject: string` / `string | null`, not a union — the boundary owns the union) |
| `subjects.ts` (new) | the catalog above: `SUBJECT_SLUGS`, `SubjectSlug`, `SUBJECTS`, `isSubjectSlug`, `subjectLabel`, `subjectsForField` |
| `ports.ts` | add `ScheduleRepositoryPort`, `HomeworkRepositoryPort`, `StudySessionRepositoryPort` (signatures below) |
| `errors.ts` | add `ScheduleConflictError` (`code "schedule_conflict"`, status 409) |
| `capabilities.ts` | add 6 capabilities (table below); counselor row gains the three writes |
| `schedule.ts` (new) | `clockToMinutes`, `minutesToClock`, `overlaps(a, b)`, `DAYS_OF_WEEK` re-use |

Capability table (D-1):

```ts
student:   profile:read, profile:write, schedule:read, schedule:write,
           homework:read, homework:write, study:read, study:write
counselor: profile:read, profile:write, group:manage, student:assign,
           schedule:read, schedule:write, homework:read, homework:write,
           study:read, study:write
admin:     counselor set + rag:manage + user:manage  // keeps "admin ⊇ counselor"
```

- "Can write" ≡ `hasCapability(role, "<area>:write")`; ownership (`actor.id === ownerId`) is the
  second, non-negotiable gate. No `role === "..."` branch exists in a use case or a component.
- Counselor/admin `:write` is **self-scoped only**: a counselor still cannot write a student's
  row, including their own student's. Read of own students is unchanged and unaffected.
- Admin inherits the writes through the plain table (existing invariant), but no admin planning
  UI exists in 5.2, so those writes are unreachable from the UI; the use case still allows only
  the admin's own rows.

### Application — `src/modules/advising/application/`

One class per intent, dependencies = ports only.

| File | Use cases |
|---|---|
| `planning-access.ts` (new) | `assertPlanWrite(actor, capability: "schedule:write" \| "homework:write" \| "study:write", ownerId)` = capability **and** `ownerId === actor.id`, else `ForbiddenError`; `assertPlanRead(users, actor, ownerId)` = self, or `owner.role === "student" && owner.counselorId === actor.id`, else `ForbiddenError` |
| `schedule.ts` (new) | `ListWeeklyScheduleUseCase`, `CreateScheduleEntryUseCase`, `UpdateScheduleEntryUseCase`, `DeleteScheduleEntryUseCase` |
| `homework.ts` (new) | `ListHomeworkUseCase`, `CreateHomeworkUseCase`, `SetHomeworkCompletionUseCase`, `DeleteHomeworkUseCase` |
| `study.ts` (new) | `RecordStudySessionUseCase`, `GetStudyAnalysisUseCase` |
| `study-metrics.ts` (new) | pure functions only (formulas below) |

Access pattern for every use case (mirrors `groups.ts`):

```ts
type Actor = { id: string; role: Role };
execute(input: { actor: Actor; studentId?: string; … })
```

- `studentId` defaults to `actor.id`; the page always passes `user.id` (never a hidden field from
  the client — `frontend-conventions.md` action rule 4). A counselor's pages therefore always pass
  the counselor's own id; there is no way to target a student from the UI.
- Write use cases: `assertPlanWrite(actor, "<area>:write", ownerId)` → load row via `findById` →
  `row.studentId !== actor.id` → `ForbiddenError` → repository call. The repository is never
  reached on a denial (tests assert zero writes).
- Read use cases: `assertPlanRead` → repository query by owner.
- Overlap check lives in `Create/UpdateScheduleEntryUseCase` and calls the pure `overlaps()` from
  `domain/schedule.ts` over the same student's entries for that `dayOfWeek`.
- `RecordStudySessionUseCase` also: category must be in `STUDY_CATEGORIES`; `1 ≤ durationMinutes
  ≤ 1440`; `focusLevel` forced to `null` when `category !== "study"`; `startedAt ≤ now + 5min`
  (`now` injectable for tests, like `sessionExpiry(now)`).

### Infrastructure — `src/modules/advising/infrastructure/`

| File | Note |
|---|---|
| `prisma-schedule-repository.ts` (new) | explicit `SCHEDULE_SELECT`, row→domain map, ordered `[{dayOfWeek:"asc"},{startMinute:"asc"}]`; unique violation mapped to `ScheduleConflictError` using the same structural `P2002` + `meta.driverAdapterError.cause.constraint.index` helper pattern as `prisma-user-repository.ts` (index name contains `studentId_dayOfWeek_startMinute`) |
| `prisma-homework-repository.ts` (new) | explicit `HOMEWORK_SELECT` + row→domain map (persistence rule 5: no `findMany` without `select`); `listByStudent(studentId, filter)` with `orderBy: [{ completedAt: { sort: "asc", nulls: "first" } }, { priority: "desc" }, { deadline: "asc" }]`; filter `pending` = `completedAt: null`, `done` = `{ not: null }`; `setCompletedAt`, `create`, `delete` |
| `prisma-study-session-repository.ts` (new) | explicit `STUDY_SESSION_SELECT` + row→domain map; `create`, `listByStudentInRange(studentId, from, to)` with `startedAt: { gte: from, lte: to }`, `orderBy: { startedAt: "asc" }`; **no `take`** — truncating would falsify aggregates; the caller caps the range at 30 days (conflict 5 above) |

No `$transaction` is needed: each use case writes exactly one table, so persistence rule 4
(multi-table operations in a transaction) has no subject here. State it in the contract so the
Reviewer does not read the absence as an omission.

Problems with Prisma errors are wrapped by the adapter and keep `cause` (architecture rule 8).
`subject` is copied through unchanged; the adapter never validates it (the boundary already did).

### Presentation — `src/modules/advising/presentation/`

| File | Content |
|---|---|
| `schedule-schemas.ts` (new) | `scheduleEntrySchema` (`dayOfWeek` 0..6, `startTime`/`endTime` `/^([01]\d\|2[0-3]):[0-5]\d$/` → `startMinute`/`endMinute`, `endMinute > startMinute`, `subject: z.enum(SUBJECT_SLUGS, { message: "درس انتخاب‌شده معتبر نیست" })` (required), `teacher`/`room` optional ≤60/≤30), `deleteByIdSchema` |
| `homework-schemas.ts` (new) | `homeworkSchema` (`title` ≤120, `subject: z.enum(SUBJECT_SLUGS, …).optional()`, `priority` enum → rank, `deadline` `YYYY-MM-DD` → Iran midnight via `+03:30`, calendar-validated so `2026-02-30` fails), `homeworkToggleSchema` |
| `study-schemas.ts` (new) | `studySessionSchema` (`category` enum, `durationMinutes` coerce int 1..1440, `focusLevel` optional coerce 1..5, `subject` optional enum as homework, `startedAt` ISO datetime string → `Date`) |
| `pomodoro-timer.ts` (new) | pure reducer + constants (below), imported by the client VM |
| `planning-format.ts` (new) | `formatClock(minutes)` ("۰۸:۳۰"), `formatDeadline(date)`, `formatDuration(minutes)`, `homeworkStatus(item, todayKey): "done" \| "overdue" \| "today" \| "upcoming"` (D-4) — Persian labels/`toLocaleString("fa-IR")`, computed server-side so hydration cannot drift |
| `messages.ts` | add `schedule_conflict: "این بازه با یک درس دیگر همان روز تداخل دارد"` and `FIELD_FOR_CODE.schedule_conflict = "startTime"` (the subject error already arrives as a zod issue path, `invalid_input`) |

`z.enum(SUBJECT_SLUGS)` is valid because `SUBJECT_SLUGS` is a readonly non-empty tuple; the issue
path is `subject`, so `toFieldErrors` puts the Persian message on the `subject` `Form.Item`.

### Server — `src/server/`

- `container.ts`: extend the `advising` block with 10 entries —
  `listWeeklySchedule, createScheduleEntry, updateScheduleEntry, deleteScheduleEntry,
  listHomework, createHomework, setHomeworkCompletion, deleteHomework, recordStudySession,
  getStudyAnalysis`; construct 3 new repositories in `buildAdvising()`.
- `advising-guards.ts`: **no change** (`requireCapability` already accepts any capability; the
  three areas are dynamic and no role branch is added).

### App — `src/app/(advising)/`

| Path | Role |
|---|---|
| `layout.tsx` (modify) | add nav links `/schedule`, `/homework`, `/study` gated by `hasCapability(user.role, "<area>:read")` — counselors now see these links too (they have `:read` and `:write` for self); new `TEST_IDS.NAV.*` |
| `schedule/page.tsx` | `requireCapability("schedule:read")` → `listWeeklySchedule` → `<ScheduleWeekWrapper entries canWrite={hasCapability(role,"schedule:write")} />` (≤40 lines) |
| `schedule/schedule-week.vm.tsx` / `.view.tsx` | table grouped by day + create/edit form + delete control; subject cell = `subjectLabel(slug)` |
| `schedule/_components/schedule-entry-form.{vm,view}.tsx` | antd `Form` + `Form.Item name`; times are `Input` `HH:mm`; day `Select` from `DAYS_OF_WEEK`; subject `Select` from `subjectsForField(user.fieldOfStudy)` (flat if the profile has no field) |
| `schedule/_components/schedule-controls.{vm,view}.tsx` | delete button: `useTransition` → `deleteScheduleEntryAction(id)` → `router.refresh()` on `ok`; rendered only when `canWrite` |
| `schedule/schedule.actions.ts` | `createScheduleEntryAction`, `updateScheduleEntryAction` (form-state shape), `deleteScheduleEntryAction(id: string)` (imperative shape, see Actions) |
| `homework/page.tsx` | `requireCapability("homework:read")` → `listHomework` → `<HomeworkBoardWrapper items canWrite todayKey />` |
| `homework/homework-board.{vm,view}.tsx` | table (title/subject label/priority/deadline/status) + toggle + delete; status cell from `homeworkStatus` |
| `homework/_components/homework-form.{vm,view}.tsx` | antd `Form`; deadline as `Input type="date"`; priority `Select`; subject `Select` (optional, `allowClear`) |
| `homework/_components/homework-controls.{vm,view}.tsx` | toggle/delete via `useTransition` + `router.refresh()` |
| `homework/homework.actions.ts` | `createHomeworkAction`, `toggleHomeworkAction(id, completed)`, `deleteHomeworkAction(id)` |
| `study/page.tsx` | `requireCapability("study:read")` → `getStudyAnalysis({days:7})` → `<StudyTimerWrapper analysis canWrite />` |
| `study/study-timer.vm.tsx` / `.view.tsx` | timer + analysis markup |
| `study/_components/study-session-form.{vm,view}.tsx` | manual/review form: category, duration, focus, subject (`Select` from catalog) → `recordStudySessionAction` via `useFormAction` |
| `study/_components/study-analysis.view.tsx` | static analysis markup (no hooks → no vm needed); subject rows render `subjectLabel` |
| `study/study.actions.ts` | `recordStudySessionAction(previous, formData)` |
| `src/constants/test-ids.ts` (modify) | `NAV.SCHEDULE|HOMEWORK|STUDY`, scopes `SCHEDULE`, `HOMEWORK`, `STUDY` (form/table/controls ids) |

All pages ≤40 lines; each new page imports its `./<x>.vm` (this is what the architecture test
counts). A counselor opening these pages gets their own rows because the page passes
`user.id` — the same page, no role branch.

Every table view carries the three states the frontend skill requires: empty
(`<Empty description="…">`), pending (`loading` on the submit button, `pending` from
`useFormAction`/`useTransition`), and error (`role="alert"`); `Table` sets `rowKey="id"` and
`scroll={{ x: "max-content" }}` so it scrolls inside itself on mobile. An unauthorized control is
removed by `canWrite`, never rendered `disabled`. Success markup uses `role="status"`.

### Test files

- `test/architecture.test.ts` (modify, exact edit below — unchanged by revisions 2 and 3).
- `test/fakes/planning.ts` (new): `FakeScheduleRepository`, `FakeHomeworkRepository`,
  `FakeStudySessionRepository` implementing the ports; create returns a `ScheduleConflictError`
  for a duplicate slot so the fake mirrors the DB constraint; every mutator bumps a counter the
  denial tests read (`expect(fake.writes).toBe(0)`); each fake exposes
  `throwOnCall(next: unknown)` so a mapped adapter failure (with `cause`) is testable without a
  database (testing-parity rule 2).
- `test/advising/planning-integration.test.ts` (new): real Postgres, same live-skip pattern and
  `RUN` namespacing as `test/advising/integration.test.ts`.

## API contracts (application surface)

```ts
// domain/ports.ts
interface ScheduleRepositoryPort {
  listByStudent(studentId: string): Promise<WeeklyScheduleEntry[]>;
  findById(id: string): Promise<WeeklyScheduleEntry | null>;
  create(input: NewScheduleEntry): Promise<WeeklyScheduleEntry>;
  update(id: string, patch: ScheduleEntryPatch): Promise<WeeklyScheduleEntry>;
  delete(id: string): Promise<void>;
}

interface HomeworkRepositoryPort {
  listByStudent(studentId: string, filter: HomeworkFilter): Promise<HomeworkItem[]>;
  findById(id: string): Promise<HomeworkItem | null>;
  create(input: NewHomework): Promise<HomeworkItem>;
  setCompletedAt(id: string, completedAt: Date | null): Promise<HomeworkItem>;
  delete(id: string): Promise<void>;
}

interface StudySessionRepositoryPort {
  create(input: NewStudySession): Promise<StudySessionRecord>;
  listByStudentInRange(studentId: string, from: Date, to: Date): Promise<StudySessionRecord[]>;
}
```

```ts
// application use-case inputs (all carry actor)
ListWeeklySchedule: { actor, studentId? } -> WeeklyScheduleEntry[]
CreateScheduleEntry: { actor, studentId?, dayOfWeek, startMinute, endMinute, subject,
                        teacher?, room? } -> WeeklyScheduleEntry
UpdateScheduleEntry: { actor, entryId, dayOfWeek, startMinute, endMinute, subject,
                       teacher?, room? } -> WeeklyScheduleEntry
DeleteScheduleEntry: { actor, entryId } -> void

ListHomework:    { actor, studentId?, filter?: "all" | "pending" | "done" } -> HomeworkItem[]
CreateHomework:  { actor, studentId?, title, subject?, priority, deadline } -> HomeworkItem
SetHomeworkCompletion: { actor, homeworkId, completed: boolean, now? } -> HomeworkItem
DeleteHomework:  { actor, homeworkId } -> void

RecordStudySession: { actor, studentId?, category, subject?, durationMinutes,
                      focusLevel?, startedAt, now? } -> StudySessionRecord
GetStudyAnalysis:   { actor, studentId?, days?: number /* 1..30, default 7 */, now? }
  -> StudyAnalysis
```

```ts
// application/planning-access.ts
type PlanCapability = "schedule:write" | "homework:write" | "study:write";
assertPlanWrite(actor: Actor, capability: PlanCapability, ownerId: string): void;  // throws ForbiddenError
assertPlanRead(users: UserRepositoryPort, actor: Actor, ownerId: string): Promise<void>; // throws ForbiddenError
```

```ts
interface StudyAnalysis {
  today: { studyMinutes: number; breakMinutes: number; wasteMinutes: number;
           productivityRate: number; averageFocus: number | null };
  days: { day: string; minutes: number }[];      // length = days, oldest first, zero-filled
  subjects: { subject: string | null; minutes: number }[]; // study only, minutes desc
  totalStudyMinutes: number;
  productivityRate: number;                      // 0..1 over the range
  averageFocus: number | null;                   // 1 decimal
}
```

Server Action contracts (choke points unchanged; `runAction` wrapping, `ActionState` result):

- Form-state actions: `(previous: ActionState<T> | null, formData: FormData) => Promise<ActionState<T>>`
  — `createScheduleEntryAction`, `updateScheduleEntryAction`, `createHomeworkAction`,
  `recordStudySessionAction`.
- Imperative actions (precedent: `logoutAction`): `async (id: string, …) => Promise<ActionState<T>>`
  called from a client `startTransition`, followed by `router.refresh()` —
  `deleteScheduleEntryAction`, `deleteHomeworkAction`, `toggleHomeworkAction`.
- Every action: `getSessionContext()`; `if (!session) redirect("/login")` outside `runAction`;
  parse with zod inside `runAction`; `actor: { id, role }` from the session, never from the form.
- No `revalidatePath` anywhere; success UI is `state?.ok` + `router.refresh()`.

## Pomodoro timer design

State machine (`presentation/pomodoro-timer.ts`, pure, no imports):

```ts
export const POMODORO_FOCUS_SECONDS = 25 * 60;
export const POMODORO_BREAK_SECONDS = 5 * 60;

type TimerPhase = "idle" | "focus" | "break" | "review";
interface TimerState {
  phase: TimerPhase;
  endsAt: number | null;            // epoch ms of phase end
  remainingSeconds: number;         // displayed value
  pausedRemainingSeconds: number | null;
  focusStartedAt: Date | null;      // preserved for persistence
  completedFocusCount: number;
}
type TimerEvent =
  | { type: "start"; now: number }      // idle -> focus (sets endsAt, focusStartedAt)
  | { type: "pause"; now: number }      // freezes remainingSeconds
  | { type: "resume"; now: number }     // re-derives endsAt from remaining
  | { type: "tick"; now: number }       // focus -> review, break -> idle
  | { type: "startBreak"; now: number }
  | { type: "reset" };
export function timerReducer(state: TimerState, event: TimerEvent): TimerState;
export function initialTimerState(): TimerState;
export function remainingAt(state: TimerState, now: number): number;
```

Rules:

- **Display derives from timestamps, never from a decrementing counter.** `tick` computes
  `ceil((endsAt - now)/1000)`; a throttled/background tab therefore cannot drift, and one tick
  after the interval has already expired finalizes the phase. `remainingSeconds` is only cached
  for render.
- **Where state lives:** React `useReducer` in `study-timer.vm.tsx`. `setInterval(1000)` plus a
  `visibilitychange` listener dispatch `{type:"tick", now: Date.now()}`. No store, no context,
  no server state.
- **Phase end is not auto-persisted.** `focus → review`; the review pane shows the session form
  prefilled with `category="study"`, `durationMinutes=25`, `startedAt=focusStartedAt`. The row is
  written only when the student submits (explicit consent over silently writing "study" rows).
  `break → idle` writes nothing unless the student records it manually in the same form.
- **Reload / navigation:** in-flight interval is lost; `initialTimerState()` is `idle`. Persisted
  sessions are already in Postgres and reappear in the analysis. This is a stated limitation (no
  `localStorage` mirror: it would duplicate state without solving ownership).
- **Background tab:** as above; if the tab is frozen past `endsAt`, the first tick after wake
  finalizes the phase. `visibilitychange` exists to make that first tick immediate.
- **Testing without a real clock:** the reducer is clock-injected (`now: number` in every
  event), so unit tests pass fixed epoch values — `vi.useFakeTimers()` is not needed. Only the
  `setInterval` wiring in the VM is untested; it is covered by the gated e2e/manual check.

## Productivity / time analysis

Pure functions in `application/study-metrics.ts` (unit-tested, no ports):

```ts
export const IRAN_UTC_OFFSET_MINUTES = 210; // UTC+03:30; Iran has no DST since 2022 (D-3)
export function startOfStudyDay(instant: Date, offsetMinutes?: number): Date;
export function studyDayKey(instant: Date, offsetMinutes?: number): string; // "YYYY-MM-DD"
export function summarizeMinutes(rows: StudySessionRecord[]):
  { study: number; break: number; waste: number; total: number };
export function productivityRate(study: number, breakMin: number, waste: number): number; // 0..1
export function perDaySeries(rows, from: Date, days: number): { day: string; minutes: number }[];
export function perSubjectTotals(rows): { subject: string | null; minutes: number }[];
export function averageFocus(rows): number | null;
```

Exact formulas:

- `studyMinutes = Σ durationMinutes where category === "study"`; same for break/waste.
- `productivityRate = study / (study + break + waste)`, and **0 when the denominator is 0**
  (never `NaN`/`Infinity`). Displayed percent = `Math.round(rate * 1000) / 10`.
- Day bucket = `floor((instant + 210min) / 1 day)` then converted back to an instant;
  `studyDayKey` formats it. A session at `2026-11-23T20:45:00Z` is day `2026-11-24`.
- `perDaySeries` is zero-filled for every day in `[today-6 … today]`, oldest first, so the UI
  never renders a missing day.
- `perSubjectTotals` counts `study` rows only, groups by the `subject` slug (`null` = "بدون درس"
  label in the view), sorted by minutes desc, ties by Persian locale compare on the label.
- `averageFocus` = mean of non-null `focusLevel` over `study` rows, rounded to 1 decimal,
  `null` when no rated study row exists.
- Analysis range: `from = startOfStudyDay(now) - (days-1) days`, `to = now`; `days` clamped
  1..30 by the use case.

## Test plan

Unit (Vitest, no network, fakes from `test/fakes/planning.ts`):

| File | Cases |
|---|---|
| `domain/schedule.test.ts` | `clockToMinutes`/`minutesToClock` round-trip; `overlaps` false for touching `[480,540)`/`[540,600)`, true for containment, identical, partial; rejects `end <= start` at the boundary |
| `domain/subjects.test.ts` (new) | `SUBJECT_SLUGS` has no duplicate; every slug has a label and a known/empty `fields` set; `isSubjectSlug` accepts each slug and rejects `"math"`/`""`; `subjectLabel` returns the Persian label and echoes an unknown string; `subjectsForField("علوم تجربی")` includes `zist`/`fizik`/`shimi` and excludes `hesaban`; `subjectsForField(null)` returns only عمومی |
| `domain/capabilities.test.ts` (modify) | student has all `:write`; counselor has read **and** write capabilities; admin ⊇ counselor (superset assertion, unchanged shape) |
| `application/study-metrics.test.ts` | 60/15/25 → 0.6; empty → 0 (not NaN); 3-day zero-fill; Iran midnight boundary (`20:45Z` → next day); per-subject ignores break/waste; `averageFocus` skips nulls and non-study; `null` when no rated row |
| `application/schedule.test.ts` | owner create/update/delete ok; **counselor creates own entry → written with own id, returned by own list**; other user's row → 403; counselor reads own student; another counselor's student → 403; **counselor update/delete of own student's row → 403, fake write counter 0**; overlapping slot → `schedule_conflict`; touching intervals allowed; `not_found` for unknown id |
| `application/homework.test.ts` | create/list filters (`all`/`pending`/`done`); toggle sets then clears `completedAt`; foreign row → 403; counselor cannot write own student's row → 403; delete foreign → 403 |
| `application/study.test.ts` | record own session ok; `focusLevel` nulled for `break`/`waste`; `durationMinutes` 0/1441 rejected; `startedAt` in the future (>5min) rejected; `days` 0/31 clamped/rejected; counselor reads own student's analysis; foreign → 403 |
| `presentation/schedule-schemas.test.ts` | `24:00`, `8:30`, `08:60`, missing colon rejected; `end == start` rejected; `dayOfWeek` 7/-1 rejected; Persian text preserved; **unknown `subject` slug → `invalid_input` with `fieldErrors.subject` (Persian); a valid slug passes through unchanged** |
| `presentation/study-schemas.test.ts` | category enum; duration bounds; focus 0/6; ISO `startedAt` parsing; optional `subject` slug validated when present |
| `presentation/homework-schemas.test.ts` (new) | `deadline` `2026-02-30` rejected, `2026-02-28` accepted and converted to Iran midnight (`2026-02-27T20:30:00Z`); `title` over 120 rejected; `priority` maps to its rank; optional `subject` slug validated when present |
| `presentation/planning-format.test.ts` (new) | `homeworkStatus`: pending+deadline day before `todayKey` → `overdue`; same day → `today`; next day → `upcoming`; `completedAt` set → `done` even when the day has passed; `20:45Z`-style deadline still compares by Iran day |
| `presentation/pomodoro-timer.test.ts` | start → 1500; tick at +1499 → 1; tick at +1500 → `review`, `focusStartedAt` preserved; pause at +600 → 900; resume at wall+300 later → remaining continues from 900; single tick at +5000 → `review`; break 300s → `idle`; reset |

Integration (`test/advising/planning-integration.test.ts`, real Postgres, graceful skip):

1. duplicate `(studentId, dayOfWeek, startMinute)` insert → `{ code: "schedule_conflict" }`
   (exercises the Prisma 7 `constraint.index` mapping against the real generated index name).
2. deleting a user cascades all three tables to zero rows.
3. `listByStudentInRange` returns only in-range rows, ascending `startedAt`.
4. homework list order: pending first, then priority desc, then deadline asc.
5. schedule list order: `dayOfWeek`, then `startMinute`.

View-level: the project has no React component test harness (no `@testing-library`, and adding
one is forbidden), so the split is: pure state/reducer tests above + schema tests at the action
boundary + gated e2e. Do not add a component test dependency.

Test-name registry — the AC `verify:` commands match on these exact `it(...)` titles, so the
Implementer must use them verbatim:

```
"duplicate weekly slot"            "overlapping entry"
"touching intervals"               "another counselor's student"
"counselor cannot write others"    "counselor writes own plan"
"subject catalog"                  "catalog completeness"
"catalog labels"                   "deadline status"
"productivity rate"                "study day boundary"
"per-subject totals"               "pomodoro"
"record study session"             "cascades planning rows"
"end must be after start"          "dayOfWeek bounds"
"duration bounds"                  "unknown entry"
"empty analysis"                   "future session"
```

`it("subject catalog")` exists exactly once, in `presentation/schedule-schemas.test.ts`: it
asserts the unknown-slug rejection (code `invalid_input`, issue path `subject`, Persian message),
the known-slug pass-through, and that the use case writes the slug verbatim into
`FakeScheduleRepository`. `domain/subjects.test.ts` uses `"catalog completeness"` (no duplicate
slug, every slug labelled) and `"catalog labels"` (`subjectLabel`, `subjectsForField`) so
`-t "subject catalog"` cannot pick up a second, differently-scoped assertion.

E2E: `tests/e2e/advising-planning.spec.ts` (new, `test.skip(!e2eEnabled)` — same pattern as
`advising-auth.spec.ts`): register → `/homework` add → toggle done → reload persists →
`/schedule` add entry → `/study` renders the timer and a zeroed analysis. It needs live services,
so it is **not** a gate; the gate is unit + integration + the page checks.

## Files to create or modify (complete list)

Create:

```
src/modules/advising/domain/subjects.ts
src/modules/advising/domain/schedule.ts
src/modules/advising/application/planning-access.ts
src/modules/advising/application/schedule.ts
src/modules/advising/application/homework.ts
src/modules/advising/application/study.ts
src/modules/advising/application/study-metrics.ts
src/modules/advising/infrastructure/prisma-schedule-repository.ts
src/modules/advising/infrastructure/prisma-homework-repository.ts
src/modules/advising/infrastructure/prisma-study-session-repository.ts
src/modules/advising/presentation/schedule-schemas.ts
src/modules/advising/presentation/homework-schemas.ts
src/modules/advising/presentation/study-schemas.ts
src/modules/advising/presentation/pomodoro-timer.ts
src/modules/advising/presentation/planning-format.ts
src/app/(advising)/schedule/{page.tsx,schedule-week.vm.tsx,schedule-week.view.tsx,schedule.actions.ts}
src/app/(advising)/schedule/_components/{schedule-entry-form,schedule-controls}.{vm,view}.tsx
src/app/(advising)/homework/{page.tsx,homework-board.vm.tsx,homework-board.view.tsx,homework.actions.ts}
src/app/(advising)/homework/_components/{homework-form,homework-controls}.{vm,view}.tsx
src/app/(advising)/study/{page.tsx,study-timer.vm.tsx,study-timer.view.tsx,study.actions.ts}
src/app/(advising)/study/_components/study-session-form.{vm,view}.tsx
src/app/(advising)/study/_components/study-analysis.view.tsx
src/modules/advising/domain/subjects.test.ts
src/modules/advising/domain/schedule.test.ts
src/modules/advising/application/{study-metrics,schedule,homework,study}.test.ts
src/modules/advising/presentation/{schedule-schemas,homework-schemas,study-schemas,pomodoro-timer,planning-format}.test.ts
test/fakes/planning.ts
test/advising/planning-integration.test.ts
tests/e2e/advising-planning.spec.ts   (gated, non-gate)
docs/behaviors/phase-5-2-schedule-homework-study.md
docs/contracts/phase-5-2-schedule-homework-study.md
prisma/migrations/<ts>_add_advising_schedule_homework_study/migration.sql
```

Modify:

```
prisma/schema.prisma
src/modules/advising/domain/{models,ports,errors,capabilities}.ts
src/modules/advising/presentation/messages.ts
src/server/container.ts
src/app/(advising)/layout.tsx
src/constants/test-ids.ts
test/architecture.test.ts
docs/behaviors/access-control-baseline.md
docs/behaviors/phase-5-1-identity-profile.md
docs/plan/phases.md
docs/plan/frontend-conventions.md   (one stale line, see docs impact)
README.md
CHANGELOG.md                        (after final approval only)
```

Exact `test/architecture.test.ts` edit (mandatory, same change; file counts are unaffected by
revisions 2 and 3 — `subjects.ts` is not a page):

```diff
-    expect(withLocalUi).toHaveLength(7);
+    expect(withLocalUi).toHaveLength(10);
@@
-    expect(pages.length).toBeGreaterThanOrEqual(8);
+    expect(pages.length).toBeGreaterThanOrEqual(11);
```

(The three new pages import their sibling VM, so `withLocalUi` grows 7 → 10; total `page.tsx`
grows 8 → 11.)

## Implementation order

1. Load the same skills; run `node .opencode/scripts/mro-doctor.mjs` (profile is a placeholder).
2. Schema + `pnpm prisma migrate dev --name add_advising_schedule_homework_study` +
   `pnpm prisma generate`.
3. Domain: `models.ts`, `ports.ts`, `errors.ts`, `capabilities.ts` (counselor writes),
   `subjects.ts` + `subjects.test.ts`, `schedule.ts` + `schedule.test.ts`,
   `capabilities.test.ts` update.
4. `application/study-metrics.ts` + tests (pure first, no DB).
5. `application/planning-access.ts` (capability **and** ownership; counselor self-write path)
   then `schedule.ts`, `homework.ts`, `study.ts` + fake-based tests (add `test/fakes/planning.ts`
   before the use-case tests).
6. Repositories + integration tests (run with `docker compose up -d`).
7. Presentation schemas (`z.enum(SUBJECT_SLUGS)`), `pomodoro-timer.ts`, `planning-format.ts`
   (incl. `homeworkStatus`), messages, tests.
8. Container wiring.
9. Actions, then pages/triads/components, then `data-testid` registry and layout nav.
10. `test/architecture.test.ts` count edit.
11. Docs, then the full gate.

## Acceptance Criteria

- [x] AC-1: When the single new migration is applied and `pnpm prisma migrate status` runs against a docker Postgres, the command reports the database is up to date with no pending migration. — verify: `pnpm prisma migrate status`
- [x] AC-2: When the schema is validated, `WeeklySchedule`, `Homework`, and `StudySession` exist with the three declared indexes/unique constraints, `subject` is a `String`/`String?` column, and Prisma reports no error. — verify: `pnpm prisma validate`
- [x] AC-3: When a second entry with the same `(studentId, dayOfWeek, startMinute)` is inserted, the repository throws a domain error with `code: "schedule_conflict"`. — verify: `pnpm test -t "duplicate weekly slot"`
- [x] AC-4: When an entry on the same day overlaps an existing interval, create is rejected with `schedule_conflict` and no row is written. — verify: `pnpm test -t "overlapping entry"`
- [x] AC-5: When one entry ends exactly where the next begins (08:00–09:00 and 09:00–10:00), both are accepted. — verify: `pnpm test -t "touching intervals"`
- [x] AC-6: When a counselor reads the planning data of another counselor's student, the use case throws `ForbiddenError` (403) and returns no rows. — verify: `pnpm test -t "another counselor's student"`
- [x] AC-7: When a counselor mutates another user's planning row, including a row belonging to one of their own students, the use case throws `ForbiddenError` and nothing is written. — verify: `pnpm test -t "counselor cannot write others"`
- [x] AC-8: When a counselor creates a schedule entry for themselves, the row is written with their own id and appears in their own list. — verify: `pnpm test -t "counselor writes own plan"`
- [x] AC-9: When a fixture of 60 study + 15 break + 25 waste minutes is summarized, the productivity rate is exactly `0.6`; with no sessions it is `0` and not `NaN`. — verify: `pnpm test -t "productivity rate"`
- [x] AC-10: When a session starts at `2026-11-23T20:45:00Z`, it is bucketed under day `2026-11-24` (UTC+03:30). — verify: `pnpm test -t "study day boundary"`
- [x] AC-11: When study and break rows share a subject, `perSubjectTotals` counts only study minutes for that subject. — verify: `pnpm test -t "per-subject totals"`
- [x] AC-12: When the timer starts and a single tick arrives 1500s later, the phase is `review` with the original `focusStartedAt`; pausing at 600s keeps 900s and resuming continues from there. — verify: `pnpm test -t "pomodoro"`
- [x] AC-13: When a `break` session is recorded with `focusLevel`, the stored row has `focusLevel: null`; a `startedAt` more than 5 minutes in the future is rejected. — verify: `pnpm test -t "record study session"`
- [x] AC-14: When a user with schedule, homework, and study rows is deleted, all three tables have zero rows for that user. — verify: `pnpm test -t "cascades planning rows"`
- [x] AC-15: When a schedule entry carries an unknown `subject` slug, the schema the action uses rejects it with `invalid_input` and a Persian error on the `subject` issue path (rendered as `fieldErrors.subject`); a known slug passes the parse unchanged and `CreateScheduleEntryUseCase` writes that exact slug to the repository. — verify: `pnpm test -t "subject catalog"`
- [x] AC-16: When homework is listed on `2026-11-23`, a pending item due `2026-11-22` is reported as overdue, a pending item due `2026-11-23` as due today, and a completed item is never overdue. — verify: `pnpm test -t "deadline status"`
- [x] AC-17: When the architecture suite runs, every `page.tsx` (including `/schedule`, `/homework`, `/study`) is at most 40 lines. — verify: `pnpm test -t "keeps pages under 40 lines"`
- [x] AC-18: When the architecture suite runs, the page-triad assertion counts 10 pages with local UI and every one has a sibling `.vm.tsx` + `.view.tsx`. — verify: `pnpm test -t "keeps the page triad next to every page"`
- [x] AC-19: When a logged-out visitor opens `/schedule`, `/homework`, or `/study`, they land on `/login` and no planning markup renders. — verify: manual: with `docker compose up -d && pnpm dev`, open the three URLs in a private window; each must land on `/login` (no component-level test harness exists; gated e2e `tests/e2e/advising-planning.spec.ts` asserts the same when `E2E_ENABLED=true`) evidence: `E2E_ENABLED=true pnpm test:e2e tests/e2e/advising-planning.spec.ts` → 3 passed, exit 0 (orchestrator-run); the gated case asserts /schedule, /homework and /study each redirect to /login. Additionally `curl` on the running dev server returned `307 → http://localhost:3000/login` for all three and 0 planning-markup occurrences in the /schedule HTML.
- [x] AC-20: While the change is implemented, `package.json` and `pnpm-lock.yaml` are unchanged (no new dependency). — verify: `git diff --exit-code package.json pnpm-lock.yaml`
- [x] AC-21: When the full gate runs, typecheck, lint, the whole Vitest suite (including the architecture test), and the production build all exit 0. — verify: `pnpm typecheck && pnpm lint && pnpm test && pnpm build` evidence: post-hotfix orchestrator run — typecheck 0, lint 0 (0 no-unused-vars, 2 intentional no-control-regex), test 0 (40 files / 212 tests incl. architecture), build 0 (compiled successfully), plus round-1 migrate status 0, prisma validate 0, lockfile diff 0, doctor --docs 0. Gated e2e: 3 passed, exit 0.
- [x] AC-22: When `README.md` is read, it documents the three new pages, the Pomodoro semantics, the fixed UTC+03:30 day boundary, the calendar-day deadline with its overdue/today derivation, the subject catalog, and the new rows in the access matrix (including counselor self-write). — verify: manual: `README.md` sections "برنامه هفتگی، تکالیف و تایمر مطالعه", "دسترسی و نقش‌ها", "محدودیت‌ها" evidence: README.md `## برنامه هفتگی، تکالیف و تایمر مطالعه` (lines 72-80) documents the three pages, Pomodoro semantics, fixed UTC+03:30, calendar deadline with overdue/today derivation and the 28-subject catalog; `## دسترسی و نقش‌ها` and `## محدودیت‌ها` carry the new rows. Confirmed by the round-2 reviewer.

## Contract

Written to `docs/contracts/phase-5-2-schedule-homework-study.md` by the Implementer once the
code settles (content below is the review unit). `review_level: full` — the change adds a
migration, a new authorization surface (row-level ownership across three tables, plus the
counselor self-write capability), and a large diff (>200 lines). The human owner may downgrade to
`reviewed` at the plan gate.

Interface signatures: see "API contracts" above (ports, use-case inputs, `assertPlanWrite` /
`assertPlanRead`, `ActionState` shapes, `StudyAnalysis`, `subjects.ts` exports).

Invariants (single enforceable sentences):

- "A planning row is readable only by its owner or by the owner's current counselor, and
  writable only by its owner — a counselor included, for their own rows only." — verify:
  `pnpm test -t "another counselor's student"`, `pnpm test -t "counselor cannot write others"`,
  `pnpm test -t "counselor writes own plan"`
- "`subject` is always a slug from `domain/subjects.ts`; an unknown slug is rejected at the
  boundary with `invalid_input` and never reaches a repository." — verify:
  `pnpm test -t "subject catalog"`
- "A pending homework row is overdue exactly when its due calendar day (UTC+03:30) precedes
  today; the comparison is day-granular and never uses a time of day." — verify:
  `pnpm test -t "deadline status"`
- "No weekly schedule holds two entries whose minute intervals on the same day overlap." —
  verify: `pnpm test -t "overlapping entry"`
- "`productivityRate` is a number in `[0,1]`, is `0` for an empty denominator, and never `NaN`
  or `Infinity`." — verify: `pnpm test -t "productivity rate"`
- "Every aggregate is computed from rows whose `startedAt` falls inside the requested range,
  using a fixed UTC+03:30 day boundary." — verify: `pnpm test -t "study day boundary"`
- "The timer never writes a session row without an explicit student submit." — verify:
  `pnpm test -t "pomodoro"` (reducer reaches `review`, no I/O) plus manual: complete a focus
  interval and confirm nothing is persisted until the form is submitted.

Explicit edge cases:

| Case | Expected | verify |
|---|---|---|
| `endMinute == startMinute` | zod rejects with a Persian field error on `endTime` | `pnpm test -t "end must be after start"` |
| `dayOfWeek = 7` / `-1` | rejected at the boundary | `pnpm test -t "dayOfWeek bounds"` |
| unknown entry id | `not_found` (404), no 500 | `pnpm test -t "unknown entry"` |
| `durationMinutes = 0` or `1441` | rejected | `pnpm test -t "duration bounds"` |
| `focusLevel` on `break`/`waste` | stored as `null` | `pnpm test -t "record study session"` |
| unknown `subject` slug | `invalid_input` + Persian `fieldErrors.subject`, nothing written | `pnpm test -t "subject catalog"` |
| valid `subject` slug | stored verbatim, rendered as its Persian label | `pnpm test -t "subject catalog"` |
| counselor mutates own student's row | `forbidden` (403), fake write counter 0 | `pnpm test -t "counselor cannot write others"` |
| pending item due yesterday / today | `overdue` / `today`; completed item → `done` | `pnpm test -t "deadline status"` |
| zero sessions in range | rate `0`, `averageFocus null`, `days` zero-filled | `pnpm test -t "empty analysis"` |
| `startedAt` 10 minutes in the future | rejected | `pnpm test -t "future session"` |
| user deleted | all three tables cascade | `pnpm test -t "cascades planning rows"` |
| concurrent identical slot (two requests) | DB unique wins, second maps to `schedule_conflict`, no partial write | `pnpm test -t "duplicate weekly slot"` |
| tab suspended past `endsAt` | first tick after resume finalizes the phase, no negative time | `pnpm test -t "pomodoro"` |

## Documentation impact

1. `README.md`:
   - new section `## برنامه هفتگی، تکالیف و تایمر مطالعه` (after "احراز هویت و پروفایل"):
     what the student can do, what a counselor can do (own plan only; reads own students),
     Pomodoro 25/5 with client-only state and explicit save, analysis definitions (productivity
     rate formula, UTC+03:30 day boundary), deadline semantics (calendar day; overdue = pending
     and due day before today), the fixed subject catalog and how to extend it
     (`domain/subjects.ts`, no migration), and a link to
     `docs/behaviors/phase-5-2-schedule-homework-study.md`.
   - `## دسترسی و نقش‌ها` matrix: add `/schedule`, `/homework`, `/study` → anon `/login`,
     student/counselor/admin 200; plus one line that a counselor writes only their own planning
     rows and reads students' rows at use-case level with no UI until 5.4.
   - `## محدودیت‌ها`: timer state is not persisted (reload loses an in-flight interval); no
     scheduler, no Telegram reminder; no charts until 5.4; counselor planning data for students
     is read-only with no page; day boundary is fixed to UTC+03:30; the subject catalog follows
     the four `FIELDS` values (no «هنر» group).
   - No install/env/config change: no new dependency, no new env var, no new script.
2. New behavior doc `docs/behaviors/phase-5-2-schedule-homework-study.md` with
   `last_verified: <date tests were re-run>` and `source_files:` listing:
   `prisma/schema.prisma, prisma/migrations/<ts>_add_advising_schedule_homework_study/,
   src/modules/advising/domain/{models,ports,errors,capabilities,schedule,subjects}.ts,
   src/modules/advising/application/{planning-access,schedule,homework,study,study-metrics}.ts,
   src/modules/advising/infrastructure/{prisma-schedule-repository,prisma-homework-repository,prisma-study-session-repository}.ts,
   src/modules/advising/presentation/{schedule-schemas,homework-schemas,study-schemas,pomodoro-timer,planning-format,messages}.ts,
   src/server/container.ts, src/constants/test-ids.ts,
   src/app/(advising)/{schedule,homework,study}/**,
   test/fakes/planning.ts, test/advising/planning-integration.test.ts`.
   The subject catalog needs no separate behavior doc: it is one section of this doc (slug list,
   validation rule, extension path) and has no UI of its own.
   Structure per `mro-behavior-docs`: the `last_verified`/`source_files` front matter, then
   "What users can do now", "How it behaves" (one line per acceptance criterion, then the handled
   edge cases: empty, error, permission-denied), "What it does NOT do" (the Non-goals list),
   "Files touched", "Verification" (commands and results, and anything only read-not-tested is
   labelled as such), and a link back to `README.md`.
3. `docs/behaviors/access-control-baseline.md`: add the three page rows to the matrix, state that
   counselor `:write` is self-scoped, extend `source_files` with the new capability/pages files,
   refresh `last_verified` after tests.
4. `docs/behaviors/phase-5-1-identity-profile.md`: its `source_files` includes `models.ts`,
   `ports.ts`, `errors.ts`, `capabilities.ts`, `container.ts`, `layout.tsx` — all modified here.
   Refresh `last_verified` and add one sentence that these files now also carry 5.2 additions
   (link to the new doc); 5.1 behavior itself is unchanged.
5. `docs/plan/phases.md`: under `### فاز ۵.۲`, change the three bullets to `- [x]` **in the same
   change as the implementation** (D-5) and add
   `**پلن:** [`.opencode/plans/phase-5-2-schedule-homework-study.md`]` and
   `**اسکیل‌ها:** mr-dan-persistence, mr-dan-architecture, mr-dan-frontend` lines the way
   5.1 does.
6. `docs/plan/frontend-conventions.md`: correct the two stale "Actions live in
   `src/server/*-actions.ts`" lines (the rule table row 11 and "Server action rules" item 5) to
   `src/app/<route>/<area>.actions.ts` — the same file already says this at line 183 and in the
   page-triad bullet, so the doc contradicts itself; no other change.
7. `AGENTS.md`: **no change**. The new limits are product data, not stack-wide rules; the RAG
   number block is untouched. The skill table gains no row (no new skill).
8. `docs/contracts/phase-5-2-schedule-homework-study.md`: new file, content from this section,
   `review_level: full`.
9. `CHANGELOG.md` draft (written only after final approval):
   `## <YYYY-MM-DD> — phase 5.2: weekly schedule, homework, study timer` with added/changed
   bullets (schedule/homework/study, counselor self-service planning, subject catalog, calendar
   deadline semantics), the `pnpm test` exit code, and links to the plan, contract, and behavior
   doc.
