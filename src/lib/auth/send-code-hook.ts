import "server-only";
import { Webhook } from "standardwebhooks";
import { z } from "zod";
import { normalisePhoneKE } from "@/lib/phone";
import { sendAuthCode, whatsAppConfig, type WhatsAppConfig } from "@/lib/whatsapp-cloud";

/** The part of Supabase's Send SMS hook payload we use. */
const payloadSchema = z.object({
  user: z.object({
    phone: z.string().min(5),
  }),
  sms: z.object({ otp: z.string().regex(/^\d{4,10}$/) }),
});

type HookDeps = {
  secret: string | undefined;
  whatsApp: WhatsAppConfig | null;
  production: boolean;
  send?: typeof sendAuthCode;
  log?: (message: string) => void;
};

/** Supabase expects `{}` with 200 on success, or `{ error: { http_code, message } }`. */
function hookError(status: number, message: string) {
  return Response.json({ error: { http_code: status, message } }, { status });
}

/**
 * Handles Supabase Auth's Send SMS hook: verify the signature, then send the code on WhatsApp.
 * Without WhatsApp credentials (development) the code goes to the server log instead.
 */
export async function handleSendCodeHook(request: Request, deps: HookDeps): Promise<Response> {
  const { secret, whatsApp, production, send = sendAuthCode, log = console.info } = deps;
  if (!secret) return hookError(500, "SEND_CODE_HOOK_SECRET is not set");

  const body = await request.text();
  let event: unknown;
  try {
    const wh = new Webhook(secret.replace(/^v1,whsec_/, ""));
    event = wh.verify(body, Object.fromEntries(request.headers));
  } catch {
    return hookError(401, "Invalid signature");
  }

  const parsed = payloadSchema.safeParse(event);
  if (!parsed.success) return hookError(400, "Unexpected payload");
  const { user, sms } = parsed.data;

  const raw = user.phone.startsWith("+") ? user.phone : `+${user.phone}`;
  const phone = normalisePhoneKE(raw) ?? raw;

  if (!whatsApp) {
    if (production) return hookError(500, "WhatsApp is not configured");
    log(`[login code] ${phone}: ${sms.otp}  (development: WhatsApp not configured)`);
    return Response.json({});
  }

  try {
    await send(whatsApp, phone, sms.otp);
  } catch (error) {
    console.error("WhatsApp send failed", error instanceof Error ? error.message : error);
    return hookError(502, "Could not send the code on WhatsApp");
  }
  return Response.json({});
}

export function hookDepsFromEnv(): HookDeps {
  return {
    secret: process.env.SEND_CODE_HOOK_SECRET,
    whatsApp: whatsAppConfig(),
    production: process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === "production",
  };
}
