import { z } from "zod";
import type { Enum, Insert } from "@/lib/supabase/types";
import { parsePriceKES } from "@/lib/money";
import { normalisePhoneKE } from "@/lib/phone";

// ── Step 1: business name → order link ─────────────────────────────────

/** "Mama Mboga Wholesale" → "mama-mboga-wholesale" (letters, digits and dashes only). */
export function slugify(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // é → e
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
    .replace(/-+$/g, "");
  return slug || "shop";
}

export const businessNameSchema = z.string().trim().min(2, "name_short").max(80, "name_long");

// ── Step 2: business type ──────────────────────────────────────────────

export const BUSINESS_TYPES = [
  "produce",
  "meat_fish",
  "dry_goods",
  "beverages",
  "packaging",
  "other",
] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

// ── Step 3: payment methods (shown to customers; we never touch the money) ──

const digits = (min: number, max: number) =>
  z
    .string()
    .trim()
    .transform((v) => v.replace(/\s/g, ""))
    .pipe(z.string().regex(new RegExp(`^\\d{${min},${max}}$`), "number_invalid"));

export const paymentMethodsSchema = z.object({
  cash: z.boolean(),
  till: z.object({ on: z.boolean(), number: z.string() }),
  paybill: z.object({ on: z.boolean(), number: z.string(), account: z.string() }),
  sendMoney: z.object({ on: z.boolean(), phone: z.string() }),
  bank: z.object({
    on: z.boolean(),
    bank: z.string(),
    accountName: z.string(),
    accountNumber: z.string(),
  }),
});
export type PaymentMethodsInput = z.infer<typeof paymentMethodsSchema>;

export type PaymentMethodRow = Pick<
  Insert<"payment_methods">,
  "type" | "label" | "details" | "sort"
>;

export type FieldErrors = Record<string, string>;

/** Turn the form into payment_methods rows, or field errors ("till.number" → "number_invalid"). */
export function paymentMethodRows(
  input: PaymentMethodsInput,
): { ok: true; rows: PaymentMethodRow[] } | { ok: false; errors: FieldErrors } {
  const rows: PaymentMethodRow[] = [];
  const errors: FieldErrors = {};
  let sort = 0;

  if (input.till.on) {
    const n = digits(5, 7).safeParse(input.till.number);
    if (!n.success) errors["till.number"] = "number_invalid";
    else
      rows.push({
        type: "mpesa_till",
        label: `Till ${n.data}`,
        details: { till_number: n.data },
        sort: ++sort,
      });
  }
  if (input.paybill.on) {
    const n = digits(5, 7).safeParse(input.paybill.number);
    const account = input.paybill.account.trim();
    if (!n.success) errors["paybill.number"] = "number_invalid";
    else
      rows.push({
        type: "mpesa_paybill",
        label: `Paybill ${n.data}`,
        details: { paybill: n.data, account_format: account || null },
        sort: ++sort,
      });
  }
  if (input.sendMoney.on) {
    const phone = normalisePhoneKE(input.sendMoney.phone);
    if (!phone) errors["sendMoney.phone"] = "phone_invalid";
    else
      rows.push({
        type: "mpesa_send_money",
        label: "Send Money",
        details: { phone },
        sort: ++sort,
      });
  }
  if (input.bank.on) {
    const bank = input.bank.bank.trim();
    const accountName = input.bank.accountName.trim();
    const accountNumber = input.bank.accountNumber.replace(/\s/g, "");
    if (bank.length < 2) errors["bank.bank"] = "required";
    if (accountName.length < 2) errors["bank.accountName"] = "required";
    if (!/^[0-9A-Za-z-]{5,30}$/.test(accountNumber))
      errors["bank.accountNumber"] = "number_invalid";
    if (!errors["bank.bank"] && !errors["bank.accountName"] && !errors["bank.accountNumber"]) {
      rows.push({
        type: "bank",
        label: bank,
        details: { bank, account_name: accountName, account_number: accountNumber },
        sort: ++sort,
      });
    }
  }
  if (input.cash) rows.push({ type: "cash", label: "Cash", details: {}, sort: ++sort });

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, rows };
}

