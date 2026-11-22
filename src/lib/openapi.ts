/**
 * OpenAPI 3.0 specification for the mr-dan RAG API.
 *
 * Single source of truth for all HTTP endpoints. Served at /api/openapi
 * and rendered by Swagger UI at /api-docs.
 *
 * Kept in TypeScript (not YAML) to avoid adding a yaml dependency.
 */

export type OpenAPI = {
  openapi: string;
  info: { title: string; version: string; description: string };
  servers: Array<{ url: string; description?: string }>;
  paths: Record<string, unknown>;
  components: {
    schemas: Record<string, unknown>;
    responses?: Record<string, unknown>;
  };
  tags: Array<{ name: string; description?: string }>;
};

const DocumentRecord = {
  type: "object",
  properties: {
    id: { type: "string", example: "doc:a1b2c3d4" },
    filename: { type: "string", example: "e2e-test.txt" },
    originalFilename: { type: "string", example: "e2e-test.txt" },
    sourcePath: { type: "string", example: "/tmp/mr-dan-uploads/abc-e2e-test.txt" },
    fileType: { type: "string", enum: ["json", "md", "txt", "pdf"], example: "txt" },
    chunkCount: { type: "integer", example: 3 },
    ingestedAt: { type: "string", format: "date-time", example: "2026-11-22T14:00:00Z" },
  },
  required: ["id", "filename", "originalFilename", "sourcePath", "fileType", "chunkCount", "ingestedAt"],
} as const;

const Chunk = {
  type: "object",
  properties: {
    id: { type: "string", example: "doc:a1b2c3d4:0" },
    text: { type: "string", example: "machine learning is a branch of AI" },
    metadata: { type: "object", example: { document_id: "doc:a1b2c3d4", original_filename: "e2e-test.txt" } },
  },
  required: ["id", "text", "metadata"],
} as const;

const SearchResult = {
  type: "object",
  properties: {
    chunk: { $ref: "#/components/schemas/Chunk" },
    score: { type: "number", example: 0.82 },
  },
  required: ["chunk", "score"],
} as const;

const Answer = {
  type: "object",
  properties: {
    text: { type: "string", example: "Machine learning is a branch of artificial intelligence." },
    sources: { type: "array", items: { $ref: "#/components/schemas/SearchResult" } },
    cache: {
      type: "object",
      properties: {
        layer: { type: "string", enum: ["none", "exact", "semantic"], example: "none" },
        hit: { type: "boolean", example: false },
      },
      required: ["layer", "hit"],
    },
  },
  required: ["text", "sources", "cache"],
} as const;

