import { test, expect, type Page } from "@playwright/test";

import { TEST_IDS } from "@/constants/test-ids";

// E2E tests require a running dev server + Postgres.
// Skip unless explicitly enabled.
const e2eEnabled = process.env.E2E_ENABLED === "true";

/**
 * antd virtualizes its dropdown and antd 6 no longer exposes `role="option"`,
 * so label lookups are unreliable. Drive the list with the keyboard instead:
 * open, walk the active option until its `title` matches, commit with Enter.
 */
async function pickOption(page: Page, testId: string, label: string): Promise<void> {
  await page.getByTestId(testId).click();
  const active = page.locator(".ant-select-dropdown:visible .ant-select-item-option-active");
  for (let i = 0; i < 12; i += 1) {
    if ((await active.getAttribute("title")) === label) break;
    await page.keyboard.press("ArrowDown");
  }
  // Exact, not substring: "ریاضی" is a prefix of "ریاضی گسسته" and "ریاضی و آمار".
  await expect(active).toHaveAttribute("title", label);
  await page.keyboard.press("Enter");
  await expect(page.locator(".ant-select-dropdown:visible")).toHaveCount(0);
  // The Select root renders no placeholder once a value is chosen, so its text
  // content is exactly the selected label.
  await expect(page.getByTestId(testId)).toHaveText(label);
}

