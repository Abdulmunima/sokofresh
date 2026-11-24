import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSerwist } from "@serwist/turbopack";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Cache Components is off: almost every screen is per-user, per-supplier data.
  // Revisit for the public order page (/s/[slug]) in task 4.2.
  experimental: {
    // Failed navigations and Server Actions wait and retry when the connection returns,
    // and `useOffline()` tells the UI. See src/components/shell/offline-banner.tsx.
    useOffline: true,
  },
  async headers() {
    return [
      {
        source: "/serwist/:path*",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withSerwist(withNextIntl(nextConfig));
