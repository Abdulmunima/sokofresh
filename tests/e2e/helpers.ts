import { expect, type Page } from "@playwright/test";

/** Demo logins from supabase/seed.sql. Their test code is set in Supabase (config.toml / dashboard). */
export const DEMO = {
  owner: { phone: "0712000001", name: "Wanjiku Kamau", role: "Owner" },
  manager: { phone: "0712000002", name: "Otieno Ouma", role: "Manager" },
  staff: { phone: "0712000003", name: "Achieng Atieno", role: "Staff" },
  /** A test number with no business, for the welcome screen. */
  newcomer: { phone: "0712000009" },
} as const;
export const TEST_CODE = "123456";

export async function useEnglish(page: Page) {
  await page.context().addCookies([{ name: "NEXT_LOCALE", value: "en", url: "http://localhost" }]);
}

/** Log in through the real screens: phone → WhatsApp code. */
export async function logIn(page: Page, phone: string, code = TEST_CODE) {
  await page.goto("/login");
  await page.getByLabel("Phone number").fill(phone);
  await page.getByRole("button", { name: "Send code on WhatsApp" }).click();
  await expect(page.getByText("We sent a code on WhatsApp")).toBeVisible();
  await page.getByLabel("6-digit code").fill(code);
}
