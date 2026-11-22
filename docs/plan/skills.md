# mr-dan — اسکیل‌ها

دو دسته اسکیل داریم:

1. **Upstream** — با CLI نصب می‌شوند و دست‌نخورده می‌مانند. سفارشی‌سازی از طریق `AGENTS.md` و اسکیل‌های پروژه‌ای انجام می‌شود.
2. **پروژه‌ای** — دست‌نویس، مخصوص همین استک و همین معماری، در `.agents/skills/`.

اسکیل‌های `mr-rag-*` در مخزن oracle **کپی نمی‌شوند**. آن‌ها Python-centric هستند و بعضی مقادیرشان کهنه است (مثلاً `min_score=0.15` و `chunk_size=512`). آن‌ها فقط مرجع تاریخی‌اند؛ نسخهٔ درست، `mr-dan-*` است.

---

## ۱. Upstream

| اسکیل | نقش | فاز | چرا لازم است |
|---|---|---|---|
| `vercel-react-best-practices` | قواعد React/Next عملکردی | ۲، ۴ | stream، `use client`، memo، waterfall |
| `clean-architecture` | مرز لایه‌ها و inversion | ۰ | پشتوانهٔ نظری `mr-dan-architecture` |
| `clean-code` | نام‌گذاری، توابع کوچک، کامنت | همه | یکدستی کد |
| `prisma-orm-setup` | راه‌اندازی Prisma 7 | ۰، ۳ | schema، client، migration |
| `prisma-client-api` | query نویسی درست | ۱، ۳ | repositoryها، relation، transaction |
| `ant-design` | الگوهای AntD | ۰، ۴ | فرم، table، RTL، theme |
| `tailwind-design-system` | توکن‌ها و Tailwind v4 | ۰، ۴ | فقط به‌عنوان مرجع CSS-first |

نصب (منبع هر اسکیل را قبل از نصب با `npx skills find <name>` تأیید کن؛ نام مخزن را حدس نزن):

```bash
npx skills find vercel-react-best-practices
npx skills add <owner/repo> -s vercel-react-best-practices -y --copy
# همین الگو برای بقیه
npx skills list          # تأیید نصب در .agents/skills/
```

قواعد:

- `--copy` تا محتوا در ریپو version شود و بازبینی‌پذیر بماند.
- نسخه/commit منبع را در `skills.lock.md` یا `AGENTS.md` ثبت کن.
- فایل‌های upstream را ویرایش نکن؛ اگر قاعده‌شان با پروژه نمی‌خواند، در اسکیل پروژه‌ای override کن و دلیل را بنویس.

**نصب نمی‌شود:** `langchain-build-agent` و بقیهٔ اسکیل‌های رسمی LangChain. آن‌ها Python-first و agent-centric هستند؛ pipeline ما deterministic است و از LangChain فقط برای splitter/retriever/prompt استفاده می‌کند.

---

## ۲. پروژه‌ای

| اسکیل | دامنه | فاز | جایگزین کدام اسکیل oracle |
|---|---|---|---|
| `mr-dan-architecture` | لایه‌ها، مرزها، container، خطاها | ۰ | `mr-rag-01`, `02`, `03`, `04`, `05`, `12` |
| `mr-dan-ingestion` | loader، نرمال‌سازی، chunking، dedupe | ۱ | `mr-rag-09` |
| `mr-dan-rag` | embedding، hybrid، rerank، cascade، cache | ۱، ۲ | `mr-rag-06`, `10` |
| `mr-dan-api` | route handler، zod، SSE، error mapping | ۲، ۳ | `mr-rag-07`, `08` |
| `mr-dan-persistence` | Prisma 7، repository، مکالمه، migration | ۱، ۳ | `mr-rag-05` (بخش ذخیره‌سازی) |
| `mr-dan-frontend` | AntD 6 + Tailwind 4 + RTL + چت | ۰، ۴ | `mr-rag-15` |
| `mr-dan-testing-parity` | Vitest، fake، integration، golden set | ۰–۴ | `mr-rag-13` |
| `mr-dan-devops` | env، docker، CI، observability | ۰، ۴ | `mr-rag-12` |

`mr-rag-11` (scheduler) پورت نمی‌شود: scheduler و scraper حذف شده‌اند.
`mr-rag-14` (code generation) به `AGENTS.md` + `clean-code` منتقل شده است.

این فایل‌ها در پلن به‌صورت تخت (`skills/<name>.md`) نگه داشته می‌شوند. در Build، هر کدام به `.agents/skills/<name>/SKILL.md` کپی می‌شود؛ frontmatter بدون تغییر می‌ماند.

---

## ۳. قواعد نوشتن اسکیل پروژه‌ای

1. **frontmatter** حداقلی: `name`, `description`. توضیح یک‌خطی و مشخص.
2. ساختار ثابت: `Usage` → `Rules` → `Steps` → `Checklist` → `Anti-patterns`.
3. هر عدد (آستانه، اندازه، نام مدل) فقط یک منبع حقیقت دارد: `src/shared/env.ts`. اسکیل عدد را **تکرار** می‌کند تا agent سریع تصمیم بگیرد، پس هر تغییر باید هم‌زمان در سه جا اعمال شود.
4. مسیرها واقعی و نسبی به ریشهٔ repo باشند (`src/modules/rag/...`).
5. مثال کد فقط برای الگوی مرزی؛ کد کامل تکرار نکن.
6. اگر قاعده‌ای از upstream را نقض می‌کند، صریح بنویس «این اسکیل بر X اولویت دارد».

---

## ۴. پارامترهای مرجع (باید با env یکی بماند)

```text
chunk 800 / overlap 120
top_k 5 / fetch_k 20
retrieval_min_score 0.35 / low_relevance 0.45
rerank on / top_n 5 / min_score 3
hybrid on / bm25 weight 0.4 / RRF k 60
multi_query off / count 3
query_expansion off / count 3
loose_prompt off
semantic cache on / threshold 0.97 / maxsize 500
ttl embedding 3600 / ttl llm 86400
embedding nvidia/llama-nemotron-embed-vl-1b-v2:free
chat nvidia/nemotron-3-ultra-550b-a55b:free
```

---

## ۵. نگهداری

- هر فاز که تمام شد، اسکیل همان فاز بازخوانی می‌شود؛ اگر کد و اسکیل واگرا شدند، **کد مرجع است** و اسکیل اصلاح می‌شود.
- در پایان فاز ۴ یک audit: هر عدد در اسکیل‌ها با `env.ts` diff شود.
- اسکیل تکراری یا مرده حذف می‌شود؛ اسکیل بدون مصرف، بدهی است.
