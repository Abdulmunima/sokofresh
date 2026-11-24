"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { locales } from "@/i18n/config";
import { setLocale } from "@/i18n/actions";
import { cx } from "@/lib/cx";

/**
 * "compact" is the EN | SW pill in the page header (staff often share a phone);
 * "full" is the big two-button choice on the More screen.
 */
export function LanguageSwitch({ variant = "full" }: { variant?: "full" | "compact" }) {
  const t = useTranslations("Language");
  const current = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const choose = (locale: string) =>
    startTransition(async () => {
      await setLocale(locale);
      router.refresh();
    });

  return (
    <div
      role="group"
      aria-label={t("label")}
      className={cx("flex", variant === "compact" ? "bg-surface rounded-full p-1" : "gap-2")}
    >
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          lang={locale}
          aria-pressed={current === locale}
          aria-label={variant === "compact" ? t(locale) : undefined}
          disabled={pending}
          onClick={() => choose(locale)}
          className={cx(
            "aria-pressed:bg-brand aria-pressed:text-brand-foreground font-semibold",
            variant === "compact"
              ? "text-muted min-h-12 min-w-12 rounded-full px-3 text-sm"
              : "border-brand text-brand min-h-12 flex-1 rounded-xl border-2 px-4 text-base",
          )}
        >
          {variant === "compact" ? t(`${locale}Short`) : t(locale)}
        </button>
      ))}
    </div>
  );
}
