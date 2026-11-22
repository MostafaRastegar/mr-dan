# راهنمای استفاده و تست دستی — فاز ۵.۱ (هویت، پروفایل، گروه)

> فاز جاری: **۵.۱** — هویت، پروفایل، گروه.
> فازهای بعد: ۵.۲ برنامه/تکلیف/تایمر مطالعه · ۵.۳ آزمون/تغذیه/کتاب/تفریح · ۵.۴ داشبورد (echarts) + پنل مشاور.
> وضعیت: پیاده‌سازی کامل، گیت سبز (typecheck/lint/test/build = 0)، در انتظار review نهایی.

## ۱. اجرا

```bash
cd /home/mr/project/mr-dan
docker compose up -d postgres chromadb   # اگر بالا نیستند
pnpm dev                                  # http://localhost:3000
```

پیش‌نیازهای الان برقرارند: Postgres روی `localhost:5432`، Chroma روی `localhost:8001`، migration `20261122145638_add_advising_identity` اعمال‌شده، Playwright chromium نصب‌شده.

## ۲. حساب‌های دمو (فاز ۵.۱)

`pnpm tsx scripts/seed-advising.ts` ساخته است و idempotent است (اجرای دوباره چیزی را عوض نمی‌کند و هش موجود را بازنویسی نمی‌کند).

| username | نقش | توضیح |
|---|---|---|
| `counselor` | counselor | مریم رضایی، صاحب گروه «کلاس دوازدهم تجربی» |
| `student` | student | علی احمدی، دوازدهم علوم تجربی، عضو همان گروه |

رمز دمو برای هر دو: `demo` + `-` + `123456` (یعنی `demo-123456`). خود اسکریپت هر بار آن را در stdout چاپ می‌کند، پس اگر یادت رفت دوباره seed را بزن.

## ۳. چک‌لیست تست دستی (AC-20)

1. `/` → لینک‌های «ورود» و «ثبت‌نام» کار می‌کنند.
2. `/login` با `counselor` و رمز بالا → به `/profile` می‌رود.
3. `/profile` → مقدار «مدرسه» را عوض کن → «پروفایل ذخیره شد.» → reload → مقدار مانده باشد.
4. `/counselor/students` با counselor → یک گروه بساز، دانش‌آموز `student` را تخصیص بده.
5. `/profile` → تغییر رمز: رمز فعلی اشتباه → خطا؛ رمز درست → نشست‌های دیگر باطل می‌شوند.
6. خروج بزن، بعد مستقیم `/profile` را باز کن → باید به `/login` redirect شود.
7. `/register` → دانش‌آموز جدید بساز → خودکار وارد می‌شود و به `/profile` می‌رسد.
8. با نشست دانش‌آموز `/counselor/students` را باز کن → باید رد شود (فقط مشاور).

کوکی نشست: `mrdan_session`، `httpOnly`، `sameSite=lax`، عمر ۷ روز، `secure` فقط در production.

## ۴. دستورهای تأیید (وقتی شک کردی چیزی نشکسته)

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
pnpm test test/advising/integration.test.ts          # نیاز به Postgres
E2E_ENABLED=true pnpm exec playwright test tests/e2e/advising-auth.spec.ts --reporter=list
```

نکته: `pnpm test:e2e -- <args>` آرگومان‌ها را forward نمی‌کند؛ از `pnpm exec playwright test` مستقیم استفاده کن.
`tests/e2e/knowledge-flow.spec.ts` (فاز ۴) بدون `OPENROUTER_API_KEY` شکست می‌خورد؛ مربوط به ۵.۱ نیست.

## ۵. تمیزکاری

کاربران `e2e_*` از اجرای Playwright در DB می‌مانند و بی‌ضررند. برای پاک کردن:

```bash
docker compose exec -T postgres psql -U mr_dan -d mr_dan \
  -c 'delete from "User" where username like '"'"'e2e\_%'"'"';'
```

## ۶. کارهای باقی‌ماندهٔ این فاز (انسانی)

- AC-20: همان چک‌لیست بخش ۳ (بالا).
- AC-28: افزودن خط read-only برای `~/project/yaftar/an-front` در `AGENTS.md` (مرجع درست؛ `aip-next` در ۲۰۲۶-۱۱-۲۲ کنار گذاشته شد).
- AC-31: انجام شد — اسکیل‌ها در `.opencode/skills/mr-dan-feature-workflow` و `.opencode/skills/mr-dan-frontend-debugging` نصب‌اند و سه append در `mr-dan-{architecture,frontend,api}` اضافه شده. (فقط اگر `AGENTS.md` را دستی به‌روز می‌کنی، دو ردیف جدول اسکیل‌ها را هم اضافه کن.)
- `.opencode/mro-profile.json` ساخته نشده؛ `node .opencode/scripts/mro-doctor.mjs --init`.
- `CHANGELOG.md` بعد از تأیید نهایی.
