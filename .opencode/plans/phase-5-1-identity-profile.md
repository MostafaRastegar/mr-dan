# فاز ۵.۱ — هویت، پروفایل، گروه

> Status: plan (round 1 — adds the mandatory `aip-next` frontend-reference step). Architect wrote only this file.
> Implementation belongs to the Implementer.
> Derived data model: `prisma/schema.prisma`. Derived stack: see "Derived stack" below (the
> `mro-project-stack` / `mro-data-model` skills are unfilled placeholders; facts were derived from
> `package.json`, root `AGENTS.md`, `prisma/schema.prisma`, `src/shared/env.ts`, `src/server/container.ts`).

---

## Derived stack

| Fact | Value | Source |
|---|---|---|
| Framework | Next.js `16.4.6`, App Router, `src/` | `package.json`, `src/app` |
| Language | TypeScript `7.0.2`, `strict`, `any` banned | `tsconfig.json`, `.oxlintrc.json` |
| DB / ORM | Postgres 17 + Prisma `7.10.1` (`@prisma/adapter-pg`) | `package.json`, `src/shared/prisma.ts` |
| UI | Ant Design `6.7.1` + Tailwind `4.3.5`, RTL | `src/components/providers.tsx` |
| Auth | **none today** — this phase introduces it (session cookie + Prisma `Session`) | repo scan |
| Package manager | pnpm | `pnpm-lock.yaml`, `AGENTS.md` |
| Tests | Vitest `5.1.1` (unit/architecture/integration), Playwright `1.65.1` (gated `E2E_ENABLED`) | `vitest.config.ts`, `playwright.config.ts` |
| Lint | oxlint `1.94.0` | `package.json` |
| Typecheck / test / build | `pnpm typecheck` · `pnpm test` · `pnpm build` | root `AGENTS.md` |

Notes on gaps:
- `.opencode/AGENTS.md` still contains `<STACK>`-style placeholders and `.opencode/mro-profile.json`
  does not exist, so `db-status` / `check-file` report "not configured". Root `AGENTS.md` supplies the
  real commands, so the plan uses those. Flagged in Resolved decisions (Q6), not a blocker.
