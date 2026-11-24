"use server";

import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/auth/session";
import { normalisePhoneKE } from "@/lib/phone";
import { createClient } from "@/lib/supabase/server";
import { canManageTeam, isAssignableRole, type AssignableRole } from "@/lib/team";

type Fail = { ok: false; error: "not_allowed" | "invalid_phone" | "plan_limit" | "failed" };

async function requireOwner() {
  const me = await requireMember();
  return canManageTeam(me.role) ? me : null;
}

function done() {
  revalidatePath("/more/staff");
}

/** Add someone by phone: joins now if they have an account, otherwise invited. */
export async function addPerson(input: {
  name: string;
  phone: string;
  role: AssignableRole;
}): Promise<{ ok: true; result: "added" | "invited" | "already_member"; phone: string } | Fail> {
  const me = await requireOwner();
  if (!me) return { ok: false, error: "not_allowed" };
  const phone = normalisePhoneKE(input.phone);
  if (!phone) return { ok: false, error: "invalid_phone" };
  if (!isAssignableRole(input.role)) return { ok: false, error: "failed" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("add_team_member", {
    p_supplier_id: me.supplierId,
    p_phone: phone,
    p_role: input.role,
    p_name: input.name.trim().slice(0, 80) || undefined,
  });
  if (error) {
    if (error.message.includes("plan_limit_users")) return { ok: false, error: "plan_limit" };
    console.error("add_team_member failed", error.code, error.message);
    return { ok: false, error: "failed" };
  }
  done();
  return { ok: true, result: data as "added" | "invited" | "already_member", phone };
}

export async function changeRole(
  userId: string,
  role: AssignableRole,
): Promise<{ ok: true } | Fail> {
  const me = await requireOwner();
  if (!me || userId === me.id || !isAssignableRole(role))
    return { ok: false, error: "not_allowed" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("memberships")
    .update({ role })
    .eq("supplier_id", me.supplierId)
    .eq("user_id", userId)
    .neq("role", "owner");
  if (error) return { ok: false, error: "failed" };
  done();
  return { ok: true };
}

/** Remove someone from the business. Returns their role so Undo can put them back. */
export async function removePerson(
  userId: string,
): Promise<{ ok: true; role: AssignableRole } | Fail> {
  const me = await requireOwner();
  if (!me || userId === me.id) return { ok: false, error: "not_allowed" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memberships")
    .delete()
    .eq("supplier_id", me.supplierId)
    .eq("user_id", userId)
    .neq("role", "owner")
    .select("role")
    .maybeSingle();
  if (error || !data || !isAssignableRole(data.role)) return { ok: false, error: "failed" };
  done();
  return { ok: true, role: data.role };
}

export async function restorePerson(
  userId: string,
  role: AssignableRole,
): Promise<{ ok: true } | Fail> {
  const me = await requireOwner();
  if (!me || !isAssignableRole(role)) return { ok: false, error: "not_allowed" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("memberships")
    .insert({ supplier_id: me.supplierId, user_id: userId, role });
  if (error)
    return { ok: false, error: error.message.includes("plan_limit") ? "plan_limit" : "failed" };
  done();
  return { ok: true };
}

export async function cancelInvite(
  phone: string,
): Promise<{ ok: true; role: AssignableRole; name: string | null } | Fail> {
  const me = await requireOwner();
  if (!me) return { ok: false, error: "not_allowed" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("staff_invites")
    .delete()
    .eq("supplier_id", me.supplierId)
    .eq("phone", phone)
    .select("role, name")
    .maybeSingle();
  if (error || !data || !isAssignableRole(data.role)) return { ok: false, error: "failed" };
  done();
  return { ok: true, role: data.role, name: data.name };
}

export async function restoreInvite(phone: string, role: AssignableRole, name: string | null) {
  const me = await requireOwner();
  if (!me || !isAssignableRole(role)) return { ok: false, error: "not_allowed" } as Fail;
  const supabase = await createClient();
  const { error } = await supabase
    .from("staff_invites")
    .insert({ supplier_id: me.supplierId, phone, role, name });
  if (error) return { ok: false, error: "failed" } as Fail;
  done();
  return { ok: true } as const;
}
