import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shell/page-header";
import { DesignPreview } from "./design-preview";

export async function generateMetadata() {
  const t = await getTranslations("More");
  return { title: t("design") };
}

/** Every building block on one screen, for checking looks on a real phone. */
export default async function DesignPage() {
  const t = await getTranslations("More");
  return (
    <>
      <PageHeader title={t("design")} />
      <DesignPreview />
    </>
  );
}
