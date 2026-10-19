import { expect, test } from "@playwright/test";

test("captain can sign in, open the dashboard, and sign out", async ({ page }) => {
  await page.goto("/login");

  await page
    .getByPlaceholder("Enter your username or email")
    .fill("e2e.captain");
  await page.getByPlaceholder("Enter your password").fill("E2eCaptain123!");
  await page.getByRole("button", { name: "Sign In" }).click();

  await expect(page).toHaveURL(/\/monitoring\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  await page.getByText("E2E Captain", { exact: true }).click();
  await page.getByRole("button", { name: "Sign out" }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();
});