async function registerStudent(page: Page, prefix: string): Promise<void> {
  const username = `e2e-${prefix}_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
  const password = `e2e-pass-${Date.now()}`;

  await page.goto("/register");
  await page.getByTestId(TEST_IDS.FORM.INPUT("fullName")).fill("دانش‌آموز آزمایشی");
  await page.getByTestId(TEST_IDS.FORM.INPUT("username")).fill(username);
  await page.getByTestId(TEST_IDS.FORM.INPUT("password")).fill(password);
  await page.getByTestId(TEST_IDS.FORM.SUBMIT("register")).click();
  await expect(page).toHaveURL(/\/profile/);
}

/** Iran calendar day (`UTC+03:30`) as `YYYY-MM-DD`. */
function iranTodayKey(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran" }).format(new Date());
}

/** `hh:mm` in Persian digits, matching `formatClock` on the page. */
const clockFormatter = new Intl.NumberFormat("fa-IR", {
  minimumIntegerDigits: 2,
  useGrouping: false,
});

function faClock(minutes: number): string {
  return `${clockFormatter.format(Math.floor(minutes / 60))}:${clockFormatter.format(minutes % 60)}`;
}

/** antd `TimePicker` takes typed text; the value commits on Enter only. */
async function pickClock(page: Page, testId: string, clock: string): Promise<void> {
  const picker = page.getByTestId(testId);
  await picker.click();
  // antd 6 forwards `data-testid` to the inner `<input>` itself, so the test id
  // can already be the editable element. Resolve either shape.
  const input =
    (await picker.locator("input").count()) > 0
      ? picker.locator("input").first()
      : picker;
  await input.fill(clock);
  await page.keyboard.press("Enter");
  await expect(input).toHaveValue(clock);
}

/** Registers a student and leaves one pending homework due on `dayKey`. */
async function createHomework(page: Page, title: string, dayKey: string): Promise<void> {
  await page.goto("/homework");
  await page.getByTestId(TEST_IDS.HOMEWORK.CREATE_FORM).click();
  await page.getByTestId(TEST_IDS.FORM.INPUT("title")).fill(title);
  await page.getByTestId(TEST_IDS.FORM.INPUT("deadline")).fill(dayKey);
  await page.getByTestId(TEST_IDS.FORM.SUBMIT("homework")).click();
  await expect(page.getByTestId(TEST_IDS.HOMEWORK.SAVED)).toBeVisible();
}

test.describe("advising planning (schedule, budget)", () => {
  test.skip(!e2eEnabled, "E2E tests disabled. Set E2E_ENABLED=true and start services.");

  test("logged-out visitor is redirected to /login on planning pages", async ({ page }) => {
    await page.goto("/schedule");
    await expect(page).toHaveURL(/\/login$/);

    await page.goto("/homework");
    await expect(page).toHaveURL(/\/login$/);

    await page.goto("/budget");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("student creates and deletes a schedule entry", async ({ page }) => {
    const username = `e2e-sched_${Date.now()}`;
    const password = `e2e-pass-${Date.now()}`;

    await page.goto("/register");
    await page.getByTestId(TEST_IDS.FORM.INPUT("fullName")).fill("دانش‌آموز آزمایشی");
    await page.getByTestId(TEST_IDS.FORM.INPUT("username")).fill(username);
    await page.getByTestId(TEST_IDS.FORM.INPUT("password")).fill(password);
    await page.getByTestId(TEST_IDS.FORM.SUBMIT("register")).click();
    await expect(page).toHaveURL(/\/profile/);

    await page.goto("/schedule");
    await page.getByTestId(TEST_IDS.SCHEDULE.CREATE_FORM).click();

    await pickOption(page, TEST_IDS.FORM.SELECT("dayOfWeek"), "دوشنبه");

    await page.getByTestId(TEST_IDS.FORM.INPUT("startTime")).fill("08:00");
    await page.getByTestId(TEST_IDS.FORM.INPUT("endTime")).fill("09:00");
    await pickOption(page, TEST_IDS.FORM.SELECT("subject"), "ریاضی");

    await page.getByTestId(TEST_IDS.FORM.SUBMIT("schedule")).click();
    await expect(page.getByTestId(TEST_IDS.SCHEDULE.SAVED)).toHaveText("برنامه ذخیره شد.");

    await expect(page.getByTestId(TEST_IDS.SCHEDULE.TABLE)).toBeVisible();

    await page.getByTestId(TEST_IDS.SCHEDULE.DELETE_ENTRY).first().click();
    // The row control now carries aria-label="حذف" too, so scope to the popconfirm.
    await page
      .locator(".ant-popconfirm")
      .getByRole("button", { name: "حذف" })
      .click();
    await expect(page.getByTestId(TEST_IDS.SCHEDULE.EMPTY)).toBeVisible();
  });

  test("student sets free time and plans homework", async ({ page }) => {
    const dayKey = iranTodayKey();

    await registerStudent(page, "budget");
    await createHomework(page, "مشق ریاضی", dayKey);

    await page.goto(`/budget?date=${dayKey}`);

    await pickClock(page, TEST_IDS.FORM.INPUT("freeTime"), "03:00");
    await page.getByTestId(TEST_IDS.FORM.SUBMIT("budget-free-time")).click();
    await expect(
      page.getByTestId(TEST_IDS.BUDGET.FORM).getByRole("status"),
    ).toBeVisible();

    // The saved value survives the refresh the action triggers.
    await expect(page.getByTestId(TEST_IDS.BUDGET.DAY)).toContainText(
      `وقت آزاد: ${faClock(3 * 60)}`,
    );

    // One candidate: opening the list puts the first option on the active row.
    await page.getByTestId(TEST_IDS.FORM.SELECT("homeworkId")).click();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId(TEST_IDS.FORM.SELECT("homeworkId"))).toContainText(
      "مشق ریاضی",
    );

    await pickClock(page, TEST_IDS.FORM.INPUT("plannedTime"), "01:30");
    await page.getByTestId(TEST_IDS.FORM.SUBMIT("budget-plan")).click();

    const row = page.getByTestId(TEST_IDS.BUDGET.PLAN_ROW);
    await expect(row).toContainText("مشق ریاضی");
    await expect(row).toContainText(faClock(90));
  });

  test("plan over capacity shows a Persian field error", async ({ page }) => {
    const dayKey = iranTodayKey();

    await registerStudent(page, "budget-cap");
    await createHomework(page, "مشق فیزیک", dayKey);

    await page.goto(`/budget?date=${dayKey}`);

    await pickClock(page, TEST_IDS.FORM.INPUT("freeTime"), "01:00");
    await page.getByTestId(TEST_IDS.FORM.SUBMIT("budget-free-time")).click();
    await expect(
      page.getByTestId(TEST_IDS.BUDGET.FORM).getByRole("status"),
    ).toBeVisible();

    await page.getByTestId(TEST_IDS.FORM.SELECT("homeworkId")).click();
    await page.keyboard.press("Enter");
    await pickClock(page, TEST_IDS.FORM.INPUT("plannedTime"), "02:00");
    await page.getByTestId(TEST_IDS.FORM.SUBMIT("budget-plan")).click();

    // The server error is mapped onto the `plannedTime` field, so antd renders
    // it under the picker — the «۲ ساعت از ۱ ساعت» sentence, not a code.
    const planForm = page.getByTestId(TEST_IDS.BUDGET.PLAN_FORM);
    await expect(planForm.locator(".ant-form-item-explain-error")).toContainText(
      "ساعت از",
    );
    // Nothing was written: the day still has no plan rows.
    await expect(page.getByTestId(TEST_IDS.BUDGET.EMPTY)).toBeVisible();
  });

  test("budget date picker navigates to another day", async ({ page }) => {
    const today = iranTodayKey();

    await registerStudent(page, "budget-date");
    await page.goto(`/budget?date=${today}`);

    await page.getByTestId(TEST_IDS.BUDGET.DAY_PICKER).click();
    // Read a real in-month cell title instead of computing a date: the panel
    // month is the browser's, which need not match the Iran day at midnight.
    const cell = page
      .locator(`.ant-picker-cell-in-view[title]:not([title="${today}"])`)
      .first();
    const target = await cell.getAttribute("title");
    if (!target) throw new Error("date picker rendered no selectable cell");

    await cell.click();

    await expect(page).toHaveURL(new RegExp(`/budget\\?date=${target}`));
    // A fresh student has no budget row for any day, so the page re-rendered
    // for the picked date rather than replaying the previous one.
    await expect(page.getByTestId(TEST_IDS.BUDGET.DAY)).toContainText("ثبت نشده");
  });

  test("no study nav entry remains", async ({ page }) => {
    await registerStudent(page, "budget-nav");
    await page.goto("/budget");

    await expect(page.getByTestId(TEST_IDS.NAV.BUDGET)).toBeVisible();
    // `NAV.STUDY` no longer exists; the literal is the assertion that it is gone.
    await expect(page.locator('[data-testid="nav-study"]')).toHaveCount(0);
  });
});
