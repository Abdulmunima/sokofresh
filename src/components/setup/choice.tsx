"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

/** A big tappable option (radio or checkbox look), icon + words. */
export function Choice({
  selected,
  onSelect,
  icon,
  label,
  hint,
  role = "radio",
}: {
  selected: boolean;
  onSelect: () => void;
  icon?: ReactNode;
  label: string;
  hint?: string;
  role?: "radio" | "checkbox";
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      onClick={onSelect}
      className={cx(
        "flex min-h-14 w-full items-center gap-3 rounded-xl border-2 px-4 py-2 text-left",
        selected ? "border-brand bg-brand/8" : "border-border bg-background active:bg-surface",
      )}
    >
      {icon && <span className="text-brand shrink-0 [&>svg]:size-6">{icon}</span>}
      <span className="flex flex-1 flex-col">
        <span className="text-base font-semibold">{label}</span>
        {hint && <span className="text-muted text-sm">{hint}</span>}
      </span>
      <span
        aria-hidden
        className={cx(
          "flex size-6 shrink-0 items-center justify-center rounded-full border-2",
          selected ? "border-brand bg-brand text-brand-foreground" : "border-border",
        )}
      >
        {selected && <Check className="size-4" strokeWidth={3} />}
      </span>
    </button>
  );
}

/** A labelled text field with an error line. */
export function Field({
  id,
  label,
  error,
  ...input
}: React.ComponentProps<"input"> & { id: string; label: string; error?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-base font-semibold">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        className="border-border bg-background focus:border-brand aria-invalid:border-danger min-h-12 rounded-xl border-2 px-4 text-lg focus:outline-none"
        {...input}
      />
      {error && <p className="text-danger text-sm">{error}</p>}
    </div>
  );
}
