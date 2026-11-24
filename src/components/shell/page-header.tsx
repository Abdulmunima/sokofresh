import type { ReactNode } from "react";
import { LanguageSwitch } from "./language-switch";

/** Screen title with the language switch on the right. */
export function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <header className="border-border bg-background/95 sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b px-4 backdrop-blur">
      <h1 className="flex-1 truncate text-2xl font-bold">{title}</h1>
      {action}
      <LanguageSwitch variant="compact" />
    </header>
  );
}
