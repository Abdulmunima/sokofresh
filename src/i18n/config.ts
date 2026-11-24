// English only (product decision, Nov 2026). All wording still lives in messages/en.json,
// so another language can be added later by adding a file and a picker.
export const locales = ["en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
