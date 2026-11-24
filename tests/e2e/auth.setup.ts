import { expect, test as setup } from "@playwright/test";
import { DEMO, logIn, useEnglish } from "./helpers";

// Logs in once as the demo owner; other tests reuse the session.
setup("log in as the demo owner", async ({ page }) => {
  await useEnglish(page);
  await logIn(page, DEMO.owner.phone);
  await expect(page).toHaveURL(/\/orders$/);
  await page.context().storageState({ path: "playwright/.auth/owner.json" });
});
