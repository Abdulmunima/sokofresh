import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { PwaProvider } from "@/components/shell/pwa-provider";
import { renderTimestamp } from "@/lib/clock";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("App");
  return {
    title: t("name"),
    description: t("tagline"),
    applicationName: t("name"),
    appleWebApp: { capable: true, title: t("name"), statusBarStyle: "default" },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1f7a3a",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    // data-rendered-at lets the offline banner say when a saved page was made.
    <html lang={locale} className="h-full antialiased" data-rendered-at={renderTimestamp()}>
      <body className="flex min-h-full flex-col text-base">
        <NextIntlClientProvider>
          <PwaProvider>{children}</PwaProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
