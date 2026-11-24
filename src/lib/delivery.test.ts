import { describe, expect, it } from "vitest";
import { isPastCutoff, nextDeliverySlots, type DeliveryWindow } from "./delivery";

// Mon–Sat 06:00–10:00 for all zones, order by 6pm the evening before (like the demo supplier).
const mornings: DeliveryWindow[] = [1, 2, 3, 4, 5, 6].map((weekday) => ({
  id: `w${weekday}`,
  zone_id: null,
  weekday,
  start_time: "06:00:00",
  end_time: "10:00:00",
  cutoff_hours_before: 12,
}));

// Tuesday 24 Nov 2026, Nairobi time
const at = (time: string) => new Date(`2026-11-24T${time}+03:00`);

describe("nextDeliverySlots", () => {
  it("before 6pm: tomorrow morning is the next slot", () => {
    const [first] = nextDeliverySlots(mornings, { now: at("17:59") });
    expect(first.date).toBe("2026-11-25");
    expect(first.start).toBe("06:00");
    expect(first.end).toBe("10:00");
    expect(first.cutoffAt.toISOString()).toBe("2026-11-24T15:00:00.000Z"); // 18:00 Nairobi
  });

  it("at or after 6pm: skips to the day after tomorrow", () => {
    expect(nextDeliverySlots(mornings, { now: at("18:00") })[0].date).toBe("2026-11-26");
  });

  it("skips days with no delivery (Sunday)", () => {
    const saturdayEvening = new Date("2026-11-28T19:00:00+03:00");
    const slots = nextDeliverySlots(mornings, { now: saturdayEvening, count: 2 });
    expect(slots.map((s) => s.date)).toEqual(["2026-11-30", "2026-12-01"]); // Mon, Tue
  });

  it("returns the requested number of slots in order", () => {
    const slots = nextDeliverySlots(mornings, { now: at("09:00"), count: 4 });
    expect(slots.map((s) => s.date)).toEqual([
      "2026-11-25",
      "2026-11-26",
      "2026-11-27",
      "2026-11-28",
    ]);
  });

  it("includes zone-specific windows only for that zone", () => {
    const windows: DeliveryWindow[] = [
      ...mornings,
      {
        id: "westlands-pm",
        zone_id: "westlands",
        weekday: 3,
        start_time: "14:00:00",
        end_time: "17:00:00",
        cutoff_hours_before: 4,
      },
    ];
    const cbd = nextDeliverySlots(windows, { now: at("09:00"), zoneId: "cbd", count: 2 });
    expect(cbd.map((s) => s.windowId)).toEqual(["w3", "w4"]);
    const westlands = nextDeliverySlots(windows, {
      now: at("09:00"),
      zoneId: "westlands",
      count: 2,
    });
    expect(westlands.map((s) => `${s.date} ${s.start}`)).toEqual([
      "2026-11-25 06:00",
      "2026-11-25 14:00",
    ]);
  });

  it("allows same-day slots with a short cut-off", () => {
    const sameDay: DeliveryWindow[] = [
      {
        id: "tue-pm",
        zone_id: null,
        weekday: 2,
        start_time: "15:00:00",
        end_time: "18:00:00",
        cutoff_hours_before: 2,
      },
    ];
    expect(nextDeliverySlots(sameDay, { now: at("12:59") })[0].date).toBe("2026-11-24");
    expect(nextDeliverySlots(sameDay, { now: at("13:00") })[0].date).toBe("2026-12-01");
  });

  it("returns nothing when the supplier has no delivery days", () => {
    expect(nextDeliverySlots([], { now: at("09:00") })).toEqual([]);
  });
});

describe("isPastCutoff", () => {
  it("closes exactly at the cut-off", () => {
    expect(isPastCutoff(mornings[2], "2026-11-25", at("17:59"))).toBe(false);
    expect(isPastCutoff(mornings[2], "2026-11-25", at("18:00"))).toBe(true);
  });
});
