---
last_verified: 2026-11-25
source_files: src/modules/advising/application/dashboard.ts, src/app/(advising)/dashboard/dashboard.actions.ts, src/app/(advising)/dashboard/dashboard.page.tsx, src/app/(advising)/dashboard/dashboard.vm.tsx, src/app/(advising)/dashboard/dashboard.view.tsx, src/app/(advising)/dashboard/_components/*.view.tsx, src/server/container.ts, src/modules/advising/domain/weekly-goal.ts, src/modules/advising/domain/study-blocks.ts, src/modules/advising/domain/free-time.ts
---

# رفت behaviors: داشبورد دانش‌آموز (/dashboard)

## کاربر الان چه کار می‌کند

دانش‌آموز وارد `/dashboard` شده و کارت‌های زیر را می‌بیند، همه از دیتابیس خوانده شده (بدون دادهٔ فیک یا هاردکد):

- سلام و نام کامل از ردیف `User` نشست جاری.
- تکالیف امروز و فردا (از `Homework`)، هر ردیف با دکمهٔ «انجام شد» و گزینهٔ دقیقهٔ صرف‌شده (۱–۱۴۴۰).
- برنامه مطالعهٔ امروز از ردیف‌های `StudyPlanEntry` مشاور؛ هر ردیف ورودی «دقیقهٔ مطالعه» + «ثبت» و هدف تست ردیف را نشان می‌دهد و لینک «مشاهده و اصلاح کل هفته» به `/schedule` دارد.
- زمان آزاد امروز = بیداری − کلاس‌های امروز − اشغال غیرمدرسی − میانگین تکالیف، محدود شده به ۰.
- هدف هفته: ساعت مطالعه و تعداد تست، با نوار پیشرفت؛ برای هر درسِ برنامهٔ مشاور، تعداد تست انجام‌شده با ورودی دقیق ثبت/اصلاح می‌شود (فقط درس‌های برنامه، هدف مشاور تغییرناپذیر).
- کتاب پیشنهادی recreational (از `pickBook` بر اساس رشته و پیشنهاد سرگرمی).
- ویجت کیفوری: برنامه غذای امروز و ate slots، فقط اگر پروفایل بدنی کامل باشد.

## چطور رفتار می‌کند

- صفحه سرور-رندر است؛ client fetch ندارد و حالت loading/خالی از دیتابیس می‌آید، نه از `?demo=`.
- `page.tsx` (< ۴۰ خط) گärd می‌کند، `getDashboardOverview.execute` را صدا می‌زند و نقش counselor را به `/counselor/students` هدایت می‌کند.
- `dashboard.ts` یک aggregate use case است که مقادیر را از use case‌های موجود می‌خواند: `goalProgress`+`planMinutesTotal` برای هدف، `freeMinutesForDay`/`classMinutesForDay`/`otherOccupiedMinutesForDay`+`buildStudyBlocks` برای برنامه، `suggestLeisure`+`pickBook` برای کتاب، `computeEnergy`+`isPhysicalProfileComplete` برای کیفوری.
- نوشتن‌ها فقط از طریق use case‌های موجود: `SetHomeworkCompletionUseCase`، `ToggleStudyBlockUseCase`، `AddTestsDoneUseCase`، `ToggleMealSlotUseCase` (همه در `container.ts` سیمکشی شده‌اند).
- بعد از `state.ok` کلاینت `router.refresh()` صدا می‌زند؛ بدون `revalidatePath` و بدون نوشتن أمامی-side.
- `greetingName` و `profile.fullName` همیشه از ردیف `User` نشست جاری می‌آیند؛ هویت literal دانش‌آموزی در `src/app/**` رندر نمی‌شود.
- اعتبارسنجی: دقیقهٔ خارج از بازهٔ ۱–۱۴۴۰ و delta خارج از ۱–۱۰۰ با `ok:false` و پیام فارسی پاسخ داده می‌شوند و هیچ نوشتی انجام نمی‌شود.

## Edge cases

- بدون ردیف برنامهٔ امروز: `blocks: []` و `freeMinutes` همچنان از روز بیداری محاسبه می‌شود.
- بدون `StudyPlan`: `goal.studyMinutesTarget = 0`، `goal.testsTarget = 0`، `goal` غیر-null است و `testsDone` از `WeeklyGoal` می‌آید.
- بدون `MealPlan` امروز: `meal.plan = null`، `targetCalories` همچنان محاسبه می‌شود اگر پروفایل کامل باشد.
- بدون پروفایل بدنی: `targetCalories = null` و ویجت پیام تکمیل پروفایل را نشان می‌دهد.
- counselor/page برای دانش‌آموز redirect می‌دهد.

## چه کاری نمی‌کند

- تغییر برنامه، فصل یا هدف تست (کار مشاور در `/counselor/students/[id]`).
- تاریخچهٔ چت و ذخیره پیام (مال `/dashboard` نیست).
- داشبورد مشاور (فقط صفحهٔ دانش‌آموز).
- `revalidatePath` و تولید دکمهٔ بی‌عمل.

## فایل‌های دست‌خورده

- `src/modules/advising/application/dashboard.ts` (+ `dashboard.test.ts`)
- `src/app/(advising)/dashboard/{dashboard.actions.ts,dashboard.page.tsx,dashboard.vm.tsx,dashboard.view.tsx,_components/*.view.tsx}`
- `src/server/container.ts` (`dashboardOverview`، `toggleMealSlot`)
- `src/app/(advising)/schedule/_components/school-program-form.vm.tsx` (حذف `useState(initialEntries)` کلاسیک)
- `src/app/(advising)/counselor/students/[studentId]/counselor-student.vm.tsx` (پیش‌فرض `testsTarget: ""` نه `"300"`)
- حذف‌شده: `src/app/(advising)/dashboard/dashboard.fixture.ts`

## بررسی‌ها

| دستور | نتیجه |
|---|---|
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | exit 0 (فقط warning‌های قدیمی `no-control-regex`/`no-unused-vars`؛ بدون خطا جدید) |
| `pnpm test` | exit 0، ۶۰ فایل و ۳۸۱ تست pass |
| `pnpm vitest run src/modules/advising/application/dashboard.test.ts` | exit 0، ۴ تست pass (جمع‌آوری کارت‌ها، خالی، بدون برنامه، کاربر غایب) |
| `pnpm vitest run test/advising/planning-integration.test.ts -t dashboard-homework` | exit 0، `completedAt`+`spentMinutes` در Postgres حفظ می‌شود |
| `pnpm vitest run test/advising/weekly-goal-integration.test.ts -t dashboard` | exit 0، `completedBlocks`+`testsDone` در Postgres حفظ می‌شود |
| `pnpm vitest run test/advising/nutrition-leisure-integration.test.ts -t dashboard-meal` | exit 0، `eatenSlots` برای امروز در Postgres حفظ می‌شود |
| `! grep -rn "dashboard.fixture\|DASHBOARD_FIXTURE\|searchParams.demo" src/app` | exit 0 (هیچ فیک/دیمو باقی نمانده) |
| `pnpm build` | exit 0، `/dashboard` و `/profile` server-rendered |

در این اجرا بررسی نشد:

- démو دستی صفحه `/dashboard` در مرورگر (نیاز به تأیید انسان).

## README

بخش `## داشبورد` در [`README.md`](../../README.md) توضیح می‌دهد هر کارت کجا از دیتابیس می‌خواند.
