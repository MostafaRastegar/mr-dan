# mr-dan — فازهای اجرا

دامنه: **زیرساخت، استک، پورت کامل RAG**. محصول مشاورهٔ تحصیلی در فاز ۵ و بعد از تأیید نیازمندی‌ها شروع می‌شود.

هر فاز یک **دروازه** دارد؛ تا سبز نشود فاز بعد شروع نمی‌شود. هیچ فازی «۹۰٪ تمام» تحویل نمی‌دهد.

---

## فاز ۰ — اسکلت، oracle، اسکیل‌ها

**هدف:** پروژه‌ای که بالا می‌آید، تست دارد، مرزها را enforce می‌کند و oracle آمادهٔ مقایسه است.

- [x] `git clone` مخزن oracle در `./mr-rag` و checkout روی `e64febb` (در `.gitignore`)
- [x] نوشتن `ORACLE.md` (commit، دستور اجرا، محل env)
- [x] اسکلت Next `16.4.6`، React `19.3.1`، TS `7.0.2`، Tailwind `4.3.5`، App Router، `src/`
- [x] pin کردن نسخه‌ها در `package.json` (بدون `^` برای Next/React/Prisma/TS)
- [x] نصب AntD `6.7.1` + `@ant-design/nextjs-registry@1.3.0` + RTL (`ConfigProvider direction="rtl"`)
- [x] `src/shared/env.ts` با zod؛ `.env.example` کامل
- [x] `src/shared/logger.ts` (pino)
- [x] Prisma `7.10.1` (driver adapter `@prisma/adapter-pg`) + schema اولیه و migration اول
- [x] `docker-compose.yml`: `postgres:17`, `chromadb/chroma`، healthcheck، volume (Chroma روی پورت `8001` چون `8000` مال oracle است)
- [x] `GET /api/health` که Postgres (`SELECT 1`) و Chroma (`heartbeat`) را چک می‌کند
- [x] ساختار پوشه‌ها + `src/server/container.ts` (composition root، lazy)
- [x] lint با **oxlint** + تست معماری (`test/architecture.test.ts`) به‌جای eslint-plugin-boundaries — دلیل: typescript-eslint با TS 7.0 سازگار نیست
- [x] Vitest + تست واقعی برای env/health؛ Playwright نصب ولی بدون تست
- [x] CI: `typecheck`, `lint`, `test`, `build`
- [ ] نصب اسکیل‌های upstream (طبق `skills.md`)
- [x] نوشتن ۸ اسکیل پروژه‌ای در `.opencode/skills/<id>/SKILL.md` + `.opencode/opencode.json`
- [x] `AGENTS.md` بر اساس `agents-md.draft.md`
- [ ] اجرای oracle و تأیید اعداد پایه (نیاز به `.env` و مدل‌های free)

**دروازه:**

```bash
pnpm install
pnpm prisma generate
pnpm typecheck && pnpm lint && pnpm test && pnpm build   # همه سبز
docker compose up -d && pnpm prisma migrate dev && pnpm dev
curl localhost:3000/api/health                            # postgres+chroma: ok
cd mr-rag && python -m scripts.eval_retrieval --mode dense
```

خروجی oracle باید همان اعداد `parity.md` را بدهد؛ اگر نداد، محیط oracle مشکل دارد و نباید وارد فاز ۱ شد.

**اسکیل‌ها:** `mr-dan-architecture`, `clean-architecture`, `clean-code`, `prisma-orm-setup`

---

## فاز ۱ — هستهٔ دامنه، ingestion، dense retrieval

**هدف:** اولین جریان کامل «فایل → chunk → جست‌وجو» با برابری dense.

- [x] `modules/rag/domain`: models، ports، errors
- [x] `container.ts`: wire کردن adapterها به‌صورت lazy + `globalThis` در dev
- [x] `text-normalizer.ts` (BOM، CRLF، `\v\f`، خطوط خالی، ZWNJ) + تست
- [x] loaderها: JSON (تشخیص فیلد محتوا)، Markdown، TXT، PDF (`unpdf`) + تست
- [x] `text-splitter.ts` با جداکننده‌های فارسی، ۸۰۰/۱۲۰ + تست
- [x] `openrouter-embedding.ts` با `baseURL` و retry
- [x] `chroma-vector-store.ts`: `add`, `search`, `count`, `deleteByMetadata`, `getAllChunks`
- [x] `ingest-document.ts`: normalize → load → split → hash → dedupe → delete old → embed → add → persist
- [x] `search-knowledge.ts` (dense)
- [x] routeها: `POST /api/ingest`, `POST /api/search`, `GET /api/documents`
- [x] `scripts/eval-retrieval.ts` + `scripts/golden-set.ts`
- [x] `scripts/golden-set.test.ts` + `scripts/eval-metrics.test.ts` (متریک‌های hit@5/MRR با دادهٔ سنتتیک)
- [ ] seed کردن corpus oracle در mr-dan (فایل‌های `.txt` برای numeric verification)

