/**
 * Answer a question using hybrid retrieval (BM25 + dense + RRF).
 *
 * Steps:
 *   1. Embed the question
 *   2. Search via retriever (hybrid: BM25 + dense + RRF)
 *   3. Filter results by min score threshold
 *   4. Return Answer with sources + cache info
 */

import { env } from "@/shared/env";
import { logger } from "@/shared/logger";
import type { Answer, SearchResult } from "@/modules/rag/domain/models";
import { RetrievalError } from "@/modules/rag/domain/errors";
import type {
  EmbeddingProviderPort,
  LLMPort,
  RetrieverPort,
} from "@/modules/rag/domain/ports";
import { expandedRetrieve } from "@/modules/rag/application/multi-query";

export interface SearchKnowledgeInput {
  question: string;
  topK?: number;
}

export interface SearchKnowledgeOutput {
  answer: Answer;
}

export class SearchKnowledgeUseCase {
  constructor(
    private readonly embeddingProvider: EmbeddingProviderPort,
    private readonly retriever: RetrieverPort,
    // LLM only used for multi-query retrieval (MULTI_QUERY_ENABLED).
    private readonly llm?: LLMPort,
  ) {}

  async execute(input: SearchKnowledgeInput): Promise<SearchKnowledgeOutput> {
    const { question, topK = env.TOP_K } = input;

    if (!question || question.trim().length === 0) {
      throw new RetrievalError(new Error("Question must not be empty"));
    }

    let results: SearchResult[];
    try {
      if (env.MULTI_QUERY_ENABLED && this.llm) {
        results = await expandedRetrieve(
          {
            embeddingProvider: this.embeddingProvider,
            retriever: this.retriever,
            llm: this.llm,
          },
          question,
          topK,
          env.FETCH_K,
          env.MULTI_QUERY_COUNT,
        );
      } else {
        const queryVector = await this.embeddingProvider.embedQuery(question);
        results = await this.retriever.search(
          question,
          queryVector,
          topK,
          env.FETCH_K,
        );
      }
    } catch (error) {
      throw new RetrievalError(
        error instanceof Error ? error : new Error(String(error)),
      );
    }

    // Filter by minimum relevance score
    const filtered = results.filter(
      (r) => r.score >= env.RETRIEVAL_MIN_SCORE,
    );

    logger.debug(
      { question, retrieved: results.length, passed: filtered.length },
      "search: hybrid retrieval",
    );

    const answer: Answer = {
      text: "", // generation happens in the RAG answer use case (phase 2)
      sources: filtered,
      cache: { layer: "none", hit: false },
    };

    return { answer };
  }
}
