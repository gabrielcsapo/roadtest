/**
 * Build-mode e2e tests.
 *
 * These run against the static output produced by `roadtest --build`.
 * The static site is served by apps/e2e/serve-build.mjs which builds the
 * example app first and then starts a plain HTTP server on port 4173.
 *
 * The static bundle still runs tests in the browser on load — there is no
 * pre-baked result set — so the same waitForTestsComplete helper is used.
 * Tests must be triggered manually via "Run all" just like in dev mode.
 */
import { test, expect } from "@playwright/test";
import { waitForTestsComplete } from "./helpers";

// ── Layout ─────────────────────────────────────────────────────────────────────

test.describe("Build mode — app layout", () => {
  test("shows the Roadtest header", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Roadtest").first()).toBeVisible();
  });

  test("shows all four view-toggle buttons", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTitle("Detail view")).toBeVisible();
    await expect(page.getByTitle("Gallery view")).toBeVisible();
    await expect(page.getByTitle("Coverage explorer")).toBeVisible();
    await expect(page.getByTitle("Graph view")).toBeVisible();
  });
});

// ── Detail view ────────────────────────────────────────────────────────────────

test.describe("Build mode — detail view", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForTestsComplete(page);
  });

  test("sidebar shows test suites from the example app", async ({ page }) => {
    await expect(page.getByText("Button").first()).toBeVisible();
    // Stats badge confirms some tests passed
    await expect(page.locator("text=✓").first()).toBeVisible();
  });

  test("stats card shows pass count after tests complete", async ({ page }) => {
    await expect(page.locator("text=✓").first()).toBeVisible();
  });

  test("clicking a suite name navigates to the suite overview", async ({ page }) => {
    await page.getByText("Button").first().click();
    await expect(page).toHaveURL(/#\/suite\/Button/);
  });

  test("clicking a test name navigates to the test detail", async ({ page }) => {
    const testRow = page.getByText("renders the label").first();
    await expect(testRow).toBeVisible();
    await testRow.click();
    await expect(page).toHaveURL(/#\/suite\/Button\/test\//);
  });
});

// ── Gallery view ───────────────────────────────────────────────────────────────

test.describe("Build mode — gallery view", () => {
  test.beforeEach(async ({ page }) => {
    // Run tests from detail view first, then navigate to gallery within React
    await page.goto("/");
    await waitForTestsComplete(page);
    await page.getByTitle("Gallery view").click();
    await expect(page).toHaveURL(/#\/gallery/);
  });

  test("displays test cards with suite and test names", async ({ page }) => {
    await expect(page.getByText("Button").first()).toBeVisible();
    await expect(page.getByText("renders the label").first()).toBeVisible();
  });

  test("cards show pass or fail status after tests complete", async ({ page }) => {
    await expect(page.locator("text=✓").first()).toBeVisible();
  });

  test("search input filters the displayed cards", async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search tests…"]');
    await searchInput.click();
    await searchInput.pressSequentially("renders the label", { delay: 30 });
    await expect(searchInput).toHaveValue("renders the label");
    await expect(page.getByText("renders the label").first()).toBeVisible();
    await expect(page.locator("text=APP — SMOKE")).not.toBeVisible();
  });

  test("clicking a card navigates to the test detail view", async ({ page }) => {
    const card = page.locator("button").filter({ hasText: "renders the label" }).first();
    await card.click();
    await expect(page).toHaveURL(/#\/suite\/Button\/test\//);
  });
});

// ── Navigation ─────────────────────────────────────────────────────────────────

test.describe("Build mode — view navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.locator("text=Loading test sandbox").waitFor({
      state: "hidden",
      timeout: 30_000,
    });
  });

  test("Gallery view button updates the URL", async ({ page }) => {
    await page.getByTitle("Gallery view").click();
    await expect(page).toHaveURL(/#\/gallery/);
  });

  test("Coverage explorer button updates the URL", async ({ page }) => {
    await page.getByTitle("Coverage explorer").click();
    await expect(page).toHaveURL(/#\/coverage/);
  });

  test("Graph view button updates the URL", async ({ page }) => {
    await page.getByTitle("Graph view").click();
    await expect(page).toHaveURL(/#\/graph/);
  });

  test("Detail view button navigates back from gallery", async ({ page }) => {
    await page.getByTitle("Gallery view").click();
    await expect(page).toHaveURL(/#\/gallery/);
    await page.getByTitle("Detail view").click();
    await expect(page).not.toHaveURL(/#\/gallery/);
  });
});
