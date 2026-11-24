import { getRequestConfig } from "next-intl/server";
import { defaultLocale } from "./config";

export default getRequestConfig(async () => ({
  locale: defaultLocale,
  timeZone: "Africa/Nairobi",
  messages: (await import(`../../messages/${defaultLocale}.json`)).default,
}));
