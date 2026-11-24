import { describe, expect, it } from "vitest";
import { isDataCache } from "./saved-pages";

describe("isDataCache", () => {
  it("clears saved pages and data", () => {
    for (const name of ["pages", "pages-rsc", "pages-rsc-prefetch", "others", "apis"]) {
      expect(isDataCache(name)).toBe(true);
    }
  });
  it("keeps the app's own files so it still opens offline", () => {
    for (const name of [
      "serwist-precache-v2-https://x/",
      "next-static-js-assets",
      "static-image-assets",
      "static-style-assets",
    ]) {
      expect(isDataCache(name)).toBe(false);
    }
  });
});
