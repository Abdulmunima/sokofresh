import { expect, test, type Page } from "@playwright/test";

// Service workers only run in the production build (which is what the e2e web server runs).
test.use({ serviceWorkers: "allow" });

test.beforeEach(async ({ page }) => {
  await page.context().addCookies([{ name: "NEXT_LOCALE", value: "en", url: "http://localhost" }]);
});

/** Wait until the service worker controls the page and has saved the current URL. */
async function waitUntilSaved(page: Page, path: string) {
  await page.waitForFunction(() => navigator.serviceWorker?.controller != null, null, {
    timeout: 20_000,
  });
  await expect
    .poll(
      () =>
        page.evaluate(async (p) => {
          const keys = await caches.keys();
          for (const name of keys) {
            const cache = await caches.open(name);
            if (await cache.match(p, { ignoreVary: true, ignoreSearch: false })) return true;
          }
          return false;
        }, path),
      { timeout: 15_000 },
    )
    .toBe(true);
}

test("manifest describes an installable app", async ({ request }) => {
  const res = await request.get("/manifest.webmanifest");
  expect(res.ok()).toBe(true);
  const manifest = await res.json();
  expect(manifest).toMatchObject({
    name: "SokoFresh",
    short_name: "SokoFresh",
    start_url: "/orders",
    display: "standalone",
  });
  const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
  expect(sizes).toEqual(expect.arrayContaining(["192x192", "512x512"]));
  expect(manifest.icons.some((i: { purpose?: string }) => i.purpose === "maskable")).toBe(true);
  for (const icon of manifest.icons) {
    expect((await request.get(icon.src)).ok(), icon.src).toBe(true);
  }
});

test("Chrome reports no installability errors", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Uses the Chrome DevTools Protocol");
  await page.goto("/orders");
  await waitUntilSaved(page, "/orders");
  const cdp = await page.context().newCDPSession(page);
  const { installabilityErrors } = await cdp.send("Page.getInstallabilityErrors");
  expect(installabilityErrors).toEqual([]);
});

test("opens offline, showing the saved Orders and Stock screens", async ({ page, context }) => {
  // Visit while online so both screens are saved on the phone.
  await page.goto("/orders");
  await waitUntilSaved(page, "/orders");
  await page.getByRole("link", { name: "Stock" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Stock" })).toBeVisible();
  await waitUntilSaved(page, "/stock");

  await context.setOffline(true);

  // A cold start offline: full reload of Orders.
  await page.goto("/orders");
  await expect(page.getByRole("heading", { level: 1, name: "Orders" })).toBeVisible();
  const banner = page.getByRole("status").filter({ hasText: "You're offline." });
  await expect(banner).toBeVisible();
  await expect(banner).toContainText("Showing what was saved at");

  // Tabs still work offline.
  await page.getByRole("link", { name: "Stock" }).click();
  await expect(page).toHaveURL(/\/stock$/);
  await expect(page.getByRole("heading", { level: 1, name: "Stock" })).toBeVisible();

  // A screen never opened before shows the friendly offline page.
  await page.getByRole("link", { name: "Payments" }).click();
  await expect(page.getByRole("heading", { name: "You're offline" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Huna mtandao" })).toBeVisible();

  // Back online: the banner goes away by itself.
  await context.setOffline(false);
  await page.goto("/orders");
  await expect(page.getByRole("heading", { level: 1, name: "Orders" })).toBeVisible();
  await expect(banner).toBeHidden();
});
