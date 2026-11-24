import { Palette, UserRound, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shell/page-header";
import { List, ListItem } from "@/components/ui/list-item";
import { SignOutButton } from "@/components/shell/sign-out-button";
import { requireMember } from "@/lib/auth/session";
import { canViewTeam } from "@/lib/team";
import { formatPhoneKE } from "@/lib/phone";

export async function generateMetadata() {
  const t = await getTranslations("Nav");
  return { title: t("more") };
}

export default async function MorePage() {
  const t = await getTranslations();
  const me = await requireMember();
  return (
    <>
      <PageHeader title={t("Nav.more")} />
      <List className="border-border border-b">
        <ListItem
          leading={<UserRound />}
          title={me.fullName ?? formatPhoneKE(me.phone)}
          subtitle={`${t(`Account.roles.${me.role}`)} · ${me.supplierName}`}
        />
      </List>
      <List className="border-border border-t">
        {canViewTeam(me.role) && (
          <ListItem
            href="/more/staff"
            leading={<Users />}
            title={t("More.staff")}
            subtitle={t("More.staffHint")}
          />
        )}
        <ListItem
          href="/more/design"
          leading={<Palette />}
          title={t("More.design")}
          subtitle={t("More.designHint")}
        />
      </List>
      <section className="border-border border-t px-4 py-5">
        <SignOutButton />
      </section>
    </>
  );
}
