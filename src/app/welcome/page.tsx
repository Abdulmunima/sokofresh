import { Store } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/shell/empty-state";
import { SignOutButton } from "@/components/shell/sign-out-button";
import { getCurrentUser } from "@/lib/auth/session";
import { formatPhoneKE } from "@/lib/phone";

export async function generateMetadata() {
  const t = await getTranslations("Welcome");
  return { title: t("title") };
}

/** Signed in, but not part of any business yet. Task 1.2 turns this into the set-up wizard. */
export default async function WelcomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const t = await getTranslations("Welcome");
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-8">
      <EmptyState
        icon={<Store />}
        title={t("title")}
        body={t("body", { phone: formatPhoneKE(user.phone) })}
      />
      <p className="bg-surface text-muted rounded-xl p-4 text-center text-base">{t("staffHint")}</p>
      <SignOutButton />
    </main>
  );
}
