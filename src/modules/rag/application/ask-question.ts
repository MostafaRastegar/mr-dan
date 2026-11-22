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
  RerankPort,
} from "@/modules/rag/domain/ports";
import type { SearchKnowledgeUseCase } from "@/modules/rag/application/search-knowledge";

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

function buildRagPrompt(question: string, sources: { text: string }[]): string {
  const context = sources.map((s, i) => `[${i + 1}] ${s.text}`).join("\n\n");
  return [
    "You are a helpful educational consultant. Answer the question based on the provided context.",
    "If the answer cannot be determined from the context, say so.",
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
    private readonly reranker: RerankPort,
    private readonly llm: LLMPort,
    private readonly cache: RAGCachePort,
  ) {}

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

    // 4. Rerank (LLM-based listwise)
    if (sources.length > 1) {
      try {
        sources = await this.reranker.rerank(question, sources, topK);
      } catch (error) {
        logger.warn({ err: error }, "ask: rerank failed, using original order");
      }
    }

    // 5. Generate answer text
    const prompt = buildRagPrompt(
      question,
      sources.map((s) => ({ text: s.chunk.text })),
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
  ): Promise<void> {
    const { question, topK = env.TOP_K } = input;
    const { onMeta, onToken, onSources, onDone } = callbacks;

    if (!question || question.trim().length === 0) {
      throw new Error("Question must not be empty");
    }

    const model = env.LLM_MODEL;

    // 1. Exact cache check
    const key = await exactCacheKey(question, model);
    const exactHit = await this.cache.getExact(key);
    if (exactHit) {
      onMeta({ question, sourceCount: exactHit.sources.length });
      for (const token of this._splitTokens(exactHit.text)) {
        onToken(token);
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
        onToken(token);
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

    // 6. Stream LLM tokens
    const prompt = buildRagPrompt(
      question,
      sources.map((s) => ({ text: s.chunk.text })),
    );
    let answerText = "";
    try {
      await this.llm.completeStream(
        [
          {
            role: "system",
            content: "You are a helpful educational consultant.",
          },
          { role: "user", content: prompt },
        ],
        (token) => {
          answerText += token;
          onToken(token);
        },
      );
    } catch (error) {
      logger.warn({ err: error }, "ask: LLM streaming failed");
      answerText = "متأسفان، در تولید پاسخ مشکلی پیش آمد.";
      onToken(answerText);
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
