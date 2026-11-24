"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { formatPhoneKE, normalisePhoneKE } from "@/lib/phone";
import { cx } from "@/lib/cx";

type PhoneInputProps = {
  /** Form field name. The submitted value is E.164 (+2547…), or empty if invalid. */
  name: string;
  label?: string;
  defaultValue?: string | null;
  required?: boolean;
  autoFocus?: boolean;
  onValueChange?: (e164: string | null) => void;
};

/** Kenyan phone number. Accepts 07…, 01…, +254…; shows the problem in plain words. */
export function PhoneInput({
  name,
  label,
  defaultValue,
  required,
  autoFocus,
  onValueChange,
}: PhoneInputProps) {
  const t = useTranslations("Phone");
  const id = useId();
  const [raw, setRaw] = useState(formatPhoneKE(defaultValue));
  const [touched, setTouched] = useState(false);
  const e164 = normalisePhoneKE(raw);
  const showError = touched && raw.trim() !== "" && !e164;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-base font-semibold">
        {label ?? t("label")}
      </label>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="0712 345 678"
        value={raw}
        required={required}
        autoFocus={autoFocus}
        aria-invalid={showError}
        aria-describedby={`${id}-hint`}
        onChange={(e) => {
          setRaw(e.target.value);
          onValueChange?.(normalisePhoneKE(e.target.value));
        }}
        onBlur={() => setTouched(true)}
        className={cx(
          "bg-background min-h-12 rounded-xl border-2 px-4 text-lg tabular-nums",
          "focus:border-brand focus:outline-none",
          showError ? "border-danger" : "border-border",
        )}
      />
      <p id={`${id}-hint`} className={cx("text-sm", showError ? "text-danger" : "text-muted")}>
        {showError ? t("invalid") : t("hint")}
      </p>
      <input type="hidden" name={name} value={e164 ?? ""} />
    </div>
  );
}
