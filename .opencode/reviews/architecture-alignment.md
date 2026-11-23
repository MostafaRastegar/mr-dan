# Review — architecture-alignment — round 1

Verdict: APPROVE WITH FINDINGS

## Checklist

| # | Item | Verdict | Evidence |
|---|------|---------|----------|
| 1 | Behavior preservation: `data-testid`, Persian label, `dir="ltr"`, `aria-*`, `role`, `required`, `htmlType`, `autoComplete`, default value byte-identical to HEAD | PARTIAL | `knowledge-page`/`chat-page` clean moves; forms rewritten to antd `Form`+`useFormAction` bridge (see HIGH) |
| 2 | Hook placement: no `useState/useEffect/useRef/useReducer/useFormAction/useServerFormErrors/Form.useForm/Form.useWatch` in `.view.tsx` | PASS | all hooks live in `.vm` |
| 3 | `initialValues` stability | LOW | `profile-form.vm.tsx:20-26` recreates per render (antd v5 no auto-reset; smell only); `register-form.vm.tsx:19` uses module-level constant |
| 4 | Unused imports in touched vm/view files | MEDIUM | lint exit 0, 42 warnings in new files (e.g. `knowledge-page.vm.tsx` imports Button/Card/… only `notification` used) |
| 5 | New architecture assertions non-vacuous | PASS (after fix) | removed `expect(largeClient.length).toBeGreaterThan(0)`; test-doubles assertion now requires positives under `test/fakes/` |
| 6 | Docs accuracy | PASS | README `## وضعیت` line present; behavior doc `last_verified: 2026-11-23`; minor prose inaccuracy line 72 names deleted `register-form.tsx` |
| 7 | `test/fakes/health-probe.ts` byte-identical to HEAD `src/test/health-probe.ts` | PASS | rename with 0 changes |
| 8 | AC-3/AC-4/AC-5 file existence | PASS | all split files exist; originals gone |
| 9 | Pages import `.vm` entry points | PASS | knowledge/chat/profile/register/counselor-students pages all import `*.vm` |
| 10 | Contract file exists | PASS | `docs/contracts/architecture-alignment.md` updated with 3 new components |

Counts: CRITICAL 0 (fixed) · HIGH 1 · MEDIUM 1 · LOW 1

## Acceptance evidence

| AC | Verdict | Evidence |
|----|---------|----------|
| AC-1 | [x] confirmed | `pnpm vitest run test/architecture.test.ts` exit 0 |
| AC-2 | [x] confirmed | same run, exit 0 |
| AC-3 | [x] confirmed | `knowledge-page.vm.tsx` + `.view.tsx` exist, old gone |
| AC-4 | [x] confirmed | `chat-page.vm.tsx` + `.view.tsx` exist, old gone |
| AC-5 | [x] confirmed | `profile-form` + `register-form` pairs exist, both originals gone |
| AC-6 | [x] confirmed | same run, exit 0 |
| AC-7 | [x] confirmed | `src/test/` gone, `test/fakes/health-probe.ts` exists |
| AC-8 | [x] confirmed | `pnpm vitest run src/modules/rag/domain/ports.test.ts` exit 0 |
| AC-9 | [x] confirmed | `E2E_ENABLED=true … advising-auth.spec.ts` → 2 passed, 0 skipped |
| AC-10 | [~] deferred | manual `/admin/knowledge` check needs OPENROUTER_API_KEY |
| AC-11 | [~] deferred | manual `/chat` streaming check needs OPENROUTER_API_KEY |
| AC-12 | [x] confirmed | behavior doc `source_files` names `.vm/.view`, no deleted files |
| AC-13 | [x] confirmed | typecheck 0, lint 0, build 0, `pnpm test` → 135 passed (≥133) |
| AC-14 | [x] confirmed | `docs/plan/architecture.md` §9 records D3/D4/D5 |

## Behavior-preservation table

| Component | testids | strings | hooks only in vm | notes |
|-----------|---------|---------|------------------|-------|
| knowledge-page | ✓ | ✓ | ✓ | clean move |
| chat-page | ✓ | ✓ | ✓ | clean move |
| register-form | ~ | ~ | ✓ | rewritten to antd `Form` |
| profile-form | ~ | ~ | ✓ | rewritten; `initialValues` per-render |
| counselor-roster | ~ | ~ | ✓ | rewritten |
| assign-student-form | ~ | ~ | ✓ | rewritten |
| group-create-form | ~ | ~ | ✓ | rewritten |

## Findings

| # | Severity | File:line | Finding | Fix |
|---|----------|-----------|---------|-----|
| 1 | CRITICAL (fixed) | `test/architecture.test.ts:148-151` | "test doubles live under test/" walked only `src/` → always passed on empty match set (vacuous) | Rewrote to require fakes under `test/fakes/`, no `src/test/`, no doubles outside `fakes/` (6 tests pass) |
| 2 | CRITICAL (fixed) | `test/architecture.test.ts:136` | `expect(largeClient.length).toBeGreaterThan(0)` required a large client file to exist (semantically backwards) | Removed; `violations` check is the real assertion |
| 3 | HIGH | `src/components/auth/register-form.view.tsx`, `profile-form.view.tsx`, `counselor-roster.vm.tsx`, sub-forms | Not pure code-moves: rewritten from native `useActionState`/`<form action>` to antd `Form`+`useFormAction` bridge; drift in controlled vs `defaultValue`, added `data-testid`s, antd `required` rules, role via `Form.useWatch` | Document in `docs/contracts/architecture-alignment.md` that forms were rewritten, not pure moves |
| 4 | MEDIUM | new `*.vm.tsx` files | Unused antd imports (lint exit 0, 42 warnings in new files; e.g. `knowledge-page.vm.tsx` imports Button/Card/Col/Divider/Input/List/Row/Table/Space, only `notification` used) | Move unused imports to views or remove |
| 5 | LOW | `profile-form.vm.tsx:20-26` | `initialValues` recreated every render | Smell only; consider `useMemo` |

## Deferrals
- AC-10 `/admin/knowledge`: manual, needs `OPENROUTER_API_KEY` (not available; not silently ticked)
- AC-11 `/chat` streaming: manual, needs `OPENROUTER_API_KEY`
