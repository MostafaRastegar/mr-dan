# Review: rag-module-consolidation

Round: 2 | Diff scope: round 1 — `src/modules/rag/domain/persian-tokenizer.ts` (renamed from `application/`), `src/modules/rag/domain/persian-tokenizer.test.ts` (renamed from `application/`), `src/modules/rag/infrastructure/hybrid-retriever.ts`, `test/architecture.test.ts`, `.opencode/skills/mr-dan-ingestion/SKILL.md`; round 2 delta — `test/architecture.test.ts` only (`resolveInternal` relative resolution + pinning test). See `## Round 2` below for the round-2 verdict.

## Verdict

PASS

## Skills loaded

`mro-code-review-checklist` (review driver), `mr-dan-architecture`, `mr-dan-rag`, `mr-dan-ingestion`, `mro-project-stack`, `mr-dan-testing-parity`.

## Gate check

Plan sets `review_level: minimal` (plan line 91). No "Stage UI (mock)" stage exists; change is a no-behavior refactor, so the manual smoke gate and UI gate do not apply. Orchestrator state records `approvals.manual_smoke: null` and `review_level` "awaiting human confirmation" — noted as LOW-2 for the Orchestrator to close at final approval; it does not trigger either gate under the two-gate rule.

## Checklist

| # | Item | Verdict | Evidence |
|---|------|---------|----------|
| 1 | Correctness | PASS | All 6 ACs re-verified by me (see below). Renames are pure moves (git `-M`, 0 insertions/deletions); tokenizer content unchanged → BM25 parity preserved per `mr-dan-rag` ("any change here alters parity" — none occurred). |
| 2 | Acceptance evidence | PASS | Every `[x]` in the plan carries a verify command + result + date (2026-11-26); AC-1/AC-2/AC-4 independently re-run by this review, exit 0. |
| 3 | Security | PASS | `secret-audit`: clean. No new inputs, no injection surface — the diff is 1 import path + 1 test rule + 1 doc line + 2 pure renames. |
| 4 | Type safety | PASS | Diff introduces no types, casts, or suppressions. `pnpm typecheck` exit 0 (plan evidence; orchestrator `test_exit_codes` all 0). |
| 5 | Test coverage | PASS | Architecture test rule added at `test/architecture.test.ts:54` covers the new invariant; tokenizer test moved intact (colocated convention); contract says "no new test file expected" and none is needed — no behavior changed. |
| 6 | Project rules (AGENTS.md) | PASS | Domain purity matches `mr-dan-architecture` layer map ("domain: TS stdlib only"); `env.ts`/`container.ts` byte-identical (AC-4, exit 0); no new dependency; skill edit satisfies the AGENTS.md skill-sync rule; skill text in English. |
| 7 | Documentation (README) | PASS (N/A for content) | No user-facing behavior/config/env/command/deps changed → no README change required; grep confirms zero `persian-tokenizer` references in README.md. Orchestrator `readme.state: unchanged` is correct. |
| 8 | Behavior doc freshness | N/A | No `docs/behaviors/` doc covers RAG internals; grep confirms no behavior doc references `persian-tokenizer` — nothing went stale, and observable behavior is unchanged by contract. |
| 9 | Skills applied | PASS | Implementer updated `mr-dan-ingestion` SKILL.md (AC-6) and kept `mr-dan-architecture`/`mr-dan-rag` claims consistent; verified loaders really live in `src/modules/rag/application/document-loaders.ts`. |
| 10 | Do-NOT-check items | N/A | No syntax/style/type findings flagged; owned by oxlint/tsc. |

## Acceptance evidence

