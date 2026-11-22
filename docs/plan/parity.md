# mr-dan — برابری با oracle

هدف: اثبات اینکه پورت TypeScript همان **رفتار بازیابی** پایتون را دارد، قبل از اینکه محصول مشاورهٔ تحصیلی روی آن ساخته شود.

## ۱. Oracle

- مخزن: `https://github.com/MostafaRastegar/mr-rag`
- commit قفل‌شده: `e64febbeb17c016b638112e8c11ae980404be9ee` (2026-11-04)
- مسیر پیشنهادی روی دیسک: `/home/musa/project/mr-rag-oracle` (خارج از ریپوی `mr-dan`)
- فایل `ORACLE.md` در ریشهٔ `mr-dan` باید شامل commit، تاریخ clone، و دستور اجرا باشد.
- oracle هرگز در runtime محصول import یا فراخوانی نمی‌شود؛ فقط ابزار مقایسه است.
- کلید OpenRouter در `.env.oracle` (git-ignored) نگه داشته می‌شود.

اجرای oracle:

```bash
cd /home/musa/project/mr-rag-oracle
docker compose up -d chromadb
uv sync                       # یا pip install -r requirements.txt
uv run uvicorn app.main:app --port 8080
python -m scripts.eval_retrieval --mode dense
python -m scripts.eval_retrieval --mode hybrid
```

## ۲. Corpus و golden set

corpus فعلی oracle:

| فایل | زبان | نقش |
|---|---|---|
| `final report.txt` | انگلیسی | ۱۰ پرسش golden |
| `p9.txt` | فارسی | ۱+ پرسش golden |
| `recipes_1.json` | فارسی/انگلیسی | منبع دوم |
| `recipes_2.json` | فارسی/انگلیسی | منبع دوم |

golden set در `scripts/eval_retrieval.py` تعریف شده و **باید عیناً** به `scripts/eval-retrieval.ts` منتقل شود: همان ۱۳ پرسش، همان `expected_source`، همان `expected_keywords`.

قاعده: هر تغییری در golden set باید **اول** در oracle اعمال و عدد پایه دوباره گرفته شود؛ وگرنه مقایسه بی‌معناست.

## ۳. عدد پایه (ثبت‌شده در `data/eval_retrieval_last.json`)

| حالت | hit@5 | MRR | min score | avg | max |
|---|---|---|---|---|---|
| dense | 1.0 | 0.810 | 0.186 | 0.446 | 0.688 |
| hybrid | 1.0 | 0.949 | 0.882 | 0.960 | 1.0 |

مدل‌ها: `nvidia/llama-nemotron-embed-vl-1b-v2:free` و `nvidia/nemotron-3-ultra-550b-a55b:free`.

## ۴. نگاشت endpointها

| oracle | mr-dan | وضعیت |
|---|---|---|
| `GET /health` | `GET /api/health` | پورت |
| `POST /ingest` | `POST /api/ingest` | پورت |
| `POST /upload` | `POST /api/upload` | پورت (multipart) |
| `POST /chat` | `POST /api/chat` | پورت |
| `POST /chat/stream` | `POST /api/chat/stream` | پورت + SSE named events |
| `POST /search` | `POST /api/search` | پورت |
| `POST /admin/retrieval/debug` | `POST /api/admin/retrieval/debug` | پورت |
| `GET /documents` | `GET /api/documents` | پورت |
| `GET /documents/{id}` | `GET /api/documents/[id]` | پورت |
| `DELETE /documents/{id}` | `DELETE /api/documents/[id]` | پورت |
| `GET /admin/chunks` | `GET /api/admin/chunks` | پورت |
| `DELETE /admin/chunks/{id}` | `DELETE /api/admin/chunks/[id]` | پورت |
| `GET /admin/stats` | `GET /api/admin/stats` | پورت |
| `POST /admin/cache/clear` | `POST /api/admin/cache/clear` | پورت |
| `GET /conversations` | `GET /api/conversations` | پورت |
| `GET/POST /conversations` | `GET/POST /api/conversations` | پورت |
| `PUT/DELETE /conversations/{id}` | `PUT/DELETE /api/conversations/[id]` | پورت |
| `GET /metrics` | `GET /api/metrics` | پورت (Prometheus text) |
| `POST /admin/scheduler/run` | — | **حذف** |
| `GET /admin/scheduler/status` | — | **حذف** |

## ۵. ماتریس رفتار