// ── Step 4: delivery days ──────────────────────────────────────────────

export const WINDOW_PRESETS = {
  morning: { start: "06:00", end: "10:00" },
  midday: { start: "10:00", end: "14:00" },
  afternoon: { start: "14:00", end: "18:00" },
} as const;
export type WindowPreset = keyof typeof WINDOW_PRESETS;

/** When customers must order by. */
export const CUTOFF_PRESETS = ["evening_before", "noon_before", "two_hours"] as const;
export type CutoffPreset = (typeof CUTOFF_PRESETS)[number];

export const deliverySchema = z.object({
  days: z.array(z.number().int().min(0).max(6)).max(7),
  window: z.enum(Object.keys(WINDOW_PRESETS) as [WindowPreset, ...WindowPreset[]]),
  cutoff: z.enum(CUTOFF_PRESETS),
});
export type DeliveryInput = z.infer<typeof deliverySchema>;

/** Hours between the cut-off and the start of the delivery window. */
export function cutoffHours(window: WindowPreset, cutoff: CutoffPreset): number {
  const startHour = Number(WINDOW_PRESETS[window].start.slice(0, 2));
  switch (cutoff) {
    case "evening_before":
      return startHour + 24 - 18; // 6pm the day before
    case "noon_before":
      return startHour + 24 - 12; // 12 noon the day before
    case "two_hours":
      return 2;
  }
}

export function deliveryWindowRows(input: DeliveryInput) {
  const { start, end } = WINDOW_PRESETS[input.window];
  const hours = cutoffHours(input.window, input.cutoff);
  return [...new Set(input.days)].sort().map((weekday) => ({
    weekday,
    start_time: start,
    end_time: end,
    cutoff_hours_before: hours,
    zone_id: null,
  }));
}

/** Defaults: Monday–Saturday mornings, order by 6pm the day before. */
export const DEFAULT_DELIVERY: DeliveryInput = {
  days: [1, 2, 3, 4, 5, 6],
  window: "morning",
  cutoff: "evening_before",
};

// ── Step 5: first products ─────────────────────────────────────────────

export const UNITS = ["kg", "crate", "bag", "piece", "bunch", "tray", "litre", "box"] as const;
export type Unit = (typeof UNITS)[number];

export type ProductDraft = { name: string; unit: string; price: string };

export type ProductRow = Pick<
  Insert<"products">,
  "name" | "unit" | "price_kes" | "sort" | "stock_status"
>;

/** Up to 5 rows; empty rows are ignored. Prices accept "2,500" and "2500.50". */
export function productRows(
  drafts: ProductDraft[],
): { ok: true; rows: ProductRow[] } | { ok: false; errors: FieldErrors } {
  const rows: ProductRow[] = [];
  const errors: FieldErrors = {};
  drafts.slice(0, 5).forEach((d, i) => {
    const name = d.name.trim();
    if (!name && !d.price.trim()) return; // empty row
    if (name.length < 2 || name.length > 60) errors[`${i}.name`] = "required";
    const price = parsePriceKES(d.price);
    if (price === null) errors[`${i}.price`] = "price_invalid";
    const unit = (UNITS as readonly string[]).includes(d.unit) ? d.unit : "piece";
    if (!errors[`${i}.name`] && !errors[`${i}.price`]) {
      rows.push({
        name,
        unit,
        price_kes: price as number,
        sort: rows.length + 1,
        stock_status: "in_stock" satisfies Enum<"stock_status">,
      });
    }
  });
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, rows };
}

// ── Steps ──────────────────────────────────────────────────────────────

export const SETUP_STEPS = ["name", "type", "payments", "delivery", "products"] as const;
export type SetupStep = (typeof SETUP_STEPS)[number];

export function stepHref(step: SetupStep | "done"): string {
  if (step === "done") return "/orders";
  return step === "name" ? "/welcome" : `/setup/${step}`;
}

export function nextStep(step: SetupStep): SetupStep | "done" {
  const i = SETUP_STEPS.indexOf(step);
  return SETUP_STEPS[i + 1] ?? "done";
}
