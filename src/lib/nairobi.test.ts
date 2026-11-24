import { describe, expect, it } from "vitest";
import {
  addDays,
  daysBetween,
  daysOverdue,
  formatDay,
  formatTime,
  nairobiDate,
  nairobiInstant,
  relativeDay,
  weekdayOf,
} from "./nairobi";

describe("nairobiDate", () => {
  it("rolls over at midnight Nairobi time, not UTC", () => {
    expect(nairobiDate(new Date("2026-11-24T20:59:59Z"))).toBe("2026-11-24"); // 23:59:59 EAT
    expect(nairobiDate(new Date("2026-11-24T21:00:00Z"))).toBe("2026-11-25"); // 00:00 EAT
  });
});

describe("nairobiInstant", () => {
  it("converts Nairobi wall-clock time to UTC", () => {
    expect(nairobiInstant("2026-11-25", "06:00").toISOString()).toBe("2026-11-25T03:00:00.000Z");
    expect(nairobiInstant("2026-11-25", "01:30:00").toISOString()).toBe("2026-11-24T22:30:00.000Z");
  });
  it("rejects malformed dates", () => {
    expect(() => nairobiInstant("25/11/2026")).toThrow();
  });
});

describe("calendar arithmetic", () => {
  it("adds days across months and years", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
  it("counts days between dates", () => {
    expect(daysBetween("2026-11-24", "2026-12-24")).toBe(30);
    expect(daysBetween("2026-11-24", "2026-11-20")).toBe(-4);
  });
  it("knows the weekday (0 = Sunday)", () => {
    expect(weekdayOf("2026-11-22")).toBe(0);
    expect(weekdayOf("2026-11-24")).toBe(2);
  });
});

describe("daysOverdue", () => {
  const now = new Date("2026-11-24T09:00:00Z"); // 12:00 Nairobi, 24 Nov
  it("is 0 on or before the due date", () => {
    expect(daysOverdue("2026-11-24", now)).toBe(0);
    expect(daysOverdue("2026-11-30", now)).toBe(0);
    expect(daysOverdue(null, now)).toBe(0);
  });
  it("counts whole Nairobi days after the due date", () => {
    expect(daysOverdue("2026-11-23", now)).toBe(1);
    expect(daysOverdue("2026-11-21", now)).toBe(3);
  });
  it("uses the Nairobi day near midnight", () => {
    expect(daysOverdue("2026-11-24", new Date("2026-11-24T21:30:00Z"))).toBe(1); // 00:30 on the 25th
  });
});

describe("relativeDay", () => {
  const now = new Date("2026-11-24T09:00:00Z");
  it("names nearby days", () => {
    expect(relativeDay("2026-11-23", now)).toBe("yesterday");
    expect(relativeDay("2026-11-24", now)).toBe("today");
    expect(relativeDay("2026-11-25", now)).toBe("tomorrow");
    expect(relativeDay("2026-11-27", now)).toBeNull();
  });
});

describe("display", () => {
  it("formats a day in English and Swahili", () => {
    expect(formatDay("2026-11-25", "en")).toBe("Wed, 25 Nov");
    expect(formatDay("2026-11-25", "sw")).toMatch(/25/);
    expect(formatDay("2026-11-25", "sw")).not.toBe(formatDay("2026-11-25", "en"));
  });
  it("formats times on the 24-hour clock in Nairobi", () => {
    expect(formatTime(new Date("2026-11-24T15:00:00Z"))).toBe("18:00");
    expect(formatTime("06:00:00")).toBe("06:00");
  });
});
