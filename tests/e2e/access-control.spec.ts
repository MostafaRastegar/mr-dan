import { execFileSync } from "node:child_process";

import { test, expect } from "@playwright/test";

import { TEST_IDS } from "@/constants/test-ids";

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
    test.fixme(true, "no dev-seeded counselor session available; register/login then promote via scripts/create-user.ts first");
  });

  test("admin calling /api/admin/stats returns 200", async ({ request }) => {
    test.fixme(true, "no dev-seeded admin user; create one via scripts/create-user.ts then log in");
  });

  test("student opening /api-docs lands on /profile", async ({ page }) => {
    test.fixme(true, "no dev-seeded student session available; register first");
  });

  test("student counselor pages redirect to /profile", async ({ page }) => {
    const username = `e2e_student_${Date.now()}`;
    const password = `e2e-pass-${Date.now()}`;

    await page.goto("/register");
    await page.getByTestId(TEST_IDS.FORM.INPUT("fullName")).fill("دانش‌آموز مرزی");
    await page.getByTestId(TEST_IDS.FORM.INPUT("username")).fill(username);
    await page.getByTestId(TEST_IDS.FORM.INPUT("password")).fill(password);
    await page.getByTestId(TEST_IDS.FORM.SUBMIT("register")).click();
    await expect(page).toHaveURL(/\/profile/);

    await page.goto("/counselor/students");
    await expect(page).toHaveURL(/\/profile$/);

    await page.goto(
      "/counselor/students/00000000-0000-0000-0000-000000000000",
    );
    await expect(page).toHaveURL(/\/profile$/);
  });
});

test.describe("counselor roster separation", () => {
  test.skip(!e2eEnabled, "E2E tests disabled. Set E2E_ENABLED=true and start services.");

  test("roster sections render separately for a counselor", async ({ page }) => {
    const username = `e2e_counselor_${Date.now()}`;
    const stdout = execFileSync(
      "pnpm",
      ["exec", "tsx", "scripts/create-user.ts", username, "--role", "counselor"],
      { cwd: process.cwd(), encoding: "utf8" },
    );
    const password = stdout.trim().split("\n").pop() ?? "";
    expect(password.length).toBeGreaterThan(0);

    await page.context().clearCookies();
    await page.goto("/login");
    await page.getByTestId(TEST_IDS.FORM.INPUT("username")).fill(username);
    await page.getByTestId(TEST_IDS.FORM.INPUT("password")).fill(password);
    await page.getByTestId(TEST_IDS.FORM.SUBMIT("login")).click();
    await expect(page).toHaveURL(/\/profile$/);

    await page.goto("/counselor/students");
    await expect(page.getByTestId(TEST_IDS.ROSTER.UNASSIGNED_SECTION)).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.ROSTER.TABLE)).toBeVisible();
    await expect(page.getByRole("heading", { name: "بدون گروه" })).toBeVisible();
  });
});

test.describe("admin panel access control", () => {
  test.skip(!e2eEnabled, "E2E tests disabled. Set E2E_ENABLED=true and start services.");

  async function registerStudent(page: import("@playwright/test").Page) {
    const username = `e2e_admin_${Date.now()}`;
    const password = `e2e-pass-${Date.now()}`;
    await page.goto("/register");
    await page.getByTestId(TEST_IDS.FORM.INPUT("fullName")).fill("دانش‌آموز پنل");
    await page.getByTestId(TEST_IDS.FORM.INPUT("username")).fill(username);
    await page.getByTestId(TEST_IDS.FORM.INPUT("password")).fill(password);
    await page.getByTestId(TEST_IDS.FORM.SUBMIT("register")).click();
    await expect(page).toHaveURL(/\/profile/);
  }

  test("anonymous GET /admin/users redirects to /login", async ({ page }) => {
    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("student opening /admin/users lands on /profile", async ({ page }) => {
    await registerStudent(page);
    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/profile$/);
  });

  test("operator sees the users table without the role control", async ({ page }) => {
    // Provision a fresh operator with a known password, then log in through the UI.
    const username = `e2e_operator_${Date.now()}`;
    const stdout = execFileSync(
      "pnpm",
      ["exec", "tsx", "scripts/create-user.ts", username, "--role", "operator"],
      { cwd: process.cwd(), encoding: "utf8" },
    );
    const password = stdout.trim().split("\n").pop() ?? "";
    expect(password.length).toBeGreaterThan(0);

    await page.context().clearCookies();
    await page.goto("/login");
    await page.getByTestId(TEST_IDS.FORM.INPUT("username")).fill(username);
    await page.getByTestId(TEST_IDS.FORM.INPUT("password")).fill(password);
    await page.getByTestId(TEST_IDS.FORM.SUBMIT("login")).click();
    await expect(page).toHaveURL(/\/profile$/);

    await page.goto("/admin/users");
    await expect(page.getByTestId(TEST_IDS.ADMIN.USERS_TABLE)).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.ADMIN.ROLE_SELECT)).toHaveCount(0);
  });
});

