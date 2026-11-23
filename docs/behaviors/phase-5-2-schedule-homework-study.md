---
last_verified: 2026-11-23
source_files: prisma/schema.prisma, prisma/migrations/20261123080240_add_advising_schedule_homework_study/, src/modules/advising/domain/{models,ports,errors,capabilities,subjects,schedule}.ts, src/modules/advising/application/{planning-access,schedule,homework,study,study-metrics}.ts, src/modules/advising/infrastructure/prisma-schedule-repository.ts, src/modules/advising/infrastructure/prisma-homework-repository.ts, src/modules/advising/infrastructure/prisma-study-session-repository.ts, src/modules/advising/presentation/{schedule-schemas,homework-schemas,study-schemas,pomodoro-timer,planning-format,messages}.ts, src/server/container.ts, src/server/advising-guards.ts, src/constants/test-ids.ts, src/app/(advising)/schedule/** , src/app/(advising)/homework/**, src/app/(advising)/study/**, src/app/(advising)/layout.tsx, test/fakes/planning.ts, test/advising/planning-integration.test.ts, test/architecture.test.ts, tests/e2e/advising-planning.spec.ts
---

# فاز ۵.۲: برنامه هفتگی، تکالیف و تایمر مطالعه

## کاربر فعلاً چه می‌کند

دانش‌آموز و مشاور از طریق صفحات `/schedule`، `/homework` و `/study` برنامه هفتگی خویش را نگهداری می‌کنند، تکالیف را ثبت/انجام می‌دهند و زمان مطالعه را با تایمر پومودورو ۲۵/۵ اندازه می‌گیرند و تحلیل زمان می‌بینند. مشاور فقط سطرهای خویش را می‌بیند و می‌نویسد؛ خواندن سطرهای دانش‌آموزان خود در لایه استفاده است، بدون صفحهٔ UI تا فاز ۵.۴.

## چگونه رفتار می‌کند

- وقتی دانش‌آموز سطر `/schedule` با روز، ساعت شروع/پایان و درس ثبت می‌کند، سطر با آن slug درس ذخیره می‌شود و در جدول روز‌های هفتگی ظاهر می‌شود.
- وقتی سطر جدید با `(studentId, dayOfWeek, startMinute)` تکراری ثبت می‌شود، خطای `schedule_conflict` (کد 409) برمی‌گردند و هیچ سطر書き نمی‌شود.
- وقتی بازه جدید با یک سطر موجود در همان روز تداخل دارد، ایجاد رد می‌شود و هر سطر نوشته نمی‌شود.
- وقتی بازه جدید دقیقاً به نقطه پایان سطر قبلی می‌رسد (مثلاً ۰۸:۰۰–۰۹:۰۰ و ۰۹:۰۰–۱۰:۰۰)، هر دو پذیرفته می‌شوند.
- وقتی مشاور سطر یک کاربر دیگر (حتی دانش‌آموزِ خویش) را می‌خواند، `ForbiddenError` (403) برمی‌گردند و هیچ سطر بر نمی‌گردد.
- وقتی مشاور سطر یک کاربر دیگر را تغییر یا حذف می‌کند، `ForbiddenError` برمی‌گردند وinker شمارنده نوشتن صفر می‌ماند.
- وقتی درس نامشخصی (slug ناشناس از فهرست `domain/subjects.ts`) در فرم ثبت می‌شود، خطای `invalid_input` با پیام فارسی روی مسیر `subject` برمی‌گردند و هیچ-rowی به repository نرفته است.
- وقتی `deadline` تکلیف یک روز قبل از روز جاری است و تکلیف در état انجام‌نشده است، وضعیت «منقضی شده» می‌شود؛ اگر截止 همان روز است، «امروز»؛ اگر بعد است، «آینده»؛ و اگر انجام شده است، هرگز «منقضی» نیست.
- وقتی تایمر پومودورو شروع می‌شود، نمایش از `endsAt` استخراج می‌شود و نه از شمارندهی开火، بنابراین برگردشawn-tab نمی‌تواند باعث دريفت شود.
- وقتی یک بازه تمرکز تمام شود، صفحه بازبینی ظاهر می‌شود، اما سطر `StudySession` تنها وقتی ثبت می‌شود که دانش‌آموز فرم را به صراحت ارسال کند.
- وقتی هیچ نشستی در رنج وجود ندارد، نرخ بهره‌وری `۰` است نه `NaN` و نه `Infinity`.

## Edge cases

- `endMinute == startMinute`: zod با پیام فارسی روی `endTime` رد می‌کند.
- `dayOfWeek = 7` یا `-1`: در مرزresponse رد می‌شود.
- `durationMinutes = 0` یا `1441`: رد می‌شود.
- `focusLevel` روی `break`/`waste`: ذخیره می‌شود به عنوان `null`.
- `startedAt` ۱۰ دقیقه در آینده: رد می‌شود.
- کاربر حذف شود: همه easy سه جدول برای آن کاربر صفر می‌شود (cascade).
- بازه تکراری هم‌زمان: DB unique guarantee برنده می‌شود، دومین درخواست به `schedule_conflict` می‌چرخد و هیچ نوشتن جزئی وجود ندارد.

## چه کاری نمی‌کند

- سcheduler یا cron یا یادآور تلگرام (خارج از فاز ۵).
- چارت/نمودار (تا فاز ۵.۴).
- حالت تایمر در مرورگر persistence نمی‌شود (رفرش صفحه حالت در حال اجرا را می‌برد).
- منطقه زمانی کاربر (مرز روز ثابت UTC+۰۳:۳۰ است).
- deadline با ساعت (فقط روز تقویمی ایران).
- خواندن/نوشتن سطرهای برنامه‌ریزی دانش‌آموزان از طریق UI مشاور (فقط لایه استفاده، تا ۵.۴).

## فایل‌های touche شده

همه فایل‌هایadded یا modified در `source_files`akebtr پاره اول.

## تایید

دستورهای اجرا شده: `pnpm typecheck` (exit 0)، `pnpm lint` (هشدار جدیدی ندارد)، `pnpm vitest run src/modules/advising` (۲۰ فایل، ۱۱۰ تست passed)، `pnpm vitest run test/architecture.test.ts` (۱ فایل، ۹ تست passed).ACها از طریق `pnpm test -t "<title>"` تایید می‌شوند (verse `docs/contracts/phase-5-2-schedule-homework-study.md`).