- Next 16 deprecates `middleware.ts` in favour of `proxy.ts` (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/middleware.md`). This plan therefore uses no middleware/proxy (see Flow 5).

---

## Phase 5 roadmap (all five sub-phases, 5.1 detailed below)

فاز ۵ محصول مشاورهٔ تحصیلی را در چهار تحویل مستقل می‌سازد: **۵.۱ هویت**، **۵.۲ برنامه/تکلیف/تایمر**،
**۵.۳ آزمون/تغذیه/کتاب/فراغت**، **۵.۴ داشبورد و پنل مشاور**. هر زیرفاز migration، تست و README خودش را دارد؛
ترتیب ۵.۱ → ۵.۲ → ۵.۳ → ۵.۴ اجباری است چون ۵.۲/۵.۳ روی `User` ۵.۱ سوار می‌شوند و ۵.۴ به دادهٔ ۵.۲ و ۵.۳ نیاز دارد.
همه در `src/modules/advising/**` با همان لایه‌بندی `rag` می‌نشینند. `Document.ownerId`/`visibility` و اتصال RAG
تا فاز چت به تعویق افتاده است؛ Telegram و WebRTC کلاً حذف/خارج از دامنه‌اند.
شِل و قراردادهای فرانت هر زیرفاز از مرجع read-only `~/project/yaftar/aip-next` گرفته می‌شود (بخش
«Frontend reference»)، ولی کد آن import/کپی نمی‌شود؛ شِل کامل داشبورد در ۵.۴ می‌آید.

### ۵.۱ — هویت، پروفایل، گروه (این پلن)
- ثبت‌نام/ورود/خروج با session cookie امن + `Session` در Postgres؛ رمز با `node:crypto` scrypt.
- نقش `student` | `counselor`؛ پروفایل تحصیلی دانش‌آموز (`grade`, `fieldOfStudy`, `schoolName`).
- گروه دانش‌آموزی توسط مشاور + تخصیص دانش‌آموز به گروه (یک گروه و یک مشاور برای هر دانش‌آموز).
- بدون فیلد فیزیکی (سن/قد/وزن/فعالیت/رژیم) — مال ۵.۳ است، با migration خودش.

### ۵.۲ — برنامه هفتگی، تکالیف، تایمر مطالعه
- `WeeklySchedule` (روز، ساعت، درس، معلم، اتاق)، `Homework` (اولویت، deadline، وضعیت انجام).
- `StudySession` (دستهٔ مطالعه/استراحت/اتلاف، مدت، تمرکز) + پومودورو سمت کلاینت.
- تحلیل زمان و نرخ بهره‌وری؛ **بدون** scheduler/یادآور تلگرام — فقط محاسبهٔ درخواستی.

### ۵.۳ — آزمون، تغذیه، کتاب، اوقات فراغت
- `Question` + `QuizAttempt` با نمره‌دهی کنکور (۳ غلط = ۱ درست) و کارنامه.
- `MealPlan` + **migration فیلدهای فیزیکی روی `User`** (`age`, `gender`, `heightCm`, `weightKg`, `activityLevel`, `dietGoal`) و BMR/TDEE.
- پیشنهاد کتاب از `data/books.json` و پیشنهاد فراغت از قواعد خستگی/بار کاری.

### ۵.۴ — داشبوردها (`echarts`) + پنل مشاور
- چهار نمودار (روند مطالعه، مقایسهٔ دروس، توزیع ۲۴ ساعته، رادار تسلط) با `echarts` — تنها جایی که این dependency اضافه می‌شود.
- `CounselorPlan` (نوشتن/ارسال برنامه)، صفحهٔ جزئیات دانش‌آموز، فهرست/فیلتر دانش‌آموزان.
- در صورت نیاز: تأیید/ارتقای نقش مشاور (بستن ریسک R1).

### خارج از فاز ۵ (ثبت‌شده)
- Telegram (bot/reminder/link code) — حذف کامل.
- WebRTC video call / meeting room — مستند، بدون پیاده‌سازی.
- RAG-wired advising (ownership/visibility اسناد) — تا فاز چت.
- pgvector / Redis / BullMQ / scheduler / scraper.

---

## Goal

یک کاربر بتواند ثبت‌نام کند، وارد شود، خارج شود، پروفایل تحصیلی‌اش را ببیند/ویرایش کند؛ و یک مشاور بتواند
گروه بسازد و دانش‌آموز را به گروه خودش تخصیص دهد — با session مبتنی بر DB، رمز هش‌شده، و مرزهای لایه‌ای
دقیقاً مثل `modules/rag`. فقط **یک** وابستگی جدید و تأییدشده اضافه می‌شود: `@tabler/icons-react` با نسخهٔ pin
(بدون `^`)، به‌عنوان تنها icon set پروژه.

## Out of scope / Deferred

- فیلدهای فیزیکی کاربر (سن/جنسیت/قد/وزن/فعالیت/رژیم) → ۵.۳، با migration مستقل. **در این فاز در schema نیستند.**
- `Document.ownerId` / `visibility` و هر اتصال RAG → فاز چت.
- Telegram، WebRTC، scheduler، ایمیل/تأیید ایمیل، بازیابی رمز عبور.
- Rate limiting / قفل حساب / 2FA → Deferred (R2). CSRF token جدا → تکیه بر origin-check سرور اکشن‌ها + `sameSite=lax` (R8).
- `proxy.ts`/middleware → Deferred؛ گارد امن در layout/RSC است (Flow 5).
- صفحهٔ داشبورد ۵.۴، نمودار، `echarts`، پنل کامل مشاور.
- seed دادهٔ واقعی/production → خارج از دامنه. فقط seed دموی dev در `scripts/seed-advising.ts` (بخش Dev tooling).

## Frontend reference — `aip-next` (read-only)

مرجع اجباری فرانت این فاز: `~/project/yaftar/aip-next` (نام‌های دیگر: `an-front` / `litellm-ui`) — یک اپ Next 16 +
AntD 6 که مسائل RTL + AntD + server-action را قبلاً حل کرده است. وضعیت آن **دقیقاً مثل `example/`** است:

- **هیچ importی** از `aip-next` در این ریپو مجاز نیست (نه `@/`، نه مسیر نسبی بیرون از repo).
- **هیچ dependencyی** از `package.json` آن در ۵.۱ اضافه نمی‌شود.
- **هیچ submodule، کپی درخت، یا symlink**. مرجع فقط خوانده می‌شود.
- مرجع حقیقت آن‌جا `docs/ARCHITECTURE.md` + `.agents/skills/*` است؛ در این ریپو مرجع حقیقت همان `AGENTS.md` +
  `.opencode/skills/mr-dan-*` است. هر تعارضی بود، قواعد ما برنده‌اند.

### Stack deltas (چرا کپی verbatim ممنوع است)

| | `aip-next` | mr-dan (pin شده) | پیامد |
|---|---|---|---|
| next | `^16.3.0` | `16.4.6` | API drift ممکن؛ هر الگو با `node_modules/next/dist/docs/` بازبینی شود |
| react | `19.2.4` | `19.3.1` | hook signatures را دوباره چک کن |
| antd | `^6.6.0` | `6.7.1` | props کیت‌ها ممکن است فرق کند |
| typescript | `^5` | `7.0.2` | `@ts-ignore`/`any` آن‌ها با config سخت ما رد می‌شود |
| lint/format | eslint + prettier + plop | oxlint | هیچ config یا اسکریپت آن‌ها منتقل نمی‌شود |
| package manager | (مخلوط) | pnpm | — |
| auth | `next-auth@5 beta` + JWT + Keycloak در proxy | custom scrypt + Prisma `Session` | middleware/auth آن‌ها بی‌ربط است |
| i18n | `next-intl` با routing `fa`/`en` | فقط فارسی، RTL | routing locale نداریم |
| http | axios + Django/DRF | Prisma درون‌فرآیندی + server action | لایهٔ HTTP کلاینت نداریم |

### Verdicts (ADOPT / ADAPT / REJECT / DEFER)

قاعده: **فقط چیزی ADOPT می‌شود که ۵.۱ همین حالا مصرفش کند**؛ بقیه DEFER با فاز مصرف‌کننده، یا REJECT با دلیل یک‌خطی.
ADOPT = قرارداد را بگیر و در چیدمان خودمان بازپیاده‌سازی کن. ADAPT = ایده را بگیر، به استک ما تغییر شکل بده.

| # | آیتم در `aip-next` | Verdict | تصمیم |
|---|---|---|---|
| 1 | ۴ اسکیل `.agents/skills/*` | ADAPT | فقط failure modeها خوانده می‌شوند؛ نصب/کپی نمی‌شوند و به‌عنوان قاعده cite نمی‌شوند |
| 2 | `server-action.ts` + `app-error.ts` (قرارداد نتیجه/خطا) | ADOPT | `ok` به‌عنوان تنها سیگنال موفقیت، `runAction(fn)`، خطای نرمال‌شده؛ بدون `revalidatePath` |
| 3 | `formHandler` / `use-form-action` / `formErrorHandler` | ADAPT | فقط `fieldErrors` و قاعدهٔ «موفقیت = `ok`» گرفته می‌شود؛ هوک‌های متصل به AntD `FormInstance` پورت نمی‌شوند (فرم‌های ما native هستند — R7) |
| 4 | `use-query-filters` | DEFER | فیلتر URL-backed لیست دانش‌آموزان → ۵.۴؛ روستر ۵.۱ فیلتر ندارد |
| 5 | `PageTitle` | REJECT | با portal داخل `.page-title` کار می‌کند و به شِل layout آن‌ها وابسته است؛ ما `<h1>` ساده می‌گذاریم |
| 6 | `Header` / `SideBar` kits | DEFER | شِل کامل پنل → ۵.۴؛ ۵.۱ فقط یک nav چندخطی داخل `(advising)/layout.tsx` دارد |
| 7 | `ConfirmModal` | DEFER | ۵.۱ عملیات مخرب ندارد؛ اولین حذف واقعی (۵.۲) یا ۵.۴ |
| 8 | `HandleNoData` | ADAPT | فقط شاخهٔ خالی (`Empty`)؛ skeleton لازم نیست چون صفحه RSC بعد از داده رندر می‌شود؛ inline در روستر، بدون فایل کیت برای یک مصرف‌کننده |
| 9 | `Pagination` | DEFER | روستر ۵.۱ صفحه‌بندی ندارد → ۵.۴ |
| 10 | `useNotification` / `useDebounce` / `useMobile` | DEFER | toast → ۵.۲؛ debounce جست‌وجو → ۵.۴؛ mobile با breakpointهای Tailwind (اگر لازم شد REJECT می‌شود) |
| 11 | `convertToEnglishNumbers` | ADOPT | ارقام فارسی/عربی → ASCII؛ فقط روی `username`/`email`، **هرگز روی رمز** |
| 12 | `objectToQueryString` | REJECT | `URLSearchParams` خود stdlib است |
| 13 | `clientUniversalCookie` | REJECT | کوکی session ما `httpOnly` است؛ کلاینت نباید بخواند |
| 14 | `withAuthentication` middleware (و `chain`) | REJECT | Next 16 proxy نباید DB بزند و آن نسخه به JWT + next-intl وابسته است؛ گارد ما در `(advising)/layout.tsx` است (Flow 5) |
| 15 | `Charts` (echarts) | DEFER | ۵.۴ (همان‌جا dependency اضافه می‌شود؛ ایدهٔ option/theme آن‌موقع دیده می‌شود) |
| 16 | `jalali-plugin-dayjs` | DEFER | اولین تاریخ کاربر-facing در ۵.۲ (برنامهٔ هفتگی/deadline)؛ افزودن dayjs نیاز به تأیید انسان دارد |
| 17 | `next-intl` | REJECT | محصول تک‌زبانه فارسی/RTL است؛ هیچ routing locale، هیچ `messages/`، هیچ `LanguageSwitcher` |
| 18 | `next-auth` | REJECT | تصمیم پروژه: scrypt + Prisma `Session` (بدون OAuth) |
| 19 | `axios` | REJECT | هیچ HTTP کلاینتی نداریم؛ داده از RSC/Prisma/server action می‌آید. `fetch` مستقیم هم در کامپوننت ممنوع |
| 20 | `react-constore` | REJECT | state محلی با `useState`/`useReducer`؛ state سرور در RSC است |
| 21 | `universal-cookie` | REJECT | همان دلیل #13 |
| 22 | `plop` | REJECT | ابزار ما pnpm + oxlint است؛ generator اضافه نمی‌کنیم |
| 23 | `@tabler/icons-react` | **ADOPT** | **تأیید انسان (2026-11-22):** تنها icon set پروژه؛ نسخهٔ pin، جایگزین پکیج آیکون AntD |

جمع: **ADOPT ۳ · ADAPT ۳ · DEFER ۷ · REJECT ۱۰**.

**Non-goals repeated for reviewers:** no `next-intl`، no `axios`، no `tabler`→`antd` icon mixing — دقیقاً یک icon set:
`@tabler/icons-react`. هیچ import آیکونی از پکیج AntD در `src/**` نباید باشد.

### Adoption rules

1. **قرارداد** را بردار، فایل را نه. بازپیاده‌سازی در چیدمان ما: `src/modules/advising/**`، `src/shared/`،
   `src/components/ui/`.
2. اگر واقعاً کپی verbatim لازم شد: فایل در `src/shared/` (TS خالص) یا `src/components/ui/` (React) بنشیند و هدر
   `Origin: ~/project/yaftar/aip-next/<path>` + دلیل داشته باشد.
3. **بررسی مجوز (انجام شد):** `aip-next` هیچ فایل `LICENSE` ندارد (`~/project/yaftar/LICENSE` هم نیست). نسبت‌دهی
   نامشخص است، پس ۵.۱ **هیچ کپی verbatim ندارد**. اگر Implementer به کپی verbatim رسید، باید متوقف شود و از انسان
   اجازه بگیرد؛ مجوز را حدس نزند.
4. در `src/**` هیچ رشتهٔ `aip-next` نباشد مگر در همان هدر origin.
5. failure modeهای کلیدی که از اسکیل‌ها گرفته می‌شود: `revalidatePath` داخل server action باعث ری‌ست
   `useActionState` می‌شود (vercel/next.js#66426) → اکشن‌های ما هرگز صدایش نمی‌زنند؛ موفقیت فقط با `state.ok`؛
   خطای فرم به‌صورت `field → message`، نه فقط toast.

### What 5.1 actually takes

| قطعهٔ adopt/adapt شده | محل در این ریپو |
|---|---|
| discriminant `ok` + نرمال‌سازی خطا | `src/shared/action-result.ts` + `presentation/run-action.ts` |
| `runAction(fn)` بدون `revalidatePath` | `src/modules/advising/presentation/run-action.ts` |
| ارقام فارسی/عربی → ASCII | `src/shared/persian-digits.ts` (ورودی `username`/`email`) |
| `@tabler/icons-react` به‌عنوان تنها icon set | `package.json` (pin دقیق) + آیکون‌های دکمه‌های روستر/فرم |
| شاخهٔ خالی `HandleNoData` | inline AntD `<Empty>` در `counselor-roster.tsx` |
| RSC-first + فقط server action برای mutation | همان Flow/UI pages این پلن |

### Skills adoption (required, step 0b)

چهار اسکیل `aip-next/.agents/skills/*` بازبینی و **به پروژه اضافه** می‌شوند، ولی با استک ما بازنویسی می‌شوند. تکرار
اسکیل‌های موجود ممنوع است؛ هدف کوچک نگه داشتن مجموعه است.

**قید سخت:** `.opencode/skills/*` برای agentها permission-denied است
(`.opencode/opencode.json` → `{"action":"edit","resource":".opencode/skills/*","effect":"deny"}`). Implementer نباید
تلاش کند آنجا بنویسد. به‌جایش فایل‌های آماده را در `.opencode/skills-draft/` می‌نویسد و **انسان** آن‌ها را جابه‌جا
می‌کند. این مسیر با pattern ممنوعه match نمی‌شود (pattern به `/skills/` نیاز دارد). اگر ویرایش در آن‌جا هم deny شد،
fallback: `docs/skills-draft/` و ذکر آن در تحویل.

| Source skill | Target | Action / handoff artifact |
|---|---|---|
| `an-front-architecture` | `mr-dan-architecture` + `mr-dan-frontend` | فقط قواعد غیرتکراری merge شود: جریان یک‌جهته view → server action → use case → port، محل action/kit، cross-check layer map. artifact: `.opencode/skills-draft/_appends/mr-dan-architecture.md` و `_appends/mr-dan-frontend.md` (متن دقیق append؛ انسان paste می‌کند) |
| `an-front-feature` | `.opencode/skills/mr-dan-feature-workflow/SKILL.md` (**new**) | چک‌لیست گام‌به‌گام adapted: schema → use case → port/adapter → server action → RSC page → client form → tests؛ استک pin‌شده، RTL فارسی، oxlint به‌جای eslint، هیچ `revalidatePath`. artifact: `.opencode/skills-draft/mr-dan-feature-workflow/SKILL.md` |
| `an-front-debugging` | `.opencode/skills/mr-dan-frontend-debugging/SKILL.md` (**new**) | failure modeها: `revalidatePath` داخل server action، `useActionState` را ری‌ست می‌کند؛ موفقیت فقط `state.ok`؛ فرم native + inputهای AntD؛ تله‌های RTL/`Select`. artifact: `.opencode/skills-draft/mr-dan-frontend-debugging/SKILL.md` |
| `api-server-sync` | `mr-dan-api` | merge: route ≤۴۰ خط + همگام‌سازی spec در `src/lib/openapi.ts` (آنالوگ `src/lib/openapi/spec.ts`). artifact: `.opencode/skills-draft/_appends/mr-dan-api.md` |

هر draft باید این چهار مورد را داشته باشد: (a) نسخه‌های pin استک ما، (b) قرارداد `state.ok`، (c) قاعدهٔ «هرگز
`revalidatePath` داخل server action صدا نزن»، (d) یادداشت فارسی/RTL. نصب نهایی = کار انسان (AC-31).

---

## Data model (Prisma diff)

Additive only — three new models, no change to existing `Document`/`IngestionRun`/`Conversation`/`Message`/`CacheEntry`.
Migration name: **`add_advising_identity`** (`pnpm prisma migrate dev --name add_advising_identity`).

```prisma
model User {
  id           String   @id @default(uuid())
  username     String   @unique
  email        String?  @unique
  passwordHash String
  role         String   // "student" | "counselor" — validated by zod, not a PG enum
  fullName     String
  grade        String?  // دهم | یازدهم | دوازدهم | فارغ‌التحصیل
  fieldOfStudy String?  // ریاضی فیزیک | علوم تجربی | علوم انسانی | فنی حرفه‌ای
  schoolName   String?

  groupId     String?
  group       Group?  @relation("GroupMembers", fields: [groupId], references: [id], onDelete: SetNull)
  counselorId String?
  counselor   User?   @relation("CounselorStudents", fields: [counselorId], references: [id], onDelete: SetNull)
  students    User[]  @relation("CounselorStudents")

  ownedGroups Group[]   @relation("GroupOwner")
  sessions    Session[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([role])
  @@index([groupId])
  @@index([counselorId])
}

model Group {
  id          String   @id @default(uuid())
  name        String
  description String?
  targetGrade String?
  targetField String?
  color       String   @default("#4A90D9")
  counselorId String
  counselor   User     @relation("GroupOwner", fields: [counselorId], references: [id], onDelete: Cascade)
  members     User[]   @relation("GroupMembers")
  createdAt   DateTime @default(now())

  @@index([counselorId])
}

model Session {
  id        String   @id @default(uuid())
  tokenHash String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([expiresAt])
}
```

Design decisions:
- **One `User` model, not `Student`+`Counselor`**: same shape, one nullable self-relation and one nullable group FK. Splitting would duplicate auth columns.
- **`role`, `grade`, `fieldOfStudy`, `activityLevel` as `String` + zod unions**, not PG enums: adding a value later must not require a migration (human constraint). `grade`/`fieldOfStudy` are **fixed Persian enums** in zod (Resolved Q2), never free text.
- **`Session.tokenHash` unique**: cookie carries the raw token; DB never stores it. SHA-256 (not scrypt) because the token already has 256 bits of entropy and every request needs a single indexed lookup.
- **No `avatarColor`**: UI can derive a color from `id`; no consumer in 5.1.
- **`onDelete: SetNull`** for `groupId`/`counselorId`: deleting a group must not delete students. `Session` cascades from `User`. `Group` cascades from its owner counselor (no orphan groups).
- Physical metrics absent on purpose (AC-2).

## Layers & files (exact paths, one responsibility each)

### Shared change + existing-module changes

| Path | Change |
|---|---|
| `prisma/schema.prisma` | add `User`, `Group`, `Session` (above) |
| `package.json` | add **only** `@tabler/icons-react` via `pnpm add -E @tabler/icons-react` (exact pin, no `^`); resolved version recorded in README + conventions doc |
| `src/shared/errors.ts` **(new)** | shared kernel: `AppError`, `ValidationError`, `NotFoundError` (moved from rag) |
| `src/shared/action-result.ts` **(new)** | `ActionError`, `ActionResult<T>` — تنها قرارداد نتیجهٔ اکشن (adopted از `aip-next/src/utils/app-error.ts`) |
| `src/shared/persian-digits.ts` **(new)** | `toAsciiDigits(value: string): string` — ارقام ۰-۹/٠-٩ → 0-9 (adapted از `convertToEnglishNumbers`) |
| `docs/plan/frontend-conventions.md` **(new)** | verdictهای `aip-next` + قرارداد دقیق نتیجهٔ اکشن، خطای فرم، نرمال‌سازی ارقام (step 0) |
| `src/modules/rag/domain/errors.ts` | re-export the three moved classes from `@/shared/errors`, keep rag-specific subclasses |
| `src/server/container.ts` | construct advising repos + use cases; add 9 fields to `Container` |
| `src/app/page.tsx` | add links to `/login` and `/register` |
| `README.md` | auth/profile section, pages, limitations, status |
| `docs/plan/phases.md` | replace فاز ۵ stub with the roadmap summary + link to this plan |
| `docs/plan/architecture.md` | add `modules/advising` to the layer map (docs only) |
| `AGENTS.md` | **human-only** — agents cannot edit it. Required content listed in Documentation impact |

Why move `AppError`: advising needs the same error→UI mapping and the same `code`/`status` shape. Duplicating the
base class would fork the contract. Alternative considered (advising importing `modules/rag/domain/errors`) creates a
product→infra module dependency in the wrong direction. `shared` is a legitimate kernel and the architecture test
allows `domain → shared`. Trade-off: one 3-line re-export edit inside rag; zero behaviour change (AC-17 proves the
boundaries still hold).

### Domain (`src/modules/advising/domain/`)

| Path | Responsibility |
|---|---|
| `models.ts` | `Role`, `UserAccount`, `ProfileView`, `StudentSummary`, `GroupSummary`, `SessionRecord`, `NewUser` + `GRADES`/`FIELDS` readonly tuples (no imports) |
| `ports.ts` | `UserRepositoryPort`, `SessionRepositoryPort`, `GroupRepositoryPort`, `AuthCryptoPort` |
| `errors.ts` | `UsernameTakenError` (409 `username_taken`), `EmailTakenError` (409 `email_taken`), `UnauthorizedError` (401 `unauthorized`), `ForbiddenError` (403 `forbidden`) |

### Application (`src/modules/advising/application/`)

| Path | Responsibility |
|---|---|
| `auth.ts` | `RegisterUserUseCase`, `LoginUserUseCase`, `LogoutUserUseCase` |
| `session.ts` | `ResolveSessionUseCase` (token → user, lazy-expire) |
| `profile.ts` | `GetProfileUseCase`, `UpdateProfileUseCase` (incl. password change + session revocation) |
| `groups.ts` | `CreateGroupUseCase`, `AssignStudentToGroupUseCase`, `CounselorRosterUseCase` |

Four files, each one responsibility ("auth", "session", "profile", "group management"). Mirrors
`application/conversation.ts`, which already bundles several small operations.

### Infrastructure (`src/modules/advising/infrastructure/`)

| Path | Responsibility |
|---|---|
| `prisma-user-repository.ts` | `implements UserRepositoryPort`; explicit `select`; maps row→domain; maps unique violation (`code === "P2002"`, `meta.target`) to `UsernameTakenError`/`EmailTakenError` |
| `prisma-session-repository.ts` | create / findByTokenHash / deleteByTokenHash / deleteManyByUserId(exceptTokenHash?) |
| `prisma-group-repository.ts` | create / findById / listByCounselor (with `_count.members`) |
| `auth-crypto.ts` | `ScryptAuthCrypto implements AuthCryptoPort` using `node:crypto` `scrypt` (promisified), `randomBytes`, `createHash`, `timingSafeEqual` |

Unique-violation guard: `function isUniqueViolation(e: unknown): e is { code: "P2002"; meta?: { target?: string[] } }` —
no `any`, no import of Prisma runtime error classes (Prisma 7 generator path is unstable).

Path note: `mr-dan-persistence` says queries live in `infrastructure/prisma/`, but the shipped rag code uses
`infrastructure/prisma-*.ts` flat files. The plan follows the code (`prisma-user-repository.ts`, …); the skill wording
is stale and should be corrected in the same change that touches it.

### Presentation (`src/modules/advising/presentation/`)

| Path | Responsibility |
|---|---|
| `schemas.ts` | zod: `registerSchema`, `loginSchema`, `updateProfileSchema`, `createGroupSchema`, `assignStudentSchema`; Persian messages; `toFieldErrors(issue)` → `Record<string, string>` (first message per field) |
| `cookie.ts` | pure: `SESSION_COOKIE_NAME = "mrdan_session"`, `SESSION_TTL_MS`, `sessionCookieOptions(expiresAt, isProduction)` (testable, no `next` import) |
| `session-cookie.ts` | `readSessionToken()`, `writeSessionCookie(token, expiresAt)`, `clearSessionCookie()` via `next/headers` |
| `guards.ts` | `getOptionalSessionUser()`, `requireSessionUser()`, `requireCounselor()`; `redirect()` from `next/navigation` |
| `messages.ts` | `errorCode → Persian message` map + `toActionError(error): ActionError` (unknown ⇒ `internal_error`, هیچ جزئیات داخلی لو نمی‌رود) |
| `run-action.ts` | `runAction(fn): Promise<ActionResult<T>>` — `try/catch` واحد برای ۶ اکشن؛ `AppError` → `toActionError`، `ZodError` → `invalid_input` + `fieldErrors`; **هیچ `revalidatePath`** |
| `actions.ts` | `"use server"`: `registerAction`, `loginAction`, `logoutAction`, `updateProfileAction`, `createGroupAction`, `assignStudentAction` — هر کدام `runAction(...)` |

### UI (`src/app`, `src/components`)

| Path | RSC/Client | Responsibility |
|---|---|---|
| `src/app/(auth)/login/page.tsx` | RSC | if already logged in → `/profile`; renders `LoginForm` |
| `src/app/(auth)/register/page.tsx` | RSC | if already logged in → `/profile`; renders `RegisterForm` |
| `src/app/(advising)/layout.tsx` | RSC | `requireSessionUser()`; header nav (پروفایل، پنل مشاور for counselors، خروج) |
| `src/app/(advising)/profile/page.tsx` | RSC | `GetProfileUseCase`; renders `ProfileForm` + read-only group/counselor |
| `src/app/(advising)/counselor/students/page.tsx` | RSC | `requireCounselor()`; `CounselorRosterUseCase`; renders `CounselorRoster` |
| `src/components/auth/login-form.tsx` | client | `useActionState(loginAction, ...)` + native `<form>` |
| `src/components/auth/register-form.tsx` | client | `useActionState(registerAction, ...)`; role switch shows/hides تحصیلی fields |
| `src/components/advising/profile-form.tsx` | client | `useActionState(updateProfileAction, ...)` |
| `src/components/advising/counselor-roster.tsx` | client | student table + create-group form + assign form (one roster responsibility) with `@tabler/icons-react` action icons |

UI decisions:
- Native `<form action={action}>` (Next 16 Server Action path) with AntD `Input`, `Input.Password`, `Button`
  and **native `<select>`** for رole/grade/field. Reason: AntD `Select` does not submit a native hidden value,
  so `FormData` would be empty. `AntdRegistry` + `ConfigProvider direction="rtl"` still apply; AntD `Form` is
  not used for these three forms. Minor conflict with `mr-dan-frontend` ("AntD Form for forms") — resolved in
  favour of the Next 16 Server Action contract; noted here so the Reviewer does not flag it as accidental.
- Client forms call `useActionState(action, null)`: `null` = idle, `state.ok === true` = success (redirect), otherwise
  errors render from `state.error.fieldErrors[field]` beside the input. No AntD `Form`/`message` toast and no
  `useFormAction` hook — only the adopted shape (decision #3 in the reference table).
- Icons: `@tabler/icons-react` **only** (`IconUser`, `IconUsers`, `IconLogout`, `IconPlus`). No AntD icon-package
  import anywhere; exactly one icon set (Resolved Q9). Version pinned exact with `pnpm add -E`; usage lives in
  `src/components/**` and the layout nav.
- Logout is a plain RSC `<form action={logoutAction}>` inside the layout — no client component.
- All labels/messages Persian; numbers and dates untouched (5.1 has no dates).
- `src/app/chat` and `src/app/admin` are untouched; route groups `(auth)`/`(advising)` do not change URLs.

### Dev tooling

| Path | Responsibility |
|---|---|
| `scripts/seed-advising.ts` | dev-only, idempotent demo seed: one counselor (`counselor`), one group (`کلاس دوازدهم تجربی`), one student (`student`) with Persian sample data; refuses to run when `NODE_ENV === "production"`; exported `seedAdvising()` so the test can call it; self-runs only when executed directly (`process.argv[1]` ends with `seed-advising.ts`) |

Seed rules (no new dependency):
- upsert by `username` for users (`update: {}` on existing rows, so a re-run never rewrites a password hash);
  group by `findFirst({ counselorId, name })` then create-if-absent (no new unique constraint on `Group.name`).
- student row sets `groupId` + `counselorId` on both create and update, so a re-run repairs a broken assignment.
- Uses `src/shared/prisma.ts` + `ScryptAuthCrypto` directly. `scripts/` is outside `src/`, so it is not a request
  path and does not violate the layering rules enforced by `test/architecture.test.ts`.
- Passwords: both demo accounts share one 8+ character dev password defined as a `DEMO_PASSWORD` constant in the
  script (not a secret, dev-only); the script prints usernames and that password once to stdout.

## API contracts

No HTTP route handlers. All mutations are Server Actions (human constraint); no client notices a JSON API,
so no route is justified. The only "API" is the action contract below.

```ts
// src/shared/action-result.ts — the ONLY action result shape in this repo
export interface ActionError {
  code: string; // "invalid_input" | "unauthorized" | "forbidden" | "not_found"
  //             | "username_taken" | "email_taken" | "internal_error"
  message: string; // Persian, safe to render
  fieldErrors?: Record<string, string>; // field name -> Persian message
}
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ActionError };

// presentation/actions.ts — initial state is `null` (idle)
// (prev: ActionResult<T> | null, formData: FormData) => Promise<ActionResult<T>>
registerAction | loginAction | updateProfileAction | createGroupAction | assignStudentAction
// logoutAction: (formData: FormData) => Promise<never>  (redirect only)
```

Success rule (enforced by review + AC-26): `state?.ok === true`. Never `data !== null`, never `state.ok` on a `null`
state. `revalidatePath` is never called inside an action (reference rule 5).

Digit normalization: `toAsciiDigits` is applied inside `schemas.ts` via `.transform(toAsciiDigits)` on `username` and
`email`; `password` is passed through untouched (Persian digits can be legitimate password characters).

Use cases (application layer; the Implementer must not widen these signatures):

```ts
type RegisterInput = {
  username: string; password: string; role: Role; fullName: string;
  email?: string; grade?: string; fieldOfStudy?: string; schoolName?: string;
};
RegisterUserUseCase.execute(input: RegisterInput): Promise<{ user: UserAccount; token: string }>;

LoginUserUseCase.execute(input: { username: string; password: string }): Promise<{ user: UserAccount; token: string }>;
LogoutUserUseCase.execute(input: { token: string }): Promise<void>;

ResolveSessionUseCase.execute(input: { token: string }): Promise<{ user: UserAccount } | null>;

GetProfileUseCase.execute(input: { userId: string }): Promise<ProfileView | null>;
UpdateProfileUseCase.execute(input: {
  userId: string; token: string; fullName: string; email?: string;
  grade?: string; fieldOfStudy?: string; schoolName?: string;
  currentPassword?: string; newPassword?: string;
}): Promise<UserAccount>;

CreateGroupUseCase.execute(input: {
  actor: { id: string; role: Role }; name: string; description?: string;
  targetGrade?: string; targetField?: string; color?: string;
}): Promise<GroupSummary>;

AssignStudentToGroupUseCase.execute(input: {
  actor: { id: string; role: Role }; studentId: string; groupId: string | null;
}): Promise<void>;

CounselorRosterUseCase.execute(input: { actor: { id: string; role: Role } })
  : Promise<{ groups: GroupSummary[]; students: StudentSummary[] }>;
```

Ports (abridged; full signatures go into `domain/ports.ts`):

```ts
interface UserRepositoryPort {
  findCredentialsByUsername(username: string): Promise<{ user: UserAccount; passwordHash: string } | null>;
  findByEmail(email: string): Promise<UserAccount | null>;
  findById(id: string): Promise<UserAccount | null>;
  findProfileById(id: string): Promise<ProfileView | null>;
  create(input: NewUser & { passwordHash: string }): Promise<UserAccount>;
  updateProfile(id: string, patch: ProfilePatch): Promise<UserAccount>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
  listAssignableStudents(counselorId: string): Promise<StudentSummary[]>;
  assignToGroup(input: { studentId: string; groupId: string | null; counselorId: string }): Promise<void>;
}
interface SessionRepositoryPort {
  create(input: { userId: string; tokenHash: string; expiresAt: Date }): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<SessionRecord | null>;
  deleteByTokenHash(tokenHash: string): Promise<void>;
  deleteManyByUserId(userId: string, exceptTokenHash?: string): Promise<void>;
}
interface GroupRepositoryPort {
  create(input: NewGroup): Promise<GroupSummary>;
  findById(id: string): Promise<GroupSummary | null>;
  listByCounselor(counselorId: string): Promise<GroupSummary[]>;
}
interface AuthCryptoPort {
  hashPassword(plain: string): Promise<string>;
  verifyPassword(plain: string, stored: string): Promise<boolean>;
  generateToken(): string;
  hashToken(token: string): string;
}
```

Cookie contract:
- name `mrdan_session`; value = raw token (`randomBytes(32).toString("base64url")`, decodable length 43).
- `httpOnly: true`, `sameSite: "lax"`, `path: "/"`, `secure: NODE_ENV === "production"`, `expires`/`maxAge` = 7 days.
- DB row: `tokenHash = sha256(token)` hex (64 chars). Raw token never persisted or logged.

Password contract:
- `scrypt` N=16384, r=8, p=1, keylen=64, salt 16 bytes.
- stored `${"scrypt"}$16384$8$1$<saltB64url>$<hashB64url>`; verify parses params from the string (future-proof) and
  compares with `timingSafeEqual` on equal-length buffers.
- min length 8, max 128 (Resolved Q3; the reference MVP used 6).

## Flows

**1. Register** — `registerAction` → `registerSchema.parse(formData)` → `RegisterUserUseCase`:
normalize (`trim`, `username`/`email` → lowercase) → `findByEmail` if given (→ `EmailTakenError`) → `findCredentialsByUsername` (→ `UsernameTakenError`) →
`hashPassword` → `userRepository.create` (P2002 re-mapped as a race-safe conflict) → `generateToken` + `hashToken` →
`sessionRepository.create` (7-day expiry) → return token → action writes cookie → `redirect("/profile")` (Resolved Q5: every role lands on `/profile`).
`redirect()` is called **outside** the `try/catch` (otherwise `NEXT_REDIRECT` is swallowed — R10). Concretely:
`RegisterUserUseCase` + session row are wrapped by `runAction` (returns `ActionResult`), and the cookie write +
`redirect("/profile")` happen after it resolves, so the redirect never passes through the catch.

**2. Login** — `loginAction` → `loginSchema` → `LoginUserUseCase`: lookup → `verifyPassword` → on any failure throw
`UnauthorizedError` (same message for unknown user and wrong password) → new token + session row → cookie → `redirect("/profile")` (Resolved Q5).
No session row is created on failure (AC-6).

**3. Logout** — RSC `<form action={logoutAction}>` → read token (if any) → `LogoutUserUseCase` deletes the row by hash →
`clearSessionCookie()` → `redirect("/login")`. Deleting the row makes a replayed cookie useless even if the client keeps it (AC-9).

**4. Profile** — `(advising)/profile` RSC: `requireSessionUser()` → `GetProfileUseCase` (join group name + counselor name) →
`ProfileForm` → `updateProfileAction` → `requireSessionUser()` (server-side, never trust a hidden userId field) →
`updateProfileSchema` → `UpdateProfileUseCase`. If `newPassword` present: `currentPassword` required and verified, then
`hashPassword` + `updatePassword` + `sessionRepository.deleteManyByUserId(userId, currentTokenHash)` (all other devices logged out).

**5. Session guard (replaces "middleware")** — Next 16 renamed `middleware.ts` to `proxy.ts` and the official guide says
Proxy must do **cookie-only optimistic** checks and avoid DB lookups. A DB-backed session needs a real lookup, so:
- `requireSessionUser()` in `guards.ts`: read cookie → `ResolveSessionUseCase` → null ⇒ `redirect("/login")`; expired row is deleted lazily.
- `(advising)/layout.tsx` calls it once per request; pages under it can call `requireCounselor()` for role gating.
- No `proxy.ts` in 5.1. Deferred (Out of scope). No `next` query param (open-redirect surface); post-login landing is always `/profile` (Resolved Q5).

**6. Group assign** — `(advising)/counselor/students` RSC: `requireCounselor()` → `CounselorRosterUseCase` returns
`groups` (owned by actor) + `students` (actor's students **or** unassigned students, never another counselor's).
`createGroupAction` → `CreateGroupUseCase` (role check → `ForbiddenError`).
`assignStudentAction` → `AssignStudentToGroupUseCase`: role check → load group (`NotFoundError` if absent) →
`group.counselorId !== actor.id` ⇒ `ForbiddenError` → load student (`NotFoundError`; `role !== "student"` ⇒ `ValidationError`) →
single `user.update` setting `groupId` + `counselorId=actor.id` atomically. `groupId === null` clears the group but keeps the counselor.

## UI pages (App Router)

```text
src/app/
├─ (auth)/
│  ├─ login/page.tsx              RSC
│  └─ register/page.tsx           RSC
└─ (advising)/
   ├─ layout.tsx                  RSC guard + nav
   ├─ profile/page.tsx            RSC
   └─ counselor/students/page.tsx RSC (counselor-only)
```

RSC/client split: pages fetch via use cases on the server and pass plain serializable props; only the four
`src/components/**` form/table files are client components. No `fetch` in components, no `useEffect` data loading,
no client-side session state. Empty/loading/error states: forms expose `pending` from `useActionState`; roster shows
a Persian empty state when there are no students/groups.

## Contract (review unit)

Written to `docs/contracts/phase-5-1-identity-profile.md` by the Implementer. Plan-level summary:

- **Interfaces**: the use-case + port + action + cookie contracts above; error codes `invalid_input` 400,
  `unauthorized` 401, `forbidden` 403, `not_found` 404, `username_taken`/`email_taken` 409, `internal_error` 500.
- **Invariants**:
  1. `User.passwordHash` never equals the plaintext password and always starts with `scrypt$`.
  2. `Session` never contains the raw cookie token; lookup is by `sha256(token)`.
  3. A student has at most one `groupId` and one `counselorId`; both are written in one `update`.
  4. No request without a valid, unexpired session renders or mutates `(advising)` content.
  5. A counselor can only mutate groups they own and students whose `counselorId` is themselves or null.
  6. Deleting a `User` removes their sessions; deleting a `Group` nulls members' `groupId`.
  7. Every server action returns `ActionResult`; the only success signal is `ok === true`, and no `{ status: ... }`
     form-state shape exists in `src/modules/advising/**`.
  8. `ActionError.message` and `fieldErrors` never contain stack traces, SQL, tokens, or raw provider errors.
- **Edge cases** (each with `verify:` in the file): duplicate username; duplicate email including two `NULL`s;
  wrong password; unknown username; unknown token; expired token; replay after logout; `newPassword` without
  `currentPassword`; wrong `currentPassword`; assigning to another counselor's group; assigning a counselor as a
  student; empty group name; group name > 100 chars; username with 2 chars; password with 7 chars (⇒ `invalid_input`);
  email empty string (⇒ treated as absent); concurrent duplicate registration (P2002 race); seed run twice (no duplicate rows);
  username typed with Persian/Arabic digits (⇒ ASCII, lookup succeeds); password containing Persian digits (⇒ unchanged);
  a thrown non-`AppError` (⇒ `{ ok: false, error: { code: "internal_error" } }`, no internals).
- `review_level: full` (auth + migration).

## Tests (must be written)

Unit — `src/modules/advising/application/{auth,session,profile,groups}.test.ts` with `test/fakes/advising.ts`:

| File | Cases |
|---|---|
| `auth.test.ts` | register hashes password (never stores plaintext); normalizes username/email; duplicate username → `username_taken`; duplicate email → `email_taken`; session stores `hashToken(token)` and not the token; login ok → 1 session; wrong password → `unauthorized`, 0 sessions; unknown user → `unauthorized`; logout deletes the row so resolve returns null |
| `session.test.ts` | valid token → user; unknown token → null; expired token → null **and** row deleted |
| `profile.test.ts` | profile includes groupName/counselorName; update persists fields; `newPassword` without `currentPassword` → `invalid_input`; wrong `currentPassword` → `unauthorized`, hash unchanged; correct change re-hashes and deletes other sessions but keeps the current one |
| `groups.test.ts` | non-counselor create → `forbidden`; create returns `studentCount: 0`; assign sets both `groupId` and `counselorId`; another counselor's group → `forbidden`; missing group/student → `not_found`; target is a counselor → `invalid_input`; roster excludes other counselors' students |

Unit — infrastructure/presentation:
- `src/modules/advising/infrastructure/auth-crypto.test.ts`: format `scrypt$16384$8$1$…`; verify true/false; two hashes of
  the same password differ (salt); tampered/garbage hash returns `false` instead of throwing; token is base64url 43 chars;
  `hashToken` is 64 hex and deterministic.
- `src/modules/advising/presentation/run-action.test.ts`:
  - test title **"action result"**: success ⇒ `{ ok: true, data }`; `ValidationError` ⇒
    `{ ok: false, error: { code: "invalid_input", message: <Persian> } }`; thrown `string`/`Error` ⇒
    `{ ok: false, error: { code: "internal_error" } }` with no stack/detail leak; zod failure ⇒
    `fieldErrors` keyed by field with one Persian message each.
  - `revalidatePath` is not unit-tested (it is never imported); AC-26 greps for its absence instead.
- `src/shared/persian-digits.test.ts`: `۰۱۲۳۴۵۶۷۸۹` and `٠١٢٣٤٥٦٧٨٩` both → `0123456789`; Latin input unchanged;
  mixed input keeps non-digits.
- `src/modules/advising/presentation/cookie.test.ts`: name/ttl/options (`httpOnly`, `sameSite: "lax"`, `path: "/"`,
  `secure` only in production).
- `src/modules/advising/presentation/schemas.test.ts`: password minimum 8 — `7` chars rejected, `8` accepted (Resolved Q3);
  empty username, invalid role, unknown grade/field, empty email ⇒ `undefined`, optional `newPassword`, overly long input;
  Persian digits in `username`/`email` normalized to ASCII; Persian digits in `password` left untouched.

Integration — `test/advising/integration.test.ts` (real Postgres, graceful skip when unreachable, same pattern as `test/integration.test.ts`):
- unique username and unique email enforced by DB; two users with `email = NULL` allowed;
- `delete user` cascades sessions;
- `delete group` sets members' `groupId` to null;
- `assignToGroup` persists both columns in one row read-back;
- `listAssignableStudents` returns own + unassigned only.

Seed — `test/advising/seed.test.ts` (real Postgres, graceful skip):
- test title **"seed is idempotent"**: call `seedAdvising()` twice; counts stay `1` counselor, `1` group, `1` student;
  the student's `groupId`/`counselorId` stay set and the existing `passwordHash` is not rewritten.
- test title "seed refuses production": with `NODE_ENV=production` the call throws and writes nothing.

Architecture: no new test file; the existing walker covers `modules/advising/**` automatically. AC-17 pins it.

Test-title contract: every `verify:` that uses `-t "<phrase>"` requires the matching vitest test title to contain
that exact phrase (`seed is idempotent`, `password minimum`, …), and the e2e spec titles must contain `logged out` and
`edit profile`. The Implementer must not rename a title without updating the AC.

E2E — `tests/e2e/advising-auth.spec.ts`, gated by `E2E_ENABLED === "true"`:
register (unique username from `Date.now()`) → lands on `/profile` → edit `schoolName` → reload → value persisted →
logout → `/profile` redirects to `/login` → login again → `/profile` renders.

## Acceptance Criteria

- [ ] AC-1: When the migration is applied to an empty database, tables `User`, `Session` and `Group` plus unique indexes on `User.username`, `User.email` and `Session.tokenHash` exist. — verify: `pnpm prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script | grep -qE 'CREATE TABLE "(User|Session|Group)"' && pnpm prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script | grep -q 'CREATE UNIQUE INDEX "User_username_key"' && pnpm prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script | grep -q 'CREATE UNIQUE INDEX "User_email_key"' && pnpm prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script | grep -q 'CREATE UNIQUE INDEX "Session_tokenHash_key"'`
- [ ] AC-2: When `prisma/schema.prisma` is inspected, no physical-metric column for users exists (`height`, `weight`, `activityLevel`, `dietGoal`). — verify: `! grep -nE 'height|weight|activityLevel|dietGoal' prisma/schema.prisma`
- [ ] AC-3: When registration uses an existing username, the action returns `fieldErrors.username` with the Persian duplicate message and only one user row exists. — verify: `pnpm test src/modules/advising/application/auth.test.ts -t "duplicate username"`
- [ ] AC-4: When a user registers, the persisted `passwordHash` starts with `scrypt$` and never equals the submitted password. — verify: `pnpm test src/modules/advising/application/auth.test.ts -t "hashes password"`
- [ ] AC-5: When a session is created, the stored `tokenHash` equals `sha256(token)` and never equals the raw cookie token. — verify: `pnpm test src/modules/advising/application/auth.test.ts -t "token hash"`
- [ ] AC-6: If login is attempted with a wrong password or unknown username, the same `unauthorized` result is returned and zero session rows are created. — verify: `pnpm test src/modules/advising/application/auth.test.ts -t "wrong password"`
- [ ] AC-7: If an unknown session token is presented, session resolution returns `null` and no user is attached. — verify: `pnpm test src/modules/advising/application/session.test.ts -t "unknown token"`
- [ ] AC-8: When an expired session token is presented, resolution returns `null` and the expired row is deleted. — verify: `pnpm test src/modules/advising/application/session.test.ts -t "expired"`
- [ ] AC-9: When a user logs out, the session row is deleted and replaying the same token resolves to `null`. — verify: `pnpm test src/modules/advising/application/auth.test.ts -t "logout"`
- [ ] AC-10: When the session cookie is written, it carries `httpOnly`, `sameSite=lax`, `path=/`, a 7-day expiry, and `secure` only when `NODE_ENV=production`. — verify: `pnpm test src/modules/advising/presentation/cookie.test.ts`
- [ ] AC-11: When a logged-out browser opens `/profile`, it is redirected to `/login` and sees no profile data. — verify: `E2E_ENABLED=true pnpm test:e2e -- tests/e2e/advising-auth.spec.ts -g "logged out"`
- [ ] AC-12: When a logged-in student edits `schoolName` and reloads `/profile`, the new value is shown. — verify: `E2E_ENABLED=true pnpm test:e2e -- tests/e2e/advising-auth.spec.ts -g "edit profile"`
- [ ] AC-13: If a password change supplies a wrong `currentPassword`, it fails with `unauthorized` and the stored hash is unchanged. — verify: `pnpm test src/modules/advising/application/profile.test.ts -t "current password"`
- [ ] AC-14: When a password change succeeds, every other session of that user is revoked while the current session stays valid. — verify: `pnpm test src/modules/advising/application/profile.test.ts -t "revokes other sessions"`
- [ ] AC-15: If a student calls create-group, it fails with `forbidden` and no group row is created. — verify: `pnpm test src/modules/advising/application/groups.test.ts -t "non-counselor"`
- [ ] AC-16: When a counselor assigns a student to their own group, one update sets both `groupId` and `counselorId`; assigning to another counselor's group fails with `forbidden` and changes nothing. — verify: `pnpm test src/modules/advising/application/groups.test.ts -t "assign"`
- [ ] AC-17: When the architecture test runs, the advising module has no domain-external imports, no application→infrastructure import, and every `app/api/**/route.ts` stays ≤40 lines. — verify: `pnpm test test/architecture.test.ts`
- [ ] AC-18: When the full gate runs after implementation, typecheck, lint, unit/architecture tests and build all exit 0. — verify: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
- [ ] AC-19: When Postgres is live, the DB-level rules hold: duplicate email rejected, deleting a user cascades sessions, deleting a group nulls members' `groupId`. — verify: `pnpm test test/advising/integration.test.ts`
- [ ] AC-20: When a visitor opens `/`, links to ورود and ثبت‌نام are visible and navigate to `/login` and `/register`. — verify: manual: open http://localhost:3000 and click both links
- [ ] AC-21: When README is read, it documents the auth/session section (cookie name `mrdan_session`, 7-day TTL, scrypt storage) and فاز ۵.۱ status. — verify: `grep -q "mrdan_session" README.md && grep -q "فاز ۵.۱" README.md`
- [ ] AC-22: When the feature is done, `docs/contracts/phase-5-1-identity-profile.md` and `docs/behaviors/phase-5-1-identity-profile.md` exist and the behavior doc carries `last_verified` and `source_files`. — verify: `test -f docs/contracts/phase-5-1-identity-profile.md && grep -q "last_verified" docs/behaviors/phase-5-1-identity-profile.md && grep -q "source_files" docs/behaviors/phase-5-1-identity-profile.md`
- [ ] AC-23: When the demo seed runs twice, the database still holds exactly one seeded counselor, one group and one student, the student stays assigned, and the existing password hash is unchanged. — verify: `pnpm test test/advising/seed.test.ts -t "seed is idempotent" && pnpm tsx scripts/seed-advising.ts && pnpm tsx scripts/seed-advising.ts`
- [ ] AC-24: When registration or password change submits a 7-character password it is rejected with `invalid_input`, while 8 characters are accepted. — verify: `pnpm test src/modules/advising/presentation/schemas.test.ts -t "password minimum"`
- [ ] AC-25: When `docs/plan/frontend-conventions.md` is read, it exists and carries an ADOPT/ADAPT/REJECT/DEFER row for every item in the reference table (at least 23 verdict rows). — verify: `test -f docs/plan/frontend-conventions.md && [ "$(grep -cE '\| (ADOPT|ADAPT|REJECT|DEFER) \|' docs/plan/frontend-conventions.md)" -ge 23 ]`
- [ ] AC-26: When a 5.1 action rejects invalid input, it returns `{ ok: false, error: { code: "invalid_input", fieldErrors } }`, success returns `{ ok: true, data }`, and the advising module contains neither a `{ status: ... }` form-state shape nor a `revalidatePath` call. — verify: `pnpm test src/modules/advising/presentation/run-action.test.ts -t "action result" && ! grep -rnE 'status: "(idle|success)"|revalidatePath' src/modules/advising`
- [ ] AC-27: When the reference is used, no file in `src/` mentions `aip-next` without an `Origin:` header and the recorded license finding (`aip-next ships no LICENSE`) is present in the conventions doc. — verify: `test -z "$(grep -rl 'aip-next' src --include=*.ts --include=*.tsx | xargs -r grep -L 'Origin: .*aip-next')" && grep -q "aip-next ships no LICENSE" docs/plan/frontend-conventions.md`
- [ ] AC-28: When `AGENTS.md` is opened, it states that `~/project/yaftar/aip-next` is a read-only frontend reference (no import, no dependency, no submodule). — verify: manual: run `grep -n "aip-next" AGENTS.md` and confirm the read-only line; human applied it
- [ ] AC-29: When dependencies are installed, `@tabler/icons-react` is an exact version in `package.json` (no `^`/`~`), it is imported under `src/components`, and no AntD icon package is imported under `src`. — verify: `node -e "const p=require('./package.json'); const v=p.dependencies['@tabler/icons-react']; if(!v || !/^\d+\.\d+\.\d+$/.test(v)) process.exit(1)" && grep -rq "@tabler/icons-react" src/components && ! grep -rq "@ant-design/icons" src`
- [ ] AC-30: When the Implementer hands off the skills, `SKILL.md` files exist for `mr-dan-feature-workflow` and `mr-dan-frontend-debugging` under `.opencode/skills/` and each contains the pinned stack versions, the `state.ok` contract, the no-`revalidatePath` rule, and a Persian/RTL note. — verify: `for f in .opencode/skills/mr-dan-feature-workflow/SKILL.md .opencode/skills/mr-dan-frontend-debugging/SKILL.md; do [ -f "$f" ] && grep -q "16.4.6" "$f" && grep -q "state.ok" "$f" && grep -q "revalidatePath" "$f" && grep -q "RTL" "$f" || exit 1; done`
- [ ] AC-31: When the skills are installed, `.opencode/skills/mr-dan-feature-workflow/SKILL.md` and `.opencode/skills/mr-dan-frontend-debugging/SKILL.md` exist and the append sections are present in the existing skills (`mr-dan-architecture`, `mr-dan-frontend`, `mr-dan-api`). — verify: `test -f .opencode/skills/mr-dan-feature-workflow/SKILL.md && test -f .opencode/skills/mr-dan-frontend-debugging/SKILL.md && grep -q "ضمیمه — جریان محصول" .opencode/skills/mr-dan-architecture/SKILL.md && grep -q "responsive" .opencode/skills/mr-dan-frontend/SKILL.md && grep -q "ضمیمه — route" .opencode/skills/mr-dan-api/SKILL.md && test ! -d .opencode/skills-draft`

## Documentation impact

**README.md** (must change — user-facing feature):
1. `## صفحات` — add `/login`, `/register`, `/profile`, `/counselor/students` with one-line Persian descriptions.
2. New `## احراز هویت و پروفایل` — roles, session cookie name `mrdan_session`, 7-day TTL, `httpOnly`/`sameSite=lax`,
   scrypt password storage, "رمز خام هرگز ذخیره نمی‌شود", group assignment by counselor.
3. `## محدودیت‌ها` (new subsection) — no rate limiting/lockout, no email verification, counselor self-signup not
   admin-approved until 5.4, physical metrics arrive in 5.3, session cleanup is lazy.
4. `## وضعیت` — add `فاز ۵.۱ (هویت، پروفایل، گروه) — کامل`.
5. `## اجرا` — add an optional dev-only demo step: `pnpm tsx scripts/seed-advising.ts` (creates `counselor` / `student`
   demo accounts, idempotent, refuses production). No new env key: **no environment variable is added in 5.1**;
   session TTL and cookie name are constants, not config.
6. Dependency note (install/prerequisites area) — `@tabler/icons-react@<pinned>` is the **only** new runtime dependency
   of 5.1 (icon set, exact pin, no `^`). Nothing else is added.

The `aip-next` reference needs **no README change**: it is a developer-only frontend reference, not a product feature,
dependency, or config surface. Its verdicts live in `docs/plan/frontend-conventions.md` (linked from `phases.md`).
Skill additions also need **no README change** (developer tooling; see Documentation impact).

**Configuration** — `.env.example` unchanged. If a future phase makes TTL configurable it must be added to
`src/shared/env.ts`, `.env.example`, and the README together.

**Frontend conventions — `docs/plan/frontend-conventions.md` (new, written in step 0).** Required content:
the verdict table from this plan (≥ 23 rows, each with ADOPT/ADAPT/REJECT/DEFER), the exact `ActionResult` /
`ActionError` contract (including `fieldErrors` = `field → single Persian message`), the zod → `fieldErrors` mapping
rule, the Persian-digit normalization rule (`username`/`email` only), the "success = `ok === true`" rule, the
"no `revalidatePath` in actions" rule, and the recorded licensing finding `aip-next ships no LICENSE` (so no verbatim
copies). Later UI steps (5.2–5.4) cite this doc instead of re-reading the sibling repo.

**Behavior doc** — yes: `docs/behaviors/phase-5-1-identity-profile.md` with
`last_verified: 2026-11-22` and `source_files` listing:
`prisma/schema.prisma, src/modules/advising/**, src/shared/action-result.ts, src/shared/persian-digits.ts, src/shared/errors.ts, src/server/container.ts, src/app/(advising)/**, src/app/(auth)/**, scripts/seed-advising.ts`.
Required sections (per `mro-behavior-docs`): what users can do now (plain Persian, no code), how it behaves
(one line per AC), what it does NOT do (this plan's Out of scope), files touched, verification commands + results,
and a link back to the README auth section. Describes only what was actually verified.

**Contract doc** — `docs/contracts/phase-5-1-identity-profile.md` (interfaces, invariants, edge cases, per-item verify).

**`docs/plan/phases.md`** — replace the فاز ۵ stub with the roadmap summary and link to this plan.
**`docs/plan/architecture.md`** — add `modules/advising` to the layer map.

**`AGENTS.md` — human-only, agents cannot edit (permission-locked).** Required edits:
- خط دامنه: از «فقط زیرساخت و RAG» به «زیرساخت + فاز محصول ۵.x».
- افزودن `src/modules/advising/**` و قاعدهٔ `domain` بدون import خارجی برای آن.
- قواعد داده: رمز فقط scrypt؛ session فقط tokenHash؛ فیزیکی در ۵.۳.
- جدول اسکیل‌ها: ردیف «هویت/پروفایل/گروه → `mr-dan-persistence` + `mr-dan-api`».
- خط مرجع فرانت: «`~/project/yaftar/aip-next` فقط مرجع read-only فرانت است (مثل `example/`)؛ import، dependency،
  submodule و کپی verbatim ممنوع؛ verdictها در `docs/plan/frontend-conventions.md`.»

**`.opencode/skills/**` — human-applied; no README change.** Implementer drafts the two new skills +
three append snippets under `.opencode/skills-draft/` (fallback `docs/skills-draft/` if the path is denied) per
"Skills adoption (required, step 0b)". The human moves/pastes them into `.opencode/skills/**`; agents must not attempt
that write. README stays unchanged: skills are developer tooling, not user-facing behavior.

**CHANGELOG.md** — do not write now. One-line draft for after final approval:
`## 2026-11-22 — فاز ۵.۱: هویت، پروفایل، گروه` — added `User`/`Session`/`Group` (migration `add_advising_identity`),
custom scrypt auth + DB-backed session cookie, profile editing, counselor group creation/assignment; frontend
conventions (`docs/plan/frontend-conventions.md`) derived from the read-only `aip-next` reference; tests `pnpm test`;
evidence: plan `.opencode/plans/phase-5-1-identity-profile.md`, review `.opencode/reviews/phase-5-1-identity-profile.md`,
behavior `docs/behaviors/phase-5-1-identity-profile.md`.

## Implementation order (for the Implementer)

0. **Step 0 (prerequisite):** read `~/project/yaftar/aip-next/docs/ARCHITECTURE.md`, the 4 `.agents/skills/*` files,
   and the util/kit files named in "Frontend reference"; write `docs/plan/frontend-conventions.md` (verdicts + exact
   contracts + licensing finding). **No file from `aip-next` is imported or copied.** Every later UI step cites this doc
   instead of the sibling repo.
0b. **Step 0b (required, human handoff):** write the skill drafts under `.opencode/skills-draft/` (fallback
   `docs/skills-draft/`): two new `SKILL.md` files + three `_appends/*.md` snippets, per "Skills adoption". Do **not**
   try to write `.opencode/skills/**` (permission-denied). Tell the human exactly which files to move/paste; AC-30 and
   AC-31 cover the drafts and the install.
1. `pnpm add -E @tabler/icons-react` (the only new dependency; exact pin).
2. `src/shared/` kernel: `errors.ts` (+ rag re-export), `action-result.ts`, `persian-digits.ts`; run
   `pnpm test test/architecture.test.ts` (zero behaviour change).
3. Schema + `pnpm prisma migrate dev --name add_advising_identity` + `pnpm prisma generate`.
4. Domain models/ports/errors.
5. Infrastructure adapters + their unit tests (crypto first).
6. Application use cases + fakes + unit tests.
7. Presentation schemas/cookie/guards/messages/run-action/actions.
8. Container wiring.
9. Pages + client components (tabler icons in nav + roster).
10. Integration test + e2e spec.
11. `scripts/seed-advising.ts` + `test/advising/seed.test.ts` (run twice; assert counts stable).
12. README, contract doc, behavior doc, phases/architecture docs.
13. Full gate; then stop for review (do not write CHANGELOG).

## Risks

| # | Risk | Mitigation |
|---|---|---|
| R1 | Self-selecting `counselor` at signup is privilege escalation (no admin approval until 5.4) | **Resolved Q1: allowed.** Documented limitation; counselor powers are limited to own groups; no destructive ops in 5.1; admin approval remains the 5.4 follow-up |
| R2 | No rate limiting / lockout on login | Deferred; generic error + no user enumeration by message; note in README |
| R3 | `scrypt` blocks if done synchronously | use callback `crypto.scrypt` promisified (libuv threadpool), N=16384 keeps it ~50-100 ms |
| R4 | One extra DB query per protected render | Accepted for MVP; session caching deferred |
| R5 | Additive migration is forward-only; rollback drops user data | Document; never edit applied migration |
| R6 | `User`/`Group` are SQL reserved words | Prisma quotes identifiers; AC-1/AC-19 prove it |
| R7 | AntD `Select` does not submit native form values | native `<select>` in these forms; documented in UI decisions |
| R8 | CSRF relies on Server Action origin check + `sameSite=lax` | Accepted; no cross-site form posts in 5.1 |
| R9 | Integration test silently skips without Postgres | AC-19 must be run with `docker compose up -d`; report the skip if services are down |
| R10 | `redirect()` inside `try/catch` swallows `NEXT_REDIRECT` | call `redirect()` after the `try/catch`; code-review checkpoint |
| R11 | Moving `AppError` to `shared` touches rag | pure re-export, zero behaviour change, AC-17 + AC-18 gate it |
| R12 | Demo seed accidentally run against production | hard `NODE_ENV === "production"` guard + `seed refuses production` test; idempotent upserts only, never deletes |
| R13 | Licensing/attribution of copied frontend code | **No `LICENSE` in `aip-next` or `~/project/yaftar`.** Verdicts ADOPT/ADAPT copy *ideas only*; 5.1 copies nothing verbatim. A verbatim copy needs explicit human permission — AC-27 |
| R14 | Stack drift (their TS 5 / eslint / next-auth / next-intl patterns may not compile or may contradict our pins) | No file ported as-is; every pattern re-checked against Next `16.4.6` docs and our `strict` TS 7 config; architecture test + typecheck gate it |
| R15 | Over-copying a large kit into a small phase (YAGNI) | Adoption rule: a util is ADOPT only if 5.1 uses it now; otherwise DEFER with the consuming phase (5.2/5.4) or REJECT. Table counts: 3 ADOPT / 3 ADAPT / 7 DEFER / 10 REJECT |
| R16 | One new runtime dependency (`@tabler/icons-react`) is supply-chain surface | Human-approved (Q9); exact pin via `pnpm add -E`; one icon set only; AC-29 proves pin + usage and bans AntD icon imports |
| R17 | Skill duplication/drift between our `.opencode/skills/**` and the `aip-next` source; agent cannot install them | Drafts pin our stack versions and the `state.ok`/no-`revalidatePath`/RTL rules; human install is an explicit handoff (AC-30 draft, AC-31 manual). No near-duplicates: 2 new skills + 3 append snippets |

## Resolved decisions (human, 2026-11-22 — final; no open questions remain)

- **Q1 — counselor self-signup: allowed.** Registration accepts `role = counselor` (reference behaviour, unblocks the
  5.1 counselor panel). Kept as R1: privilege escalation until admin approval, which stays the 5.4 follow-up.
  No seed-only workaround.
- **Q2 — `grade` / `fieldOfStudy`: fixed Persian enums** (`zod` unions / `GRADES` + `FIELDS` constants), no free text.
  Values match `example/models/user.py`: دهم | یازدهم | دوازدهم | فارغ‌التحصیل؛ ریاضی فیزیک | علوم تجربی | علوم انسانی | فنی حرفه‌ای.
- **Q3 — password minimum: 8** characters (max 128). Schemas, tests (`password minimum`: 7 rejected / 8 accepted)
  and AC-24 all assert 8.
- **Q4 — password change requires `currentPassword`.** Missing ⇒ `invalid_input`; wrong ⇒ `unauthorized`; on success all
  other sessions are revoked and the current one survives.
- **Q5 — post-login landing: `/profile`** for every role, including counselors (nav still exposes `/counselor/students`).
  Both register and login redirect there; auth pages redirect already-authenticated users there too.
- **Q6 — tooling profile:** the human will run `node .opencode/scripts/mro-doctor.mjs --init` themselves. The plan does
  not depend on it; until then `db-status` / `check-file` stay unconfigured and this plan's commands come from root
  `AGENTS.md`.
- **Q7 — demo seed: yes.** `scripts/seed-advising.ts` (dev-only, idempotent, no new dependency) creates one counselor,
  one group and one student with Persian sample data; refused when `NODE_ENV === "production"`. Covered by AC-23 and
  `test/advising/seed.test.ts` (`seed is idempotent`, `seed refuses production`).
- **Q8 — `~/project/yaftar/aip-next` is a required, read-only frontend reference (2026-11-22).** Reviewed as step 0;
  never imported, never a dependency, never a submodule (same status as `example/`). Verdict table above
  (3 ADOPT / 3 ADAPT / 7 DEFER / 10 REJECT) is the YAGNI gate. Adopted contract: `ActionResult` discriminant +
  `fieldErrors`, no `revalidatePath`, Persian-digit normalization on `username`/`email`. `aip-next` ships **no
  LICENSE**, so 5.1 copies nothing verbatim; AC-25/26/27/28 pin the doc, the contract, and the license finding.
  `docs/plan/frontend-conventions.md` is the durable artifact; later phases cite it.
- **Q9 — icons: `@tabler/icons-react` is the icon set (2026-11-22).** Reverses the earlier REJECT. It is the **only**
  new runtime dependency of 5.1, pinned exact with `pnpm add -E` (no `^`), replacing any AntD icon-package plan.
  Exactly one icon set; no mixing. Covered by AC-29.
- **Q10 — adopt the four `aip-next` skills, adapted, human installs them (2026-11-22).** `an-front-feature` and
  `an-front-debugging` become two new project skills; `an-front-architecture` and `api-server-sync` are merged as
  append snippets into existing skills. `.opencode/skills/**` is permission-denied, so the Implementer drafts under
  `.opencode/skills-draft/` and the human moves them into place. Drafts must carry our pinned versions, the
  `state.ok` contract, the no-`revalidatePath` rule, and the Persian/RTL note. Covered by AC-30 (drafts) and AC-31
  (manual install).

Q9 و Q10 آخرین اصلاحات انسان پیش از implementation هستند؛ پلن بعد از این دو سؤال باز ندارد.

review_level: full
