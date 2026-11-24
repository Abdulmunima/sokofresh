import { getTranslations } from "next-intl/server";
import { SetupFrame } from "@/components/setup/setup-frame";
import { requireManager } from "@/lib/auth/session";
import { PaymentsForm } from "./payments-form";

export async function generateMetadata() {
  const t = await getTranslations("Setup.payments");
  return { title: t("title") };
}

export default async function PaymentMethodsPage() {
  await requireManager();
  const t = await getTranslations("Setup.payments");
  return (
    <SetupFrame step="payments" title={t("title")} hint={t("hint")}>
      <PaymentsForm />
    </SetupFrame>
  );
}
