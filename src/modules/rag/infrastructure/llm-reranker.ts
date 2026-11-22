/**
 * LLM-based listwise reranker.
 *
 * Port of mr-rag/app/infrastructure/llm_reranker.py::LLMReranker.
 *
 * Sends all candidate passages to the LLM in a single listwise prompt,
 * parses the returned ranking, and re-orders results accordingly.
 * Falls back to the incoming order on any failure (no error thrown).
 *
 * Env: RERANK_TOP_N (default 5), RERANK_MIN_SCORE (default 3).
 */

import { env } from "@/shared/env";
import { logger } from "@/shared/logger";
import type { SearchResult } from "@/modules/rag/domain/models";
import type { LLMPort, RerankPort } from "@/modules/rag/domain/ports";

/**
 * Maximum number of candidates to send to the LLM in one rerank call.
 * Prevents prompt bloat when fetch_k returns many results.
 */
const MAX_CANDIDATES = 20;

/**
 * Build the listwise reranking prompt sent to the LLM.
 */
function buildRerankPrompt(query: string, candidates: SearchResult[]): string {
  const lines = candidates.map(
    (c, i) => `${i + 1}. ${c.chunk.text.slice(0, 300)}`,
  );
  return [
    `You are a relevance reranker. Rank the following candidate passages by relevance to the query.`,
    ``,
    `Query: ${query}`,
    ``,
    `Candidates:`,
    ...lines,
    ``,
    `Return only a comma-separated list of candidate numbers, most relevant first.`,
    `Example: 3,1,2,4`,
  ].join("\n");
}

/**
 * Parse the LLM's ranking response into an array of 0-based indices.
 * Invalid or out-of-range indices are skipped. Missing indices are appended
 * at the end in their original order.
 */
function parseRanking(response: string, total: number): number[] {
  const raw = response
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const seen = new Set<number>();
  const order: number[] = [];

  for (const token of raw) {
    const n = Number(token);
    if (!Number.isInteger(n) || n < 1 || n > total) continue;
    const idx = n - 1;
    if (seen.has(idx)) continue;
    seen.add(idx);
    order.push(idx);
  }

  // Append any indices the LLM didn't mention, in original order.
  for (let i = 0; i < total; i += 1) {
    if (!seen.has(i)) order.push(i);
  }

  return order;
}

export class LLMReranker implements RerankPort {
  private readonly llm: LLMPort;

  constructor(llm: LLMPort) {
    this.llm = llm;
  }

  async rerank(
    query: string,
    results: SearchResult[],
    topK: number,
  ): Promise<SearchResult[]> {
    if (!env.RERANK_ENABLED) {
      return results.slice(0, topK);
    }

    if (results.length === 0) {
      return [];
    }

    const candidates = results.slice(0, MAX_CANDIDATES);
    const prompt = buildRerankPrompt(query, candidates);

    let ranking: number[];
    try {
      const response = await this.llm.complete([
        { role: "system", content: "You are a relevance reranker." },
        { role: "user", content: prompt },
      ]);
      ranking = parseRanking(response, candidates.length);
    } catch (error) {
      logger.warn(
        { err: error, query },
        "llm-reranker: LLM call failed, falling back to original order",
      );
      return results.slice(0, topK);
    }

    const reranked = ranking.map((i) => candidates[i]);
    return reranked.slice(0, topK);
  }
}
