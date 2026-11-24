import { expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

/** Demo logins from supabase/seed.sql. Their test code is set in Supabase (config.toml / dashboard). */
export const DEMO = {
  owner: { phone: "0712000001", name: "Wanjiku Kamau", role: "Owner" },
  manager: { phone: "0712000002", name: "Otieno Ouma", role: "Manager" },
  staff: { phone: "0712000003", name: "Achieng Atieno", role: "Staff" },
  /** Invited as staff in the seed data; their first login claims the invite. */
  invited: { phone: "0712000004", role: "Staff" },
  /** A test number with no business, for the welcome screen. */
  newcomer: { phone: "0712000009" },
  /** Fresh owners for the set-up wizard; their businesses are deleted before each run. */
  wizard: { phone: "0712000101" },
  skipper: { phone: "0712000102" },
  /** Added as staff by the owner in staff.spec.ts. */
  newStaff: { phone: "0712000103", name: "Baraka Test" },
} as const;
/** Fixed code for numbers set up as Supabase test numbers (local config.toml). */
export const TEST_CODE = "123456";

function env(name: string): string {
  if (process.env[name]) return process.env[name]!;
  const line = readFileSync(".env.local", "utf8")
    .split("\n")
    .find((l) => l.startsWith(`${name}=`));
  if (!line) throw new Error(`${name} missing from .env.local`);
  return line.slice(name.length + 1).trim();
}

/** Call a Supabase RPC as a signed-out visitor (dev helpers and the public catalogue). */
export async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${env("NEXT_PUBLIC_SUPABASE_URL")}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`${name} failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as T;
}

/**
 * The code just "sent" to this number. On the dev project, codes go to a private outbox
 * that tests can read through dev_latest_login_code (migration 0005). Test numbers with a
 * fixed code never reach the outbox, so fall back to TEST_CODE.
 */
export async function latestLoginCode(e164: string, sentAfter: number): Promise<string> {
  const url = `${env("NEXT_PUBLIC_SUPABASE_URL")}/rest/v1/rpc/dev_latest_login_code`;
  const key = env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  for (let attempt = 0; attempt < 10; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { apikey: key, "Content-Type": "application/json" },
      body: JSON.stringify({ p_phone: e164 }),
    });
    if (res.ok) {
      const code = (await res.json()) as string | null;
      if (code && Date.now() >= sentAfter) return code;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return TEST_CODE;
}

export function toE164(local: string) {
  return `+254${local.replace(/^0/, "")}`;
}

export async function useEnglish(page: Page) {
  await page.context().addCookies([{ name: "NEXT_LOCALE", value: "en", url: "http://localhost" }]);
}

/** Ask for a code on the login screen; returns the code that was sent. */
export async function requestCode(page: Page, phone: string, { goto = true } = {}) {
  if (goto) await page.goto("/login");
  const before = Date.now();
  await page.getByLabel("Phone number").fill(phone);
  await page.getByRole("button", { name: "Send code on WhatsApp" }).click();
  await expect(page.getByText("We sent a code on WhatsApp")).toBeVisible();
  return latestLoginCode(toE164(phone), before);
}

/** Log in through the real screens: phone → WhatsApp code. */
export async function logIn(page: Page, phone: string, { goto = true } = {}) {
  const code = await requestCode(page, phone, { goto });
  await page.getByLabel("6-digit code").fill(code);
}
