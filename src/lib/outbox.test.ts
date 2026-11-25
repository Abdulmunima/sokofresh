import { describe, expect, it } from "vitest";
import { applyOutbox, discard, enqueue, flushOutbox, readOutbox, readRecent } from "./outbox";

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  };
}

describe("outbox", () => {
  it("keeps only the latest change per product and field", () => {
    const s = memoryStorage();
    enqueue(s, { kind: "stock_status", productId: "a", value: "low" }, 1);
    enqueue(s, { kind: "price", productId: "a", value: 100 }, 2);
    enqueue(s, { kind: "stock_status", productId: "a", value: "out" }, 3);
    expect(readOutbox(s)).toEqual([
      { kind: "price", productId: "a", value: 100, at: 2 },
      { kind: "stock_status", productId: "a", value: "out", at: 3 },
    ]);
  });

  it("survives junk in storage", () => {
    const s = memoryStorage();
    s.setItem("sokofresh:outbox:v1", "{not json");
    expect(readOutbox(s)).toEqual([]);
  });

  it("sends oldest first and stops when the connection drops", async () => {
    const s = memoryStorage();
    enqueue(s, { kind: "price", productId: "b", value: 50 }, 2);
    enqueue(s, { kind: "price", productId: "a", value: 10 }, 1);
    const sentOrder: string[] = [];
    const result = await flushOutbox(s, async (e) => {
      sentOrder.push(e.productId);
      return e.productId === "a" ? "sent" : "offline";
    });
    expect(sentOrder).toEqual(["a", "b"]);
    expect(result).toEqual({ sent: 1, remaining: 1 });
    expect(readOutbox(s).map((e) => e.productId)).toEqual(["b"]);
  });

  it("drops changes the server refuses for good", async () => {
    const s = memoryStorage();
    enqueue(s, { kind: "price", productId: "gone", value: 1 }, 1);
    expect(await flushOutbox(s, async () => "rejected")).toEqual({ sent: 0, remaining: 0 });
  });

  it("does not lose a newer change made while sending", async () => {
    const s = memoryStorage();
    enqueue(s, { kind: "price", productId: "a", value: 10 }, 1);
    await flushOutbox(s, async () => {
      enqueue(s, { kind: "price", productId: "a", value: 20 }, 5); // user typed again meanwhile
      return "sent";
    });
    expect(readOutbox(s)).toEqual([{ kind: "price", productId: "a", value: 20, at: 5 }]);
  });

  it("can discard a pending change (Undo while offline)", () => {
    const s = memoryStorage();
    enqueue(s, { kind: "price", productId: "a", value: 10 });
    discard(s, { kind: "price", productId: "a" });
    expect(readOutbox(s)).toEqual([]);
  });

  it("applies pending changes over saved data", () => {
    const products = [
      { id: "a", stock_status: "in_stock", price_kes: 100, name: "A" },
      { id: "b", stock_status: "low", price_kes: 5, name: "B" },
    ];
    expect(
      applyOutbox(products, [
        { kind: "stock_status", productId: "a", value: "out", at: 1 },
        { kind: "price", productId: "a", value: 120, at: 2 },
      ]),
    ).toEqual([
      { id: "a", stock_status: "out", price_kes: 120, name: "A" },
      { id: "b", stock_status: "low", price_kes: 5, name: "B" },
    ]);
  });

  it("remembers what was just sent", async () => {
    const s = memoryStorage();
    enqueue(s, { kind: "price", productId: "a", value: 60 }, 1);
    await flushOutbox(s, async () => "sent");
    expect(readRecent(s).map((e) => e.value)).toEqual([60]);
    expect(readRecent(s, Date.now() + 10 * 60_000)).toEqual([]); // forgotten after a few minutes
  });

  it("shows a just-sent change only if the server data is older than it", () => {
    const at = Date.parse("2026-11-25T07:50:22Z");
    const sent = [{ kind: "price" as const, productId: "a", value: 60, at }];
    const older = [
      {
        id: "a",
        stock_status: "in_stock",
        price_kes: 80,
        price_changed_at: "2026-11-25T07:50:20Z",
      },
    ];
    const newer = [
      {
        id: "a",
        stock_status: "in_stock",
        price_kes: 90,
        price_changed_at: "2026-11-25T07:55:00Z",
      },
    ];
    expect(applyOutbox(older, [], sent)[0].price_kes).toBe(60); // page loaded mid-send
    expect(applyOutbox(newer, [], sent)[0].price_kes).toBe(90); // someone changed it since
  });
});