| Criterion | Verify command | Evidence present? | Verdict |
|-----------|----------------|-------------------|---------|
| AC-1 | `pnpm test --run test/architecture.test.ts -t "external"` | Yes (plan) + re-run by reviewer: exit 0, 1 passed / 8 skipped | PASS |
| AC-2 | `pnpm test --run test/architecture.test.ts -t "layer direction"` | Yes (plan) + re-run by reviewer: exit 0, 1 passed / 8 skipped | PASS |
| AC-3 | `test -f … && ! test -f … && ! grep -rn "application/persian-tokenizer" src` | Yes (plan, exit 0) + reviewer grep of src/ and test/: no matches | PASS |
| AC-4 | `git diff --exit-code -- src/shared/env.ts src/server/container.ts` | Yes (plan) + re-run by reviewer: exit 0 | PASS |
| AC-5 | `pnpm typecheck && pnpm lint && pnpm test && pnpm build` | Yes: plan records exit 0 ×4 (60 files / 381 tests; 5 pre-existing lint warnings); orchestrator `test_exit_codes` all 0. Not re-run by reviewer (per contract-first rule; Orchestrator owns re-verification). | PASS |
| AC-6 | manual: grep `document-loaders` in ingestion SKILL.md | Yes: line 70 corrected to `application/document-loaders.ts`; target file exists in repo | PASS |

## Findings

### CRITICAL

None.

### HIGH

None.

### MEDIUM

- `test/architecture.test.ts:43-48` — `resolveInternal()` returns `null` for every relative specifier, so the new `FORBIDDEN.infrastructure = ["application", …]` rule (and all layer rules) only see `@/`-aliased imports. An infrastructure file importing `../application/x` relatively would evade AC-2's guarantee. Pre-existing limitation (this diff changed only line 54); zero current exposure — the only relative imports in `src/modules/*/infrastructure/` are same-layer colocated-test imports (`cache.test.ts:2`, `llm-reranker.test.ts:2`), and the `application/homework-plan.test.ts:3` → `test/fakes` relative import is legitimate. Smallest fix (follow-up, not a fix-round blocker): resolve relative specifiers against the importing file's directory in `resolveInternal`, excluding same-directory imports. Recorded so the next architecture-touching change picks it up.

### LOW

- `.opencode/reviews/rag-module-consolidation.tests.log` — referenced by the handoff but does not exist; AC-5 evidence lives in the plan's evidence fields and orchestrator `test_exit_codes` instead. Fix: have the Orchestrator write the full-gate output to that path during verify, or drop the path from the handoff.
- Orchestrator state (`review_level`, `approvals.manual_smoke: null`) — plan-declared `minimal` is still "awaiting human confirmation". Fix: human countersigns review level at `approvals.final`. Gate not triggered (plan sets minimal; no UI stage; no behavior change).
- Informational: stale references to `application/persian-tokenizer` remain only in git-ignored `.next/dev/` Turbopack cache chunks — regenerated on the next `pnpm dev`/`pnpm build`; no action.

## Deferrals

None.

## Verifier notes (independence)

Commands re-run by this review, all read-only: `git status --short` (only the two staged renames + out-of-scope `.opencode` dirty files, per handoff), `git diff HEAD -M --stat` (15+/5− across 6 modified files, 2 pure renames), AC-1 filter (exit 0), AC-2 filter (exit 0), AC-4 `git diff --exit-code` (exit 0), old-path grep over `src/` and `test/` (no matches), repo-wide old-path grep (only `.next/dev` cache), `grep -rn "modules/(rag|advising)/application" src/modules/*/infrastructure/` (no matches — zero infra→application edges today), tokenizer import scan (zero imports — valid domain resident), moved test import (`./persian-tokenizer` — resolves at new path), `secret-audit` (clean). Reverse edge (application→infrastructure) is covered by the pre-existing `FORBIDDEN.application` entry at `test/architecture.test.ts:52`; no false-positive path exists for test fakes since they live under unscanned `test/fakes/`.

---

## Round 2

Delta reviewed: `test/architecture.test.ts` only — `resolveInternal(specifier, fromPath)` now resolves relative imports via `normalize(join(dirname(fromPath), specifier))`, exempts same-directory imports, leaves the `@/` branch untouched, and the layer-direction call site passes `file.path`; new pinning test `resolves relative imports for layer rules` (cross-layer relative → resolved + `layerOf` = application; `./cache` → null; `@/shared/env` → `shared/env`). Round-1 content above is unchanged and remains in force.

### Verdict

PASS

### AC-7 evidence

| Criterion | Verify command | Evidence present? | Verdict |
|-----------|----------------|-------------------|---------|
| AC-7 | `pnpm test --run test/architecture.test.ts -t "relative"` | Yes (plan line 221, `[x]`, exit 0, dated 2026-11-26) + re-run by reviewer: exit 0, 1 passed / 9 skipped (suite now 10 tests) | PASS |

