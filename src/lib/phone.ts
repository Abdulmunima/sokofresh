/**
 * Normalise a Kenyan mobile number to E.164 (+2547XXXXXXXX / +2541XXXXXXXX).
 * Accepts 07…, 01…, 7…, 1…, 2547…, +2547…, with spaces, dashes or brackets.
 * Returns null if it is not a valid Kenyan mobile number.
 */
export function normalisePhoneKE(input: string | null | undefined): string | null {
  if (!input) return null;
  let digits = input.replace(/[\s\-().]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("00")) digits = digits.slice(2);
  if (!/^\d+$/.test(digits)) return null;

  let national: string;
  if (digits.startsWith("254")) national = digits.slice(3);
  else if (digits.startsWith("0")) national = digits.slice(1);
  else national = digits;

  if (national.startsWith("0")) national = national.slice(1); // +254 0712… typed by mistake
  return /^[17]\d{8}$/.test(national) ? `+254${national}` : null;
}

/** Show an E.164 Kenyan number the way people write it: "0712 345 678". */
export function formatPhoneKE(e164: string | null | undefined): string {
  if (!e164) return "";
  const m = /^\+254([17]\d{2})(\d{3})(\d{3})$/.exec(e164);
  return m ? `0${m[1]} ${m[2]} ${m[3]}` : e164;
}
