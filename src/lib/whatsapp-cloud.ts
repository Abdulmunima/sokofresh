import "server-only";

/**
 * WhatsApp Business Platform (Cloud API). Phase 1 only uses it for login codes;
 * everything else is a free share link (lib/whatsapp.ts).
 *
 * Login codes use an approved template in the "Authentication" category with a
 * copy-code button. Meta requires the code in both the body and the button.
 */
export type WhatsAppConfig = {
  accessToken: string;
  phoneNumberId: string;
  template: string;
  apiVersion: string;
};

export function whatsAppConfig(env: NodeJS.ProcessEnv = process.env): WhatsAppConfig | null {
  const accessToken = env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID;
  if (!accessToken || !phoneNumberId) return null;
  return {
    accessToken,
    phoneNumberId,
    template: env.WHATSAPP_AUTH_TEMPLATE || "sokofresh_login_code",
    apiVersion: env.WHATSAPP_API_VERSION || "v23.0",
  };
}

export function authCodeMessage(
  toE164: string,
  code: string,
  language: "en" | "sw",
  template: string,
) {
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: toE164.replace(/^\+/, ""),
    type: "template",
    template: {
      name: template,
      language: { code: language },
      components: [
        { type: "body", parameters: [{ type: "text", text: code }] },
        { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: code }] },
      ],
    },
  };
}

export class WhatsAppError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function sendAuthCode(
  config: WhatsAppConfig,
  toE164: string,
  code: string,
  language: "en" | "sw",
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const res = await fetchImpl(
    `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(authCodeMessage(toE164, code, language, config.template)),
      signal: AbortSignal.timeout(8000),
    },
  );
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new WhatsAppError(
      body?.error?.message ?? `WhatsApp API returned ${res.status}`,
      res.status,
    );
  }
}
