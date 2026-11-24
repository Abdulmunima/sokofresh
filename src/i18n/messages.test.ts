import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";

function entries(obj: object, prefix = ""): [string, unknown][] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? entries(v, `${prefix}${k}.`)
      : [[`${prefix}${k}`, v]],
  );
}

describe("wording", () => {
  it("has no empty strings", () => {
    for (const [key, value] of entries(en)) {
      if (Array.isArray(value)) value.forEach((v, i) => expect(v, `${key}.${i}`).not.toBe(""));
      else expect(value, key).not.toBe("");
    }
  });
});
