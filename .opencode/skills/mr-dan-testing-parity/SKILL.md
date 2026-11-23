---
name: mr-dan-testing-parity
description: Vitest, fakes, integration tests, and the oracle parity harness for the mr-dan RAG port
---

# mr-dan-testing-parity

## Usage

Use when writing tests, changing the golden set, or checking that the TypeScript port matches the oracle.

## Test pyramid

| Level | Tool | What |
|---|---|---|
| unit | Vitest | normalizer, tokenizer, RRF, cache, schema, use case with a fake |
| architecture | Vitest | import graph: layer boundaries, zero domain deps, route thickness |
| integration | Vitest + real Postgres/Chroma | repository, ingestion, deletion, SSE |
| parity | `tsx scripts/*` | chunk count, top-k ids, MRR/hit@5 |
| e2e | Playwright | upload → question → citation → delete |

## Rules

1. No unit test depends on the network, the real OpenRouter, or the real Chroma. Fakes are explicit in `test/fakes/`.
2. Fakes simulate the contract (deterministic embedding for identical text, predictable LLM output).
3. Integration tests use a real database and clean up between tests.
4. The golden set is ported **verbatim** from `scripts/eval_retrieval.py`; a new question is not added without updating the oracle.
5. Parity numbers are recorded in CI so regressions are visible.
6. Tests target behavior, not implementation details.
7. Every bug starts with a failing test, then the fix.

## Parity gates

```text
hit@5 dense = 1.0 · MRR ≥ 0.78
hit@5 hybrid = 1.0 · MRR ≥ 0.92
chunk count == oracle (±0)
top-5 ids: dense ≥ 11/13 · hybrid ≥ 12/13
orphan chunks after delete = 0
```

- Tuning a threshold to green a test is banned.
- If the free model's output drifts during the day, compare against a same-day snapshot and say so in the report.

## Fakes

```text
FakeEmbedding    → deterministic vector from a text hash
FakeLLM          → fixed answer / configurable stream
FakeVectorStore  → in-memory Map implementing the same port
FakeCache        → Map with a controllable TTL
```

- A fake must also be able to simulate real failures and `cause` (`throwOnCall`).

## Steps — adding parity for a new feature

1. Snapshot the oracle behavior with a script (JSON).
2. Write the same scenario in TypeScript.
3. Compare meaningfully: ids, scores within a tolerance, ordering.
4. If the difference is intentional, record it in `parity.md` and skip the test with a reason.

## Checklist

- [ ] `pnpm test` is green without network access.
- [ ] Integration tests run in CI with the compose profile.
- [ ] Every numeric gate is asserted in a test.
- [ ] No hand-written snapshot without an explanation.
- [ ] Abort and upstream-error tests exist.

## Anti-patterns

- Mocking `fetch` for everything.
- Snapshot tests on LLM output.
- Tests that depend on random Map ordering.
- A permanent `test.skip` with no written reason.
