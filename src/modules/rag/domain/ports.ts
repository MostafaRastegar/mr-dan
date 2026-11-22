/**
 * Domain ports (contracts) for the RAG system.
 *
 * High-level code depends on these abstractions, never on concrete
 * implementations. Infrastructure adapters implement these ports.
 */

import type { Answer, Chunk, DocumentRecord, RawDocument, SearchResult } from "./models";

/**
 * Loads a raw document from a file path or bytes.
 */
export interface DocumentLoaderPort {
  /**
   * Returns true if this loader can handle the given file path / mime type.
   */
  supports(filePath: string): boolean;
  load(filePath: string): Promise<RawDocument>;
}

/**
 * Persists and queries document records.
 */
export interface DocumentRepositoryPort {
  findByContentHash(contentHash: string): Promise<DocumentRecord | null>;
  findById(id: string): Promise<DocumentRecord | null>;
  list(): Promise<DocumentRecord[]>;
  create(record: Omit<DocumentRecord, "id" | "ingestedAt"> & { contentHash: string }): Promise<DocumentRecord>;
  delete(id: string): Promise<void>;
}

/**
 * Vector store: add, search, delete chunks.
 */
export interface VectorStorePort {
  add(chunks: Chunk[], vectors: number[][]): Promise<void>;
  search(queryVector: number[], topK: number): Promise<SearchResult[]>;
  count(): Promise<number>;
  deleteByMetadata(key: string, value: unknown): Promise<void>;
  deleteChunk(id: string): Promise<void>;
  getAllChunks(): Promise<Chunk[]>;
}

/**
 * Generates embeddings for text.
 */
export interface EmbeddingProviderPort {
  embedDocuments(texts: string[]): Promise<number[][]>;
  embedQuery(text: string): Promise<number[]>;
}

/**
 * Splits a document into chunks.
 */
export interface TextSplitterPort {
  split(document: RawDocument): Chunk[];
}

/**
 * Persists chat conversations.
 */
export interface ConversationRepositoryPort {
  create(record: {
    title: string;
  }): Promise<{
    id: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
    messageCount: number;
  }>;
  list(): Promise<Array<{
    id: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
    messageCount: number;
  }>>;
  findById(id: string): Promise<{
    id: string;
    title: string;
    messages: Array<{
      id: string;
      role: string;
      content: string;
      sources: unknown;
      createdAt: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
  } | null>;
  updateTitle(id: string, title: string): Promise<void>;
  delete(id: string): Promise<void>;
}

/**
 * Persists chat messages.
 */
export interface MessageRepositoryPort {
  create(record: {
    conversationId: string;
    role: string;
    content: string;
    sources?: unknown;
  }): Promise<{
    id: string;
    conversationId: string;
    role: string;
    content: string;
    sources: unknown;
    createdAt: Date;
  }>;
}

/**
 * Persists ingestion run records.
 */
export interface IngestionRunRepositoryPort {
  create(run: {
    documentId?: string;
    status: "started" | "succeeded" | "failed";
    chunkCount: number;
    error?: string;
  }): Promise<string>;
  update(
    id: string,
    patch: Partial<{ status: string; chunkCount: number; error: string }>,
  ): Promise<void>;
}

/**
 * Generic cache with TTL.
 */
export interface CachePort<T> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Health probe for infrastructure dependencies (Postgres, Chroma).
 */
export interface HealthProbe {
  readonly name: string;
  check(): Promise<void>;
}

/**
 * Chat LLM: generates text from a list of messages.
 */
export interface LLMPort {
  /**
   * Generate a completion. Returns the assistant message text.
   */
  complete(messages: { role: string; content: string }[]): Promise<string>;

  /**
   * Stream a completion, yielding text tokens as they arrive.
   * When `signal` aborts, the provider must stop streaming and resolve.
   */
  completeStream(
    messages: { role: string; content: string }[],
    onToken: (token: string) => void,
    options?: { signal?: AbortSignal },
  ): Promise<void>;
}

/**
 * Retriever: hybrid (BM25 + dense) search with RRF fusion.
 */
export interface RetrieverPort {
  /**
   * Search for chunks matching the query.
   *
   * @param query - Raw query text (used by BM25 side).
   * @param queryEmbedding - Query embedding vector (used by dense side).
   * @param topK - Number of results to return.
   * @param fetchK - Candidate pool size per retriever (>= topK).
   */
  search(
    query: string,
    queryEmbedding: number[],
    topK: number,
    fetchK?: number,
  ): Promise<SearchResult[]>;
}

/**
 * LLM-based reranker: scores candidate passages for a query.
 */
export interface RerankPort {
  /**
   * Rerank search results for a query, returning the best `topK` first.
   * Falls back to incoming order on failure.
   */
  rerank(
    query: string,
    results: SearchResult[],
    topK: number,
  ): Promise<SearchResult[]>;
}

/**
 * RAG cache: exact (keyed by hash) and semantic (keyed by embedding cosine).
 */
export interface RAGCachePort {
  /**
   * Exact cache lookup by key. Returns null on miss or expired entry.
   */
  getExact(key: string): Promise<Answer | null>;
  /**
   * Store in exact cache with TTL (seconds).
   */
  setExact(key: string, value: Answer, ttlSeconds: number): Promise<void>;
  /**
   * Semantic cache lookup by embedding vector.
   * Returns null on miss, expired entry, or no entry above similarity threshold.
   */
  getSemantic(embedding: number[]): Promise<Answer | null>;
  /**
   * Store in semantic cache with its embedding and TTL (seconds).
   * Evicts oldest entry when over max size.
   */
  setSemantic(embedding: number[], value: Answer, ttlSeconds: number): Promise<void>;
  /**
   * Clear all cache entries.
   */
  clear(): Promise<void>;

  /**
   * Number of entries currently held in each layer.
   */
  size(): Promise<{ exact: number; semantic: number }>;
}

