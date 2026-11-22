---
name: mr-dan-devops
description: Environment validation, Docker Compose, CI, logging, and metrics for mr-dan
---

# mr-dan-devops

## Usage

هنگام تغییر env، Docker، CI، لاگ، متریک، یا راه‌اندازی محیط توسعه.

## Env

- تنها محل خواندن `process.env`: `src/shared/env.ts` با zod.
- در boot validate می‌شود؛ متغیر گمشده = خطای صریح، نه `undefined` در عمق کد.
- `.env.example` کامل و بدون secret.
- secretها: `.env` و `.env.oracle` در `.gitignore`.
- تفکیک: `DATABASE_URL`, `CHROMA_URL`, `OPENROUTER_API_KEY`, `OPENROUTER_BASE_URL`, `EMBEDDING_MODEL`, `LLM_MODEL`, `MAX_UPLOAD_MB`, `LOG_LEVEL`.

## Docker Compose

```yaml
services:
  postgres:  image: postgres:17   # healthcheck pg_isready, volume
  chromadb:  image: chromadb/chroma  # healthcheck روی 8000 داخل کانتینر؛ host 8001 چون 8000 مال oracle است
  app:       build: .             # profile: full، پورت 3000
```

- `depends_on: condition: service_healthy` برای app.
- Chroma با `IS_PERSISTENT=TRUE` و volume.
- app در حالت dev با bind mount؛ در production `output: "standalone"`.
- هیچ رمز پیش‌فرض در compose؛ از `.env` بخوان.

## CI

```text
1. pnpm install --frozen-lockfile
2. pnpm typecheck
3. pnpm lint
4. pnpm test
5. pnpm build
6. (اختیاری) docker compose up + integration
```

- cache کردن store pnpm.
- fail-fast روی lint/type.
- هیچ تستی که به OpenRouter واقعی نیاز دارد در CI پیش‌فرض اجرا نمی‌شود.

## Logging

- pino، JSON در production، pretty در dev.
- فیلدهای ثابت: `requestId`, `route`, `durationMs`, `cache`, `topK`, `errorCode`.
- هرگز: کلید API، متن کامل سند، embedding، محتوای کاربر.
- خطا با `cause` لاگ می‌شود، ولی پاسخ کاربر فقط کد و پیام کوتاه.

## Metrics

`GET /api/metrics` با فرمت Prometheus:

```text
mrdan_requests_total{route,status}
mrdan_request_duration_seconds{route}
mrdan_retrieval_duration_seconds
mrdan_cache_hits_total{layer}
mrdan_llm_errors_total{kind}
mrdan_chunks_total
```

- بدون label با cardinality بالا (سؤال کاربر، id).
- health جدا از metrics است.

## Checklist

- [ ] env در boot validate می‌شود.
- [ ] `docker compose up` از صفر کار می‌کند.
- [ ] health واقعاً dependencyها را چک می‌کند، نه `{ok:true}` ثابت.
- [ ] CI روی PR اجرا می‌شود.
- [ ] لاگ‌ها secret ندارند.
- [ ] metrics بدون label پرخطر.

## Anti-patterns

- `process.env.X!` در کد پراکنده.
- health که فقط `200` برمی‌گرداند.
- compose با رمز hard-coded.
- لاگ کردن کل prompt در production.
- metrics با label `question`.
