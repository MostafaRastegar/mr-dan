---
name: mr-dan-rag
description: Retrieval-augmented generation pipeline — dense/hybrid search, RRF, LLM reranking, cascade, caching, prompts, and streaming
---

# mr-dan-rag

## Usage

هنگام تغییر retrieval، آستانه‌ها، rerank، prompt، cache، یا ترتیب مراحل پاسخ‌دهی.

## Canonical parameters

```text
top_k=5 · fetch_k=20
retrieval_min_score=0.35 · low_relevance_threshold=0.45
rerank=true · rerank_top_n=5 · rerank_min_score=3 (0..10)
hybrid=true · bm25_weight=0.4 · RRF k=60
multi_query=false · count=3
query_expansion=false · count=3
loose_prompt=false
semantic_cache=true · threshold=0.97 · maxsize=500
ttl_embedding=3600 · ttl_llm=86400
```

منبع حقیقت: `src/shared/env.ts`. این بلوک باید با آن یکی بماند.

## Retrieval order

```text
1. exact cache   (hash(question + promptVersion + model))
2. embedQuery
3. semantic cache (cosine ≥ 0.97)
4. retrieve: dense(fetch_k) [+ BM25 → RRF اگر hybrid]
5. filter score ≥ 0.35
6. cascade اگر خالی/کم‌بازده:
     stage 2: query expansion (LLM → 3 بازنویسی → merge با RRF)
     stage 3: loose prompt
7. rerank با LLM → top_n=5، حذف < 3
8. prompt + history → LLM
9. cache update (exact + semantic)
```

- rerank **بعد** از fusion و **قبل** از ساخت context است.
- ترتیب oracle حفظ می‌شود؛ جابه‌جایی مراحل یک تغییر parity است که باید اندازه‌گیری شود.
- شکست rerank هرگز request را fail نمی‌کند: ترتیب ورودی truncate می‌شود.

## Hybrid

- dense: cosine از Chroma.
- sparse: `BM25Retriever` از `@langchain/community/retrievers/bm25` با `preprocessFunc` فارسی.
- fusion: RRF سفارشی، نه `EnsembleRetriever` (چون score نرمال‌شده و قابل‌مقایسه نمی‌دهد).

```text
score = Σ weight_i / (k + rank_i)      k = 60, weight = [0.4, 0.6]
سپس min-max نرمال به 0..1
```

- نتیجهٔ hybrid باید بازهٔ ۰..۱ بدهد؛ آستانه‌های 0.35/0.45 فقط روی مسیر dense معنا دارند.
- ایندکس BM25 در حافظه ساخته می‌شود و با تغییر تعداد chunk باطل/rebuild می‌شود.

## Multi-query (flag-driven)

- فقط وقتی `multi_query_enabled=true` است.
- LLM از سؤال اصلی `multi_query_count=3` بازنویسی می‌سازد و هر بازنویسی + سؤال اصلی retrieve می‌شود.
- نتایج با همان RRF ادغام می‌شوند (نه concat ساده).
- هزینه: `1 + count` فراخوانی embedding و یک فراخوانی LLM اضافه → پیش‌فرض خاموش.
- شکست تولید بازنویسی → فقط سؤال اصلی؛ request fail نمی‌شود.

## Persian tokenizer (باید با oracle یکی باشد)

1. lowercase (برای لاتین)
2. `ي → ی`, `ك → ک`, `ۀ → ه`, `أ/إ → ا`
3. حذف اعراب
4. حذف/یکسان‌سازی ZWNJ (`\u200c`)
5. حذف punctuation
6. split روی فاصله

هر تغییر این تابع = تغییر اعداد parity. اول در oracle بسنج.

## Rerank

- listwise: همهٔ candidateها در یک prompt، خروجی JSON `{index, score}`.
- `temperature=0`, `max_tokens=1024`.
- score خارج از ۰..۱۰ → clamp؛ index نامعتبر → نادیده.
- اگر پاسخ JSON خراب بود: یک retry، بعد fallback به ترتیب اولیه.
- prompt rerank بخشی از `promptVersion` است.

## Cache

| لایه | کلید | TTL |
|---|---|---|
| exact | `sha256(question + promptVersion + model)` | `ttl_llm` |
| semantic | embedding سؤال | `ttl_llm` |
| embedding | `sha256(text + model)` | `ttl_embedding` |

- semantic فقط وقتی فعال است که `cache_semantic_enabled`.
- maxsize = 500؛ LRU.
- `POST /api/admin/cache/clear` هر سه را پاک می‌کند.
- کش شامل sources نیست مگر صریحاً ذخیره شود؛ پاسخ کش‌شده باید behavior یکسان با پاسخ تازه داشته باشد.

## Prompts

- strict: فقط بر اساس context پاسخ بده؛ اگر کافی نیست صریح بگو.
- loose (flag): اجازهٔ استفاده از دانش عمومی، با اعلام آن.
- context: هر chunk با برچسب منبع (`original_filename`, `page`/`section`) تا citation ممکن باشد.
- تاریخچه: حداکثر ۱۰ پیام آخر؛ system prompt دوباره تزریق نمی‌شود.
- `promptVersion` رشتهٔ ثابت در یک فایل است؛ هر تغییر prompt آن را bump می‌کند.

## Steps — تغییر رفتار

1. عدد/قاعده را در oracle با golden set بسنج (اگر معادل دارد).
2. `env.ts` + این اسکیل + `AGENTS.md` را هم‌زمان به‌روز کن.
3. تست unit برای منطق، parity برای عدد.
4. اگر افت داد، revert؛ تنظیم آستانه برای سبز کردن تست ممنوع.

## Checklist

- [ ] ترتیب مراحل با این سند یکی است.
- [ ] rerank fallback تست دارد.
- [ ] cache hit/miss تست دارد.
- [ ] hybrid score در ۰..۱ است.
- [ ] promptVersion bump شده.
- [ ] هیچ متن خامی از exception به کاربر نمی‌رود.

## Anti-patterns

- `EnsembleRetriever` بدون نرمال‌سازی score.
- rerank روی همهٔ ۲۰ candidate با top_n بزرگ (هزینهٔ توکن).
- cache بدون TTL یا بدون کلید مدل.
- ساخت context از chunkهای زیر آستانه.
- تغییر prompt بدون bump نسخه.
