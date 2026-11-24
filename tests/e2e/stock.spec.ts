import { expect, test, type Page } from "@playwright/test";
import { useEnglish } from "./helpers";

// Changes the demo supplier's Cabbage and puts it back; run one at a time.
test.describe.configure({ mode: "serial" });
test.use({ serviceWorkers: "allow" });

test.beforeEach(async ({ page }) => {
  await useEnglish(page);
});

const row = (page: Page, name: string) => page.getByRole("listitem").filter({ hasText: name });
const statusButton = (page: Page, name: string) =>
  page.getByRole("button", { name: new RegExp(`^${name}: .*Tap to change`) });

async function setCabbageInStock(page: Page) {
  for (let i = 0; i < 3; i++) {
    const label = await statusButton(page, "Cabbage").getAttribute("aria-label");
    if (label?.includes("In stock")) return;
    await statusButton(page, "Cabbage").click();
    await page.waitForTimeout(300);
  }
}

test("products are grouped by category, with search and counts", async ({ page }) => {
  await page.goto("/stock");
  for (const heading of ["Vegetables", "Fruit", "Dry goods"]) {
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }
  await expect(page.getByText(/^15 products · \d+ low · \d+ out/)).toBeVisible();
  await expect(statusButton(page, "Spinach")).toHaveAccessibleName(/Out/);

  // Search finds English or Swahili names.
  await page.getByRole("searchbox", { name: "Search products" }).fill("nyan");
  await expect(row(page, "Tomatoes")).toBeVisible();
  await expect(page.getByRole("region").getByRole("listitem")).toHaveCount(1);
  await page.getByRole("searchbox", { name: "Search products" }).fill("zzz");
  await expect(page.getByText('Nothing matches "zzz".')).toBeVisible();
});

test("one tap changes the stock status, and it is saved", async ({ page }) => {
  await page.goto("/stock");
  await setCabbageInStock(page);
  await statusButton(page, "Cabbage").click();
  await expect(statusButton(page, "Cabbage")).toHaveAccessibleName(/Cabbage: Low/);
  await expect(page.getByRole("status").filter({ hasText: "Cabbage: Low" })).toBeVisible();

  await page.reload();
  await expect(statusButton(page, "Cabbage")).toHaveAccessibleName(/Cabbage: Low/);
  await setCabbageInStock(page);
  await page.reload();
  await expect(statusButton(page, "Cabbage")).toHaveAccessibleName(/Cabbage: In stock/);
});

test("a price changes in two taps, and Undo puts it back", async ({ page }) => {
  await page.goto("/stock");
  await page.getByRole("button", { name: "Change price of Cabbage" }).click(); // tap 1
  const sheet = page.getByRole("dialog", { name: "Cabbage" });
  await expect(sheet.getByLabel("Price per piece")).toHaveValue("60");
  await sheet.getByLabel("Price per piece").fill("75");
  await sheet.getByRole("button", { name: "Save price" }).click(); // tap 2
  await expect(row(page, "Cabbage")).toContainText("Ksh 75");

  await page.reload();
  await expect(row(page, "Cabbage")).toContainText("Ksh 75");

  // Undo from a fresh change: set 80, then undo back to 75, then restore 60.
  await page.getByRole("button", { name: "Change price of Cabbage" }).click();
  await sheet.getByLabel("Price per piece").fill("80");
  await sheet.getByRole("button", { name: "Save price" }).click();
  await page.getByRole("status").getByRole("button", { name: "Undo" }).click();
  await expect(row(page, "Cabbage")).toContainText("Ksh 75");

  await page.getByRole("button", { name: "Change price of Cabbage" }).click();
  await sheet.getByLabel("Price per piece").fill("60");
  await sheet.getByRole("button", { name: "Save price" }).click();
  await page.reload();
  await expect(row(page, "Cabbage")).toContainText("Ksh 60");
});

test("a bad price is explained", async ({ page }) => {
  await page.goto("/stock");
  await page.getByRole("button", { name: "Change price of Cabbage" }).click();
  const sheet = page.getByRole("dialog", { name: "Cabbage" });
  await sheet.getByLabel("Price per piece").fill("abc");
  await sheet.getByRole("button", { name: "Save price" }).click();
  await expect(sheet.getByRole("alert")).toHaveText("Type a price like 2500 or 2,500.");
});

test("offline changes are kept on the phone and sent when back online", async ({
  page,
  context,
}) => {
  await page.goto("/stock");
  await setCabbageInStock(page);
  // Wait for the offline helper, then load again so this page is saved for offline use.
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker?.controller != null, null, {
    timeout: 20_000,
  });
  await page.waitForTimeout(1000);

  await context.setOffline(true);
  await statusButton(page, "Cabbage").click();
  await expect(page.getByRole("status").filter({ hasText: "Saved on this phone" })).toBeVisible();
  await expect(row(page, "Cabbage")).toContainText("Not sent yet");

  // Even after closing and reopening the app offline, the change is still there.
  await page.reload();
  await expect(statusButton(page, "Cabbage")).toHaveAccessibleName(/Cabbage: Low/);
  await expect(page.getByText(/1 waiting to send/)).toBeVisible();

  await context.setOffline(false);
  await expect(page.getByRole("status").filter({ hasText: "1 change sent" })).toBeVisible({
    timeout: 15_000,
  });
  await page.reload();
  await expect(statusButton(page, "Cabbage")).toHaveAccessibleName(/Cabbage: Low/);
  await expect(row(page, "Cabbage")).not.toContainText("Not sent yet");

  await setCabbageInStock(page);
});
