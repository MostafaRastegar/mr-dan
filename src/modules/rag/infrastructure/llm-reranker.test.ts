import { describe, expect, it } from "vitest";
import { LLMReranker } from "./llm-reranker";
import type { LLMPort } from "@/modules/rag/domain/ports";
import type { SearchResult } from "@/modules/rag/domain/models";

const result = (id: string): SearchResult => ({
  chunk: { id, text: id, metadata: {} },
  score: 0.5,
});

describe("LLMReranker", () => {
  it("reorders results by LLM ranking", async () => {
    const llm: LLMPort = {
      complete: async () => "3,1,2",
      completeStream: async () => {},
    };
    const reranker = new LLMReranker(llm);
    const out = await reranker.rerank("q", [result("a"), result("b"), result("c")], 5);
    expect(out.map((x) => x.chunk.id)).toEqual(["c", "a", "b"]);
  });

  it("limits output to topK", async () => {
    const llm: LLMPort = {
      complete: async () => "3,2,1,4,5",
      completeStream: async () => {},
    };
    const reranker = new LLMReranker(llm);
    const out = await reranker.rerank(
      "q",
      [result("a"), result("b"), result("c"), result("d"), result("e")],
      2,
    );
    expect(out).toHaveLength(2);
  });

  it("falls back to original order on unparseable LLM output", async () => {
    const llm: LLMPort = {
      complete: async () => "not a ranking at all",
      completeStream: async () => {},
    };
    const reranker = new LLMReranker(llm);
    const out = await reranker.rerank("q", [result("a"), result("b"), result("c")], 5);
    expect(out.map((x) => x.chunk.id)).toEqual(["a", "b", "c"]);
  });

  it("falls back to original order when LLM throws", async () => {
    const llm: LLMPort = {
      complete: async () => {
        throw new Error("down");
      },
      completeStream: async () => {},
    };
    const reranker = new LLMReranker(llm);
    const out = await reranker.rerank("q", [result("a"), result("b")], 5);
    expect(out.map((x) => x.chunk.id)).toEqual(["a", "b"]);
  });

  it("returns empty for empty input", async () => {
    const llm: LLMPort = {
      complete: async () => "1",
      completeStream: async () => {},
    };
    const reranker = new LLMReranker(llm);
    expect(await reranker.rerank("q", [], 5)).toEqual([]);
  });
});
