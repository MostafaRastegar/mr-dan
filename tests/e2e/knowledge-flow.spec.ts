import { test, expect } from "@playwright/test";

// E2E tests require a running dev server + Postgres + Chroma.
// Skip unless explicitly enabled.
const e2eEnabled = process.env.E2E_ENABLED === "true";

test.describe("knowledge flow (upload → chat → citation → delete)", () => {
  test.skip(!e2eEnabled, "E2E tests disabled. Set E2E_ENABLED=true and start services.");

  test("upload a document, chat with citation, then delete", async ({ page }) => {
    const testContent = "mr-dan e2e test document. Machine learning is a branch of AI.";

    // Go to admin knowledge page and upload via the file input
    await page.goto("/admin/knowledge");

    // Create a temp file and upload via the hidden input
    await page.setInputFiles('input[type="file"]', [
      { name: "e2e-test.txt", mimeType: "text/plain", buffer: Buffer.from(testContent) },
    ]);

    // Wait for upload to complete (notification)
    await page.waitForTimeout(3000);

    // Verify document appears in the list
    await expect(page.locator("text=e2e-test.txt")).toBeVisible();

    // Go to chat and ask about the content
    await page.goto("/chat");
    await page.fill('input[placeholder*="پرسش"]', "machine learning");
    await page.click('button[type="submit"]');

    // Wait for response to appear
    await page.waitForTimeout(5000);

    // Check that a response appeared
    await expect(page.locator('div:has-text("machine learning")')).toBeVisible();

    // Check sources/citations appear
    await expect(page.locator("text=منابع:")).toBeVisible();

    // Go back to admin and delete the document
    await page.goto("/admin/knowledge");
    await page.waitForTimeout(2000);

    // Find and click the delete button for the uploaded document
    const deleteBtn = page.locator('button:has-text("حذف شد")').first();
    // Actually the delete button has a trash icon; click the row's danger button
    await page.locator('button[aria-label*="delete"], button.danger, button:has-text("حذف")').first().click();

    await page.waitForTimeout(2000);

    // Verify document is gone
    await expect(page.locator("text=e2e-test.txt")).not.toBeVisible();
  });
});
