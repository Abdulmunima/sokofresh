"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { saveFirstProducts } from "@/app/setup/actions";
import { Button } from "@/components/ui/button";
import { UNITS, type FieldErrors, type ProductDraft } from "@/lib/onboarding";

const ROWS = 5;

export function ProductsForm() {
  const t = useTranslations("Setup");
  const [rows, setRows] = useState<ProductDraft[]>(
    Array.from({ length: ROWS }, () => ({ name: "", unit: "kg", price: "" })),
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failed, setFailed] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const update = (i: number, patch: Partial<ProductDraft>) =>
    setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setFailed(null);
        startTransition(async () => {
          const result = await saveFirstProducts(rows);
          if (result && !result.ok) {
            setErrors(result.fields ?? {});
            if (result.error) setFailed(t(`errors.${result.error}`));
          }
        });
      }}
    >
      {rows.map((row, i) => (
        <fieldset key={i} className="border-border flex flex-col gap-2 rounded-xl border p-3">
          <legend className="text-muted px-1 text-sm font-semibold">
            {t("products.number", { n: i + 1 })}
          </legend>
          <label className="sr-only" htmlFor={`p${i}-name`}>
            {t("products.name")}
          </label>
          <input
            id={`p${i}-name`}
            placeholder={t(`products.examples.${i}`)}
            value={row.name}
            aria-invalid={Boolean(errors[`${i}.name`])}
            onChange={(e) => update(i, { name: e.target.value })}
            className="border-border focus:border-brand aria-invalid:border-danger min-h-12 rounded-xl border-2 px-4 text-lg focus:outline-none"
          />
          <div className="flex gap-2">
            <label className="sr-only" htmlFor={`p${i}-unit`}>
              {t("products.unit")}
            </label>
            <select
              id={`p${i}-unit`}
              value={row.unit}
              onChange={(e) => update(i, { unit: e.target.value })}
              className="border-border bg-background min-h-12 flex-1 rounded-xl border-2 px-3 text-base"
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {t(`units.${u}`)}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor={`p${i}-price`}>
              {t("products.price")}
            </label>
            <div
              className="border-border focus-within:border-brand aria-invalid:border-danger flex min-h-12 flex-1 items-center rounded-xl border-2 px-3"
              aria-invalid={Boolean(errors[`${i}.price`])}
            >
              <span className="text-muted text-sm">Ksh</span>
              <input
                id={`p${i}-price`}
                inputMode="decimal"
                placeholder="0"
                value={row.price}
                onChange={(e) => update(i, { price: e.target.value })}
                className="w-full min-w-0 bg-transparent px-2 text-lg tabular-nums focus:outline-none"
              />
            </div>
          </div>
          {(errors[`${i}.name`] || errors[`${i}.price`]) && (
            <p className="text-danger text-sm">
              {t(`errors.${errors[`${i}.name`] ? "product_name" : "price_invalid"}`)}
            </p>
          )}
        </fieldset>
      ))}
      {failed && (
        <p role="alert" className="text-danger">
          {failed}
        </p>
      )}
      <Button type="submit" block icon={<Check />} disabled={pending}>
        {pending ? t("saving") : t("finish")}
      </Button>
    </form>
  );
}
