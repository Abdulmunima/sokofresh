"use client";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { saveDelivery } from "@/app/setup/actions";
import { Choice } from "@/components/setup/choice";
import { Button } from "@/components/ui/button";
import {
  CUTOFF_PRESETS,
  DEFAULT_DELIVERY,
  WINDOW_PRESETS,
  type DeliveryInput,
  type WindowPreset,
} from "@/lib/onboarding";
import { cx } from "@/lib/cx";

// Monday first, as Kenyan shops think about the week.
const WEEK = [1, 2, 3, 4, 5, 6, 0] as const;

export function DeliveryForm() {
  const t = useTranslations("Setup");
  const [form, setForm] = useState<DeliveryInput>(DEFAULT_DELIVERY);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  const toggleDay = (d: number) =>
    setForm((f) => ({
      ...f,
      days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d],
    }));

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await saveDelivery(form);
          if (result && !result.ok) setError(true);
        });
      }}
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-lg font-bold">{t("delivery.days")}</legend>
        <div className="grid grid-cols-4 gap-2">
          {WEEK.map((d) => (
            <button
              key={d}
              type="button"
              role="checkbox"
              aria-checked={form.days.includes(d)}
              onClick={() => toggleDay(d)}
              className={cx(
                "min-h-12 rounded-xl border-2 text-base font-semibold",
                form.days.includes(d)
                  ? "border-brand bg-brand text-brand-foreground"
                  : "border-border",
              )}
            >
              {t(`delivery.weekdays.${d}`)}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-lg font-bold">{t("delivery.time")}</legend>
        <div role="radiogroup" className="flex flex-col gap-2">
          {(Object.keys(WINDOW_PRESETS) as WindowPreset[]).map((w) => (
            <Choice
              key={w}
              selected={form.window === w}
              onSelect={() => setForm((f) => ({ ...f, window: w }))}
              label={`${WINDOW_PRESETS[w].start}–${WINDOW_PRESETS[w].end}`}
              hint={t(`delivery.windows.${w}`)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-lg font-bold">{t("delivery.cutoff")}</legend>
        <div role="radiogroup" className="flex flex-col gap-2">
          {CUTOFF_PRESETS.map((c) => (
            <Choice
              key={c}
              selected={form.cutoff === c}
              onSelect={() => setForm((f) => ({ ...f, cutoff: c }))}
              label={t(`delivery.cutoffs.${c}`)}
            />
          ))}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="text-danger">
          {t("errors.failed")}
        </p>
      )}
      <Button type="submit" block icon={<ArrowRight />} disabled={pending}>
        {pending ? t("saving") : t("continue")}
      </Button>
    </form>
  );
}
