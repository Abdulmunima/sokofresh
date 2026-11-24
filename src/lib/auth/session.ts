import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Enum } from "@/lib/supabase/types";

export type CurrentUser = { id: string; phone: string | null };

export type CurrentMember = CurrentUser & {
  supplierId: string;
  supplierName: string;
  role: Enum<"member_role">;
  fullName: string | null;
};

/** The signed-in user, or null. Verified against Supabase (not just the cookie). */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  const phone =
    typeof claims.phone === "string" && claims.phone ? `+${claims.phone.replace(/^\+/, "")}` : null;
  return { id: claims.sub, phone };
});

/**
 * The signed-in user and the business they work for. Sends signed-out users to /login
 * and users without a business to /welcome. Use in every signed-in screen.
 */
export const requireMember = cache(async (): Promise<CurrentMember> => {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase
    .from("memberships")
    .select("role, supplier_id, suppliers(name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!data) redirect("/welcome");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  return {
    ...user,
    supplierId: data.supplier_id,
    supplierName: data.suppliers?.name ?? "",
    role: data.role,
    fullName: profile?.full_name ?? null,
  };
});

/** Owners and managers see money totals and the Credit screen; staff do not. */
export function canSeeMoney(role: Enum<"member_role">): boolean {
  return role === "owner" || role === "manager";
}
