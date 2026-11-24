"use client";

import { SerwistProvider } from "@serwist/turbopack/react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, type ReactNode } from "react";

const enabled = process.env.NODE_ENV === "production";

/**
 * Registers the service worker (production only) and saves each page the user
 * opens — including the very first one — so it can be shown again offline.
 */
export function PwaProvider({ children }: { children: ReactNode }) {
  return (
    <SerwistProvider
      swUrl="/serwist/sw.js"
      disable={!enabled}
      // We save pages ourselves (below) so the service worker can tell them apart from API calls.
      cacheOnNavigation={false}
      // Never reload on reconnect: staff may be halfway through typing an order.
      // The offline banner refreshes the data instead.
      reloadOnOnline={false}
    >
      {children}
      {enabled && (
        <Suspense>
          <SaveCurrentPage />
        </Suspense>
      )}
    </SerwistProvider>
  );
}

function SaveCurrentPage() {
  const pathname = usePathname();
  const search = useSearchParams().toString();

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !navigator.onLine) return;
    const url = search ? `${pathname}?${search}` : pathname;
    let cancelled = false;
    void navigator.serviceWorker.ready.then((registration) => {
      if (cancelled) return;
      registration.active?.postMessage({
        type: "CACHE_URLS",
        payload: { urlsToCache: [[url, { headers: { "X-Save-Page": "1" } }]] },
      });
    });
    return () => {
      cancelled = true;
    };
  }, [pathname, search]);

  return null;
}
