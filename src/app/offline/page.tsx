import { WifiOff } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("Offline");
  return { title: t("title") };
}

// Precached by the service worker and shown for pages that were never opened online.
export default async function OfflinePage() {
  const t = await getTranslations("Offline");
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      <span className="bg-surface text-brand flex size-20 items-center justify-center rounded-full">
        <WifiOff aria-hidden className="size-10" />
      </span>
      <section className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted text-base">{t("body")}</p>
      </section>
      {/* A plain link (not next/link): a full reload is what we want once back online. */}
      <a
        href="/orders"
        className="bg-brand text-brand-foreground inline-flex min-h-12 items-center justify-center rounded-xl px-6 font-semibold"
      >
        {t("retry")}
      </a>
    </main>
  );
}
