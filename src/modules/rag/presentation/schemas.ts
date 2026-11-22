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
