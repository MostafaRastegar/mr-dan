import { describe, expect, it } from "vitest";
import { env } from "./env";

describe("env", () => {
  it("applies oracle-compatible retrieval defaults", () => {
    expect(env.CHUNK_SIZE).toBe(800);
    expect(env.CHUNK_OVERLAP).toBe(120);
    expect(env.TOP_K).toBe(5);
    expect(env.FETCH_K).toBe(20);
    expect(env.RETRIEVAL_MIN_SCORE).toBe(0.35);
    expect(env.HYBRID_BM25_WEIGHT).toBe(0.4);
    expect(env.RERANK_TOP_N).toBe(5);
    expect(env.RERANK_MIN_SCORE).toBe(3);
    expect(env.CACHE_SEMANTIC_THRESHOLD).toBe(0.97);
  });

  it("keeps experimental stages off by default", () => {
    expect(env.MULTI_QUERY_ENABLED).toBe(false);
    expect(env.QUERY_EXPANSION_ENABLED).toBe(false);
    expect(env.LOOSE_PROMPT_ENABLED).toBe(false);
  });

  it("is frozen", () => {
    expect(Object.isFrozen(env)).toBe(true);
  });
});