test.describe("role×feature gating", () => {
  test.skip(!e2eEnabled, "E2E tests disabled. Set E2E_ENABLED=true and start services.");

  const STUDENT_PAGES = ["/homework", "/schedule", "/nutrition", "/budget", "/leisure"];

  async function provisionAndLogin(
    page: import("@playwright/test").Page,
    role: "counselor" | "admin" | "operator",
  ) {
    const username = `e2e_${role}_${Date.now()}`;
    const stdout = execFileSync(
      "pnpm",
      ["exec", "tsx", "scripts/create-user.ts", username, "--role", role],
      { cwd: process.cwd(), encoding: "utf8" },
    );
    const password = stdout.trim().split("\n").pop() ?? "";
    expect(password.length).toBeGreaterThan(0);

    await page.context().clearCookies();
    await page.goto("/login");
    await page.getByTestId(TEST_IDS.FORM.INPUT("username")).fill(username);
    await page.getByTestId(TEST_IDS.FORM.INPUT("password")).fill(password);
    await page.getByTestId(TEST_IDS.FORM.SUBMIT("login")).click();
    await expect(page).toHaveURL(/\/profile$/);
    return username;
  }

  async function registerStudent(page: import("@playwright/test").Page) {
    const username = `e2e_student_${Date.now()}`;
    const password = `e2e-pass-${Date.now()}`;
    await page.goto("/register");
    await page.getByTestId(TEST_IDS.FORM.INPUT("fullName")).fill("دانش‌آموز گیت");
    await page.getByTestId(TEST_IDS.FORM.INPUT("username")).fill(username);
    await page.getByTestId(TEST_IDS.FORM.INPUT("password")).fill(password);
    await page.getByTestId(TEST_IDS.FORM.SUBMIT("register")).click();
    await expect(page).toHaveURL(/\/profile/);
    return username;
  }

  for (const role of ["counselor", "admin"] as const) {
    test(`student pages denied — ${role} direct nav lands on /profile`, async ({ page }) => {
      await provisionAndLogin(page, role);
      for (const path of STUDENT_PAGES) {
        await page.goto(path);
        await expect(page).toHaveURL(/\/profile$/);
      }
    });
  }

  test("student schedule readonly", async ({ page }) => {
    await registerStudent(page);
    await page.goto("/schedule");
    await expect(page.getByTestId(TEST_IDS.SCHEDULE.CREATE_FORM)).toHaveCount(0);
    await expect(
      page.getByTestId(TEST_IDS.SCHOOL_PROGRAM.OPEN_FORM),
    ).toBeVisible();
  });

  test("admin supervision of a student is read-only", async ({ page }) => {
    const studentUsername = await registerStudent(page);
    await provisionAndLogin(page, "admin");

    await page.goto(`/admin/users?q=${studentUsername}`);
    const link = page.locator('a[data-testid^="admin-users-supervise-"]').first();
    await expect(link).toBeVisible();
    await link.click();

    await expect(page).toHaveURL(/\/counselor\/students\//);
    await expect(page.getByTestId(TEST_IDS.SUPERVISION.READONLY)).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.SUPERVISION.HOMEWORK)).toBeVisible();
    await expect(
      page.getByTestId(TEST_IDS.SCHEDULE_EDITOR.CREATE_DAY(0)),
    ).toHaveCount(0);
    await expect(page.getByTestId(TEST_IDS.SUPERVISION.NUTRITION)).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.SUPERVISION.BUDGET)).toBeVisible();
  });
});
