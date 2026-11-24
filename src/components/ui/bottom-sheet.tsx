"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, type ReactNode } from "react";

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

/** A panel that slides up from the bottom. Back button, Esc, the X or tapping outside closes it. */
export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const t = useTranslations("Common");
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose(); // tap on the backdrop
      }}
      className="sheet bg-background text-foreground m-0 mt-auto max-h-[85dvh] w-full max-w-none rounded-t-3xl p-0 backdrop:bg-black/40 sm:mx-auto sm:max-w-md"
    >
      <div className="flex flex-col gap-4 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div aria-hidden className="bg-border mx-auto h-1.5 w-12 rounded-full" />
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="active:bg-surface flex size-12 items-center justify-center rounded-full"
          >
            <X aria-hidden className="size-6" />
            <span className="sr-only">{t("close")}</span>
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
