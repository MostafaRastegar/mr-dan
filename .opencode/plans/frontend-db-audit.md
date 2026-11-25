# Plan: frontend ↔ database audit + dashboard wiring

Scope: whole `src/app/**` frontend. Verdict per route, then the one route that is
not connected: `/dashboard`. No schema change, no migration, no new dependency.

## Audit result

| Route | Current data source | Verdict |
|---|---|---|
| `/dashboard` | `dashboard.fixture.ts` constants only; toggles are local `useState` | ❌ not connected, hardcoded |
| `/chat` | `POST /api/chat/stream`; messages kept in browser state, `Conversation`/`Message` never read or written | ❌ not persisted (deferred, see below) |
| `/profile` | `getProfile` + `getStudyProfile` (catalog, exam results, courses from DB) | ✅ |
| `/schedule` | `listWeeklySchedule` + `listSchoolProgram` | ✅ but added/deleted school-program rows are stale until full reload |
| `/homework` | `listHomework` | ✅ |
| `/budget` | `getDayBudget` (budget, plan rows, homework candidates) | ✅ |
| `/nutrition` | `getNutritionOverview` (physical profile, TDEE, today `MealPlan`) | ✅ |
| `/leisure` | `getLeisureSuggestion` reads 7-day DB aggregates + static `BOOKS` catalog | ✅ catalog is intentional (README limitation) |
| `/counselor/students` | `counselorRoster` | ✅ |
| `/counselor/students/[id]` | `getStudentStudyPlan` + `listChapters` | ✅ but plan entries stale after write; form defaults `testsTarget` to hardcoded `"300"` |
| `/admin/knowledge` | `/api/documents`, `/api/admin/stats`, `/api/upload` (DB + Chroma) | ✅ |
| `/api-docs` | `/api/openapi` | ✅ docs only |
| `/` | static links | ✅ intentional |

Evidence of the gap: `getWeeklyGoal`, `toggleStudyBlock`, `addTestsDone` are wired in
`container.ts` but no page calls them; `ToggleMealSlotUseCase` exists and is not wired
at all. `dashboard.view.tsx` and `weekly-goal.view.tsx` import types from
`dashboard.fixture.ts`.

Static-by-design (not defects): `SUBJECTS`, `DAYS_OF_WEEK`, `BOOKS`, `FIELDS`
(pure domain catalogs, documented in README «محدودیت‌ها»).

Out of scope / follow-up: chat history persistence changes the chat UI (history
panel) and therefore needs its own UI-gate plan; `regenerate()` in
`chat-page.vm.tsx` is currently a no-op.

## Files

Create:
- `src/modules/advising/application/dashboard.ts` — `DashboardReadModel`, `GetDashboardOverviewUseCase`.
- `src/modules/advising/application/dashboard.test.ts` — aggregate + empty-user cases.
- `src/app/(advising)/dashboard/dashboard.actions.ts` — 4 write actions.
- `docs/behaviors/dashboard.md` — observable behavior doc.

Modify:
- `src/app/(advising)/dashboard/page.tsx` — guard + `getDashboardOverview.execute` + props (≤40 lines).
- `src/app/(advising)/dashboard/dashboard.vm.tsx` — real actions via `useTransition` + `router.refresh()`; drop mock state maps that are not DB-backed.
- `src/app/(advising)/dashboard/dashboard.view.tsx` + `_components/*.view.tsx` — import read-model types from `application/dashboard`; drop the `demo` prop and its loading branches.
- `src/server/container.ts` — wire `dashboardOverview` and `toggleMealSlot`.
- `src/app/(advising)/schedule/_components/school-program-form.vm.tsx` — remove stale `useState(initialEntries)`.
- `src/app/(advising)/counselor/students/[studentId]/counselor-student.vm.tsx` — read `view.plan.entries` from props; default `testsTarget` to `""`.
- `README.md`, `CHANGELOG.md`.

