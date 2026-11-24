import { expect, test } from "@playwright/test";
import { DEMO, logIn, rpc, toE164 } from "./helpers";

type Catalog = {
  supplier: { name: string; slug: string };
  products: { name: string; unit: string; price_kes: number }[];
  payment_methods: { type: string; details: Record<string, string> }[];
  delivery_windows: { weekday: number; start_time: string; cutoff_hours_before: number }[];
} | null;

test.use({ storageState: { cookies: [], origins: [] } });
test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  // Start from a clean slate (dev project only, test numbers only).
  await rpc("dev_reset_test_user", { p_phone: toE164(DEMO.wizard.phone) });
  await rpc("dev_reset_test_user", { p_phone: toE164(DEMO.skipper.phone) });
});

test("a new owner sets up their business in 5 steps", async ({ page }) => {
  const name = `Kamau Fresh ${Date.now() % 100000}`;
  await logIn(page, DEMO.wizard.phone);
  await expect(page).toHaveURL(/\/welcome$/);

  // 1. Name → order link preview
  await expect(page.getByText("Step 1 of 5")).toBeVisible();
  await page.getByLabel("Business name").fill(name);
  await expect(page.getByText(`/s/${name.toLowerCase().replace(/ /g, "-")}`)).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();

  // 2. Type
  await expect(page).toHaveURL(/\/setup\/type$/);
  await page.getByRole("radio", { name: "Fruit and vegetables" }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  // 3. Payment methods (cash is on by default)
  await expect(page).toHaveURL(/\/setup\/payments$/);
  await page.getByRole("checkbox", { name: "M-Pesa Till (Buy Goods)" }).click();
  await page.getByLabel("Till number").fill("12");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Check the number.")).toBeVisible(); // stays on the step
  await page.getByLabel("Till number").fill("522 533");
  await page.getByRole("button", { name: "Continue" }).click();

  // 4. Delivery: drop Saturday, afternoons, order by noon the day before
  await expect(page).toHaveURL(/\/setup\/delivery$/);
  await page.getByRole("checkbox", { name: "Sat" }).click();
  await page.getByRole("radio", { name: /14:00–18:00/ }).click();
  await page.getByRole("radio", { name: "12 noon the day before" }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  // 5. First products
  await expect(page).toHaveURL(/\/setup\/products$/);
  await page.getByLabel("Product name").first().fill("Tomatoes");
  await page.getByLabel("Sold by").first().selectOption("crate");
  await page.getByLabel("Price in Ksh").first().fill("3,200");
  await page.getByLabel("Product name").nth(1).fill("Sukuma wiki");
  await page.getByLabel("Sold by").nth(1).selectOption("bunch");
  await page.getByLabel("Price in Ksh").nth(1).fill("30");
  await page.getByRole("button", { name: "Finish" }).click();

  // Done: the owner is in the app…
  await expect(page).toHaveURL(/\/orders$/);
  await page.goto("/more");
  await expect(page.getByText(`Owner · ${name}`)).toBeVisible();

  // …and customers will see exactly what was set up.
  const slug = name.toLowerCase().replace(/ /g, "-");
  const catalog = await rpc<Catalog>("get_public_catalog", { p_slug: slug });
  expect(catalog?.supplier.name).toBe(name);
  expect(catalog?.products.map((p) => [p.name, p.unit, Number(p.price_kes)])).toEqual([
    ["Tomatoes", "crate", 3200],
    ["Sukuma wiki", "bunch", 30],
  ]);
  expect(catalog?.payment_methods.map((m) => m.type)).toEqual(["mpesa_till", "cash"]);
  expect(catalog?.payment_methods[0].details.till_number).toBe("522533");
  const windows = catalog?.delivery_windows ?? [];
  expect(windows.map((w) => w.weekday).sort()).toEqual([1, 2, 3, 4, 5]);
  expect(windows.every((w) => w.start_time === "14:00:00" && w.cutoff_hours_before === 26)).toBe(
    true,
  );
});

test("every step after the name can be skipped", async ({ page }) => {
  await logIn(page, DEMO.skipper.phone);
  await page.getByLabel("Business name").fill("Skip Test Traders");
  await page.getByRole("button", { name: "Continue" }).click();
  for (const step of ["type", "payments", "delivery", "products"]) {
    await expect(page).toHaveURL(new RegExp(`/setup/${step}$`));
    await page.getByRole("link", { name: "Skip for now" }).click();
  }
  await expect(page).toHaveURL(/\/orders$/);
});

test("an invited staff member joins on first login, and cannot open set-up", async ({ page }) => {
  await logIn(page, DEMO.invited.phone);
  await expect(page).toHaveURL(/\/orders$/); // not /welcome: the invite made them staff
  await page.goto("/more");
  await expect(page.getByText("Staff · Mama Mboga Wholesale")).toBeVisible();
  await page.goto("/setup/payments");
  await expect(page).toHaveURL(/\/orders$/);
});
