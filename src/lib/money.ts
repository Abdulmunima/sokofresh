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
