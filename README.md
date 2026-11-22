# mr-dan

پلتفرم مشاورهٔ تحصیلی هوشمند.

- پلن معماری، فازها و اسکیل‌ها: [`docs/plan/`](./docs/plan/README.md)
- مخزن مرجع (oracle): [`mr-rag`](https://github.com/MostafaRastegar/mr-rag) — کلون محلی در `./mr-rag`، git-ignored

## اجرا

```bash
corepack enable pnpm
pnpm install
cp .env.example .env          # OPENROUTER_API_KEY را پر کن
docker compose up -d          # postgres + chroma
pnpm prisma generate && pnpm prisma migrate dev
pnpm dev                      # http://localhost:3000
```

صفحات:
- `/` — صفحه اصلی با لینک به چت، پنل دانش و اسناد API
- `/chat` — چتはري streaming با منابع و دکمه-stop
- `/admin/knowledge` — آپلود، لیست، جستجو، حذف اسناد و آمار
- `/api-docs` — اسناد API با Swagger UI (spec در `/api-docs`، spec خام در `/api/openapi`)

بررسی سلامت:

```bash
curl localhost:3000/api/health
# {"status":"ok","dependencies":{"postgres":"ok","chroma":"ok"}, ...}
```

## دستورها

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

- lint با `oxlint` است؛ `typescript-eslint` هنوز از TypeScript 7 پشتیبانی نمی‌کند.
- تست معماری (`test/architecture.test.ts`) قواعد لایه‌ها را enforce می‌کند.
- تست یکپارچه (`test/integration.test.ts`) بدون docker gracefully skip می‌شود.
- تست e2e (`tests/e2e/`) با `E2E_ENABLED=true pnpm test:e2e` اجرا می‌شود (نیاز به سرویس‌های زنده).

## API

تمام endpointها Relative هستند (same-origin)، نیازی به `NEXT_PUBLIC_API_BASE` نیست.

| Method | Path | توضیح |
|--------|------|-------|
| GET | `/api/health` | سلامت وابستگی‌ها + نسخه |
| GET | `/api/openapi` | spec OpenAPI 3.0 (JSON) |
| GET | `/api/documents` | لیست اسناد |
| POST | `/api/documents` | ingest (JSON: `filePath`, `originalFilename`, `fileType`) |
| POST | `/api/upload` | آپلود فایل multipart (`file`) → ingest |
| GET | `/api/documents/[id]` | جزئیات سند |
| DELETE | `/api/documents/[id]` | حذف سند (اول Chroma، بعد Postgres) |
| GET | `/api/conversations` | لیست مکالمه‌ها |
| POST | `/api/conversations` | ایجاد مکالمه |
| GET/PUT/DELETE | `/api/conversations/[id]` | CRUD مکالمه |
| POST | `/api/chat` | پاسخ ساده |
| POST | `/api/chat/stream` | streaming پاسخ با SSE |
| POST | `/api/search` | جستجوی مستقیم در 지식 |
| GET | `/api/admin/chunks` | لیست چانک‌ها |
| DELETE | `/api/admin/chunks/[id]` | حذف چانک |
| GET | `/api/admin/stats` | آمار سیستم |
| POST | `/api/admin/cache/clear` | پاک‌سازی کش |
| GET | `/api/metrics` | متریک Prometheus |
| POST | `/api/admin/retrieval/debug` | اشکال‌زدایی بازیابی |

## پورت‌ها

| سرویس | پورت |
|--------|------|
| app | 3000 |
| postgres | 5432 |
| chroma (این پروژه) | 8001 |
| chroma (oracle) | 8000 |

## وضعیت

فاز ۰ (اسکلت) — کامل  
فاز ۱ (ingestion + dense retrieval) — کامل  
فاز ۲ (hybrid + rerank + cache) — کامل  
فاز ۳ (CRUD، مکالمه، admin، متریک) — کامل  
فاز ۴ (RAG console UI: چت RTL، پنل دانش، e2e، Dockerfile، README) — کامل

جزئیات در [`docs/plan/phases.md`](./docs/plan/phases.md).
