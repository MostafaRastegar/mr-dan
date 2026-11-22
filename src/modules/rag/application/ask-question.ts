/**
 * RAG answer orchestrator: retrieve → rerank → generate → cache.
 *
 * Port of mr-rag/app/usecases/ask_question.py::AskQuestionUseCase.
 *
 * Blocking mode returns the full Answer. Stream mode (see route handler)
 * emits SSE events: meta → token* → sources → done.
 */

import { env } from "@/shared/env";
import { logger } from "@/shared/logger";
import type { Answer, SearchResult } from "@/modules/rag/domain/models";
import type {
  EmbeddingProviderPort,
  LLMPort,
  RAGCachePort,
  RetrieverPort,
  RerankPort,
} from "@/modules/rag/domain/ports";
import type { SearchKnowledgeUseCase } from "@/modules/rag/application/search-knowledge";
import { expandedRetrieve } from "@/modules/rag/application/multi-query";

const PROMPT_VERSION = "v1";

export interface AskQuestionInput {
  question: string;
  topK?: number;
}

export interface AskQuestionOutput {
  answer: Answer;
}

async function sha256(text: string): Promise<string> {
  const buf = Buffer.from(text, "utf8");
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function exactCacheKey(question: string, model: string): Promise<string> {
  return sha256(`${question}|${PROMPT_VERSION}|${model}`);
}

function isLowRelevance(sources: SearchResult[]): boolean {
  // every() on an empty array is true, so an empty context is "poor" too.
  return sources.every((s) => s.score < env.RETRIEVAL_LOW_RELEVANCE_THRESHOLD);
}

function buildRagPrompt(
  question: string,
  sources: { text: string }[],
  options: { loose?: boolean } = {},
): string {
  const context = sources.map((s, i) => `[${i + 1}] ${s.text}`).join("\n\n");
  const instructions = options.loose
    ? "You are a helpful educational consultant. Answer using the provided context when helpful; you may also use your general knowledge, but clearly state when information comes from outside the context."
    : "You are a helpful educational consultant. Answer the question based ONLY on the provided context. If the answer cannot be determined from the context, say so clearly.";
  return [
    instructions,
    "",
    "Context:",
    context,
    "",
    "Question:",
    question,
    "",
    "Answer in Persian.",
    "",
  ].join("\n");
}

export class AskQuestionUseCase {
  constructor(
    private readonly searchKnowledge: SearchKnowledgeUseCase,
    private readonly embeddingProvider: EmbeddingProviderPort,
    private readonly retriever: RetrieverPort,
    private readonly reranker: RerankPort,
    private readonly llm: LLMPort,
    private readonly cache: RAGCachePort,
  ) {}

  async clearCache(): Promise<void> {
    await this.cache.clear();
  }

  async execute(input: AskQuestionInput): Promise<AskQuestionOutput> {
    const { question, topK = env.TOP_K } = input;

    if (!question || question.trim().length === 0) {
      throw new Error("Question must not be empty");
    }

    const model = env.LLM_MODEL;

    // 1. Exact cache check
    const key = await exactCacheKey(question, model);
    const exactHit = await this.cache.getExact(key);
    if (exactHit) {
      logger.debug({ question }, "cache: exact hit");
      return {
        answer: { ...exactHit, cache: { layer: "exact", hit: true } },
      };
    }

    // 2. Semantic cache check
    const queryEmbedding = await this.embeddingProvider.embedQuery(question);
    const semanticHit = await this.cache.getSemantic(queryEmbedding);
    if (semanticHit) {
      logger.debug({ question }, "cache: semantic hit");
      return {
        answer: {
          ...semanticHit,
          cache: { layer: "semantic", hit: true },
        },
      };
    }

    // 3. Retrieve (hybrid)
    const searchOutput = await this.searchKnowledge.execute({
      question,
      topK,
    });
    let sources = searchOutput.answer.sources;

    // 6. Cascade: stage 2 query expansion when context is empty/low relevance.
    //    Stage 3 (loose prompt) is applied at generation time below.
    const poor = isLowRelevance(sources);
    if (
      poor &&
      env.QUERY_EXPANSION_ENABLED &&
      !env.MULTI_QUERY_ENABLED
    ) {
      try {
        sources = await expandedRetrieve(
          {
            embeddingProvider: this.embeddingProvider,
            retriever: this.retriever,
            llm: this.llm,
          },
          question,
          topK,
          env.FETCH_K,
          env.QUERY_EXPANSION_COUNT,
        );
      } catch (error) {
        logger.warn({ err: error }, "ask: cascade stage-2 expansion failed");
      }
    }

    // 4. Rerank (LLM-based listwise)
    if (sources.length > 1) {
      try {
        sources = await this.reranker.rerank(question, sources, topK);
      } catch (error) {
        logger.warn({ err: error }, "ask: rerank failed, using original order");
      }
    }

    // 5. Generate answer text (stage 3 loose prompt when still poor).
    const useLoose = env.LOOSE_PROMPT_ENABLED && isLowRelevance(sources);
    const prompt = buildRagPrompt(
      question,
      sources.map((s) => ({ text: s.chunk.text })),
      { loose: useLoose },
    );
    let answerText = "";
    try {
      answerText = await this.llm.complete([
        { role: "system", content: "You are a helpful educational consultant." },
        { role: "user", content: prompt },
      ]);
    } catch (error) {
      logger.warn({ err: error }, "ask: LLM generation failed");
      answerText = "متأسفان، در تولید پاسخ مشکلی پیش آمد.";
    }

    const answer: Answer = {
      text: answerText,
      sources,
      cache: { layer: "none", hit: false },
    };

    // 6. Store in caches
    try {
      await this.cache.setExact(key, answer, env.CACHE_TTL_LLM);
      await this.cache.setSemantic(
        queryEmbedding,
        answer,
        env.CACHE_TTL_EMBEDDING,
      );
    } catch (error) {
      logger.warn({ err: error }, "ask: cache write failed");
    }

    return { answer };
  }

  /**
   * Streaming RAG answer. Emits events via callbacks:
   * meta → token* → sources → done.
   */
  async executeStream(
    input: AskQuestionInput,
    callbacks: {
      onMeta: (meta: { question: string; sourceCount: number }) => void;
      onToken: (token: string) => void;
      onSources: (sources: SearchResult[]) => void;
      onDone: () => void;
    },
    options?: { signal?: AbortSignal },
  ): Promise<void> {
    const { question, topK = env.TOP_K } = input;
    const { onMeta, onToken, onSources, onDone } = callbacks;
    const { signal } = options ?? {};

    if (!question || question.trim().length === 0) {
      throw new Error("Question must not be empty");
    }

    const model = env.LLM_MODEL;
    let answerText = "";

    const emitToken = (token: string): void => {
      if (signal?.aborted) return;
      answerText += token;
      onToken(token);
    };

    // 1. Exact cache check
    const key = await exactCacheKey(question, model);
    const exactHit = await this.cache.getExact(key);
    if (exactHit) {
      onMeta({ question, sourceCount: exactHit.sources.length });
      for (const token of this._splitTokens(exactHit.text)) {
        emitToken(token);
      }
      onSources(exactHit.sources);
      onDone();
      return;
    }

    // 2. Semantic cache check
    const queryEmbedding = await this.embeddingProvider.embedQuery(question);
    const semanticHit = await this.cache.getSemantic(queryEmbedding);
    if (semanticHit) {
      onMeta({ question, sourceCount: semanticHit.sources.length });
      for (const token of this._splitTokens(semanticHit.text)) {
        emitToken(token);
      }
      onSources(semanticHit.sources);
      onDone();
      return;
    }

    // 3. Retrieve (hybrid)
    const searchOutput = await this.searchKnowledge.execute({
      question,
      topK,
    });
    let sources = searchOutput.answer.sources;

    // 6. Cascade: stage 2 query expansion when context is empty/low relevance.
    const poor = isLowRelevance(sources);
    if (
      poor &&
      env.QUERY_EXPANSION_ENABLED &&
      !env.MULTI_QUERY_ENABLED
    ) {
      try {
        sources = await expandedRetrieve(
          {
            embeddingProvider: this.embeddingProvider,
            retriever: this.retriever,
            llm: this.llm,
          },
          question,
          topK,
          env.FETCH_K,
          env.QUERY_EXPANSION_COUNT,
        );
      } catch (error) {
        logger.warn({ err: error }, "ask: cascade stage-2 expansion failed");
      }
    }

    // 4. Rerank (LLM-based listwise)
    if (sources.length > 1) {
      try {
        sources = await this.reranker.rerank(question, sources, topK);
      } catch (error) {
        logger.warn({ err: error }, "ask: rerank failed, using original order");
      }
    }

    // 5. Meta event
    onMeta({ question, sourceCount: sources.length });

    // 7. Stream LLM tokens (stage 3 loose prompt when still poor).
    const useLoose = env.LOOSE_PROMPT_ENABLED && isLowRelevance(sources);
    const prompt = buildRagPrompt(
      question,
      sources.map((s) => ({ text: s.chunk.text })),
      { loose: useLoose },
    );
    try {
      await this.llm.completeStream(
        [
          {
            role: "system",
            content: "You are a helpful educational consultant.",
          },
          { role: "user", content: prompt },
        ],
        emitToken,
        { signal },
      );
    } catch (error) {
      if (signal?.aborted) return;
      logger.warn({ err: error }, "ask: LLM streaming failed");
      answerText = "متأسفان، در تولید پاسخ مشکلی پیش آمد.";
      emitToken(answerText);
    }

    // 7. Sources event
    onSources(sources);

    // 8. Done event
    onDone();

    // 9. Store in caches (fire and forget)
    const answer: Answer = {
      text: answerText,
      sources,
      cache: { layer: "none", hit: false },
    };
    try {
      await this.cache.setExact(key, answer, env.CACHE_TTL_LLM);
      await this.cache.setSemantic(
        queryEmbedding,
        answer,
        env.CACHE_TTL_EMBEDDING,
      );
    } catch (error) {
      logger.warn({ err: error }, "ask: cache write failed");
    }
  }

  private _splitTokens(text: string): string[] {
    // Split into words + whitespace for simple streaming simulation.
    const parts: string[] = [];
    let current = "";
    for (const ch of text) {
      current += ch;
      if (/\s/.test(ch) || current.length >= 10) {
        parts.push(current);
        current = "";
      }
    }
    if (current) parts.push(current);
    return parts;
  }
}
