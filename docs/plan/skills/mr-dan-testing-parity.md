---
name: mr-dan-testing-parity
description: Vitest, fakes, integration tests, and the oracle parity harness for the mr-dan RAG port
---

# mr-dan-testing-parity

## Usage

هنگام نوشتن تست، تغییر golden set، یا بررسی اینکه پورت TS با oracle برابر است.

## Test pyramid

| سطح | ابزار | چه‌چیز |
|---|---|---|
| unit | Vitest | normalizer، tokenizer، RRF، cache، schema، use case با fake |
| integration | Vitest + Postgres/Chroma واقعی | repository، ingestion، deletion، SSE |
| parity | `tsx scripts/*` | chunk count، top-k ids، MRR/hit@5 |
| e2e | Playwright | آپلود → پرسش → citation → حذف |

## Rules

1. هیچ تست واحد به شبکه، OpenRouter یا Chroma واقعی وابسته نیست. fake صریح در `test/fakes/`.
2. fakeها رفتار قرارداد را شبیه‌سازی می‌کنند (embedding ثابت برای متن ثابت، LLM پاسخ قابل‌پیش‌بینی).
3. تست integration با دیتابیس واقعی و پاک‌سازی بین تست‌ها.
4. golden set **عیناً** از `scripts/eval_retrieval.py` پورت می‌شود؛ پرسش جدید بدون به‌روزرسانی oracle اضافه نمی‌شود.
5. عدد parity در CI ثبت می‌شود تا رگرسیون دیده شود.
6. تست برای رفتار است، نه برای implementation detail.
7. هر باگ → اول تست failing، بعد fix.

## Parity gates

```text
hit@5 dense = 1.0 · MRR ≥ 0.78
hit@5 hybrid = 1.0 · MRR ≥ 0.92
chunk count == oracle (±0)
top-5 ids: dense ≥ 11/13 · hybrid ≥ 12/13
orphan chunks after delete = 0
```

- تغییر آستانه برای سبز شدن ممنوع.
- اگر عدد مدل free در طول روز نوسان کرد، تست را با snapshot همان روز مقایسه کن و در گزارش ذکر کن.

## Fakes

```text
FakeEmbedding    → deterministic vector از hash متن
FakeLLM          → پاسخ ثابت / پاسخ stream قابل‌تنظیم
FakeVectorStore  → Map در حافظه با همان port
FakeCache        → Map با TTL قابل‌کنترل
```

- fake باید `cause` و خطاهای واقعی را هم بتواند شبیه‌سازی کند (`throwOnCall`).

## Steps — افزودن parity برای قابلیت جدید

1. رفتار oracle را با یک اسکریپت snapshot کن (JSON).
2. همان سناریو را در TS بنویس.
3. diff معنادار: ids، score با تلورانس، ordering.
4. اگر تفاوت عمدی است، در `parity.md` ثبت کن و تست را skip با دلیل.

## Checklist

- [ ] `pnpm test` بدون شبکه سبز است.
- [ ] تست integration در CI با compose profile اجرا می‌شود.
- [ ] هر gate عددی در تست assert شده.
- [ ] هیچ snapshot انسانی‌نوشته بدون توضیح نیست.
- [ ] تست abort و خطای upstream وجود دارد.

## Anti-patterns

- mock کردن `fetch` برای همه‌چیز.
- snapshot تست برای خروجی LLM.
- تستی که به ترتیب تصادفی Map وابسته است.
- `test.skip` دائمی بدون دلیل مکتوب.
