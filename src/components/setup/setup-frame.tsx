import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { nextStep, SETUP_STEPS, stepHref, type SetupStep } from "@/lib/onboarding";

/** One wizard step: progress, title, the form, and "Skip for now". */
export async function SetupFrame({
  step,
  title,
  hint,
  children,
  skippable = true,
}: {
  step: SetupStep;
  title: string;
  hint?: string;
  children: ReactNode;
  skippable?: boolean;
}) {
  const t = await getTranslations("Setup");
  const index = SETUP_STEPS.indexOf(step);
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted text-sm font-semibold">
          {t("progress", { step: index + 1, total: SETUP_STEPS.length })}
        </p>
      </div>
      <div
        role="progressbar"
        aria-label={t("progressLabel")}
        aria-valuemin={1}
        aria-valuemax={SETUP_STEPS.length}
        aria-valuenow={index + 1}
        className="flex gap-1.5"
      >
        {SETUP_STEPS.map((s, i) => (
          <span
            key={s}
            className={`h-2 flex-1 rounded-full ${i <= index ? "bg-brand" : "bg-border"}`}
          />
        ))}
      </div>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{title}</h1>
        {hint && <p className="text-muted text-base">{hint}</p>}
      </header>
      {children}
      {skippable && (
        <Link
          href={stepHref(nextStep(step))}
          className="text-muted active:bg-surface flex min-h-12 items-center justify-center rounded-xl text-base font-semibold"
        >
          {t("skip")}
        </Link>
      )}
    </main>
  );
}
