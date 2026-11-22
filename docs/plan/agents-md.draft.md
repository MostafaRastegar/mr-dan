# AGENTS.md (پیش‌نویس برای ریشهٔ mr-dan)

## پروژه

پلتفرم مشاورهٔ تحصیلی هوشمند. **در این مرحله فقط زیرساخت، استک و پورت RAG از `mr-rag`.**

- oracle: `./mr-rag` (کلون محلی، git-ignored؛ فقط مقایسه، هرگز import نمی‌شود)
- پلن: `docs/plan/`
- زبان پاسخ به کاربر: فارسی. زبان کد، کامنت و commit: انگلیسی.

## استک (pin شده — نسخه را عوض نکن بدون تأیید)

```text
next 16.4.6 · react 19.3.1 · typescript 7.0.2 · tailwindcss 4.3.5
antd 6.7.1 · @ant-design/nextjs-registry 1.3.0
prisma 7.10.1 (exact — latest روی 8.0.0-rc است)
langchain 1.6.7 · @langchain/core 1.5.0
@langchain/community 1.1.29 · @langchain/classic 1.0.62 · @langchain/textsplitters 1.0.2
chromadb 3.5.0 · unpdf 2.2.1 · zod 4 · pino
```

- package manager: **pnpm**.
- `npm install prisma@latest` ممنوع.

## دستورها

```bash
pnpm dev
pnpm build
pnpm typecheck        # tsc --noEmit (TS 7 native)
pnpm lint
pnpm test             # vitest
pnpm test:e2e         # playwright
docker compose up -d  # postgres + chroma
pnpm prisma migrate dev
```

## معماری

```text
app → server/container → infrastructure
app → presentation → application → domain
infrastructure → domain (implements ports)
```

- `src/modules/rag/domain` هیچ import خارجی ندارد.
- `application` هرگز `infrastructure` را import نمی‌کند.
- route handler نازک: `parse → use case → serialize`، حداکثر ۴۰ خط.
- فقط `src/server/container.ts` adapter را به port وصل می‌کند.
- جزئیات: `.opencode/skills/mr-dan-architecture/SKILL.md`

## قواعد RAG (منبع حقیقت: `src/shared/env.ts`)

```text
chunk 800/120 · top_k 5 · fetch_k 20
min_score 0.35 · low_relevance 0.45
rerank on top_n 5 min 3 · hybrid on bm25 0.4 RRF k=60
multi_query off · query_expansion off · loose_prompt off
semantic cache on 0.97 · ttl embed 3600 · ttl llm 86400
embedding nvidia/llama-nemotron-embed-vl-1b-v2:free
chat nvidia/nemotron-3-ultra-550b-a55b:free
```

تغییر هر عدد = تغییر هم‌زمان در `env.ts`, `AGENTS.md`, `.opencode/skills/mr-dan-rag/SKILL.md` و در صورت لزوم oracle.

## قواعد داده

- Chroma: متن chunk + بردار + metadata.
- Postgres: سند، مکالمه، run، کش اختیاری.
- حذف سند: اول Chroma، بعد Postgres.
- ingestion باید idempotent باشد؛ id chunk = `${documentId}:${index}`.
- endpoint هرگز مستقیم Prisma/Chroma صدا نمی‌زند.

## کد

- TypeScript strict. `any` ممنوع؛ `unknown` + type guard.
- نام‌ها انگلیسی و دامنه‌محور (`ingestDocument`, نه `processData`).
- یک فایل = یک مسئولیت. تابع بیش از ۴۰ خط = علامت خطر.
- کامنت فقط برای «چرا»، نه «چه».
- خطا: `AppError` subclassها؛ adapter خطای کتابخانه را wrap می‌کند و `cause` را نگه می‌دارد.
- `runtime = "nodejs"` برای همهٔ routeهای RAG.
- بدون DI framework، بدون `BaseRepository`، بدون abstraction پیش‌ازنیاز.

## اسکیل‌ها

قبل از کار روی هر بخش، اسکیل مربوطه در `.opencode/skills/` را بخوان:

| کار | اسکیل |
|---|---|
| ساختار، لایه، خطا | `mr-dan-architecture` |
| loader/chunk/آپلود | `mr-dan-ingestion` |
| retrieval/cache/prompt | `mr-dan-rag` |
| route/SSE/اعتبارسنجی | `mr-dan-api` |
| Prisma/repository | `mr-dan-persistence` |
| UI | `mr-dan-frontend` |
| تست و parity | `mr-dan-testing-parity` |
| env/docker/CI | `mr-dan-devops` |

## ممنوعیت‌ها

- کپی کورکورانهٔ اسکیل‌های `mr-rag-*` از oracle (مقادیرشان کهنه است).
- scheduler / scraper / Confluence.
- pgvector / Redis / BullMQ در این فاز.
- تغییر آستانه‌ها برای سبز کردن تست parity.
- نوشتن منطق دامنه داخل `route.ts` یا کامپوننت React.
- کامیت کردن `.env`، `.env.oracle` یا کلید OpenRouter.

## تعریف «تمام شد»

- `pnpm typecheck && pnpm lint && pnpm test && pnpm build` سبز.
- دروازهٔ فاز مربوطه در `phases.md` سبز.
- اسکیل مربوطه با کد هم‌خوان.
