import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shell/page-header";
import { requireMember } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { StockScreen } from "./stock-screen";

export async function generateMetadata() {
  const t = await getTranslations("Nav");
  return { title: t("stock") };
}

export default async function StockPage() {
  const me = await requireMember();
  const supabase = await createClient();
  const [products, categories] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, name_sw, unit, price_kes, stock_status, category_id, sort")
      .eq("supplier_id", me.supplierId)
      .eq("is_active", true),
    supabase.from("categories").select("id, name, name_sw, sort").eq("supplier_id", me.supplierId),
  ]);
  const t = await getTranslations("Nav");
  return (
    <>
      <PageHeader title={t("stock")} />
      <StockScreen products={products.data ?? []} categories={categories.data ?? []} />
    </>
  );
}
