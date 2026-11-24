/**
 * Changes made while offline, kept on the phone until they can be sent (CLAUDE.md:
 * "Stock and order screens should keep working offline and sync later").
 *
 * Stored in localStorage so they survive closing the app. One entry per product+field:
 * a later change replaces an earlier one ("last change wins").
 */
export type OutboxChange =
  | { kind: "stock_status"; productId: string; value: "in_stock" | "low" | "out" }
  | { kind: "price"; productId: string; value: number };

export type OutboxEntry = OutboxChange & { at: number };

type Storage = Pick<globalThis.Storage, "getItem" | "setItem">;

const KEY = "sokofresh:outbox:v1";

function key(c: OutboxChange) {
  return `${c.kind}:${c.productId}`;
}

export function readOutbox(storage: Storage): OutboxEntry[] {
  try {
    const parsed = JSON.parse(storage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(storage: Storage, entries: OutboxEntry[]) {
  try {
    storage.setItem(KEY, JSON.stringify(entries));
  } catch {
    // Storage full or blocked: the change stays on screen until the page reloads.
  }
}

export function enqueue(storage: Storage, change: OutboxChange, now = Date.now()): OutboxEntry[] {
  const entries = readOutbox(storage).filter((e) => key(e) !== key(change));
  entries.push({ ...change, at: now } as OutboxEntry);
  write(storage, entries);
  return entries;
}

/** Drop a pending change (e.g. Undo while still offline). */
export function discard(storage: Storage, change: Pick<OutboxChange, "kind" | "productId">) {
  write(
    storage,
    readOutbox(storage).filter(
      (e) => !(e.kind === change.kind && e.productId === change.productId),
    ),
  );
}

/**
 * Send pending changes oldest first. Entries that were sent, or that the server refused
 * for good (e.g. product deleted), are removed; anything that failed to reach the server stays.
 */
export async function flushOutbox(
  storage: Storage,
  send: (change: OutboxEntry) => Promise<"sent" | "rejected" | "offline">,
): Promise<{ sent: number; remaining: number }> {
  let sent = 0;
  for (const entry of [...readOutbox(storage)].sort((a, b) => a.at - b.at)) {
    const result = await send(entry);
    if (result === "offline") break;
    // Remove only this exact entry: a newer change made meanwhile must stay.
    write(
      storage,
      readOutbox(storage).filter((e) => !(key(e) === key(entry) && e.at === entry.at)),
    );
    if (result === "sent") sent++;
  }
  return { sent, remaining: readOutbox(storage).length };
}

/** Apply pending changes on top of what the server (or the saved page) says. */
export function applyOutbox<T extends { id: string; stock_status: string; price_kes: number }>(
  products: T[],
  entries: OutboxEntry[],
): T[] {
  return products.map((p) => {
    let next = p;
    for (const e of entries) {
      if (e.productId !== p.id) continue;
      next =
        e.kind === "price" ? { ...next, price_kes: e.value } : { ...next, stock_status: e.value };
    }
    return next;
  });
}
