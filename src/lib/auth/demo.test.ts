import { describe, expect, it } from "vitest";
import { isDemoNumber } from "./demo";

describe("isDemoNumber", () => {
  it.each(["+254712000001", "+254712000101", "+254712000999"])("%s is a demo number", (n) =>
    expect(isDemoNumber(n)).toBe(true),
  );
  it.each(["+254712001000", "+254722000001", "+25471200001", null, ""])("%j is not", (n) =>
    expect(isDemoNumber(n)).toBe(false),
  );
});
