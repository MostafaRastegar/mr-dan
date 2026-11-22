/**
 * Presentation layer: Zod schemas + HTTP helpers.
 *
 * Keeps route handlers thin: parse → use case → serialize.
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

export type IngestRequest = z.infer<typeof ingestRequestSchema>;
export type SearchRequest = z.infer<typeof searchRequestSchema>;

/** Successful JSON response wrapper. */
export function jsonOk<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

/** Map domain errors to HTTP responses. */
export function toHttpError(error: unknown, requestId: string): Response {
  const isAppError = (e: unknown): e is { code: string; status: number; message: string } =>
    typeof e === "object" && e !== null && "code" in e && "status" in e && "message" in e;

  const appErr = isAppError(error) ? error : null;

  const status = appErr?.status ?? 500;
  const code = appErr?.code ?? "internal_error";
  const message = appErr?.message ?? "An unexpected error occurred";

  // In production, never leak internal details
  const safeMessage = process.env.NODE_ENV === "production" && status >= 500 ? "Internal server error" : message;

  return new Response(
    JSON.stringify({ error: { code, message: safeMessage, requestId } }),
    {
      status,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    },
  );
}

export function requestIdHeader(headers: Headers): string {
  return headers.get("x-request-id") ?? crypto.randomUUID();
}

/** Serialize a value as an SSE event. */
export function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/** Build an SSE text/event-stream Response from a ReadableStream. */
export function sseResponse(stream: ReadableStream): Response {
  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
