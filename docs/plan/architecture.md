# mr-dan — معماری مقصد

## ۱. شکل کلی

یک **modular monolith** روی Next.js App Router، بدون میکروسرویس، بدون DI container، بدون CQRS.

```text
src/
├─ app/                              # فقط wiring و UI
│  ├─ (platform)/
│  │  ├─ chat/page.tsx               # RAG console
│  │  └─ admin/knowledge/page.tsx
│  ├─ api/
│  │  ├─ health/route.ts
│  │  ├─ ingest/route.ts
│  │  ├─ upload/route.ts
│  │  ├─ chat/route.ts
│  │  ├─ chat/stream/route.ts
│  │  ├─ search/route.ts
│  │  ├─ documents/route.ts
│  │  ├─ documents/[id]/route.ts
│  │  ├─ conversations/route.ts
│  │  ├─ conversations/[id]/route.ts
│  │  ├─ admin/retrieval/debug/route.ts
│  │  ├─ admin/cache/clear/route.ts
│  │  ├─ admin/chunks/route.ts
│  │  ├─ admin/chunks/[id]/route.ts
│  │  ├─ admin/stats/route.ts
│  │  └─ metrics/route.ts
│  ├─ layout.tsx
│  └─ globals.css
├─ modules/
│  └─ rag/
│     ├─ domain/                     # خالص: هیچ import خارجی
│     │  ├─ models.ts                # Document, Chunk, SearchResult, Answer, Message…
│     │  ├─ ports.ts                 # interfaceها
│     │  └─ errors.ts                # خطاهای دامنه
│     ├─ application/                # use caseها؛ فقط domain
│     │  ├─ ingest-document.ts
│     │  ├─ ask-question.ts
│     │  ├─ search-knowledge.ts
│     │  └─ manage-documents.ts
│     ├─ infrastructure/            # پیاده‌سازی portها
│     │  ├─ chroma-vector-store.ts
│     │  ├─ openrouter-embedding.ts
│     │  ├─ openrouter-llm.ts
│     │  ├─ document-loaders/       # json, md, txt, pdf
│     │  ├─ text-normalizer.ts
│     │  ├─ text-splitter.ts
│     │  ├─ hybrid-retriever.ts     # BM25 + RRF
│     │  ├─ llm-reranker.ts
│     │  ├─ cache/                  # exact, semantic
│     │  └─ prisma/                 # repositories
│     └─ presentation/              # مرز HTTP
│        ├─ schemas.ts               # zod
│        ├─ dto.ts                   # domain → response
│        └─ errors.ts                # domain error → status/code
├─ shared/
│  ├─ env.ts                        # zod-validated process.env
│  ├─ logger.ts                     # pino
│  ├─ result.ts                     # اگر لازم شد (اختیاری)
│  └─ prisma.ts
└─ server/
   └─ container.ts                  # تنها composition root
```

## ۲. قانون وابستگی

```text
app/* ──────────────► server/container ──────► infrastructure
  │                                                │
  └──► presentation ──► application ──► domain ◄───┘
```

- `domain` به هیچ‌چیز import ندارد (حتی `zod`).
- `application` فقط `domain` و portها را می‌شناسد؛ هرگز `infrastructure` را نه.
- `infrastructure` قرارداد port را implement می‌کند و می‌تواند کتابخانه بیرونی import کند.
- `presentation` فقط zod + domain types + application.
- `app/api/**/route.ts` نازک است: `parse → call use case → serialize` و حداکثر ۴۰ خط.
- `container.ts` تنها جایی است که concrete adapter به port وصل می‌شود.

اعمال با **oxlint** (چون `typescript-eslint` هنوز از TypeScript 7 پشتیبانی نمی‌کند) به‌همراه `test/architecture.test.ts` که گراف import را می‌پیماید و همین قواعد لایه‌ها، ممنوعیت وابستگی domain و ضخامت route را assert می‌کند. `import/no-cycle` در `.oxlintrc.json` فعال است.

## ۳. Composition root

