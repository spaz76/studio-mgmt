import { test, expect } from "@playwright/test";

async function loginAs(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel(/email|אימייל/i).fill(email);
  await page.getByLabel(/password|סיסמה/i).fill(password);
  await page.getByRole("button", { name: /sign in|כניסה/i }).click();
  await page.waitForURL(/dashboard/);
}

test.describe("Workshop event + booking flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "owner@studio.local", "changeme123");
  });

  test("creates a workshop event from the new event page", async ({ page }) => {
    await page.goto("/workshops/new");

    const uniqueTitle = `E2E Event ${Date.now()}`;

    await page.getByLabel(/כותרת/i).fill(uniqueTitle);

    // Fill dates using datetime-local inputs
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    const dateStr = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T10:00`;
    const endStr = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T12:00`;

    await page.locator('input[name="startsAt"]').fill(dateStr);
    await page.locator('input[name="endsAt"]').fill(endStr);
    await page.locator('input[name="minParticipants"]').fill("2");
    await page.locator('input[name="maxParticipants"]').fill("8");
    await page.locator('input[name="price"]').fill("150");

    await page.getByRole("button", { name: /שמור|save/i }).click();

    // After saving, redirected to the event detail page
    await page.waitForURL(/\/workshops\/[^/]+$/);
    await expect(page.getByText(uniqueTitle)).toBeVisible();
  });

  test("shows workshops list page", async ({ page }) => {
    await page.goto("/workshops");
    await expect(page.getByRole("heading", { name: /סדנאות/i })).toBeVisible();
    // Should show either events or the empty state with a create button
    const hasEvents = await page.getByRole("link", { name: /סדנה חדשה|New/i }).isVisible();
    expect(hasEvents).toBe(true);
  });

  test("navigates to booking creation from event page", async ({ page }) => {
    // Go to workshops list and find an event
    await page.goto("/workshops");

    const eventLinks = page.getByRole("link").filter({ hasText: /סדנה|workshop|event/i });
    const count = await eventLinks.count();

    if (count === 0) {
      test.skip();
      return;
    }

    // Click first event card
    await eventLinks.first().click();
    await page.waitForURL(/\/workshops\/[^/]+$/);

    // Look for the add booking button
    const addBookingBtn = page.getByRole("link", { name: /הוסף הזמנה|add booking|הזמן/i });
    await expect(addBookingBtn).toBeVisible({ timeout: 5000 });
  });
});