**دروازه (کد و یکپارچگی):**

- `pnpm typecheck && pnpm lint && pnpm test && pnpm build` سبز
- ingestion idempotent: ingest دوباره همان فایل → `chunkCount` ثابت، `cached=true`
- hit@5/MRR محاسبه درست با دادهٔ سنتتیک (تست‌های `scripts/eval-metrics.test.ts`)

**دروازه (عدد parity — صیانت شده تا دسترسی به corpus + کلید OpenRouter):**

- تعداد chunk برای هر ۴ فایل == oracle (±۰)
- `hit@5 = 1.0`، dense `MRR ≥ 0.78`
- top-5 ids در ≥ ۱۱ از ۱۳ پرسش یکسان
- ingestion دوبارهٔ همان فایل تعداد را تغییر ندهد
- حذف سند صفر chunk باقی بگذارد (حذف سند در فاز ۲)

**اسکیل‌ها:** `mr-dan-ingestion`, `mr-dan-rag`, `mr-dan-persistence`, `mr-dan-testing-parity`

**نکته:** oracle فایل‌های `.txt` (final report.txt, p1.txt, p9.txt, p10.txt) را در ریپو ندارد؛ آن‌ها در زمان اجرا اولیه oracle بارگذاری شده بودند. برای اعتبارسنجی عددی فاز ۱، corpus را در `mr-rag/data/` ایجاد کرده و `.env` با `OPENROUTER_API_KEY` پر کنید، سپس `tsx scripts/eval-retrieval.ts --mode dense` را اجرا کنید.


---

## فاز ۲ — hybrid، rerank، cascade، cache، streaming

**هدف:** رفتار کامل retrieval oracle، نه فقط dense.

- [x] `persian-tokenizer.ts` مطابق `persian_preprocess` پایتون + تست word-level
- [x] `hybrid-retriever.ts`: BM25 (`@langchain/community/retrievers/bm25`) + dense + RRF سفارشی (k=60، وزن ۰.۴)
- [x] `llm-reranker.ts`: listwise، `top_n=5`, `min_score=3`, prompt یکسان، fallback بی‌خطا
- [ ] cascade: stage 1 strict → stage 2 query expansion → stage 3 loose prompt (هر سه flag-driven)
- [ ] multi-query retrieval (`multi_query_enabled`, count=3): تولید بازنویسی با LLM، merge با RRF
- [x] cache: exact (hash + promptVersion + model)، semantic (cosine 0.97، maxsize 500)، TTLها
- [x] `ask-question.ts` (blocking + stream) با همان ترتیب oracle
- [x] `POST /api/chat`, `POST /api/chat/stream` (SSE: `meta → token* → sources → done`)
- [ ] abort با `request.signal`؛ بستن upstream stream
- [ ] `POST /api/admin/retrieval/debug`, `POST /api/admin/cache/clear`
- [ ] تست‌های fake LLM/embedding برای rerank، cascade، cache

**دروازه:**

- hybrid `MRR ≥ 0.92`، `hit@5 = 1.0`
- top-5 ids در hybrid ≥ ۱۲ از ۱۳
- cache hit در پرسش تکراری؛ miss با تغییر `promptVersion` یا مدل
- cascade: با context خالی، stage 2/3 دقیقاً وقتی flag روشن است اجرا شود
- multi-query با flag روشن، تعداد فراخوانی و merge را درست انجام دهد و در flag خاموش هیچ فراخوانی اضافه‌ای نکند
- SSE: ترتیب eventها، abort بدون نشتی، خطای upstream به `event: error`
- هیچ درخواست دومی برای گرفتن sources لازم نباشد

**اسکیل‌ها:** `mr-dan-rag`, `mr-dan-api`, `mr-dan-testing-parity`, `vercel-react-best-practices` (برای مصرف stream)

---

## فاز ۳ — CRUD کامل، مکالمه، admin، متریک

