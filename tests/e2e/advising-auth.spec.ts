import { test, expect } from "@playwright/test";

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
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="schoolName"]')).toHaveCount(0);

    await context.close();
  });

  test("edit profile persists and survives logout and login", async ({ page }) => {
    const username = `e2e_${Date.now()}`;
    const password = "Test-password-123";

    await page.goto("/register");
    await page.fill('input[name="fullName"]', "دانش‌آموز آزمایشی");
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="schoolName"]', "دبیرستان اول");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/profile/);

    await page.fill('input[name="schoolName"]', "دبیرستان دوم");
    await page.click('button:has-text("ذخیرهٔ پروفایل")');
    await expect(page.getByText("پروفایل ذخیره شد.")).toBeVisible();

    await page.reload();
    await expect(page.locator('input[name="schoolName"]')).toHaveValue("دبیرستان دوم");

    await page.click('button:has-text("خروج")');
    await expect(page).toHaveURL(/\/login$/);

    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.getByRole("heading", { name: "پروفایل" })).toBeVisible();
    await expect(page.locator('input[name="schoolName"]')).toHaveValue("دبیرستان دوم");
  });
});
