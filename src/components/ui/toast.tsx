"use client";

import { Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastOptions = {
  message: string;
  /** If given, the toast shows an Undo button. Prefer this over "Are you sure?" dialogs. */
  onUndo?: () => void;
  /** Called when the toast goes away without Undo (e.g. to commit a delayed change). */
  onExpire?: () => void;
  durationMs?: number;
};

type ToastState = ToastOptions & { id: number };

const ToastContext = createContext<((options: ToastOptions) => void) | null>(null);

export const UNDO_WINDOW_MS = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const nextId = useRef(1);

  const show = useCallback((options: ToastOptions) => {
    setToast((previous) => {
      previous?.onExpire?.(); // a new toast settles the previous one
      return { ...options, id: nextId.current++ };
    });
  }, []);

  return (
    <ToastContext value={show}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4"
      >
        {toast && <ToastView key={toast.id} toast={toast} onDone={() => setToast(null)} />}
      </div>
    </ToastContext>
  );
}

function ToastView({ toast, onDone }: { toast: ToastState; onDone: () => void }) {
  const t = useTranslations("Common");
  const settled = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (settled.current) return;
      settled.current = true;
      toast.onExpire?.();
      onDone();
    }, toast.durationMs ?? UNDO_WINDOW_MS);
    return () => clearTimeout(timer);
  }, [toast, onDone]);

  return (
    <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl bg-zinc-900 py-2 pr-2 pl-4 text-white shadow-lg">
      <p className="flex-1 text-base">{toast.message}</p>
      {toast.onUndo && (
        <button
          type="button"
          onClick={() => {
            if (settled.current) return;
            settled.current = true;
            toast.onUndo?.();
            onDone();
          }}
          className="inline-flex min-h-12 items-center gap-2 rounded-xl px-4 font-semibold text-lime-300 active:bg-white/10"
        >
          <Undo2 aria-hidden className="size-5" />
          {t("undo")}
        </button>
      )}
    </div>
  );
}

/** `const toast = useToast(); toast({ message, onUndo })` */
export function useToast() {
  const show = use(ToastContext);
  if (!show) throw new Error("useToast must be used inside <ToastProvider>");
  return show;
}
