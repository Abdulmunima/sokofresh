"use client";

import { ArrowRight, Beef, CupSoda, Package, Store, Wheat, Carrot } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { saveBusinessType } from "@/app/setup/actions";
import { Choice } from "@/components/setup/choice";
import { Button } from "@/components/ui/button";
import { BUSINESS_TYPES, type BusinessType } from "@/lib/onboarding";

const ICONS: Record<BusinessType, React.ReactNode> = {
  produce: <Carrot />,
  meat_fish: <Beef />,
  dry_goods: <Wheat />,
  beverages: <CupSoda />,
  packaging: <Package />,
  other: <Store />,
};

export function TypeForm({ initial }: { initial: BusinessType | null }) {
  const t = useTranslations("Setup");
  const [type, setType] = useState<BusinessType | null>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!type) return;
        startTransition(async () => {
          const result = await saveBusinessType(type);
          if (result && !result.ok) setError(t("errors.failed"));
        });
      }}
    >
      <div role="radiogroup" aria-label={t("type.title")} className="flex flex-col gap-2">
        {BUSINESS_TYPES.map((b) => (
          <Choice
            key={b}
            selected={type === b}
            onSelect={() => setType(b)}
            icon={ICONS[b]}
            label={t(`type.options.${b}`)}
          />
        ))}
      </div>
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      <Button type="submit" block icon={<ArrowRight />} disabled={pending || !type}>
        {pending ? t("saving") : t("continue")}
      </Button>
    </form>
  );
}
