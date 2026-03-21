import { test, expect } from "@playwright/test";

test.describe("Login flow", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/login/);
  });

  test("shows login page with email and password fields", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel(/email|אימייל/i)).toBeVisible();
    await expect(page.getByLabel(/password|סיסמה/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in|כניסה/i })).toBeVisible();
  });

  test("logs in with valid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email|אימייל/i).fill("owner@studio.local");
    await page.getByLabel(/password|סיסמה/i).fill("changeme123");
    await page.getByRole("button", { name: /sign in|כניסה/i }).click();

    // Should land on dashboard after successful login
    await expect(page).toHaveURL(/dashboard/);
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email|אימייל/i).fill("wrong@example.com");
    await page.getByLabel(/password|סיסמה/i).fill("wrongpassword");
    await page.getByRole("button", { name: /sign in|כניסה/i }).click();

    // Should stay on login page and show an error
    await expect(page).toHaveURL(/login/);
    await expect(page.getByRole("alert").or(page.locator("[data-error]"))).toBeVisible({ timeout: 5000 }).catch(() => {
      // Error might be shown inline without alert role
      return expect(page.getByText(/invalid|שגוי|error|שגיאה/i)).toBeVisible({ timeout: 5000 });
    });
  });
});
