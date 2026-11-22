# mr-dan

پلتفرم مشاورهٔ تحصیلی هوشمند.

- پلن معماری، فازها و اسکیل‌ها: [`docs/plan/`](./docs/plan/README.md)
- راهنمای اجرا، حساب‌های دمو و تست دستی فاز ۵.۱: [`docs/usage-phase-5-1.md`](./docs/usage-phase-5-1.md)
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

دادهٔ دموی اختیاری (فقط dev؛ در production اجرا نمی‌شود و idempotent است):

```bash
pnpm tsx scripts/seed-advising.ts   # حساب‌های counselor و student + یک گروه نمونه
```

اسکریپت نام کاربری‌ها و رمز دمو را یک بار در stdout چاپ می‌کند.

وابستگی جدید فاز ۵.۱ فقط `@tabler/icons-react@3.52.0` است (تنها icon set پروژه، pin دقیق بدون `^`). هیچ متغیر محیطی جدیدی اضافه نشده است؛ نام کوکی و TTL نشست ثابت‌اند، نه config.

صفحات:
- `/` — صفحه اصلی با لینک به چت، پنل دانش و اسناد API
- `/chat` — چتはري streaming با منابع و دکمه-stop
- `/admin/knowledge` — آپلود، لیست، جستجو، حذف اسناد و آمار
- `/api-docs` — اسناد API با Swagger UI (spec در `/api-docs`، spec خام در `/api/openapi`)
- `/login` — ورود با نام کاربری و رمز
- `/register` — ثبت‌نام دانش‌آموز یا مشاور
- `/profile` — مشاهده و ویرایش پروفایل تحصیلی، گروه و مشاور
- `/counselor/students` — پنل مشاور: ساخت گروه و تخصیص دانش‌آموز (فقط مشاور)

بررسی سلامت:

```bash
curl localhost:3000/api/health
# {"status":"ok","dependencies":{"postgres":"ok","chroma":"ok"}, ...}
```

## احراز هویت و پروفایل

- دو نقش: `student` و `counselor`. ثبت‌نام نقش را انتخاب می‌کند؛ نقش مشاور تا فاز ۵.۴ تأیید ادمین ندارد.
- نشست در Postgres ذخیره می‌شود و مرورگر فقط توکن را در کوکی `mrdan_session` دارد: `httpOnly`، `sameSite=lax`، `path=/`، `secure` فقط در production، TTL هفت روز.
- رمز با `node:crypto` و scrypt هش می‌شود (قالب `scrypt$...`)؛ **رمز خام هرگز ذخیره نمی‌شود**. در DB تنها SHA-256 توکن نشست می‌ماند، نه خود توکن.
- دانش‌آموز پروفایل تحصیلی‌اش (پایه، رشته، مدرسه) را می‌بیند و ویرایش می‌کند؛ تغییر رمز نیازمند رمز فعلی است و سایر نشست‌های همان کاربر را باطل می‌کند.
- مشاور گروه می‌سازد و دانش‌آموز را به گروه خودش تخصیص می‌دهد؛ این تخصیص در یک update اتمی انجام می‌شود (یک گروه و یک مشاور برای هر دانش‌آموز).

## محدودیت‌ها

- بدون rate limiting یا قفل حساب پس از تلاش‌های ناموفق ورود.
- بدون تأیید ایمیل و بدون بازیابی رمز عبور.
- ثبت‌نام خودکار نقش `counselor` تا فاز ۵.۴ تأیید ادمین ندارد.
- فیلدهای فیزیکی (سن، قد، وزن، فعالیت، رژیم) در فاز ۵.۳ اضافه می‌شوند؛ فعلاً در پروفایل نیستند.
- پاک‌سازی نشست‌های منقضی lazy است (هنگام resolve)؛ scheduler وجود ندارد.
- اتصال RAG به دادهٔ مشاوره (مالکیت/visibility اسناد) هنوز انجام نشده است.

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
فاز ۵.۱ (هویت، پروفایل، گروه) — کامل

جزئیات در [`docs/plan/phases.md`](./docs/plan/phases.md).
