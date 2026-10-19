import { expect, test } from "@playwright/test";

const signInAsCaptain = async (page: import("@playwright/test").Page) => {
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
};

test("captain can sign in, open the dashboard, and sign out", async ({ page }) => {
  await signInAsCaptain(page);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  await page.getByText("E2E Captain", { exact: true }).click();
  await page.getByRole("button", { name: "Sign out" }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();
});

test("captain can view child records but cannot modify them", async ({ page }) => {
  await signInAsCaptain(page);

  await page.getByRole("button", { name: "Daycare Records" }).click();
  await expect(page).toHaveURL(/\/monitoring\/records$/);
  await expect(
    page.getByText("Read-only child records for Bonuan Sabangan"),
  ).toBeVisible();

  await page.getByPlaceholder("Search children...").fill("ReadOnly");
  const childRow = page.locator("tbody tr").filter({ hasText: "R******" });
  await expect(childRow).toHaveCount(1);
  await expect(childRow.getByRole("button", { name: "View" })).toBeVisible();
  await expect(childRow.getByRole("button", { name: "Edit" })).toHaveCount(0);
  await expect(childRow.getByTitle("More actions")).toHaveCount(0);

  await childRow.getByRole("button", { name: "View" }).click();
  await expect(page.getByRole("heading", { name: "Child details" })).toBeVisible();
  await expect(page.getByText("2026-2027", { exact: true })).toBeVisible();

  const mutationStatus = await page.evaluate(async () => {
    const childrenResponse = await fetch("http://127.0.0.1:5011/api/children", {
      credentials: "include",
    });
    const children = (await childrenResponse.json()) as Array<{ _id: string }>;
    const response = await fetch(
      `http://127.0.0.1:5011/api/children/${children[0]._id}`,
      {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: "Forbidden update" }),
      },
    );
    return response.status;
  });

  expect(mutationStatus).toBe(403);
});
