# mr-dan — Infrastructure, Stack & RAG Port Plan

> وضعیت: پیش‌نویس تأییدشده برای فاز زیرساخت. هنوز وارد نیازمندی‌های محصول نشده‌ایم.
> این سند فقط دربارهٔ اسکلت پروژه، استک، پورت کامل `mr-rag` و اسکیل‌های مربوطه است.

## تصمیم‌های تأییدشده

1. ریپوی `mr-rag` به‌عنوان **oracle** کلون و نگه داشته می‌شود؛ حذف نمی‌شود.
2. **همهٔ قابلیت‌های RAG** پورت می‌شوند (نه فقط MVP):
   - ingestion برای JSON/MD/TXT/PDF
   - dense + hybrid (BM25 + RRF)
   - rerank با LLM
   - multi-query retrieval (flag-driven)
   - cascade سه‌مرحله‌ای (strict / query expansion / loose prompt)
   - cache کامل (exact-LLM / semantic / embedding)
   - streaming SSE
   - documents CRUD، conversations، search، admin، metrics، health
3. ارائه‌دهندهٔ مدل: **OpenRouter با مدل‌های free فعلی**.
4. scheduler و scraper **حذف** می‌شوند. ورودی دانش فقط از آپلود/ایندکس ادمین است.
5. یکپارچه‌سازی Confluence و هر منبع خارجی مشابه **خارج از دامنه** است.
6. فعلاً فقط زیرساخت، استک و پورت RAG. پروفایل دانش‌آموز، توصیهٔ رشته، پنل مشاور و منطق محصول در فاز بعد.

## Oracle

- مخزن: `https://github.com/MostafaRastegar/mr-rag`
- commit: `e64febbeb17c016b638112e8c11ae980404be9ee`
- مسیر: `./mr-rag` (داخل ریپو، در `.gitignore`)
- فقط برای مقایسه؛ جزئیات در [`parity.md`](./parity.md)

## استک pin‌شده

| ابزار | نسخه | نکته |
|---|---|---|
| Next.js | `16.4.6` | App Router، runtime = nodejs برای RAG |
| React | `19.3.1` | سازگار با AntD 6 |
| TypeScript | `7.0.2` | native؛ ESLint type-aware فعلاً خاموش |
| Tailwind CSS | `4.3.5` | CSS-first |
| Ant Design | `6.7.1` | + `@ant-design/nextjs-registry@1.3.0` |
| Prisma | `7.10.1` | exact pin؛ `latest` روی 8.0.0-rc است |
| LangChain JS | `1.6.7` | `@langchain/core@1.5.0` |
| @langchain/community | `1.1.29` | BM25، Chroma |
| @langchain/classic | `1.0.62` | Ensemble، MultiQuery |
| @langchain/textsplitters | `1.0.2` | RecursiveCharacterTextSplitter |
| chromadb | `3.5.0` | کلاینت مستقیم، نه wrapper |
| unpdf | `2.2.1` | استخراج PDF؛ باید با PDF فارسی تست شود |
| Zod | `4.x` | مرز API و env |
| pino | latest | لاگ ساختاریافته |
| Vitest / Playwright | latest | unit/integration/e2e |

## ساختار اسناد

- [`architecture.md`](./architecture.md) — معماری مقصد، قانون وابستگی، مدل داده، جریان RAG
- [`parity.md`](./parity.md) — oracle، corpus، golden set، معیارهای برابری
- [`phases.md`](./phases.md) — فازها، تسک‌ها، تحویل‌دادنی‌ها، دروازه‌ها
- [`skills.md`](./skills.md) — اسکیل‌های upstream و پروژه‌ای + نگاشت به فازها
- [`agents-md.draft.md`](./agents-md.draft.md) — پیش‌نویس `AGENTS.md` پروژه
- [`../../.opencode/skills/`](../../.opencode/skills) — SKILL.mdهای اختصاصی پروژه (توسط OpenCode شناسایی می‌شوند)
- [`../../.opencode/opencode.json`](../../.opencode/opencode.json) — کانفیگ پروژهٔ OpenCode

## تعریف «تمام‌شدن زیرساخت»

- [ ] پروژه با `pnpm dev` و `pnpm build` بالا می‌آید.
- [ ] Postgres و Chroma با Docker Compose بالا می‌آیند و `/api/health` هر دو را تأیید می‌کند.
- [ ] ingestion کامل JSON/MD/TXT/PDF کار می‌کند و idempotent است.
- [ ] dense و hybrid با golden set، برابری قابل‌قبول با oracle دارند.
- [ ] cache کامل (exact-LLM / semantic / embedding) و cascade پورت شده‌اند.
- [ ] همهٔ endpointهای oracle معادل Next دارند.
- [ ] چت با SSE، citation، abort و regenerate کار می‌کند.
- [ ] CI شامل typecheck، lint، unit، integration و build است.
- [ ] oracle فقط برای مقایسه باقی مانده و در runtime محصول استفاده نمی‌شود.

## خارج از دامنهٔ این فاز

- مدل محصول مشاورهٔ تحصیلی و promptهای نهایی آن
- احراز هویت کامل و نقش‌ها (در فاز محصول)
- پرداخت، اشتراک، اعلان
- Confluence / scraper / scheduler
- pgvector، Redis، BullMQ، میکروسرویس، Kubernetes
