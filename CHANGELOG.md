# Changelog

## 2026-11-26 — rag-module-consolidation

### Changed
- `persian-tokenizer` (`persianPreprocess`) moved from `src/modules/rag/application/` to `src/modules/rag/domain/`, test included, via `git mv`. It is pure, dependency-free and parity-critical (oracle-matched letter mappings), so `domain` is its home and `infrastructure` may import it without a reverse layer edge. `hybrid-retriever.ts` now imports `@/modules/rag/domain/persian-tokenizer`.
- `test/architecture.test.ts`: `FORBIDDEN.infrastructure` gains `"application"`, so any infrastructure→application import fails `pnpm test` in every module (today the repo has zero such edges).
- `test/architecture.test.ts`: `resolveInternal(specifier, fromPath)` resolves relative specifiers to project-relative paths (a same-directory relative import still returns `null`), closing a test-tooling gap that let the layer rules be evaded by `../application/x`. One in-test block asserts the cross-layer, same-directory and `@/` branches.
- `.opencode/skills/mr-dan-ingestion/SKILL.md`: loader-home line corrected from `infrastructure/document-loaders/` to the actual `application/document-loaders.ts`.

### Docs
- `README.md`: no change — its structure section already describes `modules/<domain>/{domain,application,infrastructure,presentation}` (target == current).
- No behavior doc: structural refactor, no user-facing behavior change.
- No behavior, threshold, dependency or schema change; `src/shared/env.ts` and `src/server/container.ts` are byte-identical to HEAD.

### Known limitations
- The architecture scanner resolves paths textually: it does not follow re-exports, and only `@/` and `./`/`../` specifiers are checked.
- `document-loaders.ts`, `text-splitter.ts` and `text-normalizer.ts` deliberately stay in `application/` (stdlib-pure, consumed by the use case); moving them to `infrastructure/` would force `application → infrastructure` imports.

### Evidence
- `pnpm typecheck` 0 · `pnpm lint` 0 (5 pre-existing warnings, 0 new) · `pnpm test` 0 (60 files / 382 tests) · `pnpm build` 0 · `pnpm test --run test/architecture.test.ts -t "external"` 0 · `-t "layer direction"` 0 · `-t "relative"` 0 · `git diff --exit-code -- src/shared/env.ts src/server/container.ts` 0 · AC-3 file/grep check 0 · `secret-audit` no findings.
- Paths: plan `.opencode/plans/rag-module-consolidation.md`, review `.opencode/reviews/rag-module-consolidation.md`, test log `.opencode/reviews/rag-module-consolidation.tests.log`. No behavior doc (structural refactor).

## 2026-11-23 — phase-5-3-nutrition-leisure

### Added
- `MealPlan` model plus six nullable physical columns on `User` (`age`, `gender`, `heightCm`, `weightKg`, `activityLevel`, `dietGoal`) in one additive migration `20261123123032_add_advising_nutrition_leisure`.
- `/nutrition`: the six-field physical-profile form, BMR/TDEE from Mifflin-St Jeor (five activity multipliers, diet goals `0.85`/`1.0`/`1.1`, a 1200 kcal floor), and a one-row-per-day meal plan split `25/35/30/remainder` that sums exactly to the target.
- `/leisure`: five ordered leisure rules (critical fatigue, heavy workload, overloaded week, balanced week, low activity) measured from study rows and pending homework, plus a deterministic pick from a typed in-domain book catalog.
- The `nutrition:read`, `nutrition:write` and `leisure:read` capabilities on student/counselor/admin; `CONTAINER_VERSION` bumped to `3` so a cached dev-server container cannot serve the old shape.

### Fixed
- The physical-profile form called `form.resetFields()` on success, which blanked the six saved values under the success banner: rc-field-form applies `initialValues` only at mount, so the refreshed profile prop could not re-seed the store. Removed; an e2e assertion now proves the saved values survive the save.

### Removed
- The exam/quiz sub-area (`Question`, `QuizAttempt`, konkoor grading, `/exam`) was dropped from this phase and from the roadmap at the user's request before implementation started; `docs/plan/phases.md` §۵.۳ no longer lists it.

### Docs
- `README.md`: new `## تغذیه و اوقات فراغت` section (both routes, the six fields on `/nutrition` rather than `/profile`, the energy formula and multipliers, the 1200 floor, the meal split, the five leisure branches, the fixed book catalog), plus rows in `## صفحات`, `## دسترسی و نقش‌ها`, `## محدودیت‌ها`, `## وضعیت`.
- `docs/behaviors/phase-5-3-nutrition-leisure.md` and `docs/contracts/phase-5-3-nutrition-leisure.md` created (`review_level: full`); `docs/behaviors/access-control-baseline.md` gained the three capabilities and two routes; `docs/behaviors/phase-5-2-schedule-homework-study.md` refreshed for the files this phase changed; `docs/plan/phases.md` §۵.۳ ticked and linked to the plan.