AC-1/AC-2 filters re-run in round 2: both exit 0. Full `pnpm test`: exit 0 (reviewer-run). AC-3 re-check: exit 0. AC-4 re-check: exit 0. `secret-audit`: clean.

### Round-1 files unchanged — confirmed

`git status --short` and `git diff HEAD -M --stat` show exactly the round-1 shape outside `test/architecture.test.ts`: renames still pure (0 content change), `hybrid-retriever.ts` and `SKILL.md` still exactly one changed line each (4 content-diff lines total across both). The only round-2 delta is `test/architecture.test.ts` (2 → 22 changed lines). New untracked plan files (`roles-and-access`, `admin-panel-catalog`) are out-of-scope dirt per handoff.

### False-positive / false-negative analysis (caller-mandated)

- **Resolving ALL relative imports — false positives?** None, verified two ways. Empirically: full suite green. Structurally: enumerated every non-test relative import in `src/` — all resolve same-layer (domain→`./models` etc.) or in already-permitted directions (`application→../domain`, `presentation→../domain`, `presentation/cookie.ts:8 → ../application/session`, which is allowed for presentation). The `advising/application/homework-plan.test.ts:3 → ../../../../test/fakes/planning` import normalizes to `../../test/fakes/planning` (Node retains excess `..`) → `layerOf` = "other" → not banned for any layer. `src/generated/` is skipped by `walk()`; the `app/_components → ../students.actions` resolutions land in "ui", which has no `FORBIDDEN` key.
- **Does the same-directory exemption hide a real violation?** No. `layerOf` is purely directory-prefix-based, so two files in the same directory always share the same layer prefix — the exemption is incapable of hiding a cross-layer edge. The caller's `./application` sibling example cannot occur: a sibling `application/` dir inside e.g. `modules/rag/infrastructure/` layers as infrastructure (the regex matches the first `modules/<mod>/<layer>/` prefix), so it is not an application-layer file.
- **Extension edge:** `../application/x.js` resolves to `modules/rag/application/x.js`; the `layerOf` regex matches on the directory prefix, so the extension is irrelevant — maps to `application` correctly.
- **Resolution target existence:** `layerOf` runs on paths regardless of existence; harmless because TS compilation guarantees real imports resolve, and a nonexistent target cannot produce a false positive without a real import statement.

### Round-1 findings status

- Round-1 MEDIUM (relative imports never resolved, `test/architecture.test.ts:43-48`) — **CLOSED**. Cross-layer relative imports now reach `layerOf` and are flagged via `FORBIDDEN.infrastructure`; same-directory imports stay exempt; the pinning test locks the exact scenario from the finding (`../application/x` from an infrastructure file).
- Round-1 LOW-1 (tests.log absent) — still open: `.opencode/reviews/rag-module-consolidation.tests.log` does not exist; AC-5 evidence remains in the plan + orchestrator `test_exit_codes`.
- Round-1 LOW-2 (review_level awaiting human countersign) — still open: state file unchanged (`"minimal (architect recommendation; awaiting human confirmation)"`, `manual_smoke: null`). Orchestrator to close at `approvals.final`.

### New findings (round 2)

### LOW

- `test/architecture.test.ts:20` — `IMPORT_RE` matches only `from "…"` and `import(…)`, not side-effect imports (`import "./x";`), which therefore escape all layer rules including the new one. Pre-existing (regex untouched by this delta); zero current exposure — the only side-effect import in `src/` is `app/layout.tsx:4` (`./globals.css`, not a TS module, same layer). Smallest fix if ever needed: extend the regex to also match `import\s*"([^"]+)"`. Not a fix-round blocker.

### Severity counts (round 2)

CRITICAL 0 · HIGH 0 · MEDIUM 0 · LOW 1 (new; plus two carried round-1 LOWs, listed above).

### Verdict summary

Round-1 MEDIUM closed; all 7 ACs pass with evidence; round-1 files untouched; no CRITICAL/HIGH remain. **PASS — no fix round needed.**
