import { describe, expect, it } from "vitest";
import { canEditMember, canManageTeam, canViewTeam, initials, isAssignableRole } from "./team";

describe("team permissions", () => {
  it("only owners manage the team; managers can look", () => {
    expect(canManageTeam("owner")).toBe(true);
    expect(canManageTeam("manager")).toBe(false);
    expect(canViewTeam("manager")).toBe(true);
    expect(canViewTeam("staff")).toBe(false);
  });

  it("owners cannot edit other owners or themselves", () => {
    expect(canEditMember("owner", "me", { role: "staff", userId: "you" })).toBe(true);
    expect(canEditMember("owner", "me", { role: "owner", userId: "you" })).toBe(false);
    expect(canEditMember("owner", "me", { role: "manager", userId: "me" })).toBe(false);
    expect(canEditMember("manager", "me", { role: "staff", userId: "you" })).toBe(false);
  });

  it("owners can only hand out staff or manager", () => {
    expect(isAssignableRole("staff")).toBe(true);
    expect(isAssignableRole("manager")).toBe(true);
    expect(isAssignableRole("owner")).toBe(false);
    expect(isAssignableRole("boss")).toBe(false);
  });
});

describe("initials", () => {
  it.each([
    ["Baraka Otieno", "BO"],
    ["Wanjiku Mary Kamau", "WK"],
    ["achieng", "A"],
    ["", "#"],
    [null, "#"],
    ["0712 345 678", "#"],
  ])("%j → %s", (name, want) => expect(initials(name)).toBe(want));
});
