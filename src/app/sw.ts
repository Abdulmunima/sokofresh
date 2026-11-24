/// <reference lib="webworker" />
// Service worker, bundled by @serwist/turbopack and served at /serwist/sw.js.
//
// What works offline:
//   - The app shell (JS/CSS) — precached at install.
//   - Any page the user has opened while online (Orders, Stock, …) — the last copy is kept
//     for 7 days and shown when the network fails. The page shows an "offline" banner.
//   - Pages never opened before show /offline.
// Writes (new orders, stock changes) still need a connection; queued sync comes with M2/M3.
import { defaultCache, PAGES_CACHE_NAME } from "@serwist/turbopack/worker";
import {
  ExpirationPlugin,
  NetworkFirst,
  Serwist,
  type PrecacheEntry,
  type SerwistGlobalConfig,
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const SEVEN_DAYS = 7 * 24 * 60 * 60;

// Signed-in pages and the public order page: always try the network first,
// fall back to the last saved copy. Kept longer than the default 24h so a
// shop that is offline for a weekend still opens.
const appPages = new NetworkFirst({
  cacheName: PAGES_CACHE_NAME.html,
  // Next.js pages "Vary" on router headers; a saved page should match any later visit to that URL.
  matchOptions: { ignoreVary: true },
  plugins: [new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: SEVEN_DAYS })],
});

/** Header PwaProvider adds when it asks us to save the page the user is looking at. */
export const SAVE_PAGE_HEADER = "X-Save-Page";

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      // Real page loads, and the "save this page" requests from PwaProvider (which cannot be
      // navigations). Both share one cache, keyed by URL.
      matcher: ({ request, sameOrigin, url }) =>
        sameOrigin &&
        request.method === "GET" &&
        !url.pathname.startsWith("/api/") &&
        !url.pathname.startsWith("/_next/") &&
        request.headers.get("RSC") !== "1" &&
        (request.mode === "navigate" || request.headers.get(SAVE_PAGE_HEADER) === "1"),
      handler: appPages,
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

serwist.addEventListeners();
