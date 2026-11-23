# Contract: phase 5.3 (nutrition, books, leisure)

`review_level: full`. Scope: the working tree of `phase-5-3-nutrition-leisure`.
Everything below is read from the shipped code, not from the plan's intent.

## Interfaces

### Domain: energy (`src/modules/advising/domain/energy.ts`)

```ts
type Gender = "male" | "female";
type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
type DietGoal = "lose" | "maintain" | "gain";

interface PhysicalProfile {
  age: number | null; gender: Gender | null; heightCm: number | null;
  weightKg: number | null; activityLevel: ActivityLevel | null; dietGoal: DietGoal | null;
}
interface CompletePhysicalProfile {
  age: number; gender: Gender; heightCm: number; weightKg: number;
  activityLevel: ActivityLevel; dietGoal: DietGoal;
}
type PhysicalProfilePatch = CompletePhysicalProfile;

isPhysicalProfileComplete(profile: PhysicalProfile): profile is CompletePhysicalProfile
computeEnergy(input: CompletePhysicalProfile): { bmr: number; tdee: number; targetCalories: number }
mealDistribution(targetCalories: number): { slot: MealSlot; label: string; calories: number }[]
```

Constants: `ACTIVITY_MULTIPLIERS` = 1.2 / 1.375 / 1.55 / 1.725 / 1.9;
`DIET_GOAL_MULTIPLIERS` = 0.85 / 1 / 1.1; `MIN_TARGET_CALORIES = 1200`;
`AGE_RANGE` 10..100, `HEIGHT_RANGE` 100..250, `WEIGHT_RANGE` 30..300.

### Domain: leisure and books

```ts
type LeisureCode = "critical_fatigue" | "heavy_workload" | "overloaded_week"
                 | "balanced" | "low_activity";
interface LeisureInputs { studyMinutes7d: number; studyMinutes3d: number;
                          pendingHomework: number; overdueHomework: number }
interface LeisureSuggestion { code: LeisureCode; title: string; reason: string;
                              actions: readonly string[] }
suggestLeisure(inputs: LeisureInputs): LeisureSuggestion

interface BookOffer { id: string; title: string; author: string;
                      field: FieldOfStudy | null; codes: readonly LeisureCode[] }
pickBook(input: { field: FieldOfStudy | null; code: LeisureCode }): BookOffer
```

### Domain: ports (`src/modules/advising/domain/ports.ts`)

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

`MealPlanRecord` = `{ id, studentId, dayKey, targetCalories, meals: MealPlanItem[],
createdAt, updatedAt }`; `NewMealPlan` omits `id`/timestamps. `MealPlanItem` =
`{ slot: MealSlot; label: string; calories: number }`.

### Application: use cases

```ts
GetNutritionOverview:   { actor, studentId?, now? } -> {
  profile: PhysicalProfile;
  energy: { bmr: number; tdee: number; targetCalories: number } | null;
  todayKey: string;
  todayPlan: MealPlanRecord | null;
}
UpdatePhysicalProfile:  { actor, studentId?, patch: PhysicalProfilePatch } -> PhysicalProfile
SaveMealPlan:           { actor, studentId?, now? } -> MealPlanRecord  // throws ProfileIncompleteError
GetLeisureSuggestion:   { actor, today?, fieldOfStudy?: string | null }
  -> { suggestion: LeisureSuggestion; book: BookOffer; inputs: LeisureInputs }
```

`PlanCapability` gains `"nutrition:write"` (`application/planning-access.ts`); reading
still goes through `assertPlanRead`, writing through `assertPlanWrite` with ownership.

### Server Actions (`src/app/(advising)/nutrition/nutrition.actions.ts`)

- `updatePhysicalProfileAction(previous, formData) => ActionState<{ saved: true }>` parses
  `physicalProfileSchema` (all six required) inside `runAction`.
- `saveMealPlanAction() => ActionState<{ dayKey: string }>` takes no client input; `actor`
  and `now` come from the session and the server clock.
- Both call `getSessionContext()` first and `redirect("/login")` outside `runAction`. No
  `revalidatePath` / `revalidateTag`.

## Invariants

- "BMR is Mifflin-St Jeor with the code's gender term; TDEE is unrounded BMR times the
  activity multiplier; each figure is rounded from its own unrounded value; only the target
  is floored." — verify: `pnpm test -t "mifflin st jeor"`, `pnpm test -t "diet goal"`,
  `pnpm test -t "energy floor"`
