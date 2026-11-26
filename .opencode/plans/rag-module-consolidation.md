# Plan: RAG Module Consolidation

## Goal

Make `src/modules/rag/` the provably single home of RAG code. Map the current footprint,
fix the one real boundary defect found, and lock the boundary with an architecture-test
rule. **No behavior change, no threshold change, no dependency, no schema change.**

## Current footprint (mapped 2026-11-26, branch `feat/change-structure`)

Verified: `src/modules/rag/**` imports nothing outside the module except `@/shared/*`
and `@/generated/prisma/client` (both allowed by the layer map and the architecture test).

| Location | Contents | Verdict |
|---|---|---|
| `src/modules/rag/{domain,application,infrastructure,presentation}` | models, ports, errors; 10 use cases + loaders/splitter/normalizer/tokenizer; chroma/openrouter/prisma adapters; zod schemas + http helpers | Target home — already correct. One internal defect (see below) |
| `src/app/api/{chat,chat/stream,ingest,search,documents,documents/[id],conversations,conversations/[id],upload,admin/{cache/clear,chunks,chunks/[id],retrieval/debug,stats},health,metrics,openapi}` | RAG + ops route handlers, 17–39 lines each | **Stays** — HTTP wiring belongs in `app/api/**` per AGENTS.md; `test/architecture.test.ts` hardcodes these paths (gating + thin-route rules) |
| `src/app/chat/`, `src/app/admin/knowledge/` | page triads | **Stays** — presentation pages; triad test hardcodes page counts |
| `src/server/container.ts` | wires rag adapters to ports | **Stays** — only composition root; not touched (does not import any moved file) |
| `src/shared/env.ts` | RAG thresholds (source of truth) | **Stays** — must not change |
| `src/shared/{errors,logger,prisma}.ts` | AppError base, pino, client | **Stays** — cross-module shared |
| `src/shared/metrics.ts` | generic Prometheus registry | **Stays** — consumed by `/api/metrics` + scripts; observability, not RAG domain |
| `src/lib/{api,openapi}.ts` | fetch client, OpenAPI registry | **Stays** — cross-feature |
| `test/architecture.test.ts`, `test/integration.test.ts`, `test/fakes/health-probe.ts` | enforcement, live RAG integration, fake | **Stays** (one rule line added to the first) |
| `scripts/{eval-retrieval,golden-set}.ts` | RAG eval scripts | **Stays** — scripts/ is their home |

**The defect:** `src/modules/rag/infrastructure/hybrid-retriever.ts:23` imports
`@/modules/rag/application/persian-tokenizer` — infrastructure→application is a reverse
layer edge. The architecture test cannot see it (its `resolveInternal` only resolves `@/`
paths and `FORBIDDEN.infrastructure` lacks `application`). It is the *only* such edge in
the repo (verified by grep across `src/modules/*/infrastructure`).

## Target map

Identical to current, except `persian-tokenizer` moves from `application/` to `domain/`
(it is a pure, dependency-free parity rule — exactly what domain is for) and the reverse
edge becomes impossible by test.

## Files

| Op | Path |
|---|---|
| Move | `src/modules/rag/application/persian-tokenizer.ts` → `src/modules/rag/domain/persian-tokenizer.ts` |
| Move | `src/modules/rag/application/persian-tokenizer.test.ts` → `src/modules/rag/domain/persian-tokenizer.test.ts` |
| Modify | `src/modules/rag/infrastructure/hybrid-retriever.ts` — import path → `@/modules/rag/domain/persian-tokenizer` |
| Modify | `test/architecture.test.ts` — `FORBIDDEN.infrastructure` gains `"application"` |
| Modify | `.opencode/skills/mr-dan-ingestion/SKILL.md` — loader home line says `infrastructure/document-loaders/`; code keeps them in `application/document-loaders.ts` (stdlib-only, port-typed). Fix the skill line to match code |
| Delete | none |

