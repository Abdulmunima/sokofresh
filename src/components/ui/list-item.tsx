import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

type ListItemProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Picture or icon on the left. */
  leading?: ReactNode;
  /** Amount, chip or button on the right. */
  trailing?: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
};

/** A WhatsApp-style row: tap anywhere on it. At least 64px tall. */
export function ListItem({
  title,
  subtitle,
  leading,
  trailing,
  href,
  onClick,
  className,
}: ListItemProps) {
  const content = (
    <>
      {leading && (
        <span className="bg-surface text-muted flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full [&>svg]:size-6">
          {leading}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="line-clamp-2 text-base leading-snug font-semibold">{title}</span>
        {subtitle && <span className="text-muted truncate text-sm">{subtitle}</span>}
      </span>
      {trailing && <span className="flex shrink-0 flex-col items-end gap-1">{trailing}</span>}
      {(href || onClick) && !trailing && (
        <ChevronRight aria-hidden className="text-muted size-5 shrink-0" />
      )}
    </>
  );
  const classes = cx(
    "flex min-h-16 w-full items-center gap-3 px-4 py-2 text-left",
    (href || onClick) && "active:bg-surface",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {content}
      </button>
    );
  }
  return <div className={classes}>{content}</div>;
}

/** A list of ListItems with dividers. */
export function List({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ul className={cx("divide-border divide-y", className)}>
      {Array.isArray(children) ? (
        children.map((child, i) => <li key={i}>{child}</li>)
      ) : (
        <li>{children}</li>
      )}
    </ul>
  );
}
