import { getTranslations } from "next-intl/server";
import { LoginForm } from "./login-form";

export async function generateMetadata() {
  const t = await getTranslations("Login");
  return { title: t("title") };
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const t = await getTranslations();
  const { next } = await searchParams;
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-4 py-6">
      <div className="flex items-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny static icon, no optimisation needed */}
        <img src="/icons/icon-192.png" alt="" width={48} height={48} className="rounded-xl" />
      </div>
      <header className="flex flex-col gap-1">
        <p className="text-brand text-sm font-semibold tracking-wide uppercase">{t("App.name")}</p>
        <h1 className="text-3xl font-bold">{t("Login.title")}</h1>
        <p className="text-muted text-base">{t("App.tagline")}</p>
      </header>
      <LoginForm next={typeof next === "string" ? next : null} />
    </main>
  );
}
