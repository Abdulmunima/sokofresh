import { formatKES } from "@/lib/money";
import { cx } from "@/lib/cx";

type MoneyTextProps = {
  amount: number | string | null | undefined;
  /** "owed" shows red, "credit" shows green. */
  tone?: "default" | "owed" | "credit" | "muted";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const tones = {
  default: "text-foreground",
  owed: "text-danger",
  credit: "text-brand",
  muted: "text-muted",
};
const sizes = { sm: "text-sm", md: "text-base", lg: "text-xl", xl: "text-3xl" };

/** A KES amount. Tabular digits so columns of money line up. */
export function MoneyText({ amount, tone = "default", size = "md", className }: MoneyTextProps) {
  return (
    <span className={cx("font-semibold tabular-nums", tones[tone], sizes[size], className)}>
      {formatKES(amount)}
    </span>
  );
}