```ts
// src/server/container.ts
let container: Container | undefined;

export function getContainer(): Container {
  // در dev، HMR باعث چند بار ساخته‌شدن می‌شود → روی globalThis نگه می‌داریم
  if (globalThis.__mrDanContainer) return globalThis.__mrDanContainer;
  const c = buildContainer();
  if (process.env.NODE_ENV !== "production") globalThis.__mrDanContainer = c;
  else container = c;
  return c;
}
```

- ساخت lazy است: اول route که صدا زده شد، adapterها ساخته می‌شوند.
- stateهای سنگین (ایندکس BM25، semantic cache، connection Chroma) داخل container زندگی می‌کنند.
- **محدودیت مستند:** این stateها per-instance هستند. با چند replica، BM25 و semantic cache همگام نیستند. برای این فاز تک‌instance فرض می‌شود؛ راه‌حل آینده در `phases.md` آمده.

## ۴. نگاشت domain

| Python | TypeScript |
|---|---|
| `Document{content, metadata}` | `interface RawDocument { content: string; metadata: DocumentMetadata }` |
| `Chunk{text, metadata, id}` | `interface Chunk { id: string; text: string; metadata: ChunkMetadata }` |
| `SearchResult{chunk, score}` | `interface SearchResult { chunk: Chunk; score: number }` |
| `Answer{text, sources}` | `interface Answer { text: string; sources: SearchResult[]; cache: CacheHit }` |
| `Message{role, content}` | `interface ChatMessage { role: "system" \| "user" \| "assistant"; content: string }` |
| `DocumentInfo` | `interface DocumentRecord` (id, filename, originalFilename, sourcePath, fileType, chunkCount, ingestedAt) |
| `Conversation` | `interface Conversation` + `ConversationMessage[]` |

- `metadata` در TS با `Record<string, unknown>` + type guard خوانده می‌شود، نه `any`.
- شناسهٔ chunk قطعی است: `${documentId}:${index}` → ingestion دوباره، chunk تکراری نمی‌سازد.
- زمان‌ها `Date` در domain و `timestamptz` در Prisma هستند (تفاوت آگاهانه با unix float پایتون).

## ۵. خطاها

```text
AppError (base: code, status)
├─ ValidationError        400  invalid_input
├─ NotFoundError          404  not_found
├─ UnsupportedFileError   415  unsupported_file
├─ PayloadTooLargeError   413  payload_too_large
├─ EmbeddingError         502  embedding_failed
├─ VectorStoreError       502  vector_store_failed
├─ DocumentLoadError      422  document_load_failed
├─ RetrievalError         500  retrieval_failed
└─ UpstreamError          502  upstream_failed   (OpenRouter/Chroma)
```

- adapterها خطای کتابخانه را به یکی از این‌ها **wrap** می‌کنند و `cause` را حفظ می‌کنند.
- `presentation/errors.ts` تنها جای `instanceof` زنجیره‌ای است؛ خروجی یکسان:
  `{ error: { code, message, requestId } }`.
- جزئیات داخلی هرگز به کلاینت نمی‌رود؛ در log با `requestId` ثبت می‌شود.
- برای شکست‌های قابل‌انتظار (validation/not found) از throw استفاده می‌کنیم، نه `Result`؛ چون مرز HTTP همه را یکجا map می‌کند. `Result` فقط داخل pipeline برای rerank/cache fallback استفاده می‌شود.

## ۶. مالکیت داده

| داده | منبع حقیقت |
|---|---|
| متن chunk + embedding + metadata | **Chroma** |
| رکورد سند (نام، نوع، تعداد chunk، زمان) | **Postgres / `Document`** |
| مکالمه و پیام | **Postgres / `Conversation`, `Message`** |
| کش exact/semantic | حافظهٔ process (LRU)، با TTL |
| runهای ingestion | **Postgres / `IngestionRun`** |
| آمار و متریک | محاسبه از Postgres + Chroma count |

قواعد:

