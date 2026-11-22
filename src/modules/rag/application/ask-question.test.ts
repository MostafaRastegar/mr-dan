import { describe, expect, it, vi } from "vitest";
import type { SearchResult } from "@/modules/rag/domain/models";

type Env = {
  NODE_ENV: string;
  LOG_LEVEL: string;
  LLM_MODEL: string;
  TOP_K: number;
  FETCH_K: number;
  RETRIEVAL_MIN_SCORE: number;
  RETRIEVAL_LOW_RELEVANCE_THRESHOLD: number;
  QUERY_EXPANSION_ENABLED: boolean;
  QUERY_EXPANSION_COUNT: number;
  LOOSE_PROMPT_ENABLED: boolean;
  MULTI_QUERY_ENABLED: boolean;
  CACHE_TTL_LLM: number;
  CACHE_TTL_EMBEDDING: number;
  RERANK_ENABLED: boolean;
  RERANK_TOP_N: number;
  HYBRID_BM25_WEIGHT: number;
};

const baseEnv: Env = {
  NODE_ENV: "test",
  LOG_LEVEL: "error",
  LLM_MODEL: "m",
  TOP_K: 5,
  FETCH_K: 20,
  RETRIEVAL_MIN_SCORE: 0.35,
  RETRIEVAL_LOW_RELEVANCE_THRESHOLD: 0.45,
  QUERY_EXPANSION_ENABLED: false,
  QUERY_EXPANSION_COUNT: 3,
  LOOSE_PROMPT_ENABLED: false,
  MULTI_QUERY_ENABLED: false,
  CACHE_TTL_LLM: 86400,
  CACHE_TTL_EMBEDDING: 3600,
  RERANK_ENABLED: true,
  RERANK_TOP_N: 5,
  HYBRID_BM25_WEIGHT: 0.4,
};

/** Re-load ask-question with a controlled env (flags merge over defaults). */
async function loadAskQuestion(flags: Partial<Env> = {}) {
  vi.doMock("@/shared/env", () => ({ env: { ...baseEnv, ...flags } }));
  vi.resetModules();
  const mod = await import("./ask-question");
  return mod.AskQuestionUseCase as any;
}

const result = (id: string, text: string, score: number): SearchResult => ({
  chunk: { id, text, metadata: {} },
  score,
});

const answerOf = (sources: SearchResult[]) => ({
  text: "",
  sources,
  cache: { layer: "none", hit: false },
});

type Deps = {
  searchKnowledge: { execute: ReturnType<typeof vi.fn> };
  embeddingProvider: {
    embedQuery: ReturnType<typeof vi.fn>;
    embedDocuments: ReturnType<typeof vi.fn>;
  };
  retriever: { search: ReturnType<typeof vi.fn> };
  reranker: { rerank: ReturnType<typeof vi.fn> };
  llm: { complete: ReturnType<typeof vi.fn>; completeStream: ReturnType<typeof vi.fn> };
  cache: {
    getExact: ReturnType<typeof vi.fn>;
    getSemantic: ReturnType<typeof vi.fn>;
    setExact: ReturnType<typeof vi.fn>;
    setSemantic: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
  };
};

function build(AskQuestionUseCase: any, overrides: Partial<Deps> = {}): Deps & { u: any } {
  const searchKnowledge = { execute: vi.fn() };
  const embeddingProvider = {
    embedDocuments: vi.fn(),
    embedQuery: vi.fn().mockResolvedValue([0.1, 0.2]),
  };
  const retriever = { search: vi.fn() };
  const reranker = {
    rerank: vi.fn().mockImplementation((_q: string, results: SearchResult[]) =>
      Promise.resolve(results),
    ),
  };
  const llm = {
    complete: vi.fn().mockResolvedValue("answer text"),
    completeStream: vi.fn(),
  };
  const cache = {
    getExact: vi.fn().mockResolvedValue(null),
    getSemantic: vi.fn().mockResolvedValue(null),
    setExact: vi.fn(),
    setSemantic: vi.fn(),
    clear: vi.fn(),
  };
  const d: Deps = {
    searchKnowledge: overrides.searchKnowledge ?? searchKnowledge,
    embeddingProvider: overrides.embeddingProvider ?? embeddingProvider,
    retriever: overrides.retriever ?? retriever,
    reranker: overrides.reranker ?? reranker,
    llm: overrides.llm ?? llm,
    cache: overrides.cache ?? cache,
  };
  const u = new AskQuestionUseCase(
    d.searchKnowledge,
    d.embeddingProvider,
    d.retriever,
    d.reranker,
    d.llm,
    d.cache,
  );
  return { ...d, u };
}

