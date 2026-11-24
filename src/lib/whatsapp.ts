import { normalisePhoneKE } from "./phone";

/**
 * A WhatsApp share link that opens the user's own WhatsApp with a pre-filled message.
 * No API, no Meta approval, no cost (PRD F9 step 1).
 *
 * - With a phone number: opens a chat with that person (Kenyan numbers in any format,
 *   or any E.164 number).
 * - Without one: WhatsApp asks who to send it to (good for "share my order link").
 */
export function waLink(phone: string | null | undefined, text: string): string {
  const message = encodeURIComponent(text.normalize("NFC"));
  const e164 = normalisePhoneKE(phone) ?? (phone && /^\+[1-9]\d{7,14}$/.test(phone) ? phone : null);
  const digits = e164?.slice(1);
  return digits ? `https://wa.me/${digits}?text=${message}` : `https://wa.me/?text=${message}`;
}