1. **حذف سند:** اول chunkها از Chroma (`deleteByMetadata("document_id", id)`)، بعد رکورد Postgres. اگر Chroma شکست خورد، رکورد پاک نمی‌شود.
2. **Ingestion idempotent:** قبل از افزودن، chunkهای همان `document_id` حذف می‌شوند؛ در صورت خطای میانی، `IngestionRun` با وضعیت `failed` می‌ماند.
3. **بدون dual-write موازی:** نوشتن در Chroma و Postgres در یک use case و به ترتیب مشخص است، نه از دو مسیر مستقل.
4. هیچ endpointی مستقیم به Prisma یا Chroma دست نمی‌زند؛ همه از use case عبور می‌کنند.

## ۷. جریان‌ها

**Ingestion**

```text
file/bytes
→ normalize (BOM, CRLF, \v\f, blank lines)
→ loader (json | md | txt | pdf)
→ splitter (800/120, جداکننده‌های فارسی)
→ hash محتوا (SHA-256)  → اگر تکراری: no-op
→ embedDocuments (batch)
→ chroma.deleteByMetadata(document_id)   # idempotency
→ chroma.add(chunks, vectors)
→ prisma.document.upsert + ingestionRun
```

**پرسش**

```text
question
→ exact cache (question + promptVersion + model)
→ embedQuery
→ semantic cache (cosine ≥ 0.97)
→ retriever: dense (fetch_k=20) | hybrid BM25+dense (RRF, bm25=0.4)
→ [multi-query اگر flag روشن: 3 بازنویسی → merge با RRF]
→ filter score ≥ 0.35
→ [cascade اگر خالی بود: query expansion → loose prompt]
→ rerank با LLM (top_n=5, min 3/10)
→ prompt (context + history) → LLM
→ cache update (exact + semantic)
→ Answer{text, sources}
```

**Streaming**

```text
ReadableStream
event: meta    { requestId, cache }
event: token   { text }
event: sources [{ content, metadata, score }]
event: done    { }
event: error   { code, message }
```

`runtime = "nodejs"` برای همهٔ routeهای RAG، `dynamic = "force-dynamic"`.
abort کلاینت → `request.signal` → لغو fetch به OpenRouter و بستن stream.

## ۸. پیکربندی

- `src/shared/env.ts` در boot با zod اعتبارسنجی می‌شود؛ متغیر گمشده = کرش زودهنگام.
- همهٔ پارامترهای RAG یک‌جا با نام‌های سازگار با oracle:

```text
EMBEDDING_MODEL, LLM_MODEL
CHUNK_SIZE=800, CHUNK_OVERLAP=120
TOP_K=5, FETCH_K=20
RETRIEVAL_MIN_SCORE=0.35, RETRIEVAL_LOW_RELEVANCE_THRESHOLD=0.45
RERANK_ENABLED=true, RERANK_TOP_N=5, RERANK_MIN_SCORE=3
HYBRID_SEARCH_ENABLED=true, HYBRID_BM25_WEIGHT=0.4
MULTI_QUERY_ENABLED=false, MULTI_QUERY_COUNT=3
QUERY_EXPANSION_ENABLED=false, QUERY_EXPANSION_COUNT=3
LOOSE_PROMPT_ENABLED=false
CACHE_SEMANTIC_ENABLED=true, CACHE_SEMANTIC_THRESHOLD=0.97
CACHE_TTL_EMBEDDING=3600, CACHE_TTL_LLM=86400
```

- پیکربندی در یک object منجمد (`as const` + `Object.freeze`) خوانده می‌شود، نه پراکنده در `process.env`.
- مقادیر در `.opencode/skills/mr-dan-rag/SKILL.md` تکرار می‌شوند؛ هر تغییر باید در هر دو جا و در `AGENTS.md` هم‌زمان به‌روز شود.

## ۹. آنچه عمداً نداریم

- DI container / decorator / reflection
- `BaseRepository` انتزاعی و لایهٔ generic
- pgvector / Redis / BullMQ در این فاز
- scheduler، scraper، Confluence
- تزریق Prisma به domain
- endpointهای دوگانه برای «سازگاری با فرانت قدیمی»
