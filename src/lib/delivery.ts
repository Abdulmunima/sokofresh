import type { Row } from "@/lib/supabase/types";
import { addDays, nairobiDate, nairobiInstant, weekdayOf, type DateString } from "./nairobi";

export type DeliveryWindow = Pick<
  Row<"delivery_windows">,
  "id" | "zone_id" | "weekday" | "start_time" | "end_time" | "cutoff_hours_before"
>;

export type DeliverySlot = {
  windowId: string;
  /** Nairobi calendar day of the delivery. */
  date: DateString;
  /** "06:00" */
  start: string;
  end: string;
  /** Order must be placed before this instant. */
  cutoffAt: Date;
  startsAt: Date;
};

/**
 * The next delivery slots a customer can still order for (PRD F3).
 *
 * A window applies to a zone if it is for that zone or for all zones (zone_id null).
 * A slot is open until `cutoff_hours_before` hours before it starts, e.g. a 06:00 slot
 * with a 12-hour cut-off closes at 18:00 the evening before ("order by 6pm").
 */
export function nextDeliverySlots(
  windows: readonly DeliveryWindow[],
  options: { now?: Date; zoneId?: string | null; count?: number; horizonDays?: number } = {},
): DeliverySlot[] {
  const { now = new Date(), zoneId = null, count = 3, horizonDays = 14 } = options;
  const applicable = windows.filter((w) => w.zone_id === null || w.zone_id === zoneId);
  const today = nairobiDate(now);
  const slots: DeliverySlot[] = [];

  for (let offset = 0; offset <= horizonDays && slots.length < count; offset++) {
    const date = addDays(today, offset);
    const weekday = weekdayOf(date);
    const dayWindows = applicable
      .filter((w) => w.weekday === weekday)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
    for (const w of dayWindows) {
      const startsAt = nairobiInstant(date, w.start_time);
      const cutoffAt = new Date(startsAt.getTime() - w.cutoff_hours_before * 60 * 60 * 1000);
      if (now < cutoffAt) {
        slots.push({
          windowId: w.id,
          date,
          start: w.start_time.slice(0, 5),
          end: w.end_time.slice(0, 5),
          cutoffAt,
          startsAt,
        });
        if (slots.length === count) break;
      }
    }
  }
  return slots;
}

/** True if a slot on `date` in `window` can no longer be ordered for. */
export function isPastCutoff(window: DeliveryWindow, date: DateString, now: Date = new Date()) {
  const startsAt = nairobiInstant(date, window.start_time);
  return now.getTime() >= startsAt.getTime() - window.cutoff_hours_before * 60 * 60 * 1000;
}
