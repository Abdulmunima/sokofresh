/** Demo accounts on the test site: +254712000000 – +254712000999 (seed data and e2e tests). */
export function isDemoNumber(e164: string | null | undefined): boolean {
  return /^\+254712000\d{3}$/.test(e164 ?? "");
}

/**
 * Test site only (NEXT_PUBLIC_SHOW_TEST_CODES=1): show the login code on screen for demo
 * numbers, read from the dev-only lookup (migrations 0005/0010). Never set on production.
 */
export function showTestCodes(): boolean {
  return process.env.NEXT_PUBLIC_SHOW_TEST_CODES === "1";
}
