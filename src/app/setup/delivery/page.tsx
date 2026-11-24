import { getTranslations } from "next-intl/server";
import { SetupFrame } from "@/components/setup/setup-frame";
import { requireManager } from "@/lib/auth/session";
import { DeliveryForm } from "./delivery-form";

export async function generateMetadata() {
  const t = await getTranslations("Setup.delivery");
  return { title: t("title") };
}

export default async function DeliveryDaysPage() {
  await requireManager();
  const t = await getTranslations("Setup.delivery");
  return (
    <SetupFrame step="delivery" title={t("title")} hint={t("hint")}>
      <DeliveryForm />
    </SetupFrame>
  );
}