### Known limitations
- A meal plan is generated and saved per day, not hand-edited; only today's plan is shown and there is no plan history.
- Calorie figures are estimates and not medical advice.
- The book catalog is fixed in code; there is no per-user book history and no search.
- Physical fields live on `/nutrition` only, not on `/profile`.
- No question bank or exam UI: the exam area is out of scope, not a pending gap.

### Evidence
- `pnpm typecheck` 0 · `pnpm lint` 0 (2 pre-existing `no-control-regex` warnings in `src/modules/rag/application/text-normalizer.ts`) · `pnpm test` 0 (47 files / 233 tests) · `pnpm test --run test/architecture.test.ts` 0 (9/9) · `pnpm build` 0 (emits `/nutrition` and `/leisure`) · `pnpm exec prisma migrate status` 0 · `pnpm exec prisma validate` 0 · `git status --porcelain package.json pnpm-lock.yaml` empty · `E2E_ENABLED=true pnpm test:e2e tests/e2e/advising-nutrition-leisure.spec.ts` 0 (3 executed, 0 skipped, 0 failed).
- Review: final PASS, `C0 H0 M0 L1` (one LOW deferred). Paths: plan `.opencode/plans/phase-5-3-nutrition-leisure.md`, review `.opencode/reviews/phase-5-3-nutrition-leisure.md`, test log `.opencode/reviews/phase-5-3-nutrition-leisure.tests.log`, contract `docs/contracts/phase-5-3-nutrition-leisure.md`, behavior doc `docs/behaviors/phase-5-3-nutrition-leisure.md`.

## 2026-11-23 — phase-5-2-schedule-homework-study

