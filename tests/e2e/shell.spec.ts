import { expect, test } from "@playwright/test";

const tabs = [
  { name: "Orders", path: "/orders" },
  { name: "Stock", path: "/stock" },
  { name: "Payments", path: "/payments" },
  { name: "More", path: "/more" },
];

test("home opens the Orders tab", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/orders$/);
  await expect(page.getByRole("heading", { level: 1, name: "Orders" })).toBeVisible();
});

test("the four bottom tabs navigate and show which one is open", async ({ page }) => {
  await page.goto("/orders");
  const nav = page.getByRole("navigation", { name: "Main menu" });
  await expect(nav.getByRole("link")).toHaveCount(4);

  for (const tab of tabs) {
    await nav.getByRole("link", { name: tab.name }).click();
    await expect(page).toHaveURL(new RegExp(`${tab.path}$`));
    await expect(page.getByRole("heading", { level: 1, name: tab.name })).toBeVisible();
    await expect(nav.getByRole("link", { name: tab.name })).toHaveAttribute("aria-current", "page");
  }
});

test("the app is in English, with no language switch", async ({ page }) => {
  await page.goto("/orders");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("group", { name: "Language" })).toHaveCount(0);
});

for (const path of ["/orders", "/stock", "/payments", "/more", "/more/design"]) {
  test(`${path}: every tap target is at least 48px and nothing scrolls sideways`, async ({
    page,
  }) => {
    await page.goto(path);
    const targets = page.locator("a:visible, button:visible, input:not([type=hidden]):visible");
    const count = await targets.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const target = targets.nth(i);
      const box = await target.boundingBox();
      const label = (await target.getAttribute("aria-label")) ?? (await target.innerText());
      expect(box?.height, `"${label.trim()}" on ${path}`).toBeGreaterThanOrEqual(48);
      expect(box?.width, `"${label.trim()}" on ${path}`).toBeGreaterThanOrEqual(48);
    }
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  });
}

test("Undo puts a change back", async ({ page }) => {
  await page.goto("/more/design");
  await page.getByRole("button", { name: "Mark as packed" }).click();
  const toast = page.getByRole("status");
  await expect(toast).toContainText("Order marked as packed");
  await expect(page.getByRole("button", { name: "Mark as packed" })).toBeDisabled();
  await toast.getByRole("button", { name: "Undo" }).click();
  await expect(toast).toBeEmpty();
  await expect(page.getByRole("button", { name: "Mark as packed" })).toBeEnabled();
});

test("toast disappears on its own", async ({ page }) => {
  await page.goto("/more/design");
  await page.getByRole("button", { name: "Mark as packed" }).click();
  await expect(page.getByRole("status")).toContainText("Order marked as packed");
  await expect(page.getByRole("status")).toBeEmpty({ timeout: 8000 });
  await expect(page.getByRole("button", { name: "Mark as packed" })).toBeDisabled();
});

test("bottom sheet opens and closes with the X or by tapping outside", async ({ page }) => {
  await page.goto("/more/design");
  const open = page.getByRole("button", { name: "Open a sheet" });
  const sheet = page.getByRole("dialog", { name: "Choose a customer" });

  await open.click();
  await expect(sheet).toBeVisible();
  await sheet.getByRole("button", { name: "Close" }).click();
  await expect(sheet).toBeHidden();

  await open.click();
  await expect(sheet).toBeVisible();
  await page.mouse.click(180, 20); // the dimmed area above the sheet
  await expect(sheet).toBeHidden();
});

test("phone input explains a wrong number in plain words", async ({ page }) => {
  await page.goto("/more/design");
  const input = page.getByLabel("Phone number");
  await input.fill("07123");
  await input.blur();
  await expect(page.getByText("Check the number.")).toBeVisible();
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await input.fill("0712 345 678");
  await expect(page.getByText("For example 0712 345 678")).toBeVisible();
  await expect(page.locator('input[type=hidden][name="phone"]')).toHaveValue("+254712345678");
});

test.describe("screenshots", () => {
  test.skip(process.platform !== "linux", "Screenshot baselines are recorded on Linux");

  test("orders shell", async ({ page }) => {
    await page.goto("/orders");
    await expect(page).toHaveScreenshot("orders.png");
  });

  test("design preview", async ({ page }) => {
    await page.goto("/more/design");
    await expect(page).toHaveScreenshot("design.png", { fullPage: true });
  });
});
