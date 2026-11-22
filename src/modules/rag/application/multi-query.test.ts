import { describe, expect, it } from "vitest";
import { expandQueries, rrfMerge, expandedRetrieve } from "./multi-query";
import type { LLMPort, EmbeddingProviderPort, RetrieverPort } from "@/modules/rag/domain/ports";
import type { SearchResult } from "@/modules/rag/domain/models";

const result = (id: string, text: string, score: number): SearchResult => ({
  chunk: { id, text, metadata: {} },
  score,
});

describe("expandQueries", () => {
  it("parses one rewrite per line", async () => {
    const llm: LLMPort = {
      complete: async () => "rewrite alpha\nrewrite beta\n",
      completeStream: async () => {},
    };
    expect(await expandQueries(llm, "original question", 2)).toEqual([
      "rewrite alpha",
      "rewrite beta",
    ]);
  });

  it("fails closed to empty list", async () => {
    const llm: LLMPort = {
      complete: async () => {
        throw new Error("down");
      },
      completeStream: async () => {},
    };
    expect(await expandQueries(llm, "q", 3)).toEqual([]);
  });
});

describe("rrfMerge", () => {
  it("fuses duplicates and normalises top score to 1", () => {
    const a = [result("1", "a", 1), result("2", "b", 1)];
    const b = [result("2", "b", 1), result("3", "c", 1)];
    const fused = rrfMerge([a, b]);
    expect(fused[0].chunk.id).toBe("2"); // appears in both lists
    expect(fused[0].score).toBe(1);
    expect(fused.length).toBe(3);
  });

  it("empty input returns empty", () => {
    expect(rrfMerge([])).toEqual([]);
    expect(rrfMerge([[], []])).toEqual([]);
  });
});

describe("expandedRetrieve", () => {
  it("retrieves original + rewrites and fuses them", async () => {
    const queries: string[] = [];
    const retriever: RetrieverPort = {
      search: async (q) => {
        queries.push(q);
        return [result(q, q + " doc", 0.5)];
      },
    };
    const embeddingProvider: EmbeddingProviderPort = {
      embedDocuments: async () => [[]],
      embedQuery: async () => [0.1, 0.2],
    };
    const llm: LLMPort = {
      complete: async () => "rewrite one\nrewrite two\n",
      completeStream: async () => {},
    };

    const out = await expandedRetrieve(
      { embeddingProvider, retriever, llm },
      "main question",
      5,
      20,
      2,
    );

    expect(queries).toEqual(["main question", "rewrite one", "rewrite two"]);
    expect(out.length).toBeLessThanOrEqual(5);
    expect(out[0].score).toBeGreaterThanOrEqual(0);
  });
});
