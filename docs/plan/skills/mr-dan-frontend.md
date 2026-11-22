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
