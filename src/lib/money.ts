const whole = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 0,
});
const cents = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format a KES amount for display: "Ksh 1,500" or "Ksh 1,500.50".
 * Accepts numbers or the numeric strings Postgres returns for numeric(12,2).
 */
export function formatKES(amount: number | string | null | undefined): string {
  const n = typeof amount === "string" ? Number(amount) : (amount ?? 0);
  if (!Number.isFinite(n)) return whole.format(0);
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? whole.format(rounded) : cents.format(rounded);
}

/**
 * Read a price typed by a person: "2,500", "Ksh 30", "1500.50", " 400 ".
 * Returns KES rounded to cents, or null if it is not a sensible price.
 */
export function parsePriceKES(text: string | null | undefined): number | null {
  const cleaned = (text ?? "")
    .trim()
    .replace(/^(ksh|kes)\.?\s*/i, "")
    .replace(/[,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value > 10_000_000) return null;
  return Math.round(value * 100) / 100;
}
