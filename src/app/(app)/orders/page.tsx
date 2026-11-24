import { ClipboardList } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/shell/empty-state";
import { PageHeader } from "@/components/shell/page-header";

export async function generateMetadata() {
  const t = await getTranslations("Nav");
  return { title: t("orders") };
}

export default async function OrdersPage() {
  const t = await getTranslations();
  return (
    <>
      <PageHeader title={t("Nav.orders")} />
      <EmptyState
        icon={<ClipboardList />}
        title={t("Orders.emptyTitle")}
        body={t("Orders.emptyBody")}
      />
    </>
  );
}
