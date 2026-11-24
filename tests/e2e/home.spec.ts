import { expect, test } from "@playwright/test";

test("home page switches between English and Swahili", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Welcome" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");

  await page.getByRole("button", { name: "Kiswahili" }).click();
  await expect(page.getByRole("heading", { name: "Karibu" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "sw");

  // The choice is remembered.
  await page.reload();
  await expect(page.getByRole("heading", { name: "Karibu" })).toBeVisible();

  await page.getByRole("button", { name: "English" }).click();
  await expect(page.getByRole("heading", { name: "Welcome" })).toBeVisible();
});

test("language buttons are big enough to tap", async ({ page }) => {
  await page.goto("/");
  for (const name of ["English", "Kiswahili"]) {
    const box = await page.getByRole("button", { name }).boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(48);
  }
});
