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

/** `at`: when the change was made on the phone; `sentAt`: when the server confirmed it. */
export type OutboxEntry = OutboxChange & { at: number; sentAt?: number };

type Storage = Pick<globalThis.Storage, "getItem" | "setItem">;

const KEY = "sokofresh:outbox:v1";
/** Changes sent in the last few minutes (see applyOutbox). */
const RECENT_KEY = "sokofresh:outbox-recent:v1";
const RECENT_MS = 3 * 60_000;

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
export function readRecent(storage: Storage, now = Date.now()): OutboxEntry[] {
  try {
    const parsed = JSON.parse(storage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((e: OutboxEntry) => now - (e.sentAt ?? 0) < RECENT_MS)
      : [];
  } catch {
    return [];
  }
}

function rememberSent(storage: Storage, entry: OutboxEntry, now = Date.now()) {
  const recent = readRecent(storage, now).filter((e) => key(e) !== key(entry));
  recent.push({ ...entry, sentAt: now });
  try {
    storage.setItem(RECENT_KEY, JSON.stringify(recent));
  } catch {
    // not critical: only used to avoid showing an older value for a moment
  }
}

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
    if (result === "sent") {
      sent++;
      rememberSent(storage, entry);
    }
  }
  return { sent, remaining: readOutbox(storage).length };
}

type Changeable = {
  id: string;
  stock_status: string;
  price_kes: number;
  price_changed_at?: string | null;
  stock_changed_at?: string | null;
};

/**
 * What to show: the server's data, then changes still waiting to be sent (always), then
 * changes sent a moment ago — but only where the server data is older than that change
 * (e.g. the page was loaded while the change was on its way).
 */
export function applyOutbox<T extends Changeable>(
  products: T[],
  pending: OutboxEntry[],
  recent: OutboxEntry[] = [],
): T[] {
  const serverTime = (p: T, kind: OutboxEntry["kind"]) => {
    const iso = kind === "price" ? p.price_changed_at : p.stock_changed_at;
    return iso ? Date.parse(iso) : 0;
  };
  return products.map((p) => {
    let next = p;
    const apply = (e: OutboxEntry) => {
      next =
        e.kind === "price" ? { ...next, price_kes: e.value } : { ...next, stock_status: e.value };
    };
    for (const e of recent) if (e.productId === p.id && e.at > serverTime(p, e.kind)) apply(e);
    for (const e of pending) if (e.productId === p.id) apply(e);
    return next;
  });
}
