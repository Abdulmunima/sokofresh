import { describe, expect, it } from "vitest";
import {
  cutoffHours,
  DEFAULT_DELIVERY,
  deliveryWindowRows,
  nextStep,
  paymentMethodRows,
  productRows,
  slugify,
  stepHref,
  type PaymentMethodsInput,
} from "./onboarding";

describe("slugify", () => {
  it.each([
    ["Mama Mboga Wholesale", "mama-mboga-wholesale"],
    ["  Kamau & Sons  ", "kamau-and-sons"],
    ["Wanjiku's Fresh Produce!!", "wanjikus-fresh-produce"],
    ["Café Délice", "cafe-delice"],
    ["Duka #1 — Gikomba", "duka-1-gikomba"],
    ["!!!", "shop"],
  ])("%j → %s", (name, slug) => expect(slugify(name)).toBe(slug));

  it("keeps links short and never ends with a dash", () => {
    const slug = slugify("A".repeat(49) + " bcd");
    expect(slug.length).toBeLessThanOrEqual(50);
    expect(slug.endsWith("-")).toBe(false);
  });
});

const noMethods: PaymentMethodsInput = {
  cash: false,
  till: { on: false, number: "" },
  paybill: { on: false, number: "", account: "" },
  sendMoney: { on: false, phone: "" },
  bank: { on: false, bank: "", accountName: "", accountNumber: "" },
};

describe("paymentMethodRows", () => {
  it("builds rows for each method that is switched on", () => {
    const result = paymentMethodRows({
      ...noMethods,
      cash: true,
      till: { on: true, number: "522 533" },
      paybill: { on: true, number: "247247", account: "Your name" },
      sendMoney: { on: true, phone: "0712 345 678" },
    });
    expect(result).toEqual({
      ok: true,
      rows: [
        { type: "mpesa_till", label: "Till 522533", details: { till_number: "522533" }, sort: 1 },
        {
          type: "mpesa_paybill",
          label: "Paybill 247247",
          details: { paybill: "247247", account_format: "Your name" },
          sort: 2,
        },
        {
          type: "mpesa_send_money",
          label: "Send Money",
          details: { phone: "+254712345678" },
          sort: 3,
        },
        { type: "cash", label: "Cash", details: {}, sort: 4 },
      ],
    });
  });

  it("ignores details of methods that are off", () => {
    expect(paymentMethodRows({ ...noMethods, till: { on: false, number: "x" } })).toEqual({
      ok: true,
      rows: [],
    });
  });

  it("explains which field is wrong", () => {
    expect(
      paymentMethodRows({
        ...noMethods,
        till: { on: true, number: "12" },
        sendMoney: { on: true, phone: "0712" },
        bank: { on: true, bank: "", accountName: "Mama Mboga", accountNumber: "12" },
      }),
    ).toEqual({
      ok: false,
      errors: {
        "till.number": "number_invalid",
        "sendMoney.phone": "phone_invalid",
        "bank.bank": "required",
        "bank.accountNumber": "number_invalid",
      },
    });
  });
});

describe("delivery", () => {
  it("order by 6pm the day before a 6am delivery is 12 hours", () => {
    expect(cutoffHours("morning", "evening_before")).toBe(12);
    expect(cutoffHours("afternoon", "noon_before")).toBe(26);
    expect(cutoffHours("midday", "two_hours")).toBe(2);
  });

  it("defaults to Monday–Saturday mornings", () => {
    const rows = deliveryWindowRows(DEFAULT_DELIVERY);
    expect(rows.map((r) => r.weekday)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(rows[0]).toEqual({
      weekday: 1,
      start_time: "06:00",
      end_time: "10:00",
      cutoff_hours_before: 12,
      zone_id: null,
    });
  });

  it("ignores repeated days", () => {
    expect(
      deliveryWindowRows({ ...DEFAULT_DELIVERY, days: [3, 3, 0] }).map((r) => r.weekday),
    ).toEqual([0, 3]);
  });
});

describe("productRows", () => {
  it("keeps filled rows, skips empty ones, reads prices like 2,500", () => {
    expect(
      productRows([
        { name: "Tomatoes", unit: "crate", price: "3,200" },
        { name: "", unit: "kg", price: "" },
        { name: " Sukuma wiki ", unit: "bunch", price: "Ksh 30" },
      ]),
    ).toEqual({
      ok: true,
      rows: [
        { name: "Tomatoes", unit: "crate", price_kes: 3200, sort: 1, stock_status: "in_stock" },
        { name: "Sukuma wiki", unit: "bunch", price_kes: 30, sort: 2, stock_status: "in_stock" },
      ],
    });
  });

  it("points at the row with a problem", () => {
    expect(
      productRows([
        { name: "Tomatoes", unit: "crate", price: "" },
        { name: "X", unit: "kg", price: "10" },
      ]),
    ).toEqual({ ok: false, errors: { "0.price": "price_invalid", "1.name": "required" } });
  });

  it("falls back to 'piece' for an unknown unit", () => {
    const result = productRows([{ name: "Eggs", unit: "dozen", price: "450" }]);
    expect(result.ok && result.rows[0].unit).toBe("piece");
  });
});

describe("steps", () => {
  it("go name → type → payments → delivery → products → done", () => {
    expect(nextStep("name")).toBe("type");
    expect(nextStep("products")).toBe("done");
    expect(stepHref("name")).toBe("/welcome");
    expect(stepHref("delivery")).toBe("/setup/delivery");
    expect(stepHref("done")).toBe("/orders");
  });
});