describe("AskQuestionUseCase", () => {
  it("exact cache hit skips retrieval and generation", async () => {
    const AskQuestionUseCase = await loadAskQuestion();
    const { u, cache, searchKnowledge, llm } = build(AskQuestionUseCase);
    cache.getExact.mockResolvedValue(answerOf([result("1", "t", 0.9)]));
    const out = await u.execute({ question: "q" });
    expect(out.answer.cache).toEqual({ layer: "exact", hit: true });
    expect(searchKnowledge.execute).not.toHaveBeenCalled();
    expect(llm.complete).not.toHaveBeenCalled();
  });

  it("semantic cache hit returns without retrieval", async () => {
    const AskQuestionUseCase = await loadAskQuestion();
    const { u, cache, searchKnowledge } = build(AskQuestionUseCase);
    cache.getSemantic.mockResolvedValueOnce(answerOf([result("1", "t", 0.9)]));
    const out = await u.execute({ question: "q" });
    expect(out.answer.cache).toEqual({ layer: "semantic", hit: true });
    expect(searchKnowledge.execute).not.toHaveBeenCalled();
  });

  it("cascade stage 2 expands only when flag is on and context is empty", async () => {
    const AskQuestionUseCase = await loadAskQuestion({
      QUERY_EXPANSION_ENABLED: true,
      MULTI_QUERY_ENABLED: false,
    });
    const { u, retriever, llm, searchKnowledge } = build(AskQuestionUseCase);
    searchKnowledge.execute.mockResolvedValue({ answer: answerOf([]) });
    llm.complete.mockResolvedValueOnce("rewrite alpha\nrewrite beta");
    retriever.search.mockImplementation(async (q: string) =>
      [result(q, q + " doc", 0.8)],
    );

    const out = await u.execute({ question: "the question" });

    expect(retriever.search).toHaveBeenCalledTimes(3);
    expect(retriever.search.mock.calls.map((c) => c[0])).toEqual([
      "the question",
      "rewrite alpha",
      "rewrite beta",
    ]);
    // expansion call + generation call
    expect(llm.complete).toHaveBeenCalledTimes(2);
    expect(out.answer.sources.length).toBeGreaterThan(0);
  });

  it("cascade stage 2 is skipped when flag is off", async () => {
    const AskQuestionUseCase = await loadAskQuestion();
    const { u, retriever, llm, searchKnowledge } = build(AskQuestionUseCase);
    searchKnowledge.execute.mockResolvedValue({ answer: answerOf([]) });
    await u.execute({ question: "q" });
    expect(retriever.search).not.toHaveBeenCalled();
    expect(llm.complete).toHaveBeenCalledTimes(1); // generation only
  });

  it("loose prompt is used when flag is on and context is still poor", async () => {
    const AskQuestionUseCase = await loadAskQuestion({
      LOOSE_PROMPT_ENABLED: true,
      QUERY_EXPANSION_ENABLED: false,
    });
    const { u, llm, searchKnowledge } = build(AskQuestionUseCase);
    searchKnowledge.execute.mockResolvedValue({ answer: answerOf([]) });
    await u.execute({ question: "q" });
    const last = llm.complete.mock.calls.at(-1)!;
    const messages = last[0] as { role: string; content: string }[];
    expect(messages[1].content).toContain("general knowledge");
  });

  it("clearCache delegates to the cache adapter", async () => {
    const AskQuestionUseCase = await loadAskQuestion();
    const { u, cache } = build(AskQuestionUseCase);
    await u.clearCache();
    expect(cache.clear).toHaveBeenCalledTimes(1);
  });
});
