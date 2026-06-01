import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("header navigation links work", async ({ page }) => {
    await page.goto("/");
    await page.click("text=Se connecter");
    await expect(page).toHaveURL(/login/);
  });

  test("mobile bottom nav is visible", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await expect(page.locator("nav").last()).toBeVisible();
  });
});
