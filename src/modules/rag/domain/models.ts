/**
 * Domain models for the RAG system.
 *
 * Pure data objects with no external dependencies.
 * No zod, no prisma, no langchain — plain TypeScript types only.
 */

export type FileType = "json" | "md" | "txt" | "pdf";

export interface DocumentMetadata {
  [key: string]: unknown;
}

/**
 * A raw document loaded from an external source (file, bytes, url).
 */
export interface RawDocument {
  content: string;
  metadata: DocumentMetadata;
}

/**
 * A chunk of text produced by splitting a RawDocument.
 *
 * id is deterministic: `${documentId}:${chunkIndex}`.
 */
export interface Chunk {
  id: string;
  text: string;
  metadata: DocumentMetadata;
}

/**
 * A single result from a vector store search.
 */
export interface SearchResult {
  chunk: Chunk;
  score: number;
}

/**
 * The final answer produced by the RAG pipeline.
 */
export interface Answer {
  text: string;
  sources: SearchResult[];
  cache: CacheHit;
}

export interface CacheHit {
  layer: "none" | "exact" | "semantic";
  hit: boolean;
}

/**
 * Metadata about an ingested document.
 */
export interface DocumentRecord {
  id: string;
  filename: string;
  originalFilename: string;
  sourcePath: string;
  fileType: FileType;
  chunkCount: number;
  ingestedAt: Date;
}

/**
 * A single message within a conversation.
 */
export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: Date;
}

/**
 * A chat conversation with history.
 */
export interface Conversation {
  id: string;
  title: string;
  messages: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
}
