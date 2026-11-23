import { test, expect, type Page } from "@playwright/test";

import { TEST_IDS } from "@/constants/test-ids";

// E2E tests require a running dev server + Postgres.
// Skip unless explicitly enabled.
const e2eEnabled = process.env.E2E_ENABLED === "true";

/**
 * antd virtualizes its dropdown and antd 6 no longer exposes `role="option"`,
 * so label lookups are unreliable. Drive the list with the keyboard instead:
 * open, walk the active option until its `title` matches, commit with Enter.
 * Same helper as `advising-planning.spec.ts`.
 */
async function pickOption(page: Page, testId: string, label: string): Promise<void> {
  await page.getByTestId(testId).click();
  const active = page.locator(".ant-select-dropdown:visible .ant-select-item-option-active");
  for (let i = 0; i < 12; i += 1) {
    if ((await active.getAttribute("title")) === label) break;
    await page.keyboard.press("ArrowDown");
  }
  await expect(active).toHaveAttribute("title", label);
  await page.keyboard.press("Enter");
  await expect(page.locator(".ant-select-dropdown:visible")).toHaveCount(0);
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

test.describe("advising nutrition and leisure", () => {
  test.skip(!e2eEnabled, "E2E tests disabled. Set E2E_ENABLED=true and start services.");

  test("logged-out visitor is redirected to /login on nutrition and leisure", async ({ page }) => {
    await page.goto("/nutrition");
    await expect(page).toHaveURL(/\/login$/);

    await page.goto("/leisure");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("student saves a physical profile and today's meal plan", async ({ page }) => {
    await registerStudent(page, "nutrition");

    await page.goto("/nutrition");

    await page.getByTestId(TEST_IDS.FORM.INPUT("age")).fill("17");
    await page.getByTestId(TEST_IDS.FORM.INPUT("gender")).getByText("مرد", { exact: true }).click();
    await page.getByTestId(TEST_IDS.FORM.INPUT("heightCm")).fill("180");
    await page.getByTestId(TEST_IDS.FORM.INPUT("weightKg")).fill("70");
    await pickOption(page, TEST_IDS.FORM.SELECT("activityLevel"), "متوسط");
    await page
      .getByTestId(TEST_IDS.FORM.INPUT("dietGoal"))
      .getByText("حفظ وزن", { exact: true })
      .click();

    await page.getByTestId(TEST_IDS.FORM.SUBMIT("physical-profile")).click();
    await expect(page.getByTestId(TEST_IDS.NUTRITION.SAVED)).toBeVisible();

    const bmr = page.getByTestId(TEST_IDS.NUTRITION.BMR);
    await expect(bmr).toBeVisible();
    await expect(bmr).not.toBeEmpty();
    const tdee = page.getByTestId(TEST_IDS.NUTRITION.TDEE);
    await expect(tdee).toBeVisible();
    await expect(tdee).not.toBeEmpty();

    // The edit form must keep showing what was saved after the refresh: a
    // `resetFields()` here would wipe rc-field-form's store and leave the
    // inputs blank. rc-field-form renders the item id from the field name.
    const form = page.getByTestId(TEST_IDS.NUTRITION.FORM);
    await expect(form.locator("input#age")).toHaveValue("17");
    await expect(form.locator("input#heightCm")).toHaveValue("180");
    await expect(form.locator("input#weightKg")).toHaveValue("70");

    await page.getByTestId(TEST_IDS.NUTRITION.SAVE_PLAN).click();

    const plan = page.getByTestId(TEST_IDS.NUTRITION.PLAN);
    await expect(plan).toBeVisible();
    await expect(plan.locator("li")).toHaveCount(4);

    // Persistence: the plan survives a full reload.
    await page.reload();
    await expect(page.getByTestId(TEST_IDS.NUTRITION.PLAN)).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.NUTRITION.PLAN).locator("li")).toHaveCount(4);
  });

  test("leisure panel and book render for a student", async ({ page }) => {
    await registerStudent(page, "leisure");

    await page.goto("/leisure");
    const panel = page.getByTestId(TEST_IDS.LEISURE.PANEL);
    const book = page.getByTestId(TEST_IDS.LEISURE.BOOK);
    await expect(panel).toBeVisible();
    await expect(book).toBeVisible();
    await expect(panel).not.toBeEmpty();
    await expect(book).not.toBeEmpty();
  });
});
