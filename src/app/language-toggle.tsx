"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { locales } from "@/i18n/config";
import { setLocale } from "@/i18n/actions";

export function LanguageToggle() {
  const t = useTranslations("Language");
  const current = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div role="group" aria-label={t("label")} className="flex gap-2">
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          aria-pressed={current === locale}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await setLocale(locale);
              router.refresh();
            })
          }
          className="border-brand aria-pressed:bg-brand aria-pressed:text-brand-foreground min-h-12 min-w-24 rounded-full border-2 px-4 text-base font-medium"
        >
          {t(locale)}
        </button>
      ))}
    </div>
  );
}
