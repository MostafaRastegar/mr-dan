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

test.describe("advising planning (schedule, homework, study)", () => {
  test.skip(!e2eEnabled, "E2E tests disabled. Set E2E_ENABLED=true and start services.");

  test("logged-out visitor is redirected to /login on planning pages", async ({ page }) => {
    await page.goto("/schedule");
    await expect(page).toHaveURL(/\/login$/);

    await page.goto("/homework");
    await expect(page).toHaveURL(/\/login$/);

    await page.goto("/study");
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

  test("student records a study session and sees analysis update", async ({ page }) => {
    const username = `e2e-study_${Date.now()}`;
    const password = `e2e-pass-${Date.now()}`;

    await page.goto("/register");
    await page.getByTestId(TEST_IDS.FORM.INPUT("fullName")).fill("دانش‌آموز آزمایشی");
    await page.getByTestId(TEST_IDS.FORM.INPUT("username")).fill(username);
    await page.getByTestId(TEST_IDS.FORM.INPUT("password")).fill(password);
    await page.getByTestId(TEST_IDS.FORM.SUBMIT("register")).click();
    await expect(page).toHaveURL(/\/profile/);

    // Fake the clock from here on: the timer's 25-minute focus interval must
    // expire on demand, without waiting for real time.
    await page.clock.install();

    await page.goto("/study");

    await page.getByTestId(TEST_IDS.STUDY.TIMER_START).click();
    await page.clock.fastForward(25 * 60 * 1000 + 5000);

    // Prove the fake clock drove the timer: the focus phase expired into review,
    // where the start button is gone and the prefilled session form is rendered.
    await expect(page.getByTestId(TEST_IDS.STUDY.TIMER_START)).toHaveCount(0);
    const durationInput = page.getByTestId(TEST_IDS.FORM.INPUT("durationMinutes"));
    await expect(durationInput).toBeVisible();
    await expect(durationInput).toHaveValue("25");

    await page.getByTestId(TEST_IDS.FORM.INPUT("focusLevel")).fill("4");
    await page.getByTestId(TEST_IDS.FORM.SUBMIT("study")).click();

    await expect(page.getByTestId(TEST_IDS.STUDY.SAVED)).toHaveText("جلسه ثبت شد.");
  });
});
