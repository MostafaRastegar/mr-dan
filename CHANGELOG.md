# Changelog

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
