import type { Enum, Row } from "@/lib/supabase/types";

export type StockStatus = Enum<"stock_status">;
export type StockProduct = Pick<
  Row<"products">,
  "id" | "name" | "name_sw" | "unit" | "price_kes" | "stock_status" | "category_id" | "sort"
> &
  Partial<Pick<Row<"products">, "price_changed_at" | "stock_changed_at">>;
export type StockCategory = Pick<Row<"categories">, "id" | "name" | "name_sw" | "sort">;

const CYCLE: StockStatus[] = ["in_stock", "low", "out"];

/** One tap moves In stock → Low → Out → In stock. */
export function nextStockStatus(status: StockStatus): StockStatus {
  return CYCLE[(CYCLE.indexOf(status) + 1) % CYCLE.length];
}

/** The name shown in the app (English; the optional Swahili name only helps search). */
export function displayName(item: { name: string }): string {
  return item.name;
}

/** Case- and accent-insensitive match on the name (or the optional Swahili name, e.g. "nyanya"). */
export function matchesSearch(
  item: { name: string; name_sw: string | null },
  query: string,
): boolean {
  const fold = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const q = fold(query.trim());
  if (!q) return true;
  return fold(item.name).includes(q) || (item.name_sw ? fold(item.name_sw).includes(q) : false);
}

export type ProductGroup = {
  key: string;
  category: StockCategory | null;
  products: StockProduct[];
};

/** Products grouped by category (category order, then product order); uncategorised last. */
export function groupProducts(
  products: StockProduct[],
  categories: StockCategory[],
  query = "",
): ProductGroup[] {
  const byCategory = new Map<string | null, StockProduct[]>();
  for (const p of products) {
    if (!matchesSearch(p, query)) continue;
    const key =
      p.category_id && categories.some((c) => c.id === p.category_id) ? p.category_id : null;
    byCategory.set(key, [...(byCategory.get(key) ?? []), p]);
  }
  const sortProducts = (list: StockProduct[]) =>
    [...list].sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name));
  const groups: ProductGroup[] = [...categories]
    .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name))
    .filter((c) => byCategory.has(c.id))
    .map((c) => ({ key: c.id, category: c, products: sortProducts(byCategory.get(c.id)!) }));
  if (byCategory.has(null)) {
    groups.push({ key: "none", category: null, products: sortProducts(byCategory.get(null)!) });
  }
  return groups;
}

/** Counts for the header: how many are low or out. */
export function stockCounts(products: StockProduct[]) {
  return {
    total: products.length,
    low: products.filter((p) => p.stock_status === "low").length,
    out: products.filter((p) => p.stock_status === "out").length,
  };
}
