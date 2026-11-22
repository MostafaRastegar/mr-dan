---
last_verified: 2026-11-22
source_files: prisma/schema.prisma, src/modules/advising/**, src/server/advising-actions.ts, src/server/advising-guards.ts, src/server/container.ts, src/app/(auth)/**, src/app/(advising)/**, src/components/auth/**, src/components/advising/**, scripts/seed-advising.ts, src/shared/errors.ts, src/shared/action-result.ts, src/shared/persian-digits.ts
---

# فاز ۵.۱: هویت، پروفایل، گروه

## کاربر الان چه کار می‌تواند بکند

هر کسی می‌تواند با نام کاربری، رمز عبور و نقش (دانش‌آموز یا مشاور) ثبت‌نام کند، وارد شود و خارج شود. بعد از ورود به صفحهٔ پروفایل می‌رود و نام، ایمیل، پایه، رشته و مدرسهٔ خود را می‌بیند و ویرایش می‌کند؛ اگر بخواهد رمزش را هم عوض می‌کند. دانش‌آموز در پروفایل نام گروه و نام مشاورش را می‌بیند. مشاور یک صفحهٔ جدا دارد که در آن گروه می‌سازد و دانش‌آموزها را به گروه خودش تخصیص می‌دهد.

## چطور رفتار می‌کند

- بعد از اعمال migration، سه جدول `User`، `Group` و `Session` با یکتایی `User.username`، `User.email` و `Session.tokenHash` ساخته می‌شود.
- هیچ ستون فیزیکی (قد، وزن، سطح فعالیت، رژیم) روی کاربر نیست.
- ثبت‌نام با نام کاربری تکراری پیام فارسی زیر همان فیلد می‌دهد و ردیف دوم ساخته نمی‌شود.
- رمز فقط به شکل `scrypt$16384$8$1$…` ذخیره می‌شود و هرگز برابر متن اصلی نیست.
- نشست فقط `sha256` توکن را در DB نگه می‌دارد؛ خود توکن فقط داخل کوکی `httpOnly` است.
- ورود با رمز اشتباه یا نام کاربری ناشناس یک پیام یکسان ۴۰۱ می‌دهد و هیچ نشستی نمی‌سازد.
- توکن ناشناس به کاربر تبدیل نمی‌شود.
- توکن منقضی به کاربر تبدیل نمی‌شود و ردیفش همان لحظه پاک می‌شود.
- خروج ردیف نشست را پاک می‌کند، پس استفادهٔ دوباره از همان کوکی بی‌اثر است.
- کوکی نشست `httpOnly`، `sameSite=lax`، `path=/` و ۷ روز عمر دارد؛ `secure` فقط در production روشن است.
- کاربر خارج‌شده که `/profile` را باز کند به `/login` فرستاده می‌شود و هیچ داده‌ای نمی‌بیند.
- دانش‌آموز که `schoolName` را عوض کند و صفحه را دوباره بارگذاری کند، مقدار جدید را می‌بیند.
- تغییر رمز با رمز فعلی اشتباه با ۴۰۱ رد می‌شود و هش قبلی دست نمی‌خورد.
- تغییر رمز موفق، نشست‌های دیگر همان کاربر را باطل می‌کند و نشست فعلی را نگه می‌دارد.
- دانش‌آموز نمی‌تواند گروه بسازد (۴۰۳) و هیچ گروهی ساخته نمی‌شود.
- مشاور که دانش‌آموز را به گروه خودش تخصیص می‌دهد، `groupId` و `counselorId` را با یک `update` می‌نویسد؛ گروه مشاور دیگر ۴۰۳ می‌دهد و چیزی عوض نمی‌شود.
- ماژول advising مرزهای لایه‌ای را نگه می‌دارد: دامنه بدون import خارجی، بدون وابستگی application به infrastructure.
- `pnpm typecheck && pnpm lint && pnpm test && pnpm build` سبز است.
- قواعد سطح دیتابیس برقرارند: ایمیل تکراری رد می‌شود، حذف کاربر نشست‌هایش را cascade می‌کند، حذف گروه `groupId` اعضا را `NULL` می‌کند.
- صفحهٔ اصلی لینک ورود و ثبت‌نام دارد که به `/login` و `/register` می‌روند (فقط با خواندن کد بررسی شد؛ در این اجرا کلیک نشد).
- seed دمو بار دوم هم فقط یک مشاور، یک گروه و یک دانش‌آموز نگه می‌دارد، تخصیص را حفظ می‌کند و هش رمز موجود را بازنویسی نمی‌کند. در `NODE_ENV=production` پیش از هر نوشتن خطا می‌دهد.
- رمز ۷ نویسه‌ای با `invalid_input` رد می‌شود و ۸ نویسه‌ای پذیرفته می‌شود.
- `docs/plan/frontend-conventions.md` وجود دارد و دست‌کم ۲۳ ردیف verdict (ADOPT/ADAPT/REJECT/DEFER) را نگه می‌دارد.
- اکشن نامعتبر `{ ok: false, error: { code: "invalid_input", fieldErrors } }` می‌دهد، اکشن موفق `{ ok: true, data }`، و در ماژول نه شکل `{ status: ... }` هست نه `revalidatePath`.
- هیچ فایل `src/` نام مرجع فقط-خواندنی (`an-front`, `mr-rag`, `example/`) را ندارد، پس هدر `Origin:` هم لازم نشده. (مرجع اولیهٔ این فاز `aip-next` ثبت شده بود؛ در ۲۰۲۶-۱۱-۲۲ به `an-front` اصلاح شد — `docs/plan/frontend-conventions.md`.)
- `@tabler/icons-react` با نسخهٔ دقیق `3.52.0` pin شده، در `src/components` استفاده می‌شود و هیچ import از `@ant-design/icons` در `src` نیست.

رفتارهای حالت خالی و خطا:

- روستر بدون گروه پیام «هنوز گروهی نساخته‌اید» و بدون دانش‌آموز ستون خالی نشان می‌دهد.
- اگر گروه یا دانش‌آموزی برای تخصیص نباشد، فرم تخصیص با یک توضیح فارسی جایش را می‌دهد.
- خطای فرم زیر همان input با `role="alert"` می‌آید و خطای کلی بالای دکمه؛ دکمه هنگام ارسال `loading` است.

## چه کاری نمی‌کند

- فیلدهای فیزیکی کاربر (سن، جنسیت، قد، وزن، سطح فعالیت، رژیم) در این فاز نیست؛ مال ۵.۳ است.
- مالکیت یا visibility سند و هر اتصال RAG به مشاوره؛ تا فاز چت به تعویق افتاده.
- تلگرام، تماس تصویری WebRTC، scheduler، تأیید ایمیل، بازیابی رمز عبور.
- محدودیت نرخ تلاش ورود، قفل حساب، ۲FA و توکن CSRF جداگانه.
- `proxy.ts`/middleware؛ گارد امن در layout و خود اکشن‌هاست.
- داشبورد ۵.۴، نمودار، `echarts` و پنل کامل مشاور.
- تأیید مشاور توسط ادمین؛ ثبت‌نام با نقش مشاور آزاد است و این یک محدودیت شناخته‌شده است.
- پاک‌سازی زمان‌بندی‌شدهٔ نشست‌های منقضی؛ پاک‌سازی فقط هنگام resolve شدن انجام می‌شود.

## فایل‌های دست‌خورده

- `prisma/schema.prisma` و `prisma/migrations/20261122145638_add_advising_identity/`
- `src/shared/errors.ts`، `src/shared/action-result.ts`، `src/shared/persian-digits.ts` (+ test)
- `src/modules/rag/domain/errors.ts` (re-export سه کلاس منتقل‌شده، بدون تغییر رفتار)
- `src/modules/advising/domain/{models,ports,errors}.ts`
- `src/modules/advising/application/{auth,session,profile,groups}.ts` (+ tests)
- `src/modules/advising/infrastructure/{auth-crypto,prisma-user-repository,prisma-session-repository,prisma-group-repository}.ts` (+ `auth-crypto.test.ts`)
- `src/modules/advising/presentation/{schemas,cookie,session-cookie,messages,run-action}.ts` (+ tests)
- `src/server/advising-actions.ts`، `src/server/advising-guards.ts`، `src/server/container.ts`
- `src/app/(auth)/{login,register}/page.tsx`
- `src/app/(advising)/{layout.tsx,profile/page.tsx,counselor/students/page.tsx}`
- `src/components/auth/{login-form,register-form}.tsx`، `src/components/advising/{profile-form,counselor-roster}.tsx`
- `src/app/page.tsx` (لینک ورود و ثبت‌نام)
- `scripts/seed-advising.ts`، `test/advising/{integration,seed}.test.ts`، `test/fakes/advising.ts`، `tests/e2e/advising-auth.spec.ts`
- `docs/plan/frontend-conventions.md`، `package.json` (`@tabler/icons-react@3.52.0` pin دقیق)

## بررسی‌ها

| دستور | نتیجه |
|---|---|
| `pnpm test` | exit 0، ۲۵ فایل و ۱۳۱ تست pass |
| `pnpm typecheck` | exit 0 |
| `pnpm test test/advising/integration.test.ts` | exit 0، ۶ تست pass با Postgres زنده |
| `test -f docs/contracts/phase-5-1-identity-profile.md && grep -q "last_verified" docs/behaviors/phase-5-1-identity-profile.md && grep -q "source_files" docs/behaviors/phase-5-1-identity-profile.md` (AC-22) | exit 0 |
| AC-25 (frontend-conventions, ≥۲۳ verdict) | exit 0 |
| AC-29 (tabler pin + usage, no AntD icons) | exit 0 |
| AC-27 (license finding) | exit 0 — عبارت دقیق `aip-next ships no LICENSE` به‌عنوان رکورد تاریخی حفظ شده، و یافتهٔ واقعی نیز ثبت است: `an-front` هم LICENSE ندارد |
| AC-30 (skill drafts) | exit 0 — هر دو draft شامل `16.4.6` · `state.ok` · `revalidatePath` · `RTL` |
| AC-22 (contract + behavior front matter) | exit 0 |
| `pnpm lint` و `pnpm build` | در اجرای gate پیش از این پاس مستند، exit 0 گزارش شد؛ در این اجرای فقط-مستند دوباره اجرا نشد |

در این اجرا بررسی نشد:

- تست‌های e2e (`E2E_ENABLED=true pnpm test:e2e`) اجرا نشدند؛ رفتارهای «کاربر خارج‌شده» و «ویرایش پروفایل» از روی تست و کد توصیف شده‌اند.
- بررسی دستی صفحهٔ اصلی و کلیک لینک‌ها انجام نشد.
- اجرای واقعی `pnpm tsx scripts/seed-advising.ts` انجام نشد؛ فقط تست idempotent و تست production در سوئیت اجرا شدند.

## README

راهنمای شروع و بخش احراز هویت در [`README.md`](../../README.md) نگه داشته می‌شود (نام کوکی `mrdan_session`، عمر ۷ روزه، ذخیرهٔ scrypt و صفحه‌های جدید). در لحظهٔ نوشتن این سند، بخش مذکور در README توسط عامل دیگری در حال تکمیل بود و در این اجرا بازبینی نشد. این سند فقط جزئیات رفتاری است.

## قرارداد

جزئیات دقیق interfaceها، کدهای خطا، invariantها و edge caseها: [`docs/contracts/phase-5-1-identity-profile.md`](../contracts/phase-5-1-identity-profile.md).
