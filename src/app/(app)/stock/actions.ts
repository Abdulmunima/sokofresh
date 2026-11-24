"use server";

import { requireMember } from "@/lib/auth/session";
import { parsePriceKES } from "@/lib/money";
import type { StockStatus } from "@/lib/stock";
import { createClient } from "@/lib/supabase/server";

export type StockActionResult =
  { ok: true } | { ok: false; error: "not_found" | "invalid" | "failed" };

const STATUSES: StockStatus[] = ["in_stock", "low", "out"];

/** Any member can mark stock and change prices (PRD F2). */
export async function setStockStatus(
  productId: string,
  status: StockStatus,
): Promise<StockActionResult> {
  const me = await requireMember();
  if (!STATUSES.includes(status)) return { ok: false, error: "invalid" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .update({ stock_status: status })
    .eq("supplier_id", me.supplierId)
    .eq("id", productId)
    .select("id");
  if (error) return { ok: false, error: "failed" };
  return data.length ? { ok: true } : { ok: false, error: "not_found" };
}

export async function setPrice(
  productId: string,
  price: number | string,
): Promise<StockActionResult> {
  const me = await requireMember();
  const value = typeof price === "number" ? parsePriceKES(String(price)) : parsePriceKES(price);
  if (value === null) return { ok: false, error: "invalid" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .update({ price_kes: value })
    .eq("supplier_id", me.supplierId)
    .eq("id", productId)
    .select("id");
  if (error) return { ok: false, error: "failed" };
  return data.length ? { ok: true } : { ok: false, error: "not_found" };
}
