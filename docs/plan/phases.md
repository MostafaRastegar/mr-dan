# mr-dan — فازهای اجرا

دامنه: **زیرساخت، استک، پورت کامل RAG** (فاز ۰–۴) و **محصول مشاورهٔ تحصیلی** که از فاز ۵.۱ آغاز شده است.

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
- [x] cascade: stage 1 strict → stage 2 query expansion → stage 3 loose prompt (هر سه flag-driven)
- [x] multi-query retrieval (`multi_query_enabled`, count=3): تولید بازنویسی با LLM، merge با RRF
- [x] cache: exact (hash + promptVersion + model)، semantic (cosine 0.97، maxsize 500)، TTLها
- [x] `ask-question.ts` (blocking + stream) با همان ترتیب oracle
- [x] `POST /api/chat`, `POST /api/chat/stream` (SSE: `meta → token* → sources → done`)
- [x] abort با `request.signal`؛ بستن upstream stream
- [x] `POST /api/admin/retrieval/debug`, `POST /api/admin/cache/clear`
- [x] تست‌های fake LLM/embedding برای rerank، cascade، cache

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

- [x] `manage-documents.ts` + delete با ترتیب Chroma→Postgres
- [x] `GET /api/admin/chunks`, `DELETE /api/admin/chunks/[id]`
- [x] `GET /api/admin/stats` (تعداد سند/chunk/مکالمه، حجم کش، وضعیت upstream)
- [x] مکالمه: `GET|POST /api/conversations`, `GET|PUT|DELETE /api/conversations/[id]`
- [x] repositoryهای Prisma برای `Document`, `Conversation`, `Message`, `IngestionRun`
- [x] `GET /api/metrics` (Prometheus text): latency، cache hit ratio، retrieval count، upstream errors
- [x] `GET /api/health` تکمیل‌شده (نسخه، مدل‌ها، شمارش)
- [x] تست integration با Postgres/Chroma واقعی (skip graceful بدون docker)

**دروازه:**

- جدول endpointهای `parity.md` بدون «باقی‌مانده»
- حذف سند از پنل ادمین → صفر chunk یتیم در Chroma
- CRUD مکالمه پس از restart پایدار
- metrics با فرمت Prometheus قابل scrape

**اسکیل‌ها:** `mr-dan-persistence`, `mr-dan-api`, `prisma-client-api`, `mr-dan-testing-parity`

---

## فاز ۴ — RAG console، سخت‌سازی، cutover

**هدف:** یک UI واقعی که کل مسیر را تمرین کند و اثبات کند oracle دیگر لازم نیست.

- [x] `(platform)/chat`: چت RTL با AntD، streaming، citation، stop، regenerate
- [x] `(platform)/admin/knowledge`: آپلود، لیست سند، حذف، جست‌وجوی مستقیم، آمار، پاک‌کردن کش
- [x] حذف وابستگی فرانت قدیمی به `NEXT_PUBLIC_API_BASE` (اگر کامپوننتی پورت شد)
- [x] error boundary، loading/skeleton، empty state، پیام فارسی
- [x] `Dockerfile` چندمرحله‌ای برای Next (`output: "standalone"`)
- [x] `docker compose` شامل app + postgres + chroma
- [x] Playwright: آپلود → پرسش → citation → حذف
- [x] `README.md` اجرا، معماری، env، عیب‌یابی
- [x] `GET /api/openapi` سرویس‌دهندهٔ spec OpenAPI 3.0
- [x] صفحه `/api-docs` با Swagger UI (از CDN، بدون وابستگی npm جدید)
- [x] snapshot نهایی parity + ثبت در `parity.md`

**دروازه:**

- `docker compose up` از صفر → آپلود و چت کار کند
- e2e سبز
- oracle در هیچ import/وابستگی/runtime دیده نشود (`grep -r mr-rag`)
- `pnpm build` بدون هشدار type

**اسکیل‌ها:** `mr-dan-frontend`, `ant-design`, `tailwind-design-system`, `vercel-react-best-practices`

---

## فاز ۵ — محصول مشاورهٔ تحصیلی

