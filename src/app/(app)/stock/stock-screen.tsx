"use client";

import { CloudUpload, Package, Pencil, Search } from "lucide-react";
import { useOffline } from "next/offline";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EmptyState } from "@/components/shell/empty-state";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { MoneyText } from "@/components/ui/money-text";
import { StockStatusChip } from "@/components/ui/status-chip";
import { useToast } from "@/components/ui/toast";
import { parsePriceKES } from "@/lib/money";
import {
  applyOutbox,
  discard,
  enqueue,
  flushOutbox,
  readOutbox,
  type OutboxChange,
  type OutboxEntry,
} from "@/lib/outbox";
import {
  displayName,
  groupProducts,
  nextStockStatus,
  stockCounts,
  type StockCategory,
  type StockProduct,
  type StockStatus,
} from "@/lib/stock";
import { setPrice, setStockStatus } from "./actions";

const storage = () => window.localStorage;
let flushing = false;

export function StockScreen({
  products,
  categories,
}: {
  products: StockProduct[];
  categories: StockCategory[];
}) {
  const t = useTranslations("Stock");
  const tUnits = useTranslations("Setup.units");
  const toast = useToast();
  const router = useRouter();
  const nextOffline = useOffline();

  const [query, setQuery] = useState("");
  // Local overrides (optimistic changes not yet confirmed by a fresh server render).
  const [overrides, setOverrides] = useState<Record<string, Partial<StockProduct>>>({});
  const [pending, setPending] = useState<OutboxEntry[]>([]);
  const [editing, setEditing] = useState<StockProduct | null>(null);

  const isOffline = useCallback(() => nextOffline || !navigator.onLine, [nextOffline]);

  // Server data → pending offline changes → this session's optimistic changes.
  const list = useMemo(
    () => applyOutbox(products, pending).map((p) => ({ ...p, ...overrides[p.id] })),
    [products, pending, overrides],
  );
  const groups = useMemo(() => groupProducts(list, categories, query), [list, categories, query]);
  const counts = stockCounts(list);

  /**
   * Send every change waiting on this phone. Changes are always saved on the phone first,
   * so nothing is lost if the page closes or the connection drops mid-send.
   */
  const flush = useCallback(
    async ({ silent = false } = {}) => {
      if (flushing || !navigator.onLine) return;
      flushing = true;
      let sent = 0;
      const delivered: OutboxEntry[] = [];
      const rejected: OutboxEntry[] = [];
      try {
        // Keep going while changes made during sending are still waiting.
        for (let round = 0; round < 5 && readOutbox(storage()).length > 0; round++) {
          const result = await flushOutbox(storage(), async (e) => {
            try {
              const r =
                e.kind === "price"
                  ? await setPrice(e.productId, e.value, e.at)
                  : await setStockStatus(e.productId, e.value, e.at);
              if (r.ok) {
                delivered.push(e);
                return "sent";
              }
              if (r.error === "failed") return "offline";
              rejected.push(e);
              return "rejected";
            } catch {
              return "offline";
            }
          });
          sent += result.sent;
          if (result.remaining > 0 && !navigator.onLine) break;
        }
      } finally {
        flushing = false;
        // Keep showing what was just sent until fresh server data arrives (no flicker back
        // to the old value), then drop it from the "waiting" list.
        if (delivered.length) {
          setOverrides((o) => {
            const next = { ...o };
            for (const e of delivered) {
              next[e.productId] = {
                ...next[e.productId],
                ...(e.kind === "price" ? { price_kes: e.value } : { stock_status: e.value }),
              };
            }
            return next;
          });
        }
        setPending(readOutbox(storage()));
      }
      if (rejected.length) {
        // The server refused (e.g. product removed): show what the server has.
        toast({ message: t("errors.failed") });
        router.refresh();
      } else if (sent && !silent) {
        toast({ message: t("synced", { count: sent }) });
        router.refresh();
      }
    },
    [router, t, toast],
  );

  useEffect(() => {
    // Read what was saved on this phone earlier, then try to send it.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser storage once on mount
    setPending(readOutbox(storage()));
    void flush();
    const onOnline = () => void flush();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [flush]);

  useEffect(() => {
    if (!nextOffline) void flush();
  }, [nextOffline, flush]);

  // A fresh server render replaces optimistic overrides.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset when new server data arrives
    setOverrides({});
  }, [products]);

  /** Save one change: on the phone first, then sent (now if online, later if not). */
  const save = (change: OutboxChange, previous: Partial<StockProduct>, message: string) => {
    const patch: Partial<StockProduct> =
      change.kind === "price" ? { price_kes: change.value } : { stock_status: change.value };
    setOverrides((o) => ({ ...o, [change.productId]: { ...o[change.productId], ...patch } }));

    const undo = () => {
      // Still offline and not sent: just forget it. Otherwise send the opposite change.
      if (
        isOffline() &&
        readOutbox(storage()).some(
          (e) => e.kind === change.kind && e.productId === change.productId,
        )
      ) {
        discard(storage(), change);
        setPending(readOutbox(storage()));
        setOverrides((o) => ({
          ...o,
          [change.productId]: { ...o[change.productId], ...previous },
        }));
        return;
      }
      const back: OutboxChange =
        change.kind === "price"
          ? { kind: "price", productId: change.productId, value: previous.price_kes as number }
          : {
              kind: "stock_status",
              productId: change.productId,
              value: previous.stock_status as StockStatus,
            };
      save(back, patch, t("undone"));
    };

    // Saved on the phone first, then sent.
    enqueue(storage(), change);
    if (isOffline()) {
      setPending(readOutbox(storage()));
      toast({ message: t("savedOffline"), onUndo: undo });
      return;
    }
    toast({ message, onUndo: undo });
    void flush({ silent: true });
  };

  if (products.length === 0) {
    return <EmptyState icon={<Package />} title={t("emptyTitle")} body={t("emptyBody")} />;
  }

  return (
    <div className="flex flex-col">
      <div className="border-border bg-background sticky top-16 z-20 flex flex-col gap-2 border-b px-4 py-3">
        <label className="relative block">
          <span className="sr-only">{t("search")}</span>
          <Search
            aria-hidden
            className="text-muted pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search")}
            className="border-border bg-surface focus:border-brand focus:bg-background min-h-12 w-full rounded-xl border-2 pr-3 pl-10 text-base focus:outline-none"
          />
        </label>
        <p className="text-muted text-sm">
          {t("counts", { total: counts.total, low: counts.low, out: counts.out })}
          {pending.length > 0 && <> · {t("waitingToSend", { count: pending.length })}</>}
        </p>
      </div>

      {groups.length === 0 && (
        <p className="text-muted p-6 text-center">{t("noMatch", { query })}</p>
      )}

      {groups.map((group) => (
        <section
          key={group.key}
          aria-label={group.category ? displayName(group.category) : t("otherCategory")}
        >
          <h2 className="bg-surface text-muted px-4 py-2 text-sm font-bold tracking-wide uppercase">
            {group.category ? displayName(group.category) : t("otherCategory")}
          </h2>
          <ul className="divide-border divide-y">
            {group.products.map((p) => {
              const name = displayName(p);
              const waiting = pending.some((e) => e.productId === p.id);
              return (
                <li key={p.id} className="flex min-h-16 items-center gap-2 pr-3">
                  <button
                    type="button"
                    onClick={() => setEditing(p)}
                    aria-label={t("editPrice", { name })}
                    className="active:bg-surface flex min-h-16 min-w-0 flex-1 flex-col justify-center px-4 py-2 text-left"
                  >
                    <span className="truncate text-base font-semibold">{name}</span>
                    <span className="text-muted flex items-center gap-1 text-sm">
                      <MoneyText amount={p.price_kes} size="sm" className="text-foreground" />
                      <span>{tUnits(p.unit as "kg")}</span>
                      <Pencil aria-hidden className="ml-1 size-3.5" />
                    </span>
                    {waiting && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-amber-800">
                        <CloudUpload aria-hidden className="size-3.5" />
                        {t("notSentYet")}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = nextStockStatus(p.stock_status);
                      save(
                        { kind: "stock_status", productId: p.id, value: next },
                        { stock_status: p.stock_status },
                        t("statusChanged", { name, status: t(`status.${next}`) }),
                      );
                    }}
                    aria-label={t("changeStatus", { name, status: t(`status.${p.stock_status}`) })}
                    className="flex min-h-12 min-w-28 shrink-0 items-center justify-end rounded-xl"
                  >
                    <StockStatusChip status={p.stock_status} />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <PriceSheet
        product={editing}
        onClose={() => setEditing(null)}
        onSave={(p, price) => {
          setEditing(null);
          if (price === p.price_kes) return;
          save(
            { kind: "price", productId: p.id, value: price },
            { price_kes: p.price_kes },
            t("priceChanged", { name: displayName(p) }),
          );
        }}
      />
    </div>
  );
}

function PriceSheet({
  product,
  onClose,
  onSave,
}: {
  product: StockProduct | null;
  onClose: () => void;
  onSave: (p: StockProduct, price: number) => void;
}) {
  const t = useTranslations("Stock");
  const tUnits = useTranslations("Setup.units");
  const [text, setText] = useState("");
  const [error, setError] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!product) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- prefill when a product is opened
    setText(String(product.price_kes));
    setError(false);
    // Focus after the sheet opens so the number keypad comes up.
    const id = setTimeout(() => input.current?.select(), 50);
    return () => clearTimeout(id);
  }, [product]);

  return (
    <BottomSheet
      open={product !== null}
      onClose={onClose}
      title={product ? displayName(product) : ""}
    >
      {product && (
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const price = parsePriceKES(text);
            if (price === null) return setError(true);
            onSave(product, price);
          }}
        >
          <label htmlFor="price" className="text-base font-semibold">
            {t("priceLabel", { unit: tUnits(product.unit as "kg") })}
          </label>
          <div
            className="border-border focus-within:border-brand aria-invalid:border-danger flex min-h-14 items-center rounded-xl border-2 px-4"
            aria-invalid={error}
          >
            <span className="text-muted text-lg">Ksh</span>
            <input
              ref={input}
              id="price"
              inputMode="decimal"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full min-w-0 bg-transparent px-2 text-2xl font-semibold tabular-nums focus:outline-none"
            />
          </div>
          {error && (
            <p role="alert" className="text-danger">
              {t("errors.price")}
            </p>
          )}
          <Button type="submit" block>
            {t("savePrice")}
          </Button>
        </form>
      )}
    </BottomSheet>
  );
}
