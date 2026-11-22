/**
 * Presentation layer: Zod schemas for request validation.
 */

import { z } from "zod";

export const ingestRequestSchema = z.object({
  filePath: z.string().min(1),
  originalFilename: z.string().min(1),
  fileType: z.enum(["json", "md", "txt", "pdf"]),
});

export const searchRequestSchema = z.object({
  question: z.string().min(1),
  topK: z.coerce.number().int().positive().max(100).optional(),
});

export const chatRequestSchema = z.object({
  question: z.string().min(1),
  topK: z.coerce.number().int().positive().max(100).optional(),
});

export type IngestRequest = z.infer<typeof ingestRequestSchema>;
export type SearchRequest = z.infer<typeof searchRequestSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;

export const createConversationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
});

export const updateConversationSchema = z.object({
  title: z.string().min(1).max(200),
});

export type CreateConversationRequest = z.infer<
  typeof createConversationSchema
>;
export type UpdateConversationRequest = z.infer<
  typeof updateConversationSchema
>;

/** Response schemas used for OpenAPI spec generation. */

/** A stored document record returned by the documents API. */
export const documentRecordSchema = z.object({
  id: z.string().describe("Document ID"),
  filename: z.string().describe("Stored filename"),
  originalFilename: z.string().describe("Original uploaded filename"),
  sourcePath: z.string().describe("Filesystem path"),
  fileType: z.enum(["json", "md", "txt", "pdf"]).describe("Document file type"),
  chunkCount: z.number().int().describe("Number of chunks"),
  ingestedAt: z.string().datetime().describe("Ingestion timestamp"),
});

/** A single text chunk belonging to a document. */
export const chunkSchema = z.object({
  id: z.string().describe("Chunk ID"),
  text: z.string().describe("Chunk text"),
  metadata: z.record(z.string(), z.unknown()).describe("Chunk metadata"),
});

/** A chunk with its relevance score from a search. */
export const searchResultSchema = z.object({
  chunk: chunkSchema,
  score: z.number().describe("Relevance score"),
});

/** The answer returned by a chat or search request. */
export const answerSchema = z.object({
  text: z.string().describe("Answer text"),
  sources: z.array(searchResultSchema).describe("Source chunks"),
  cache: z
    .object({
      layer: z.enum(["none", "exact", "semantic"]).describe("Cache layer"),
      hit: z.boolean().describe("Cache hit flag"),
    })
    .describe("Cache info"),
});

/** A conversation message. */
export const messageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]).describe("Message role"),
  content: z.string().describe("Message content"),
  timestamp: z.string().datetime().describe("Message timestamp"),
});

/** A conversation with its messages. */
export const conversationSchema = z.object({
  id: z.string().describe("Conversation ID"),
  title: z.string().describe("Conversation title"),
  messages: z.array(messageSchema).describe("Messages"),
  createdAt: z.string().datetime().describe("Created at"),
  updatedAt: z.string().datetime().describe("Updated at"),
});

/** Standard error envelope returned by all endpoints. */
export const errorResponseSchema = z.object({
  error: z
    .object({
      code: z.string().describe("Error code"),
      message: z.string().describe("Human-readable message"),
      requestId: z.string().describe("Request ID"),
    })
    .describe("Error details"),
});

export type DocumentRecord = z.infer<typeof documentRecordSchema>;
export type Chunk = z.infer<typeof chunkSchema>;
export type SearchResult = z.infer<typeof searchResultSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type Conversation = z.infer<typeof conversationSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
