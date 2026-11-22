/**
 * ChromaDB vector store adapter.
 *
 * Uses Chroma's REST API directly (no chromadb SDK dependency needed for the
 * subset we use). Collection: `mr-dan-chunks`.
 *
 * Metadata stored with each chunk:
 *   document_id, original_filename, file_type, chunk_index, [page], [section]
 */

import { env } from "@/shared/env";
import { logger } from "@/shared/logger";
import type { Chunk, SearchResult } from "@/modules/rag/domain/models";
import { VectorStoreError } from "@/modules/rag/domain/errors";
import type { VectorStorePort } from "@/modules/rag/domain/ports";

const COLLECTION = "mr-dan-chunks";

function chromaURL(path: string): string {
  return `${env.CHROMA_URL.replace(/\/$/, "")}/api/v2${path}`;
}

async function chromaRequest(path: string, init?: RequestInit): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(chromaURL(path), {
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      ...init,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Chroma ${response.status}: ${body}`);
    }

    const text = await response.text();
    return text.length === 0 ? null : JSON.parse(text);
  } finally {
    clearTimeout(timeout);
  }
}

export class ChromaVectorStore implements VectorStorePort {
  async add(chunks: Chunk[], vectors: number[][]): Promise<void> {
    if (chunks.length === 0) return;
    if (chunks.length !== vectors.length) {
      throw new VectorStoreError(
        new Error(
          `chunk/vector count mismatch: ${chunks.length} vs ${vectors.length}`,
        ),
      );
    }

    const ids = chunks.map((c) => c.id);
    const documents = chunks.map((c) => c.text);
    const metadatas = chunks.map((c) => c.metadata);
    const embeddings = vectors;

    await chromaRequest(`/collections/${COLLECTION}/add`, {
      method: "POST",
      body: JSON.stringify({ ids, documents, metadatas, embeddings }),
    });

    logger.debug({ count: chunks.length }, "chroma: added chunks");
  }

  async search(queryVector: number[], topK: number): Promise<SearchResult[]> {
    const data = await chromaRequest(
      `/collections/${COLLECTION}/query`,
      {
        method: "POST",
        body: JSON.stringify({
          query_embeddings: [queryVector],
          n_results: topK,
          include: ["documents", "metadatas", "distances"],
        }),
      },
    ) as {
      ids?: string[][];
      documents?: string[][];
      metadatas?: Record<string, unknown>[][];
      distances?: number[][];
    };

    const ids = (data.ids ?? [[]])[0] ?? [];
    const documents = (data.documents ?? [[]])[0] ?? [];
    const metadatas = (data.metadatas ?? [[]])[0] ?? [];
    const distances = (data.distances ?? [[]])[0] ?? [];

    const results: SearchResult[] = [];

    for (let i = 0; i < ids.length; i += 1) {
      // Chroma returns L2 distance; convert to cosine-like score in [0, 1].
      // score = 1 / (1 + distance) keeps ranking stable and bounded.
      const distance = distances[i] ?? 0;
      const score = 1 / (1 + distance);

      results.push({
        chunk: {
          id: ids[i] ?? "",
          text: documents[i] ?? "",
          metadata: (metadatas[i] ?? {}) as Record<string, unknown>,
        },
        score,
      });
    }

    return results;
  }

  async count(): Promise<number> {
    const data = (await chromaRequest(`/collections/${COLLECTION}/count`)) as {
      count?: number;
    };
    return data.count ?? 0;
  }

  async deleteByMetadata(key: string, value: unknown): Promise<void> {
    await chromaRequest(`/collections/${COLLECTION}/delete`, {
      method: "POST",
      body: JSON.stringify({ where: { [key]: value } }),
    });
    logger.debug({ key }, "chroma: deleted by metadata");
  }

  async deleteChunk(id: string): Promise<void> {
    await chromaRequest(`/collections/${COLLECTION}/delete`, {
      method: "POST",
      body: JSON.stringify({ ids: [id] }),
    });
    logger.debug({ id }, "chroma: deleted chunk");
  }

  async getAllChunks(): Promise<Chunk[]> {
    const data = (await chromaRequest(
      `/collections/${COLLECTION}/get`,
      {
        method: "POST",
        body: JSON.stringify({ include: ["documents", "metadatas"] }),
      },
    )) as {
      ids?: string[];
      documents?: string[];
      metadatas?: Record<string, unknown>[];
    };

    const ids = data.ids ?? [];
    const documents = data.documents ?? [];
    const metadatas = data.metadatas ?? [];

    return ids.map((id, i) => ({
      id,
      text: documents[i] ?? "",
      metadata: metadatas[i] ?? {},
    }));
  }
}
