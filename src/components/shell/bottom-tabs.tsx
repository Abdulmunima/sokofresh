"use client";

import { ClipboardList, Ellipsis, Package, Wallet, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOffline } from "next/offline";
import { useTranslations } from "next-intl";
import { cx } from "@/lib/cx";

export const TABS = [
  { href: "/orders", key: "orders", icon: ClipboardList },
  { href: "/stock", key: "stock", icon: Package },
  { href: "/payments", key: "payments", icon: Wallet },
  { href: "/more", key: "more", icon: Ellipsis },
] as const satisfies ReadonlyArray<{ href: string; key: string; icon: LucideIcon }>;

/** Four tabs, always visible, icon + word. */
export function BottomTabs() {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const offline = useOffline();

  return (
    <nav
      aria-label={t("label")}
      className="border-border bg-background fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {TABS.map(({ href, key, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={(e) => {
                  // Offline, a full page load lets the service worker show the saved copy.
                  if (offline || !navigator.onLine) {
                    e.preventDefault();
                    window.location.assign(href);
                  }
                }}
                className={cx(
                  "flex min-h-16 flex-col items-center justify-center gap-0.5 text-sm font-medium",
                  active ? "text-brand" : "text-muted",
                )}
              >
                <span
                  className={cx(
                    "flex h-8 w-14 items-center justify-center rounded-full",
                    active && "bg-brand/12",
                  )}
                >
                  <Icon aria-hidden className="size-6" strokeWidth={active ? 2.5 : 2} />
                </span>
                {t(key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
