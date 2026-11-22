import { describe, expect, it } from "vitest";
import { GOLDEN_SET, matches } from "../scripts/golden-set";

/**
 * Replicates the hit@5 / MRR math from scripts/eval-retrieval.ts using a
 * controlled, synthetic retriever so the metrics logic is tested without
 * needing the OpenRouter API or a real corpus.
 */

function simulateEval(
  retriever: (question: string) => { chunk: { text: string; metadata: Record<string, unknown> }; score: number }[],
  topK: number,
) {
  let hits = 0;
  const reciprocalRanks: number[] = [];

  for (const caze of GOLDEN_SET) {
    const results = retriever(caze.question).map((r) => ({
      chunk: { ...r.chunk, metadata: r.chunk.metadata as Record<string, unknown> },
      score: r.score,
    })) as Array<{ chunk: { text: string; metadata: Record<string, unknown> }; score: number }>;

    let bestRank: number | null = null;
    for (let i = 0; i < results.length; i += 1) {
      if (matches(results[i] as any, caze)) {
        bestRank = i + 1;
        break;
      }
    }

    if (bestRank !== null && bestRank <= topK) {
      hits += 1;
      reciprocalRanks.push(1 / bestRank);
    } else {
      reciprocalRanks.push(0);
    }
  }

  return {
    hitAt5: hits / GOLDEN_SET.length,
    mrr: reciprocalRanks.reduce((a, b) => a + b, 0) / GOLDEN_SET.length,
  };
}

describe("eval metrics (synthetic)", () => {
  it("hit@5 = 1.0 and mrr = 1.0 when every question ranks its source first", () => {
    const retriever = (question: string) => {
      const caze = GOLDEN_SET.find((c) => c.question === question)!;
      return [
        {
          chunk: {
            text: caze.expectedKeywords.join(" ") || "content",
            metadata: { original_filename: caze.expectedSource },
          },
          score: 0.9,
        },
      ];
    };
    const res = simulateEval(retriever, 5);
    expect(res.hitAt5).toBe(1);
    expect(res.mrr).toBe(1);
  });

  it("hit@5 = 0 and mrr = 0 when nothing matches", () => {
    const retriever = () => [
      { chunk: { text: "unrelated", metadata: { original_filename: "other.txt" } }, score: 0.9 },
    ];
    const res = simulateEval(retriever, 5);
    expect(res.hitAt5).toBe(0);
    expect(res.mrr).toBe(0);
  });

  it("mrr reflects rank position", () => {
    const retriever = (question: string) => {
      const caze = GOLDEN_SET.find((c) => c.question === question)!;
      return [
        { chunk: { text: "noise", metadata: { original_filename: "junk.txt" } }, score: 0.9 },
        {
          chunk: {
            text: caze.expectedKeywords.join(" ") || "content",
            metadata: { original_filename: caze.expectedSource },
          },
          score: 0.5,
        },
      ];
    };
    const res = simulateEval(retriever, 5);
    expect(res.hitAt5).toBe(1);
    expect(res.mrr).toBeCloseTo(0.5, 4); // all rank 2 → 1/2
  });

  it("misses beyond top-5 do not count as hits", () => {
    const retriever = () => Array.from({ length: 6 }, (_, i) => ({
      chunk: {
        text: i === 5 ? "lamp" : "noise",
        metadata: { original_filename: i === 5 ? "final report.txt" : "junk.txt" },
      },
      score: 0.5,
    }));
    const res = simulateEval(retriever, 5);
    expect(res.hitAt5).toBe(0);
    expect(res.mrr).toBe(0);
  });
});