- "A profile with any of the six fields null yields no energy number, and saving a meal plan
  fails with `profile_incomplete` before any repository write." — verify:
  `pnpm test -t "incomplete physical profile"`, `pnpm test -t "profile incomplete"`
- "The four meal values are 25/35/30 percent rounded independently, the snack takes the
  remainder, and the four always sum exactly to `targetCalories`." — verify:
  `pnpm test -t "meal distribution"`
- "`(studentId, dayKey)` is unique: two upserts on the same day leave one row with the latest
  values; a different day adds a second row; deleting the user cascades the plans to zero." —
  verify: `pnpm test -t "meal plan upsert"`, `pnpm test -t "meal plan unique per day"`
- "A physical profile is writable only by its owner; a counselor cannot write a student's
  profile or their meal plan and the repository receives zero writes." — verify:
  `pnpm test -t "physical profile ownership"`
- "Leisure thresholds are ordered, first match wins: 3d >= 900 or 7d >= 2100 → critical;
  overdue >= 3 or pending >= 8 → heavy; 7d >= 1500 → overloaded; 7d >= 600 with no overdue
  → balanced; otherwise low activity." — verify: `pnpm test -t "leisure critical fatigue"`,
  `pnpm test -t "leisure heavy workload"`, `pnpm test -t "leisure overloaded week"`,
  `pnpm test -t "leisure zero input"`
- "Only `study` rows count toward leisure minutes; `break` and `waste` are excluded." —
  verify: `pnpm test -t "leisure uses study minutes"`
- "The book pick is deterministic in catalog order: field-and-code match first, then a
  field-agnostic book, and every leisure code resolves to an offer." — verify:
  `pnpm test -t "book recommendation"`, `pnpm test -t "every leisure code has a book"`
- "`meals` is read through a structural guard from the `Json` column; malformed stored data
  raises a wrapped application error, never a cast and never `any`." — verify: code read of
  `prisma-meal-plan-repository.ts` `parseMeals` (no unit test seeds corrupt JSON).
- "A dev server with a stale cached container cannot serve the new keys: `CONTAINER_VERSION`
  is `3`." — verify: `grep -q "CONTAINER_VERSION = 3" src/server/container.ts`

## Explicit edge cases

| Case | Expected | verify |
|---|---|---|
| `age` 9 or 101 | zod rejects with a Persian message on path `age` | `pnpm test -t "physical field bounds"` |
| `heightCm` 99 or 251 | rejected on `heightCm` | `pnpm test -t "physical field bounds"` |
| `weightKg` 29 or 301 | rejected on `weightKg` | `pnpm test -t "physical field bounds"` |
| boundary `10/100/30` and `100/250/300` | accepted | `pnpm test -t "physical field bounds"` |
| enum outside its tuple | rejected on that field's path | `pnpm test -t "physical field bounds"` |
| computed target below 1200 | clamped to exactly 1200 | `pnpm test -t "energy floor"` |
| five of six physical fields set | overview `energy: null`, save → `profile_incomplete`, 0 writes | `pnpm test -t "profile incomplete"` |
| same day saved twice | 1 row, second target wins | `pnpm test -t "meal plan upsert"` |
| next day saved | second row with its own `dayKey` | `pnpm test -t "meal plan upsert"` |
| student deleted | meal plans cascade to 0 | `pnpm test -t "meal plan unique per day"` |
| first profile read | all six columns `null` | `pnpm test -t "physical profile columns"` |
| counselor reads a stranger | `forbidden` (403) | `pnpm test -t "physical profile ownership"` |
| no study and no homework | `low_activity`, at least 2 actions | `pnpm test -t "leisure zero input"` |
| break/waste rows in the window | excluded from both minute sums | `pnpm test -t "leisure uses study minutes"` |
| logged-out `/nutrition` or `/leisure` | redirect to `/login`, no feature markup | `E2E_ENABLED=true pnpm test:e2e tests/e2e/advising-nutrition-leisure.spec.ts` |
| student completes the form and saves | BMR/TDEE visible, 4-slot plan visible and persists after reload | `E2E_ENABLED=true pnpm test:e2e tests/e2e/advising-nutrition-leisure.spec.ts` |
