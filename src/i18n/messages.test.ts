import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import sw from "../../messages/sw.json";

function keys(obj: object, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

describe("translations", () => {
  it("English and Swahili have exactly the same keys", () => {
    expect(keys(sw).sort()).toEqual(keys(en).sort());
  });

  it("no translation is empty", () => {
    for (const messages of [en, sw]) {
      for (const key of keys(messages)) {
        const value = key
          .split(".")
          .reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], messages);
        expect(value, key).not.toBe("");
      }
    }
  });
});
