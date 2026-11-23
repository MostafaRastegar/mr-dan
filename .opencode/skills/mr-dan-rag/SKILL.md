---
name: mr-dan-rag
description: Retrieval-augmented generation pipeline — dense/hybrid search, RRF, LLM reranking, cascade, caching, prompts, and streaming
---

# mr-dan-rag

## Usage

Use when changing retrieval, thresholds, rerank, prompts, cache, or the order of answer steps.

## Canonical parameters

```text
top_k=5 · fetch_k=20
retrieval_min_score=0.35 · low_relevance_threshold=0.45
rerank=true · rerank_top_n=5 · rerank_min_score=3 (0..10)
hybrid=true · bm25_weight=0.4 · RRF k=60
multi_query=false · count=3
query_expansion=false · count=3
loose_prompt=false
semantic_cache=true · threshold=0.97 · maxsize=500
ttl_embedding=3600 · ttl_llm=86400
```

Source of truth: `src/shared/env.ts`. This block stays in sync with it.

## Retrieval order

```text
1. exact cache   (hash(question + promptVersion + model))
2. embedQuery
3. semantic cache (cosine ≥ 0.97)
4. retrieve: dense(fetch_k) [+ BM25 → RRF when hybrid]
5. filter score ≥ 0.35
6. cascade when empty/low yield:
     stage 2: query expansion (LLM → 3 rewrites → merge with RRF)
     stage 3: loose prompt
7. rerank with the LLM → top_n=5, drop < 3
8. prompt + history → LLM
9. cache update (exact + semantic)
```

- Rerank runs **after** fusion and **before** context construction.
- Keep the oracle order; moving a stage is a parity change that must be measured.
- A rerank failure never fails the request: the input order is truncated instead.

## Hybrid

- dense: cosine from Chroma.
- sparse: `BM25Retriever` from `@langchain/community/retrievers/bm25` with a Persian `preprocessFunc`.
- fusion: a local RRF, not `EnsembleRetriever` (which returns non-comparable, non-normalized scores).

```text
score = Σ weight_i / (k + rank_i)      k = 60, weight = [0.4, 0.6]
then min-max normalize to 0..1
```

- Hybrid output must stay in 0..1; the 0.35/0.45 thresholds are meaningful only for the dense path.
- The BM25 index is built in memory and invalidated/rebuilt when the chunk count changes.

## Multi-query (flag-driven)

- Only when `multi_query_enabled=true`.
- The LLM produces `multi_query_count=3` rewrites from the original question; each rewrite plus the original is retrieved.
- Results merge with the same RRF (never a plain concat).
- Cost: `1 + count` embedding calls plus one extra LLM call → off by default.
- A failed rewrite falls back to the original question only; the request does not fail.

## Persian tokenizer (must match the oracle)

1. lowercase (for Latin)
2. `ي → ی`, `ك → ک`, `ۀ → ه`, `أ/إ → ا`
3. strip diacritics
4. drop/normalize ZWNJ (`\u200c`)
5. strip punctuation
6. split on whitespace

Any change to this function is a parity number change. Measure it against the oracle first.

## Rerank

- listwise: all candidates in one prompt, JSON output `{index, score}`.
- `temperature=0`, `max_tokens` bounded (small).
- A score outside 0..10 is clamped; an invalid index is ignored.
- Broken JSON: one retry, then fall back to the original order.
- The rerank prompt is part of `promptVersion`.

## Cache

| Layer | Key | TTL |
|---|---|---|
| exact | `sha256(question + promptVersion + model)` | `ttl_llm` |
| semantic | question embedding | `ttl_llm` |
| embedding | `sha256(text + model)` | `ttl_embedding` |

- Semantic caching is active only when `cache_semantic_enabled`.
- maxsize = 500; LRU.
- `POST /api/admin/cache/clear` clears all three.
- Cache holds no sources unless explicitly stored; a cached answer must behave like a fresh one.

## Prompts

- strict: answer only from context; if it is insufficient, say so explicitly.
- loose (flag): allow general knowledge, and say when it is used.
- context: every chunk carries a source label (`original_filename`, `page`/`section`) so citations work.
- history: at most the last 10 messages; the system prompt is not re-injected.
- `promptVersion` is a constant string in one file; every prompt change bumps it.

## Steps — changing behavior

1. Measure the number/rule against the golden set in the oracle (when it has an equivalent).
2. Update `env.ts` + this skill + `AGENTS.md` at the same time.
3. Unit test for logic, parity test for the number.
4. If it regresses, revert; tuning thresholds to green a test is banned.

## Checklist

- [ ] Stage order matches this document.
- [ ] Rerank fallback is tested.
- [ ] Cache hit/miss is tested.
- [ ] Hybrid score stays in 0..1.
- [ ] `promptVersion` was bumped.
- [ ] No raw exception text reaches the user.

## Anti-patterns

- `EnsembleRetriever` without score normalization.
- Reranking all 20 candidates with a large top_n (token cost).
- Cache without TTL or without the model in the key.
- Building context from chunks below the threshold.
- Changing a prompt without bumping the version.
