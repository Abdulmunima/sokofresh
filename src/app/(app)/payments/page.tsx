import { Wallet } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/shell/empty-state";
import { PageHeader } from "@/components/shell/page-header";

export async function generateMetadata() {
  const t = await getTranslations("Nav");
  return { title: t("payments") };
}

export default async function PaymentsPage() {
  const t = await getTranslations();
  return (
    <>
      <PageHeader title={t("Nav.payments")} />
      <EmptyState
        icon={<Wallet />}
        title={t("Payments.emptyTitle")}
        body={t("Payments.emptyBody")}
      />
    </>
  );
}
