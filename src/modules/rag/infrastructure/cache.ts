/**
 * In-memory RAG cache.
 *
 * Two layers:
 *   - Exact: keyed by hash(question + promptVersion + model), TTL = CACHE_TTL_LLM.
 *   - Semantic: keyed by embedding vector, cosine >= CACHE_SEMANTIC_THRESHOLD,
 *     max 500 entries, TTL = CACHE_TTL_EMBEDDING.
 *
 * No Redis in this phase (per AGENTS.md restrictions); in-memory only.
 */

import { env } from "@/shared/env";
import { logger } from "@/shared/logger";
import type { Answer } from "@/modules/rag/domain/models";
import type { RAGCachePort } from "@/modules/rag/domain/ports";

interface ExactEntry {
  value: Answer;
  expiry: number;
}

interface SemanticEntry {
  embedding: number[];
  value: Answer;
  expiry: number;
}

const now = () => Date.now() / 1000;

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;
  return dot / denom;
}

export class MemoryCache implements RAGCachePort {
  private readonly exact = new Map<string, ExactEntry>();
  private readonly semantic: SemanticEntry[] = [];

  async getExact(key: string): Promise<Answer | null> {
    const entry = this.exact.get(key);
    if (!entry) return null;
    if (entry.expiry <= now()) {
      this.exact.delete(key);
      return null;
    }
    return entry.value;
  }

  async setExact(key: string, value: Answer, ttlSeconds: number): Promise<void> {
    this.exact.set(key, { value, expiry: now() + ttlSeconds });
  }

  async getSemantic(embedding: number[]): Promise<Answer | null> {
    let best: { entry: SemanticEntry; similarity: number } | null = null;

    for (const entry of this.semantic) {
      if (entry.expiry <= now()) continue;
      const sim = cosineSimilarity(embedding, entry.embedding);
      if (sim >= env.CACHE_SEMANTIC_THRESHOLD) {
        if (!best || sim > best.similarity) {
          best = { entry, similarity: sim };
        }
      }
    }

    if (!best) return null;
    return best.entry.value;
  }

  async setSemantic(
    embedding: number[],
    value: Answer,
    ttlSeconds: number,
  ): Promise<void> {
    // Evict expired entries first.
    for (let i = this.semantic.length - 1; i >= 0; i -= 1) {
      if (this.semantic[i].expiry <= now()) {
        this.semantic.splice(i, 1);
      }
    }

    // Evict oldest if over max size.
    const maxSize = 500;
    while (this.semantic.length >= maxSize) {
      this.semantic.shift();
    }

    this.semantic.push({
      embedding,
      value,
      expiry: now() + ttlSeconds,
    });
  }

  async clear(): Promise<void> {
    this.exact.clear();
    this.semantic.length = 0;
    logger.info("cache: cleared");
  }

  async size(): Promise<{ exact: number; semantic: number }> {
    return { exact: this.exact.size, semantic: this.semantic.length };
  }
}
