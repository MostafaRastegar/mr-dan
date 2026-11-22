/**
 * Domain ports (contracts) for the RAG system.
 *
 * High-level code depends on these abstractions, never on concrete
 * implementations. Infrastructure adapters implement these ports.
 */

import type { Chunk, DocumentRecord, RawDocument, SearchResult } from "./models";

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
