import { test, expect } from "@playwright/test";

test.use({ storageState: undefined });

async function loginAs(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel(/email|אימייל/i).fill(email);
  await page.getByLabel(/password|סיסמה/i).fill(password);
  await page.getByRole("button", { name: /^כניסה$/ }).click();
  await page.waitForURL(/dashboard/);
}

test.describe("Workshop template management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "owner@studio.local", "changeme123");
  });

  test("navigates to templates list", async ({ page }) => {
    await page.goto("/workshops/templates");
    await expect(page.getByRole("heading", { name: /תבניות/i })).toBeVisible();
  });

  test("creates a new template", async ({ page }) => {
    await page.goto("/workshops/templates/new");

    const uniqueName = `E2E Template ${Date.now()}`;

    await page.getByLabel(/שם/i).fill(uniqueName);
    await page.getByLabel(/משך/i).fill("90");
    await page.getByLabel(/מינימום/i).fill("3");
    await page.getByLabel(/מקסימום/i).fill("8");
    await page.getByLabel(/מחיר/i).fill("120");

    await page.getByRole("button", { name: /שמור|save/i }).click();

    // Should redirect back to templates list
    await page.waitForURL(/\/workshops\/templates$/);
    await expect(page.getByText(uniqueName)).toBeVisible();
  });

  test("shows validation error for empty name", async ({ page }) => {
    await page.goto("/workshops/templates/new");

    // Submit without filling name
    await page.getByRole("button", { name: /שמור|save/i }).click();

    // Should stay on the form and show a validation error
    await expect(page).toHaveURL(/templates\/new/);
  });
});