**هدف:** همهٔ endpointهای باقی‌ماندهٔ oracle.

- [ ] `manage-documents.ts` + delete با ترتیب Chroma→Postgres
- [ ] `GET /api/admin/chunks`, `DELETE /api/admin/chunks/[id]`
- [ ] `GET /api/admin/stats` (تعداد سند/chunk/مکالمه، حجم کش، وضعیت upstream)
- [ ] مکالمه: `GET|POST /api/conversations`, `GET|PUT|DELETE /api/conversations/[id]`
- [ ] repositoryهای Prisma برای `Document`, `Conversation`, `Message`, `IngestionRun`
- [ ] `GET /api/metrics` (Prometheus text): latency، cache hit ratio، retrieval count، upstream errors
- [ ] `GET /api/health` تکمیل‌شده (نسخه، مدل‌ها، شمارش)
- [ ] تست integration با Postgres/Chroma واقعی (testcontainers یا compose profile)

**دروازه:**

- جدول endpointهای `parity.md` بدون «باقی‌مانده»
- حذف سند از پنل ادمین → صفر chunk یتیم در Chroma
- CRUD مکالمه پس از restart پایدار
- metrics با فرمت Prometheus قابل scrape

**اسکیل‌ها:** `mr-dan-persistence`, `mr-dan-api`, `prisma-client-api`, `mr-dan-testing-parity`

---

## فاز ۴ — RAG console، سخت‌سازی، cutover

**هدف:** یک UI واقعی که کل مسیر را تمرین کند و اثبات کند oracle دیگر لازم نیست.

- [ ] `(platform)/chat`: چت RTL با AntD، streaming، citation، stop، regenerate
- [ ] `(platform)/admin/knowledge`: آپلود، لیست سند، حذف، جست‌وجوی مستقیم، آمار، پاک‌کردن کش
- [ ] حذف وابستگی فرانت قدیمی به `NEXT_PUBLIC_API_BASE` (اگر کامپوننتی پورت شد)
- [ ] error boundary، loading/skeleton، empty state، پیام فارسی
- [ ] `Dockerfile` چندمرحله‌ای برای Next (`output: "standalone"`)
- [ ] `docker compose` شامل app + postgres + chroma
- [ ] Playwright: آپلود → پرسش → citation → حذف
- [ ] `README.md` اجرا، معماری، env، عیب‌یابی
- [ ] snapshot نهایی parity + ثبت در `parity.md`

**دروازه:**

- `docker compose up` از صفر → آپلود و چت کار کند
- e2e سبز
- oracle در هیچ import/وابستگی/runtime دیده نشود (`grep -r mr-rag`)
- `pnpm build` بدون هشدار type

**اسکیل‌ها:** `mr-dan-frontend`, `ant-design`, `tailwind-design-system`, `vercel-react-best-practices`

---

## فاز ۵ — محصول مشاورهٔ تحصیلی (خارج از این پلن)

بعد از تحویل نیازمندی‌ها: هویت و نقش‌ها، پروفایل دانش‌آموز، اسناد و قواعد دامنه، توصیهٔ رشته، پنل مشاور، کالیبراسیون golden set جدید.

پیش‌نیاز فنی که در فاز ۰–۴ ساخته می‌شود:

- `modules/advising` با همان قانون لایه‌ها
- مرز `identity` که فعلاً خالی است ولی routeها و schema برایش جا دارد
- `Document.ownerId`/`visibility` از ابتدا در schema **نیست**؛ در فاز ۵ با migration اضافه می‌شود (YAGNI).

---

## ترتیب و وابستگی

```text
فاز ۰ ──► فاز ۱ ──► فاز ۲ ──► فاز ۳ ──► فاز ۴ ──► فاز ۵
             │           │
             └─ eval ────┘   (هر دو فاز به golden set وابسته‌اند)
```

## قواعد جاری در همهٔ فازها

1. هیچ فازی بدون تست و بدون به‌روزرسانی اسکیل مربوطه تمام نمی‌شود.
2. هر تغییر پارامتر RAG → هم‌زمان در `shared/env.ts`, `AGENTS.md`, `.opencode/skills/mr-dan-rag/SKILL.md`, و در صورت لزوم oracle.
3. هیچ کد مرده یا flag بدون تست اضافه نمی‌شود.
4. اگر دروازهٔ parity شکست خورد، اول علت را پیدا کن؛ تغییر آستانه ممنوع.