const Conversation = {
  type: "object",
  properties: {
    id: { type: "string", example: "conv:123" },
    title: { type: "string", example: "Integration test convo" },
    messages: {
      type: "array",
      items: {
        type: "object",
        properties: {
          role: { type: "string", enum: ["user", "assistant", "system"], example: "user" },
          content: { type: "string", example: "Hello" },
          timestamp: { type: "string", format: "date-time" },
        },
        required: ["role", "content"],
      },
    },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
  required: ["id", "title", "messages", "createdAt", "updatedAt"],
} as const;

const ErrorResponse = {
  type: "object",
  properties: {
    error: {
      type: "object",
      properties: {
        code: { type: "string", example: "not_found" },
        message: { type: "string", example: "Document not found" },
        requestId: { type: "string", example: "550e8400-e29b-41d4-a716-446655440000" },
      },
      required: ["code", "message", "requestId"],
    },
  },
  required: ["error"],
} as const;

const SuccessResponse = (dataSchema: unknown) => ({
  type: "object",
  properties: { data: dataSchema },
  required: ["data"],
});

export const openApiSpec: OpenAPI = {
  openapi: "3.0.1",
  info: {
    title: "mr-dan RAG API",
    version: "1.0.0",
    description:
      "Smart academic advising platform. All endpoints are relative (same-origin); no NEXT_PUBLIC_API_BASE is required.",
  },
  servers: [{ url: "/", description: "same-origin" }],
  tags: [
    { name: "documents", description: "Document management (CRUD, ingest, upload)" },
    { name: "conversations", description: "Conversations" },
    { name: "chat", description: "Chat and streaming responses" },
    { name: "search", description: "Direct knowledge search" },
    { name: "admin", description: "Admin dashboard (chunks, stats, cache)" },
    { name: "system", description: "Health, metrics" },
  ],
  paths: {
    "/api/documents": {
      get: {
        tags: ["documents"],
        summary: "List documents",
        responses: {
          "200": {
            description: "Document list",
            content: {
              "application/json": {
                schema: SuccessResponse({
                  type: "array",
                  items: { $ref: "#/components/schemas/DocumentRecord" },
                }),
              },
            },
          },
        },
      },
      post: {
        tags: ["documents"],
        summary: "Ingest a document (JSON)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  filePath: { type: "string", example: "/path/to/file.txt" },
                  originalFilename: { type: "string", example: "file.txt" },
                  fileType: { type: "string", enum: ["json", "md", "txt", "pdf"], example: "txt" },
                },
                required: ["filePath", "originalFilename", "fileType"],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Document ingested",
            content: {
              "application/json": {
                schema: SuccessResponse({
                  type: "object",
                  properties: {
                    document: { $ref: "#/components/schemas/DocumentRecord" },
                    chunkCount: { type: "integer", example: 3 },
                    cached: { type: "boolean", example: false },
                  },
                  required: ["document", "chunkCount", "cached"],
                }),
              },
            },
          },
        },
      },
    },
    "/api/documents/{id}": {
      get: {
        tags: ["documents"],
        summary: "Document details",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Document details",
            content: {
              "application/json": {
                schema: SuccessResponse({ $ref: "#/components/schemas/DocumentRecord" }),
              },
            },
          },
          "404": { description: "Document not found", content: { "application/json": { schema: ErrorResponse } } },
        },
      },
      delete: {
        tags: ["documents"],
        summary: "Delete document (Chroma first, then Postgres)",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Deleted",
            content: {
              "application/json": {
                schema: SuccessResponse({
                  type: "object",
                  properties: {
                    id: { type: "string", example: "doc:a1b2c3d4" },
                    chunksDeleted: { type: "boolean", example: true },
                  },
                  required: ["id", "chunksDeleted"],
                }),
              },
            },
          },
          "404": { description: "Document not found", content: { "application/json": { schema: ErrorResponse } } },
        },
      },
    },
    "/api/upload": {
      post: {
        tags: ["documents"],
        summary: "Upload file multipart → ingest",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: { type: "string", format: "binary" },
                },
                required: ["file"],
              },
              encoding: {
                file: { contentType: { type: "string" }, headers: { "Content-Disposition": { type: "string", example: "form-data; name=\"file\"; filename=\"e2e-test.txt\"" } } },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "File uploaded and ingested",
            content: {
              "application/json": {
                schema: SuccessResponse({
                  type: "object",
                  properties: {
                    document: { $ref: "#/components/schemas/DocumentRecord" },
                    chunkCount: { type: "integer", example: 3 },
                    cached: { type: "boolean", example: false },
                  },
                  required: ["document", "chunkCount", "cached"],
                }),
              },
            },
          },
          "400": { description: "No file provided", content: { "application/json": { schema: ErrorResponse } } },
          "413": { description: "File exceeds the limit (20 MB)", content: { "application/json": { schema: ErrorResponse } } },
          "415": { description: "Unsupported file format", content: { "application/json": { schema: ErrorResponse } } },
        },
      },
    },
    "/api/conversations": {
      get: {
        tags: ["conversations"],
        summary: "List conversations",
        responses: {
          "200": {
            description: "Conversation list",
            content: {
              "application/json": {
                schema: SuccessResponse({
                  type: "array",
                  items: { $ref: "#/components/schemas/Conversation" },
                }),
              },
            },
          },
        },
      },
      post: {
        tags: ["conversations"],
        summary: "Create conversation",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { title: { type: "string", example: "New conversation" } },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Conversation created",
            content: {
              "application/json": {
                schema: SuccessResponse({ $ref: "#/components/schemas/Conversation" }),
              },
            },
          },
        },
      },
    },
    "/api/conversations/{id}": {
      get: {
        tags: ["conversations"],
        summary: "Conversation details",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Conversation details",
            content: {
              "application/json": {
                schema: SuccessResponse({ $ref: "#/components/schemas/Conversation" }),
              },
            },
          },
          "404": { description: "Conversation not found", content: { "application/json": { schema: ErrorResponse } } },
        },
      },
      put: {
        tags: ["conversations"],
        summary: "Update conversation title",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { title: { type: "string", example: "New title" } },
                required: ["title"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated",
            content: {
              "application/json": {
                schema: SuccessResponse({ $ref: "#/components/schemas/Conversation" }),
              },
            },
          },
          "404": { description: "Conversation not found", content: { "application/json": { schema: ErrorResponse } } },
        },
      },
      delete: {
        tags: ["conversations"],
        summary: "Delete conversation",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Deleted",
            content: {
              "application/json": {
                schema: SuccessResponse({ type: "object", properties: { id: { type: "string" } }, required: ["id"] }),
              },
            },
          },
          "404": { description: "Conversation not found", content: { "application/json": { schema: ErrorResponse } } },
        },
      },
    },
    "/api/chat": {
      post: {
        tags: ["chat"],
        summary: "Chat answer (no streaming)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  question: { type: "string", example: "What is machine learning?" },
                  topK: { type: "integer", minimum: 1, maximum: 100, example: 5 },
                },
                required: ["question"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Chat answer",
            content: {
              "application/json": {
                schema: SuccessResponse({ $ref: "#/components/schemas/Answer" }),
              },
            },
          },
        },
      },
    },
    "/api/chat/stream": {
      post: {
        tags: ["chat"],
        summary: "Chat answer with streaming (SSE)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  question: { type: "string", example: "What is machine learning?" },
                  topK: { type: "integer", minimum: 1, maximum: 100, example: 5 },
                },
                required: ["question"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "SSE event stream",
            content: {
              "text/event-stream": {
                schema: { type: "string", example: "event: token\ndata: {\"text\":\"Hello\"}\n\n" },
              },
            },
          },
        },
      },
    },
    "/api/search": {
      post: {
        tags: ["search"],
        summary: "Direct knowledge search",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  question: { type: "string", example: "machine learning" },
                  topK: { type: "integer", minimum: 1, maximum: 100, example: 5 },
                },
                required: ["question"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Search results",
            content: {
              "application/json": {
                schema: SuccessResponse({
                  type: "object",
                  properties: {
                    answer: {
                      type: "object",
                      properties: {
                        sources: { type: "array", items: { $ref: "#/components/schemas/SearchResult" } },
                      },
                      required: ["sources"],
                    },
                  },
                  required: ["answer"],
                }),
              },
            },
          },
        },
      },
    },
    "/api/admin/chunks": {
      get: {
        tags: ["admin"],
        summary: "List chunks",
        responses: {
          "200": {
            description: "Chunk list",
            content: {
              "application/json": {
                schema: SuccessResponse({
                  type: "array",
                  items: { $ref: "#/components/schemas/Chunk" },
                }),
              },
            },
          },
        },
      },
    },
    "/api/admin/chunks/{id}": {
      delete: {
        tags: ["admin"],
        summary: "Delete chunk",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Chunk deleted",
            content: {
              "application/json": {
                schema: SuccessResponse({ type: "object", properties: { id: { type: "string" } }, required: ["id"] }),
              },
            },
          },
        },
      },
    },
    "/api/admin/stats": {
      get: {
        tags: ["admin"],
        summary: "System stats",
        responses: {
          "200": {
            description: "Stats",
            content: {
              "application/json": {
                schema: SuccessResponse({
                  type: "object",
                  properties: {
                    documents: { type: "integer", example: 5 },
                    chunks: { type: "integer", example: 24 },
                    conversations: { type: "integer", example: 2 },
                    cache: {
                      type: "object",
                      properties: {
                        exact: { type: "integer", example: 10 },
                        semantic: { type: "integer", example: 3 },
                      },
                      required: ["exact", "semantic"],
                    },
                    upstream: { type: "object", example: { postgres: "ok", chroma: "ok" } },
                  },
                  required: ["documents", "chunks", "conversations", "cache", "upstream"],
                }),
              },
            },
          },
        },
      },
    },
    "/api/admin/cache/clear": {
      post: {
        tags: ["admin"],
        summary: "Clear cache",
        responses: {
          "200": {
            description: "Cache cleared",
            content: {
              "application/json": {
                schema: SuccessResponse({ type: "object", properties: { cleared: { type: "boolean", example: true } }, required: ["cleared"] }),
              },
            },
          },
        },
      },
    },
    "/api/admin/retrieval/debug": {
      post: {
        tags: ["admin"],
        summary: "Retrieval debugging",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  question: { type: "string", example: "machine learning" },
                  topK: { type: "integer", minimum: 1, maximum: 100, example: 5 },
                },
                required: ["question"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Retrieval debugging",
            content: {
              "application/json": {
                schema: SuccessResponse({ type: "object" }),
              },
            },
          },
        },
      },
    },
    "/api/metrics": {
      get: {
        tags: ["system"],
        summary: "Prometheus metrics (text format)",
        responses: {
          "200": {
            description: "Prometheus metrics text",
            content: { "text/plain": { schema: { type: "string" } } },
          },
        },
      },
    },
    "/api/health": {
      get: {
        tags: ["system"],
        summary: "Dependency health",
        responses: {
          "200": {
            description: "Health status",
            content: {
              "application/json": {
                schema: SuccessResponse({
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    dependencies: {
                      type: "object",
                      properties: {
                        postgres: { type: "string", example: "ok" },
                        chroma: { type: "string", example: "ok" },
                      },
                      required: ["postgres", "chroma"],
                    },
                    models: { type: "object", example: { embedding: "nvidia/nemotron-3.5-embed-8b:free", llm: "nvidia/nemotron-3-ultra-550b-a55b:free" } },
                    version: { type: "string", example: "1.0.0" },
                  },
                  required: ["status", "dependencies", "models", "version"],
                }),
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      DocumentRecord,
      Chunk,
      SearchResult,
      Answer,
      Conversation,
      ErrorResponse,
    },
  },
};
