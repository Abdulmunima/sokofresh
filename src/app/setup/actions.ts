"use server";

import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getCurrentUser, requireManager } from "@/lib/auth/session";
import {
  BUSINESS_TYPES,
  businessNameSchema,
  deliverySchema,
  deliveryWindowRows,
  paymentMethodRows,
  paymentMethodsSchema,
  productRows,
  slugify,
  stepHref,
  type BusinessType,
  type DeliveryInput,
  type FieldErrors,
  type PaymentMethodsInput,
  type ProductDraft,
} from "@/lib/onboarding";
import { createClient } from "@/lib/supabase/server";

export type StepResult = { ok: false; error?: string; fields?: FieldErrors };

/** Step 1: create the business; the caller becomes its owner on a 30-day trial. */
export async function createBusiness(name: string): Promise<StepResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const parsed = businessNameSchema.safeParse(name);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "name_short" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_business", {
    p_name: parsed.data,
    p_slug: slugify(parsed.data),
    p_language: await getLocale(),
  });
  if (error) {
    if (error.message.includes("already_has_business")) redirect("/orders");
    console.error("create_business failed", error.code, error.message);
    return { ok: false, error: "failed" };
  }
  redirect(stepHref("type"));
}

/** Step 2 */
export async function saveBusinessType(type: BusinessType): Promise<StepResult> {
  const me = await requireManager();
  if (!BUSINESS_TYPES.includes(type)) return { ok: false, error: "failed" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("suppliers")
    .update({ business_type: type })
    .eq("id", me.supplierId);
  if (error) return { ok: false, error: "failed" };
  redirect(stepHref("payments"));
}

/** Step 3: replaces the business's payment methods with the ones switched on. */
export async function savePaymentMethods(input: PaymentMethodsInput): Promise<StepResult> {
  const me = await requireManager();
  const parsed = paymentMethodsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "failed" };
  const result = paymentMethodRows(parsed.data);
  if (!result.ok) return { ok: false, fields: result.errors };

  const supabase = await createClient();
  const del = await supabase.from("payment_methods").delete().eq("supplier_id", me.supplierId);
  if (del.error) return { ok: false, error: "failed" };
  if (result.rows.length) {
    const ins = await supabase
      .from("payment_methods")
      .insert(result.rows.map((r) => ({ ...r, supplier_id: me.supplierId })));
    if (ins.error) return { ok: false, error: "failed" };
  }
  redirect(stepHref("delivery"));
}

/** Step 4: replaces the delivery days that apply to all areas. */
export async function saveDelivery(input: DeliveryInput): Promise<StepResult> {
  const me = await requireManager();
  const parsed = deliverySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "failed" };

  const supabase = await createClient();
  const del = await supabase
    .from("delivery_windows")
    .delete()
    .eq("supplier_id", me.supplierId)
    .is("zone_id", null);
  if (del.error) return { ok: false, error: "failed" };
  const rows = deliveryWindowRows(parsed.data);
  if (rows.length) {
    const ins = await supabase
      .from("delivery_windows")
      .insert(rows.map((r) => ({ ...r, supplier_id: me.supplierId })));
    if (ins.error) return { ok: false, error: "failed" };
  }
  redirect(stepHref("products"));
}

/** Step 5: adds the first products, then the wizard is done. */
export async function saveFirstProducts(drafts: ProductDraft[]): Promise<StepResult> {
  const me = await requireManager();
  const result = productRows(drafts);
  if (!result.ok) return { ok: false, fields: result.errors };
  if (result.rows.length) {
    const supabase = await createClient();
    const { error } = await supabase
      .from("products")
      .insert(result.rows.map((r) => ({ ...r, supplier_id: me.supplierId })));
    if (error)
      return { ok: false, error: error.message.includes("plan_limit") ? "plan_limit" : "failed" };
  }
  redirect(stepHref("done"));
}
