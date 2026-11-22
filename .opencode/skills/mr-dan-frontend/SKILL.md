---
name: mr-dan-frontend
description: Ant Design 6 + Tailwind 4 RTL conventions for the mr-dan chat and knowledge panels
---

# mr-dan-frontend

## Usage

هنگام ساخت صفحه، کامپوننت چت، فرم آپلود، جدول اسناد، یا پنل ادمین.

## Stack split

- **AntD**: کامپوننت‌های تعاملی (Button, Form, Table, Upload, Modal, message, Drawer, Input).
- **Tailwind**: layout، فاصله، تایپوگرافی، حالت‌های responsive.
- هیچ‌کدام جای دیگری را «بازنویسی» نمی‌کند. اگر Tailwind دارد ظاهر یک کامپوننت AntD را عوض می‌کند، اول `theme` را تغییر بده.

## Rules

1. RTL سراسری: `ConfigProvider direction="rtl"` + `locale={faIR}`؛ `dir="rtl"` روی `<html>`.
2. فونت فارسی از `next/font/local` (وزیرمتن)؛ fallback سیستم.
3. `"use client"` فقط برای کامپوننت‌هایی که state/event/stream دارند.
4. داده در Server Component fetch می‌شود؛ کلاینت فقط برای تعامل.
5. هیچ `fetch` خام در کامپوننت؛ یک کلاینت تایپ‌شده در `src/lib/api-client.ts`.
6. استریم با `fetch` + `ReadableStream` و parser خط‌به‌خط SSE؛ `EventSource` برای POST مناسب نیست.
7. `AbortController` برای stop؛ unmount → abort.
8. لودینگ، خطا و خالی‌بودن هر لیست/چت صریح نمایش داده شود (پیام فارسی).
9. Citation قابل‌کلیک: نام فایل + صفحه/بخش؛ کلیک → drawer با متن chunk.
10. Markdown پاسخ با `react-markdown` + `remark-gfm`؛ HTML خام رندر نمی‌شود.

## Component structure

```text
src/components/
├─ chat/
│  ├─ chat-panel.tsx
│  ├─ message-list.tsx
│  ├─ message-bubble.tsx
│  ├─ citation-drawer.tsx
│  └─ chat-input.tsx
├─ knowledge/
│  ├─ upload-form.tsx
│  ├─ document-table.tsx
│  └─ retrieval-debug.tsx
└─ ui/                     # wrapperهای کوچک AntD، نه fork
```

- الگوی props صریح؛ بدون context سراسری برای state محلی.
- state چت با `useReducer` (چون transitionهای زیاد دارد)، نه ۸ تا `useState`.

## Steps — صفحهٔ چت

1. server component: پوسته و metadata.
2. client component: state پیام‌ها، `status`, `abortRef`.
3. ارسال: append user → open stream → token → sources → done.
4. خطا: پیام assistant با `status: "error"` و دکمهٔ retry.
5. regenerate: آخرین پیام user دوباره ارسال، بدون تکرار در تاریخچه.
6. stop: abort + نگه‌داشتن متن ناقص با برچسب «متوقف شد».

## Checklist

- [ ] RTL در همهٔ فرم‌ها و اعداد درست است.
- [ ] هیچ hard-coded رنگ/فاصله خارج از theme نیست.
- [ ] keyboard: Enter ارسال، Shift+Enter خط جدید.
- [ ] `aria-live` روی ناحیهٔ پاسخ.
- [ ] abort در unmount.
- [ ] empty/loading/error state دارد.
- [ ] هیچ secret یا URL داخلی در bundle نیست.

## Anti-patterns

- میکس کردن دو سیستم طراحی بدون دلیل.
- `useEffect` برای fetch دادهٔ اولیه.
- رندر Markdown با `dangerouslySetInnerHTML`.
- ذخیرهٔ مکالمه در IndexedDB وقتی Postgres منبع حقیقت است.
- انیمیشن سنگین روی هر token.

## ضمیمه — فرم‌ها، اکشن‌ها، responsive و دسترسی (append, بازنویسی‌شده از `an-front/.agents/skills/{an-front-architecture,an-front-responsive,ui-access-control}`)

استک pin‌شده: next `16.4.6` · react `19.3.1` · antd `6.7.1` · tailwind `4.3.5` · typescript `7.0.2` · `@tabler/icons-react` (تنها icon set، pin دقیق).
مرجع فقط-خواندنی: `~/project/yaftar/an-front`. هیچ کپی verbatim نیست (آن مخزن LICENSE ندارد).

### تقسیم RSC / client

