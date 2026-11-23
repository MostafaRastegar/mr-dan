# Phase 5.3 — Nutrition (BMR/TDEE + meal plan), books & leisure

Plan for `docs/plan/phases.md` §فاز ۵.۳. Feature slug: `phase-5-3-nutrition-leisure`.
Revision 2 (scope change): the human removed the exam/quiz sub-area from phase 5.3 **and from the
roadmap**. No `Question`, no `QuizAttempt`, no grading, no `/exam` route, no exam capability, no
answer-key invariant. Two routes remain (`/nutrition`, `/leisure`), one additive migration, one
phase gate: migration green and BMR/TDEE computed and tested. The three human-confirmed decisions
are folded in (`review_level: full`, typed `domain/books.ts`, generated-then-saved meal plan).

## Derived stack (mro-project-stack and mro-data-model are still placeholders)

Both `mro-*` skills are unfilled templates (`Framework: unknown`, `<SCHEMA_PATH>`). Derived from
`package.json`, `tsconfig.json`, `prisma/schema.prisma`, `vitest.config.ts`, `playwright.config.ts`
and root `AGENTS.md` (profile wins for commands):

- Framework: Next 16.4.6 App Router (RSC + Server Actions), React 19.3.1, TypeScript 7.0.2 strict.
- DB/ORM: Postgres + Prisma 7.10.1 (exact) with `@prisma/adapter-pg`; client generated to
  `src/generated/prisma`. Three applied migrations, latest
  `20261123080240_add_advising_schedule_homework_study`.
- UI: antd 6.7.1 (RTL, `faIR`), Tailwind 4.3.5, `@tabler/icons-react` 3.52.0 (exact).
- Tests: Vitest 5.1.1 (`src/**/*.test.ts`, `test/**/*.test.ts`), Playwright 1.65.1 gated by
  `E2E_ENABLED=true` (its `webServer` starts `pnpm dev` when `CI` is unset). Architecture test at
  `test/architecture.test.ts`.
- Package manager pnpm; commands `pnpm typecheck|lint|test|build|test:e2e`, `pnpm prisma migrate dev`.
- Architecture baseline measured on the current tree: **11 `page.tsx` files, 10 of them with a
  relative import** (`src/app/page.tsx` is the only one without). This is what the two counts below
  are derived from.
- `tsconfig.json` has `resolveJsonModule: true` — irrelevant now that books are typed (confirmed).

Skills loaded for this revision: `mro-project-stack`, `mro-data-model`, `mr-dan-architecture`,
`mr-dan-feature-workflow`, `mr-dan-frontend`, `mr-dan-frontend-debugging` (form/session failure
modes — constraint 4), `mr-dan-testing-parity`, `mr-dan-persistence` (via its rules quoted in the
5.2 plan), `mr-dan-api` (error mapping only; no HTTP route is added), `mr-dan-devops` (no env/docker
change), `mro-behavior-docs`, `mro-code-review-checklist` (review-unit shape). `mr-dan-ingestion` and
`mr-dan-rag` are not loaded: 5.3 touches no loader, chunk, retrieval or prompt code.

Conflicts noted, `AGENTS.md` wins:

1. `.opencode/AGENTS.md` Project Profile still holds `<...>` placeholders. Commands above come from
   root `AGENTS.md`; the Orchestrator should run `node .opencode/scripts/mro-doctor.mjs --init`
   before implementation (same gap 5.1 and 5.2 recorded).
2. `mr-dan-frontend`/`mr-dan-architecture` say input schemas belong in `presentation/schemas.ts`;
   `AGENTS.md` requires one file = one responsibility and 5.2 already split per area. 5.3 adds
   `nutrition-schemas.ts` instead of growing `schemas.ts` (identity/profile owner). No behavioural
   difference.
3. `mr-dan-architecture` step 6 names `<area>.actions.ts` per area — followed literally; `/leisure`
   has **no** action because it has no mutation.

## Scope

From `docs/plan/phases.md` §۵.۳ after this revision, one migration, two routes.

- `MealPlan` plus six nullable physical columns on `User` (`age`, `gender`, `heightCm`, `weightKg`,
  `activityLevel`, `dietGoal`), and BMR/TDEE computed from them.
- Book suggestion from a typed book catalog and leisure suggestion from fatigue/workload rules.

**Gate:** migration green, BMR/TDEE calculated and tested.

### Non-goals (deliberate, do not implement)

- No exam/quiz sub-area of any kind: no `Question`, no `QuizAttempt`, no grading arithmetic, no
  `/exam` route, no exam capability, no `/exam` nav link, no exam test ids. Removed from the roadmap
  by the human, not deferred.
- No new npm dependency; `package.json` and `pnpm-lock.yaml` untouched. No `dayjs`, no chart lib.
- No hand-edited meal rows and no food/recipe database. A plan is generated from TDEE and saved.
- No medical advice: calories are an estimate and the view says so.
- No counselor UI for a student's nutrition data (5.4); counselor *read* of their own students is
  enforced and tested at use-case level only.
- No scheduler, reminder, Telegram, cron, pgvector, Redis, BullMQ.
- No changes to the RAG module, `Document`, ingestion, or the existing study/schedule/homework
  features beyond the capability table and `planning-access.ts`'s capability union.
- No seed-script change (`scripts/seed-advising.ts` untouched) and no `Question` seed rows anywhere.

## Decisions (proposed; the three marked ✔ are confirmed by the human)

