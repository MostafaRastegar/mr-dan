import { test, expect } from "@playwright/test";

import { TEST_IDS } from "@/constants/test-ids";

// E2E tests require a running dev server + Postgres.
// Skip unless explicitly enabled.
const e2eEnabled = process.env.E2E_ENABLED === "true";

test.describe("advising auth (identity, profile)", () => {
  test.skip(!e2eEnabled, "E2E tests disabled. Set E2E_ENABLED=true and start services.");

  test("logged out visitor cannot see profile", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("/profile");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId(TEST_IDS.FORM.INPUT("username"))).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.FORM.INPUT("schoolName"))).toHaveCount(0);

    await context.close();
  });

  test("edit profile persists and survives logout and login", async ({ page }) => {
    const username = `e2e_${Date.now()}`;
    const password = `e2e-pass-${Date.now()}`;

    await page.goto("/register");
    await page.getByTestId(TEST_IDS.FORM.INPUT("fullName")).fill("دانش‌آموز آزمایشی");
    await page.getByTestId(TEST_IDS.FORM.INPUT("username")).fill(username);
    await page.getByTestId(TEST_IDS.FORM.INPUT("password")).fill(password);
    await page.getByTestId(TEST_IDS.FORM.INPUT("schoolName")).fill("دبیرستان اول");
    await page.getByTestId(TEST_IDS.FORM.SUBMIT("register")).click();
    await expect(page).toHaveURL(/\/profile/);

    await page.getByTestId(TEST_IDS.FORM.INPUT("schoolName")).fill("دبیرستان دوم");
    await page.getByTestId(TEST_IDS.FORM.SUBMIT("profile")).click();
    await expect(page.getByTestId(TEST_IDS.PROFILE.SAVED)).toHaveText("پروفایل ذخیره شد.");

    await page.reload();
    await expect(page.getByTestId(TEST_IDS.FORM.INPUT("schoolName"))).toHaveValue("دبیرستان دوم");

    await page.getByTestId(TEST_IDS.NAV.LOGOUT).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.getByTestId(TEST_IDS.FORM.INPUT("username")).fill(username);
    await page.getByTestId(TEST_IDS.FORM.INPUT("password")).fill(password);
    await page.getByTestId(TEST_IDS.FORM.SUBMIT("login")).click();
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.getByRole("heading", { name: "پروفایل" })).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.FORM.INPUT("schoolName"))).toHaveValue("دبیرستان دوم");
  });
});
