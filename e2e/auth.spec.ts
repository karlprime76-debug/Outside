import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("login page has form fields", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
    await expect(page.locator("button[type='submit']")).toBeVisible();
  });

  test("register page has form fields", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator("input[name='name']")).toBeVisible();
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
  });
});
