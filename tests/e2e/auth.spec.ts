import { expect, test } from "@playwright/test";
import { DEMO, logIn, requestCode, useEnglish } from "./helpers";

// Supabase allows one code per number per minute, so each test uses its own demo number
// and the owner's login comes from auth.setup.ts.

test.describe("signed out", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await useEnglish(page);
  });

  test("visitors are sent to log in, then back where they were going", async ({ page }) => {
    await page.goto("/stock");
    await expect(page).toHaveURL(/\/login\?next=%2Fstock$/);
    await expect(page.getByRole("heading", { level: 1, name: "Log in" })).toBeVisible();

    await logIn(page, DEMO.manager.phone, { goto: false });
    await expect(page).toHaveURL(/\/stock$/);
    await page.goto("/more");
    await expect(page.getByText("Manager · Mama Mboga Wholesale")).toBeVisible();
  });

  test("login screen works in Swahili", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Kiswahili" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Ingia" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Tuma nambari kwa WhatsApp" })).toBeVisible();
  });

  test("a wrong phone number is explained before anything is sent", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Phone number").fill("0712");
    await page.getByRole("button", { name: "Send code on WhatsApp" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Check the number" })).toBeVisible();
  });

  test("a wrong code is explained; the right one logs staff in with their own role", async ({
    page,
  }) => {
    const code = await requestCode(page, DEMO.staff.phone);
    const wrong = code === "000000" ? "111111" : "000000";
    await page.getByLabel("6-digit code").fill(wrong);
    await expect(
      page.getByRole("alert").filter({ hasText: "That code is wrong or has expired" }),
    ).toBeVisible();

    await page.getByLabel("6-digit code").fill(code);
    await expect(page).toHaveURL(/\/orders$/);
    await page.goto("/more");
    await expect(page.getByText("Staff · Mama Mboga Wholesale")).toBeVisible();
  });

  test("a number with no business sees the welcome screen; logging out clears saved pages", async ({
    page,
  }) => {
    await logIn(page, DEMO.newcomer.phone);
    await expect(page).toHaveURL(/\/welcome$/);
    await expect(page.getByRole("heading", { name: "Set up your business" })).toBeVisible();
    // The tabs are not available without a business.
    await page.goto("/orders");
    await expect(page).toHaveURL(/\/welcome$/);

    // Something saved for offline use, as the service worker would.
    await page.evaluate(async () => {
      const cache = await caches.open("pages");
      await cache.put("/welcome", new Response("saved"));
    });
    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/login$/);
    // The private page is gone from every cache (the login page itself may be saved again).
    const stillSaved = await page.evaluate(async () => {
      for (const name of await caches.keys()) {
        if (await (await caches.open(name)).match("/welcome")) return true;
      }
      return false;
    });
    expect(stillSaved).toBe(false);

    await page.goto("/orders");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("signed in as the owner", () => {
  test("More shows who is logged in and their business", async ({ page }) => {
    await page.goto("/more");
    await expect(page.getByText(DEMO.owner.name)).toBeVisible();
    await expect(page.getByText("Owner · Mama Mboga Wholesale")).toBeVisible();
  });

  test("the login page is skipped when already logged in", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/orders$/);
  });
});