Delete:
- `src/app/(advising)/dashboard/dashboard.fixture.ts`.

## Key decisions

- One aggregate use case (`GetDashboardOverviewUseCase`) instead of 6 parallel page
  calls: keeps `page.tsx` under 40 lines and one place per read model.
- Compose existing use cases where they already own the rule:
  `GetLeisureSuggestionUseCase` for the book card, `goalProgress` + `planMinutesTotal`
  for goal targets, `freeMinutesForDay`/`schoolMinutesForDay`/`otherOccupiedMinutesForDay`
  + `buildStudyBlocks` for today's numbers. No duplicated formula, no new ports.
- Writes use the existing use cases only: `SetHomeworkCompletionUseCase`,
  `ToggleStudyBlockUseCase`, `AddTestsDoneUseCase`, `ToggleMealSlotUseCase`.
- Server state reaches the client only as props; after `state.ok` the client calls
  `router.refresh()`. No `revalidatePath`, no optimistic fake write.
- `?demo=` is removed: empty/error come from real data, never from a query param.
- Dashboard for `admin` shows empty/self state (all read models are self-scoped);
  counselors keep the existing redirect. Trade-off accepted, matches other routes.

## Contract: dashboard-overview

```ts
// application/dashboard.ts
export type DashboardGoal = {
  studiedMinutes: number; studyMinutesTarget: number;
  testsTarget: number; testsDone: number;
};
export type DashboardReadModel = {
  greetingName: string; todayKey: string;
  homework: { today: HomeworkItem[]; tomorrow: HomeworkItem[] };
  schedule: WeeklyScheduleEntry[]; blocks: StudyBlock[];
  freeMinutes: number;
  goal: DashboardGoal | null;
  book: string | null; needLabel: string;
  meal: { plan: MealPlanRecord | null; targetCalories: number | null; hasPhysicalProfile: boolean };
  profile: { fullName: string; role: Role };
};

class GetDashboardOverviewUseCase {
  execute(input: { actor: Actor; now?: Date }): Promise<DashboardReadModel>;
}

// dashboard.actions.ts (all: session guard → runAction → use case)
setHomeworkDoneAction(input: { homeworkId: string; minutes: number }): Promise<ActionState<{ id: string }>>;
toggleStudyBlockAction(input: { block: StudyBlock; completed: boolean }): Promise<ActionState<{ ok: true }>>;
addTestsAction(input: { delta: number }): Promise<ActionState<{ testsDone: number }>>;
toggleMealSlotAction(input: { slot: MealSlot; eaten: boolean }): Promise<ActionState<{ eatenSlots: string[] }>>;
```

- Invariant: `greetingName` and `profile.fullName` always come from the session user's
  `User` row; no literal student identity is rendered anywhere in `src/app/**`.
- Invariant: `freeMinutes === max(0, waking − schoolMinutesToday − otherOccupiedToday − homeworkAvg)`.
- Edge cases:
  - no `WeeklySchedule` rows → `blocks: []`, `freeMinutes` still from waking day.
  - no `StudyPlan` → `goal.studyMinutesTarget = 0`, `goal.testsTarget = 0`, `goal` still non-null with `testsDone` from `WeeklyGoal`.
  - `sleepMinutes || wakeMinutes` null → defaults 23:00/06:30 via `wakingMinutes`.
  - no `MealPlan` today → `meal.plan = null`, `targetCalories` still computed when profile complete.
  - no physical profile → `targetCalories = null`, widget shows the profile prompt.
  - `minutes` out of 1..1440 or `delta` out of 1..100 → `ActionState.ok === false` with the existing Persian message; zero writes.
- review_level: reviewed

## Tests

- `dashboard.test.ts`: aggregate with fake ports (student with data → all cards),
  empty student → empty/zero values, no plan → zero targets.
- `test/advising/*-integration.test.ts`: append cases for persisted
  `completedAt`+`spentMinutes`, `completedBlocks`, `testsDone`, `eatenSlots` against Postgres.