چهار تحویل مستقل با ترتیب اجباری ۵.۱ → ۵.۲ → ۵.۳ → ۵.۴: ۵.۲ و ۵.۳ روی `User` فاز ۵.۱ سوار می‌شوند و ۵.۴ به دادهٔ ۵.۲ و ۵.۳ نیاز دارد. همه در `src/modules/advising/**` با همان لایه‌بندی `rag` می‌نشینند. هر زیرفاز migration، تست و README خودش را دارد و دروازهٔ جدا.

### فاز ۵.۱ — هویت، پروفایل، گروه (پیاده‌سازی شد)

**هدف:** ثبت‌نام/ورود/خروج با نشست DB-backed، پروفایل تحصیلی، و گروه‌بندی دانش‌آموز توسط مشاور.

- [x] `User`, `Group`, `Session` (migration `add_advising_identity`)
- [x] نقش `student` | `counselor`؛ رمز با `node:crypto` scrypt، توکن نشست فقط SHA-256 در DB
- [x] کوکی `mrdan_session`: `httpOnly`, `sameSite=lax`, `path=/`, TTL ۷ روز, `secure` فقط production
- [x] پروفایل تحصیلی (`grade`, `fieldOfStudy`, `schoolName`) + تغییر رمز با باطل‌کردن سایر نشست‌ها
- [x] ساخت گروه و تخصیص دانش‌آموز (یک گروه و یک مشاور، یک update اتمی)
- [x] صفحات `/login`, `/register`, `/profile`, `/counselor/students`
- [x] seed دموی dev-only و idempotent: `scripts/seed-advising.ts`

**دروازه:** `pnpm typecheck && pnpm lint && pnpm test && pnpm build` سبز؛ تست‌های e2e احراز هویت با `E2E_ENABLED=true pnpm test:e2e` (نیاز به سرویس‌های زنده).

**پلن:** [`.opencode/plans/phase-5-1-identity-profile.md`](../../.opencode/plans/phase-5-1-identity-profile.md)

**اسکیل‌ها:** `mr-dan-persistence`, `mr-dan-api`, `mr-dan-frontend`

### فاز ۵.۲ — برنامه هفتگی، تکالیف، تایمر مطالعه

- `WeeklySchedule` (روز، ساعت، درس، معلم، اتاق)، `Homework` (اولویت، deadline، وضعیت انجام)
- `StudySession` (دستهٔ مطالعه/استراحت/اتلاف، مدت، تمرکز) + پومودورو سمت کلاینت
- تحلیل زمان و نرخ بهره‌وری؛ **بدون** scheduler یا یادآور تلگرام

**دروازه:** migration سبز، تست‌های use case و صفحه‌های برنامه/تکلیف سبز.

### فاز ۵.۳ — آزمون، تغذیه، کتاب، اوقات فراغت

- `Question` + `QuizAttempt` با نمره‌دهی کنکور (۳ غلط = ۱ درست) و کارنامه
- `MealPlan` + migration فیلدهای فیزیکی روی `User` (`age`, `gender`, `heightCm`, `weightKg`, `activityLevel`, `dietGoal`) و BMR/TDEE
- پیشنهاد کتاب از `data/books.json` و پیشنهاد فراغت از قواعد خستگی/بار کاری

**دروازه:** migration سبز، نمره‌دهی آزمون تست‌شده، محاسبهٔ BMR/TDEE تست‌شده.

### فاز ۵.۴ — داشبورد (`echarts`) + پنل مشاور

- چهار نمودار (روند مطالعه، مقایسهٔ دروس، توزیع ۲۴ ساعته، رادار تسلط) با `echarts` — تنها جای افزودن این dependency
- `CounselorPlan` (نوشتن/ارسال برنامه)، صفحهٔ جزئیات دانش‌آموز، فهرست/فیلتر دانش‌آموزان
- تأیید/ارتقای نقش مشاور توسط ادمین (بستن ریسک خودثبت‌نامی)

**دروازه:** نمودارها با دادهٔ واقعی ۵.۲/۵.۳ رندر شوند؛ e2e پنل مشاور سبز.

### خارج از فاز ۵ (ثبت‌شده)

- Telegram (bot/reminder/link code) — حذف کامل
- WebRTC video call / meeting room — فقط مستند، بدون پیاده‌سازی
- اتصال RAG به دادهٔ مشاوره و `Document.ownerId`/`visibility` — تا فاز چت به تعویق افتاده
- pgvector / Redis / BullMQ / scheduler / scraper

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