Nothing else moves. `document-loaders.ts` / `text-splitter.ts` / `text-normalizer.ts`
stay in `application/`: they are stdlib-pure, consumed by the use case, and moving them
to `infrastructure/` would force `application → infrastructure` imports or port rewiring.
Deliberate; noted as the one drift between skill text and code.

## Key decisions / trade-offs

1. **One move, not a reshuffle.** The RAG module is already consolidated; inventing a new
   layout (e.g. `modules/rag/retrieval/`, `modules/rag/ingestion/`) adds churn with zero
   boundary gain. Rejected.
2. **Tokenizer → domain, not retriever → application.** `persian-tokenizer` is pure TS,
   parity-critical (oracle-matched letter mappings), and needed by infrastructure.
   Moving it to domain fixes the edge in the direction the layer map declares.
3. **Enforce, don't trust.** Add `application` to `FORBIDDEN.infrastructure` so the fixed
   edge (and any future one, in any module) fails `pnpm test`. Safe globally: advising
   infrastructure has zero application imports.
4. **Routes/pages/container/env unmoved.** They are wired into hardcoded path lists in
   `test/architecture.test.ts` (9 session-gated, 6 admin-gated routes; 13 page triads);
   moving them breaks enforcement and buys nothing.

## Contract

- Module entry points (unchanged): `src/server/container.ts` exports `getContainer()` with
  rag keys `healthProbes, ingestDocument, searchKnowledge, askQuestion, listDocuments,
  manageDocuments, conversation, adminChunks, adminStats`; route handlers import
  `@/modules/rag/presentation/{http,schemas}` + `getContainer()` only.
- Ports (unchanged): `src/modules/rag/domain/ports.ts` — `VectorStorePort`,
  `EmbeddingProviderPort`, `LLMPort`, `RetrieverPort`, `RerankPort`, `RAGCachePort`,
  `DocumentRepositoryPort`, `IngestionRunRepositoryPort`, `ConversationRepositoryPort`,
  `MessageRepositoryPort`, `DocumentLoaderPort`, `HealthProbe`.
- Invariant 1: `src/modules/rag/domain` imports no external package and no sibling layer.
  — verify: `pnpm test --run test/architecture.test.ts -t "external"`
- Invariant 2: no module infrastructure file imports any module application file.
  — verify: `pnpm test --run test/architecture.test.ts -t "layer direction"`
- Invariant 3: RAG behavior and thresholds unchanged; `src/shared/env.ts` untouched.
  — verify: `git diff --exit-code src/shared/env.ts && pnpm test --run src/shared/env.test.ts`
- Invariant 4: all route handlers ≤40 lines, container shape/`CONTAINER_VERSION` unchanged.
  — verify: `pnpm test --run test/architecture.test.ts -t "thin" && git diff --exit-code -- src/server/container.ts src/app/api`
- Edge cases: moved file's own test uses `./persian-tokenizer` (relative) → needs no edit;
  `rag/domain/ports.test.ts` keeps its `test/fakes/health-probe` import (tests may import
  fakes); no test imports the old application path (verified by grep), so no dead imports.
- review_level: minimal — moves + import-path edits + one test rule; <50 changed lines, no
  auth/db/new runtime logic. Human confirms at the plan gate.

## Tests

No new test files. Existing proof:
- `test/architecture.test.ts` — extended rule (infra ↛ application) + existing domain-external,
  thin-route, gating, triad rules all re-run on the moved tree.
- `src/modules/rag/application/persian-tokenizer.test.ts` — moves with the file; still runs
  (vitest picks up `*.test.ts` under src).
- `src/shared/env.test.ts` — proves thresholds untouched.
- Full gates: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.

## Documentation impact

- `README.md`: no change — its structure section already describes
  `modules/<domain>/{domain,application,infrastructure,presentation}` (target == current).
- `AGENTS.md`: no change (no threshold, no layout, no command change).
- `docs/behaviors/rag-module-consolidation.md`: **not needed** — structural refactor, no
  user-facing behavior change.