- Manual: schedule add/delete and counselor plan add/delete visible after refresh.

## Documentation impact

- `README.md`: new `## داشبورد` section (what each card reads), update `## وضعیت`
  with the dashboard, add the admin-empty and no-history notes to `## محدودیت‌ها`.
- No new env var or config key.
- New `docs/behaviors/dashboard.md` (`source_files`: `application/dashboard.ts`,
  `dashboard.actions.ts`, `dashboard.page.tsx`/vm/view, `container.ts`,
  `domain/weekly-goal.ts`, `domain/study-blocks.ts`, `domain/free-time.ts`).
- `CHANGELOG.md` (after approval): `- /dashboard now reads homework, schedule, goal, nutrition and book from the database; fixture removed.`

## Acceptance Criteria

- [ ] AC-1: When a logged-in student opens `/dashboard`, the greeting and profile name render the `User.fullName` from the session row, not a literal fixture name. — verify: `pnpm test --run src/modules/advising/application/dashboard.test.ts -t greeting`
- [ ] AC-2: When `/dashboard` renders, no fixture or demo source remains in the app tree. — verify: `! grep -rn "dashboard.fixture\|DASHBOARD_FIXTURE\|searchParams.demo" src/app`
- [ ] AC-3: When the user has a schedule and study profile, free minutes equal `waking − todaySchool − todayOccupied − homeworkAverage` clamped at 0. — verify: `pnpm test --run src/modules/advising/application/dashboard.test.ts -t "free minutes"`
- [ ] AC-4: When today's schedule has rows, study blocks are derived per row with `buildStudyBlocks` (50/10) and no row yields no blocks. — verify: `pnpm test --run src/modules/advising/application/dashboard.test.ts -t blocks`
- [ ] AC-5: When a `StudyPlan` exists, goal targets are plan entries' total minutes and plan `testsTarget`; `testsDone` and studied minutes come from the current `WeeklyGoal`. — verify: `pnpm test --run src/modules/advising/application/dashboard.test.ts -t "goal targets"`
- [ ] AC-6: When no study plan exists, `goal` has zero targets and the dashboard shows the «برنامهٔ مشاور ثبت نشده است» label. — verify: `pnpm test --run src/modules/advising/application/dashboard.test.ts -t "no plan"`
- [ ] AC-7: When the physical profile is incomplete, the nutrition widget shows the profile prompt and `targetCalories` is null; when complete, it shows today's `MealPlan` calories. — verify: `pnpm test --run src/modules/advising/application/dashboard.test.ts -t nutrition`
- [ ] AC-8: When the student marks homework done with N minutes on `/dashboard`, `Homework.completedAt` and `spentMinutes` persist and survive a page reload. — verify: `pnpm test --run test/advising/planning-integration.test.ts -t dashboard-homework`
- [ ] AC-9: When the student ticks a study block or adds 10 tests, `WeeklyGoal.completedBlocks` / `testsDone` persist. — verify: `pnpm test --run test/advising/weekly-goal-integration.test.ts -t dashboard`
- [ ] AC-10: When a meal slot is toggled on `/dashboard`, `MealPlan.eatenSlots` persists for today (uses the newly wired `toggleMealSlot`). — verify: `pnpm test --run test/advising/nutrition-leisure-integration.test.ts -t dashboard-meal`
- [ ] AC-11: When a school-program row is added or deleted on `/schedule`, or a plan entry on the counselor student page, the list reflects it after `router.refresh()` without a full reload; the counselor `testsTarget` field starts empty, not `300`. — verify: manual: add and delete one row on `/schedule` and one plan entry as counselor, confirm the table updates
- [ ] AC-12: When the feature ships, `README.md` has a `## داشبورد` section and `docs/behaviors/dashboard.md` exists with `source_files`. — verify: `grep -q "## داشبورد" README.md && test -f docs/behaviors/dashboard.md`
