import { getTranslations } from "next-intl/server";
import { LanguageToggle } from "./language-toggle";

export default async function Home() {
  const t = await getTranslations();
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-1">
        <p className="text-brand text-sm font-semibold tracking-wide uppercase">{t("App.name")}</p>
        <h1 className="text-3xl font-bold">{t("Home.welcome")}</h1>
        <p className="text-muted text-lg">{t("App.tagline")}</p>
      </header>
      <p className="text-lg">{t("Home.intro")}</p>
      <LanguageToggle />
      <p className="bg-surface text-muted rounded-xl p-4">{t("Home.comingSoon")}</p>
    </main>
  );
}
