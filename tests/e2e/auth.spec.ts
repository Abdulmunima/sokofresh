import { expect, test } from "@playwright/test";
import { DEMO, logIn, useEnglish } from "./helpers";

// These tests start signed out.
test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await useEnglish(page);
});

test("signed-out visitors are sent to log in, then back where they were going", async ({
  page,
}) => {
  await page.goto("/stock");
  await expect(page).toHaveURL(/\/login\?next=%2Fstock$/);
  await expect(page.getByRole("heading", { level: 1, name: "Log in" })).toBeVisible();

  await logIn(page, DEMO.owner.phone);
  await expect(page).toHaveURL(/\/stock$/);
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

test("the owner logs in with the WhatsApp code and sees their business", async ({ page }) => {
  await logIn(page, DEMO.owner.phone);
  await expect(page).toHaveURL(/\/orders$/);
  await page.getByRole("link", { name: "More" }).click();
  await expect(page.getByText(DEMO.owner.name)).toBeVisible();
  await expect(page.getByText("Owner · Mama Mboga Wholesale")).toBeVisible();
});

test("a wrong code shows a clear message and lets you try again", async ({ page }) => {
  await logIn(page, DEMO.manager.phone, "000000");
  await expect(page.getByRole("alert").filter({ hasText: "That code is not right" })).toBeVisible();
  await page.getByLabel("6-digit code").fill("123456");
  await expect(page).toHaveURL(/\/orders$/);
});

test("staff log in to the same business with their own role", async ({ page }) => {
  await logIn(page, DEMO.staff.phone);
  await expect(page).toHaveURL(/\/orders$/);
  await page.goto("/more");
  await expect(page.getByText("Staff · Mama Mboga Wholesale")).toBeVisible();
});

test("a number with no business lands on the welcome screen", async ({ page }) => {
  await logIn(page, DEMO.newcomer.phone);
  await expect(page).toHaveURL(/\/welcome$/);
  await expect(page.getByRole("heading", { name: "Set up your business" })).toBeVisible();
  // The tabs are not available without a business.
  await page.goto("/orders");
  await expect(page).toHaveURL(/\/welcome$/);
});

test("logging out removes saved pages and locks the app again", async ({ page }) => {
  await logIn(page, DEMO.owner.phone);
  await expect(page).toHaveURL(/\/orders$/);
  // Put something in the offline cache, as the service worker would.
  await page.evaluate(async () => {
    const cache = await caches.open("pages");
    await cache.put("/orders", new Response("saved orders"));
  });

  await page.goto("/more");
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => caches.keys())).toEqual([]);

  await page.goto("/orders");
  await expect(page).toHaveURL(/\/login/);
});

test("the login page is not shown to someone already logged in", async ({ page }) => {
  await logIn(page, DEMO.owner.phone);
  await expect(page).toHaveURL(/\/orders$/);
  await page.goto("/login");
  await expect(page).toHaveURL(/\/orders$/);
});
