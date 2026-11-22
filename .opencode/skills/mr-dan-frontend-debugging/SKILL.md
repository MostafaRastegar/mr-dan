---
name: mr-dan-frontend-debugging
description: failure modeهای شناخته‌شدهٔ فرم/اکشن/state و auth در mr-dan (Next 16.4.6 + AntD 6.7.1 RTL). قبل از debug کردن هر باگ submit/state/session این را بخوان.
---

# mr-dan-frontend-debugging

بازنویسی‌شده از `an-front/.agents/skills/an-front-debugging` برای استک ما. مرجع فقط-خواندنی:
`~/project/yaftar/an-front` (+ `an-front/docs/ARCHITECTURE.md §12`). هیچ کپی verbatim نیست.

## استک pin‌شده

```text
next 16.4.6 · react 19.3.1 · antd 6.7.1 · typescript 7.0.2 · prisma 7.10.1
zod 4 · oxlint 1.94.0 · vitest 5.1.1 · pnpm · @tabler/icons-react (pin دقیق)
```

## ۱. `state.ok` همیشه false / فرم بعد از submit ری‌ست می‌شود

- **علت:** `revalidatePath`/`revalidateTag` داخل Server Action. Next صفحه را داخل پاسخ اکشن دوباره رندر می‌کند، Suspense remount می‌شود و `useActionState` ری‌ست می‌شود (vercel/next.js#66426).
- **درمان:** حذفش کن. `runAction` عمداً revalidate ندارد؛ ناوبری داده را تازه می‌کند.
- **بررسی:** `grep -rn revalidatePath src/modules` باید خالی باشد.

## ۲. success با `data !== null` چک می‌شود

- **علت:** شکل دیگری از نتیجه فرض شده. قرارداد فقط `{ ok: true, data } | { ok: false, error }` است.
- **درمان:** `if (state?.ok) ...`؛ state اولیه `null` است، پس `state.ok` بدون optional chaining خطا می‌دهد.

## ۳. فرم بدون `useActionState` یا با `onClick` submit

- **علت:** الگوی کلاینت‌محور اشتباه. ما `useActionState(action, null)` + `<form action={action}>` native داریم.
- **درمان:** submit را به form بسپار؛ دکمه `type="submit"`. هیچ `router.push` داخل handler فرم برای success لازم نیست مگر redirect سرور.

## ۴. مقدار `<select>` در FormData نیست

- **علت:** AntD `Select` یک کامپوننت کنترل‌شده است و input مخفی native submit نمی‌کند.
- **درمان:** برای role/grade/field از `<select name="...">` ساده استفاده کن. اگر AntD `Select` لازم شد، `<input type="hidden" name>` هم‌زمان بگذار.

## ۵. `fieldErrors` روی فرم ظاهر نمی‌شود

- **بررسی:** کلید `fieldErrors` با `name` همان input یکی است؟ zod path (اولین segment) با نام فیلد مطابقت دارد؟ همان `form`/همان state به هر دو سمت (فرم و پیام) رسیده؟
- **درمان:** نام فیلد در `registerSchema`/`updateProfileSchema` و `name` input را هم‌تراز کن؛ پیام فارسی از `toFieldErrors` می‌آید. (an-front این را در `useServerFormErrors` متمرکز کرده؛ اگر ۵.۲ فرم AntD آورد، نگاشت `error.fieldErrors` → `form.setFields` باید فقط یک‌جا باشد.)

## ۶. ۴۰۱/۴۰۳ در Server Action

- **علت:** اکشن به hidden field یا ورودی کلاینت تکیه کرده. هویت باید از کوکی session سمت سرور خوانده شود.
- **درمان:** `requireSessionUser()` / `requireCounselor()` در اکشن؛ role و ownership روی سرور چک شود. پنهان‌کردن دکمه دلیل کافی نیست (IDOR).

## ۷. ری‌دایرکت بی‌دلیل به `/login`

- **بررسی:** نام کوکی `mrdan_session`؛ `httpOnly` پس کلاینت نمی‌تواند بخواند (طبیعی است)؛ `secure` فقط در production؛ session ردیف منقضی باید lazy حذف شود.
- **درمان:** `ResolveSessionUseCase` را مستقیم با توکن کوکی تست کن؛ کوکی replay بعد از logout باید `null` بدهد.

## ۸. submit هیچ کاری نمی‌کند / native POST تلاش شده

- **علت:** دکمه `type` ندارد یا بیرون فرم است. antd v6 (`rc-field-form`) روی submit خودش `preventDefault` می‌زند، پس native POST هرگز جواب نمی‌دهد.
- **درمان:** دکمه `type="submit"` داخل همان `<form>`؛ در فرم‌های AntD (از ۵.۲) `htmlType="submit"` + `onFinish`. هیچ `method`/`action` روی `<form>` ننویس.

## ۹. success با پیام پیش‌فرض فارسی

- **علت:** پیام از سرور خالی آمده و پیش‌فرض نمایش داده می‌شود.
- **قاعدهٔ اولویت (از an-front):** `data.message ?? data.detail ?? 'عملیات با موفقیت انجام شد'`. اگر پیام پیش‌فرض دیدی، مشکل در پیام فارسی سمت اکشن است، نه در کامپوننت.

## ۱۰. باگ بعد از تغییر نامرتبط «ناپدید» شد

- **علت:** bundle کهنهٔ dev-server بعد از تغییر فایل‌های server/shared.
- **درمان:** `pnpm dev` را restart کن، دوباره repro کن، بعد نتیجه بگیر.

## ترتیب تشخیص (هر باگ submit/state)

1. اکشن از `runAction` رد می‌شود؟ فرم از `useActionState` استفاده می‌کند؟
2. `grep -rn revalidatePath src` — مظنون شمارهٔ دو.
3. Network: payload/response اکشن واقعی را ببین.
4. قبل از باور کردن repro، dev server را restart کن.

## فارسی / RTL

- `dir="rtl"` + `ConfigProvider direction="rtl"` سراسری؛ اگر چیدمان فرم شکست، اول theme/layout را چک کن نه hard-coded style.
- پیام‌های خطا فارسی و کوتاه؛ هیچ stack/SQL/توکن داخل `ActionError.message` یا `fieldErrors` نمی‌رود.
- اعداد فارسی فقط برای `username`/`email` نرمال می‌شوند؛ رمز هرگز.
