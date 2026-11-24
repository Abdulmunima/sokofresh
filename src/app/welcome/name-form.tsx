"use client";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { createBusiness } from "@/app/setup/actions";
import { Field } from "@/components/setup/choice";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/onboarding";

export function NameForm() {
  const t = useTranslations("Setup");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await createBusiness(name);
          if (result && !result.ok) setError(t(`errors.${result.error ?? "failed"}`));
        });
      }}
    >
      <Field
        id="business-name"
        label={t("name.label")}
        placeholder={t("name.placeholder")}
        autoComplete="organization"
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={error ?? undefined}
      />
      {name.trim().length >= 2 && (
        <p className="bg-surface text-muted rounded-xl p-3 text-sm">
          {t("name.linkPreview")}{" "}
          <span className="text-foreground font-semibold break-all">/s/{slugify(name)}</span>
        </p>
      )}
      <Button
        type="submit"
        block
        icon={<ArrowRight />}
        disabled={pending || name.trim().length < 2}
      >
        {pending ? t("saving") : t("continue")}
      </Button>
    </form>
  );
}
