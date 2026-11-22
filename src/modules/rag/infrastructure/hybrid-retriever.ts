/**
 * Hybrid Retriever.
 *
 * Port of mr-rag/app/infrastructure/hybrid_retriever.py::HybridRetriever.
 *
 * Fuses BM25 keyword search with dense vector search using weighted
 * Reciprocal Rank Fusion (RRF, k=60). BM25 index is built from the vector
 * store's chunks and rebuilt automatically when the chunk count changes.
 *
 * The dense side uses the injected VectorStorePort; the caller supplies the
 * query embedding so the embedding API is not called inside this adapter.
 */

import { Document } from "@langchain/core/documents";
import { BM25Retriever } from "@langchain/community/retrievers/bm25";
import { logger } from "@/shared/logger";
import type { SearchResult } from "@/modules/rag/domain/models";
import type {
  EmbeddingProviderPort,
  RetrieverPort,
  VectorStorePort,
} from "@/modules/rag/domain/ports";
import { persianPreprocess } from "@/modules/rag/application/persian-tokenizer";

const DEFAULT_RRF_K = 60;

/**
 * Fuse two ranked lists with weighted Reciprocal Rank Fusion.
 *
 * Mirrors oracle `_fuse`: score += weight / (rrf_k + rank + 1),
 * then normalise by dividing by top_score (0-1 range).
 */
function rrfFuse(
  bm25Results: SearchResult[],
  denseResults: SearchResult[],
  bm25Weight: number,
  rrfK: number,
): SearchResult[] {
  const fused: Map<string, { result: SearchResult; score: number }> = new Map();

  const add = (items: SearchResult[], weight: number) => {
    for (let rank = 0; rank < items.length; rank += 1) {
      const item = items[rank];
      const key = item.chunk.id || item.chunk.text.slice(0, 200);
      const entry =
        fused.get(key) ?? { result: item, score: 0 };
      entry.score += weight / (rrfK + rank + 1);
      if (item.score > entry.result.score) {
        entry.result = item;
      }
      fused.set(key, entry);
    }
  };

  add(bm25Results, bm25Weight);
  add(denseResults, 1 - bm25Weight);

  const ordered = Array.from(fused.values()).sort(
    (a, b) => b.score - a.score,
  );

  const topScore = ordered[0]?.score ?? 0;
  return ordered.map((entry) => ({
    chunk: entry.result.chunk,
    score: topScore > 0 ? round4(entry.score / topScore) : 0,
  }));
}

function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}

/**
 * Convert LangChain Documents to domain SearchResults.
 * BM25 exposes no similarity score, so rank position is mapped onto a
 * descending score (mirrors oracle `_to_search_results`).
 */
function toSearchResults(
  docs: Document[],
): SearchResult[] {
  return docs.map((doc, i) => ({
    chunk: {
      id: doc.metadata.id ?? "",
      text: doc.pageContent,
      metadata: { ...doc.metadata },
    },
    // Higher rank = higher score; first doc gets 1.0, decaying afterwards
    score: round4(1 - i * 0.01),
  }));
}

export class HybridRetriever implements RetrieverPort {
  private readonly vectorStore: VectorStorePort;
  private readonly embeddingProvider: EmbeddingProviderPort;
  private readonly bm25Weight: number;
  private readonly rrfK: number;

  private _bm25: BM25Retriever | null = null;
  private _indexedCount = -1;

  constructor(options: {
    vectorStore: VectorStorePort;
    embeddingProvider: EmbeddingProviderPort;
    bm25Weight?: number;
    rrfK?: number;
  }) {
    this.vectorStore = options.vectorStore;
    this.embeddingProvider = options.embeddingProvider;
    this.bm25Weight = options.bm25Weight ?? 0.4;
    this.rrfK = options.rrfK ?? DEFAULT_RRF_K;
  }

  /**
   * Run a hybrid search and return fused results.
   *
   * @param query - Raw query text (used by BM25).
   * @param queryEmbedding - Query embedding (used by dense side).
   * @param topK - Number of results to return.
   * @param fetchK - Candidate pool size per retriever (>= topK).
   */
  async search(
    query: string,
    queryEmbedding: number[],
    topK: number,
    fetchK?: number,
  ): Promise<SearchResult[]> {
    const pool = Math.max(fetchK ?? 20, topK);

    let bm25Docs: SearchResult[] = [];
    try {
      bm25Docs = await this._bm25Search(query, pool);
    } catch (error) {
      logger.warn({ err: error }, "Hybrid: BM25 search failed");
    }

    let denseDocs: SearchResult[] = [];
    try {
      denseDocs = await this._denseSearch(queryEmbedding, pool);
    } catch (error) {
      logger.warn({ err: error }, "Hybrid: dense search failed");
    }

    if (bm25Docs.length === 0) {
      logger.info("Hybrid: BM25 returned nothing, using dense results only");
      return denseDocs.slice(0, topK);
    }

    if (denseDocs.length === 0) {
      logger.info("Hybrid: dense returned nothing, using BM25 results only");
      return bm25Docs.slice(0, topK);
    }

    const fused = rrfFuse(bm25Docs, denseDocs, this.bm25Weight, this.rrfK);
    logger.info(
      {
        bm25: bm25Docs.length,
        dense: denseDocs.length,
        fused: fused.length,
        bm25Weight: this.bm25Weight,
      },
      "Hybrid retrieval",
    );
    return fused.slice(0, topK);
  }

  // ------------------------------------------------------------------
  // Retrievers
  // ------------------------------------------------------------------

  private async _ensureBM25(): Promise<boolean> {
    let currentCount: number;
    try {
      currentCount = await this.vectorStore.count();
    } catch (error) {
      logger.warn(
        { err: error },
        "Hybrid: cannot count vector store for BM25 rebuild",
      );
      return false;
    }

    if (this._bm25 !== null && currentCount === this._indexedCount) {
      return true;
    }

    try {
      const chunks = await this.vectorStore.getAllChunks();
      if (chunks.length === 0) {
        this._bm25 = null;
        this._indexedCount = 0;
        return false;
      }

      const docs = chunks.map(
        (c) =>
          new Document({
            pageContent: c.text,
            metadata: { ...c.metadata, id: c.id },
          }),
      );

      this._bm25 = BM25Retriever.fromDocuments(docs, {
        k: 20,
        includeScore: false,
      });
      this._indexedCount = currentCount;

      logger.info(
        { count: chunks.length },
        "Hybrid: BM25 index built",
      );
      return true;
    } catch (error) {
      logger.warn({ err: error }, "Hybrid: cannot build BM25 index");
      this._bm25 = null;
      this._indexedCount = -1;
      return false;
    }
  }

  private async _bm25Search(query: string, pool: number): Promise<SearchResult[]> {
    const ok = await this._ensureBM25();
    if (!ok || !this._bm25) {
      return [];
    }

    // BM25Retriever uses its own tokenization; to match the oracle's
    // persian_preprocess we pre-tokenize and rejoin with spaces so the
    // internal splitter sees the same tokens.
    const tokens = persianPreprocess(query);
    const preprocessedQuery = tokens.join(" ");

    const docs = await this._bm25.invoke(preprocessedQuery);

    return toSearchResults(docs as Document[]).slice(0, pool);
  }

  private async _denseSearch(
    queryEmbedding: number[],
    pool: number,
  ): Promise<SearchResult[]> {
    const results = await this.vectorStore.search(queryEmbedding, pool);
    return results.slice(0, pool);
  }
}
