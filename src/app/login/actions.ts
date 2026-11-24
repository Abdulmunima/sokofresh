"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalisePhoneKE } from "@/lib/phone";
import { safeNext } from "@/lib/auth/paths";

export type SendCodeResult =
  { ok: true; phone: string } | { ok: false; error: "invalid_phone" | "too_many" | "send_failed" };

export type VerifyCodeResult = {
  ok: false;
  error: "invalid_code" | "expired" | "too_many" | "failed";
};

/** Step 1: send a 6-digit code to this number on WhatsApp (creates the account if new). */
export async function sendCode(rawPhone: string): Promise<SendCodeResult> {
  const phone = normalisePhoneKE(rawPhone);
  if (!phone) return { ok: false, error: "invalid_phone" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: { shouldCreateUser: true },
  });
  if (error) {
    console.error("sendCode failed", error.status, error.code);
    return { ok: false, error: error.status === 429 ? "too_many" : "send_failed" };
  }
  return { ok: true, phone };
}

/** Step 2: check the code, claim any staff invite for this number, and go in. */
export async function verifyCode(
  phone: string,
  code: string,
  next?: string | null,
): Promise<VerifyCodeResult> {
  const e164 = normalisePhoneKE(phone);
  const token = code.replace(/\D/g, "");
  if (!e164 || token.length !== 6) return { ok: false, error: "invalid_code" };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ phone: e164, token, type: "sms" });
  if (error) {
    if (error.status === 429) return { ok: false, error: "too_many" };
    // Supabase answers "otp_expired" for wrong and for expired codes alike: one message covers both.
    return { ok: false, error: error.status && error.status < 500 ? "invalid_code" : "failed" };
  }

  // Someone invited this number as staff? Join that business now.
  const { error: claimError } = await supabase.rpc("claim_staff_invites");
  if (claimError) console.error("claim_staff_invites failed", claimError.code);

  redirect(safeNext(next));
}

/** Sign out on the server. The client then clears pages saved for offline use. */
export async function signOut() {
  const supabase = await createClient();
  // "local": end this phone's session only, not the same person's session on other phones.
  await supabase.auth.signOut({ scope: "local" });
}
