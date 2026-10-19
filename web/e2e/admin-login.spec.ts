import { expect, test } from "@playwright/test";

test("captain can sign in, open the dashboard, and sign out", async ({ page }) => {
  const username = process.env.E2E_CAPTAIN_USERNAME;
  const password = process.env.E2E_CAPTAIN_PASSWORD;
  if (!username || !password) {
    throw new Error("Playwright E2E credentials were not initialized.");
  }

  await page.goto("/login");

  await page
    .getByPlaceholder("Enter your username or email")
    .fill(username);
  await page.getByPlaceholder("Enter your password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();

  await expect(page).toHaveURL(/\/monitoring\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  await page.getByText("E2E Captain", { exact: true }).click();
  await page.getByRole("button", { name: "Sign out" }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();
});
