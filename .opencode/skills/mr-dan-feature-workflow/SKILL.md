---
name: mr-dan-feature-workflow
description: گام‌به‌گام افزودن قابلیت محصول (schema → use case → port/adapter → server action → RSC page → client form → tests) در mr-dan. برای هر فیچر جدید مشاوره/پلتفرم.
---

# mr-dan-feature-workflow

بازنویسی‌شده از `an-front/.agents/skills/an-front-feature` (+ `docs/ARCHITECTURE.md` آن) برای استک ما.
مرجع فقط-خواندنی: `~/project/yaftar/an-front`؛ هیچ فایل یا config از آن کپی نمی‌شود (LICENSE ندارد).

## استک pin‌شده (تغییر نده بدون تأیید انسان)

```text
next 16.4.6 · react 19.3.1 · typescript 7.0.2 · tailwindcss 4.3.5
antd 6.7.1 · @ant-design/nextjs-registry 1.3.0
prisma 7.10.1 (@prisma/adapter-pg) · zod 4 · oxlint 1.94.0
vitest 5.1.1 · @playwright/test 1.65.1 · pnpm
@tabler/icons-react — تنها icon set پروژه (pin دقیق، بدون `^`)
```

## ترتیب کار (اجباری)

1. **Schema** — مدل Prisma additive؛ `pnpm prisma migrate dev --name <verb_noun>` بعد `pnpm prisma generate`. migration اعمال‌شده را هرگز ویرایش نکن.
2. **Domain** — `src/modules/<name>/domain/{models,ports,errors}.ts`. `domain` هیچ import خارجی ندارد (نه zod، نه next، نه prisma).
3. **Use case** — `application/`؛ فقط به port و model وابسته. mutation همیشه authorize می‌کند (`actor`, ownership) نه فقط UI.
4. **Port + adapter** — interface در `domain/ports.ts`، پیاده‌سازی در `infrastructure/prisma-*.ts` با `select` صریح و map row → domain. fake در `test/fakes/`.
5. **Server Action** — `src/server/<name>-actions.ts` با `"use server"`؛ `runAction(...)`؛ `useActionState(action, null)`؛ نتیجه فقط `ActionResult`. داخل `presentation/` نگذار: تست معماری `presentation → server` را ممنوع می‌کند.
6. **RSC page** — `app/**/page.tsx` async server: گارد (`requireSessionUser`/`requireCounselor`) + داده از use case + prop سریالایز. هرگز `"use client"`.
7. **Client form** — یک کامپوننت `"use client"`: `<form action={action}>` native + AntD `Input`/`Button`؛ انتخاب‌ها با `<select name>` native (AntD `Select` مقدار native submit نمی‌کند). خطاها از `state.error.fieldErrors` کنار فیلد. اگر کامپوننت از ~۸۰ خط گذشت، به `*.vm.tsx` (state) + `*.view.tsx` (markup) بشکن.
8. **Tests** — unit برای use case با fake، unit برای schema/crypto/cookie، integration برای کوئری واقعی (graceful skip)، e2e پشت `E2E_ENABLED=true`. عنصر تعاملی جدید `data-testid` پایدار بگیرد. سپس `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.

## قرارداد نتیجهٔ اکشن

```ts
type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; fieldErrors?: Record<string, string> } };
```

- موفقیت **فقط** با `state.ok` (معنی: `state?.ok === true`) تشخیص داده می‌شود؛ هرگز `data !== null`.
- هیچ شکل `{ status: "idle" | "success" }` در فرم‌ها وجود ندارد.
- `fieldErrors` = هر فیلد دقیقاً یک پیام فارسی.

## قاعدهٔ سخت: `revalidatePath`

داخل Server Action هرگز `revalidatePath`/`revalidateTag` صدا نزن. Next صفحه را داخل پاسخ
اکشن دوباره رندر می‌کند، Suspense remount می‌شود و `useActionState` ری‌ست می‌شود
(vercel/next.js#66426)؛ state موفقیت هرگز به کلاینت نمی‌رسد. داده با ناوبری RSC تازه می‌شود.
an-front همین باگ را در `ARCHITECTURE.md §12.1` مستند کرده و `runAction` را طوری نوشته که
پارامتر revalidate را عمداً ignore کند.

`redirect()` بیرون از `try/catch` صدا زده می‌شود وگرنه `NEXT_REDIRECT` بلعیده می‌شود.

## فارسی / RTL

- `dir="rtl"` + `ConfigProvider direction="rtl"` + `locale={faIR}` سراسری است؛ صفحهٔ جدید چیزی override نمی‌کند.
- تمام برچسب‌ها و پیام‌های خطا فارسی؛ پیام خطا هرگز متن داخلی/stack/SQL لو نمی‌دهد.
- ارقام فارسی/عربی فقط در `username`/`email` به ASCII تبدیل می‌شوند (`toAsciiDigits`)؛ رمز دست‌نخورده می‌ماند.

## Anti-patterns

- منطق دامنه در `route.ts` یا کامپوننت React.
- route handler جدید برای فرم درون‌برنامه‌ای؛ mutation = Server Action.
- import یا vendor از مرجع فقط-خواندنی (`an-front`, `mr-rag`, `example/`) و پکیج آیکون AntD.
- `any`، cast برای خفه‌کردن typecheck، یا skip کردن assertion تست برای سبز شدن.
- `disabled` کردن کنترل به‌جای حذف آن برای کاربر غیرمجاز.
