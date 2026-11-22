---
name: mr-dan-api
description: Next.js route handlers with Zod validation, typed error mapping, SSE streaming, and Node runtime rules
---

# mr-dan-api

## Usage

هنگام افزودن/تغییر route، قرارداد request/response، SSE، یا نگاشت خطا به HTTP.

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

1. `runtime = "nodejs"` برای هر route که به Chroma، Prisma، فایل یا OpenRouter دست می‌زند. Edge ممنوع.
2. هر ورودی با zod parse می‌شود؛ `as` روی body ممنوع.
3. route فقط parse → use case → serialize است.
4. پاسخ موفق یک شکل دارد: داده یا `{ data }`؛ یک شکل را انتخاب کن و همه‌جا حفظ کن.
5. خطا همیشه `{ error: { code, message, requestId } }`.
6. `requestId` در log و پاسخ هست؛ در production جزئیات داخلی در پاسخ نمی‌آید.
7. آپلود: محدودیت حجم و MIME قبل از خواندن کامل body بررسی شود.
8. هیچ secret یا stack trace در پاسخ نباشد.
9. endpointهای admin در این فاز بدون auth هستند ولی در `presentation` یک guard placeholder دارند تا فاز محصول فقط policy اضافه کند.

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

- خطا بعد از شروع stream → `event: error` با کد، نه HTTP 500.
- `request.signal` به upstream منتقل می‌شود و در `abort` منبع بسته می‌شود.
- flush هر event؛ بافر نکن.
- کلاینت ناسازگار با SSE → همان endpoint، بدون fallback مخفی.

## Error mapping

| خطا | status | code |
|---|---|---|
| `ValidationError` / ZodError | 400 | `invalid_input` |
| `NotFoundError` | 404 | `not_found` |
| `UnsupportedFileError` | 415 | `unsupported_file` |
| `PayloadTooLargeError` | 413 | `payload_too_large` |
| `DocumentLoadError` | 422 | `document_load_failed` |
| `EmbeddingError` / `VectorStoreError` / `UpstreamError` | 502 | `upstream_failed` |
| `RetrievalError` / ناشناخته | 500 | `internal_error` |

## Checklist

- [ ] schema در `presentation/schemas.ts` است، نه داخل route.
- [ ] route زیر ۴۰ خط.
- [ ] runtime مشخص است.
- [ ] خطا از `toHttpError` عبور می‌کند.
- [ ] پاسخ SSE event order را رعایت می‌کند.
- [ ] abort تست شده.
- [ ] هیچ query مستقیم Prisma/Chroma در route نیست.

## Anti-patterns

- `await req.json()` بدون schema.
- return کردن `error.message` خام.
- `cache: "no-store"` پراکنده به‌جای `dynamic`.
- نوشتن منطق chunking داخل route آپلود.
- دو endpoint برای یک کار (یکی برای UI، یکی برای API).

## ضمیمه — route، OpenAPI و همگام‌سازی spec (append، بازنویسی‌شده؛ در `an-front` معادلی برای این بخش نیست)

استک pin‌شده: next `16.4.6` · typescript `7.0.2` · zod `4` · prisma `7.10.1` · pnpm.

> منبع: این ضمیمه از mr-dan می‌آید، نه از مرجع. `an-front` هیچ OpenAPI/Swagger داخلی ندارد
> (فقط `src/papak/cli/swaggerGenerateModels` که به Django مربوط است)، پس الگویی برای
> کپی وجود ندارد — spec ما دستی و مال خودمان است.

### قاعدهٔ route

- `app/api/**/route.ts` فقط `parse → use case → serialize`؛ حداکثر ۴۰ خط (تست معماری enforce می‌کند).
- ورودی با zod از `presentation/schemas.ts`؛ `await req.json()` خام ممنوع.
- `runtime = "nodejs"` برای هر route که Prisma/Chroma/فایل/OpenRouter می‌زند.
- خطا از `toHttpError` عبور می‌کند: `{ error: { code, message, requestId } }`؛ جزئیات داخلی هرگز در پاسخ نمی‌آید.
- mutation درون‌برنامه‌ای route نمی‌گیرد؛ Server Action است.

### همگام‌سازی spec (در همان تغییر)

- spec دستی در `src/lib/openapi.ts` است؛ هیچ ژنراتوری نداریم و نباید اضافه شود.
- هر route جدید/حذف/تغییر امضا یا auth ⇒ همان لحظه path، schema، status و توضیح spec را هم به‌روز کن.
- `GET /api/openapi` (JSON) و `/api-docs` (Swagger UI) باید ۲۰۰ بدهند.

### نتیجهٔ اکشن و revalidatePath

- اکشن‌ها (Server Action) فقط `{ ok: true, data } | { ok: false, error }` برمی‌گردانند؛ موفقیت = `state?.ok === true`.
- `revalidatePath` داخل Server Action ممنوع (ری‌ست `useActionState`، vercel/next.js#66426).

### فارسی / RTL

- پاسخ‌های خطای سرور برای کاربر فارسی و بدون جزئیات داخلی؛ `requestId` برای log کافی است.
- اعداد فارسی فقط در ورودی `username`/`email` به ASCII نرمال می‌شوند.
