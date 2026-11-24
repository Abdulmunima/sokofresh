import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { SetupFrame } from "@/components/setup/setup-frame";
import { SignOutButton } from "@/components/shell/sign-out-button";
import { getCurrentUser } from "@/lib/auth/session";
import { formatPhoneKE } from "@/lib/phone";
import { createClient } from "@/lib/supabase/server";
import { NameForm } from "./name-form";

export async function generateMetadata() {
  const t = await getTranslations("Welcome");
  return { title: t("title") };
}

/** Signed in but not part of a business yet: step 1 of set-up (or ask the owner for access). */
export default async function WelcomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = await createClient();
  const { count } = await supabase
    .from("memberships")
    .select("supplier_id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if (count) redirect("/orders");

  const t = await getTranslations("Welcome");
  return (
    <SetupFrame
      step="name"
      title={t("title")}
      hint={t("body", { phone: formatPhoneKE(user.phone) })}
      skippable={false}
    >
      <NameForm />
      <section className="border-border flex flex-col gap-3 border-t pt-5">
        <p className="text-muted text-base">{t("staffHint")}</p>
        <SignOutButton />
      </section>
    </SetupFrame>
  );
}
