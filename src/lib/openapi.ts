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
          content: { type: "string", example: "سلام" },
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
      "پلتفرم مشاورهٔ تحصیلی هوشمند. تمام endpointها Relative (same-origin) هستند؛ نیازی به NEXT_PUBLIC_API_BASE نیست.",
  },
  servers: [{ url: "/", description: "same-origin" }],
  tags: [
    { name: "documents", description: "مدیریت اسناد (CRUD، ingest، آپلود)" },
    { name: "conversations", description: "مکالمه‌ها" },
    { name: "chat", description: "چت و streaming پاسخ" },
    { name: "search", description: "جستجوی مستقیم در دانش" },
    { name: "admin", description: "داشبورد ادمین (چانک، آمار، کش)" },
    { name: "system", description: "سلامت، متریک" },
  ],
  paths: {
    "/api/documents": {
      get: {
        tags: ["documents"],
        summary: "لیست اسناد",
        responses: {
          "200": {
            description: "لیست اسناد",
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
        summary: "ingest سند (JSON)",
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
            description: "سند ingestion شد",
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
        summary: "جزئیات سند",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "جزئیات سند",
            content: {
              "application/json": {
                schema: SuccessResponse({ $ref: "#/components/schemas/DocumentRecord" }),
              },
            },
          },
          "404": { description: "سند یافت نشد", content: { "application/json": { schema: ErrorResponse } } },
        },
      },
      delete: {
        tags: ["documents"],
        summary: "حذف سند (اول Chroma، بعد Postgres)",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "حذف شد",
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
          "404": { description: "سند یافت نشد", content: { "application/json": { schema: ErrorResponse } } },
        },
      },
    },
    "/api/upload": {
      post: {
        tags: ["documents"],
        summary: "آپلود فایل multipart → ingest",
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
            description: "فایل آپلود و ingestion شد",
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
          "400": { description: "فایل ارائه نشده", content: { "application/json": { schema: ErrorResponse } } },
          "413": { description: "فایل بزرگتر از حد مجاز (۲۰ مگابایت)", content: { "application/json": { schema: ErrorResponse } } },
          "415": { description: "فرمت فایل پشتیبانی‌نشده", content: { "application/json": { schema: ErrorResponse } } },
        },
      },
    },
    "/api/conversations": {
      get: {
        tags: ["conversations"],
        summary: "لیست مکالمه‌ها",
        responses: {
          "200": {
            description: "لیست مکالمه‌ها",
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
        summary: "ایجاد مکالمه",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { title: { type: "string", example: "مکالمه جدید" } },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "مکالمه ایجاد شد",
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
        summary: "جزئیات مکالمه",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "جزئیات مکالمه",
            content: {
              "application/json": {
                schema: SuccessResponse({ $ref: "#/components/schemas/Conversation" }),
              },
            },
          },
          "404": { description: "مکالمه یافت نشد", content: { "application/json": { schema: ErrorResponse } } },
        },
      },
      put: {
        tags: ["conversations"],
        summary: "بروزرسانی عنوان مکالمه",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { title: { type: "string", example: "عنوان جدید" } },
                required: ["title"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "بروزرسانی شد",
            content: {
              "application/json": {
                schema: SuccessResponse({ $ref: "#/components/schemas/Conversation" }),
              },
            },
          },
          "404": { description: "مکالمه یافت نشد", content: { "application/json": { schema: ErrorResponse } } },
        },
      },
      delete: {
        tags: ["conversations"],
        summary: "حذف مکالمه",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "حذف شد",
            content: {
              "application/json": {
                schema: SuccessResponse({ type: "object", properties: { id: { type: "string" } }, required: ["id"] }),
              },
            },
          },
          "404": { description: "مکالمه یافت نشد", content: { "application/json": { schema: ErrorResponse } } },
        },
      },
    },
    "/api/chat": {
      post: {
        tags: ["chat"],
        summary: "پاسخ چت (عدم streaming)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  question: { type: "string", example: "machine learning چیست؟" },
                  topK: { type: "integer", minimum: 1, maximum: 100, example: 5 },
                },
                required: ["question"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "پاسخ چت",
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
        summary: "پاسخ چت با streaming (SSE)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  question: { type: "string", example: "machine learning چیست؟" },
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
                schema: { type: "string", example: "event: token\ndata: {\"text\":\"سلام\"}\n\n" },
              },
            },
          },
        },
      },
    },
    "/api/search": {
      post: {
        tags: ["search"],
        summary: "جستجوی مستقیم در دانش",
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
            description: "نتایج جستجو",
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
        summary: "لیست چانک‌ها",
        responses: {
          "200": {
            description: "لیست چانک‌ها",
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
        summary: "حذف چانک",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "چانک حذف شد",
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
        summary: "آمار سیستم",
        responses: {
          "200": {
            description: "آمار",
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
        summary: "پاک‌سازی کش",
        responses: {
          "200": {
            description: "کیش پاک شد",
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
        summary: "اشکال‌زدایی بازیابی",
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
            description: "اشکال‌زدایی بازیابی",
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
        summary: "متریک Prometheus (text format)",
        responses: {
          "200": {
            description: "متن متریک Prometheus",
            content: { "text/plain": { schema: { type: "string" } } },
          },
        },
      },
    },
    "/api/health": {
      get: {
        tags: ["system"],
        summary: "سلامت وابستگی‌ها",
        responses: {
          "200": {
            description: "وضعیت سلامت",
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
                    models: { type: "object", example: { embedding: "nvidia/llama-nemotron-embed-vl-1b-v2:free", llm: "nvidia/nemotron-3-ultra-550b-a55b:free" } },
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
