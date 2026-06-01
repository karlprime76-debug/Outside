import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("loads with hero and CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/OUTSIDE/);
    await expect(page.locator("text=Le monde est dehors")).toBeVisible();
    await expect(page.locator("text=Créer un plan")).toBeVisible();
  });

  test("has working navigation to login", async ({ page }) => {
    await page.goto("/");
    await page.click("text=Se connecter");
    await expect(page).toHaveURL(/login/);
  });
});
