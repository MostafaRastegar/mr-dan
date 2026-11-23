# Contract: phase 5.2 (schedule, homework, study timer)

`review_level: full`. Scope: the working tree of `phase-5-2-schedule-homework-study`.
Everything below is read from the shipped code, not from the plan's intent. Where the
code moved relative to the plan, the real path wins and the drift is noted.

## Interfaces

### Application: ports (`src/modules/advising/domain/ports.ts`)

```ts
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

### Application: use-case inputs (all carry `actor`)

```ts
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

### Application: `planning-access.ts`

```ts
type PlanCapability = "schedule:write" | "homework:write" | "study:write";
assertPlanWrite(actor: Actor, capability: PlanCapability, ownerId: string): void;  // throws ForbiddenError
assertPlanRead(users: UserRepositoryPort, actor: Actor, ownerId: string): Promise<void>; // throws ForbiddenError
```

### `StudyAnalysis` interface

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

### Server Action contracts

- Form-state actions: `(previous: ActionState<T> | null, formData: FormData) => Promise<ActionState<T>>`
  — `createScheduleEntryAction`, `updateScheduleEntryAction`, `createHomeworkAction`,
  `recordStudySessionAction`.
- Imperative actions (precedent: `logoutAction`): `async (id: string, …) => Promise<ActionState<T>>`
  called from a client `startTransition`, followed by `router.refresh()` —
  `deleteScheduleEntryAction`, `deleteHomeworkAction`, `toggleHomeworkAction`.
- Every action: `getSessionContext()`; `if (!session) redirect("/login")` outside `runAction`;
  parse with zod inside `runAction`; `actor: { id, role }` from the session, never from the form.
- No `revalidatePath` anywhere; success UI is `state?.ok` + `router.refresh()`.

## Invariants

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

## Explicit edge cases

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
