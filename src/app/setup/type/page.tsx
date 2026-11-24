import { getTranslations } from "next-intl/server";
import { SetupFrame } from "@/components/setup/setup-frame";
import { requireManager } from "@/lib/auth/session";
import { BUSINESS_TYPES, type BusinessType } from "@/lib/onboarding";
import { createClient } from "@/lib/supabase/server";
import { TypeForm } from "./type-form";

export async function generateMetadata() {
  const t = await getTranslations("Setup.type");
  return { title: t("title") };
}

export default async function BusinessTypePage() {
  const me = await requireManager();
  const supabase = await createClient();
  const { data } = await supabase
    .from("suppliers")
    .select("business_type")
    .eq("id", me.supplierId)
    .single();
  const current = BUSINESS_TYPES.find((b) => b === data?.business_type) ?? null;
  const t = await getTranslations("Setup.type");
  return (
    <SetupFrame step="type" title={t("title")} hint={t("hint")}>
      <TypeForm initial={current as BusinessType | null} />
    </SetupFrame>
  );
}