- `.opencode/skills/mr-dan-ingestion/SKILL.md`: one line corrected to match code (loader
  home is `application/document-loaders.ts`). Code wins; per AGENTS.md sync rule skills
  must not drift.
- CHANGELOG (draft, written after approval): `refactor(rag): move persian-tokenizer into rag/domain and ban infrastructure→application imports (no behavior change)`

## Open questions

1. **lite-edition sequencing:** `test/architecture.test.ts` hardcodes page-triad counts
   (13) and gated-route lists. If `feat/lite-edition` (phase=ui-approved) adds pages or
   touches that file, merging this branch first or last changes conflict size. Human to
   sequence; no rag path overlap found on either feature branch.
2. Optional (recommend **no**): split `test/integration.test.ts` into `test/rag/` and
   `test/advising/` groups. Pure churn; deferred unless the human wants it.

## Acceptance Criteria

- [x] AC-1: When the architecture suite runs, `src/modules/rag/domain` has zero external/sibling-layer imports. — verify: `pnpm test --run test/architecture.test.ts -t "external"` — evidence: exit 0, 1 passed | 8 skipped (2026-11-26)
- [x] AC-2: When any infrastructure file imports an application file, the architecture test fails; today the repo has zero such edges. — verify: `pnpm test --run test/architecture.test.ts -t "layer direction"` — evidence: exit 0, 1 passed | 8 skipped; `FORBIDDEN.infrastructure = ["application", "api", "ui"]` (2026-11-26)
- [x] AC-3: When the move lands, `persian-tokenizer` exists under `src/modules/rag/domain/` and no file under `src/` references the old `application/persian-tokenizer` path. — verify: `test -f src/modules/rag/domain/persian-tokenizer.ts && ! test -f src/modules/rag/application/persian-tokenizer.ts && ! grep -rn "application/persian-tokenizer" src --include='*.ts'` — evidence: exit 0 (2026-11-26)
- [x] AC-4: While the refactor lands, `src/shared/env.ts` and `src/server/container.ts` are byte-identical to HEAD. — verify: `git diff --exit-code -- src/shared/env.ts src/server/container.ts` — evidence: exit 0, no diff (2026-11-26)
- [x] AC-5: When the full gate runs, typecheck, lint, tests, and build are green. — verify: `pnpm typecheck && pnpm lint && pnpm test && pnpm build` — evidence: typecheck exit 0; lint exit 0 (5 pre-existing warnings); test exit 0, 60 files / 381 tests; build exit 0 (2026-11-26)
- [x] AC-6: When the ingestion skill is read, its loader-home line matches the code (loaders in `application/document-loaders.ts`). — verify: manual: grep `document-loaders` in `.opencode/skills/mr-dan-ingestion/SKILL.md` shows the corrected path — evidence: line 70 reads ``1. Add the loader in `application/document-loaders.ts` and register it.`` (2026-11-26)

---

## Delta: resolveInternal relative imports (post-review MEDIUM)

Appended 2026-11-26 after review round 1 — the human chose to fix the MEDIUM finding
now instead of deferring. Sections above are unchanged. This delta is **test-tooling
only**: no source module, `env.ts`, `container.ts`, route, README, skill, dependency,
or schema change.

### Cause

`resolveInternal()` (`test/architecture.test.ts:43-48`) maps only `@/`-aliased specifiers
and returns `null` for every relative one, so its consumer `respects layer direction`
(line 93) never sees relative imports: every layer rule — including the new
`FORBIDDEN.infrastructure = ["application", …]` (line 54) — is evadable via
`../application/x`. Specifiers reach the function as raw strings from `collect()`
(`IMPORT_RE` captures the quoted specifier); the importer's project-relative
forward-slashed path (e.g. `modules/rag/infrastructure/hybrid-retriever.ts`) sits on the
same row and is currently unused. Pre-existing gap, zero current exposure (review round 0).

