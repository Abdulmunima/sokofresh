import { describe, expect, it } from "vitest";
import { formatPhoneKE, normalisePhoneKE } from "./phone";

describe("normalisePhoneKE", () => {
  it.each([
    ["0712345678", "+254712345678"],
    ["0712 345 678", "+254712345678"],
    ["712345678", "+254712345678"],
    ["254712345678", "+254712345678"],
    ["+254712345678", "+254712345678"],
    ["+254 0712 345678", "+254712345678"],
    ["00254712345678", "+254712345678"],
    ["0112-345-678", "+254112345678"],
    ["(0712) 345678", "+254712345678"],
  ])("%s → %s", (input, want) => {
    expect(normalisePhoneKE(input)).toBe(want);
  });

  it.each(["", "   ", "071234567", "07123456789", "0212345678", "+255712345678", "07a2345678"])(
    "rejects %j",
    (input) => {
      expect(normalisePhoneKE(input)).toBeNull();
    },
  );

  it("rejects null and undefined", () => {
    expect(normalisePhoneKE(null)).toBeNull();
    expect(normalisePhoneKE(undefined)).toBeNull();
  });
});

describe("formatPhoneKE", () => {
  it("formats E.164 for display", () => {
    expect(formatPhoneKE("+254712345678")).toBe("0712 345 678");
  });
  it("leaves other numbers as they are", () => {
    expect(formatPhoneKE("+447700900123")).toBe("+447700900123");
    expect(formatPhoneKE(null)).toBe("");
  });
});
