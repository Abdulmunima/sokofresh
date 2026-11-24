import { describe, expect, it } from "vitest";
import { isPublicPath, loginPathFor, safeNext } from "./paths";

describe("isPublicPath", () => {
  it.each([
    "/login",
    "/offline",
    "/s/mama-mboga-wholesale",
    "/api/auth/send-code",
    "/serwist/sw.js",
    "/manifest.webmanifest",
    "/icons/icon-192.png",
  ])("%s is public", (p) => expect(isPublicPath(p)).toBe(true));
  it.each(["/", "/orders", "/stock", "/more/design", "/welcome", "/slugs", "/loginx"])(
    "%s needs login",
    (p) => expect(isPublicPath(p)).toBe(false),
  );
});

describe("safeNext", () => {
  it("keeps paths inside the app", () => {
    expect(safeNext("/stock?q=tom")).toBe("/stock?q=tom");
  });
  it.each([
    null,
    "",
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    "/login",
    "/login?next=/x",
    "/api/x",
  ])("falls back for %j", (n) => expect(safeNext(n)).toBe("/orders"));
});

describe("loginPathFor", () => {
  it("remembers where to go back to", () => {
    expect(loginPathFor("/stock")).toBe("/login?next=%2Fstock");
  });
  it("keeps the plain login URL for the home screens", () => {
    expect(loginPathFor("/")).toBe("/login");
    expect(loginPathFor("/orders")).toBe("/login");
  });
});
