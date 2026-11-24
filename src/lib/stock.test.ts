import { describe, expect, it } from "vitest";
import {
  displayName,
  groupProducts,
  matchesSearch,
  nextStockStatus,
  stockCounts,
  type StockCategory,
  type StockProduct,
} from "./stock";

const veg: StockCategory = { id: "veg", name: "Vegetables", name_sw: "Mboga", sort: 1 };
const fruit: StockCategory = { id: "fruit", name: "Fruit", name_sw: "Matunda", sort: 2 };
const p = (
  id: string,
  name: string,
  category_id: string | null,
  sort: number,
  extra: Partial<StockProduct> = {},
): StockProduct => ({
  id,
  name,
  name_sw: null,
  unit: "kg",
  price_kes: 100,
  stock_status: "in_stock",
  category_id,
  sort,
  ...extra,
});

describe("nextStockStatus", () => {
  it("cycles In stock → Low → Out → In stock", () => {
    expect(nextStockStatus("in_stock")).toBe("low");
    expect(nextStockStatus("low")).toBe("out");
    expect(nextStockStatus("out")).toBe("in_stock");
  });
});

describe("names and search", () => {
  const tomato = { name: "Tomatoes", name_sw: "Nyanya" };
  it("shows the Swahili name when there is one", () => {
    expect(displayName(tomato, "sw")).toBe("Nyanya");
    expect(displayName(tomato, "en")).toBe("Tomatoes");
    expect(displayName({ name: "Rice", name_sw: null }, "sw")).toBe("Rice");
  });
  it("finds by either name, ignoring case and accents", () => {
    expect(matchesSearch(tomato, "nyan")).toBe(true);
    expect(matchesSearch(tomato, "TOMA")).toBe(true);
    expect(matchesSearch({ name: "Café beans", name_sw: null }, "cafe")).toBe(true);
    expect(matchesSearch(tomato, "onion")).toBe(false);
    expect(matchesSearch(tomato, "  ")).toBe(true);
  });
});

describe("groupProducts", () => {
  const products = [
    p("a", "Mangoes", "fruit", 2),
    p("b", "Tomatoes", "veg", 1),
    p("c", "Onions", "veg", 2),
    p("d", "Bags", null, 1),
    p("e", "Bananas", "fruit", 1),
  ];
  it("groups by category in category order, uncategorised last", () => {
    const groups = groupProducts(products, [fruit, veg]);
    expect(groups.map((g) => g.key)).toEqual(["veg", "fruit", "none"]);
    expect(groups[0].products.map((x) => x.name)).toEqual(["Tomatoes", "Onions"]);
    expect(groups[1].products.map((x) => x.name)).toEqual(["Bananas", "Mangoes"]);
  });
  it("leaves out empty groups when searching", () => {
    const groups = groupProducts(products, [veg, fruit], "ban");
    expect(groups.map((g) => g.key)).toEqual(["fruit"]);
  });
  it("treats an unknown category as uncategorised", () => {
    expect(groupProducts([p("x", "X", "gone", 1)], [veg])[0].key).toBe("none");
  });
});

describe("stockCounts", () => {
  it("counts low and out", () => {
    expect(
      stockCounts([
        p("a", "A", null, 1),
        p("b", "B", null, 2, { stock_status: "low" }),
        p("c", "C", null, 3, { stock_status: "out" }),
      ]),
    ).toEqual({ total: 3, low: 1, out: 1 });
  });
});
