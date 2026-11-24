import { createSerwistRoute } from "@serwist/turbopack";
import { randomUUID } from "node:crypto";

// A new revision on every build, so phones pick up the latest offline page.
const revision = randomUUID();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute(
  {
    swSrc: "src/app/sw.ts",
    useNativeEsbuild: true,
    additionalPrecacheEntries: [{ url: "/offline", revision }],
  },
);
