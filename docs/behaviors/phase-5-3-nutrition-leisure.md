---
last_verified: 2026-11-23
source_files: prisma/schema.prisma, prisma/migrations/20261123123032_add_advising_nutrition_leisure/migration.sql, src/modules/advising/domain/energy.ts, src/modules/advising/domain/energy.test.ts, src/modules/advising/domain/leisure.ts, src/modules/advising/domain/leisure.test.ts, src/modules/advising/domain/models.ts, src/modules/advising/domain/ports.ts, src/modules/advising/domain/capabilities.ts, src/modules/advising/domain/capabilities.test.ts, src/modules/advising/domain/errors.ts, src/modules/advising/application/nutrition.ts, src/modules/advising/application/nutrition.test.ts, src/modules/advising/application/leisure.ts, src/modules/advising/application/leisure.test.ts, src/modules/advising/application/planning-access.ts, src/modules/advising/infrastructure/prisma-meal-plan-repository.ts, src/modules/advising/infrastructure/prisma-user-repository.ts, src/modules/advising/presentation/nutrition-schemas.ts, src/modules/advising/presentation/nutrition-schemas.test.ts, src/modules/advising/presentation/nutrition-format.ts, src/modules/advising/presentation/messages.ts, src/server/container.ts, src/constants/test-ids.ts, src/app/(advising)/layout.tsx, src/app/(advising)/nutrition/page.tsx, src/app/(advising)/nutrition/nutrition-board.vm.tsx, src/app/(advising)/nutrition/nutrition-board.view.tsx, src/app/(advising)/nutrition/nutrition.actions.ts, src/app/(advising)/nutrition/_components/physical-form.view.tsx, src/app/(advising)/nutrition/_components/physical-form.vm.tsx, src/app/(advising)/nutrition/_components/meal-plan.view.tsx, src/app/(advising)/leisure/page.tsx, test/fakes/nutrition-leisure.ts, test/fakes/advising.ts, test/advising/nutrition-leisure-integration.test.ts, test/architecture.test.ts, tests/e2e/advising-nutrition-leisure.spec.ts
---

# فاز ۵.۳: تغذیه و اوقات فراغت

## کاربر فعلاً چه می‌کند

دانش‌آموز و مشاور در `/nutrition` شش فیلد فیزیکی خویش (سن، جنسیت، قد، وزن، سطح فعالیت، هدف غذایی) را ثبت می‌کنند، BMR و TDEE و کالری هدف را می‌بینند و برنامهٔ وعده‌های امروز را ذخیره می‌کنند. در `/leisure` پیشنهاد فراغت بر اساس مطالعهٔ هفت روز اخیر و تکالیف باقی‌مانده و یک کتاب پیشنهادی می‌بینند. هر سه نقش شناخته‌شده به هر دو صفحه دسترسی دارند و فقط مالک داده می‌تواند آن را بنویسد.

## چگونه رفتار می‌کند