**D-1 — Two routes.** `/nutrition` (physical profile + BMR/TDEE + today's meal plan) and `/leisure`
(leisure suggestion + book pick). Books live on `/leisure` because they are the follow-through of a
leisure suggestion, and merging them into `/nutrition` would force one page to require both
`nutrition:write` and `leisure:read`. Reason: one capability set per page, no page with two
unrelated mutations.

**D-2 — Mifflin-St Jeor, five standard activity multipliers, percentage diet goals, 1200 kcal
floor.** Exact constants in §Domain rules. Reason: Mifflin-St Jeor is the current standard for
healthy adults and needs only weight/height/age/sex; percentages for the diet goal avoid an
absolute-kcal offset that behaves badly for small bodies; the 1200 floor is a safety rule that must
be written down and tested, not implicit. Units are integers (`age` years, `heightCm` cm,
`weightKg` kg) so no float formatting reaches the DB.

**D-3 — A partially null physical profile yields no BMR/TDEE, never a guess.** The domain exposes
`isPhysicalProfileComplete(profile)` as a type guard; the read path renders «ابتدا اطلاعات فیزیکی را
کامل کنید». Reason: silently defaulting `weightKg` to 70 would show a plausible-looking number for
someone else's body — the one failure mode a health-adjacent feature cannot have.

**D-4 — `MealPlan` is one generated plan per `(student, day)`, never hand-edited. ✔ confirmed.**
Row = `dayKey` + `targetCalories` + `meals` JSON (4 slots distributed 25/35/30/10, remainder into
`snack` so the sum is exact). The student writes it by pressing «ثبت برنامهٔ امروز»; the use case
generates then upserts (`@@unique([studentId, dayKey])`). Reason: smallest row that is both real
(persisted, per-day, re-openable) and derived (nothing to hand-type).

**D-5 — Leisure is a 5-branch ordered rule set over already-computed numbers.** Inputs:
`studyMinutes7d`, `studyMinutes3d` (from `application/study-metrics.ts summarizeMinutes`, study rows
only), `pendingHomework`, `overdueHomework`. First match wins; the zero-input case falls through to
`low_activity` so the page is never empty. Exact thresholds in §Domain rules. Reason: deterministic,
unit-testable, no new query shape (it reuses the existing study and homework repositories).

**D-6 — Books are a typed domain constant, deterministic pick, no randomness. ✔ confirmed**
(no `data/books.json`). `domain/books.ts` holds 8 offers `{ id, title, author, field:
FieldOfStudy | null, codes: readonly LeisureCode[] }`; `pickBook({ field, code })` = first offer in
catalog order matching `(field null or equal)` and `code ∈ codes`, else first offer with
`field === null`, else `BOOKS[0]`. Reason: no seed, no I/O, no `Math.random`, `as const` literal
types keep `pickBook` exhaustively testable, and nothing has to import a JSON file from outside
`src/` (where `@/*` would not reach it).

**D-7 — Physical profile gets two methods on `UserRepositoryPort`, not a second port.** The table
is `User`; a second adapter over the same table would split ownership (persistence rule).
`UserAccount` is **not** extended — physical fields travel as their own interface, so `USER_SELECT`,
`ProfileView`, `UpdateProfileUseCase` and every existing fake stay untouched. Reason: smallest diff,
and the profile form can never null out `fullName`/`email` by accident.

**D-8 — Reuse `planning-access.ts` by adding one member to `PlanCapability`.**
`PlanCapability` becomes `"schedule:write" | "homework:write" | "study:write" | "nutrition:write"`;
`assertPlanWrite` and `assertPlanRead` keep their bodies. No sibling helper, no duplicated ownership
rule, and no template-literal widening (with the exam area gone, one explicit member is the smaller
edit). Trade-off: the union is the only place a new self-write capability must be registered.

**D-9 — Error `profile_incomplete` (422) rather than a generic `invalid_input`.** `toActionError`
maps by `code`, so a specific Persian message only survives if the code is specific. Reason: the
only remaining trigger is a race (page rendered complete, profile cleared elsewhere), and the user
still deserves a message that says what to fix.

**D-10 — No VM/view triad for `/leisure`.** The page has no mutation and no client state, so
`page.tsx` renders the markup inline and imports only `@/…` (no relative import) — that is what keeps
it out of the triad count. It must stay ≤38 lines; if it does not fit, the page is refactored, not
the architecture test loosened.

## Open questions

None. All four questions from revision 1 are settled by the human:

- Books: typed `src/modules/advising/domain/books.ts`, not `data/books.json` (D-6).
- Meal plan: generated-then-saved only, no hand editing (D-4).
- Exam/quiz: removed from 5.3 and from the roadmap, not deferred (Scope, non-goals).
- `review_level: full`: confirmed (see the last section).

## Data model (one additive migration)

Migration: `pnpm prisma migrate dev --name add_advising_nutrition_leisure` — exactly one migration
folder for this sub-phase, then `pnpm prisma generate`.

```prisma
model User {
  // … existing fields unchanged …
  age           Int?    // years, 10..100
  gender        String? // "male" | "female" — zod-validated, not a PG enum (matches role)
  heightCm      Int?    // 100..250
  weightKg      Int?    // 30..300
  activityLevel String? // sedentary | light | moderate | active | very_active
  dietGoal      String? // lose | maintain | gain

  mealPlans MealPlan[] @relation("StudentMealPlans")
}

model MealPlan {
  id             String   @id @default(uuid())
  studentId      String
  student        User     @relation("StudentMealPlans", fields: [studentId], references: [id], onDelete: Cascade)
  dayKey         String   // "YYYY-MM-DD" Iran day (UTC+03:30, D-3 of 5.2)
  targetCalories Int
  meals          Json     // [{ slot, label, calories }]; sum === targetCalories
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([studentId, dayKey])
}
```

Design notes and trade-offs:

- **One migration, additive only.** Six nullable columns (no backfill, no rename, no default) plus
  one table. `prisma migrate dev` on the existing DB cannot lose data. No seed rows of any kind.
- **`MealPlan` has exactly one row per `(studentId, dayKey)`.** The unique key is the upsert target
  *and* the "one plan for today" rule; no separate index is needed (the leftmost prefix covers
  `WHERE studentId`, and 5.3 has no per-student list query).
- **No stored energy numbers on `MealPlan`.** `targetCalories` is snapshotted on purpose (the plan
  shows what it was generated with even if the profile changes) but `bmr`/`tdee` are not stored —
  they are always recomputed from the profile, so there is one source of truth for the formula.
- **No PG enums** for the six physical strings: same reasoning as `User.role`/`StudySession.category`
  — additive migrations, zod at the boundary.
- **Cascade** on `MealPlan`: deleting a user removes their plans (Postgres is the only store here).
- **No DB `CHECK` constraints** (Prisma never emits them): bounds are zod + domain guards, stated as
  an accepted limitation as in 5.2.

## Domain rules (pure functions, exact arithmetic)

Both files live in `src/modules/advising/domain/` and import nothing external (at most
`import type` from `./models`), which is the phase gate for BMR/TDEE.

### `domain/energy.ts`

```ts
export const GENDERS = ["male", "female"] as const;
export const ACTIVITY_LEVELS = ["sedentary", "light", "moderate", "active", "very_active"] as const;
export const DIET_GOALS = ["lose", "maintain", "gain"] as const;
export type Gender = (typeof GENDERS)[number];
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];
export type DietGoal = (typeof DIET_GOALS)[number];

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
};
export const DIET_GOAL_MULTIPLIERS: Record<DietGoal, number> = {
  lose: 0.85, maintain: 1, gain: 1.1,
};
export const MIN_TARGET_CALORIES = 1200;
export const AGE_RANGE = { min: 10, max: 100 } as const;
export const HEIGHT_RANGE = { min: 100, max: 250 } as const;
export const WEIGHT_RANGE = { min: 30, max: 300 } as const;

export interface PhysicalProfile {
  age: number | null; gender: Gender | null; heightCm: number | null;
  weightKg: number | null; activityLevel: ActivityLevel | null; dietGoal: DietGoal | null;
}
export interface CompletePhysicalProfile {
  age: number; gender: Gender; heightCm: number; weightKg: number;
  activityLevel: ActivityLevel; dietGoal: DietGoal;
}
export type PhysicalProfilePatch = CompletePhysicalProfile; // the form always submits all six

export function isPhysicalProfileComplete(
  profile: PhysicalProfile,
): profile is CompletePhysicalProfile;

export function bmrOf(input: CompletePhysicalProfile): number; // unrounded
export function computeEnergy(input: CompletePhysicalProfile): {
  bmr: number; tdee: number; targetCalories: number;
};

export const MEAL_SLOTS = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number];
export function mealDistribution(targetCalories: number): {
  slot: MealSlot; label: string; calories: number;
}[];
```

```text
bmrOf  = 10*weightKg + 6.25*heightCm − 5*age + (gender === "male" ? 5 : −161)   // Mifflin-St Jeor
tdeeRaw    = bmrOf × ACTIVITY_MULTIPLIERS[activityLevel]
targetRaw  = tdeeRaw × DIET_GOAL_MULTIPLIERS[dietGoal]
bmr        = Math.round(bmrOf)
tdee       = Math.round(tdeeRaw)
targetCalories = Math.max(MIN_TARGET_CALORIES, Math.round(targetRaw))
```

Each of the three is rounded from its own **unrounded** value (no compounded rounding), and only
`targetCalories` is floored.

`mealDistribution` (percent of `targetCalories`): breakfast 25, lunch 35, dinner 30, snack =
remainder (`targetCalories − breakfast − lunch − dinner`), each of the first three
`Math.round(target × pct / 100)`. Invariant `sum(calories) === targetCalories` always holds, and a
test asserts it for two targets. Labels: صبحانه / ناهار / شام / میان‌وعده.

Worked oracles (asserted verbatim by tests):

| input | bmr | tdee | target |
|---|---|---|---|
| male, 17, 180 cm, 70 kg, moderate, maintain | 1745 | 2705 | 2705 |
| female, 17, 165 cm, 55 kg, sedentary, lose | 1335 | 1602 | 1362 |
| female, 40, 150 cm, 40 kg, sedentary, lose | 977 | 1172 | 1200 (floor) |
| male, 20, 175 cm, 60 kg, light, gain | 1599 | 2198 | 2418 |

`mealDistribution(2705)` → `[676, 947, 812, 270]` (sum 2705);
`mealDistribution(1200)` → `[300, 420, 360, 120]` (sum 1200).

### `domain/leisure.ts`

```ts
export const LEISURE_CODES = [
  "critical_fatigue", "heavy_workload", "overloaded_week", "balanced", "low_activity",
] as const;
export type LeisureCode = (typeof LEISURE_CODES)[number];

export interface LeisureInputs {
  studyMinutes7d: number;  // study rows only, never break/waste
  studyMinutes3d: number;
  pendingHomework: number;
  overdueHomework: number;
}
export interface LeisureSuggestion {
  code: LeisureCode;
  title: string;              // Persian
  reason: string;             // Persian, names the numbers that fired
  actions: readonly string[]; // Persian, 2..4 items
}
export function suggestLeisure(inputs: LeisureInputs): LeisureSuggestion;
```

First match wins, in this order:

1. `studyMinutes3d >= 900 || studyMinutes7d >= 2100` → `critical_fatigue`
   («استراحت فوری» — ۳۰ تا ۶۰ دقیقه پیاده‌روی، خواب کافی امشب).
2. `overdueHomework >= 3 || pendingHomework >= 8` → `heavy_workload`
   («بار کاری سنگین» — سه کار عقب‌افتاده را انتخاب و در بلوک‌های ۲۵ دقیقه‌ای تقسیم کن).
3. `studyMinutes7d >= 1500` → `overloaded_week`
   («هفتهٔ پرترافیک» — یک نیم‌روز آفلاین در همین هفته).
4. `studyMinutes7d >= 600 && overdueHomework === 0` → `balanced`
   («تعادل خوب» — همین ریتم را نگه دار و برنامهٔ فراغت هفتگی بساز).
5. otherwise → `low_activity` («شروع کوچک» — ۲۰ دقیقه پیاده‌روی و ۱۰ صفحه کتاب).

Zero input (`0/0/0/0`) lands on branch 5, so the page is never blank and `actions.length >= 2`
always. Precedence is part of the contract: a case that satisfies both 2 and 3 must return
`heavy_workload` (asserted).

### `domain/books.ts`

```ts
export interface BookOffer {
  id: string;
  title: string;
  author: string;
  field: FieldOfStudy | null;         // null = any field
  codes: readonly LeisureCode[];      // leisure codes this book answers
}
export const BOOKS: readonly BookOffer[]; // 8 entries, catalog order is the tie-break
export function pickBook(input: { field: FieldOfStudy | null; code: LeisureCode }): BookOffer;
```

`pickBook` = first offer with `(book.field === null || book.field === field) && codes.includes(code)`;
else first offer with `book.field === null`; else `BOOKS[0]`. Deterministic, no hash, no `Math.random`.
Invariant: every `LeisureCode` with `field: null` returns a book (exhaustiveness test).

## Capability and access matrix

`domain/capabilities.ts` gains three rows. Student gets all three; counselor gets all three (a
counselor is also a user of these pages); admin keeps "⊇ counselor" by listing the same three.

| Capability | student | counselor | admin |
|---|---|---|---|
| `nutrition:read` | ✓ | ✓ | ✓ |
| `nutrition:write` | ✓ | ✓ | ✓ |
| `leisure:read` | ✓ | ✓ | ✓ |

Enforcement (two gates, never one):

| Intent | Capability | Ownership | Denial result |
|---|---|---|---|
| Read physical profile + energy + today's plan | `nutrition:read` | `assertPlanRead`: self, or actor is the owner's counselor | `ForbiddenError` 403 |
| Write physical profile | `nutrition:write` | `assertPlanWrite`: capability **and** `ownerId === actor.id` | `ForbiddenError` 403, zero writes |
| Save meal plan | `nutrition:write` | `assertPlanWrite` (self only) | `ForbiddenError` 403, zero writes |
| Leisure suggestion | `leisure:read` | none — it reads only the actor's own aggregates, keyed by `actor.id` | `ForbiddenError` 403 when the capability is absent |

- Every page passes `user.id` (never a form field) as `studentId`; there is no UI path to another
  user, exactly as in 5.2. `studentId` stays an optional parameter for 5.4.
- Reading a student's nutrition data by their counselor is permitted at use-case level and has no UI
  until 5.4.
- `assertPlanRead` already calls `users.findById(ownerId)`; no new access helper is created (D-8).

## Contract

Written to `docs/contracts/phase-5-3-nutrition-leisure.md`, summarised here. `review_level` is set at
the end of this plan.

### Invariants (single enforceable sentences)

1. A physical profile with any null field never produces a BMR, TDEE or meal plan.
2. `targetCalories` is always `>= 1200` and `sum(meals[].calories) === targetCalories`.
3. A user reads and writes only their own nutrition and meal rows; a counselor may read their own
   students' rows and may never write them.
4. One `MealPlan` row per `(studentId, dayKey)`; saving again replaces, never appends.
5. No `revalidatePath`/`revalidateTag` inside a Server Action; success is `state.ok` plus
   `router.refresh()` plus `form.resetFields()`.
6. `package.json` and `pnpm-lock.yaml` are unchanged.

### Edge cases (each with a machine-readable check)

| Edge case | Expected | verify |
|---|---|---|
| five of six physical fields set | `isPhysicalProfileComplete` false → no energy, `ProfileIncompleteError` on save | `pnpm test -t "incomplete physical profile"` |
| computed target below 1200 | clamped to exactly 1200 | `pnpm test -t "energy floor"` |
| `age` 9 / 101, `heightCm` 99 / 251, `weightKg` 29 / 301 | rejected with a Persian field error on the right field | `pnpm test -t "physical field bounds"` |
| same-day meal plan saved twice | exactly one row, second value wins | `pnpm test -t "meal plan unique per day"` |
| user deleted | their meal plans cascade to zero rows | `pnpm test -t "meal plan unique per day"` |
| zero leisure input | `low_activity`, non-empty `actions` | `pnpm test -t "leisure zero input"` |
| inputs satisfying branches 2 and 3 | `heavy_workload` (precedence) | `pnpm test -t "leisure heavy workload"` |
| counselor writes a physical profile they do not own | 403, fake write counter 0 | `pnpm test -t "physical profile ownership"` |
| counselor saves a meal plan for their own student | 403, fake write counter 0 | `pnpm test -t "physical profile ownership"` |
| unknown/absent `gender`, `activityLevel`, `dietGoal` value | rejected at the boundary with a Persian error on that field | `pnpm test -t "physical field bounds"` |

## API contracts

### Ports (`domain/ports.ts`)

```ts
interface MealPlanRepositoryPort {
  findByDay(studentId: string, dayKey: string): Promise<MealPlanRecord | null>;
  upsert(input: NewMealPlan): Promise<MealPlanRecord>;
}

interface UserRepositoryPort {
  // … existing methods unchanged …
  findPhysicalProfile(id: string): Promise<PhysicalProfile | null>;
  updatePhysicalProfile(id: string, patch: PhysicalProfilePatch): Promise<PhysicalProfile>;
}
```

New domain models (`domain/models.ts`): `MealPlanRecord` (`id, studentId, dayKey, targetCalories,
meals, createdAt, updatedAt`) and `NewMealPlan` (`studentId, dayKey, targetCalories, meals`), plus the
`PhysicalProfile` family imported from `./energy` (re-exported through `models.ts` if the adapter
needs it — no circular value import: `energy.ts` only imports types).

`application/planning-access.ts` (D-8):

```ts
type PlanCapability = "schedule:write" | "homework:write" | "study:write" | "nutrition:write";
```

### Use cases (`application/`)

```ts
// application/nutrition.ts
GetNutritionOverview:  { actor, studentId?, now? } -> {
  profile: PhysicalProfile;
  energy: { bmr: number; tdee: number; targetCalories: number } | null;
  todayKey: string;
  todayPlan: MealPlanRecord | null;
}
UpdatePhysicalProfile: { actor, studentId?, patch: PhysicalProfilePatch } -> PhysicalProfile
SaveMealPlan:          { actor, studentId?, now? } -> MealPlanRecord   // throws ProfileIncompleteError

// application/leisure.ts
GetLeisureSuggestion: { actor, today?, fieldOfStudy?: string | null } -> {
  suggestion: LeisureSuggestion;
  book: BookOffer;
  inputs: LeisureInputs;
}
```

`SaveMealPlan` = load profile → `isPhysicalProfileComplete` (else `ProfileIncompleteError`) →
`computeEnergy` → `mealDistribution` → `mealPlan.upsert({ studentId, dayKey: studyDayKey(now),
targetCalories, meals })`. `todayKey` reuses `studyDayKey` from `application/study-metrics.ts`, so
there is one day-boundary rule in the codebase (5.2 D-3).

`GetLeisureSuggestion` = `study.listByStudentInRange(actor.id, now−7d, now)` →
`summarizeMinutes` for 7d and for the 3d subset → `homework.listByStudent(actor.id, "pending")` →
count `pending` and `overdue` with `homeworkStatus` semantics (`studyDayKey(deadline) < todayKey`) →
`suggestLeisure` → `pickBook`.

### Server Actions

Form-state shape `(previous: ActionState<T> | null, formData: FormData) => Promise<ActionState<T>>`,
imperative shape `async (…) => Promise<ActionState<T>>` called inside `startTransition` — both
already shipped and unchanged.

```ts
// src/app/(advising)/nutrition/nutrition.actions.ts
updatePhysicalProfileAction: (previous, formData) => ActionState<{ saved: true }>
saveMealPlanAction:          ()                 => ActionState<{ dayKey: string }>
```

- `updatePhysicalProfileAction` parses `physicalProfileSchema` (all six required) and calls
  `updatePhysicalProfile`.
- `saveMealPlanAction` takes no input: `now` and `actor` come from the session, never the client.
- Every action: `getSessionContext()`; `if (!session) redirect("/login")` **outside** `runAction`;
  `actor: { id, role }` from the session; no `revalidatePath`.
- `/leisure` has no action file (no mutation).

### Presentation (`presentation/`)

| File | Content |
|---|---|
| `nutrition-schemas.ts` (new) | `physicalProfileSchema`: `age` coerce int 10..100, `gender` `z.enum(GENDERS)`, `heightCm` 100..250, `weightKg` 30..300, `activityLevel` `z.enum(ACTIVITY_LEVELS)`, `dietGoal` `z.enum(DIET_GOALS)` — Persian messages per field, ranges imported from `domain/energy.ts` |
| `nutrition-format.ts` (new) | `formatCalories(n)` (`fa-IR` grouping), `formatMealSlot(slot)` — pure, presentation only |
| `messages.ts` (modify) | `profile_incomplete: "برای محاسبهٔ کالری، ابتدا اطلاعات فیزیکی خود را کامل کنید"`; `FIELD_FOR_CODE.profile_incomplete = "age"` (the first field of the form) |

Zod issue paths become `fieldErrors` keys, which is how the physical-field errors land on the right
`Form.Item` (`age`, `heightCm`, `weightKg`).

### Infrastructure (`infrastructure/`)

| File | Notes |
|---|---|
| `prisma-meal-plan-repository.ts` (new) | explicit `MEAL_PLAN_SELECT`; `upsert` on `studentId_dayKey`; `meals` narrowed from `JsonValue` to `{ slot: MealSlot; label: string; calories: number }[]` with a structural guard (never a cast to `any`) |
| `prisma-user-repository.ts` (modify) | `PHYSICAL_SELECT` (six columns + `id`), `mapPhysical`, the two new methods; `USER_SELECT` and `mapUser` untouched |

No `$transaction`: each use case writes one row to one table (persistence rule 4 has no subject).
State that in the contract so the Reviewer does not read the absence as an omission. Library errors
are wrapped with `cause` preserved (architecture rule 8).

## Files to create or modify (complete)

Create:

```
src/modules/advising/domain/energy.ts
src/modules/advising/domain/leisure.ts
src/modules/advising/domain/books.ts
src/modules/advising/application/nutrition.ts
src/modules/advising/application/leisure.ts
src/modules/advising/infrastructure/prisma-meal-plan-repository.ts
src/modules/advising/presentation/nutrition-schemas.ts
src/modules/advising/presentation/nutrition-format.ts
src/app/(advising)/nutrition/page.tsx                (target ≤26 lines)
src/app/(advising)/nutrition/nutrition-board.vm.tsx
src/app/(advising)/nutrition/nutrition-board.view.tsx
src/app/(advising)/nutrition/nutrition.actions.ts
src/app/(advising)/nutrition/_components/physical-form.vm.tsx
src/app/(advising)/nutrition/_components/physical-form.view.tsx
src/app/(advising)/nutrition/_components/meal-plan.view.tsx
src/app/(advising)/leisure/page.tsx                  (≤38 lines, NO relative import, no vm/view)
src/modules/advising/domain/energy.test.ts
src/modules/advising/domain/leisure.test.ts
src/modules/advising/domain/books.test.ts
src/modules/advising/application/nutrition.test.ts
src/modules/advising/application/leisure.test.ts
src/modules/advising/presentation/nutrition-schemas.test.ts
test/fakes/nutrition-leisure.ts
test/advising/nutrition-leisure-integration.test.ts
tests/e2e/advising-nutrition-leisure.spec.ts
docs/contracts/phase-5-3-nutrition-leisure.md
docs/behaviors/phase-5-3-nutrition-leisure.md
prisma/migrations/<ts>_add_advising_nutrition_leisure/migration.sql
```

Modify:

```
prisma/schema.prisma
src/modules/advising/domain/models.ts                 (meal-plan models, re-export physical types)
src/modules/advising/domain/ports.ts                  (MealPlanRepositoryPort, 2 UserRepositoryPort methods)
src/modules/advising/domain/capabilities.ts           (3 capabilities × 3 roles)
src/modules/advising/domain/errors.ts                 (ProfileIncompleteError, 422)
src/modules/advising/domain/capabilities.test.ts      (new read/write rows)
src/modules/advising/application/planning-access.ts   (PlanCapability gains "nutrition:write", D-8)
src/modules/advising/infrastructure/prisma-user-repository.ts
src/modules/advising/presentation/messages.ts         (profile_incomplete)
src/server/container.ts                               (4 keys, CONTAINER_VERSION 2 → 3)
src/app/(advising)/layout.tsx                         (2 nav links)
src/constants/test-ids.ts                             (NAV.NUTRITION|NAV.LEISURE, NUTRITION, LEISURE)
test/architecture.test.ts                             (see exact edit)
test/fakes/advising.ts                                (2 new UserRepositoryPort methods)
docs/behaviors/access-control-baseline.md
docs/behaviors/phase-5-2-schedule-homework-study.md   (stale-source rule: last_verified + one line)
docs/plan/phases.md                                   (§۵.۳ rewritten, see Documentation impact)
README.md
CHANGELOG.md                                          (after final approval only)
```

Exact `test/architecture.test.ts` edit (mandatory, same change). Proven against the real tree:
today **11** `page.tsx` files, **10** of them with a relative import (`src/app/page.tsx` is the only
one without). 5.3 adds `/nutrition` (a real triad importing `./nutrition-board.vm`) and `/leisure`
(`page.tsx` only, imports only `@/…`, D-10). So `withLocalUi` 10 → 11 and the page count 11 → 13.

```diff
-    expect(withLocalUi).toHaveLength(10);
+    expect(withLocalUi).toHaveLength(11);
@@
-    expect(pages.length).toBeGreaterThanOrEqual(11);
+    expect(pages.length).toBeGreaterThanOrEqual(13);
```

`CONTAINER_VERSION`: `2` → `3`, and the doc comment above it stays accurate ("bump when the
container's shape changes") — the four new keys are exactly that case, and 5.2's stale-container
crash is the reason this is not optional.

`test-ids.ts` additions (no literal `data-testid` anywhere else):

```ts
NAV:       { NUTRITION: "nav-nutrition", LEISURE: "nav-leisure" }
NUTRITION: { FORM: "nutrition-form", SAVED: "nutrition-saved", BMR: "nutrition-bmr",
             TDEE: "nutrition-tdee", TARGET: "nutrition-target", INCOMPLETE: "nutrition-incomplete",
             PLAN: "nutrition-plan", SAVE_PLAN: "nutrition-save-plan" }
LEISURE:   { PANEL: "leisure-panel", BOOK: "leisure-book" }
```

## Test plan

### Unit — domain (pure, the phase gate)

| File | `it(...)` titles | Assertions |
|---|---|---|
| `domain/energy.test.ts` | `"mifflin st jeor"` | the four oracle rows (`bmr`/`tdee`/`targetCalories`) |
| | `"diet goal"` | lose/gain multipliers from the oracle table |
| | `"energy floor"` | target clamps to exactly 1200 |
| | `"incomplete physical profile"` | guard false with any one field null; true when all six set |
| | `"meal distribution"` | `[676, 947, 812, 270]` and `[300, 420, 360, 120]`, both summing to target |
| `domain/leisure.test.ts` | `"leisure critical fatigue"` | `studyMinutes3d 900` and `studyMinutes7d 2100` both fire branch 1 |
| | `"leisure heavy workload"` | `overdue 3` → heavy; `pending 8` with `7d 1600` → heavy (precedence over branch 3) |
| | `"leisure overloaded week"` | `7d 1500`, no homework → branch 3 |
| | `"leisure zero input"` | `0/0/0/0` → `low_activity`, `actions.length >= 2` |
| `domain/books.test.ts` | `"book recommendation"` | field+code match, field-agnostic fallback, `field: null` |
| | `"every leisure code has a book"` | all 5 codes × `field: null` return an offer |

### Unit — application (fakes only, no DB)

| File | `it(...)` titles | Assertions |
|---|---|---|
| `application/nutrition.test.ts` | `"physical profile ownership"` | counselor cannot write another's profile (403, counter 0) and cannot save a meal plan for their own student (403, counter 0); counselor writes own; counselor reads own student; stranger reads → 403 |
| | `"profile incomplete"` | `SaveMealPlan` with 5 of 6 → `code "profile_incomplete"`, zero writes |
| | `"meal plan upsert"` | two saves same day → one row, second target wins; next day → second row |
| `application/leisure.test.ts` | `"leisure uses study minutes"` | 7d/3d sums count `study` only (break/waste excluded); `pending`/`overdue` from the homework fake; the returned `inputs` equal those numbers |

### Unit — presentation (schemas / pure helpers)

| File | `it(...)` titles | Assertions |
|---|---|---|
| `presentation/nutrition-schemas.test.ts` | `"physical field bounds"` | 9/101, 99/251, 29/301 rejected with the right `path`; boundary values accepted; `gender`/`activityLevel`/`dietGoal` rejected outside their tuples |

### Integration — `test/advising/nutrition-leisure-integration.test.ts` (real Postgres, graceful skip)

Same live-skip + `RUN` namespacing pattern as `test/advising/planning-integration.test.ts`.

| `it(...)` title | Assertion |
|---|---|
| `"meal plan unique per day"` | two upserts on the same `(studentId, dayKey)` → 1 row, latest values; a different day → 2 rows; deleting the user → 0 rows (cascade) |
| `"physical profile columns"` | nulls before the first write; update + read round trip; a second user's row is untouched |

### Existing tests referenced by ACs (unchanged assertions, new counts)

`test/architecture.test.ts` keeps both titles and only changes the two numbers above:
`"keeps the page triad next to every page"` (now expects 11) and `"keeps pages under 40 lines"`
(now expects `>= 13`).

### E2E — `tests/e2e/advising-nutrition-leisure.spec.ts` (gated, **must be executed**)

`test.skip(!e2eEnabled)` exactly like `advising-planning.spec.ts`. Needs `docker compose up -d`
(Postgres) and a dev server (Playwright's `webServer` starts `pnpm dev` when `CI` is unset).

1. Logged-out `/nutrition` and `/leisure` → `/login`.
2. Register → `/nutrition`: fill `age 17`, pick `male` (Radio group — a radio has no virtualization
   problem), `heightCm 180`, `weightKg 70`, `activityLevel` via the proven keyboard `pickOption`
   helper on the antd `Select` (5.2's helper, imported verbatim), `dietGoal` `maintain` (Radio) →
   submit → `NUTRITION.BMR` and `NUTRITION.TDEE` are visible and non-empty → `NUTRITION.SAVE_PLAN`
   → `NUTRITION.PLAN` visible with 4 meal rows → reload → the plan is still there (proves
   persistence).
3. `/leisure`: `LEISURE.PANEL` and `LEISURE.BOOK` are visible and their text is non-empty.

E2E asserts **structure and visibility, never Persian numerals**: the formatted values are covered
exactly by the domain unit tests, and asserting `"۲٬۷۰۵"` (U+066C grouping) would be a brittle
second source of truth. Radio groups are used for the 2-option `gender` and 3-option `dietGoal`; the
one 5-option `Select` (`activityLevel`) reuses the helper that already works in 5.2.

### Test-name uniqueness rule

Every `it(...)` title above appears in exactly one file, which is what lets an AC's
`pnpm test -t "<title>"` target a single assertion. Do not reuse a title in another file, and do not
rename one without updating its AC. Note the deliberate near-pair `"incomplete physical profile"`
(domain guard) vs `"profile incomplete"` (use case) — they are different titles on purpose; do not
"tidy" them into one string.

## Acceptance Criteria

- [ ] AC-1: When the single new migration is applied against the docker Postgres, `pnpm prisma migrate status` reports the database is up to date with no pending migration. — verify: `pnpm prisma migrate status`
- [ ] AC-2: When the schema is validated, `MealPlan` exists with its unique `(studentId, dayKey)` compound key, `User` carries the six nullable physical columns, and Prisma reports no error. — verify: `pnpm prisma validate`
- [ ] AC-3: When a male, 17 years, 180 cm, 70 kg, moderate, maintain profile is computed, `bmr` is `1745`, `tdee` is `2705` and `targetCalories` is `2705` (Mifflin-St Jeor). — verify: `pnpm test -t "mifflin st jeor"`
- [ ] AC-4: When `dietGoal` is `lose` or `gain`, the target is the TDEE multiplied by `0.85` or `1.1` and rounded once. — verify: `pnpm test -t "diet goal"`
- [ ] AC-5: When the computed target is below 1200 kcal, it is clamped to exactly `1200`. — verify: `pnpm test -t "energy floor"`
- [ ] AC-6: When five of the six physical fields are set, no BMR/TDEE is produced and saving a meal plan fails with `profile_incomplete` without writing. — verify: `pnpm test -t "incomplete physical profile"`
- [ ] AC-7: When 2705 kcal is distributed, the four meal slots are `676 / 947 / 812 / 270` and sum exactly to the target. — verify: `pnpm test -t "meal distribution"`
- [ ] AC-8: When a student studied 900 minutes in three days (or 2100 in seven), the suggestion is `critical_fatigue`. — verify: `pnpm test -t "leisure critical fatigue"`
- [ ] AC-9: When 8 tasks are pending (or 3 overdue) and the week is also overloaded, the suggestion is `heavy_workload` — workload outranks hours. — verify: `pnpm test -t "leisure heavy workload"`
- [ ] AC-10: When there is no study time and no homework, the suggestion is `low_activity` with at least two non-empty actions. — verify: `pnpm test -t "leisure zero input"`
- [ ] AC-11: When the same field and leisure code are passed twice, `pickBook` returns the same book, and every leisure code resolves to a book. — verify: `pnpm test -t "book recommendation"`
- [ ] AC-12: When a counselor writes a physical profile they do not own, or saves a meal plan for their own student, the use case throws `ForbiddenError` and the repository receives zero writes. — verify: `pnpm test -t "physical profile ownership"`
- [ ] AC-13: When `age` is 9 or 101, `heightCm` 99 or 251, `weightKg` 29 or 301, or an enum value is outside its tuple, the schema rejects the value with a Persian error on that field's path. — verify: `pnpm test -t "physical field bounds"`
- [ ] AC-14: When a meal plan is saved twice for the same day, exactly one row exists with the latest values; deleting the user removes their plans. — verify: `pnpm test -t "meal plan unique per day"`
- [ ] AC-15: When the architecture suite runs, the page-triad assertion counts 11 pages with local UI and every `page.tsx` is at most 40 lines. — verify: `pnpm test -t "keeps the page triad next to every page" && pnpm test -t "keeps pages under 40 lines"`
- [ ] AC-16: When the gated spec runs against live services, `/nutrition` renders the physical form, BMR/TDEE and a saved 4-slot plan, and `/leisure` renders its suggestion panel and book card. — verify: `E2E_ENABLED=true pnpm test:e2e tests/e2e/advising-nutrition-leisure.spec.ts`
- [ ] AC-17: When the container is rebuilt, it carries `CONTAINER_VERSION = 3` so a dev server with a cached container cannot serve a stale shape. — verify: `grep -q "CONTAINER_VERSION = 3" src/server/container.ts`
- [ ] AC-18: When the change is complete, neither the dependency manifest nor the lockfile is modified. — verify: `test -z "$(git status --porcelain package.json pnpm-lock.yaml)"`
- [ ] AC-19: When the full gate runs, typecheck, lint, tests and build all exit 0. — verify: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
- [ ] AC-20: When the README is read, it documents the two new routes, the six physical fields and the Mifflin-St Jeor / calorie rules. — verify: `grep -q "تغذیه و اوقات فراغت" README.md`

## Documentation impact

- **README.md** — new section `## تغذیه و اوقات فراغت` placed after
  `## برنامه هفتگی، تکالیف و تایمر مطالعه`: the two routes, the six physical fields and that they
  live on `/nutrition` rather than `/profile`, Mifflin-St Jeor with the five activity multipliers and
  the three diet goals, the 1200 kcal floor, the exact 25/35/30/remainder meal split, the five
  leisure branches with their thresholds, the deterministic book pick, and a link to
  `docs/behaviors/phase-5-3-nutrition-leisure.md`. Then: add `/nutrition` and `/leisure` to the
  `صفحات:` list; add their rows to the `## دسترسی و نقشها` table (ناشناس → `/login`,
  student/counselor/admin 200); **replace** the `## محدودیتها` line «فیلدهای فیزیکی … در فاز ۵.۳
  اضافه میشوند؛ فعلاً در پروفایل نیستند.» with the real limitations: physical fields live on
  `/nutrition` and not on `/profile`; a meal plan is generated, not hand-edited; only today's plan is
  shown and there is no plan history; calorie figures are estimates and not medical advice; the book
  list is a fixed in-code catalog. No exam/quiz line appears anywhere — it is not a limitation, it
  is out of scope.
- **New configuration: none.** No env var, no key, no `src/shared/env.ts` change, no docker change.
  State this in the return so nobody looks for one.
- **`docs/behaviors/phase-5-3-nutrition-leisure.md`** — required (user-facing feature). Front matter
  `last_verified: <YYYY-MM-DD>` and `source_files:` must list:
  `prisma/schema.prisma`, `prisma/migrations/<ts>_add_advising_nutrition_leisure/`,
  `src/modules/advising/domain/{energy,leisure,books,models,ports,capabilities,errors}.ts`,
  `src/modules/advising/application/{nutrition,leisure,planning-access}.ts`,
  `src/modules/advising/infrastructure/{prisma-meal-plan-repository,prisma-user-repository}.ts`,
  `src/modules/advising/presentation/{nutrition-schemas,nutrition-format,messages}.ts`,
  `src/server/container.ts`, `src/constants/test-ids.ts`,
  `src/app/(advising)/{layout.tsx,nutrition/**,leisure/**}`,
  `test/fakes/nutrition-leisure.ts`, `test/advising/nutrition-leisure-integration.test.ts`,
  `test/architecture.test.ts`, `tests/e2e/advising-nutrition-leisure.spec.ts`.
  No exam file appears in this list.
- **`docs/behaviors/phase-5-2-schedule-homework-study.md`** — its `source_files` list includes files
  this phase changes (`schema.prisma`, `capabilities.ts`, `messages.ts`, `planning-access.ts`,
  `container.ts`, `test-ids.ts`, `layout.tsx`, `architecture.test.ts`, `test/fakes/*`), so the
  stale-doc rule forces an update in the same change: refresh `last_verified` **only after** the
  suite is re-run, and add one line under `چه کاری نمیکند` that `/nutrition` and `/leisure` are
  documented in the 5.3 doc. Do not rewrite its behaviour sections.
- **`docs/behaviors/access-control-baseline.md`** — add the three capabilities and the two routes to
  its access table.
- **`docs/contracts/phase-5-3-nutrition-leisure.md`** — the review unit, shape as in
  `docs/contracts/phase-5-2-…`: interfaces, invariants, edge-case table with `verify:` per row, and
  the `review_level:` line.
- **`docs/plan/phases.md` §فاز ۵.۳** — the human chose full roadmap removal of the exam area, so:
  delete the `Question` + `QuizAttempt` bullet completely; keep and tick `- [x]` only the
  `MealPlan` + physical-fields bullet and the book/leisure bullet; rewrite the **دروازه** line so it
  no longer requires exam grading and reads as «دروازه: migration سبز، محاسبهٔ BMR/TDEE تست‌شده.»
  in the file's own Persian style; add the `**پلن:**` link
  `[`.opencode/plans/phase-5-3-nutrition-leisure.md`](../../.opencode/plans/phase-5-3-nutrition-leisure.md)`
  exactly as 5.2 did. Nothing about exams may survive in that section.
- **CHANGELOG.md** — do not touch during planning or implementation. Draft for after final approval:
  `## 2026-11-23 — فاز ۵.۳: تغذیه و اوقات فراغت` with added (six physical fields, `MealPlan`,
  BMR/TDEE, leisure rules, book picks, `/nutrition` and `/leisure`), the test command and exit code,
  links to the plan, review and behaviour doc, and the limitations listed above. No exam entry.

## Implementation order

1. Load the same skills; run `node .opencode/scripts/mro-doctor.mjs` (profile still a placeholder).
2. Schema + `pnpm prisma migrate dev --name add_advising_nutrition_leisure`, then
   `pnpm prisma generate`. No seed rows are added to the migration.
3. Domain, pure first: `energy.ts` + test, `leisure.ts` + test, `books.ts` + test. The phase gate
   (BMR/TDEE) is provable here, in isolation.
4. `domain/models.ts`, `ports.ts`, `errors.ts` (`ProfileIncompleteError`), `capabilities.ts`; update
   `capabilities.test.ts`; add `"nutrition:write"` to `PlanCapability` in
   `application/planning-access.ts`.
5. `test/fakes/nutrition-leisure.ts` (and the two new methods on `test/fakes/advising.ts`
   `FakeUserRepository`), then `application/nutrition.ts`, `application/leisure.ts` + their tests.
6. `prisma-meal-plan-repository.ts` + the `prisma-user-repository.ts` methods, then
   `test/advising/nutrition-leisure-integration.test.ts` (`docker compose up -d` first).
7. Presentation: `nutrition-schemas.ts`, `nutrition-format.ts`, `messages.ts`, plus the schema test.
8. Container wiring (4 keys) **and** `CONTAINER_VERSION` 2 → 3 in the same edit.
9. Actions, then the pages: `/nutrition` (physical form + energy + plan card) and `/leisure` (static
   page). Then `test-ids.ts` and the two nav links.
10. `test/architecture.test.ts` count edit (11 / 13).
11. Docs (README, behaviour, contract, access baseline, 5.2 stale refresh, `phases.md` rewrite), then
    the e2e spec and **actually run it** with live services.
12. Full gate `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.

## Risks

1. **Health-adjacent numbers.** The 1200 floor is a safety rule, and the view must carry the
   disclaimer «این اعداد تخمینی است و جایگزین نظر پزشک نیست». Do not remove it to shorten the view.
2. **`meals` is a `Json` column.** The read must go through a structural guard to
   `{ slot, label, calories }[]`; a cast is a lint/type violation and a review finding.
3. **Persian numeral assertions in e2e.** Avoided by design; if the Implementer adds one, the spec
   will be flaky across ICU versions. The exact calorie numbers are proven by unit tests.
4. **`PlanCapability` gains a member (D-8).** The union is the only registry of self-write
   capabilities; a Reviewer should confirm no call site widened in effect and that ownership is still
   enforced inside `assertPlanWrite`.
5. **`/leisure` line budget.** If `page.tsx` exceeds 40 lines, the architecture test breaks. The
   escape hatch is a proper triad (and then `withLocalUi` becomes 12) — the Implementer must not
   raise the constant instead.
6. **e2e needs live services.** If docker or the dev server is unavailable the AC cannot be
   confirmed; escalate rather than marking it `[~]`, because 5.2 shipped a spec that never ran and
   that must not repeat.
7. **Partial-profile race.** A profile can be completed on `/nutrition` and cleared only through
   direct DB access, so `profile_incomplete` is a defensive code path. It is still tested (AC-6) so
   the message and the zero-write guarantee cannot rot.
8. **No plan history.** Only today's `MealPlan` is shown. Yesterday's row is still in the table, so a
   future history view needs no migration — only a query.

## review_level

`review_level: full` — confirmed by the human. Justification: the single migration adds PII columns
(`age`, `gender`, `heightCm`, `weightKg`) and the feature produces a health-adjacent calorie target
students may act on, so paired review with real execution is warranted.
