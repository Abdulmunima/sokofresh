import { expect, test, type BrowserContext } from "@playwright/test";
import { DEMO, logIn, rpc, toE164 } from "./helpers";

test.describe.configure({ mode: "serial" });

// The new person's own phone, kept across tests (one login: codes are limited to one a minute).
let theirPhone: BrowserContext;

test.afterAll(async () => {
  await theirPhone?.close();
});

test.beforeAll(async () => {
  // Take the test number out of the team so the owner can add it again.
  await rpc("dev_reset_test_user", { p_phone: toE164(DEMO.newStaff.phone) });
});

test("the owner adds a person, who logs in as staff without money screens", async ({
  page,
  browser,
}) => {
  // Owner (saved session from auth.setup.ts)
  await page.goto("/more");
  await page.getByRole("link", { name: /^Staff/ }).click();
  await expect(page).toHaveURL(/\/more\/staff$/);
  await expect(page.getByText("Owner · you")).toBeVisible();

  await page.getByRole("button", { name: "Add a person" }).click();
  const sheet = page.getByRole("dialog", { name: "Add a person" });
  await sheet.getByLabel("Name").fill(DEMO.newStaff.name);
  await sheet.getByLabel("Phone number").fill(DEMO.newStaff.phone);
  await sheet.getByRole("radio", { name: /^Staff/ }).click();
  await sheet.getByRole("button", { name: "Add", exact: true }).click();
  // New number → invited; a number that already has an account (earlier runs) → added at once.
  const outcome = sheet.getByRole("status");
  await expect(outcome).toHaveText(new RegExp(`${DEMO.newStaff.name} (is invited|has been added)`));
  const invited = (await outcome.textContent())?.includes("is invited");
  const wa = sheet.getByRole("link", { name: "Tell them on WhatsApp" });
  await expect(wa).toHaveAttribute(
    "href",
    /^https:\/\/wa\.me\/254712000103\?text=.*Mama%20Mboga%20Wholesale/,
  );
  await sheet.getByRole("button", { name: "Done" }).click();

  if (invited) {
    const waiting = page.getByRole("region", { name: "Waiting for first login" });
    await expect(waiting.getByText(DEMO.newStaff.name)).toBeVisible();
  }

  // The new person logs in on their own phone.
  theirPhone = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const staffPage = await theirPhone.newPage();
  await logIn(staffPage, DEMO.newStaff.phone);
  await expect(staffPage).toHaveURL(/\/orders$/);
  await staffPage.goto("/more");
  await expect(staffPage.getByText(DEMO.newStaff.name)).toBeVisible();
  await expect(staffPage.getByText("Staff · Mama Mboga Wholesale")).toBeVisible();
  // No staff management for staff…
  await expect(staffPage.getByRole("link", { name: /^Staff/ })).toHaveCount(0);
  await staffPage.goto("/more/staff");
  await expect(staffPage).toHaveURL(/\/orders$/);
  // …and no owner set-up screens with money settings.
  await staffPage.goto("/setup/payments");
  await expect(staffPage).toHaveURL(/\/orders$/);

  // Back on the owner's phone: they are in the team now.
  await page.reload();
  const team = page.getByRole("region", { name: /^Team/ });
  await expect(team.getByText(DEMO.newStaff.name)).toBeVisible();
  await expect(page.getByRole("region", { name: "Waiting for first login" })).toHaveCount(0);
});

test("the owner changes a role, removes someone, and can undo", async ({ page }) => {
  await page.goto("/more/staff");
  const team = page.getByRole("region", { name: /^Team/ });
  await team.getByRole("button", { name: new RegExp(DEMO.newStaff.name) }).click();

  const sheet = page.getByRole("dialog", { name: DEMO.newStaff.name });
  await sheet.getByRole("radio", { name: /^Manager/ }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Role changed to Manager" }),
  ).toBeVisible();

  await sheet.getByRole("button", { name: "Remove from business" }).click();
  const toast = page.getByRole("status").filter({ hasText: `${DEMO.newStaff.name} removed` });
  await expect(toast).toBeVisible();
  await expect(team.getByText(DEMO.newStaff.name)).toHaveCount(0);

  await toast.getByRole("button", { name: "Undo" }).click();
  await expect(team.getByText(DEMO.newStaff.name)).toBeVisible();
  await page.reload();
  await expect(team.getByText("Manager · 0712 000 103")).toBeVisible(); // undo kept the new role
});

test("as a manager they see the team but cannot change it", async () => {
  // Promoted to Manager in the previous test; same phone, same session.
  const page = await theirPhone.newPage();
  await page.goto("/more");
  await expect(page.getByText("Manager · Mama Mboga Wholesale")).toBeVisible();
  await page.getByRole("link", { name: /^Staff/ }).click();
  await expect(page.getByText("Only the owner can add or remove people.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Add a person" })).toHaveCount(0);
});