- وقتی هر شش فیلد فیزیکی ذخیره شود، `bmr` با Mifflin-St Jeor و `tdee` با ضریب فعالیت و `targetCalories` با ضریب هدف غذایی محاسبه می‌شود؛ هر عدد از مقدار گردنشدهٔ خودش یک بار گرد می‌شود.
- وقتی پروفایل مرد ۱۷ ساله، ۱۸۰ سانتی‌متر، ۷۰ کیلوگرم، فعالیت متوسط و هدف حفظ وزن باشد، `bmr` برابر ۱۷۴۵، `tdee` برابر ۲۷۰۵ و کالری هدف برابر ۲۷۰۵ است.
- وقتی هدف غذایی کاهش یا افزایش وزن باشد، کالری هدف به ترتیب ۰٫۸۵ یا ۱٫۱ برابر TDEE است و یک بار گرد می‌شود.
- وقتی کالری هدف محاسبه‌شده زیر ۱۲۰۰ باشد، دقیقاً روی ۱۲۰۰ بریده می‌شود.
- وقتی یکی از شش فیلد خالی باشد، هیچ BMR/TDEE تولید نمی‌شود، صفحه پیام «اطلاعات فیزیکی را کامل کنید» نشان می‌دهد و ذخیرهٔ برنامه با کد `profile_incomplete` و صفر نوشتن رد می‌شود.
- وقتی برنامهٔ وعده ذخیره شود، مقادیر صبحانه/ناهار/شام ۲۵/۳۵/۳۰ درصدِ گردشده‌اند و میان‌وعده باقی‌مانده است، پس جمع چهار وعده دقیقاً برابر کالری هدف است.
- وقتی همان روز دوباره ذخیره شود، همان ردیف `(studentId, dayKey)` به‌روز می‌شود و ردیف دوم ساخته نمی‌شود؛ روز بعد ردیف تازه‌ای اضافه می‌شود.
- وقتی کاربر حذف شود، برنامه‌های وعدهٔ او با cascade صفر می‌شوند.
- وقتی مشاور پروفایل کاربر دیگری (حتی دانش‌آموزِ خویش) را بنویسد یا برای او برنامه ذخیره کند، `ForbiddenError` (403) برمی‌گردد و شمارندهٔ نوشتن صفر می‌ماند؛ مشاور پروفایل خودش را می‌نویسد و پروفایل دانش‌آموزِ خودش را می‌خواند.
- وقتی سن ۹ یا ۱۰۱، قد ۹۹ یا ۲۵۱، وزن ۲۹ یا ۳۰۱، یا مقدار خارج از tuple جنسیت/فعالیت/هدف ارسال شود، zod با پیام فارسی روی همان مسیر فیلد رد می‌کند؛ مقادیر مرزی ۱۰/۱۰۰/۳۰ و ۱۰۰/۲۵۰/۳۰۰ پذیرفته می‌شوند.
- وقتی در سه روز اخیر ۹۰۰ دقیقه (یا در هفت روز ۲۱۰۰ دقیقه) مطالعه ثبت شده باشد، پیشنهاد `critical_fatigue` است.
- وقتی ۳ کار عقب‌افتاده یا ۸ کار در انتظار باشد، پیشنهاد `heavy_workload` است و بر ساعت مطالعه اولویت دارد.
- وقتی ۱۵۰۰ دقیقه در هفته مطالعه باشد و بار کاری سنگین نباشد، پیشنهاد `overloaded_week` است.
- وقتی ۶۰۰ دقیقه در هفته با صفر کار عقب‌افتاده باشد، پیشنهاد `balanced` است؛ در غیر این صورت `low_activity` با حداقل دو اقدام پیشنهادی.
- وقتی پیشنهاد انتخاب شود، کتاب بر اساس رشته و کد پیشنهاد از کاتالوگ ثابت و به ترتیب کاتالوگ انتخاب می‌شود؛ اگر تطابق رشته نبود، کتاب مستقل از رشته برمی‌گردد و هر پنج کد دست‌کم یک کتاب دارند.

## موارد مرزی

- مرز روز همان `studyDayKey` فاز ۵.۲ است (UTC+۰۳:۳۰)؛ تکلیف وقتی «عقب‌افتاده» است که روز تقویمی deadline پیش از امروز باشد.
- فقط ردیف‌های `study` در جمع دقیقه‌های فراغت می‌آیند؛ `break` و `waste` حذف می‌شوند.
- پروفایل ناقص در خواندن خطا نمی‌دهد؛ `profile` با فیلدهای null و `energy: null` برمی‌گردد.
- ستون `meals` از نوع `Json` است و خواندن آن با type guard ساختاری انجام می‌شود؛ دادهٔ خراب خطای wrapped می‌دهد، نه cast.
- نشست بدون ورود در `/nutrition` و `/leisure` به `/login` می‌رود و هیچ markup فیچر رندر نمی‌شود.

## چه کاری نمی‌کند

- بانک سؤال، آزمون یا کارنامهٔ کنکور ندارد؛ این بخش از نقشه‌راه حذف شد.
- برنامهٔ وعده دستی قابل ویرایش نیست؛ فقط امروز نمایش داده می‌شود و صفحهٔ تاریخچه وجود ندارد (ردیف دیروز در جدول می‌ماند).
- اعداد کالری تخمینی‌اند و جایگزین نظر پزشک نیستند؛ صفحه همین را صریح می‌گوید.
- فیلدهای فیزیکی در `/profile` نیستند و فقط در `/nutrition` نگهداری می‌شوند.
- فهرست کتاب‌ها یک کاتالوگ ثابت در کد است؛ جست‌وجو یا تاریخچهٔ کتاب به‌ازای کاربر ندارد.
- زمان‌بند، یادآور یا مکالمهٔ خودکار ندارد.

## فایل‌های دست‌خورده

فهرست کامل در `source_files` بالای همین سند آمده است؛ این فاز فقط `src/modules/advising/**`، دو روت `src/app/(advising)/{nutrition,leisure}` و `layout.tsx`، `src/server/container.ts`، `src/constants/test-ids.ts`، schema/migration، و تست‌های متناظر را تغییر داد.

## تایید

دستورهای اجرا شده: `pnpm typecheck` (exit 0)، `pnpm lint` (exit 0، بدون هشدار جدید)، `pnpm test` (۴۷ فایل، ۲۳۳ تست passed)، `pnpm test --run test/architecture.test.ts` (۹ تست passed؛ `withLocalUi` ۱۱ و `pages >= 13`)، `E2E_ENABLED=true pnpm test:e2e tests/e2e/advising-nutrition-leisure.spec.ts` (۳ تست passed روی سرویس‌های زنده)، `pnpm build` (exit 0). ACهای عددی از طریق `pnpm test -t "<title>"` طبق `docs/contracts/phase-5-3-nutrition-leisure.md` تایید می‌شوند.