- صفحهٔ داده `RSC` است: هویت/داده را با use case روی سرور می‌گیرد و prop سریالایز می‌دهد. `"use client"` فقط برای فرم/جدول تعاملی.
- هیچ `fetch` در کامپوننت؛ هیچ `useEffect` برای دادهٔ اولیه؛ هیچ state سرور در کلاینت. (an-front هم client-side axios/react-query را ممنوع کرده و `/api` داخلی را استثنا گذاشته؛ ما حتی آن استثنا را هم نداریم چون داده درون‌فرایندی است.)
- کل صفحهٔ محافظت‌شده `force-dynamic`-معادل است: هر ناوبری داده را تازه می‌خواند، پس چیزی برای invalidate کردن نیست.

### فرم با Server Action (نه AntD `Form`)

- `<form action={action}>` native + `useActionState(action, null)`؛ دکمه `type="submit"`.
- ورودی‌های متنی با AntD `Input`/`Input.Password`/`Button`؛ انتخاب‌ها با `<select name>` native (AntD `Select` مقدار native submit نمی‌کند).
- موفقیت: `state?.ok === true` → redirect یا پیام؛ خطا: `state.error.fieldErrors[field]` کنار همان فیلد + `state.error.message` بالای فرم.
- وقتی ۵.۲ اولین `Form` واقعی AntD را آورد: submit فقط با `htmlType="submit"` و `onFinish`؛ هیچ `onClick` submit، هیچ `router.push` داخل `onFinish`، هیچ toast دستی (an-front این‌ها را در سه گلوگاه خودکار می‌کند). `rc-field-form` خودش `preventDefault` می‌زند، پس native POST ممکن نیست.

### قرارداد نتیجه و revalidatePath

- تنها شکل نتیجه: `{ ok: true, data } | { ok: false, error: { code, message, fieldErrors? } }`. هیچ شکل `{ status }`.
- داخل Server Action هرگز `revalidatePath` صدا نزن (ری‌ست `useActionState`، vercel/next.js#66426).

### آیکون، data-testid و حالت‌ها

- فقط `@tabler/icons-react`؛ import از پکیج آیکون AntD ممنوع.
- هر عنصر تعاملی جدید `data-testid` پایدار بگیرد (`form-input-<name>`، `form-item-<name>`، `modal-<title>`). an-front این‌ها را در `src/constants/test-ids.ts` متمرکز کرده؛ وقتی spec دوم نوشته شد، معادل `src/constants/test-ids.ts` را در ما بساز. spec فعلی `tests/e2e/advising-auth.spec.ts` با `input[name=…]` و متن دکمه کار می‌کند و بازنویسی لازم نیست.
- هر لیست: حالت خالی فارسی (`<Empty>` یا متن)، حالت pending از `useActionState`، خطای فرم کنار فیلد با `role="alert"`.

### responsive (از `an-front-responsive`)

- بدون overflow افقی در ۳۶۰px؛ جدول داخل خودش اسکرول می‌کند (`scroll={{ x: 800 }}` + ستون اول `fixed: 'left'` وقتی جدول واقعی آمد).
- چیدمان با breakpointهای Tailwind، نه store دستگاه: `grid-cols-1 lg:grid-cols-2`، `flex flex-col gap-4 lg:flex-row`.
- انباشتن فقط در یک جهت؛ کارت در ستون موبایل عرض کامل دارد و `max-w-[…]` دسکتاپ روی خودش نمی‌ماند.
- soft targets ≥۴۴px، ۲۰۰٪ zoom سالم، `focus-visible` حذف نمی‌شود.
- an-front مودال را زیر `lg` به BottomSheet تبدیل می‌کند؛ ما تا وقتی مودال نداریم (۵.۴) این قاعده را وارد نمی‌کنیم.

### دسترسی (از `ui-access-control`)

- گارد سرور مرز امنیت است؛ پنهان‌کردن UI فقط UX است. هر اکشن دوباره authorize می‌کند.
- یک ماپ capability در ماژول، نه `role === "counselor"` پراکنده در کامپوننت‌ها.
- کنترل غیرمجاز **حذف** می‌شود، نه `disabled`.
- سطح ردیف (مشاور فقط گروه/دانش‌آموز خودش) در use case چک می‌شود، نه فقط در صفحه.
- ماتریس بررسی برای هر سطح: بدون نشست → `/login`؛ نشست بدون مجوز → ۴۰۳؛ owner → مجاز؛ مشاور دیگر → ۴۰۳؛ ادمین (۵.۴) → مجاز.

### فارسی / RTL

- RTL سراسری از root layout؛ چیدمان با Tailwind، ظاهر AntD با theme، بدون hard-coded style موازی.
- برچسب/خطا فارسی؛ ارقام فارسی فقط در `username`/`email` به ASCII تبدیل می‌شوند، هرگز در رمز.
