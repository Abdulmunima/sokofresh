import type { ReactNode } from "react";

/** Friendly placeholder for a list with nothing in it yet. */
export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <span className="bg-surface text-brand flex size-20 items-center justify-center rounded-full [&>svg]:size-10">
        {icon}
      </span>
      <h2 className="text-xl font-bold">{title}</h2>
      {body && <p className="text-muted max-w-xs text-base">{body}</p>}
      {action}
    </div>
  );
}
