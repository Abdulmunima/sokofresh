import { getTranslations } from "next-intl/server";
import { SetupFrame } from "@/components/setup/setup-frame";
import { requireManager } from "@/lib/auth/session";
import { ProductsForm } from "./products-form";

export async function generateMetadata() {
  const t = await getTranslations("Setup.products");
  return { title: t("title") };
}

export default async function FirstProductsPage() {
  await requireManager();
  const t = await getTranslations("Setup.products");
  return (
    <SetupFrame step="products" title={t("title")} hint={t("hint")}>
      <ProductsForm />
    </SetupFrame>
  );
}
