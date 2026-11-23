# AGENTS.md

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
pnpm lint             # oxlint (typescript-eslint با TS 7 سازگار نیست)
pnpm test             # vitest (شامل تست معماری)
pnpm test:e2e         # playwright
docker compose up -d  # postgres + chroma (chroma روی 8001، چون 8000 مال oracle است)
pnpm prisma migrate dev
```

- Chroma این پروژه روی `http://localhost:8001` است؛ oracle روی `8000`.
- تست معماری (`test/architecture.test.ts`) مرزهای لایه‌ها، وابستگی صفر domain و ضخامت route را enforce می‌کند. نقض آن = build شکسته.

## معماری

```text
app → server/container → infrastructure
app → presentation → application → domain
infrastructure → domain (implements ports)
```

- فرانت: تریاد `page.tsx` + `<x>.vm.tsx` + `<x>.view.tsx` کنار هم داخل `src/app/**`؛ کامپوننت‌های خصوصی روت در `_components/`؛ Server Action هر ناحیه در `src/app/**/<area>.actions.ts` با `'use server'`.
- چوک‌پوینت‌های action: `src/utils/app-error.ts`، `src/utils/server-action.ts`، `src/utils/use-form-action.ts` — تنها مسیر mutation و تنها پل فرم.
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
embedding nvidia/nemotron-3.5-embed-8b:free
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

| کار                                                         | اسکیل                       |
| ----------------------------------------------------------- | --------------------------- |
| ساختار، لایه، خطا                                           | `mr-dan-architecture`       |
| loader/chunk/آپلود                                          | `mr-dan-ingestion`          |
| retrieval/cache/prompt                                      | `mr-dan-rag`                |
| route/SSE/اعتبارسنجی                                        | `mr-dan-api`                |
| Prisma/repository                                           | `mr-dan-persistence`        |
| UI                                                          | `mr-dan-frontend`           |
| تست و parity                                                | `mr-dan-testing-parity`     |
| env/docker/CI                                               | `mr-dan-devops`             |
| فیچر جدید (schema → use case → action → RSC → form → tests) | `mr-dan-feature-workflow`   |
| باگ فرم/اکشن/session                                        | `mr-dan-frontend-debugging` |

**Skill language: English.** Every `.opencode/skills/*/SKILL.md` (body and front matter) must be in English. The user-facing answer is Persian, but skill text is never written in Persian. Data characters only (Persian separators, tokenizer letter mappings) are exempt.

## ممنوعیت‌ها

- کپی کورکورانهٔ اسکیل‌های `mr-rag-*` از oracle (مقادیرشان کهنه است).
- scheduler / scraper / Confluence.
- pgvector / Redis / BullMQ در این فاز.
- تغییر آستانه‌ها برای سبز کردن تست parity.
- نوشتن منطق دامنه داخل `route.ts` یا کامپوننت React.
- کامیت کردن `.env`، `.env.oracle` یا کلید OpenRouter.
- ~/project/yaftar/aip-next is a read-only frontend reference — no import, no dependency, no submodule; it is comparison-only and never imported into this project

## تعریف «تمام شد»

- `pnpm typecheck && pnpm lint && pnpm test && pnpm build` سبز.
- دروازهٔ فاز مربوطه در `phases.md` سبز.
- اسکیل مربوطه با کد هم‌خوان.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
