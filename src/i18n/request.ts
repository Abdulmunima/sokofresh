import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isLocale, LOCALE_COOKIE } from "./config";

// No locale in the URL: the language comes from a cookie set by the toggle,
// so links like /s/mama-mboga-wholesale stay short and shareable.
export default getRequestConfig(async () => {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isLocale(fromCookie) ? fromCookie : defaultLocale;
  return {
    locale,
    timeZone: "Africa/Nairobi",
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
