---
name: mr-dan-api
description: Next.js route handlers with Zod validation, typed error mapping, SSE streaming, OpenAPI sync, and Node runtime rules
---

# mr-dan-api

## Usage

Use when adding or changing a route, request/response contract, SSE stream, OpenAPI spec, or HTTP error mapping.

## Route template

```ts
import { NextRequest } from "next/server";
import { getContainer } from "@/server/container";
import { chatRequestSchema } from "@/modules/rag/presentation/schemas";
import { toHttpError, jsonOk } from "@/modules/rag/presentation/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const body = chatRequestSchema.parse(await req.json());
    const answer = await getContainer().askQuestion.execute(body);
    return jsonOk(answer);
  } catch (error) {
    return toHttpError(error, requestId);
  }
}
```

## Rules

1. `runtime = "nodejs"` for every route that touches Chroma, Prisma, the filesystem or OpenRouter. Edge is banned.
2. Every input is parsed with zod; `as` on a body is banned.
3. A route is only parse → use case → serialize, at most 40 lines (enforced by the architecture test).
4. Successful responses have one shape everywhere: data or `{ data }`; pick one and keep it.
5. Errors are always `{ error: { code, message, requestId } }`.
6. `requestId` appears in logs and in the response; internal details never reach the response in production.
7. Uploads check size and MIME before reading the whole body.
8. No secret or stack trace in any response.
9. In-app mutations are Server Actions, not routes. No route handler is added for an internal form.

## SSE protocol

```text
Content-Type: text/event-stream
Cache-Control: no-cache, no-transform
Connection: keep-alive
X-Accel-Buffering: no

event: meta
data: {"requestId":"...","cache":"miss"}

event: token
data: {"text":"..."}

event: sources
data: [{"content":"...","metadata":{},"score":0.82}]

event: done
data: {}
```

- An error after the stream has started becomes `event: error` with a code, not HTTP 500.
- `request.signal` is forwarded upstream and the source closes on abort.
- Flush every event; never buffer.
- Incompatible clients get the same endpoint; no hidden fallback.

## Error mapping

| Error | status | code |
|---|---|---|
| `ValidationError` / ZodError | 400 | `invalid_input` |
| `UnauthorizedError` | 401 | `unauthorized` |
| `ForbiddenError` | 403 | `forbidden` |
| `NotFoundError` | 404 | `not_found` |
| `UnsupportedFileError` | 415 | `unsupported_file` |
| `PayloadTooLargeError` | 413 | `payload_too_large` |
| `DocumentLoadError` | 422 | `document_load_failed` |
| `EmbeddingError` / `VectorStoreError` / `UpstreamError` | 502 | `upstream_failed` |
| `RetrievalError` / unknown | 500 | `internal_error` |

## OpenAPI sync (in the same change)

- The spec is hand-written in `src/lib/openapi.ts`; there is no generator and none may be added.
- Any new/removed route or changed signature/auth means the path, schema, status and description are updated in the same change.
- `GET /api/openapi` (JSON) and `/api-docs` (Swagger UI) must both return 200.

## Checklist

- [ ] The schema lives in `presentation/schemas.ts`, not inside the route.
- [ ] The route stays under 40 lines.
- [ ] `runtime` is explicit.
- [ ] Errors pass through `toHttpError`.
- [ ] SSE event order is respected.
- [ ] Abort is tested.
- [ ] No direct Prisma/Chroma query in a route.
- [ ] OpenAPI spec updated.

## Anti-patterns

- `await req.json()` without a schema.
- Returning raw `error.message`.
- Scattered `cache: "no-store"` instead of `dynamic`.
- Writing chunking logic inside the upload route.
- Two endpoints for one job (one for the UI, one for the API).
