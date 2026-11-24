import { Webhook } from "standardwebhooks";
import { describe, expect, it, vi } from "vitest";
import { authCodeMessage } from "@/lib/whatsapp-cloud";
import { handleSendCodeHook } from "./send-code-hook";

const secretB64 = Buffer.from("test-secret-of-sufficient-length-123").toString("base64");
const SECRET = `v1,whsec_${secretB64}`;
const whatsApp = {
  accessToken: "t",
  phoneNumberId: "123",
  template: "sokofresh_login_code",
  apiVersion: "v23.0",
};

function signedRequest(payload: object, secret = secretB64) {
  const body = JSON.stringify(payload);
  const id = "msg_1";
  const timestamp = new Date();
  const signature = new Webhook(secret).sign(id, timestamp, body);
  return new Request("http://localhost/api/auth/send-code", {
    method: "POST",
    body,
    headers: {
      "webhook-id": id,
      "webhook-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
      "webhook-signature": signature,
      "content-type": "application/json",
    },
  });
}

const event = () => ({
  user: { phone: "254712345678" },
  sms: { otp: "123456" },
});

describe("send-code hook", () => {
  it("sends the code on WhatsApp", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const res = await handleSendCodeHook(signedRequest(event()), {
      secret: SECRET,
      whatsApp,
      production: true,
      send,
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({});
    expect(send).toHaveBeenCalledWith(whatsApp, "+254712345678", "123456");
  });

  it("rejects requests that are not signed by Supabase", async () => {
    const send = vi.fn();
    const other = Buffer.from("a-different-secret-of-enough-length").toString("base64");
    const res = await handleSendCodeHook(signedRequest(event(), other), {
      secret: SECRET,
      whatsApp,
      production: true,
      send,
    });
    expect(res.status).toBe(401);
    expect(send).not.toHaveBeenCalled();
  });

  it("logs the code in development when WhatsApp is not set up", async () => {
    const log = vi.fn();
    const res = await handleSendCodeHook(signedRequest(event()), {
      secret: SECRET,
      whatsApp: null,
      production: false,
      log,
    });
    expect(res.status).toBe(200);
    expect(log).toHaveBeenCalledWith(expect.stringContaining("+254712345678: 123456"));
  });

  it("fails loudly in production when WhatsApp is not set up", async () => {
    const res = await handleSendCodeHook(signedRequest(event()), {
      secret: SECRET,
      whatsApp: null,
      production: true,
    });
    expect(res.status).toBe(500);
    expect((await res.json()).error.message).toMatch(/WhatsApp is not configured/);
  });

  it("reports a WhatsApp failure to Supabase so the user sees an error", async () => {
    const send = vi.fn().mockRejectedValue(new Error("template not approved"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await handleSendCodeHook(signedRequest(event()), {
      secret: SECRET,
      whatsApp,
      production: true,
      send,
    });
    expect(res.status).toBe(502);
  });
});

describe("authCodeMessage", () => {
  it("builds an authentication template with the code in body and copy button", () => {
    expect(authCodeMessage("+254712345678", "654321", "sokofresh_login_code")).toEqual({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: "254712345678",
      type: "template",
      template: {
        name: "sokofresh_login_code",
        language: { code: "en" },
        components: [
          { type: "body", parameters: [{ type: "text", text: "654321" }] },
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [{ type: "text", text: "654321" }],
          },
        ],
      },
    });
  });
});
