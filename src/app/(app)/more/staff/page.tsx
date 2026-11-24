import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shell/page-header";
import { requireManager } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { canManageTeam, isAssignableRole } from "@/lib/team";
import { StaffScreen, type Invite, type Member } from "./staff-screen";

export async function generateMetadata() {
  const t = await getTranslations("Staff");
  return { title: t("title") };
}

export default async function StaffPage() {
  const me = await requireManager();
  const supabase = await createClient();
  const [team, invites] = await Promise.all([
    supabase.rpc("team_members", { p_supplier_id: me.supplierId }),
    supabase
      .from("staff_invites")
      .select("phone, role, name, created_at")
      .eq("supplier_id", me.supplierId)
      .order("created_at"),
  ]);

  const members: Member[] = (team.data ?? []).map((m) => ({
    userId: m.user_id,
    name: m.full_name,
    phone: m.phone,
    role: m.role,
  }));
  const waiting: Invite[] = (invites.data ?? [])
    .filter((i) => isAssignableRole(i.role))
    .map((i) => ({ phone: i.phone, name: i.name, role: i.role as Invite["role"] }));

  const t = await getTranslations("Staff");
  return (
    <>
      <PageHeader title={t("title")} />
      <StaffScreen
        me={{ id: me.id, role: me.role }}
        businessName={me.supplierName}
        canManage={canManageTeam(me.role)}
        members={members}
        invites={waiting}
      />
    </>
  );
}
