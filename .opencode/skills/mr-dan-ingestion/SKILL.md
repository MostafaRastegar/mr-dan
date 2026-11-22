---
name: mr-dan-ingestion
description: File ingestion for JSON/MD/TXT/PDF with Persian normalization, chunking, dedupe, and idempotent storage
---

# mr-dan-ingestion

## Usage

هنگام تغییر loader، نرمال‌سازی متن، اندازهٔ chunk، metadata، یا منطق حذف/بازنویسی سند.

## Pipeline

```text
bytes/file
→ normalizeText
→ loader (json | md | txt | pdf)
→ split
→ contentHash
→ dedupe check
→ deleteByMetadata(document_id)
→ embedDocuments
→ chroma.add
→ prisma.document + ingestionRun
```

## Rules

1. نرمال‌سازی **قبل** از split انجام می‌شود و برای همهٔ فرمت‌ها یکسان است.
2. خروجی نرمال‌سازی باید با oracle byte-identical باشد؛ تغییر آن یک تغییر parity است.
3. chunk id قطعی است: `${documentId}:${index}`.
4. ingestion دوبارهٔ همان فایل باید تعداد chunk را تغییر ندهد.
5. hash محتوا SHA-256 روی متن نرمال‌شده + نام فایل است؛ تغییر نام = سند جدید.
6. metadata حداقل: `document_id`, `original_filename`, `file_type`, `chunk_index`؛ برای PDF `page` و برای Markdown `section`.
7. خطای میانی ingestion باید `IngestionRun` را `failed` بگذارد، نه اینکه رکورد سند را نصفه ذخیره کند.
8. فایل موقت در `os.tmpdir()` ساخته و در `finally` پاک می‌شود.

## Normalization (به ترتیب)

1. حذف BOM (`\uFEFF`)
2. یکسان‌سازی خط پایان: `\r\n` و `\r` → `\n`
3. حذف `\v`, `\f`
4. فشرده‌سازی فاصله‌های افقی تکراری
5. کاهش دو یا چند خط خالی به یک خط خالی
6. trim نهایی

## Chunking

- `RecursiveCharacterTextSplitter` از `@langchain/textsplitters`
- `chunkSize=800`, `chunkOverlap=120`
- جداکننده‌ها به ترتیب: `\n\n`, `\n`, `۔`, `.`, `،`, `؛`, `?`, `!`, ` `, `""`
- متن کوتاه‌تر از اندازه → یک chunk؛ chunk خالی حذف می‌شود.
- هیچ splitter سفارشی جدیدی بدون تست parity اضافه نکن.

## Loaders

| پسوند | قاعده |
|---|---|
| `.json` | آرایه یا object؛ اولین کلید محتوا از `content`, `text`, `body`, `description`, `question/answer` |
| `.md` | متن خام + استخراج heading به‌عنوان `section` |
| `.txt` | متن خام |
| `.pdf` | `unpdf`؛ یک Document به‌ازای هر صفحه + `page` |

- فرمت ناشناخته → `UnsupportedFileError` (415).
- PDF اسکن‌شده (بدون لایهٔ متنی) → خطای صریح، نه chunk خالی.
- حداکثر حجم آپلود از env؛ پیش‌فرض ۲۰MB.

## Steps — افزودن فرمت جدید

1. loader را در `infrastructure/document-loaders/` اضافه کن و در registry ثبت کن.
2. metadata contract را مستند کن.
3. تست: فایل نمونه → تعداد chunk و metadata مورد انتظار.
4. اگر oracle معادل دارد، parity test اضافه کن؛ اگر ندارد، در `parity.md` به‌عنوان divergence ثبت کن.

## Checklist

- [ ] نرمال‌سازی unit test دارد (BOM, CRLF, ZWNJ, blank lines).
- [ ] chunk count با oracle برابر است.
- [ ] ingestion تکراری idempotent است.
- [ ] حذف سند → صفر chunk یتیم.
- [ ] فایل موقت پاک می‌شود.
- [ ] خطای loader پیام قابل‌فهم فارسی دارد.

## Anti-patterns

- split روی متن نرمال‌نشده.
- UUID تصادفی برای chunk.
- ذخیرهٔ فایل آپلودشده در repo یا مسیر عمومی.
- metadata با `any` یا کلیدهای پراکنده (`file`, `filename`, `name`).
