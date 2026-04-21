import { test, expect } from "@playwright/test";
import { waitForTestsComplete } from "./helpers";

// ── Layout ─────────────────────────────────────────────────────────────────────

test.describe("Dev mode — app layout", () => {
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

test.describe("Dev mode — detail view", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForTestsComplete(page);
  });

  test("sidebar shows test suites from the example app", async ({ page }) => {
    // Button is visible near the top of the virtual list
    await expect(page.getByText("Button").first()).toBeVisible();
    // Stats badge confirms some tests passed (Counter and other suites are present
    // but may be below the fold in the virtual scroll list)
    await expect(page.locator("text=✓").first()).toBeVisible();
  });

  test("stats card shows pass count after tests complete", async ({ page }) => {
    // The stats card renders "✓ N" (green badge) once tests pass
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

  test("sidebar search filters visible suites and tests", async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search tests…"]');
    // Filter to the Button suite's first test
    await searchInput.fill("renders the label");
    await expect(page.getByText("renders the label").first()).toBeVisible();
    // Clear the filter — Button should reappear near the top
    await searchInput.fill("");
    await expect(page.getByText("Button").first()).toBeVisible();
  });

  test("run-all button re-runs all tests", async ({ page }) => {
    await page.getByTitle("Run all").click();
    // Progress toast should reappear for the second run
    await expect(page.locator("text=Running tests")).toBeVisible({ timeout: 15_000 });
    // Wait for it to finish again
    await page.locator("text=Running tests").waitFor({ state: "hidden", timeout: 90_000 });
  });
});

// ── Gallery view ───────────────────────────────────────────────────────────────
// Gallery only shows tests that produced visual snapshots (via render()).
// We run tests first from the detail view so React state is populated,
// then navigate to gallery within React to preserve that state.

test.describe("Dev mode — gallery view", () => {
  test.beforeEach(async ({ page }) => {
    // Run tests from the detail view (Run all button is in the sidebar)
    await page.goto("/");
    await waitForTestsComplete(page);
    // Navigate to gallery within React (preserves test state)
    await page.getByTitle("Gallery view").click();
    await expect(page).toHaveURL(/#\/gallery/);
  });

  test("displays test cards with suite and test names", async ({ page }) => {
    // Button suite has render() calls so its tests produce visual cards
    await expect(page.getByText("Button").first()).toBeVisible();
    await expect(page.getByText("renders the label").first()).toBeVisible();
  });

  test("cards show pass or fail status after tests complete", async ({ page }) => {
    // Each card's preview area renders ✓ (green) once the test has passed
    await expect(page.locator("text=✓").first()).toBeVisible();
  });

  test("search input filters the displayed cards", async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search tests…"]');
    // Use pressSequentially so real keyboard events fire React's onChange handler.
    // fill() can bypass React's synthetic event system on controlled inputs in
    // React 18 concurrent mode, causing the value to be reset by reconciliation.
    await searchInput.click();
    await searchInput.pressSequentially("renders the label", { delay: 30 });
    await expect(searchInput).toHaveValue("renders the label");
    // The matching card must be visible in the filtered gallery
    await expect(page.getByText("renders the label").first()).toBeVisible();
    // The first suite shown before filtering (App — smoke) should be gone
    await expect(page.locator("text=APP — SMOKE")).not.toBeVisible();
  });

  test("clicking a card navigates to the test detail view", async ({ page }) => {
    // Find the card for "renders the label" and click it
    const card = page.locator("button").filter({ hasText: "renders the label" }).first();
    await card.click();
    await expect(page).toHaveURL(/#\/suite\/Button\/test\//);
  });
});

// ── Navigation ─────────────────────────────────────────────────────────────────

test.describe("Dev mode — view navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Only need sandbox ready for navigation tests — no full run required
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

  test("navigating to a test URL directly loads the detail view", async ({ page }) => {
    await page.goto("/#/suite/Button/test/renders%20the%20label");
    await expect(page).toHaveURL(/#\/suite\/Button\/test\//);
    await expect(page.locator("text=Roadtest").first()).toBeVisible();
  });
});
