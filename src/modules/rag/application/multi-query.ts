/**
 * Multi-query retrieval and query-expansion helpers.
 *
 * Multi-query: when MULTI_QUERY_ENABLED, an LLM rewrites the question into
 * MULTI_QUERY_COUNT alternatives; each variant (plus the original) is
 * retrieved and the lists are fused with unweighted RRF (k=60).
 *
 * Cascade stage 2 reuses the same expansion + RRF machinery, gated by
 * QUERY_EXPANSION_ENABLED instead of MULTI_QUERY_ENABLED.
 *
 * Any LLM failure degrades to the original query alone; retrieval never fails
 * because of expansion.
 */

import { logger } from "@/shared/logger";
import type { SearchResult } from "@/modules/rag/domain/models";
import type {
  EmbeddingProviderPort,
  LLMPort,
  RetrieverPort,
} from "@/modules/rag/domain/ports";

const RRF_K = 60;

/** Build the listwise query-rewriting prompt sent to the LLM. */
function buildRewritePrompt(question: string, count: number): string {
  return [
    `You are a query-rewriting assistant for a retrieval system.`,
    "",
    `Rewrite the user's question into exactly ${count} alternative phrasings that`,
    `capture the same intent and are useful for document retrieval.`,
    "",
    `Rules:`,
    `- Return exactly one rewriting per line.`,
    `- No numbering, no bullets, no quotes, no extra text.`,
    `- Keep each rewriting concise and in the same language as the question.`,
    "",
    `Question:`,
    question,
    "",
  ].join("\n");
}

/** Parse LLM output into rewrite strings (one per non-empty line). */
function parseRewrites(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Generate rewrite alternatives via the LLM. Returns [] on any failure so the
 * caller can fall back to the original query only.
 */
export async function expandQueries(
  llm: LLMPort,
  question: string,
  count: number,
): Promise<string[]> {
  try {
    const response = await llm.complete([
      { role: "system", content: "You are a query-rewriting assistant." },
      { role: "user", content: buildRewritePrompt(question, count) },
    ]);
    return parseRewrites(response).slice(0, count);
  } catch (error) {
    logger.warn({ err: error, question }, "query-expansion: LLM rewrite failed");
    return [];
  }
}

/**
 * Weighted Reciprocal Rank Fusion over many ranked lists (k=60). Every list
 * contributes equally (weight 1.0). Result scores are min-max normalised to
 * 0..1 by the top fused score.
 */
export function rrfMerge(
  lists: SearchResult[][],
  rrfK: number = RRF_K,
): SearchResult[] {
  const fused: Map<string, { result: SearchResult; score: number }> = new Map();

  for (const list of lists) {
    for (let rank = 0; rank < list.length; rank += 1) {
      const item = list[rank];
      const key = item.chunk.id || item.chunk.text.slice(0, 200);
      const entry = fused.get(key) ?? { result: item, score: 0 };
      entry.score += 1 / (rrfK + rank + 1);
      if (item.score > entry.result.score) entry.result = item;
      fused.set(key, entry);
    }
  }

  const ordered = Array.from(fused.values()).sort((a, b) => b.score - a.score);
  const topScore = ordered[0]?.score ?? 0;
  return ordered.map((entry) => ({
    chunk: entry.result.chunk,
    score: topScore > 0 ? Math.round((entry.score / topScore) * 10000) / 10000 : 0,
  }));
}

/** Embed + retrieve every query, returning one ranked list per query. */
async function retrieveAll(
  embeddingProvider: EmbeddingProviderPort,
  retriever: RetrieverPort,
  queries: string[],
  topK: number,
  fetchK?: number,
): Promise<SearchResult[][]> {
  const lists: SearchResult[][] = [];
  for (const q of queries) {
    const vector = await embeddingProvider.embedQuery(q);
    lists.push(await retriever.search(q, vector, topK, fetchK));
  }
  return lists;
}

/**
 * Expand the question into `count` rewrites, retrieve each variant, fuse with
 * RRF, and return the top `topK` fused results.
 */
export async function expandedRetrieve(
  deps: {
    embeddingProvider: EmbeddingProviderPort;
    retriever: RetrieverPort;
    llm: LLMPort;
  },
  question: string,
  topK: number,
  fetchK?: number,
  count: number = 3,
): Promise<SearchResult[]> {
  const rewrites = await expandQueries(deps.llm, question, count);
  const queries = [question, ...rewrites];
  const lists = await retrieveAll(
    deps.embeddingProvider,
    deps.retriever,
    queries,
    topK,
    fetchK,
  );
  return rrfMerge(lists).slice(0, topK);
}
