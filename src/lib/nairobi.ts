/**
 * Dates and times in Nairobi. Store UTC, think and display in Africa/Nairobi.
 *
 * Kenya is UTC+3 all year (no daylight saving), so we do the arithmetic with a fixed
 * offset instead of a time-zone library. A "date" here is a Nairobi calendar day as
 * "YYYY-MM-DD" — the same format Postgres `date` columns use (delivery_date, due_date).
 */
export const NAIROBI_TZ = "Africa/Nairobi";
const OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export type DateString = string; // "YYYY-MM-DD"

/** The Nairobi calendar day of an instant. */
export function nairobiDate(instant: Date = new Date()): DateString {
  return new Date(instant.getTime() + OFFSET_MS).toISOString().slice(0, 10);
}

/** Nairobi weekday of a date, 0 = Sunday … 6 = Saturday (same as delivery_windows.weekday). */
export function weekdayOf(date: DateString): number {
  return parseDate(date).getUTCDay();
}

/** The UTC instant of a Nairobi wall-clock time, e.g. ("2026-11-25", "06:00") → 03:00Z. */
export function nairobiInstant(date: DateString, time = "00:00"): Date {
  const [h = 0, m = 0, s = 0] = time.split(":").map(Number);
  return new Date(parseDate(date).getTime() + ((h * 60 + m) * 60 + s) * 1000 - OFFSET_MS);
}

export function addDays(date: DateString, days: number): DateString {
  return new Date(parseDate(date).getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: DateString, to: DateString): number {
  return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / DAY_MS);
}

/**
 * Days a payment is overdue: 0 on or before the due date, 1 the day after, …
 * Matches `days_overdue` in the order_balances view.
 */
export function daysOverdue(
  dueDate: DateString | null | undefined,
  now: Date = new Date(),
): number {
  if (!dueDate) return 0;
  return Math.max(0, daysBetween(dueDate, nairobiDate(now)));
}

export type RelativeDay = "yesterday" | "today" | "tomorrow";

/** "today" / "tomorrow" / "yesterday" for a date near now, else null (show the date instead). */
export function relativeDay(date: DateString, now: Date = new Date()): RelativeDay | null {
  switch (daysBetween(nairobiDate(now), date)) {
    case -1:
      return "yesterday";
    case 0:
      return "today";
    case 1:
      return "tomorrow";
    default:
      return null;
  }
}

function parseDate(date: DateString): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Not a YYYY-MM-DD date: ${date}`);
  return new Date(`${date}T00:00:00Z`);
}

// ── Display ────────────────────────────────────────────────────────────

/** "Wed, 25 Nov" (en) / "Jumatano, 25 Nov" (sw). */
export function formatDay(date: DateString | Date, locale: string): string {
  const instant = typeof date === "string" ? nairobiInstant(date, "12:00") : date;
  return new Intl.DateTimeFormat(locale === "sw" ? "sw-KE" : "en-KE", {
    timeZone: NAIROBI_TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(instant);
}

/** "06:00" — 24-hour clock, as used in Kenya for delivery times. */
export function formatTime(instantOrTime: Date | string): string {
  if (typeof instantOrTime === "string") return instantOrTime.slice(0, 5);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: NAIROBI_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(instantOrTime);
}
