"use server";

import { requireMember } from "@/lib/auth/session";
import { parsePriceKES } from "@/lib/money";
import type { StockStatus } from "@/lib/stock";
import { createClient } from "@/lib/supabase/server";

/**
 * "stale": a newer change already reached the server, so this older one was ignored
 * (changes are saved on the phone first and can arrive late). Nothing to retry.
 */
export type StockActionResult =
  { ok: true; applied: boolean } | { ok: false; error: "not_found" | "invalid" | "failed" };

const STATUSES: StockStatus[] = ["in_stock", "low", "out"];

function changedAt(at: number): string | null {
  // Accept phone clocks within a sensible range; reject garbage.
  return Number.isFinite(at) && at > Date.UTC(2024, 0, 1) && at < Date.now() + 24 * 3600_000
    ? new Date(at).toISOString()
    : null;
}

/** Any member can mark stock and change prices (PRD F2). `at` = when the change was made. */
export async function setStockStatus(
  productId: string,
  status: StockStatus,
  at: number,
): Promise<StockActionResult> {
  await requireMember();
  const when = changedAt(at);
  if (!STATUSES.includes(status) || !when) return { ok: false, error: "invalid" };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("set_product_stock", {
    p_product_id: productId,
    p_status: status,
    p_changed_at: when,
  });
  if (error) return { ok: false, error: "failed" };
  if (data === "not_found") return { ok: false, error: "not_found" };
  return { ok: true, applied: data === "applied" };
}

export async function setPrice(
  productId: string,
  price: number,
  at: number,
): Promise<StockActionResult> {
  await requireMember();
  const value = parsePriceKES(String(price));
  const when = changedAt(at);
  if (value === null || !when) return { ok: false, error: "invalid" };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("set_product_price", {
    p_product_id: productId,
    p_price: value,
    p_changed_at: when,
  });
  if (error) return { ok: false, error: "failed" };
  if (data === "not_found") return { ok: false, error: "not_found" };
  return { ok: true, applied: data === "applied" };
}
