import type { ComponentProps, ReactNode } from "react";
import { cx } from "@/lib/cx";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-brand-foreground active:bg-brand-strong",
  secondary: "border-2 border-brand bg-background text-brand active:bg-surface",
  ghost: "bg-transparent text-foreground active:bg-surface",
  danger: "bg-danger text-white active:opacity-90",
};

type ButtonProps = ComponentProps<"button"> & {
  variant?: Variant;
  /** Icon shown before the label (icons + words, never icon alone). */
  icon?: ReactNode;
  /** Full width, for the one main action on a screen. */
  block?: boolean;
};

/** Big tap target (min 48px), one clear label. */
export function Button({
  variant = "primary",
  icon,
  block,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-base font-semibold",
        "focus-visible:ring-brand/40 focus-visible:ring-4 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        block && "w-full",
        className,
      )}
      {...props}
    >
      {icon && (
        <span aria-hidden className="shrink-0 [&>svg]:size-5">
          {icon}
        </span>
      )}
      {children}
    </button>
  );
}
