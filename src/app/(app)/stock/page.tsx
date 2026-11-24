import { Package } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/shell/empty-state";
import { PageHeader } from "@/components/shell/page-header";

export async function generateMetadata() {
  const t = await getTranslations("Nav");
  return { title: t("stock") };
}

export default async function StockPage() {
  const t = await getTranslations();
  return (
    <>
      <PageHeader title={t("Nav.stock")} />
      <EmptyState icon={<Package />} title={t("Stock.emptyTitle")} body={t("Stock.emptyBody")} />
    </>
  );
}