### Minimal fix (one function + its single call site)

In `test/architecture.test.ts` **only**:

1. Add `dirname`, `normalize` to the existing `node:path` import (line 2).
2. Change the signature to `resolveInternal(specifier: string, fromPath: string):
   string | null`. For a `.`-specifier: `const target = normalize(join(dirname(fromPath),
   specifier))`; return `null` when it lands in the same directory
   (`dirname(target) === dirname(fromPath)`), else return `target`. `@/` branch unchanged.
   No extension stripping needed — `layerOf` matches directory prefixes only.
3. Update the single call site (line 100): `resolveInternal(specifier, file.path)`.

Effect: `../application/x` from an infrastructure file resolves to
`modules/rag/application/x` → layer `application` → flagged by `FORBIDDEN.infrastructure`;
a colocated `./cache` resolves into the same directory → `null` → stays allowed. Reuses
the existing path helpers; no new dependency, no new abstraction, no scanner refactor.

### Test approach: in-test assertions, no fixture file (explicit choice)

`resolveInternal` is module-scoped in `test/architecture.test.ts` itself, so the new
`it` block calls it directly. We do **not** add a fixture source file under `src/`
(e.g. an infrastructure file importing `../application/x`): it would be a real source
file whose only purpose is to make `respects layer direction` permanently red. One new
`it` block, named so `-t "relative"` filters it exactly (no existing test name contains
"relative"):

```ts
it("resolves relative imports for layer rules", () => {
  // (a) a relative cross-layer import IS now resolved and flagged
  const cross = resolveInternal("../application/x", "modules/rag/infrastructure/retriever.ts");
  expect(cross).toBe("modules/rag/application/x");
  expect(layerOf(cross as string)).toBe("application"); // non-null proven above; "application" ∈ FORBIDDEN.infrastructure (line 54)
  // (b) same-directory relative imports stay allowed
  expect(resolveInternal("./cache", "modules/rag/infrastructure/cache.test.ts")).toBeNull();
  // @/ branch unchanged
  expect(resolveInternal("@/shared/env", "modules/rag/infrastructure/retriever.ts")).toBe("shared/env");
});
```

(a) proves the `../application/x` violation is reported through the existing chain
(`resolveInternal` → `layerOf` → `FORBIDDEN`); (b) proves `./cache` is not flagged, which
also keeps the existing colocated imports (`cache.test.ts`, `llm-reranker.test.ts`)
green; the untouched rest of the suite re-proves no regression. No new test file.

### Contract (delta)

- Invariant: every import that resolves inside `src/` — `@/`-aliased or relative — is
  checked against the layer rules; only same-directory relative imports and true
  externals are exempt. — verify: `pnpm test --run test/architecture.test.ts -t "relative"`
- review_level: minimal — test-only change to the test's own resolution helper (<20
  changed lines, no runtime/behavior change); consistent with the plan's declared level.

### Files (delta)

| Op | Path |
|---|---|
| Modify | `test/architecture.test.ts` — `resolveInternal` gains `fromPath` + relative resolution; call site line 100; one new `it` block |

### Documentation impact (delta)

- `README.md`: no change — test tooling only, nothing user-facing.
- `docs/behaviors/`: not needed — no observable behavior change.
- CHANGELOG draft above stays as-is: "ban infrastructure→application imports" already
  covers stronger enforcement. No new entry.

### Acceptance Criteria (delta)

- [x] AC-7: When an infrastructure file imports a sibling-layer module relatively (e.g. `../application/x`), the architecture test reports it; same-directory relative imports (e.g. `./cache`) are not flagged. — verify: `pnpm test --run test/architecture.test.ts -t "relative"` — evidence: exit 0, 1 passed | 9 skipped (2026-11-26)

Full gate after the delta (run once after it lands, not per criterion):
`pnpm typecheck && pnpm lint && pnpm test && pnpm build` must stay green.
