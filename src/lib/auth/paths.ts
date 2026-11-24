/** Pages anyone can open without logging in: these paths and everything below them. */
const PUBLIC = [
  "/login",
  "/offline",
  "/s", // customer order links
  "/api",
  "/serwist",
  "/icons",
  "/manifest.webmanifest",
  "/icon.png",
  "/apple-icon.png",
  "/favicon.ico",
];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Only allow redirects back into this app after login ("/orders?x=1"), never to another
 * site ("//evil.com", "https://…") or back to the login page itself.
 */
export function safeNext(next: string | null | undefined, fallback = "/orders"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  if (next === "/login" || next.startsWith("/login?") || next.startsWith("/api/")) return fallback;
  return next;
}

export function loginPathFor(next: string): string {
  const target = safeNext(next, "");
  return target && target !== "/" && target !== "/orders"
    ? `/login?next=${encodeURIComponent(target)}`
    : "/login";
}