### Added
- Three advising areas with their own route triads under `src/app/(advising)/`: `/schedule` (weekly schedule), `/homework` (homework board), `/study` (Pomodoro timer + time analysis); three `"use server"` action files alongside them.
- Data layer: `WeeklySchedule`, `Homework`, `StudySession` models in `prisma/schema.prisma` with a single migration `20261123080240_add_advising_schedule_homework_study`; `@@unique([studentId, dayOfWeek, startMinute])` plus three indexes; `ON DELETE CASCADE`; `subject` stores a catalog slug.
- Domain: `src/modules/advising/domain/subjects.ts` — a static, dependency-free catalog of 28 subjects in 5 groups (9 عمومی + 6 ریاضی فیزیک + 1 علوم تجربی + 8 علوم انسانی + 4 فنی حرفه‌ای) with Persian labels and `subjectsForField()`; `domain/schedule.ts` (`clockToMinutes`, `minutesToClock`, half-open `overlaps`); `ScheduleConflictError` (409); six capabilities (`schedule|homework|study` × `read|write`) on student/counselor/admin.
- Application: `application/planning-access.ts` (capability AND row ownership; a counselor writes only their own rows and gets 403 on any other row including their own students'), then `application/schedule.ts`, `homework.ts`, `study.ts`, `study-metrics.ts`.
- Infrastructure: three Prisma repositories under `src/modules/advising/infrastructure/`; `P2002` → `ScheduleConflictError` and `P2025` → `NotFoundError`, both keeping `cause`.
- Presentation: three Zod schema modules (`schedule-schemas.ts`, `homework-schemas.ts`, `study-schemas.ts`), `presentation/pomodoro-timer.ts` (pure reducer, display derived from `endsAt` so a backgrounded tab cannot drift), `presentation/planning-format.ts`, and a `schedule_conflict` message.

### Fixed
- `getContainer()` cached the composition root on `globalThis` with no invalidation, so a dev server that started before `container.ts` gained keys kept the old shape and every new page threw `Cannot read properties of undefined (reading 'execute')`. Now guarded by `CONTAINER_VERSION` (`src/server/container.ts`).
- The schedule and homework create forms never called `router.refresh()` after a successful `useActionState` result, so the success banner appeared while the server-rendered list stayed empty until a manual reload.
- Both forms kept their values after success, so a second click re-submitted the same payload — a duplicate homework row on the homework page (no unique constraint there). Now `form.resetFields()` on success.
- `src/app/(advising)/schedule/_components/schedule-controls.view.tsx` carried a Cyrillic word inside user-facing Persian copy (`програма`) and its icon-only delete button had no accessible name; both fixed.
- The gated e2e spec `tests/e2e/advising-planning.spec.ts` had never been executed and did not work: antd 6 virtualizes `Select` options so `getByRole("option")` could not see them, the study form only exists in the timer's `review` phase, and the two cases collided on the same `Date.now()` username. All three fixed; the spec now runs.

### Docs
- `README.md`: new `## برنامه هفتگی، تکالیف و تایمر مطالعه` section (three pages, Pomodoro semantics, `productivityRate` with a zero denominator returning 0, fixed UTC+03:30 day boundary, calendar-day deadlines, the 28-subject catalog), plus rows in `## دسترسی و نقش‌ها`, `## محدودیت‌ها`, `## ساختار کد`, `## وضعیت`.
- `docs/behaviors/phase-5-2-schedule-homework-study.md` and `docs/contracts/phase-5-2-schedule-homework-study.md` created (`review_level: full`); `docs/behaviors/access-control-baseline.md` and `docs/behaviors/phase-5-1-identity-profile.md` re-verified; `docs/plan/phases.md` §۵.۲ ticked; two stale `src/server/*-actions.ts` lines in `docs/plan/frontend-conventions.md` corrected.

### Known limitations
- Timer state is not persisted and there is no reminder or scheduler: a finished focus interval is saved only on explicit submit, and a reload loses an in-flight interval.
- Deadlines are calendar days at Iran midnight — no due time-of-day, no notification.
- The day boundary is a fixed UTC+03:30 with no per-user timezone.
- No charts until 5.4; a counselor can read a student's rows in the use case but has no UI for it until 5.4.
- `tests/e2e/advising-planning.spec.ts` is gated behind `E2E_ENABLED=true` and is not part of the default gate; the round-3 review capped at 3 rounds, so its two MEDIUM test-quality findings were closed by executed evidence rather than a fourth review.

### Evidence
- `pnpm typecheck` 0 · `pnpm lint` 0 (0 `no-unused-vars`; 2 intentional `no-control-regex` in `src/modules/rag/application/text-normalizer.ts`) · `pnpm test` 0 (40 files / 212 tests, architecture included) · `pnpm build` 0 · `pnpm exec prisma migrate status` 0 · `pnpm exec prisma validate` 0 · `git diff --exit-code package.json pnpm-lock.yaml` 0 (no new dependency) · `mro-doctor --docs` 0 (0 stale behavior docs) · `E2E_ENABLED=true pnpm test:e2e tests/e2e/advising-planning.spec.ts` 0 (3 passed) · all 16 per-criterion `-t` patterns matched at least one test.
- Review: 3 rounds, final PASS — round 1 `C0 H1 M1 L1`, round 2 `0/0/0/0`, round 3 `C0 H0 M2 L3` (all closed). Paths: plan `.opencode/plans/phase-5-2-schedule-homework-study.md`, review `.opencode/reviews/phase-5-2-schedule-homework-study.md`, contract `docs/contracts/phase-5-2-schedule-homework-study.md`, behavior doc `docs/behaviors/phase-5-2-schedule-homework-study.md`.

## 2026-11-23 — frontend-layout-alignment

### Changed
- Every route page now has a colocated triad under `src/app/**` (`page.tsx` + `<x>.vm.tsx` + `<x>.view.tsx`); route-private components in `src/app/(advising)/counselor/students/_components/`; `src/components/` reduced to `providers.tsx` (the three unreferenced `ui/` stubs were deleted in the same change).
- Server actions split per area into three `"use server"` files — `src/app/(auth)/auth.actions.ts`, `src/app/(advising)/advising.actions.ts`, `src/app/(advising)/counselor/students/students.actions.ts`; `src/server/advising-actions.ts` deleted.
- Choke points moved to `src/utils/app-error.ts`, `src/utils/server-action.ts`, `src/utils/use-form-action.ts`; `ActionResult` renamed `ActionState`; `src/shared/action-result.ts`, `src/lib/form/`, `src/modules/advising/presentation/run-action.{ts,test.ts}` removed.
- `test/architecture.test.ts` — the 80-line client-component assertion now covers `src/app/**` as well; two assertions added (page triad with an exact count of 7; every page ≤40 lines). A negative probe (an 81-line `"use client"` file in `src/app/chat/`) was proven to fail the suite naming that file.

### Docs
- `AGENTS.md` `## معماری` (two bullets); the three skills (`mr-dan-architecture`, `mr-dan-frontend`, `mr-dan-feature-workflow`) describe the new layout; `docs/contracts/frontend-layout-alignment.md` created; README `## ساختار کد` added; `docs/plan/{architecture,frontend-conventions}.md` and `docs/behaviors/phase-5-1-identity-profile.md` updated.

### Known limitations
- AC-18 deferred — the e2e spec asserts `/register` navigation and profile persistence but not a field-level Persian validation message; verified manually only. Unused imports introduced by the move (46 warnings) were removed in a follow-up commit.

### Evidence
- `pnpm typecheck` 0 · `pnpm lint` 0 (0 unused vars) · `pnpm build` 0 · `pnpm test` 0 (28 files / 152 tests) · `pnpm vitest run test/architecture.test.ts` 0 (9 tests) · `E2E_ENABLED=true pnpm exec playwright test tests/e2e/advising-auth.spec.ts` 0 (2 passed). Paths: plan `.opencode/plans/frontend-layout-alignment.md`, review `.opencode/reviews/frontend-layout-alignment.md`, contract `docs/contracts/frontend-layout-alignment.md`.

## 2026-11-23 — access-control-baseline

### Added
- `admin` role; `toRole()` moved to the domain and round-trips `"admin"` (previously anything that was not `"counselor"` became `"student"`); `CAPABILITIES.admin` = the counselor set plus `rag:manage` and `user:manage`.
- `requireApiSession()` / `requireApiCapability()` guards; 9 data routes are session-gated and 6 admin routes are gated (`/api/admin/**` ×5 plus `/api/openapi`).
- `/chat`, `/admin/knowledge` and `/api-docs` require a session; `GET /api/health` and `GET /api/metrics` stay public.
- `scripts/create-admin.ts` — admins are system-created only, it refuses to run with `NODE_ENV=production`, it is idempotent and never rewrites an existing password hash, and it prints the generated password once. Registration can never mint an admin. No admin UI.

### Fixed
- `src/app/api/upload/route.ts` wrote the uploaded file to disk before the auth guard ran; the guard is now the first statement in the handler.

### Docs
- `docs/behaviors/access-control-baseline.md`, `docs/contracts/access-control-baseline.md`, README `## دسترسی و نقشها`, OpenAPI `cookieAuth` scheme, `docs/plan/architecture.md` §2.1.

### Known limitations
- Three e2e cases (counselor → 403, admin → 200, student → `/profile`) are `test.fixme` because there is no dev-seeded session helper; they are covered by static + unit evidence instead. Live knowledge-flow e2e is deferred (`OPENROUTER_API_KEY`).

### Evidence
- `pnpm typecheck` 0 · `pnpm lint` 0 · `pnpm build` 0 · `pnpm test` 0 (28 files / 150 tests at the time) · `architecture.test.ts` 0 (7 tests) · `E2E_ENABLED=true pnpm exec playwright test tests/e2e/access-control.spec.ts tests/e2e/advising-auth.spec.ts` 0 (5 passed, 3 fixme) · `secret-audit` clean. Paths: plan `.opencode/plans/access-control-baseline.md`, review `.opencode/reviews/access-control-baseline.md`, behavior doc `docs/behaviors/access-control-baseline.md`.

## 2026-11-23 — architecture-alignment

### Changed
- Seven client components split into `*.vm.tsx` (state/hooks) + `*.view.tsx` (markup): `knowledge-page`, `chat-page`, `profile-form`, `register-form`, `assign-student-form`, `counselor-roster`, `group-create-form`. All four forms were rewritten from native `useActionState`/`<form action>` to the antd `Form` + `useFormAction`/`useServerFormErrors` bridge; behavior preserved, e2e green.
- Test fake `src/test/health-probe.ts` → `test/fakes/health-probe.ts`; `src/test/` removed.
- Two assertions added to `test/architecture.test.ts`: (a) a `"use client"` component over 80 lines must have a `.vm.tsx` + `.view.tsx` pair; (b) test doubles live under `test/fakes/` (non-vacuous, positive match).

### Fixed
- The test-doubles assertion originally walked only `src/` (vacuous) and used a backwards `toBeGreaterThan(0)`; both corrected.

### Docs
- `docs/plan/architecture.md` §9 (D3/D4/D5), `docs/contracts/architecture-alignment.md` created, `docs/behaviors/phase-5-1-identity-profile.md` `source_files`, one README line under `## وضعیت`.

### Known limitations
- Deferred: AC-10 (`/admin/knowledge` manual) and AC-11 (`/chat` streaming manual) need `OPENROUTER_API_KEY`.

### Evidence
- `pnpm typecheck` exit 0 · `pnpm lint` exit 0 · `pnpm build` exit 0 · `pnpm test` exit 0 (25 files / 135 tests) · `E2E_ENABLED=true pnpm exec playwright test tests/e2e/advising-auth.spec.ts` exit 0 (2 passed, 0 skipped).

### Paths
- plan `.opencode/plans/architecture-alignment.md` · review `.opencode/reviews/architecture-alignment.md` · behavior doc `docs/behaviors/phase-5-1-identity-profile.md`.
