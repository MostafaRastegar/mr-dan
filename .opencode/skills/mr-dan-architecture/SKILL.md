---
name: mr-dan-architecture
description: Layer boundaries, composition root, domain ports, and error mapping for the mr-dan Next.js monolith
---

# mr-dan-architecture

## Usage

هنگام افزودن ماژول، جابه‌جا کردن کد بین لایه‌ها، تعریف port جدید، یا تصمیم دربارهٔ محل یک فایل.

## Rules

1. جهتنمای وابستگی: `app → presentation → application → domain` و `infrastructure → domain`.
2. `domain` هیچ importی از `zod`, `@prisma/client`, `next`, `langchain` ندارد.
3. `application` فقط port و model را import می‌کند؛ هرگز concrete adapter.
4. `presentation` فقط zod، domain type و application use case.
5. `route.ts` نازک است و هیچ منطق دامنه‌ای ندارد.
6. تنها composition root: `src/server/container.ts`.
7. هر port حداقل یک adapter واقعی و یک fake تستی دارد؛ port بدون adapter یا fake = abstraction مرده.
8. خطاهای دامنه با `AppError` و subclassها؛ adapter خطا را wrap می‌کند.

## Layer map

| پوشه | مسئولیت | مجاز به import |
|---|---|---|
| `modules/rag/domain` | مدل، port، خطا | فقط TS stdlib |
| `modules/rag/application` | use case | domain |
| `modules/rag/infrastructure` | Chroma، OpenRouter، Prisma، loader، cache | domain + کتابخانه |
| `modules/rag/presentation` | zod، DTO، error→HTTP | domain، application، zod |
| `app/api/**` | HTTP wiring | presentation، server/container |
| `shared` | env، logger، prisma client | کتابخانه |

## Steps — افزودن قابلیت جدید

1. مدل/قرارداد را در `domain` اضافه کن (اگر مفهوم دامنه است).
2. اگر به دنیای بیرون نیاز دارد، port را در `domain/ports.ts` تعریف کن.
3. use case را در `application` بنویس و فقط به port وابسته باش.
4. adapter را در `infrastructure` پیاده کن.
5. wiring را در `container.ts` انجام بده.
6. schema ورودی/خروجی را در `presentation/schemas.ts` بگذار.
7. route نازک را اضافه کن.
8. تست: unit برای use case با fake، integration برای adapter.

## Container rules

- lazy: تا اولین استفاده ساخته نشود.
- در dev روی `globalThis` cache شود تا HMR اتصال‌ها را تکثیر نکند.
- هیچ factory داخل route ننویس.
- adapterها تک‌نمونه‌اند مگر دلیل صریح.

## Checklist

- [ ] `pnpm lint` و `test/architecture.test.ts` مرزهای لایه‌ها را نقض نکرده‌اند.
- [ ] هیچ import چرخه‌ای نیست.
- [ ] route زیر ۴۰ خط است.
- [ ] port جدید fake تستی دارد.
- [ ] خطا به `AppError` map می‌شود و جزئیات داخلی لو نمی‌رود.

## Anti-patterns

- `BaseRepository<T>` یا لایهٔ generic بی‌استفاده.
- تزریق Prisma client به `application`.
- `container.ts` که همه‌چیز را eager می‌سازد.
- گرفتن `Request` داخل use case.
- try/catch تکراری در هر route برای همان خطا.