| رفتار | معیار برابری | نحوهٔ سنجش |
|---|---|---|
| normalization | خروجی byte-identical | unit test با نمونه‌های BOM/CRLF/ZWNJ |
| chunking | تعداد chunk یکسان ±۰ روی همان corpus | اسکریپت `compare-chunks.ts` |
| chunk metadata | همان کلیدها: `document_id`, `original_filename`, `file_type`, `chunk_index`, `page`/`section` | snapshot diff |
| dedupe | ingestion دوباره → تعداد ثابت | integration test |
| dense retrieval | همان top-k ids برای ۱۳ پرسش | اسکریپت parity |
| hybrid | همان ids، score نرمال ۰..۱ | اسکریپت parity |
| rerank | ترتیب پایانی یکسان؛ در خطا، fallback به ترتیب اولیه | fake LLM تست |
| cascade | stage 1→2→3 با همان flagها | integration test |
| exact cache | hit در پرسش یکسان، miss با تغییر promptVersion | integration test |
| semantic cache | hit در cosine ≥ 0.97 | unit test با بردار ثابت |
| حذف سند | صفر chunk باقی‌مانده | integration test |
| SSE | event order: meta → token* → sources → done | e2e |

## ۶. آستانه‌های پذیرش (دروازه)

- `hit@5` هر دو حالت: **= 1.0** (بدون استثنا).
- dense MRR: **≥ 0.78** (افت حداکثر ۴٪ نسبت به ۰.۸۱).
- hybrid MRR: **≥ 0.92** (افت حداکثر ۳٪ نسبت به ۰.۹۴۹).
- top-5 ids در dense: تطابق **≥ ۱۱ از ۱۳** پرسش؛ اختلاف فقط در رتبه‌های ۴–۵ مجاز است.
- تعداد chunk پس از ingestion: **دقیقاً برابر** oracle.
- هیچ chunk یتیمی بعد از حذف سند: صفر.

اگر دروازه رد شد: قبل از هر ترفند، اختلاف splitter/نرمال‌سازی/توکنایزر را پیدا کن. تغییر آستانه‌ها برای «سبز کردن» تست ممنوع است؛ اگر کالیبراسیون لازم شد، در oracle هم اعمال و عدد پایه تجدید می‌شود.

## ۷. تفاوت‌های عمدی

این‌ها نقض برابری نیستند و در تست parity نادیده گرفته می‌شوند:

1. **SSE با event نام‌دار** به‌جای `text/plain`. sources در همان stream می‌آید؛ فراخوانی دوم `/chat` حذف می‌شود.
2. **مکالمه در Postgres** به‌جای SQLite/IndexedDB.
3. **حذف scheduler/scraper** و endpointهای آن.
4. **idempotent ingestion** با id قطعی (`documentId:index`) به‌جای UUID تصادفی.
5. **زمان‌ها** `Date`/`timestamptz` به‌جای unix float.
6. **پاسخ خطا** ساختاریافته با `code` به‌جای `detail` رشته‌ای.
7. **مدل‌های free** فقط پیش‌فرض config هستند، نه بخشی از قرارداد.

## ۸. ابزارها

```text
scripts/
├─ eval-retrieval.ts      # پورت eval_retrieval.py
├─ compare-chunks.ts      # oracle vs mr-dan روی یک فایل
├─ compare-retrieval.ts   # ids و score دو سیستم
└─ snapshot-oracle.ts     # خروجی oracle را JSON می‌کند
```

هر اسکریپت باید بدون سرور Next اجرا شود (`tsx`), و فقط از `container` و adapterها استفاده کند.

## ۹. ریسک‌های شناخته‌شدهٔ برابری

- **PDF:** PyMuPDF و `unpdf` خروجی یکسان نمی‌دهند. PDF در corpus parity فعلی نیست؛ برای PDF یک مجموعهٔ تست جدا با ۳ فایل فارسی لازم است و در صورت افت کیفیت، adapter عوض می‌شود.
- **BM25:** tokenizer پایتون و JS باید کاراکتر‌به‌کاراکتر یکی باشند (ZWNJ، `ي/ك`، اعراب). اولین candidate برای اختلاف.
- **batch embedding:** ترتیب و اندازهٔ batch روی بردار اثر ندارد، ولی برای بازتولید عدد باید batch size ثابت بماند.
- **مدل free:** ممکن است در طول روز رفتار متفاوت داشته باشد. عدد پایه باید در یک پنجرهٔ زمانی نزدیک گرفته شود؛ در غیر این صورت اختلاف به مدل نسبت داده می‌شود، نه به کد.
