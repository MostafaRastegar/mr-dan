/**
 * OpenRouter embedding provider.
 *
 * Calls OpenRouter's embedding endpoint with retry + exponential backoff.
 * Results are cached by content hash + model to avoid re-embedding.
 */

import { env } from "@/shared/env";
import { logger } from "@/shared/logger";
import { EmbeddingError, UpstreamError } from "@/modules/rag/domain/errors";
import type { EmbeddingProviderPort } from "@/modules/rag/domain/ports";

function sha256(text: string): Promise<string> {
  const buf = Buffer.from(text, "utf8");
  return crypto.subtle.digest("SHA-256", buf).then((hash) => {
    const hex = Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hex;
  });
}

export class OpenRouterEmbeddingProvider implements EmbeddingProviderPort {
  private readonly baseURL: string;
  private readonly model: string;
  private readonly apiKey: string;
  private readonly maxRetries: number;
  private cache: Map<string, number[]> = new Map();

  constructor(options: {
    baseURL?: string;
    model?: string;
    apiKey?: string;
    maxRetries?: number;
  } = {}) {
    this.baseURL = options.baseURL ?? env.OPENROUTER_BASE_URL;
    this.model = options.model ?? env.EMBEDDING_MODEL;
    this.apiKey = options.apiKey ?? env.OPENROUTER_API_KEY;
    this.maxRetries = options.maxRetries ?? env.LLM_RETRY_ATTEMPTS;
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const results: number[][] = [];
    for (const text of texts) {
      results.push(await this.embedQuery(text));
    }
    return results;
  }

  async embedQuery(text: string): Promise<number[]> {
    const key = `${this.model}:${await sha256(text)}`;

    const cached = this.cache.get(key);
    if (cached) return cached;

    const vector = await this.fetchEmbedding(text);
    this.cache.set(key, vector);
    return vector;
  }

  private async fetchEmbedding(text: string): Promise<number[]> {
    const url = `${this.baseURL.replace(/\/$/, "")}/embeddings`;
    const body = JSON.stringify({ input: text, model: this.model });

    let lastError: unknown = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(
          () => controller.abort(),
          env.LLM_TIMEOUT_SECONDS * 1000,
        );

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body,
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          const text = await response.text().catch(() => "");
          throw new UpstreamError("OpenRouter embeddings", {
            status: response.status,
            body: text,
          });
        }

        const data = (await response.json()) as {
          data?: Array<{ embedding: number[] }>;
        };

        const vector = data.data?.[0]?.embedding;
        if (!Array.isArray(vector)) {
          throw new EmbeddingError(
            new Error(`Unexpected embedding response: ${JSON.stringify(data)}`),
          );
        }

        return vector;
      } catch (error) {
        lastError = error;
        if (attempt < this.maxRetries) {
          const backoff = Math.pow(2, attempt) * 1000;
          logger.warn(
            { err: error, attempt, backoff },
            "embedding request failed, retrying",
          );
          await new Promise((resolve) => setTimeout(resolve, backoff));
        }
      }
    }

    throw new EmbeddingError(lastError);
  }

  clearCache(): void {
    this.cache.clear();
  }
}
