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


## ضمیمه — جریان محصول (append, بازنویسی‌شده از `an-front/.agents/skills/an-front-architecture`)

استک pin‌شده: next `16.4.6` · react `19.3.1` · typescript `7.0.2` · antd `6.7.1` · prisma `7.10.1` · zod `4` · oxlint · pnpm.
مرجع فقط-خواندنی: `~/project/yaftar/an-front` (+ `an-front/docs/ARCHITECTURE.md`). هیچ کپی verbatim نیست.

### یک جهت، بدون پرش لایه

```text
نما (RSC page / client form)
→ Server Action  ('use server', src/server/<name>-actions.ts)
→ Use case        (application/, authorize + validate)
→ Port            (domain/ports.ts)
→ Adapter         (infrastructure/, Prisma/crypto)
```

- کامپوننت React هرگز مستقیم Prisma/adapter/use case را import نمی‌کند؛ فقط Server Action.
- use case هرگز `Request`/`FormData`/کوکی نمی‌گیرد؛ ورودی تایپ‌شده می‌گیرد و تصمیم دامنه می‌گیرد.
- adapter تنها جایی است که کتابخانه بیرونی صدا زده می‌شود و خطای آن wrap می‌شود (`cause` حفظ).
- cross-check با layer map: `app → presentation → application → domain`، `infrastructure → domain`، و `domain` بدون import خارجی.

### سه گلوگاه (از an-front، ترجمه‌شده به ما)

| گلوگاه an-front | معادل ما | قاعده |
|---|---|---|
| `utils/app-error.ts` — `ActionState{ok,data,error}` | `src/shared/action-result.ts` — `{ok:true,data} \| {ok:false,error}` | موفقیت فقط `ok`؛ هرگز `data !== null` |
| `utils/server-action.ts` — `runAction(fn, ..._revalidate)` | `src/modules/<name>/presentation/run-action.ts` | تنها راه نوشتن اکشن؛ پارامتر revalidate اصلاً وجود ندارد |
| `utils/use-form-action.ts` — `useFormAction` + `useServerFormErrors` | native `<form action>` + `useActionState(action, null)` | نگاشت `fieldErrors` و pending؛ بدون hook روی `FormInstance` |

### تثلیث ماژول (از `an-front/src/modules/<domain>/`)

| an-front | ما |
|---|---|
| `<domain>.types.ts` (DTO) | `domain/models.ts` + `domain/ports.ts` |
| `<domain>.service.ts` (server-only، هرگز throw نمی‌کند) | `application/*.ts` (use case؛ خطای دامنه برمی‌گرداند) |
| `<domain>.actions.ts` (`'use server'`) | `src/server/<name>-actions.ts` |

### تثلیث صفحه (از `page / .vm / .view`)

- `page.tsx` — async server: گارد + fetch با use case + `<Suspense>`؛ هرگز `"use client"`.
- کامپوننت `"use client"` — state، `useActionState`، `fieldErrors`، و markup.
- اگر کامپوننت به ~۸۰ خط رسید، به `*.vm.tsx` (state) + `*.view.tsx` (markup) بشکن. زودتر از آن، شکستن = abstraction بی‌مصرف.
- موفقیت در اثرِ `state?.ok` مدیریت می‌شود؛ نه `router.push` داخل submit handler.

### محل action و kit

| قطعه | محل |
|---|---|
| Server Action (`"use server"`) | `src/server/<name>-actions.ts` (تست معماری `presentation → server` را ممنوع می‌کند) |
| گارد نشست/نقش | `src/server/<name>-guards.ts` + layout سرور |
| `runAction` / نگاشت خطا | `src/modules/<name>/presentation/run-action.ts`, `messages.ts` |
| نتیجهٔ اکشن مشترک | `src/shared/action-result.ts` — `{ ok: true, data } \| { ok: false, error }` |
| کوکی/session helper | `src/modules/<name>/presentation/{cookie,session-cookie}.ts` |
| kit مشترک React | `src/components/` (نه fork از AntD، نه vendor از `an-front/src/papak`) |
| wiring adapter → port | فقط `src/server/container.ts` |

### قرارداد نتیجه و قاعدهٔ revalidatePath

- موفقیت فقط با `state?.ok === true` (state اولیه `null`). هیچ `{ status: ... }` وجود ندارد.
- `revalidatePath`/`revalidateTag` داخل Server Action ممنوع: صفحه داخل پاسخ اکشن remount می‌شود و `useActionState` ری‌ست می‌شود (vercel/next.js#66426). an-front دقیقاً همین باگ را در `ARCHITECTURE.md §12.1` مستند کرده است.

### فارسی / RTL

- `dir="rtl"` + `ConfigProvider direction="rtl"` + `locale={faIR}` سراسری؛ مسیر locale جدا نداریم (an-front با `next-intl` می‌رود، ما نه).
- پیام‌های خطا فارسی و بدون جزئیات داخلی؛ ارقام فارسی فقط در `username`/`email` به ASCII نرمال می‌شوند.
