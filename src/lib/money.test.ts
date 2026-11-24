import { describe, expect, it } from "vitest";
import { formatKES as format } from "./money";

// Intl puts a non-breaking space after "Ksh" (so amounts never wrap); compare with plain spaces.
const formatKES = (amount: Parameters<typeof format>[0]) => format(amount).replace(/\u00a0/g, " ");

describe("formatKES", () => {
  it("keeps Ksh and the number together", () => {
    expect(format(1500)).toBe("Ksh\u00a01,500");
  });
  it("shows whole shillings without decimals", () => {
    expect(formatKES(1500)).toBe("Ksh 1,500");
    expect(formatKES(0)).toBe("Ksh 0");
  });
  it("shows cents when there are any", () => {
    expect(formatKES(1500.5)).toBe("Ksh 1,500.50");
  });
  it("accepts Postgres numeric strings", () => {
    expect(formatKES("23450.00")).toBe("Ksh 23,450");
  });
  it("handles negatives, null and junk", () => {
    expect(formatKES(-120)).toBe("-Ksh 120");
    expect(formatKES(null)).toBe("Ksh 0");
    expect(formatKES("abc")).toBe("Ksh 0");
  });
});
