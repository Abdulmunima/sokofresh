import type { Enum } from "@/lib/supabase/types";

export type Role = Enum<"member_role">;

/** Roles an owner can give someone (owners are made only when a business is created). */
export const ASSIGNABLE_ROLES = ["staff", "manager"] as const satisfies readonly Role[];
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export function isAssignableRole(value: unknown): value is AssignableRole {
  return (ASSIGNABLE_ROLES as readonly unknown[]).includes(value);
}

/** Only owners add, change or remove people. Managers can see the team. */
export function canManageTeam(role: Role): boolean {
  return role === "owner";
}

export function canViewTeam(role: Role): boolean {
  return role === "owner" || role === "manager";
}

/** Can `actor` change or remove `target`? Never owners, never yourself. */
export function canEditMember(
  actorRole: Role,
  actorId: string,
  target: { role: Role; userId: string },
) {
  return canManageTeam(actorRole) && target.role !== "owner" && target.userId !== actorId;
}

/** "Baraka Otieno" → "BO", "0712 345 678" → "#" */
export function initials(name: string | null | undefined): string {
  const words = (name ?? "")
    .trim()
    .split(/\s+/)
    .filter((w) => /\p{L}/u.test(w[0] ?? ""));
  if (!words.length) return "#";
  return (words[0][0] + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
}
