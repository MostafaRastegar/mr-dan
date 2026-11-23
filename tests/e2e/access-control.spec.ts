import { test, expect } from "@playwright/test";

// E2E tests require a running dev server + Postgres.
// Skip unless explicitly enabled.
const e2eEnabled = process.env.E2E_ENABLED === "true";

test.describe("access control baseline", () => {
  test.skip(!e2eEnabled, "E2E tests disabled. Set E2E_ENABLED=true and start services.");

  test("anonymous GET /api/documents returns 401", async ({ request }) => {
    const res = await request.get("/api/documents");
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("unauthorized");
  });

  test("anonymous GET /api/admin/stats returns 401", async ({ request }) => {
    const res = await request.get("/api/admin/stats");
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("unauthorized");
  });

  test("anonymous /chat is redirected to /login", async ({ page }) => {
    await page.goto("/chat");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("counselor calling /api/admin/stats returns 403", async ({ request }) => {
    test.fixme(true, "no dev-seeded counselor session available; register/login then promote via scripts/create-admin.ts first");
  });

  test("admin calling /api/admin/stats returns 200", async ({ request }) => {
    test.fixme(true, "no dev-seeded admin user; create one via scripts/create-admin.ts then log in");
  });

  test("student opening /api-docs lands on /profile", async ({ page }) => {
    test.fixme(true, "no dev-seeded student session available; register first");
  });
});
